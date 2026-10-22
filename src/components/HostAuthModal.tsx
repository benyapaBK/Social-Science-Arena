import React, { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

interface HostAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    isHost: boolean;
  }) => void;
}

export const HostAuthModal: React.FC<HostAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hostCode, setHostCode] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setHostCode('');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleHostSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (hostCode !== 'host123') {
      setErrorMessage('รหัส Host ไม่ถูกต้อง');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const credential = await signInAnonymously(auth);
      onSuccess({
        uid: credential.user.uid,
        email: '',
        displayName: 'Host',
        photoURL: null,
        isHost: true
      });
      onClose();
    } catch (error) {
      console.error('Host sign-in failed:', error);
      setLoading(false);
      setErrorMessage(getHostSignInErrorMessage(error));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-card rounded-2xl border border-[#D6B36A]/40 shadow-[0_0_40px_rgba(214,179,106,0.25)] overflow-hidden">
        <div className="px-6 py-4 bg-[#103B32]/80 border-b border-[#D6B36A]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D6B36A]" />
            <h3 className="font-display font-bold text-lg text-[#F5F0E6]">เข้าสู่ระบบ Host</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#F5F0E6]/60 hover:text-[#F5F0E6] hover:bg-white/10 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 rounded-xl bg-[#D6B36A]/10 border border-[#D6B36A]/30 text-sm leading-relaxed text-[#F5F0E6]/80 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#D6B36A]" />
            <p>กรอกรหัส Host เพื่อเข้าสู่ระบบและสร้างห้องเกมได้ทันที</p>
          </div>

          {errorMessage && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleHostSignIn} className="space-y-3">
            <label className="block text-sm font-medium text-[#F5F0E6]/80">
              รหัส Host
              <span className="relative mt-2 block">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F5F0E6]/40" />
                <input
                  autoFocus
                  type="password"
                  value={hostCode}
                  onChange={event => setHostCode(event.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#D6B36A]/30 bg-[#0B1715]/80 py-3 pl-10 pr-3 text-sm text-[#F5F0E6] outline-none focus:border-[#D6B36A]"
                  placeholder="กรอกรหัส Host"
                  required
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#D6B36A] to-amber-500 py-3 text-sm font-bold text-stone-900 shadow-[0_0_20px_rgba(214,179,106,0.35)] hover:opacity-95 disabled:opacity-50"
            >
              {loading ? <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />กำลังเข้าสู่ระบบ...</span> : 'เข้าสู่ระบบ Host'}
            </button>
          </form>

          <p className="text-center text-[11px] leading-5 text-white/40">
            ใช้บัญชี Host แบบไม่แสดงอีเมลผ่าน Firebase Anonymous Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

function getHostSignInErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'Firebase ปฏิเสธการเข้าสู่ระบบแบบไม่ระบุตัวตน: โปรดเปิด Anonymous ใน Firebase Console → Authentication → Sign-in method สำหรับโปรเจกต์ game-puzzle-6767 แล้วลองใหม่';
  }
  if (code === 'auth/network-request-failed') {
    return 'เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง';
  }
  if (error instanceof Error) return `เข้าสู่ระบบ Host ไม่สำเร็จ (${code || 'unknown'}): ${error.message}`;
  return 'ไม่สามารถเข้าสู่ระบบ Host ได้ กรุณาลองใหม่อีกครั้ง';
}
