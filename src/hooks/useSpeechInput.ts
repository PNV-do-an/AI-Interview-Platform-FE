import { useCallback, useEffect, useRef, useState } from 'react';

export interface BrowserSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: { readonly transcript: string };
}

export interface BrowserSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<BrowserSpeechRecognitionResult>;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

export const useSpeechInput = (setDraft: React.Dispatch<React.SetStateAction<string>>) => {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const mountedRef = useRef(true);
  const manuallyStoppedRef = useRef(false);
  const interimRef = useRef('');
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const SpeechRecognition = typeof window === 'undefined'
    ? undefined
    : (window as SpeechRecognitionWindow).SpeechRecognition ??
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;

  const commitInterim = useCallback(() => {
    const text = interimRef.current.trim();
    if (text) {
      setDraft(current => {
        const separator = !current || /\s$/.test(current) || /^[,.;:!?]/.test(text) ? '' : ' ';
        return `${current}${separator}${text}`;
      });
    }
    interimRef.current = '';
    setInterimTranscript('');
  }, [setDraft]);

  const stop = useCallback(() => {
    manuallyStoppedRef.current = true;
    setListening(false);
    commitInterim();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [commitInterim]);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Trình duyệt không hỗ trợ nhập giọng nói. Hãy dùng Chrome mới nhất hoặc gõ câu trả lời.');
      return;
    }
    if (recognitionRef.current) return;

    manuallyStoppedRef.current = false;
    setError('');
    setInterimTranscript('');
    interimRef.current = '';
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    (recognition as { maxAlternatives?: number }).maxAlternatives = 1;
    recognition.onresult = event => {
      if (!event?.results) return;
      const startIndex = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
      let finalText = '';
      let interimText = '';
      for (let i = startIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i]?.[0]?.transcript ?? '';
        if (event.results[i]?.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (!mountedRef.current) return;
      if (finalText.trim()) {
        const text = finalText.trim();
        setDraft(current => {
          const separator = !current || /\s$/.test(current) || /^[,.;:!?]/.test(text) ? '' : ' ';
          return `${current}${separator}${text}`;
        });
        interimRef.current = '';
      }
      const interim = interimText.trim();
      if (finalText.trim()) {
        interimRef.current = interim;
      } else {
        interimRef.current = interim || interimRef.current;
      }
      setInterimTranscript(interim);
    };
    recognition.onerror = event => {
      if (!mountedRef.current || event?.error === 'aborted') return;
      if (event?.error === 'no-speech') {
        commitInterim();
        setError('Chưa nghe thấy tiếng nói. Hãy kiểm tra micro và thử nói lại.');
        setListening(false);
        setInterimTranscript('');
        recognitionRef.current = null;
        return;
      }
      const messages: Record<string, string> = {
        'not-allowed': 'Chrome chưa được cấp quyền micro. Hãy cho phép Micro trong quyền trang web rồi thử lại.',
        'service-not-allowed': 'Chrome đang chặn dịch vụ nhận dạng giọng nói. Hãy kiểm tra quyền micro của trang.',
        'audio-capture': 'Không tìm thấy micro. Kiểm tra thiết bị đầu vào âm thanh của Windows.',
        network: 'Dịch vụ nhận dạng giọng nói của Chrome cần kết nối mạng. Kiểm tra mạng rồi thử lại.',
        'no-speech': 'Chưa nghe thấy tiếng nói. Hãy kiểm tra micro và thử nói lại.',
      };
      commitInterim();
      setError(messages[event?.error ?? ''] ?? 'Không nhận dạng được giọng nói. Bạn có thể thử lại hoặc gõ câu trả lời.');
      setListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      if (!mountedRef.current) return;
      commitInterim();
      setListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
      if (!manuallyStoppedRef.current) {
        window.setTimeout(() => {
          if (mountedRef.current && !manuallyStoppedRef.current && !recognitionRef.current) {
            start();
          }
        }, 250);
      }
    };

    try {
      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError('Không thể bắt đầu nhận dạng giọng nói. Hãy bấm thử lại hoặc gõ câu trả lời.');
    }
  }, [SpeechRecognition, setDraft, commitInterim]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      manuallyStoppedRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    supported: Boolean(SpeechRecognition),
    listening,
    interimTranscript,
    error,
    start,
    stop,
  };
};