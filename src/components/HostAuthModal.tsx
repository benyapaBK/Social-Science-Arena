import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from '../firebase';

// Not a secret: the account email only. The host code is the Firebase Auth password and is never stored in the app.
export const HOST_EMAIL = (import.meta.env.VITE_HOST_EMAIL as string | undefined) || 'host@social-science-arena.app';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function HostAuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!isOpen) { setCode(''); setError(''); setLoading(false); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || !code) return;
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, HOST_EMAIL, code);
      onSuccess(credential.user);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(hostErrorMessage(err));
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="host-auth-title" className="card w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-lavender-soft px-5 py-4">
          <h2 id="host-auth-title" className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} className="text-lavender-deep" aria-hidden />เข้าสู่โหมดควบคุม</h2>
          <button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง" className="rounded-lg p-1 text-ink-soft hover:bg-cream-deep"><X size={20} aria-hidden /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <p className="text-sm text-ink-soft">เข้าสู่ระบบเพื่อจัดการชุดเกม เผยแพร่เกม และสร้างห้อง Battle</p>
          {error && <p role="alert" className="card-tint-coral rounded-xl border p-3 text-sm text-coral-deep">{error}</p>}
          <label className="block text-sm font-semibold" htmlFor="host-code">
            รหัสผู้ควบคุม
            <span className="relative mt-2 block">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
              <input id="host-code" autoFocus type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="current-password" className="input !pl-10" placeholder="กรอกรหัส" required />
            </span>
          </label>
          <button type="submit" disabled={loading || !code} className="btn btn-lavender btn-lg w-full">
            {loading ? <><LoaderCircle size={18} className="animate-spin" aria-hidden />กำลังตรวจสอบ…</> : 'ยืนยัน'}
          </button>
        </form>
      </div>
    </div>
  );
}

function hostErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') return 'รหัสไม่ถูกต้อง';
  if (code === 'auth/too-many-requests') return 'ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
  if (code === 'auth/network-request-failed') return 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต';
  if (code === 'auth/operation-not-allowed') return 'ยังไม่ได้เปิดใช้งาน Email/Password ใน Firebase Console';
  return 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง';
}
