import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { AlertTriangle, Check, Copy, Download, Edit3, Lock, Pause, Play, StopCircle, Unlock, UserX, XCircle } from 'lucide-react';
import type { Question, Room } from '../types';
import { gameService } from '../services/gameService';
import ConfirmDialog from './ConfirmDialog';
import TeamBoard, { getActiveQuestions } from './TeamBoard';
import { toast } from './Toast';

interface Props {
  room: Room;
  hostUid: string;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onEndGameEarly: () => void;
  onOpenQuestionEditor: () => void;
  onCloseRoom: () => void;
  onOpenHowToPlay: () => void;
}

export function questionWarnings(q: Question): string[] {
  const w: string[] = [];
  if (!q.imageFileName) w.push('ยังไม่มีรูปภาพ');
  if (!q.hint?.trim()) w.push('ยังไม่มีคำใบ้');
  if (!q.acceptedAnswers?.length) w.push('ยังไม่มีคำตอบที่ยอมรับ');
  return w;
}

type Confirm = null | { kind: 'kick'; uid: string } | { kind: 'end' } | { kind: 'close' };

export function HostDashboard({ room, hostUid, onStartGame, onPauseGame, onResumeGame, onEndGameEarly, onOpenQuestionEditor, onCloseRoom, onOpenHowToPlay }: Props) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [fullQuestions, setFullQuestions] = useState<Question[] | null>(null);
  const isTeam = room.mode === 'team';

  const joinUrl = `${window.location.origin}?room=${room.roomId}`;

  useEffect(() => {
    if (isTeam) return;
    let alive = true;
    QRCode.toDataURL(joinUrl, { width: 320, margin: 1.5, color: { dark: '#2B3A55', light: '#FFFFFF' } })
      .then(url => alive && setQr(url))
      .catch(() => undefined);
    return () => { alive = false; };
  }, [joinUrl, isTeam]);

  useEffect(() => {
    if (!isTeam) return;
    let alive = true;
    gameService.getPrivateQuestions(room.roomId).then(l => alive && setFullQuestions(l)).catch(() => undefined);
    return () => { alive = false; };
  }, [isTeam, room.roomId, room.questionSetVersion]);

  const players = Object.values(room.players || {});
  const isRunning = room.status === 'running';
  const isPaused = room.status === 'paused';
  const isWaiting = room.status === 'waiting' || room.status === 'ready';
  const canStart = players.length >= room.settings.minPlayers;
  const checkQs = isTeam ? (fullQuestions ?? []) : room.questions;
  const active = useMemo(() => checkQs.filter(q => q.enabled !== false), [checkQs]);
  const warnings = useMemo(() => active.map(q => ({ q, w: questionWarnings(q) })).filter(x => x.w.length), [active]);
  const noQuestions = getActiveQuestions(room).length === 0;

  const copy = async () => {
    try { await navigator.clipboard.writeText(joinUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { toast('ไม่สามารถคัดลอกลิงก์ได้', 'error'); }
  };

  const downloadQr = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `Arena_QR_${room.roomId}.png`;
    a.click();
  };

  const toggleAccepting = () => gameService.updateRoom(room.roomId, { acceptingPlayers: !room.acceptingPlayers }).catch(() => toast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error'));

  const onConfirm = async () => {
    const c = confirm;
    setConfirm(null);
    if (!c) return;
    if (c.kind === 'kick') {
      const ok = await gameService.kickPlayer(room.roomId, hostUid, c.uid).catch(() => false);
      toast(ok ? 'นำผู้เล่นออกจากห้องแล้ว' : 'คุณไม่มีสิทธิ์ควบคุมห้องนี้', ok ? 'success' : 'error');
    }
    if (c.kind === 'end') onEndGameEarly();
    if (c.kind === 'close') onCloseRoom();
  };

  const header = (
    <div className="card card-tint-sky flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${isTeam ? 'badge-lavender' : ''}`}>{isTeam ? 'Teamwork' : 'Battle'}</span>
          <span className="badge badge-sky">สถานะ: {room.status}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">{room.name}</h1>
        <p className="text-sm text-ink-soft">รหัสห้อง <strong className="font-mono text-xl tracking-widest text-ink">{room.roomId}</strong></p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isWaiting && <button type="button" className="btn btn-secondary" onClick={onOpenQuestionEditor}><Edit3 size={16} aria-hidden />แก้ไขคำถาม ({getActiveQuestions(room).length})</button>}
        {isWaiting && <button type="button" className="btn btn-primary" onClick={onStartGame} disabled={!canStart || noQuestions}><Play size={16} aria-hidden />เริ่มเกม</button>}
        {!isTeam && isRunning && <button type="button" className="btn btn-peach" onClick={onPauseGame}><Pause size={16} aria-hidden />พักเกม</button>}
        {!isTeam && isPaused && <button type="button" className="btn btn-primary" onClick={onResumeGame}><Play size={16} aria-hidden />เล่นต่อ</button>}
        {!isTeam && (isRunning || isPaused) && <button type="button" className="btn btn-danger" onClick={() => setConfirm({ kind: 'end' })}><StopCircle size={16} aria-hidden />จบเกม</button>}
        <button type="button" className="btn btn-danger" onClick={() => setConfirm({ kind: 'close' })}>ปิดห้อง</button>
      </div>
    </div>
  );

  const playerList = (
    <section className="card p-4 sm:p-5" aria-label="รายชื่อผู้เล่น">
      <h2 className="font-bold">ผู้เล่น ({players.length}/{room.settings.maxPlayers})</h2>
      {players.length === 0 ? <p className="mt-3 text-sm text-ink-soft">ยังไม่มีผู้เล่น — แชร์รหัสห้องหรือ QR Code ให้ผู้เล่นเข้าร่วม</p> : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {players.map(p => (
            <li key={p.uid} className="flex items-center justify-between gap-2 rounded-2xl bg-cream p-3">
              <span className="min-w-0 truncate"><span className="mr-1 text-xl" aria-hidden>{p.avatarEmoji}</span><strong>{p.displayName}</strong>
                {!isTeam && <span className="ml-2 text-xs text-ink-soft">ข้อ {p.currentQuestion} · {p.score} คะแนน</span>}
              </span>
              <button type="button" className="btn btn-sm btn-danger !px-2" aria-label={`นำ ${p.displayName} ออกจากห้อง`} onClick={() => setConfirm({ kind: 'kick', uid: p.uid })}><UserX size={15} aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const dialogs = (
    <ConfirmDialog
      open={confirm !== null}
      danger
      title={confirm?.kind === 'kick' ? 'นำผู้เล่นออกจากห้อง?' : confirm?.kind === 'end' ? 'จบเกมตอนนี้?' : 'ปิดห้องนี้?'}
      confirmLabel={confirm?.kind === 'kick' ? 'นำออก' : confirm?.kind === 'end' ? 'จบเกม' : 'ปิดห้อง'}
      onConfirm={onConfirm}
      onCancel={() => setConfirm(null)}
    >
      {confirm?.kind === 'close' ? 'ผู้เล่นจะไม่สามารถเข้าห้องนี้ได้อีก' : confirm?.kind === 'end' ? 'ระบบจะสรุปผลจากคะแนนปัจจุบัน' : 'ผู้เล่นคนนี้จะถูกลบออกจากรายชื่อ'}
    </ConfirmDialog>
  );

  if (isTeam && (isRunning || isPaused)) {
    return (
      <TeamBoard room={room} uid={hostUid} isHost onFinish={onEndGameEarly} onCloseRoom={onCloseRoom}
        onOpenHowToPlay={onOpenHowToPlay} onOpenSettings={onOpenQuestionEditor} />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-6 sm:px-6">
      {header}

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <section className="card p-4 text-center sm:p-5" aria-label="เชิญผู้เล่น">
          <h2 className="font-bold">เชิญผู้เล่น</h2>
          {qr ? <img src={qr} alt={`QR Code เข้าห้อง ${room.roomId}`} className="mx-auto mt-3 w-56 rounded-2xl border border-line" /> : <div className="skeleton mx-auto mt-3 h-56 w-56" />}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-sm btn-secondary" onClick={copy}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={downloadQr} disabled={!qr}><Download size={15} aria-hidden />บันทึก QR</button>
          </div>
          {isWaiting && (
            <button type="button" className={`btn btn-sm mt-3 w-full ${room.acceptingPlayers ? 'btn-secondary' : 'btn-peach'}`} onClick={toggleAccepting}>
              {room.acceptingPlayers ? <><Lock size={15} aria-hidden />ปิดรับผู้เล่น</> : <><Unlock size={15} aria-hidden />เปิดรับผู้เล่น</>}
            </button>
          )}
        </section>

        <div className="space-y-5">
          {playerList}
          {isWaiting && (
            <section className="card p-4 sm:p-5" aria-label="ตรวจสอบคำถาม">
              <h2 className="font-bold">ตรวจสอบก่อนเริ่ม ({active.length} ข้อที่เปิดใช้งาน)</h2>
              {noQuestions && <p role="alert" className="mt-2 flex items-center gap-2 text-sm font-semibold text-coral-deep"><XCircle size={16} aria-hidden />ไม่มีคำถามที่เปิดใช้งาน</p>}
              {isTeam && fullQuestions === null && <p className="mt-2 text-sm text-ink-soft">กำลังโหลดคำถาม…</p>}
              {warnings.length === 0 && active.length > 0 && <p className="mt-2 text-sm font-semibold text-mint-deep">ข้อมูลครบทุกข้อ พร้อมเริ่มเกม</p>}
              <ul className="mt-2 space-y-1">
                {warnings.map(({ q, w }) => (
                  <li key={q.id} className="flex items-start gap-2 text-sm text-butter-deep"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />ข้อ {q.id} {q.topic}: {w.join(', ')}</li>
                ))}
              </ul>
              {!canStart && <p className="mt-3 text-sm text-ink-soft">ต้องมีผู้เล่นอย่างน้อย {room.settings.minPlayers} คนจึงจะเริ่มเกมได้</p>}
            </section>
          )}
        </div>
      </div>
      {dialogs}
    </div>
  );
}
