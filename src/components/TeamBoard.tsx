import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Flag, Lightbulb,
  Maximize2, Pause, Play, RotateCcw, Send, Shuffle, Trash2, XCircle,
  HelpCircle, Music, Volume2, VolumeX, Settings, X
} from 'lucide-react';
import type { Question, Room, TeamState } from '../types';
import { gameService } from '../services/gameService';
import { allPieceIds, clampPieceCount, DEFAULT_PIECES, isValidPieceId, pickRandomHiddenPiece } from '../services/puzzleService';
import JigsawBoard from './JigsawBoard';
import ConfirmDialog from './ConfirmDialog';
import { toast } from './Toast';
import { soundService } from '../services/soundService';

interface Props {
  room: Room;
  uid: string;
  isHost: boolean;
  onFinish?: () => Promise<void> | void;
  onCloseRoom?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenSettings?: () => void;
}

type Pending = null | 'revealAll' | 'reset' | 'finish' | 'next-last' | 'close';
type InfoPanel = null | 'hint' | 'solution' | 'wrong';
interface IncorrectAnswer {
  id: string;
  questionId: number;
  text: string;
  at: number;
}

export function getActiveQuestions(room: Room): Question[] {
  return (room.questions || []).filter(q => q.enabled !== false);
}

function readIncorrectAnswers(roomId: string): IncorrectAnswer[] {
  try {
    const value = sessionStorage.getItem(`arena-team-wrong-${roomId}`);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as IncorrectAnswer[] : [];
  } catch (error) {
    console.warn('Could not restore incorrect answers from this session:', error);
    return [];
  }
}

function formatClock(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export default function TeamBoard({ room, uid, isHost, onFinish, onCloseRoom, onOpenHowToPlay, onOpenSettings }: Props) {
  const active = useMemo(() => getActiveQuestions(room), [room]);
  const team: TeamState = room.team || gameService.initialTeamState();
  const index = Math.min(Math.max(0, team.currentIndex), Math.max(0, active.length - 1));
  const question = active[index];
  const pieceCount = clampPieceCount(question?.pieceCount ?? DEFAULT_PIECES);
  const revealed = useMemo(() => (question ? team.revealed?.[question.id] ?? [] : []), [team.revealed, question]);
  const hintThreshold = Math.min(Math.max(0, room.settings.minPiecesForHint ?? 5), pieceCount);
  const solved = question ? team.solved?.[question.id] : undefined;
  const running = room.status === 'running';
  const paused = room.status === 'paused';
  const lastIndex = index >= active.length - 1;
  const timerEnabled = room.settings.timerEnabled !== false;
  const configuredSeconds = room.settings.questionTimeSeconds || 60;

  const [privateQs, setPrivateQs] = useState<Question[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [answer, setAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<{ kind: 'correct' | 'wrong' | 'error'; text: string } | null>(null);
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>(() => readIncorrectAnswers(room.roomId));
  const [infoPanel, setInfoPanel] = useState<InfoPanel>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(soundService.getIsMuted());
  const [musicPlaying, setMusicPlaying] = useState(soundService.getIsBgmPlaying());
  const [clockNow, setClockNow] = useState(Date.now());
  const gameRootRef = useRef<HTMLElement>(null);
  const infoCloseRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);
  const autoSolved = useRef(new Set<string>());
  const shownSolutionKey = useRef<string | null>(null);

  useEffect(() => {
    setIncorrectAnswers(readIncorrectAnswers(room.roomId));
  }, [room.roomId]);

  useEffect(() => {
    setAnswer('');
    setAnswerFeedback(null);
    setInfoPanel(null);
  }, [question?.id]);

  useEffect(() => {
    if (!solved || !question) return;
    const key = `${question.id}:${solved.at}`;
    if (shownSolutionKey.current === key) return;
    shownSolutionKey.current = key;
    setInfoPanel('solution');
  }, [question?.id, solved?.at]);

  useEffect(() => {
    if (!infoPanel) return;
    infoCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInfoPanel(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [infoPanel]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`arena-team-wrong-${room.roomId}`, JSON.stringify(incorrectAnswers));
    } catch (error) {
      console.warn('Could not persist incorrect answers to this session:', error);
    }
  }, [incorrectAnswers, room.roomId]);

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(document.fullscreenElement === gameRootRef.current);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  useEffect(() => {
    if (!isHost) return;
    let alive = true;
    setPrivateQs([]);
    gameService.getPrivateQuestions(room.roomId)
      .then(list => {
        if (alive && list) setPrivateQs(list);
        else if (alive) toast('ยังไม่พบชุดเฉลยของห้องนี้', 'error');
      })
      .catch(error => {
        console.error('Could not load private team answers:', error);
        if (alive) toast('ไม่สามารถโหลดเฉลยได้ กรุณาลองอีกครั้ง', 'error');
      });
    return () => { alive = false; };
  }, [isHost, room.roomId, room.questionSetVersion]);

  const privateQ = question ? privateQs.find(q => q.id === question.id) : undefined;
  const storedRemaining = Math.max(0, team.remainingTimeSeconds ?? configuredSeconds);
  const startAt = team.currentQuestionStartedAt;
  const timeLeft = !timerEnabled ? null : running && startAt
    ? Math.max(0, storedRemaining - Math.floor((clockNow - startAt) / 1000))
    : storedRemaining;

  useEffect(() => {
    if (!timerEnabled || !running || !startAt || solved) return;
    const tick = () => setClockNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timerEnabled, running, startAt, solved]);

  useEffect(() => {
    if (!isHost || !timerEnabled || !running || startAt || solved) return;
    void gameService.teamStartTimer(room.roomId, storedRemaining).catch(error => {
      console.error('Could not initialize the Teamwork question timer:', error);
      toast('เริ่มตัวจับเวลาไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ', 'error');
    });
  }, [isHost, timerEnabled, running, startAt, solved, room.roomId, storedRemaining]);

  const run = async (fn: () => Promise<void>, okMessage?: string) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
      if (okMessage) toast(okMessage, 'success');
      return true;
    } catch (error) {
      console.error('Teamwork action failed:', error);
      toast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error');
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const solve = (via: 'answer' | 'host', by?: { uid: string; displayName: string }, text?: string) => {
    if (!question || solved) return Promise.resolve();
    const src = privateQ || question;
    return gameService.updateRoom(room.roomId, {
      [`team.revealed.${question.id}`]: allPieceIds(pieceCount),
      [`team.solved.${question.id}`]: {
        answer: src.acceptedAnswers[0] || text || '',
        knowledge: src.knowledge || '',
        at: Date.now(),
        via,
        ...(by ? { solvedBy: by.uid, solvedByName: by.displayName } : {})
      },
      'team.updatedAt': Date.now()
    });
  };

  useEffect(() => {
    if (!isHost || !running || !question || solved || !privateQ || autoSolved.current.has(`${question.id}`)) return;
    for (const player of Object.values(room.players || {})) {
      const submitted = player.teamAnswers?.[question.id];
      if (submitted && submitted.at > (team.resetAt?.[question.id] ?? 0)
        && gameService.checkAnswer(submitted.text, privateQ.acceptedAnswers)) {
        autoSolved.current.add(`${question.id}`);
        void solve('answer', { uid: player.uid, displayName: player.displayName }, submitted.text)
          .then(() => toast(`${player.displayName} ตอบถูกต้อง!`, 'success'))
          .catch(error => {
            console.error('Could not record correct team answer:', error);
            autoSolved.current.delete(`${question.id}`);
          });
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, running, question, solved, privateQ, room.players]);

  useEffect(() => {
    if (!isHost || !running || !timerEnabled || timeLeft !== 0 || !question || solved || busy) return;
    const key = `${question.id}:${team.resetAt?.[question.id] ?? 0}`;
    if (autoSolved.current.has(key)) return;
    autoSolved.current.add(key);
    void run(() => solve('host'), 'หมดเวลา — เปิดภาพเฉลยแล้ว')
      .then(ok => { if (!ok) autoSolved.current.delete(key); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, running, timerEnabled, timeLeft, question, solved, busy]);

  if (!question) {
    return <div className="card m-4 p-8 text-center text-ink-soft">ยังไม่มีคำถามที่เปิดใช้งานในห้องนี้</div>;
  }

  const revealOne = (id: number) => {
    if (!isHost || !running || solved || busy || !isValidPieceId(id, pieceCount) || revealed.includes(id)) return;
    void run(() => gameService.teamSetRevealed(room.roomId, question.id, [...revealed, id]));
  };

  const randomReveal = () => {
    if (!running || solved) return;
    const id = pickRandomHiddenPiece(pieceCount, revealed);
    if (id === null) { toast('เปิดจิ๊กซอว์ครบทุกชิ้นแล้ว', 'info'); return; }
    void run(() => gameService.teamSetRevealed(room.roomId, question.id, [...revealed, id]), `เปิดชิ้นที่ ${id} แล้ว`);
  };

  const toggleHint = () => {
    if (team.hintVisible) {
      setInfoPanel('hint');
      return;
    }
    if (!running || revealed.length < hintThreshold) return;
    const text = privateQ?.hint || '';
    if (!text.trim()) { toast('ข้อนี้ยังไม่ได้ตั้งคำใบ้ในหน้าแก้ไขคำถาม', 'error'); return; }
    void run(() => gameService.teamSetHint(room.roomId, true, text)).then(ok => {
      if (ok) setInfoPanel('hint');
    });
  };

  const go = (target: number) => {
    if (!running || target < 0 || target >= active.length) return;
    setAnswer('');
    setAnswerFeedback(null);
    void run(() => gameService.teamSetIndex(room.roomId, target, timerEnabled, configuredSeconds));
  };

  useEffect(() => {
    if (!isHost || !running || busy || infoPanel || pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(event.code === 'Space' || event.key === ' ')) return;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (target instanceof HTMLElement && (
        target.isContentEditable
        || target.matches('input, textarea, select, button, [role="dialog"], [role="alertdialog"]')
        || target.closest('[role="dialog"], [role="alertdialog"]')
      )) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      event.preventDefault();
      if (lastIndex) setPending('next-last');
      else go(index + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHost, running, busy, infoPanel, pending, lastIndex, index, go]);

  const submitAnswer = async (event: FormEvent) => {
    event.preventDefault();
    const text = answer.trim();
    if (!text || busyRef.current || !running || solved) return;
    if (!isHost) {
      const ok = await run(() => gameService.submitTeamAnswer(room.roomId, uid, question.id, text), 'ส่งคำตอบแล้ว');
      if (ok) setAnswer('');
      return;
    }
    if (!privateQ) {
      setAnswerFeedback({ kind: 'error', text: 'ยังโหลดเฉลยไม่สำเร็จ จึงตรวจคำตอบไม่ได้' });
      return;
    }
    if (gameService.checkAnswer(text, privateQ.acceptedAnswers)) {
      const ok = await run(() => solve('answer', undefined, text), 'ตอบถูกต้อง — เปิดภาพเฉลยแล้ว');
      if (ok) {
        setAnswer('');
        setAnswerFeedback({ kind: 'correct', text: 'คำตอบถูกต้อง แสดงภาพเฉลยแล้ว' });
      }
      return;
    }
    const now = Date.now();
    setIncorrectAnswers(previous => [{
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      questionId: question.id,
      text,
      at: now
    }, ...previous]);
    setAnswer('');
    setAnswerFeedback({ kind: 'wrong', text: 'คำตอบยังไม่ถูก เพิ่มลงในรายการคำตอบผิดแล้ว' });
  };

  const pauseOrResume = () => {
    if (paused) {
      void run(() => gameService.teamResume(room.roomId, timerEnabled));
      return;
    }
    const remaining = timerEnabled ? (timeLeft ?? configuredSeconds) : configuredSeconds;
    void run(() => gameService.teamPause(room.roomId, remaining));
  };

  const confirmPending = () => {
    const action = pending;
    setPending(null);
    if (action === 'revealAll') void run(() => solve('host'), 'เปิดภาพทั้งหมดแล้ว');
    if (action === 'reset') void run(() => gameService.teamResetQuestion(
      room.roomId, question.id, timerEnabled, configuredSeconds, running
    ).then(() => { autoSolved.current.clear(); }), 'รีเซ็ตข้อนี้แล้ว');
    if (action === 'finish' || action === 'next-last') void run(async () => { await onFinish?.(); });
    if (action === 'close') onCloseRoom?.();
  };

  const hintVisible = team.hintVisible && !!team.hintText;
  const canAskHint = running && revealed.length >= hintThreshold && !!privateQ?.hint?.trim() && !solved;

  return (
    <main ref={gameRootRef} className={`team-game-shell ${fullscreen ? 'team-game-shell-fullscreen' : ''}`}>
      <div className="team-game-content">
        <header className="team-control-bar">
          <div className="team-control-question">
            <span className="badge badge-lavender shrink-0">ข้อ {index + 1}/{active.length}</span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-lg">{question.topic}</h1>
              <p className="text-xs text-ink-soft">
                {revealed.length}/{pieceCount} ชิ้น
                <span className="team-status-label"> · {running ? 'กำลังเล่น' : paused ? 'หยุดชั่วคราว' : room.status}</span>
              </p>
            </div>
          </div>
          {isHost && <div className="team-top-navigation" aria-label="เปลี่ยนคำถาม">
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy || !running || index === 0}
              onClick={() => go(index - 1)} aria-label="ข้อก่อนหน้า"><ChevronLeft size={17} aria-hidden /></button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy || !running}
              onClick={() => lastIndex ? setPending('next-last') : go(index + 1)} aria-label={lastIndex ? 'จบคำถาม' : 'ข้อต่อไป'}>
              {lastIndex ? <Flag size={17} aria-hidden /> : <ChevronRight size={17} aria-hidden />}
            </button>
          </div>}
          <div className={`team-clock ${timerEnabled && timeLeft !== null && timeLeft <= 10 && running ? 'team-clock-urgent' : ''}`}
            role="timer" aria-live="off" aria-label={timerEnabled ? `เหลือเวลา ${formatClock(timeLeft)}` : 'ไม่จำกัดเวลา'}>
            <Clock3 size={18} aria-hidden /><span>{formatClock(timerEnabled ? timeLeft : null)}</span>
            {paused && <small>พัก</small>}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
            const target = gameRootRef.current;
            if (document.fullscreenElement === target) void document.exitFullscreen();
            else if (target && document.fullscreenEnabled) {
              void target.requestFullscreen().catch(error => {
                console.error('Could not enter fullscreen:', error);
                toast('เปิดเต็มหน้าจอไม่สำเร็จ กรุณาอนุญาตจากเบราว์เซอร์แล้วลองอีกครั้ง', 'error');
              });
            } else toast('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอ', 'error');
          }} aria-label={fullscreen ? 'ออกจากเต็มหน้าจอ' : 'เปิดเต็มหน้าจอ'}>
            <Maximize2 size={16} aria-hidden /><span className="hidden md:inline">{fullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}</span>
          </button>
          {fullscreen && <div className="team-fullscreen-utilities">
            <button type="button" className="btn btn-secondary btn-sm !px-2.5" aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
              onClick={() => setMuted(soundService.toggleMute())}>{muted ? <VolumeX size={17} aria-hidden /> : <Volume2 size={17} aria-hidden />}</button>
            <button type="button" className={`btn btn-sm !px-2.5 ${musicPlaying ? 'btn-primary' : 'btn-secondary'}`}
              aria-label={musicPlaying ? 'ปิดเพลงพื้นหลัง' : 'เปิดเพลงพื้นหลัง'} aria-pressed={musicPlaying}
              onClick={async () => setMusicPlaying(await soundService.toggleBgm())}><Music size={17} aria-hidden /></button>
            <button type="button" className="btn btn-secondary btn-sm !px-2.5" aria-label="วิธีเล่น" onClick={() => {
              const exitFullscreen = document.fullscreenElement ? document.exitFullscreen() : Promise.resolve();
              void exitFullscreen.then(() => onOpenHowToPlay?.()).catch(error => {
                console.error('Could not exit fullscreen before opening help:', error);
                toast('ออกจากเต็มหน้าจอไม่สำเร็จ กรุณากด Escape แล้วลองอีกครั้ง', 'error');
              });
            }}>
              <HelpCircle size={17} aria-hidden />
            </button>
            {isHost && <button type="button" className="btn btn-secondary btn-sm !px-2.5" aria-label="แก้ไขคำถามและตั้งค่า" onClick={() => {
              const exitFullscreen = document.fullscreenElement ? document.exitFullscreen() : Promise.resolve();
              void exitFullscreen.then(() => onOpenSettings?.()).catch(error => {
                console.error('Could not exit fullscreen before opening settings:', error);
                toast('ออกจากเต็มหน้าจอไม่สำเร็จ กรุณากด Escape แล้วลองอีกครั้ง', 'error');
              });
            }}><Settings size={17} aria-hidden /></button>}
          </div>}
          {isHost && <button type="button" className={`btn btn-sm ${paused ? 'btn-primary' : 'btn-peach'}`} disabled={busy || room.status === 'finished'}
            onClick={pauseOrResume} aria-label={paused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}>
            {paused ? <Play size={17} aria-hidden /> : <Pause size={17} aria-hidden />}
            <span className="hidden lg:inline">{paused ? 'เล่นต่อ' : 'พัก'}</span>
          </button>}
          {isHost && <button type="button" className="btn btn-secondary btn-sm" disabled={busy}
            onClick={() => setPending('reset')} aria-label="รีเซ็ตคำถาม"><RotateCcw size={17} aria-hidden /></button>}
          {isHost && <button type="button" className="btn btn-danger btn-sm" disabled={busy}
            onClick={() => setPending('finish')} aria-label="จบเกม"><Flag size={17} aria-hidden /><span className="hidden lg:inline">จบเกม</span></button>}
          {isHost && <button type="button" className="btn btn-danger btn-sm" disabled={busy}
            onClick={() => setPending('close')} aria-label="ปิดห้อง"><XCircle size={16} aria-hidden /><span className="hidden xl:inline">ปิดห้อง</span></button>}
          {!isHost && <form onSubmit={submitAnswer} className="team-player-answer flex min-w-0 items-center gap-2">
            <label htmlFor="team-answer" className="sr-only">คำตอบของคุณ</label>
            <input id="team-answer" className="input min-w-0" value={answer} maxLength={120}
              onChange={event => setAnswer(event.target.value)} disabled={!running || !!solved || busy} placeholder="พิมพ์คำตอบ…" />
            <button type="submit" className="btn btn-primary btn-sm shrink-0" disabled={!answer.trim() || !running || !!solved || busy}>
              <Send size={16} aria-hidden /><span className="hidden sm:inline">ส่ง</span>
            </button>
          </form>}
          {isHost && <div className="team-action-bar" role="toolbar" aria-label="การควบคุมกระดาน">
          <form onSubmit={submitAnswer} className="team-host-answer flex min-w-0 items-center gap-2">
            <label htmlFor="team-answer" className="sr-only">บันทึกคำตอบจากนักเรียน</label>
            <input id="team-answer" className="input min-w-0" value={answer} maxLength={120}
              onChange={event => setAnswer(event.target.value)} disabled={!running || !!solved || busy} placeholder="คำตอบจากนักเรียน…" />
            <button type="submit" className="btn btn-primary btn-sm shrink-0" disabled={!answer.trim() || !running || !!solved || busy}>
              <Send size={16} aria-hidden /><span>ตรวจ</span>
            </button>
          </form>
          <button type="button" className="btn btn-sky btn-sm" disabled={busy || !running || !!solved || revealed.length >= pieceCount}
            onClick={randomReveal}><Shuffle size={16} aria-hidden /><span>สุ่มเปิด</span></button>
          <button type="button" className="btn btn-butter btn-sm" disabled={busy || (!hintVisible && !canAskHint)}
            onClick={toggleHint}><Lightbulb size={16} aria-hidden /><span>{hintVisible ? 'คำใบ้' : 'เปิดคำใบ้'}</span></button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy || !running || !!solved}
            onClick={() => setPending('revealAll')}><Eye size={16} aria-hidden /><span>เฉลย</span></button>
          </div>}
        </header>

        <div className="team-workspace">
          <section className="team-puzzle-column" aria-label="กระดานจิ๊กซอว์">
            <JigsawBoard
              imageFileName={question.imageFileName}
              pieceCount={pieceCount}
              revealedPieceIds={revealed}
              onRevealPiece={isHost ? revealOne : undefined}
              disabled={!running || !!solved || busy}
              fullscreenTargetRef={gameRootRef}
              hideFullscreenControl
              label={`ข้อ ${index + 1}`}
              footer={undefined}
            />
          </section>

          <aside className="team-side-rail" aria-label="เปิดดูข้อมูลเพิ่มเติม">
            <button type="button" className="btn btn-butter" disabled={!hintVisible && !canAskHint}
              onClick={toggleHint}><Lightbulb size={18} aria-hidden /><span>คำใบ้</span></button>
            {solved && <button type="button" className="btn btn-primary" onClick={() => setInfoPanel('solution')}>
              <BookOpen size={18} aria-hidden /><span>เฉลย</span></button>}
            {isHost && <button type="button" className="btn btn-secondary" onClick={() => setInfoPanel('wrong')}>
              <XCircle size={18} aria-hidden /><span>คำตอบผิด</span><b>{incorrectAnswers.length}</b></button>}
          </aside>
        </div>

        {answerFeedback && isHost && <p role="status" className={`team-answer-feedback ${answerFeedback.kind === 'correct' ? 'text-mint-deep' : answerFeedback.kind === 'wrong' ? 'text-coral-deep' : 'text-butter-deep'}`}>
          {answerFeedback.text}
        </p>}
        {!isHost && room.players?.[uid]?.teamAnswers?.[question.id] && !solved &&
          <p className="team-player-feedback text-sm text-ink-soft">ส่งล่าสุด: “{room.players[uid].teamAnswers?.[question.id]?.text}” — รอโฮสต์ตรวจ</p>}

        {infoPanel && (
          <div className="team-info-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setInfoPanel(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="team-info-title" className={`team-info-dialog ${infoPanel === 'hint' ? 'team-info-hint' : infoPanel === 'solution' ? 'team-info-solution' : ''}`}>
              <header className="team-info-header">
                <div>
                  <span className="badge badge-lavender">ข้อ {index + 1}/{active.length}</span>
                  <h2 id="team-info-title" className="mt-2 text-xl font-bold sm:text-2xl">
                    {infoPanel === 'hint' ? 'คำใบ้' : infoPanel === 'solution' ? 'เฉลยคำตอบ' : 'รายการคำตอบผิด'}
                  </h2>
                </div>
                <button ref={infoCloseRef} type="button" className="btn btn-secondary btn-sm" aria-label="ปิดหน้าต่าง" onClick={() => setInfoPanel(null)}>
                  <X size={19} aria-hidden /><span className="hidden sm:inline">ปิด</span>
                </button>
              </header>
              {infoPanel === 'hint' && (
                <div className="team-info-body">
                  <Lightbulb size={34} className="text-butter-deep" aria-hidden />
                  <p className="team-info-emphasis">{team.hintText || privateQ?.hint || 'ไม่พบคำใบ้สำหรับข้อนี้'}</p>
                  <p className="text-sm text-ink-soft">คำใบ้นี้จะยังเปิดดูซ้ำได้จากปุ่ม “คำใบ้” ด้านข้าง</p>
                </div>
              )}
              {infoPanel === 'solution' && solved && (
                <div className="team-info-body">
                  <div className="team-solution-answer"><CheckCircle2 size={30} aria-hidden /><div>
                    <p className="text-sm font-bold">คำตอบ</p>
                    <p className="team-info-emphasis">{solved.answer || privateQ?.acceptedAnswers[0] || 'เฉลยยังไม่พร้อม'}</p>
                  </div></div>
                  {solved.solvedByName && <p className="text-sm text-ink-soft">ตอบถูกโดย {solved.solvedByName}</p>}
                  {solved.knowledge && <div className="team-knowledge-box"><h3 className="mb-2 flex items-center gap-2 font-bold"><BookOpen size={18} aria-hidden />เกร็ดความรู้</h3><p>{solved.knowledge}</p></div>}
                  <p className="text-sm text-ink-soft">ปิดหน้าต่างได้ แล้วเปิดดูเฉลยอีกครั้งจากปุ่มด้านข้าง</p>
                </div>
              )}
              {infoPanel === 'wrong' && (
                <div className="team-info-body">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">คำตอบที่นักเรียนเสนอแล้วไม่ตรงกับเฉลย</p>
                    <button type="button" className="btn btn-sm btn-secondary" disabled={!incorrectAnswers.length}
                      onClick={() => setIncorrectAnswers([])}><Trash2 size={14} aria-hidden />ล้างรายการ</button>
                  </div>
                  {incorrectAnswers.length === 0 ? <p className="rounded-xl bg-cream/70 px-3 py-6 text-center text-ink-soft">ยังไม่มีคำตอบผิด</p> : (
                    <ul className="team-wrong-list">
                      {incorrectAnswers.map(item => (
                        <li key={item.id}><XCircle size={17} className="mt-0.5 shrink-0 text-coral-deep" aria-hidden /><span className="min-w-0 flex-1 break-words">{item.text}
                          <small>ข้อ {active.findIndex(q => q.id === item.questionId) + 1 || '—'} · {new Date(item.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</small>
                        </span></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        <ConfirmDialog
          open={pending !== null}
          danger={pending !== 'revealAll'}
          title={pending === 'revealAll' ? 'เปิดทุกชิ้นและเฉลยข้อนี้?' : pending === 'reset' ? 'รีเซ็ตข้อนี้?' : pending === 'close' ? 'ปิดห้องเกม?' : 'จบเกมและแสดงสรุปผล?'}
          confirmLabel={pending === 'reset' ? 'รีเซ็ตข้อนี้' : pending === 'revealAll' ? 'เปิดทั้งหมด' : pending === 'close' ? 'ปิดห้อง' : 'จบเกม'}
          busy={busy}
          onConfirm={confirmPending}
          onCancel={() => setPending(null)}
        >
          {pending === 'reset' ? 'ชิ้นที่เปิดไว้ เฉลย และคำใบ้ของข้อนี้จะถูกล้าง พร้อมเริ่มเวลาใหม่ (ถ้าเปิดจับเวลา)' :
            pending === 'revealAll' ? 'ผู้เล่นทุกคนจะเห็นภาพเต็มและเฉลยทันที' :
              pending === 'close' ? 'ห้องจะถูกปิดและผู้เล่นจะไม่สามารถเล่นต่อได้' :
                'ผู้เล่นทุกคนจะเห็นหน้าสรุปผลและไม่สามารถเล่นต่อได้'}
        </ConfirmDialog>
      </div>
    </main>
  );
}
