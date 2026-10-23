import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, children, confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก', danger, busy, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" style={{ zIndex: 90 }} onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="card w-full max-w-sm p-6">
        <h2 id="confirm-title" className="text-lg font-bold text-ink">{title}</h2>
        {children && <div className="mt-2 text-sm leading-6 text-ink-soft">{children}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="btn btn-secondary">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{busy ? 'กำลังดำเนินการ…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
