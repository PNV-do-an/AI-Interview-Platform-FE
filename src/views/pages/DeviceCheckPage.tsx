import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import OrderService from '../../services/order.service';
import { Card, PageHeader, buttonClass } from '../components/ui';

// Candidate device + connection check (SRS SCR-14 / FR-INT-01).
// Rebuilt 2026-10-21 to run REAL browser APIs instead of the mockup's fabricated telemetry:
//   camera  -> getUserMedia({video}) live into a <video> element
//   mic     -> getUserMedia({audio}) -> AnalyserNode live level meter
//   speaker -> AudioContext test tone + explicit user confirmation
//   network -> measured round-trip to GET /api/v1/packages (public endpoint)
//   browser -> feature detection (mediaDevices, secure context, WebRTC, Web Audio)
// Nothing here invents a device label, resolution, or pass/fail the browser didn't report.

type CheckState = 'idle' | 'checking' | 'ok' | 'denied' | 'unsupported' | 'error';

interface LabeledDevice {
  deviceId: string;
  label: string;
}

const STATE_META: Record<CheckState, { chip: string; dot: string }> = {
  idle: { chip: 'bg-surface-high text-ink-variant', dot: 'bg-outline' },
  checking: { chip: 'bg-surface-high text-ink-variant', dot: 'bg-secondary animate-pulse' },
  ok: { chip: 'bg-success-bg text-success-text', dot: 'bg-success' },
  denied: { chip: 'bg-danger-bg text-danger-text', dot: 'bg-danger' },
  unsupported: { chip: 'bg-danger-bg text-danger-text', dot: 'bg-danger' },
  error: { chip: 'bg-danger-bg text-danger-text', dot: 'bg-danger' },
};

const STATE_LABEL: Record<CheckState, string> = {
  idle: 'Chưa kiểm tra',
  checking: 'Đang kiểm tra...',
  ok: 'Hoạt động',
  denied: 'Bị chặn quyền',
  unsupported: 'Không hỗ trợ',
  error: 'Không tìm thấy thiết bị',
};

const STATE_ICON: Record<CheckState, string> = {
  idle: 'help',
  checking: 'progress_activity',
  ok: 'check_circle',
  denied: 'block',
  unsupported: 'report',
  error: 'video_camera_back',
};

const StatePill: React.FC<{ state: CheckState }> = ({ state }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${STATE_META[state].chip}`}>
    <span className={`h-2 w-2 rounded-full ${STATE_META[state].dot}`} />
    <span className="material-symbols-outlined text-[15px]">{STATE_ICON[state]}</span>
    {STATE_LABEL[state]}
  </span>
);

const selectClass =
  'h-9 w-full cursor-pointer appearance-none rounded-md border border-[#e2e8f0] bg-surface-low pl-3 pr-8 text-body-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary';

// Map a getUserMedia / enumerateDevices failure to an honest check state.
const errorToState = (err: unknown): CheckState => {
  const name = (err as { name?: string })?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'error';
  return 'error';
};

const DeviceCheckPage: React.FC = () => {
  // Browser capability detection (section 5) — measured on mount.
  const [capability, setCapability] = useState({ media: false, secure: false, webrtc: false, audio: false });

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<CheckState>('idle');
  const [camDevices, setCamDevices] = useState<LabeledDevice[]>([]);
  const [camId, setCamId] = useState('');

  // Microphone
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [micState, setMicState] = useState<CheckState>('idle');
  const [micDevices, setMicDevices] = useState<LabeledDevice[]>([]);
  const [micId, setMicId] = useState('');
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 18 }, () => 4));

  // Speaker
  const [speakerDevices, setSpeakerDevices] = useState<LabeledDevice[]>([]);
  const [speakerId, setSpeakerId] = useState('');
  const [spokeHeard, setSpokeHeard] = useState(false);
  const speakerCtxRef = useRef<AudioContext | null>(null);

  // Network
  const [connState, setConnState] = useState<CheckState>('idle');
  const [latency, setLatency] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setCamDevices(all.filter((d) => d.kind === 'videoinput').map((d) => ({ deviceId: d.deviceId, label: d.label || 'Camera' })));
      setMicDevices(all.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label || 'Mic' })));
      setSpeakerDevices(all.filter((d) => d.kind === 'audiooutput').map((d) => ({ deviceId: d.deviceId, label: d.label || 'Loa' })));
    } catch {
      /* enumeration is best-effort; labels only appear after permission */
    }
  }, []);

  // On mount: feature detection, device list (unlabeled until permission), one network probe.
  useEffect(() => {
    setCapability({
      media: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      secure: !!window.isSecureContext,
      webrtc: typeof window.RTCPeerConnection !== 'undefined',
      audio: typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
    });
    refreshDevices();

    const t0 = performance.now();
    let cancelled = false;
    OrderService.getPackages()
      .then(() => {
        if (cancelled) return;
        setLatency(Math.round(performance.now() - t0));
        setConnState('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setLatency(null);
        setConnState(navigator.onLine ? 'error' : 'unsupported');
      });

    return () => {
      cancelled = true;
    };
  }, [refreshDevices]);

  // Cleanup all live streams / audio contexts on unmount.
  useEffect(
    () => () => {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      speakerCtxRef.current?.close().catch(() => {});
    },
    [],
  );

  const stopMicLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startCamera = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState('unsupported');
      return;
    }
    setCamState('checking');
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      camStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState('ok');
      await refreshDevices(); // labels now available
    } catch (err) {
      setCamState(errorToState(err));
    }
  }, [refreshDevices]);

  const startMic = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState('unsupported');
      return;
    }
    setMicState('checking');
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    stopMicLoop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      micStreamRef.current = stream;
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = audioCtxRef.current && audioCtxRef.current.state !== 'closed'
        ? audioCtxRef.current
        : new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        // downsample frequency bins into 18 bars, scaled to px height
        const next: number[] = [];
        const binsPer = Math.max(1, Math.floor(data.length / 18));
        for (let i = 0; i < 18; i += 1) {
          let sum = 0;
          for (let j = 0; j < binsPer; j += 1) sum += data[i * binsPer + j] || 0;
          const avg = sum / binsPer;
          next.push(4 + Math.round((avg / 255) * 36));
        }
        setBars(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setMicState('ok');
      await refreshDevices();
    } catch (err) {
      setMicState(errorToState(err));
    }
  }, [refreshDevices]);

  const playTone = useCallback(async () => {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    let ctx = speakerCtxRef.current;
    if (!ctx || ctx.state === 'closed') {
      ctx = new Ctor();
      speakerCtxRef.current = ctx;
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    // Two short notes so the candidate can clearly hear output is working.
    const notes = [660, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startAt = ctx!.currentTime + idx * 0.28;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.24);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.26);
    });
  }, []);

  const retestNetwork = useCallback(() => {
    setConnState('checking');
    const t0 = performance.now();
    OrderService.getPackages()
      .then(() => {
        setLatency(Math.round(performance.now() - t0));
        setConnState('ok');
      })
      .catch(() => {
        setLatency(null);
        setConnState(navigator.onLine ? 'error' : 'unsupported');
      });
  }, []);

  const connMeta: CheckState = connState;
  const cameraOk = camState === 'ok';
  const micOk = micState === 'ok';
  const speakerOk = spokeHeard;
  const networkOk = connState === 'ok';
  const browserOk = capability.media && capability.secure && capability.audio;
  const passedCount = [cameraOk, micOk, speakerOk, networkOk, browserOk].filter(Boolean).length;
  const allReady = passedCount === 5;

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <PageHeader
        title="Kiểm tra thiết bị & kết nối"
        description="Kiểm tra camera, mic, loa và kết nối trước khi vào buổi phỏng vấn AI trực tiếp. Mọi số liệu bên dưới đều do trình duyệt của bạn đo trực tiếp."
      />

      {/* Readiness summary */}
      <Card className={`flex items-center justify-between gap-3 ${allReady ? '' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[22px]">{allReady ? 'task_alt' : 'build'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-semibold text-ink">
              {allReady ? 'Sẵn sàng cho phiên trực tiếp' : 'Hoàn tất các bước kiểm tra bên dưới'}
            </span>
            <span className="text-body-sm text-ink-variant">{passedCount}/5 bước đạt</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {[cameraOk, micOk, speakerOk, networkOk, browserOk].map((ok, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-success' : 'bg-outline'}`} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT: camera + microphone */}
        <section className="flex flex-col gap-4 lg:col-span-7">
          {/* 1. Camera */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[20px] text-primary">videocam</span>
                Camera
              </span>
              <StatePill state={camState} />
            </div>

            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-[#1b2334]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full -scale-x-100 object-cover ${cameraOk ? '' : 'hidden'}`}
              />
              {!cameraOk && (
                <div className="flex flex-col items-center gap-2 px-6 text-center text-[#c3c0ff]">
                  <span className="material-symbols-outlined text-[36px]">switch_camera</span>
                  <p className="m-0 text-body-sm">
                    {camState === 'denied'
                      ? 'Quyền truy cập Camera đã bị chặn. Hãy cho phép trên thanh địa chỉ của trình duyệt, rồi kiểm tra lại.'
                      : camState === 'error'
                        ? 'Không tìm thấy camera. Hãy kết nối camera và kiểm tra lại.'
                        : 'Nhấn "Bật Camera" để xem trước hình ảnh của bạn.'}
                  </p>
                </div>
              )}
              {cameraOk && (
                <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-0.5 font-mono text-[12px] font-medium text-on-primary">
                  Xem trực tiếp
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full">
                <select
                  className={selectClass}
                  value={camId}
                  onChange={(e) => {
                    setCamId(e.target.value);
                    void startCamera(e.target.value);
                  }}
                  disabled={!cameraOk && camDevices.length === 0}
                  aria-label="Chọn camera"
                >
                  {camDevices.length === 0 ? (
                    <option value="">Cấp quyền camera để liệt kê thiết bị</option>
                  ) : (
                    camDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                    ))
                  )}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">
                  expand_more
                </span>
              </div>
              <button type="button" className={`${buttonClass(cameraOk ? 'secondary' : 'primary')} shrink-0`} onClick={() => void startCamera(camId || undefined)}>
                <span className="material-symbols-outlined text-[18px]">{cameraOk ? 'refresh' : 'videocam'}</span>
                {cameraOk ? 'Thử lại' : 'Bật Camera'}
              </button>
            </div>
          </Card>

          {/* 2. Microphone */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[20px] text-secondary">mic</span>
                Mic
              </span>
              <StatePill state={micState} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full">
                <select
                  className={selectClass}
                  value={micId}
                  onChange={(e) => {
                    setMicId(e.target.value);
                    void startMic(e.target.value);
                  }}
                  disabled={!micOk && micDevices.length === 0}
                  aria-label="Chọn mic"
                >
                  {micDevices.length === 0 ? (
                    <option value="">Cấp quyền mic để liệt kê thiết bị</option>
                  ) : (
                    micDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                    ))
                  )}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">
                  expand_more
                </span>
              </div>
              <button type="button" className={`${buttonClass(micOk ? 'secondary' : 'primary')} shrink-0`} onClick={() => void startMic(micId || undefined)}>
                <span className="material-symbols-outlined text-[18px]">{micOk ? 'refresh' : 'mic'}</span>
                {micOk ? 'Thử lại' : 'Kiểm tra Mic'}
              </button>
            </div>

            {/* Live level meter (AnalyserNode frequency data) */}
            <div className="flex flex-col gap-2 rounded-lg bg-surface-low p-4">
              <div className="flex items-center justify-between text-label-sm text-ink-variant">
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${micState === 'ok' ? 'bg-secondary' : 'bg-outline'}`} />
                  Hãy nói để xem mức âm lượng đầu vào trực tiếp
                </span>
              </div>
              <div className="flex h-10 items-end justify-between gap-1 rounded-lg bg-card px-2 py-2">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-primary transition-[height] duration-75"
                    style={{ height: `${h}px`, opacity: micState === 'ok' ? 1 : 0.25 }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* RIGHT: speaker, network, browser */}
        <section className="flex flex-col gap-4 lg:col-span-5">
          {/* 3. Speaker */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">volume_up</span>
                Loa
              </span>
              <StatePill state={speakerOk ? 'ok' : capability.audio ? 'idle' : 'unsupported'} />
            </div>
            <div className="relative">
              <select
                className={selectClass}
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                disabled={speakerDevices.length === 0}
                aria-label="Chọn đầu ra loa"
              >
                {speakerDevices.length === 0 ? (
                  <option value="">Đầu ra mặc định của hệ thống</option>
                ) : (
                  <>
                    <option value="">Đầu ra mặc định của hệ thống</option>
                    {speakerDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                    ))}
                  </>
                )}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">
                expand_more
              </span>
            </div>
            <button type="button" className={buttonClass('secondary', 'w-full')} onClick={() => void playTone()} disabled={!capability.audio}>
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Phát âm thanh thử
            </button>
            <button
              type="button"
              className={`${buttonClass(speakerOk ? 'primary' : 'ghost', 'w-full')} ${speakerOk ? '' : 'border border-[#e2e8f0]'}`}
              onClick={() => setSpokeHeard((v) => !v)}
              disabled={!capability.audio}
            >
              <span className="material-symbols-outlined text-[18px]">{speakerOk ? 'check_circle' : 'help'}</span>
              {speakerOk ? 'Có, tôi đã nghe thấy' : 'Tôi đã nghe âm thanh thử'}
            </button>
          </Card>

          {/* 4. Network */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">speed</span>
                Kết nối
              </span>
              <StatePill state={connMeta} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-low px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${online ? 'bg-success' : 'bg-danger'}`} />
                <span className="text-label-md font-medium text-ink">{online ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
              </div>
              <span className="font-mono text-body-sm text-ink-variant">
                {connState === 'ok' && latency !== null ? `${latency} ms` : connState === 'checking' ? 'đang đo...' : '—'}
              </span>
            </div>
            <p className="m-0 text-body-sm text-ink-variant">
              Thời gian phản hồi vòng tới API của nền tảng, đo trực tiếp.
            </p>
            <button type="button" className={`${buttonClass('secondary', 'w-full')} self-start`} onClick={retestNetwork}>
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Thử lại
            </button>
          </Card>

          {/* 5. Browser runtime */}
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-headline-sm text-ink">
                <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
                Trình duyệt
              </span>
              <StatePill state={browserOk ? 'ok' : 'unsupported'} />
            </div>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-body-sm">
              {[
                { label: 'Quyền camera / mic (mediaDevices)', ok: capability.media },
                { label: 'Môi trường bảo mật (HTTPS/localhost)', ok: capability.secure },
                { label: 'Web Audio để đo âm lượng trực tiếp', ok: capability.audio },
                { label: 'WebRTC (cho buổi họp trực tiếp)', ok: capability.webrtc },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-2 text-ink-variant">
                  <span className={`material-symbols-outlined text-[16px] ${row.ok ? 'text-success' : 'text-danger'}`}>
                    {row.ok ? 'check_circle' : 'cancel'}
                  </span>
                  {row.label}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      {/* Launch */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to="/mock-interviews"
          className={`${buttonClass('primary', 'sm:w-auto')} no-underline ${allReady ? '' : 'opacity-80'}`}
        >
          <span>Tới phiên luyện tập</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </Link>
        <Link to="/my-applications" className={`${buttonClass('secondary', 'sm:w-auto')} no-underline`}>
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          Quản lý phỏng vấn đã đặt lịch
        </Link>
      </div>
    </div>
  );
};

export default DeviceCheckPage;
