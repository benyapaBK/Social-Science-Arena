import React, { useEffect, useState } from 'react';
import { FinalPlayerResult, Room } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Download, RotateCcw, Flame, Clock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';
import { KnowledgeArchiveModal } from './KnowledgeArchiveModal';

interface PodiumLeaderboardProps {
  room: Room;
  results: FinalPlayerResult[];
  onPlayAgain?: () => void;
  onBackToLobby: () => void;
  isHost?: boolean;
}

export const PodiumLeaderboard: React.FC<PodiumLeaderboardProps> = ({
  room,
  results,
  onPlayAgain,
  onBackToLobby,
  isHost = false
}) => {
  const [showKnowledgeArchive, setShowKnowledgeArchive] = useState(false);

  useEffect(() => {
    // Launch fireworks celebration on podium entry
    soundService.playFireworks();
    try {
      const end = Date.now() + 3000;
      const colors = ['#62F5C5', '#D6B36A', '#ffffff', '#103B32'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      // ignore
    }
  }, []);

  const top1 = results.find(r => r.rank === 1);
  const top2 = results.find(r => r.rank === 2);
  const top3 = results.find(r => r.rank === 3);

  // CSV Export utility for Host (Section 18.4)
  const handleExportCSV = () => {
    if (!results.length) return;

    const headers = ['อันดับ (Rank)', 'ชื่อผู้เล่น (Name)', 'อวตาร (Avatar)', 'คะแนนรวม (Total Score)', 'ตอบถูก (Correct Count)', 'เวลาตอบรวมวินาที (Total Time s)', 'คอมโบสูงสุด (Max Combo)'];
    const rows = results.map(r => [
      r.rank,
      `"${r.displayName.replace(/"/g, '""')}"`,
      r.avatarEmoji,
      r.finalScore,
      r.correctCount,
      r.totalResponseTime,
      r.maxCombo
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SocialScience_Arena_Room_${room.roomId}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D6B36A]/20 border border-[#D6B36A]/40 text-[#D6B36A] text-xs font-semibold uppercase tracking-wider">
          <Trophy className="w-4 h-4" /> สรุปผลการแข่งขันและอันดับสนามประลอง
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F5F0E6] tracking-tight">
          LEADERBOARD <span className="text-[#62F5C5]">ARENA</span>
        </h1>
        <p className="text-sm text-[#F5F0E6]/70 max-w-lg mx-auto">
          ห้อง: <strong className="text-[#62F5C5] font-mono">{room.name} (#{room.roomId})</strong> • แข่งขันครบ 10 ข้อตามเวลาเซิร์ฟเวอร์
        </p>
      </div>

      {/* 3D ISOMETRIC PODIUM SECTION (Section 18.1) */}
      <div className="w-full relative flex items-end justify-center pt-8 pb-6 px-2 min-h-[380px]">
        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end w-full max-w-2xl mx-auto">
          
          {/* #2 PODIUM (Left, Silver) */}
          <div className="flex flex-col items-center">
            {top2 ? (
              <div className="flex flex-col items-center mb-2 animate-in slide-in-from-bottom duration-500 delay-150">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-400 to-zinc-600 border-2 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.4)] flex items-center justify-center text-3xl sm:text-4xl">
                    {top2.avatarEmoji}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-extrabold text-[11px] shadow-md border border-white">
                    #2
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm sm:text-base text-[#F5F0E6] mt-4 text-center truncate max-w-[110px] sm:max-w-[140px]">
                  {top2.displayName}
                </h4>
                <div className="font-display font-extrabold text-base sm:text-lg text-slate-300">
                  {top2.finalScore.toLocaleString()} <span className="text-xs font-normal">pts</span>
                </div>
                <div className="text-[11px] text-[#F5F0E6]/60">
                  ถูก {top2.correctCount}/10 ข้อ
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#F5F0E6]/40 mb-3">-</div>
            )}

            {/* Silver Isometric Pillar */}
            <div 
              className="w-full h-32 sm:h-44 rounded-t-2xl bg-gradient-to-b from-slate-400/80 via-slate-600/70 to-slate-800/90 border-t-4 border-l-2 border-r-2 border-slate-300 shadow-xl flex items-center justify-center"
              style={{
                boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.3)'
              }}
            >
              <div className="text-center">
                <span className="font-display font-black text-3xl sm:text-5xl text-slate-200/50">2</span>
                <span className="block text-[11px] uppercase tracking-widest text-slate-300/80 font-bold">SILVER</span>
              </div>
            </div>
          </div>

          {/* #1 PODIUM (Center, Gold - Highest & Most Glorious) */}
          <div className="flex flex-col items-center z-10 -mx-1 sm:mx-0">
            {top1 ? (
              <div className="flex flex-col items-center mb-2 animate-in slide-in-from-bottom duration-500">
                <div className="relative">
                  {/* Glorious Gold Crown */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                    👑
                  </div>
                  <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#D6B36A] via-amber-500 to-yellow-600 border-3 border-amber-300 shadow-[0_0_35px_rgba(214,179,106,0.65)] flex items-center justify-center text-4xl sm:text-5xl ring-4 ring-[#D6B36A]/40">
                    {top1.avatarEmoji}
                  </div>
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 text-stone-900 font-black text-xs shadow-lg border border-white">
                    #1 CHAMPION
                  </span>
                </div>
                <h4 className="font-display font-extrabold text-base sm:text-lg text-[#F5F0E6] mt-4 text-center truncate max-w-[120px] sm:max-w-[160px] glow-text-gold">
                  {top1.displayName}
                </h4>
                <div className="font-display font-black text-xl sm:text-2xl text-[#D6B36A] glow-text-gold">
                  {top1.finalScore.toLocaleString()} <span className="text-xs font-normal">pts</span>
                </div>
                <div className="text-xs text-[#62F5C5] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" /> ตอบถูก {top1.correctCount}/10 ข้อ
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#F5F0E6]/40 mb-3">-</div>
            )}

            {/* Gold Isometric Pillar (Tallest) */}
            <div 
              className="w-full h-44 sm:h-56 rounded-t-2xl bg-gradient-to-b from-[#D6B36A] via-amber-600/80 to-amber-950 border-t-4 border-l-2 border-r-2 border-yellow-300 shadow-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                boxShadow: '0 15px 45px rgba(214,179,106,0.4), inset 0 3px 15px rgba(255,255,255,0.4)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse" />
              <div className="text-center relative z-10">
                <span className="font-display font-black text-4xl sm:text-6xl text-amber-100/60">1</span>
                <span className="block text-xs uppercase tracking-widest text-amber-200 font-extrabold">CHAMPION</span>
              </div>
            </div>
          </div>

          {/* #3 PODIUM (Right, Bronze) */}
          <div className="flex flex-col items-center">
            {top3 ? (
              <div className="flex flex-col items-center mb-2 animate-in slide-in-from-bottom duration-500 delay-300">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 shadow-[0_0_20px_rgba(180,83,9,0.4)] flex items-center justify-center text-3xl sm:text-4xl">
                    {top3.avatarEmoji}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 font-extrabold text-[11px] shadow-md border border-amber-500">
                    #3
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm sm:text-base text-[#F5F0E6] mt-4 text-center truncate max-w-[110px] sm:max-w-[140px]">
                  {top3.displayName}
                </h4>
                <div className="font-display font-extrabold text-base sm:text-lg text-amber-400">
                  {top3.finalScore.toLocaleString()} <span className="text-xs font-normal">pts</span>
                </div>
                <div className="text-[11px] text-[#F5F0E6]/60">
                  ถูก {top3.correctCount}/10 ข้อ
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#F5F0E6]/40 mb-3">-</div>
            )}

            {/* Bronze Isometric Pillar */}
            <div 
              className="w-full h-24 sm:h-36 rounded-t-2xl bg-gradient-to-b from-amber-700/80 via-amber-900/70 to-stone-900 border-t-4 border-l-2 border-r-2 border-amber-600 shadow-xl flex items-center justify-center"
              style={{
                boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.2)'
              }}
            >
              <div className="text-center">
                <span className="font-display font-black text-3xl sm:text-5xl text-amber-300/40">3</span>
                <span className="block text-[11px] uppercase tracking-widest text-amber-300/80 font-bold">BRONZE</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FULL LEADERBOARD TABLE (Section 18.2) */}
      <div className="glass-card rounded-2xl border border-[#62F5C5]/30 overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#62F5C5]/20 flex flex-wrap items-center justify-between gap-3 bg-[#103B32]/40">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-[#62F5C5]" />
            <h3 className="font-display font-bold text-lg text-[#F5F0E6]">
              ตารางจัดอันดับผู้เล่นทั้งหมด ({results.length} คน)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#103B32] hover:bg-[#103B32]/80 border border-[#62F5C5]/40 text-[#62F5C5] transition-all hover:scale-[1.02] cursor-pointer"
                title="ส่งออกผลคะแนนเป็นไฟล์ CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#F5F0E6]">
            <thead className="bg-[#0B1715]/80 text-[#F5F0E6]/60 text-xs uppercase tracking-wider border-b border-[#62F5C5]/10">
              <tr>
                <th className="py-3 px-4 text-center w-16">อันดับ</th>
                <th className="py-3 px-4">ผู้เล่น</th>
                <th className="py-3 px-4 text-right">คะแนนรวม</th>
                <th className="py-3 px-4 text-center">ตอบถูก</th>
                <th className="py-3 px-4 text-center">คอมโบสูงสุด</th>
                <th className="py-3 px-4 text-right">เวลาตอบรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#62F5C5]/10">
              {results.map((player) => (
                <tr 
                  key={player.uid} 
                  className={`transition-colors hover:bg-[#103B32]/30 ${
                    player.rank === 1 ? 'bg-amber-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center font-display font-bold">
                    {player.rank === 1 && <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded font-black text-xs border border-yellow-500/40">#1</span>}
                    {player.rank === 2 && <span className="inline-block px-2 py-0.5 bg-slate-400/20 text-slate-300 rounded font-bold text-xs border border-slate-400/40">#2</span>}
                    {player.rank === 3 && <span className="inline-block px-2 py-0.5 bg-amber-700/20 text-amber-400 rounded font-bold text-xs border border-amber-700/40">#3</span>}
                    {player.rank > 3 && <span className="text-[#F5F0E6]/60 font-mono text-xs">#{player.rank}</span>}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#103B32] border border-[#62F5C5]/30 flex items-center justify-center text-lg shadow-sm">
                        {player.avatarEmoji}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#F5F0E6]">
                          {player.displayName}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-display font-extrabold text-base text-[#62F5C5]">
                    {player.finalScore.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" /> {player.correctCount} / 10
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {player.maxCombo > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#D6B36A] font-bold">
                        <Flame className="w-3 h-3 text-[#D6B36A]" /> {player.maxCombo}x
                      </span>
                    ) : (
                      <span className="text-xs text-[#F5F0E6]/40">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right text-xs text-[#F5F0E6]/70 font-mono">
                    <Clock className="w-3 h-3 inline mr-1 text-[#F5F0E6]/50" />
                    {player.totalResponseTime} วินาที
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setShowKnowledgeArchive(true)}
          className="flex items-center gap-2 rounded-xl border border-[#62F5C5]/40 bg-[#103B32]/50 px-6 py-3 text-sm font-bold text-[#62F5C5] transition hover:bg-[#103B32]"
        >
          <Sparkles className="h-4 w-4" />
          ทบทวนภาพและความรู้ทั้ง 10 ข้อ
        </button>
        {isHost && onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-[#D6B36A] to-amber-500 text-stone-900 hover:opacity-95 shadow-[0_0_20px_rgba(214,179,106,0.4)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>สร้างห้องเล่นรอบใหม่ (Host New Round)</span>
          </button>
        )}

        <button
          onClick={onBackToLobby}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm bg-[#103B32] hover:bg-[#103B32]/80 border border-[#62F5C5]/40 text-[#F5F0E6] transition-all cursor-pointer"
        >
          <span>กลับหน้าหลัก (Back to Lobby)</span>
        </button>
      </div>

      {showKnowledgeArchive && <KnowledgeArchiveModal questions={room.questions} onClose={() => setShowKnowledgeArchive(false)} />}
    </div>
  );
};
