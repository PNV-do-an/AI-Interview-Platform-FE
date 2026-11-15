/**
 * Ô cấu hình URL AI service (FastAPI + LiveTalking) ngay trên trình duyệt.
 *
 * AI service chạy ngoài (Colab/cloudflared/ngrok) nên URL đổi mỗi lần khởi động lại.
 * URL được lưu ở `localStorage['ai_service_url']` và ưu tiên hơn `REACT_APP_AI_SERVICE_URL`
 * lúc build — nhờ vậy ứng viên sửa được tunnel mà không cần deploy lại Vercel.
 *
 * Dùng ở 2 chỗ: trang /mock-interviews (trước khi vào phòng) và banner fallback của
 * phòng AVATAR (khi kênh avatar đã rớt về giọng đọc trình duyệt).
 */
import React, { useId, useState } from 'react';
import AIService from '../../services/ai.service';
import { ICON, adminButton } from './adminKit';

interface AiServiceConfigProps {
  /** Gọn hơn khi đặt trong banner lỗi của phòng phỏng vấn. */
  compact?: boolean;
  /** Gọi sau khi URL vừa được kiểm tra và lưu thành công. */
  onConnected?: () => void;
}

const AiServiceConfig: React.FC<AiServiceConfigProps> = ({ compact = false, onConnected }) => {
  const inputId = useId();
  const [url, setUrl] = useState(() => AIService.getServiceUrl());
  const [savedUrl, setSavedUrl] = useState(() => AIService.getServiceUrl());
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkAndSave = async () => {
    setChecking(true);
    setMessage('');
    try {
      const normalizedUrl = AIService.normalizeServiceUrl(url);
      const health = await AIService.healthAtUrl(normalizedUrl);
      if (health.status !== 'ok') throw new Error('AI service chưa sẵn sàng.');
      const saved = AIService.setServiceUrl(normalizedUrl);
      setUrl(saved);
      setSavedUrl(saved);
      const avatarDown = health.avatarSessions < 0;
      setMessage(avatarDown
        ? 'Đã lưu URL; AI service phản hồi nhưng chưa kết nối được máy chủ avatar.'
        : `Đã kết nối và lưu URL · ${health.llmProvider} · tối đa ${health.maxTurns} lượt.`);
      setMessageIsError(avatarDown);
      if (!avatarDown) onConnected?.();
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Không kết nối được AI service.';
      setMessage(detail === 'Network Error'
        ? 'Không kết nối được AI service. Tunnel có thể đã hết hiệu lực — hãy dán URL mới từ Colab/cloudflared.'
        : detail);
      setMessageIsError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <form
      className={compact ? '' : 'rounded-lg border border-outline-variant bg-surface-container-lowest p-space-md'}
      onSubmit={(e) => {
        e.preventDefault();
        if (!checking && url.trim()) void checkAndSave();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <label
            htmlFor={inputId}
            className={`block font-semibold text-on-surface ${compact ? 'text-ds-label-md' : 'text-ds-label-lg'}`}
          >
            URL AI service (LiveTalking)
          </label>
          <p className="mt-0.5 text-ds-body-sm text-on-surface-variant">
            Dán URL HTTPS in ra từ Colab/cloudflared, không thêm <code className="rounded bg-surface-container px-1">/health</code>.
            URL được lưu riêng trên trình duyệt này.
          </p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 text-ds-label-sm ${savedUrl ? 'text-secondary-teal' : 'text-on-surface-variant'}`}>
          <span className={`h-2 w-2 rounded-full ${savedUrl ? 'bg-secondary-teal' : 'bg-outline'}`} />
          {savedUrl ? 'Đã cấu hình' : 'Chưa cấu hình'}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://ten-tunnel.trycloudflare.com"
          className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-ds-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={checking || !url.trim()}
          className={adminButton('primary', 'justify-center disabled:opacity-40')}
        >
          <span className={`${ICON} text-[18px]`}>{checking ? 'hourglass_top' : 'wifi_find'}</span>
          {checking ? 'Đang kiểm tra...' : 'Kiểm tra & lưu'}
        </button>
      </div>

      {message && (
        <p
          role={messageIsError ? 'alert' : 'status'}
          className={`mt-2 text-ds-label-md ${messageIsError ? 'text-error' : 'text-secondary-teal'}`}
        >
          {message}
        </p>
      )}
    </form>
  );
};

export default AiServiceConfig;
