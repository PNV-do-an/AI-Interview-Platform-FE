import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import {
  BrowserSpeechRecognition,
  BrowserSpeechRecognitionEvent,
  BrowserSpeechRecognitionResult,
  useSpeechInput,
} from './useSpeechInput';

class MockSpeechRecognition implements BrowserSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  onresult: BrowserSpeechRecognition['onresult'] = null;
  onerror: BrowserSpeechRecognition['onerror'] = null;
  onend: BrowserSpeechRecognition['onend'] = null;
  start = jest.fn();
  stop = jest.fn();
  abort = jest.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  emitResult(transcript: string, isFinal: boolean) {
    const result: BrowserSpeechRecognitionResult = {
      isFinal,
      length: 1,
      0: { transcript },
    };
    const event = Object.assign(new Event('result'), { resultIndex: 0, results: [result] });
    this.onresult?.(event as BrowserSpeechRecognitionEvent);
  }
}

describe('useSpeechInput', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'SpeechRecognition');

  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    });
  });

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window, 'SpeechRecognition', originalDescriptor);
    } else {
      Reflect.deleteProperty(window, 'SpeechRecognition');
    }
  });

  it('uses Vietnamese recognition and appends final speech to the editable answer', () => {
    const { result } = renderHook(() => {
      const [draft, setDraft] = useState('Đã có');
      return { draft, voice: useSpeechInput(setDraft) };
    });

    act(() => result.current.voice.start());

    const recognition = MockSpeechRecognition.instances[0];
    expect(recognition.lang).toBe('vi-VN');
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(result.current.voice.listening).toBe(true);

    act(() => recognition.emitResult('Xin chào', false));
    expect(result.current.voice.interimTranscript).toBe('Xin chào');
    expect(result.current.draft).toBe('Đã có');

    act(() => recognition.emitResult('Xin chào', true));
    expect(result.current.draft).toBe('Đã có Xin chào');
    expect(result.current.voice.interimTranscript).toBe('');
  });

  it('shows a clear microphone permission error and aborts when unmounted', () => {
    const { result, unmount } = renderHook(() => {
      const [, setDraft] = useState('');
      return useSpeechInput(setDraft);
    });

    act(() => result.current.start());
    const recognition = MockSpeechRecognition.instances[0];
    act(() => {
      recognition.onerror?.(Object.assign(new Event('error'), { error: 'not-allowed' }));
    });

    expect(result.current.listening).toBe(false);
    expect(result.current.error).toContain('Chrome chưa được cấp quyền micro');

    act(() => result.current.start());
    const activeRecognition = MockSpeechRecognition.instances[1];
    unmount();
    expect(activeRecognition.abort).toHaveBeenCalledTimes(1);
  });
});
