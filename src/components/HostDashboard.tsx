import React, { useState, useEffect } from 'react';
import { Room, RoomPlayer, Question } from '../types';
import { gameService } from '../services/gameService';
import QRCode from 'qrcode';
import { 
  Users, 
  Play, 
  Pause, 
  StopCircle, 
  Copy, 
  Download, 
  Check, 
  UserX, 
  Settings, 
  Flame, 
  Clock, 
  Layers, 
  QrCode, 
  CheckCircle2, 
  Edit3, 
  Lock, 
  Unlock,
  AlertCircle,
  Eye,
  Trophy
} from 'lucide-react';

interface HostDashboardProps {
  room: Room;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onEndGameEarly: () => void;
  onOpenQuestionEditor: () => void;
  onCloseRoom: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  room,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onEndGameEarly,
  onOpenQuestionEditor,
  onCloseRoom
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [kickConfirmUid, setKickConfirmUid] = useState<string | null>(null);

  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?room=${room.roomId}` 
    : `https://social-science-arena.web.app?room=${room.roomId}`;

  // Generate QR code on mount or when roomId changes
  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0B1715',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [joinUrl, room.roomId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Arena_QR_${room.roomId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleAcceptingPlayers = async () => {
    await gameService.updateRoom(room.roomId, {
      acceptingPlayers: !room.acceptingPlayers
    });
  };

  const handleKickPlayer = async (uid: string) => {
    await gameService.kickPlayer(room.roomId, room.hostUid, uid);
    setKickConfirmUid(null);
  };

  const playersList = Object.values(room.players || {});
  const readyCount = playersList.filter(p => p.ready).length;
  const isRunning = room.status === 'running';
  const isPaused = room.status === 'paused';
  const isWaiting = room.status === 'waiting' || room.status === 'ready';

  const canStart = playersList.length >= room.settings.minPlayers;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner: Room Status & Quick Host Controls */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-[#62F5C5]/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-[#62F5C5] animate-ping' : isPaused ? 'bg-amber-400' : 'bg-blue-400'
            }`} />
            <span className="text-xs font-mono uppercase tracking-wider text-[#F5F0E6]/60">
              สถานะห้อง: <strong className="text-[#62F5C5]">{room.status.toUpperCase()}</strong>
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#F5F0E6] mt-1">
            {room.name}
          </h1>
          <p className="text-xs text-[#F5F0E6]/70 mt-0.5">
            รหัสห้อง (Room Code): <strong className="text-[#D6B36A] font-mono text-base tracking-widest">{room.roomId}</strong>
          </p>
        </div>

        {/* Host Game Controller Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isWaiting && (
            <>
              <button
                onClick={onOpenQuestionEditor}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#103B32] hover:bg-[#103B32]/80 border border-[#62F5C5]/30 text-[#F5F0E6] transition-all cursor-pointer"
                title="จัดการข้อคำถามและคำตอบ"
              >
                <Edit3 className="w-4 h-4 text-[#62F5C5]" />
                <span>แก้ไขคำถาม ({room.questions?.length || 10})</span>
              </button>

              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all shadow-lg cursor-pointer ${
                  canStart
                    ? 'bg-gradient-to-r from-[#62F5C5] to-[#40C59D] text-[#0B1715] hover:opacity-95 shadow-[0_0_20px_rgba(98,245,197,0.4)]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
                title={canStart ? "เริ่มเกมสำหรับทุกคนในห้อง" : `ต้องการผู้เล่นขั้นต่ำอย่างน้อย ${room.settings.minPlayers} คน`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>เริ่มการแข่งขัน (Start Game)</span>
              </button>
            </>
          )}

          {isRunning && (
            <button
              onClick={onPauseGame}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>หยุดเวลาชั่วคราว (Pause)</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={onResumeGame}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-[#62F5C5] hover:bg-[#40C59D] text-[#0B1715] transition-all shadow-md cursor-pointer animate-pulse"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เล่นต่อ (Resume)</span>
            </button>
          )}

          {(isRunning || isPaused) && (
            <button
              onClick={() => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการจบเกมก่อนกำหนดและนำทุกคนสู่หน้าสรุปผล?')) {
                  onEndGameEarly();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 transition-colors cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>จบเกม (End Game)</span>
            </button>
          )}

          <button
            onClick={handleToggleAcceptingPlayers}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-[#0B1715]/70 hover:bg-[#0B1715] border border-[#62F5C5]/20 text-[#F5F0E6] transition-colors"
            title={room.acceptingPlayers ? "ปิดรับผู้เล่นใหม่" : "เปิดรับผู้เล่นใหม่"}
          >
            {room.acceptingPlayers ? (
              <>
                <Unlock className="w-4 h-4 text-[#62F5C5]" />
                <span className="hidden sm:inline">เปิดรับคน</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">ปิดรับคน</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left = QR & Share Info, Right = Players Roster / Live Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: QR Code & Join Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-[#62F5C5]/30 shadow-xl space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#62F5C5] uppercase tracking-wider">
              <QrCode className="w-4 h-4" /> สแกน QR Code เพื่อเข้าร่วมห้อง
            </div>

            {/* QR Code Container */}
            <div className="w-56 h-56 mx-auto p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#62F5C5]">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Room QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-xs text-stone-500 animate-pulse">กำลังสร้าง QR Code...</div>
              )}
            </div>

            {/* Room Code Badge */}
            <div className="p-2.5 rounded-xl bg-[#103B32]/60 border border-[#D6B36A]/30">
              <span className="text-[11px] text-[#F5F0E6]/60 block">รหัสสำหรับพิมพ์เข้าห้องด้วยตนเอง</span>
              <span className="font-mono font-black text-2xl tracking-widest text-[#D6B36A]">
                {room.roomId}
              </span>
            </div>

            {/* Join URL and Copy */}
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-[#0B1715] border border-[#62F5C5]/20 text-[11px] text-[#F5F0E6]/70 truncate font-mono text-left">
                {joinUrl}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[#103B32] hover:bg-[#103B32]/80 border border-[#62F5C5]/40 text-[#62F5C5] transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'คัดลอกแล้ว' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[#103B32] hover:bg-[#103B32]/80 border border-[#D6B36A]/40 text-[#D6B36A] transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </button>
              </div>
            </div>

            {/* Settings summary */}
            <div className="pt-3 border-t border-[#62F5C5]/15 text-left text-xs text-[#F5F0E6]/70 space-y-1">
              <div className="flex justify-between">
                <span>จำนวนข้อคำถาม:</span>
                <strong className="text-[#F5F0E6]">{room.questions?.length || 10} ข้อ</strong>
              </div>
              <div className="flex justify-between">
                <span>เวลาต่อข้อ:</span>
                <strong className="text-[#F5F0E6]">{room.settings.questionTimeSeconds} วินาที</strong>
              </div>
              <div className="flex justify-between">
                <span>ผู้เล่นขั้นต่ำ:</span>
                <strong className="text-[#F5F0E6]">{room.settings.minPlayers} คน</strong>
              </div>
              <div className="flex justify-between">
                <span>โหมดสลับข้อสุ่ม:</span>
                <strong className="text-[#F5F0E6]">{room.settings.randomizeQuestionOrder ? 'เปิดใช้งาน' : 'เรียง 1-10'}</strong>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Players Roster & In-Game Status Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-[#62F5C5]/30 shadow-xl space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#62F5C5]/20 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#62F5C5]" />
                <h3 className="font-display font-bold text-lg text-[#F5F0E6]">
                  {isWaiting ? 'รายชื่อผู้เข้าร่วมรอเริ่มเกม' : 'สถานะผู้เล่นขณะแข่งขัน (Live Monitor)'}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#F5F0E6]/70">
                <span>
                  ผู้เข้าร่วม: <strong className="text-[#62F5C5] text-sm">{playersList.length}</strong> / {room.settings.maxPlayers} คน
                </span>
                {isWaiting && (
                  <span className="text-emerald-400">
                    (พร้อม {readyCount} คน)
                  </span>
                )}
              </div>
            </div>

            {/* Empty State */}
            {playersList.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#103B32]/50 border border-[#62F5C5]/20 flex items-center justify-center mx-auto text-[#62F5C5]">
                  <Users className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="font-display font-semibold text-base text-[#F5F0E6]">
                  ยังไม่มีผู้เล่นเข้าร่วมห้อง
                </h4>
                <p className="text-xs text-[#F5F0E6]/60 max-w-sm mx-auto">
                  แชร์ลิงก์หรือแสดง QR Code ด้านซ้าย ให้ผู้เล่นสแกนด้วยโทรศัพท์มือถือหรือแท็บเล็ตเพื่อเข้าร่วมห้อง
                </p>
              </div>
            ) : (
              /* Players Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {playersList.map((player) => {
                  const currentProg = player.progress?.[player.currentQuestion];
                  const piecesCount = currentProg?.piecesRevealed || 0;
                  const isAnswered = currentProg?.answeredCorrectly;

                  return (
                    <div
                      key={player.uid}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAnswered
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-[#0B1715]/70 border-[#62F5C5]/20 hover:border-[#62F5C5]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${player.avatarBgColor || 'from-emerald-700 to-teal-500'} flex items-center justify-center text-xl shadow-sm border border-white/20`}>
                            {player.avatarEmoji}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#F5F0E6] truncate max-w-[130px] sm:max-w-[160px]">
                              {player.displayName}
                            </div>
                            <div className="text-[11px] text-[#F5F0E6]/50 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                player.connectionStatus === 'online' ? 'bg-emerald-400' : 'bg-zinc-500'
                              }`} />
                              <span>{player.connectionStatus === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Kick Player Button with confirmation */}
                        {isWaiting && (
                          <div>
                            {kickConfirmUid === player.uid ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleKickPlayer(player.uid)}
                                  className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold"
                                >
                                  ยืนยัน
                                </button>
                                <button
                                  onClick={() => setKickConfirmUid(null)}
                                  className="px-2 py-1 rounded bg-zinc-700 text-white text-[11px]"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setKickConfirmUid(player.uid)}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="เตะผู้เล่นออกจากห้อง"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* In-game live progress cluster (when game is running) */}
                      {(isRunning || isPaused) && (
                        <div className="mt-3 pt-2.5 border-t border-[#62F5C5]/10 grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-[#F5F0E6]/50 block">ข้อปัจจุบัน</span>
                            <strong className="text-[#F5F0E6]">ข้อ {player.currentQuestion}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#F5F0E6]/50 block">เปิดจิ๊กซอว์</span>
                            <strong className="text-[#62F5C5]">{piecesCount}/10</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#F5F0E6]/50 block">คะแนนรวม</span>
                            <strong className="text-[#D6B36A] font-extrabold">{player.score}</strong>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
