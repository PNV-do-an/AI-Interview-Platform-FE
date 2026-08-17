import React from 'react';

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

const ConfirmDialog: React.FC<Props> = ({
  open, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  danger = false, onConfirm, onCancel,
}) => {
  if (!open) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>
        <p style={{ marginBottom: 24, color: '#555' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={styles.cancelBtn}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{ ...styles.confirmBtn, background: danger ? '#ef4444' : '#3b82f6' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  dialog: {
    background: '#fff', borderRadius: 10, padding: '28px 32px',
    minWidth: 340, maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  cancelBtn: {
    padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db',
    background: '#f9fafb', cursor: 'pointer', fontSize: 14,
  },
  confirmBtn: {
    padding: '8px 20px', borderRadius: 6, border: 'none',
    color: '#fff', cursor: 'pointer', fontSize: 14,
  },
};

export default ConfirmDialog;
