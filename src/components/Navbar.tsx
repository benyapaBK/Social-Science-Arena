import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Volume2, VolumeX, Music, HelpCircle, LogOut, Settings, User, Users } from 'lucide-react';
import { soundService } from '../services/soundService';
import type { GameMode } from '../types';

interface NavbarProps {
  mode?: GameMode | null;
  modeLabel?: string;
  userLabel?: string;
  isHost?: boolean;
  onOpenHowToPlay: () => void;
  onLogout?: () => void;
  onNavigateHome: () => void;
  onHostGesture: () => void;
}

const GESTURE_CLICKS = 3;
const GESTURE_WINDOW_MS = 2500;

export function Navbar({ mode, modeLabel, userLabel, isHost, onOpenHowToPlay, onLogout, onNavigateHome, onHostGesture }: NavbarProps) {
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [isBgm, setIsBgm] = useState(soundService.getIsBgmPlaying());
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(soundService.getVolume());
  const clicks = useRef(0);
  const timer = useRef<number | null>(null);
  const gestureRef = useRef(onHostGesture);

  useEffect(() => { gestureRef.current = onHostGesture; }, [onHostGesture]);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  // Only genuine clicks on the gear count (mouse, touch and Enter/Space all arrive as one click event).
  const handleGear = (e: React.MouseEvent) => {
    if (!e.isTrusted) return;
    clicks.current += 1;
    if (timer.current) window.clearTimeout(timer.current);
    if (clicks.current >= GESTURE_CLICKS) {
      clicks.current = 0;
      timer.current = null;
      gestureRef.current();
      return;
    }
    timer.current = window.setTimeout(() => { clicks.current = 0; timer.current = null; }, GESTURE_WINDOW_MS);
  };

  const onVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    soundService.setVolume(v);
    if (v > 0 && isMuted) { soundService.toggleMute(); setIsMuted(false); }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <button type="button" onClick={onNavigateHome} className="flex items-center gap-2 rounded-xl p-1 text-left" aria-label="กลับหน้าแรก Social-Science Arena">
          <img src="/assets/images/social-science-arena-logo.webp" alt="" width="48" height="48" fetchPriority="high" decoding="async" className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12" />
          <span>
            <span className="block font-display text-sm font-bold leading-tight sm:text-lg">Social-Science Arena</span>
            <span className="hidden text-[11px] text-ink-soft sm:block">เกมเปิดภาพปริศนา เรียนรู้สังคมศึกษาอย่างสนุก</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {mode && (
            <span className={`badge ${mode === 'team' ? 'badge-lavender' : ''}`} aria-label={`โหมดที่เลือก: ${modeLabel || (mode === 'team' ? 'Teamwork' : 'Battle')}`}>
              {mode === 'team' ? <Users size={13} aria-hidden /> : <User size={13} aria-hidden />}
              {modeLabel || (mode === 'team' ? 'Teamwork' : 'Battle')}
            </span>
          )}
          {userLabel && <span className="hidden max-w-[10rem] truncate text-sm font-semibold md:block">{userLabel}{isHost ? ' (โฮสต์)' : ''}</span>}

          <div className="relative" onMouseLeave={() => setShowVolume(false)}>
            <button type="button" className="btn btn-secondary btn-sm !px-2.5" aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'} onClick={() => { setIsMuted(soundService.toggleMute()); }} onMouseEnter={() => setShowVolume(true)} onFocus={() => setShowVolume(true)}>
              {isMuted ? <VolumeX size={17} aria-hidden /> : <Volume2 size={17} aria-hidden />}
            </button>
            {showVolume && (
              <div className="card absolute right-0 top-full z-50 mt-1 w-40 p-3">
                <label className="sr-only" htmlFor="nav-volume">ระดับเสียง</label>
                <input id="nav-volume" type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={onVolume} className="w-full" />
              </div>
            )}
          </div>
          <button type="button" title={isBgm ? 'ปิดเพลง' : 'เปิดเพลง'} className={`btn btn-sm !px-2.5 ${isBgm ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={isBgm} aria-label={isBgm ? 'ปิดเพลงพื้นหลัง' : 'เปิดเพลงพื้นหลัง'} onClick={async () => setIsBgm(await soundService.toggleBgm())}>
            <Music size={17} aria-hidden />
          </button>
          <button type="button" title="วิธีเล่น" className="btn btn-secondary btn-sm !px-2.5" aria-label="วิธีเล่น" onClick={onOpenHowToPlay}><HelpCircle size={17} aria-hidden /></button>
          {onLogout && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}><LogOut size={16} aria-hidden /><span className="hidden sm:inline">ออก</span></button>
          )}
          <button type="button" onClick={handleGear} title="การตั้งค่า" aria-label="การตั้งค่าและเข้าสู่โหมดผู้ควบคุม" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-cream-deep hover:text-ink">
            <Settings size={18} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
