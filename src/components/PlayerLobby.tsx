import React, { useState } from 'react';
import { Room, RoomPlayer } from '../types';
import { EMOJI_AVATARS, EmojiAvatar } from '../data/emojis';
import { Users, Sparkles, Check, Lock, AlertCircle, LogIn, ArrowRight } from 'lucide-react';

interface PlayerLobbyProps {
  room: Room;
  currentUid: string;
  onJoinSuccess: (player: RoomPlayer) => void;
  onGoogleSignIn: () => Promise<any>;
  currentUser: any;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({
  room,
  currentUid,
  onJoinSuccess,
  onGoogleSignIn,
  currentUser
}) => {
  const existingPlayer = room.players?.[currentUid];
  
  const [displayName, setDisplayName] = useState(
    existingPlayer?.displayName || currentUser?.displayName || ''
  );
  const [selectedAvatar, setSelectedAvatar] = useState<EmojiAvatar>(() => {
    if (existingPlayer?.avatarEmoji) {
      const found = EMOJI_AVATARS.find(a => a.emoji === existingPlayer.avatarEmoji);
      if (found) return found;
    }
    // Pick first available emoji avatar
    const takenEmojis = Object.values(room.players || {}).map(p => p.avatarEmoji);
    const available = EMOJI_AVATARS.find(a => !takenEmojis.includes(a.emoji));
    return available || EMOJI_AVATARS[0];
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Taken emojis set by other players in this room
  const takenEmojis = Object.entries(room.players || {})
    .filter(([uid]) => uid !== currentUid)
    .map(([, p]) => p.avatarEmoji);

  const filteredAvatars = selectedCategory === 'all'
    ? EMOJI_AVATARS
    : EMOJI_AVATARS.filter(a => a.category === selectedCategory);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!displayName.trim()) {
      setErrorMessage('กรุณาระบุชื่อที่ใช้แสดงในเกม');
      return;
    }

    if (takenEmojis.includes(selectedAvatar.emoji)) {
      setErrorMessage(`อวตาร ${selectedAvatar.emoji} ถูกเลือกโดยผู้เล่นท่านอื่นแล้ว กรุณาเลือกอวตารอื่น`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onJoinSuccess({
        uid: currentUid,
        displayName: displayName.trim(),
        avatarEmoji: selectedAvatar.emoji,
        avatarBgColor: selectedAvatar.bgGrad,
        joinedAt: existingPlayer?.joinedAt || Date.now(),
        ready: true,
        connectionStatus: 'online',
        currentQuestion: existingPlayer?.currentQuestion || 1,
        score: existingPlayer?.score || 0,
        correctCount: existingPlayer?.correctCount || 0,
        comboStreak: existingPlayer?.comboStreak || 0,
        maxCombo: existingPlayer?.maxCombo || 0,
        lastUpdatedAt: Date.now(),
        totalResponseTime: existingPlayer?.totalResponseTime || 0,
        progress: existingPlayer?.progress || {}
      } as RoomPlayer);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเข้าร่วมห้องได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If player has already joined and is waiting for host to start
  if (existingPlayer?.ready) {
    const playersList = Object.values(room.players || {});
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6 text-center animate-in fade-in duration-300">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#62F5C5]/40 shadow-2xl space-y-6">
          
          {/* Waiting animation */}
          <div className="relative w-24 h-24 mx-auto">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${existingPlayer.avatarBgColor || 'from-emerald-700 to-teal-500'} flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(98,245,197,0.4)] border-2 border-[#62F5C5] animate-bounce`}>
              {existingPlayer.avatarEmoji}
            </div>
            <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center text-sm font-bold border-2 border-[#0B1715]">
              ✓
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-[#F5F0E6]">
              ยินดีต้อนรับ, <span className="text-[#62F5C5]">{existingPlayer.displayName}</span>!
            </h2>
            <p className="text-sm text-[#F5F0E6]/70">
              คุณพร้อมเข้าแข่งขันในห้อง <strong className="text-[#D6B36A] font-mono">{room.name}</strong> แล้ว
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#103B32]/40 border border-[#62F5C5]/20 flex items-center justify-center gap-2 text-sm text-[#F5F0E6]/80 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-[#62F5C5]" />
            <span>กำลังรอโฮสต์กดเริ่มเกม...</span>
          </div>

          {/* Current participants list */}
          <div className="pt-2 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-[#F5F0E6]/60 px-1">
              <span>ผู้เล่นในห้องขณะนี้ ({playersList.length} คน)</span>
              <span>รหัสห้อง: #{room.roomId}</span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {playersList.map((p) => (
                <div 
                  key={p.uid}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
                    p.uid === currentUid 
                      ? 'bg-[#62F5C5]/20 border-[#62F5C5] text-[#62F5C5] font-bold' 
                      : 'bg-[#0B1715]/60 border-[#62F5C5]/15 text-[#F5F0E6]/80'
                  }`}
                >
                  <span className="text-base">{p.avatarEmoji}</span>
                  <span className="truncate max-w-[100px]">{p.displayName}</span>
                  {p.uid === currentUid && <span className="text-[10px] opacity-75">(คุณ)</span>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Step 1: Google Login check */}
      {!currentUser && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#62F5C5]/40 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#103B32] border border-[#62F5C5]/30 flex items-center justify-center mx-auto text-[#62F5C5] shadow-lg">
            <LogIn className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-[#F5F0E6]">
              เข้าสู่ระบบด้วยบัญชี Google เพื่อเล่นเกม
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F0E6]/70 max-w-md mx-auto">
              ระบบใช้ Google Sign-In ผ่าน Firebase Authentication เพื่อความปลอดภัยและบันทึกคะแนนสะสมรายบุคคล
            </p>
          </div>

          <button
            onClick={onGoogleSignIn}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-display font-bold text-sm bg-white text-stone-900 hover:bg-stone-100 shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            {/* Google G Logo SVG */}
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>ลงชื่อเข้าใช้ด้วย Google (Sign in with Google)</span>
          </button>
        </div>
      )}

      {/* Step 2: Choose Name & 40 Unique Emoji Avatars with duplicate lock */}
      {currentUser && (
        <form onSubmit={handleJoin} className="glass-card rounded-3xl p-5 sm:p-8 border border-[#62F5C5]/40 shadow-2xl space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#62F5C5] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> เข้าร่วมห้อง #{room.roomId}: {room.name}
            </div>
            <h2 className="font-display font-extrabold text-2xl text-[#F5F0E6]">
              ตั้งชื่อและเลือกอวตารอีโมจิประจำตัว (40 รูปแบบ)
            </h2>
            <p className="text-xs text-[#F5F0E6]/60">
              แต่ละห้องผู้เล่นต้องใช้อวตารอีโมจิที่ไม่ซ้ำกันเพื่อความโปร่งใสและเอกลักษณ์ในสนามประลอง
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Player Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F5F0E6]/80 block">
              ชื่อที่จะใช้แสดงในสนามประลอง (Display Name)
            </label>
            <input
              type="text"
              required
              maxLength={24}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="เช่น บัว เบญญาภา, ต้นน้ำ ปัญญา..."
              className="w-full px-4 py-3 rounded-xl bg-[#0B1715]/80 border border-[#62F5C5]/30 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#62F5C5]"
            />
          </div>

          {/* Selected Avatar Showcase */}
          <div className="p-4 rounded-2xl bg-[#103B32]/40 border border-[#62F5C5]/20 flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedAvatar.bgGrad} flex items-center justify-center text-3xl shadow-lg border-2 border-white/30 flex-shrink-0`}>
              {selectedAvatar.emoji}
            </div>
            <div>
              <span className="text-[11px] text-[#62F5C5] uppercase font-bold tracking-wider">
                อวตารที่คุณเลือก
              </span>
              <h4 className="font-display font-bold text-lg text-[#F5F0E6]">
                {selectedAvatar.emoji} {selectedAvatar.name}
              </h4>
              <p className="text-xs text-[#F5F0E6]/60">
                พร้อมแล้วสำหรับข้อสอบประลองความรู้ 10 ข้อ
              </p>
            </div>
          </div>

          {/* 40 Emoji Avatars Picker Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[#D6B36A] flex items-center gap-1.5">
                <span>เลือกอวตารของคุณจาก 40 รูปแบบ (ห้ามซ้ำกันในห้อง)</span>
              </label>

              {/* Category Filter */}
              <div className="flex items-center gap-1 text-[11px]">
                {['all', 'champion', 'thinker', 'social', 'explorer'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#62F5C5]/20 text-[#62F5C5] font-bold border border-[#62F5C5]/40'
                        : 'text-[#F5F0E6]/50 hover:text-[#F5F0E6]'
                    }`}
                  >
                    {cat === 'all' && 'ทั้งหมด'}
                    {cat === 'champion' && 'แชมเปียน'}
                    {cat === 'thinker' && 'นักปราชญ์'}
                    {cat === 'social' && 'สังคม'}
                    {cat === 'explorer' && 'นักสำรวจ'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto p-1.5 bg-[#0B1715]/60 rounded-2xl border border-[#62F5C5]/15">
              {filteredAvatars.map((avatar) => {
                const isSelected = selectedAvatar.id === avatar.id;
                const isTaken = takenEmojis.includes(avatar.emoji);

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    disabled={isTaken}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#62F5C5]/25 border-2 border-[#62F5C5] scale-105 shadow-[0_0_15px_rgba(98,245,197,0.4)]'
                        : isTaken
                          ? 'opacity-30 bg-zinc-900 border border-zinc-800 cursor-not-allowed'
                          : 'bg-[#103B32]/30 hover:bg-[#103B32]/70 border border-[#62F5C5]/10 hover:border-[#62F5C5]/40'
                    }`}
                    title={isTaken ? `${avatar.name} (มีผู้เล่นอื่นเลือกแล้ว)` : avatar.name}
                  >
                    <span className="text-2xl">{avatar.emoji}</span>
                    {isTaken && (
                      <span className="absolute top-1 right-1">
                        <Lock className="w-2.5 h-2.5 text-rose-400" />
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#62F5C5] animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl font-display font-bold text-base bg-gradient-to-r from-[#62F5C5] to-[#40C59D] text-[#0B1715] hover:opacity-95 shadow-[0_0_25px_rgba(98,245,197,0.4)] transition-all transform hover:scale-[1.01] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'พร้อมเข้าแข่งขัน (Join Game)'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}

    </div>
  );
};
