import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onIdTokenChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { AlertCircle, BookOpen, CheckCircle2, CircleHelp, Crown, Gamepad2, LogIn, Plus, ShieldCheck, Sparkles, Users, Wifi, WifiOff } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { gameService, DEFAULT_ROOM_SETTINGS } from './services/gameService';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import { EMOJI_AVATARS } from './data/emojis';
import { Room, RoomPlayer, PlayerProgress, Question } from './types';
import { Navbar } from './components/Navbar';
import { HostAuthModal } from './components/HostAuthModal';
import { HostRoomSetup } from './components/HostRoomSetup';
import { HostDashboard } from './components/HostDashboard';
import { PlayerLobby } from './components/PlayerLobby';
import { JigsawBoard3D } from './components/JigsawBoard3D';
import { KnowledgeModal } from './components/KnowledgeModal';
import { PodiumLeaderboard } from './components/PodiumLeaderboard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { KnowledgeArchiveModal } from './components/KnowledgeArchiveModal';
import { soundService } from './services/soundService';

type AppUser = { uid: string; email?: string | null; displayName: string; photoURL?: string | null; isHost?: boolean };
type View = 'lobby' | 'host-setup' | 'host' | 'player-lobby' | 'game' | 'results';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [view, setView] = useState<View>('lobby');
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState(new URLSearchParams(window.location.search).get('room') || '');
  const [roomName, setRoomName] = useState('Social Science Challenge');
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(40);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hostModal, setHostModal] = useState(false);
  const [howToPlay, setHowToPlay] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [randomize, setRandomize] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showKnowledgeArchive, setShowKnowledgeArchive] = useState(false);
  const [localProgress, setLocalProgress] = useState<Record<number, PlayerProgress>>({});
  const [connection, setConnection] = useState(navigator.onLine);
  const autoAdvanceTimeout = useRef<number | null>(null);
  const handledDeadlineQuestion = useRef<number | null>(null);
  const autoAdvancePending = useRef(false);

  useEffect(() => onIdTokenChanged(auth, async u => {
    setFirebaseUser(u);
    if (u) {
      try {
        const isHost = u.isAnonymous;
        setCurrentUser({
          uid: u.uid,
          email: u.email,
          displayName: u.isAnonymous ? 'Host' : u.displayName || 'ผู้เล่น',
          photoURL: u.photoURL,
          isHost
        });
      } catch {
        setCurrentUser({
          uid: u.uid,
          email: u.email,
          displayName: u.isAnonymous ? 'Host' : u.displayName || 'ผู้เล่น',
          photoURL: u.photoURL,
          isHost: u.isAnonymous
        });
      }
    } else {
      setCurrentUser(null);
    }
  }), []);
  useEffect(() => {
    const online = () => setConnection(true), offline = () => setConnection(false);
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);
  useEffect(() => {
    if (!room?.roomId) return;
    return gameService.subscribeToRoom(room.roomId, latest => { if (latest) setRoom(latest); });
  }, [room?.roomId]);
  const player = room && currentUser ? room.players?.[currentUser.uid] : undefined;
  const questionIndex = player?.currentQuestion || 1;
  const question = room?.questions?.find(q => q.id === questionIndex) || room?.questions?.[questionIndex - 1];
  const progress = (player?.progress?.[question?.id || questionIndex] || localProgress[question?.id || questionIndex] || null) as PlayerProgress | null;
  const revealed = progress?.revealedPieceIds || [];
  const answered = !!progress?.answeredCorrectly;
  const isHostOfRoom = !!(room && currentUser && room.hostUid === currentUser.uid && currentUser.isHost);

  useEffect(() => {
    if (!room || !currentUser || currentUser.uid === room.hostUid) return;

    const joined = room.players?.[currentUser.uid]?.ready;
    if (!joined) return;

    if ((room.status === 'running' || room.status === 'paused') && view === 'player-lobby') {
      setView('game');
      setNotice(room.status === 'paused' ? 'โฮสต์พักเกมไว้ชั่วคราว คุณกลับมาเล่นต่อได้เมื่อโฮสต์เริ่มอีกครั้ง' : 'โฮสต์เริ่มเกมแล้ว ขอให้สนุกกับการเล่น!');
    } else if (room.status === 'finished' && view === 'game') {
      setView('results');
      setShowKnowledgeArchive(true);
    } else if (room.status === 'cancelled' && view === 'player-lobby') {
      setView('lobby');
      setNotice('ห้องเกมนี้ถูกปิดโดยโฮสต์แล้ว');
    }
  }, [room, currentUser, view]);

  useEffect(() => {
    if (view === 'game' && (progress?.answerStatus === 'correct' || progress?.answerStatus === 'timeout')) {
      setShowKnowledge(true);
    }
  }, [view, question?.id, progress?.answerStatus]);

  const nextQuestion = useCallback(async (automatic = false) => {
    if (!room || !currentUser || !question) return;
    if (room.status !== 'running') {
      if (automatic && room.status === 'paused') autoAdvancePending.current = true;
      return;
    }
    autoAdvancePending.current = false;
    if (autoAdvanceTimeout.current !== null) {
      window.clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }
    handledDeadlineQuestion.current = null;
    const nextId = questionIndex + 1;
    try {
      await gameService.advancePlayerQuestion(room.roomId, currentUser.uid, nextId);
      setShowKnowledge(false); setShowHint(false); setAnswer(''); setNotice('');
      if (nextId > room.questions.length) {
        setView('results');
        setShowKnowledgeArchive(true);
        return;
      }
      setTimeLeft(room.settings.questionTimeSeconds);
    } catch (error) {
      console.error('Could not advance player question:', error);
      setNotice('บันทึกการเปลี่ยนข้อไม่สำเร็จ โปรดตรวจการเชื่อมต่อแล้วกดลองอีกครั้ง');
    }
  }, [room, currentUser, question, questionIndex]);

  useEffect(() => {
    if (view !== 'game' || !room || !player || !question || room.status === 'paused') return;
    if (room.status !== 'running') return;
    let lastUrgentTick = -1;
    const tick = () => {
      const now = Date.now();
      const qStart = player.currentQuestionStartedAt || room.startedAt || now;
      const pausedAt = room.status === 'paused' ? room.pausedAt || now : now;
      const pausedBeforeQuestion = Math.max(0, (room.totalPausedMilliseconds || 0) - (player.pauseBaselineMilliseconds || 0));
      const elapsed = Math.max(0, pausedAt - qStart - pausedBeforeQuestion);
      const seconds = Math.max(0, room.settings.questionTimeSeconds - Math.floor(elapsed / 1000));
      setTimeLeft(seconds);
      if (seconds > 0 && seconds <= 10 && seconds !== lastUrgentTick) {
        soundService.playTick(true);
        lastUrgentTick = seconds;
      }
      if (seconds === 0 && handledDeadlineQuestion.current !== question.id) {
        handledDeadlineQuestion.current = question.id;
        if (progress?.answeredCorrectly) {
          if (showKnowledge) {
            autoAdvanceTimeout.current = window.setTimeout(() => {
              void nextQuestion(true);
            }, 1000);
          }
          return;
        }
        if (progress?.answerStatus === 'timeout') {
          setShowKnowledge(true);
          autoAdvanceTimeout.current = window.setTimeout(() => {
            void nextQuestion(true);
          }, 1500);
          return;
        }
        soundService.playTimeUp();
        const timedOut: PlayerProgress = { ...(progress || { questionId: question.id, piecesRevealed: revealed.length, revealedPieceIds: revealed, attemptCount: 0, wrongAttemptCount: 0, answeredCorrectly: false, answerStatus: 'unanswered' as const, questionScore: 0, hintUsed: false, knowledgeRead: false }), answerStatus: 'timeout' };
        setLocalProgress(p => ({ ...p, [question.id]: timedOut }));
        setShowKnowledge(true);
        void gameService.updatePlayerProgress({
          roomId: room.roomId,
          uid: currentUser?.uid || player.uid,
          questionId: question.id,
          progressUpdate: timedOut
        }).catch(error => {
          console.error('Could not save timed-out question:', error);
          setNotice('หมดเวลา แต่บันทึกสถานะไม่สำเร็จ โปรดตรวจการเชื่อมต่อก่อนเล่นต่อ');
        });
        autoAdvanceTimeout.current = window.setTimeout(() => {
          void nextQuestion(true);
        }, 1500);
      }
    };
    tick(); const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [view, room, player, question, progress, revealed.length, currentUser, nextQuestion, showKnowledge]);

  useEffect(() => {
    if (room?.status === 'running' && autoAdvancePending.current) {
      void nextQuestion(true);
    }
  }, [room?.status, nextQuestion]);

  useEffect(() => () => {
    if (autoAdvanceTimeout.current !== null) window.clearTimeout(autoAdvanceTimeout.current);
  }, []);

  const loginGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    setCurrentUser({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName || 'ผู้เล่น', photoURL: cred.user.photoURL, isHost: false });
    return cred.user;
  };
  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null); setCurrentUser(null); setRoom(null); setView('lobby');
  };
  const createRoom = async () => {
    if (!currentUser?.isHost) { setHostModal(true); return; }
    setLoading(true); setNotice('');
    try {
      const made = await gameService.createRoom({ hostUid: currentUser.uid, hostEmail: currentUser.email || undefined, name: roomName.trim() || 'Social Science Challenge', customSettings: { ...DEFAULT_ROOM_SETTINGS, minPlayers, maxPlayers, randomizeQuestionOrder: randomize }, customQuestions: questions });
      setRoom(made); setRoomCode(made.roomId); setView('host');
      const url = new URL(window.location.href); url.searchParams.set('room', made.roomId); window.history.replaceState({}, '', url);
    } catch (e: any) { setNotice(e?.message || 'สร้างห้องไม่สำเร็จ'); }
    finally { setLoading(false); }
  };
  const enterRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setNotice('กรุณากรอกรหัสห้อง'); return; }
    setLoading(true); setNotice('');
    try {
      const found = await gameService.getRoom(code);
      if (!found) { setNotice('ไม่พบห้องนี้ ตรวจสอบรหัสห้องอีกครั้ง'); return; }
      setShowKnowledgeArchive(false);
      setRoom(found);
      if (currentUser && found.hostUid === currentUser.uid && currentUser.isHost) {
        setView('host');
      } else if (currentUser && found.players?.[currentUser.uid]?.ready && (found.status === 'running' || found.status === 'paused')) {
        setView('game');
      } else if (currentUser && found.players?.[currentUser.uid]?.ready && found.status === 'finished') {
        setView('results');
        setShowKnowledgeArchive(true);
      } else if (found.status === 'running' || found.status === 'paused' || found.status === 'finished') {
        setNotice('ห้องนี้เริ่มเกมแล้ว ไม่สามารถเข้าร่วมเป็นผู้เล่นใหม่ได้');
        setView('lobby');
      } else {
        setView('player-lobby');
      }
    } catch (e: any) { setNotice(e?.message || 'ไม่สามารถเข้าห้องได้'); }
    finally { setLoading(false); }
  };
  const joinPlayer = async (p: RoomPlayer) => {
    if (!room || !currentUser) return;
    const result = await gameService.joinRoom({ roomId: room.roomId, uid: currentUser.uid, displayName: p.displayName, photoURL: currentUser.photoURL || undefined, avatarEmoji: p.avatarEmoji, avatarBgColor: p.avatarBgColor });
    if (!result.success) throw new Error(result.error || 'เข้าห้องไม่สำเร็จ');
    if (result.room) setRoom(result.room);
    const joinedRoom = result.room || room;
    setView(joinedRoom.status === 'running' || joinedRoom.status === 'paused' ? 'game' : 'player-lobby');
  };
  const startGame = async () => {
    if (!room || !currentUser || room.hostUid !== currentUser.uid) return;
    if (Object.keys(room.players || {}).length < room.settings.minPlayers) { setNotice('จำนวนผู้เล่นยังไม่ถึงขั้นต่ำ'); return; }
    const startedAt = Date.now();
    const players = Object.fromEntries(Object.entries(room.players).map(([uid, roomPlayer]) => [uid, {
      ...roomPlayer,
      currentQuestionStartedAt: startedAt,
      pauseBaselineMilliseconds: 0
    }]));
    const started = await gameService.updateRoom(room.roomId, { status: 'running', acceptingPlayers: false, startedAt, currentRoundQuestion: 1, totalPausedMilliseconds: 0, players });
    if (started) setRoom(started);
    setNotice('เริ่มเกมแล้ว ผู้เล่นสามารถเริ่มทำข้อของตนเองได้');
  };
  const revealPiece = async (pieceId: number) => {
    if (!room || !currentUser || !question || answered || revealed.includes(pieceId) || room.status !== 'running') return;
    const ids = [...revealed, pieceId];
    const next: PlayerProgress = { ...(progress || { questionId: question.id, piecesRevealed: 0, revealedPieceIds: [], attemptCount: 0, wrongAttemptCount: 0, answeredCorrectly: false, answerStatus: 'unanswered', questionScore: 0, hintUsed: false, knowledgeRead: false }), piecesRevealed: ids.length, revealedPieceIds: ids };
    setLocalProgress(p => ({ ...p, [question.id]: next }));
    if (player) await gameService.updatePlayerProgress({ roomId: room.roomId, uid: currentUser.uid, questionId: question.id, progressUpdate: { piecesRevealed: ids.length, revealedPieceIds: ids } });
  };
  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || room.status !== 'running' || !currentUser || !question || !answer.trim() || answered) return;
    const attempts = (progress?.attemptCount || 0) + 1;
    const correct = gameService.checkAnswer(answer, question.acceptedAnswers);
    if (!correct) {
      soundService.playWrong();
      const wrong: PlayerProgress = { ...(progress || { questionId: question.id, piecesRevealed: revealed.length, revealedPieceIds: revealed, attemptCount: 0, wrongAttemptCount: 0, answeredCorrectly: false, answerStatus: 'unanswered', questionScore: 0, hintUsed: false, knowledgeRead: false }), attemptCount: attempts, wrongAttemptCount: (progress?.wrongAttemptCount || 0) + 1, answerStatus: 'unanswered' };
      setLocalProgress(p => ({ ...p, [question.id]: wrong })); setNotice('ยังไม่ถูกต้อง ลองสังเกตภาพอีกครั้งนะ'); return;
    }
    soundService.playCorrect();
    const score = gameService.calculateQuestionScore({ piecesRevealed: Math.max(1, revealed.length), timeRemainingSeconds: timeLeft, isCorrect: true, comboStreak: player?.comboStreak || 0, hintUsed: !!progress?.hintUsed, settings: room.settings });
    const nextCombo = (player?.comboStreak || 0) + 1;
    const next: PlayerProgress = { ...(progress || { questionId: question.id, piecesRevealed: revealed.length, revealedPieceIds: revealed, attemptCount: 0, wrongAttemptCount: 0, answeredCorrectly: false, answerStatus: 'unanswered', questionScore: 0, hintUsed: false, knowledgeRead: false }), attemptCount: attempts, answeredCorrectly: true, answerStatus: 'correct', questionScore: score.totalQuestionScore, answerTimestamp: Date.now(), submittedAnswer: answer };
    if (nextCombo >= 3) soundService.playCombo(nextCombo);
    setLocalProgress(p => ({ ...p, [question.id]: next })); setShowKnowledge(true); setNotice(`ตอบถูก! +${score.totalQuestionScore} คะแนน`);
    await gameService.updatePlayerProgress({ roomId: room.roomId, uid: currentUser.uid, questionId: question.id, progressUpdate: next, scoreDelta: score.totalQuestionScore, isCorrect: true, newCombo: nextCombo, responseTimeSeconds: room.settings.questionTimeSeconds - timeLeft });
  };
  const openHint = async () => {
    if (!room || room.status !== 'running' || !question || revealed.length < (room.settings.minPiecesForHint || 5) || progress?.hintUsed) return;
    const next = { ...(progress || { questionId: question.id, piecesRevealed: revealed.length, revealedPieceIds: revealed, attemptCount: 0, wrongAttemptCount: 0, answeredCorrectly: false, answerStatus: 'unanswered' as const, questionScore: 0, hintUsed: false, knowledgeRead: false }), hintUsed: true };
    setLocalProgress(p => ({ ...p, [question.id]: next })); setShowHint(true);
    if (room && currentUser && player) await gameService.updatePlayerProgress({ roomId: room.roomId, uid: currentUser.uid, questionId: question.id, progressUpdate: { hintUsed: true } });
  };
  const finishGame = async () => {
    if (room) { const updated = await gameService.updateRoom(room.roomId, { status: 'finished', finishedAt: Date.now() }); if (updated) setRoom(updated); }
    setView('results');
    setShowKnowledgeArchive(true);
  };
  const pauseGame = async () => {
    if (!room || room.status !== 'running') return;
    try {
      const paused = await gameService.updateRoom(room.roomId, { status: 'paused', pausedAt: Date.now() });
      if (paused) setRoom(paused);
    } catch (error) {
      console.error('Could not pause game:', error);
      setNotice('พักเกมไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง');
    }
  };
  const resumeGame = async () => {
    if (!room || room.status !== 'paused') return;
    const resumedAt = Date.now();
    const pauseDuration = Math.max(0, resumedAt - (room.pausedAt || resumedAt));
    const totalPausedMilliseconds = (room.totalPausedMilliseconds || 0) + pauseDuration;
    const players = Object.fromEntries(Object.entries(room.players || {}).map(([uid, roomPlayer]) => [uid, {
      ...roomPlayer,
      currentQuestionStartedAt: (roomPlayer.currentQuestionStartedAt || room.startedAt || resumedAt)
        + Math.max(0, (room.totalPausedMilliseconds || 0) - (roomPlayer.pauseBaselineMilliseconds || 0))
        + pauseDuration,
      pauseBaselineMilliseconds: totalPausedMilliseconds
    }]));
    try {
      const resumed = await gameService.updateRoom(room.roomId, {
        status: 'running',
        totalPausedMilliseconds,
        players
      });
      if (resumed) setRoom(resumed);
    } catch (error) {
      console.error('Could not resume game:', error);
      setNotice('เล่นเกมต่อไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง');
    }
  };
  const results = useMemo(() => room ? gameService.calculateFinalLeaderboard(room) : [], [room]);
  const saveQuestions = async (updated: Question[], shuffle: boolean) => {
    setQuestions(updated); setRandomize(shuffle); setEditorOpen(false);
    if (room && currentUser?.uid === room.hostUid) await gameService.updateRoom(room.roomId, { questions: shuffle ? [...updated].sort(() => Math.random() - .5) : updated, settings: { ...room.settings, randomizeQuestionOrder: shuffle } });
  };

  return <div className="min-h-screen text-[#F5F0E6] bg-[#0B1715]">
    <div className="fixed inset-0 pointer-events-none opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, #62F5C5 0, transparent 28%), radial-gradient(circle at 90% 70%, #D6B36A 0, transparent 25%)' }} />
    <div className="relative z-10">
      <Navbar currentUser={currentUser} onOpenHowToPlay={() => setHowToPlay(true)} onLogout={logout} onNavigateLobby={() => setView('lobby')} isHostView={view === 'host'} />
      {!connection && <div className="bg-amber-900/70 px-4 py-2 text-center text-sm"><WifiOff className="inline w-4 h-4 mr-2"/>การเชื่อมต่อขาดหาย — ความคืบหน้าออนไลน์อาจยังไม่ซิงก์</div>}
      {notice && <div role="status" className="mx-auto mt-4 max-w-5xl rounded-xl border border-amber-300/30 bg-amber-900/30 p-3 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0"/><span>{notice}</span><button className="ml-auto underline" onClick={() => setNotice('')}>ปิด</button></div>}
      {successMessage && <div role="status" aria-live="polite" className="mx-auto mt-4 flex max-w-5xl items-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-900/50 p-3 text-sm text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300"/><span>{successMessage}</span><button className="ml-auto underline" onClick={() => setSuccessMessage('')}>ปิด</button></div>}
      {view === 'lobby' && <main className="mx-auto max-w-7xl px-4 py-7 sm:py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#62F5C5]/20 bg-[#103B32]/35 shadow-2xl">
          <div className="absolute inset-0 opacity-[0.16] bg-cover bg-center" style={{backgroundImage:"url('/assets/Lobby.png')"}}/>
          <div className="relative grid lg:grid-cols-[1.1fr_.9fr] items-center gap-8 p-6 sm:p-10 lg:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#62F5C5]/30 bg-black/25 px-3 py-1 text-xs tracking-widest text-[#62F5C5]"><Sparkles size={14}/> MULTIPLAYER LEARNING ARENA</div>
              <div className="mt-5 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#D6B36A]/50 bg-[#D6B36A]/10 shadow-[0_0_35px_rgba(214,179,106,.18)]"><Gamepad2 size={34} className="text-[#D6B36A]"/></div><div><p className="text-xs uppercase tracking-[.3em] text-[#62F5C5]">Social-Science Arena</p><h1 className="text-4xl sm:text-6xl font-black leading-tight">Jigsaw <span className="text-[#D6B36A]">Puzzle</span></h1></div></div>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-8 text-white/75">เปิดชิ้นส่วนภาพปริศนา สังเกตเบาะแส และตอบคำถามสังคมศาสตร์ให้ถูกต้องก่อนหมดเวลา แข่งขันสะสมคะแนนกับผู้เล่นในห้องเดียวกัน</p>
              <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => document.getElementById('join-room')?.scrollIntoView({behavior:'smooth'})} className="rounded-xl bg-[#62F5C5] px-5 py-3 font-bold text-[#0B1715] hover:brightness-110"><Users className="mr-2 inline" size={18}/>เข้าร่วมเกม</button>{currentUser?.isHost ? <button onClick={() => setView('host-setup')} className="rounded-xl border border-[#D6B36A]/50 bg-black/20 px-5 py-3 font-semibold hover:bg-white/10"><Plus className="mr-2 inline" size={18}/>สร้างห้อง</button> : <button onClick={() => setHostModal(true)} className="rounded-xl border border-[#D6B36A]/50 bg-black/20 px-5 py-3 font-semibold hover:bg-white/10"><ShieldCheck className="mr-2 inline" size={18}/>เข้าสู่ระบบ Host</button>}<button onClick={() => setHowToPlay(true)} className="rounded-xl border border-white/15 px-4 py-3 hover:bg-white/10"><CircleHelp className="mr-2 inline" size={18}/>วิธีเล่น</button></div>
            </div>
            <div className="space-y-4">
              <video className="aspect-video w-full rounded-2xl border border-[#62F5C5]/25 object-cover shadow-xl" src="/assets/social-science-lobby.mp4" poster="/assets/Lobby.png" autoPlay muted loop playsInline controls aria-label="วิดีโอแนะนำเกม"/>
              <div className="grid grid-cols-3 gap-3">{[['10','ภาพปริศนา'],['60s','ต่อข้อ'],['+คะแนน','คอมโบ']].map(([n,l])=><div key={l} className="rounded-xl border border-white/10 bg-black/25 p-3 text-center"><p className="text-xl font-black text-[#D6B36A]">{n}</p><p className="mt-1 text-xs text-white/60">{l}</p></div>)}</div>
            </div>
          </div>
        </section>
        <section id="join-room" className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
          <div className="glass-card rounded-2xl p-6"><h2 className="mb-2 text-xl font-bold"><LogIn className="mr-2 inline text-[#62F5C5]"/>เข้าร่วมด้วยรหัสห้อง</h2><p className="mb-4 text-sm text-white/60">เปิดลิงก์ QR หรือกรอกรหัสห้องที่ Host แชร์ให้</p><label className="mb-2 block text-sm">รหัสห้อง</label><div className="flex gap-2"><input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="เช่น A7K2Q9" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-[#62F5C5]" /><button disabled={loading} onClick={enterRoom} className="rounded-xl bg-[#103B32] px-4 font-bold text-[#62F5C5] disabled:opacity-50">{loading?'กำลังค้นหา…':'เข้าห้อง'}</button></div>{currentUser ? <p className="mt-4 rounded-xl border border-[#62F5C5]/20 bg-[#103B32]/30 px-4 py-3 text-sm text-[#62F5C5]">เข้าสู่ระบบแล้ว · {currentUser.displayName} · ออกจากระบบได้ที่แถบเมนูด้านบน</p> : <button onClick={async()=>{try{await loginGoogle();setNotice('เข้าสู่ระบบ Google สำเร็จ กรุณาเข้าห้องอีกครั้ง');}catch(e:any){setNotice(e?.message||'เข้าสู่ระบบ Google ไม่สำเร็จ')}}} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 hover:bg-white/5">เข้าสู่ระบบด้วย Google</button>}</div>
          <div className="glass-card rounded-2xl p-6"><h2 className="mb-2 text-xl font-bold"><Crown className="mr-2 inline text-[#D6B36A]"/>สำหรับ Host</h2><p className="mb-4 text-sm leading-6 text-white/60">กรอกรหัส Host แล้วตั้งค่าห้อง สร้างลิงก์และ QR Code จาก Host Dashboard</p>{currentUser?.isHost ? <button onClick={()=>setView('host-setup')} className="w-full rounded-xl bg-[#62F5C5] p-3 font-bold text-[#0B1715]"><Plus className="mr-2 inline" size={18}/>ตั้งค่าและสร้างห้อง</button> : <button onClick={()=>setHostModal(true)} className="w-full rounded-xl border border-[#D6B36A]/40 p-3 font-semibold text-[#D6B36A] hover:bg-[#D6B36A]/10">เข้าสู่ระบบ Host</button>}</div>
        </section>
        <p className="mt-8 text-center text-xs text-white/40">ระบบเชื่อมต่อ Firebase ต้องตั้งค่า Google และ Anonymous Authentication พร้อม Firestore Rules ก่อนใช้งาน</p>
      </main>}
      {view === 'host-setup' && currentUser?.isHost && <HostRoomSetup roomName={roomName} minPlayers={minPlayers} maxPlayers={maxPlayers} randomize={randomize} loading={loading} onRoomNameChange={setRoomName} onMinPlayersChange={value=>setMinPlayers(Math.max(1,Math.min(maxPlayers,value || 1)))} onMaxPlayersChange={value=>setMaxPlayers(Math.max(minPlayers,Math.min(40,value || minPlayers)))} onRandomizeChange={setRandomize} onCreateRoom={createRoom} onCancel={()=>setView('lobby')}/>}
      {view === 'host' && room && <HostDashboard room={room} onStartGame={startGame} onPauseGame={pauseGame} onResumeGame={resumeGame} onEndGameEarly={finishGame} onOpenQuestionEditor={()=>setEditorOpen(true)} onCloseRoom={async()=>{const r=await gameService.updateRoom(room.roomId,{status:'cancelled',acceptingPlayers:false});if(r)setRoom(r);setView('lobby')}}/>}
      {view === 'player-lobby' && room && <main className="px-4 py-8"><div className="mx-auto max-w-5xl"><div className="mb-5 rounded-2xl border border-[#62F5C5]/20 bg-[#103B32]/40 p-5"><p className="text-sm text-[#62F5C5]">ROOM CODE</p><h1 className="text-3xl font-black">{room.name}</h1><p className="mt-1 text-white/60">รหัสห้อง: {room.roomId} · ผู้เล่น {Object.keys(room.players||{}).length}/{room.settings.maxPlayers}</p><p className="mt-3 text-sm">{room.status==='running'?'เกมเริ่มแล้ว กดเล่นต่อเพื่อกลับสู่ข้อปัจจุบัน':'รอ Host เริ่มเกม — เลือกชื่อและอวตารก่อนเข้าร่วม'}</p></div>{currentUser ? <PlayerLobby room={room} currentUid={currentUser.uid} onJoinSuccess={joinPlayer} onGoogleSignIn={loginGoogle} currentUser={currentUser}/> : <button onClick={async()=>{try{await loginGoogle()}catch(e:any){setNotice(e?.message||'เข้าสู่ระบบไม่สำเร็จ')}}} className="rounded-xl bg-[#62F5C5] px-5 py-3 font-bold text-[#0B1715]">เข้าสู่ระบบ Google เพื่อเข้าร่วม</button>}</div></main>}
      {view === 'game' && room && question && currentUser && <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6"><div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[[`ข้อ ${questionIndex}/${room.questions.length}`,question.topic],['เวลา',`${timeLeft}s`],['คะแนน',String(player?.score||0)],['คอมโบ',`${player?.comboStreak||0} 🔥`]].map(([k,v])=><div key={k} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/50">{k}</p><p className="mt-1 font-bold">{v}</p></div>)}</div>{room.status==='paused'&&<div role="status" className="mb-4 rounded-xl border border-amber-300/30 bg-amber-900/30 px-4 py-3 text-center text-sm text-amber-100">โฮสต์พักเกมอยู่ — เวลาและการเล่นจะดำเนินต่อเมื่อโฮสต์กดเล่นต่อ</div>}<div className="grid items-start gap-6 lg:grid-cols-[1.55fr_.75fr]"><section className="rounded-2xl border border-[#62F5C5]/20 bg-[#103B32]/25 p-3 sm:p-5"><JigsawBoard3D imageSrc={`/assets/${question.imageFileName}`} revealedPieceIds={revealed} onRevealPiece={revealPiece} disabled={answered||timeLeft<=0||room.status!=='running'} questionNumber={questionIndex} totalQuestions={room.questions.length}/><p className="mt-3 text-center text-xs text-white/55">แตะชิ้นส่วนเพื่อเปิดภาพ · ชิ้นแรกฟรี · เปิดแล้วจะไม่ปิดกลับ</p></section><section className="glass-card rounded-2xl p-5"><p className="text-xs uppercase tracking-widest text-[#62F5C5]">QUESTION TOPIC</p><h1 className="mt-2 text-2xl font-bold">{question.topic}</h1><p className="mt-4 text-sm leading-6 text-white/65">เปิดชิ้นส่วนเพื่อสังเกตภาพ จากนั้นกรอกคำตอบที่ตรงกับเฉลยที่กำหนดไว้</p><form onSubmit={submitAnswer} className="mt-5 space-y-3"><label htmlFor="answer" className="block text-sm font-semibold">คำตอบของคุณ</label><input id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} disabled={answered||timeLeft<=0||room.status!=='running'} placeholder="พิมพ์คำตอบ…" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-[#62F5C5] disabled:opacity-50"/><button disabled={answered||timeLeft<=0||room.status!=='running'||!answer.trim()} className="w-full rounded-xl bg-[#62F5C5] px-4 py-3 font-bold text-[#0B1715] disabled:opacity-40">ส่งคำตอบ</button></form><button onClick={openHint} disabled={room.status!=='running'||revealed.length<(room.settings.minPiecesForHint||5)||!!progress?.hintUsed||answered} className="mt-3 w-full rounded-xl border border-[#D6B36A]/40 px-4 py-3 text-[#D6B36A] disabled:opacity-35"><Sparkles className="mr-2 inline" size={16}/>ขอคำใบ้ ({revealed.length}/{room.settings.minPiecesForHint})</button>{showHint&&<div className="mt-3 rounded-xl border border-[#D6B36A]/30 bg-[#D6B36A]/10 p-3 text-sm leading-6">{question.hint}</div>}{notice&&<p role="status" className="mt-3 text-sm text-[#62F5C5]">{notice}</p>}<div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50"><span>{revealed.length}/10 ชิ้นเปิดแล้ว</span><span>{room.status==='paused'?'พักเกม':answered?'ตอบถูกแล้ว':timeLeft===0?'หมดเวลา':'กำลังเล่น'}</span></div></section></div></main>}
      {view === 'results' && room && <PodiumLeaderboard room={room} results={results} onBackToLobby={()=>{setRoom(null);setView('lobby')}} isHost={isHostOfRoom}/>}
      {showKnowledge && question && <KnowledgeModal question={question} progress={progress} onNextQuestion={()=>void nextQuestion()} isLastQuestion={questionIndex>= (room?.questions.length||10)} timeRemaining={timeLeft} disabled={room?.status!=='running'}/>}
      {showKnowledgeArchive && room && <KnowledgeArchiveModal questions={room.questions} onClose={()=>setShowKnowledgeArchive(false)}/>}
      <HostAuthModal isOpen={hostModal} onClose={()=>setHostModal(false)} onSuccess={u=>{setCurrentUser(u);setHostModal(false);setNotice('');setSuccessMessage('เข้าสู่ระบบ Host สำเร็จ ✓ คุณสามารถสร้างห้องได้ทันที')}}/>
      <HowToPlayModal isOpen={howToPlay} onClose={()=>setHowToPlay(false)}/>
      <QuestionEditorModal isOpen={editorOpen} onClose={()=>setEditorOpen(false)} questions={room?.questions || questions} onSaveQuestions={saveQuestions} randomizeOrder={randomize || !!room?.settings.randomizeQuestionOrder}/>
    </div>
  </div>;
}
