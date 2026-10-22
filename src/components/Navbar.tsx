import React, { useState } from 'react';
import { Volume2, VolumeX, Music, HelpCircle, LogOut, User, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';

interface NavbarProps {
  currentUser: {
    uid: string;
    displayName: string;
    email?: string | null;
    photoURL?: string | null;
    isHost?: boolean;
  } | null;
  onOpenHowToPlay: () => void;
  onLogout: () => void;
  onNavigateLobby: () => void;
  isHostView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenHowToPlay,
  onLogout,
  onNavigateLobby,
  isHostView = false
}) => {
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [isBgm, setIsBgm] = useState(soundService.getIsBgmPlaying());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolumeState] = useState(soundService.getVolume());

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleBgm = async () => {
    setIsBgm(await soundService.toggleBgm());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    soundService.setVolume(val);
    if (val > 0 && isMuted) {
      soundService.toggleMute();
      setIsMuted(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-[#62F5C5]/20 bg-[#0B1715]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Title Lockup */}
        <button 
          onClick={onNavigateLobby}
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#62F5C5] rounded-lg p-1 transition-transform hover:scale-[1.02] cursor-pointer"
        >
          {/* Bespoke SVG Logo for Social-Science Arena: Jigsaw Puzzle */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(98,245,197,0.45)]">
              <defs>
                <linearGradient id="logo-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#62F5C5" />
                  <stop offset="100%" stopColor="#103B32" />
                </linearGradient>
                <linearGradient id="logo-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D6B36A" />
                  <stop offset="100%" stopColor="#B38B3F" />
                </linearGradient>
              </defs>
              {/* Shield/Arena Base */}
              <polygon points="50,6 88,24 78,76 50,94 22,76 12,24" fill="#0B1715" stroke="url(#logo-grad-primary)" strokeWidth="3" />
              {/* Interlocking Jigsaw Piece Icon */}
              <path 
                d="M32,32 L44,32 C45,28 47,26 50,26 C53,26 55,28 56,32 L68,32 L68,44 C72,45 74,47 74,50 C74,53 72,55 68,56 L68,68 L56,68 C55,72 53,74 50,74 C47,74 45,72 44,68 L32,68 L32,56 C28,55 26,53 26,50 C26,47 28,45 32,44 Z" 
                fill="url(#logo-grad-primary)" 
                stroke="#62F5C5" 
                strokeWidth="1.5"
                opacity="0.9"
              />
              {/* Golden Compass Sparkle Center */}
              <circle cx="50" cy="50" r="4.5" fill="url(#logo-grad-gold)" />
              <path d="M50,40 L52,48 L60,50 L52,52 L50,60 L48,52 L40,50 L48,48 Z" fill="#D6B36A" opacity="0.8" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg tracking-wider text-[#F5F0E6] flex items-center">
                SOCIAL-SCIENCE <span className="text-[#62F5C5] ml-1">ARENA</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#D6B36A] uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 inline" /> Jigsaw Puzzle
              </span>
              {isHostView && (
                <span className="text-[9px] px-1.5 py-0.2 bg-[#D6B36A]/20 border border-[#D6B36A]/40 text-[#D6B36A] rounded font-mono">
                  HOST
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound & Music Controls */}
          <div className="relative flex items-center bg-[#103B32]/60 border border-[#62F5C5]/20 rounded-lg p-1 gap-1">
            {/* BGM Toggle */}
            <button
              onClick={handleToggleBgm}
              className={`p-1.5 rounded transition-colors ${
                isBgm 
                  ? 'bg-[#62F5C5]/20 text-[#62F5C5]' 
                  : 'text-[#F5F0E6]/50 hover:text-[#F5F0E6]'
              }`}
              title={isBgm ? "ปิดเพลงประกอบ BGM" : "เปิดเพลง Afternoon at the Lobby"}
              aria-label={isBgm ? "ปิดเพลงประกอบ" : "เปิดเพลงประกอบ"}
              aria-pressed={isBgm}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* SFX Mute Toggle */}
            <button
              onClick={handleToggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className={`p-1.5 rounded transition-colors ${
                !isMuted 
                  ? 'text-[#62F5C5]' 
                  : 'text-rose-400 bg-rose-500/10'
              }`}
              title={isMuted ? "เปิดเสียงเอฟเฟกต์" : "ปิดเสียงเอฟเฟกต์"}
              aria-label="Toggle Mute Sound Effects"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Volume dropdown slider */}
            {showVolumeSlider && (
              <div 
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute top-12 right-0 glass-card p-3 rounded-xl border border-[#62F5C5]/30 shadow-2xl flex flex-col gap-2 w-36"
              >
                <div className="flex items-center justify-between text-[11px] text-[#F5F0E6]/70">
                  <span>ระดับเสียง</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-[#62F5C5] cursor-pointer h-1.5 bg-[#103B32] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* How to play */}
          <button
            onClick={onOpenHowToPlay}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#103B32]/40 hover:bg-[#103B32]/80 border border-[#62F5C5]/20 hover:border-[#62F5C5]/50 text-[#F5F0E6] rounded-lg text-xs font-medium transition-colors"
            title="วิธีเล่นและกติกาการให้คะแนน"
          >
            <HelpCircle className="w-4 h-4 text-[#62F5C5]" />
            <span className="hidden sm:inline">วิธีเล่น</span>
          </button>

          {/* User profile / Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-[#62F5C5]/20">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden border border-[#62F5C5]/40 flex items-center justify-center bg-[#103B32] text-xs font-bold text-[#62F5C5]"
                title={currentUser.displayName || currentUser.email || 'User'}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-[#62F5C5]" />
                )}
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-[#F5F0E6]/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="ออกจากระบบ"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
