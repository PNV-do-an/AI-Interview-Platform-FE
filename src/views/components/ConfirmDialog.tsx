import React from 'react';
import { buttonClass } from './ui';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog xác nhận dùng chung.
 * Props API giữ nguyên (open / title / message / confirmLabel / cancelLabel / danger / onConfirm / onCancel).
 */
const ConfirmDialog: React.FC<Props> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-[480px] rounded-lg border border-[#e2e8f0] bg-card p-6 shadow-card"
      >
        <h3 className="m-0 mb-3 text-headline-md text-ink">{title}</h3>
        <p className="m-0 mb-6 text-body-md text-ink-variant">{message}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className={buttonClass('secondary')}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={buttonClass(danger ? 'danger' : 'primary')}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
