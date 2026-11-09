/**
 * Nối phòng AVATAR với avatar LiveTalking qua AI service (FastAPI).
 *
 * Đường MediaRTC lấy theo client tham chiếu `vendored/LiveTalking/web/client.js`: trình duyệt
 * mở hai transceiver `recvonly` (video + audio), tạo offer, chờ ICE gathering xong rồi đưa offer
 * sang AI service; AI service chuyển tiếp cho LiveTalking và trả về answer SDP + `avatarSessionId`
 * của chính LiveTalking. `avatarSessionId` đó là thứ AI service cần khi mở phiên hội thoại
 * (`POST /api/v1/ai/session`) để đẩy câu hỏi cho TTS máy miệng của nó.
 *
 * Vì avatar chạy ở ngoài (Colab/GPU) và có thể chết giữa chừng, mọi bước đều có timeout và
 * báo về `unavailable` kèm lý do — UI giữ quyền fallback sang luồng browser TTS cũ.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import HLS from 'hls.js';
import AIService, { AiAnswer, AiQuestion } from '../services/ai.service';

export type AvatarLink = 'off' | 'connecting' | 'live' | 'unavailable';

const STUN = [{ urls: ['stun:stun.l.google.com:19302'] }];
const HEALTH_TIMEOUT_MS = 6000;
const ICE_GATHER_TIMEOUT_MS = 4000;
const PEER_CONNECT_TIMEOUT_MS = 20000;
const SPEAK_POLL_MS = 1500;

const withTimeout = <T,>(p: Promise<T>, ms: number, message: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), ms);
    p.then(v => { clearTimeout(id); resolve(v); }, e => { clearTimeout(id); reject(e); });
  });

const describeError = (e: any): string => {
  if (e?.response?.status) {
    const body = e.response.data;
    const detail = typeof body === 'string' ? body : body?.detail ?? body?.message ?? '';
    return `AI service trả ${e.response.status}${detail ? `: ${detail}` : ''}`;
  }
  return e?.message || 'Không kết nối được avatar';
};

export const useLiveTalkingController = () => {
  const [link, setLink] = useState<AvatarLink>('off');
  const [reason, setReason] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [aiSessionId, setAiSessionId] = useState('');

  /**
   * Nguồn video avatar: `webrtc` = browser bắt tay /offer với LiveTalking (host phải có IP public);
   * `hls` = LiveTalking đẩy rtcpush vào media server, browser chỉ kéo HTTPS (đường dùng được trên
   * Colab/host không mở được UDP). AI service báo đường nào qua `health.mediaUrl`.
   */
  const [mediaSource, setMediaSource] = useState<'webrtc' | 'hls' | null>(null);
  /** HLS bị Chrome chặn tự phát có tiếng cho tới khi người dùng tương tác — UI phải cho nút bật tiếng. */
  const [needsPlayGesture, setNeedsPlayGesture] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundError, setSoundError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const hlsRef = useRef<any>(null);
  const sessionIdRef = useRef('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) { clearInterval(pollRef.current); pollRef.current = null; }
    setSpeaking(false);
  }, []);

  const teardown = useCallback(() => {
    stopPolling();
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    pcRef.current?.close();
    pcRef.current = null;
    setMediaSource(null);
    setNeedsPlayGesture(false);
    setSoundEnabled(false);
    setSoundError('');
    const sid = sessionIdRef.current;
    if (sid) { sessionIdRef.current = ''; setAiSessionId(''); void AIService.deleteSession(sid).catch(() => undefined); }
  }, [stopPolling]);

  useEffect(() => teardown, [teardown]);

  /** Mở phiên hội thoại với AI service rồi bật polling trạng thái "avatar đang nói". */
  const startLive = useCallback(async (jobTitle: string, jdText: string, avatarSessionId: string) => {
    const session = await AIService.createSession({ jobTitle, jdText, avatarSessionId });
    sessionIdRef.current = session.sessionid;
    setAiSessionId(session.sessionid);
    setLink('live');
    stopPolling();
    pollRef.current = setInterval(async () => {
      try { setSpeaking(await AIService.isSpeaking(sessionIdRef.current)); }
      catch { stopPolling(); }
    }, SPEAK_POLL_MS);
  }, [stopPolling]);

  /** Avatar chết giữa phiên: thu dọn kênh media rồi báo fallback để UI còn chạy được tiếp. */
  const failMedia = useCallback((msg: string) => {
    teardown();
    setLink('unavailable');
    setReason(msg);
  }, [teardown]);

  /** Kéo HLS qua HTTPS: không cần UDP nên chạy được cả khi avatar ở Colab hay sau NAT. */
  const attachHls = useCallback((mediaUrl: string) => {
    const el = videoRef.current;
    if (!el) throw new Error('Chưa có khung video để phát avatar');
    
    // Clear any previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy(true);
      hlsRef.current = null;
    }
    
    if (!HLS.isSupported()) {
      el.src = mediaUrl;
      el.muted = false;
      el.volume = 1;
      el.onerror = () => failMedia('Luồng video avatar bị đứt');
    } else {
      const hls = new HLS({ 
        lowLatencyMode: true,
        enableWorker: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      
      // Handle audio tracks specifically
      hls.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
        console.log('HLS manifest parsed:', data);
        // Ensure all audio playlists are loaded
        if (data.levels && data.levels.length > 0) {
          data.levels.forEach(level => {
            console.log('Audio level:', level);
          });
        }
      });
      
      // More detailed error handling
      hls.on(HLS.Events.ERROR, (_evt, data) => {
        console.error('HLS error:', data.type, data.details, data.error);
        if (data.fatal) {
          switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
              failMedia(`Mạng HLS bị lỗi (${data.details}) - kiểm tra kết nối Internet`);
              break;
            case HLS.ErrorTypes.MEDIA_ERROR:
              // Try to recover by reattaching media
              if (hlsRef.current && !hlsRef.current.media) {
                console.warn('Trying to recover from media error...');
                hlsRef.current.attachMedia(el);
              } else {
                failMedia(`HLS không phát được video (${data.details})`);
              }
              break;
            default:
              failMedia(`HLS bị lỗi nghiêm trọng (${data.details})`);
              break;
          }
        }
      });
      
      hls.loadSource(mediaUrl);
      hls.attachMedia(el);
    }
    
    el.muted = false;
    el.volume = 0.8; // Set volume but respect mute state
    setSoundEnabled(false); // Will be updated on play gesture
    setSoundError('');
    
    // Auto-play without sound first, then user can enable
    void el.play().then(() => {
      // Successfully playing now, ready to unmute on gesture
      setNeedsPlayGesture(false);
    }).catch((err) => {
      console.warn('Autoplay failed:', err);
      // If autoplay fails, ensure we still have the gesture button
      if (!el.muted) {
        el.muted = true;
        setNeedsPlayGesture(true);
      }
    });
  }, [failMedia]);

  /** Bắt buộc phải xong trước khi mở phiên: báo rõ avatar sống hay chết để UI còn fallback. */
  const connect = useCallback(async (jobTitle: string, jdText: string) => {
    if (pcRef.current || hlsRef.current) return;
    if (!AIService.isConfigured()) {
      setLink('unavailable');
      setReason('Chưa cấu hình URL AI service trên trang Luyện phỏng vấn; phòng chuyển sang giọng đọc trình duyệt.');
      return;
    }
    setLink('connecting');
    setReason('');
    try {
      const health = await withTimeout(AIService.health(), HEALTH_TIMEOUT_MS, 'AI service không phản hồi');
      if (health.avatarSessions < 0) throw new Error('Máy chủ avatar không phản hồi');

      const mediaUrl = (health.mediaUrl || '').trim();
      if (mediaUrl) {
        // Host chỉ publish được HTTPS: LiveTalking đẩy rtcpush vào media server và tự mở
        // session "0" ngay lúc khởi động (vendored/LiveTalking/server/rtc_manager.py:145),
        // nên browser không cần bắt tay /offer, chỉ kéo HLS.
        setMediaSource('hls');
        attachHls(mediaUrl);
        await startLive(jobTitle, jdText, '0');
        return;
      }

      const pc = new RTCPeerConnection({ iceServers: STUN });
      pcRef.current = pc;
      setMediaSource('webrtc');
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.ontrack = (evt) => {
        const stream = evt.streams[0];
        if (stream && videoRef.current) videoRef.current.srcObject = stream;
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await withTimeout(
        pc.iceGatheringState === 'complete'
          ? Promise.resolve()
          : new Promise<void>(res => {
              pc.addEventListener('icegatheringstatechange', () => {
                if (pc.iceGatheringState === 'complete') res();
              });
            }),
        ICE_GATHER_TIMEOUT_MS, 'Trình duyệt không thu thập được ICE candidate',
      );

      const answer = await AIService.offerAvatar(pc.localDescription?.sdp ?? '');
      await pc.setRemoteDescription({ type: answer.answerType as RTCSdpType, sdp: answer.answerSdp });
      await withTimeout(
        pc.connectionState === 'connected'
          ? Promise.resolve()
          : new Promise<void>(res => {
              pc.addEventListener('connectionstatechange', () => {
                if (pc.connectionState === 'connected') res();
              });
            }),
        PEER_CONNECT_TIMEOUT_MS, 'Không thiết lập được kênh video với avatar',
      );

      await startLive(jobTitle, jdText, answer.avatarSessionId);
    } catch (e) {
      teardown();
      setLink('unavailable');
      setReason(describeError(e));
    }
  }, [attachHls, startLive, teardown]);

  /** `speak=true` bảo TTS của LiveTalking đọc luôn câu hỏi (avatar máy miệng). */
  const takeQuestion = useCallback(async (speak = true): Promise<AiQuestion | null> => {
    if (!sessionIdRef.current) return null;
    return AIService.getQuestion(sessionIdRef.current, speak);
  }, []);

  const sendAnswer = useCallback(async (input: {
    answerText: string; questionIndex?: number; durationSec?: number; confirm?: boolean;
  }): Promise<AiAnswer | null> => {
    if (!sessionIdRef.current) return null;
    return AIService.submitAnswer(sessionIdRef.current, input);
  }, []);

  /** Avatar đang đọc dở mà ứng viên muốn cắt lời. */
  const interruptSpeaking = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try { await AIService.interrupt(sessionIdRef.current); setSpeaking(false); } catch { /* phụ đề vẫn còn */ }
  }, []);

  const repeat = useCallback(async (text: string) => {
    if (!sessionIdRef.current || !text) return;
    try { await AIService.speak(sessionIdRef.current, text); } catch { /* bỏ qua, đã có phụ đề */ }
  }, []);

  /** Hết gói câu hỏi: AI tự chấm rubric trước khi FE đóng phiên. */
  const evaluate = useCallback(async () => {
    if (!sessionIdRef.current) return null;
    return AIService.evaluate(sessionIdRef.current);
  }, []);

  const toggleSound = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    
    // If currently muted (sound disabled), try to unmute
    if (el.muted || !soundEnabled) {
      el.muted = false;
      el.volume = soundEnabled ? 0.8 : 1;
      setSoundError('');
      
      try {
        // Try to play if paused to trigger audio context
        if (el.paused) {
          await el.play();
        }
        setSoundEnabled(true);
        setNeedsPlayGesture(false);
      } catch (error) {
        // Chrome blocks audio - revert to muted
        el.muted = true;
        setSoundEnabled(false);
        setNeedsPlayGesture(true);
        setSoundError(error instanceof Error && error.name === 'NotAllowedError'
          ? 'Chrome chặn phát âm thanh. Hãy kiểm tra cài đặt trình duyệt.'
          : 'Không phát được âm thanh avatar.');
        console.error('Toggle sound failed:', error);
      }
    } else {
      // Currently enabled, so mute it
      el.muted = true;
      setSoundEnabled(false);
      setSoundError('');
    }
  }, [soundEnabled]);

  return {
    link, reason, speaking, aiSessionId, mediaSource, needsPlayGesture, soundEnabled, soundError, videoRef,
    connect, takeQuestion, sendAnswer, repeat, interruptSpeaking, teardown,
    toggleSound, evaluate,
  };
};
