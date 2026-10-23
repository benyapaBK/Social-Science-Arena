import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut, type User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ArrowLeft, Loader2, Shuffle, Sparkles, Users, User as UserIcon, WifiOff } from 'lucide-react';
import { auth } from './firebase';
import { gameService, DEFAULT_ROOM_SETTINGS } from './services/gameService';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import type { EmojiAvatar } from './data/emojis';
import type { GameMode, GameQuestionSet, PlayerProgress, PublishedGameSetSummary, Question, Room } from './types';
import { Navbar } from './components/Navbar';
import { HostAuthModal, HOST_EMAIL } from './components/HostAuthModal';
import { HostRoomSetup } from './components/HostRoomSetup';
import { HostDashboard } from './components/HostDashboard';
import { PlayerLobby } from './components/PlayerLobby';
import JigsawBoard from './components/JigsawBoard';
import TeamBoard, { getActiveQuestions } from './components/TeamBoard';
import ModeSelector from './components/ModeSelector';
import { KnowledgeModal } from './components/KnowledgeModal';
import { PodiumLeaderboard } from './components/PodiumLeaderboard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { ToastHost, toast } from './components/Toast';
import { soundService } from './services/soundService';
import { clampPieceCount, DEFAULT_PIECES, isValidPieceId, pickRandomHiddenPiece } from './services/puzzleService';
import ModeFlowModal, { type ModeFlow } from './components/ModeFlowModal';
import SoloPracticeGame from './components/SoloPracticeGame';

type View = 'mode' | 'code' | 'host-setup' | 'host' | 'player-setup' | 'game' | 'practice-game' | 'results';

const blankProgress = (questionId: number): PlayerProgress => ({
  questionId, piecesRevealed: 0, revealedPieceIds: [], attemptCount: 0, wrongAttemptCount: 0,
  answeredCorrectly: false, answerStatus: 'unanswered', questionScore: 0, hintUsed: false, knowledgeRead: false
});

const modeName = (m: GameMode | undefined) => (m === 'team' ? 'Teamwork' : 'Battle');

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [view, setView] = useState<View>('mode');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState(() => (new URLSearchParams(window.location.search).get('room') || '').toUpperCase());
  const [codeError, setCodeError] = useState('');
  const [roomName, setRoomName] = useState('Social Science Challenge');
  const [setupMode, setSetupMode] = useState<GameMode>('solo');
  const [setupQuestions, setSetupQuestions] = useState<Question[]>(() => DEFAULT_QUESTIONS.map(q => ({ ...q, pieceCount: q.pieceCount ?? DEFAULT_PIECES, enabled: q.enabled ?? true })));
  const [setupQuestionSetName, setSetupQuestionSetName] = useState('ชุดเกมใหม่');
  const [savedQuestionSets, setSavedQuestionSets] = useState<GameQuestionSet[]>([]);
  const [publishedQuestionSets, setPublishedQuestionSets] = useState<PublishedGameSetSummary[]>([]);
  const [activePracticeSet, setActivePracticeSet] = useState<GameQuestionSet | null>(null);
  const [modeFlow, setModeFlow] = useState<ModeFlow | null>(null);
  const [publicSetsLoading, setPublicSetsLoading] = useState(false);
  const [publicSetsError, setPublicSetsError] = useState('');
  const [activeQuestionSetId, setActiveQuestionSetId] = useState<string | null>(null);
  const [questionSetsLoading, setQuestionSetsLoading] = useState(false);
  const [questionSetSaving, setQuestionSetSaving] = useState(false);
  const [setupEditorOpen, setSetupEditorOpen] = useState(false);
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(40);
  const [randomize, setRandomize] = useState(false);
  const [minPiecesForHint, setMinPiecesForHint] = useState(DEFAULT_ROOM_SETTINGS.minPiecesForHint);
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(DEFAULT_ROOM_SETTINGS.questionTimeSeconds);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [setupPublished, setSetupPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answer, setAnswer] = useState('');
  const [hostModal, setHostModal] = useState(false);
  const [howToPlay, setHowToPlay] = useState(false);
  const [editorQuestions, setEditorQuestions] = useState<Question[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [localProgress, setLocalProgress] = useState<Record<number, PlayerProgress>>({});
  const [teamReviewQuestions, setTeamReviewQuestions] = useState<Question[] | null>(null);
  const [teamReviewError, setTeamReviewError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const autoAdvanceTimeout = useRef<number | null>(null);
  const handledDeadlineQuestion = useRef<number | null>(null);
  const autoAdvancePending = useRef(false);
  const createRoomInFlight = useRef(false);
  const createTeamRoomInFlight = useRef(false);

  const isHost = !!user && !user.isAnonymous && user.email === HOST_EMAIL;
  const uid = user?.uid || '';
  const isTeamController = !!room && room.mode === 'team' && room.hostUid === uid && room.controllerUid === uid;

  // Players never see a login: they get a silent anonymous session.
  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    setAuthReady(true);
    setAuthFailed(false);
  }), []);

  useEffect(() => {
    if (!authReady || view !== 'mode' || !new URLSearchParams(window.location.search).get('room')) return;
    setMode('solo');
    setView('code');
  }, [authReady, view]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!room?.roomId || view === 'practice-game') return;
    return gameService.subscribeToRoom(room.roomId, latest => { if (latest) setRoom(latest); });
  }, [room?.roomId, view]);

  useEffect(() => {
    if (view !== 'host-setup' || !isHost || !uid) return;
    let alive = true;
    setQuestionSetsLoading(true);
    gameService.getQuestionSets(uid)
      .then(sets => { if (alive) setSavedQuestionSets(sets); })
      .catch(() => { if (alive) toast('โหลดชุดเกมที่บันทึกไว้ไม่สำเร็จ ตรวจสอบ Firestore Rules แล้วลองอีกครั้ง', 'error'); })
      .finally(() => { if (alive) setQuestionSetsLoading(false); });
    return () => { alive = false; };
  }, [view, isHost, uid]);

  const activeQuestions = useMemo(() => (room ? getActiveQuestions(room) : []), [room]);
  const player = room && uid ? room.players?.[uid] : undefined;
  const questionIndex = player?.currentQuestion || 1;
  const question = activeQuestions[questionIndex - 1];
  const pieceCount = clampPieceCount(question?.pieceCount ?? DEFAULT_PIECES);
  const progress = (question ? player?.progress?.[question.id] || localProgress[question.id] : null) || null;
  const revealed = progress?.revealedPieceIds || [];
  const answered = !!progress?.answeredCorrectly;
  const isTeam = room?.mode === 'team';
  const hintThreshold = Math.min(room?.settings.minPiecesForHint ?? 5, pieceCount);
  const activeSetupQuestions = setupQuestions.filter(question => question.enabled !== false);
  const canPublishSetup = activeSetupQuestions.length > 0 && activeSetupQuestions.every(question =>
    !!question.imageFileName?.trim()
    && !!question.topic?.trim()
    && Array.isArray(question.acceptedAnswers)
    && question.acceptedAnswers.some(value => typeof value === 'string' && !!value.trim())
  );

  // Move players between lobby / game / results as the host changes the room status.
  useEffect(() => {
    if (!room || !uid || room.hostUid === uid || !room.players?.[uid]) return;
    if ((room.status === 'running' || room.status === 'paused') && view === 'player-setup') {
      setView('game');
      toast('โฮสต์เริ่มเกมแล้ว ขอให้สนุกกับการเล่น!', 'success');
    } else if (room.status === 'finished' && (view === 'game' || view === 'player-setup')) {
      setView('results');
    } else if (room.status === 'cancelled' && (view === 'player-setup' || view === 'game')) {
      toast('ห้องเกมนี้ถูกปิดโดยโฮสต์แล้ว', 'info');
      resetToMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, uid, view]);

  useEffect(() => {
    if (view === 'game' && !isTeam && (progress?.answerStatus === 'correct' || progress?.answerStatus === 'timeout')) setShowKnowledge(true);
  }, [view, isTeam, question?.id, progress?.answerStatus]);

  const nextQuestion = useCallback(async (automatic = false) => {
    if (!room || !uid || !question) return;
    if (room.status !== 'running') {
      if (automatic && room.status === 'paused') autoAdvancePending.current = true;
      return;
    }
    autoAdvancePending.current = false;
    if (autoAdvanceTimeout.current !== null) { window.clearTimeout(autoAdvanceTimeout.current); autoAdvanceTimeout.current = null; }
    handledDeadlineQuestion.current = null;
    const nextId = questionIndex + 1;
    try {
      await gameService.advancePlayerQuestion(room.roomId, uid, nextId);
      setShowKnowledge(false); setShowHint(false); setAnswer('');
      if (nextId > activeQuestions.length) { setView('results'); return; }
      setTimeLeft(room.settings.questionTimeSeconds);
    } catch {
      toast('บันทึกการเปลี่ยนข้อไม่สำเร็จ โปรดตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'error');
    }
  }, [room, uid, question, questionIndex, activeQuestions.length]);

  // Solo timer: remaining time is derived from timestamps, so intervals only trigger re-renders.
  useEffect(() => {
    if (view !== 'game' || isTeam || !room || !player || !question || room.status !== 'running' || room.settings.timerEnabled === false) return;
    let lastUrgentTick = -1;
    const tick = () => {
      const now = Date.now();
      const qStart = player.currentQuestionStartedAt || room.startedAt || now;
      const pausedBeforeQuestion = Math.max(0, (room.totalPausedMilliseconds || 0) - (player.pauseBaselineMilliseconds || 0));
      const elapsed = Math.max(0, now - qStart - pausedBeforeQuestion);
      const seconds = Math.max(0, room.settings.questionTimeSeconds - Math.floor(elapsed / 1000));
      setTimeLeft(seconds);
      if (seconds > 0 && seconds <= 10 && seconds !== lastUrgentTick) { soundService.playTick(true); lastUrgentTick = seconds; }
      if (seconds === 0 && handledDeadlineQuestion.current !== question.id) {
        handledDeadlineQuestion.current = question.id;
        if (progress?.answeredCorrectly) {
          if (showKnowledge) autoAdvanceTimeout.current = window.setTimeout(() => void nextQuestion(true), 1000);
          return;
        }
        if (progress?.answerStatus === 'timeout') {
          setShowKnowledge(true);
          autoAdvanceTimeout.current = window.setTimeout(() => void nextQuestion(true), 1500);
          return;
        }
        soundService.playTimeUp();
        const timedOut: PlayerProgress = { ...(progress || { ...blankProgress(question.id), piecesRevealed: revealed.length, revealedPieceIds: revealed }), answerStatus: 'timeout' };
        setLocalProgress(p => ({ ...p, [question.id]: timedOut }));
        setShowKnowledge(true);
        void gameService.updatePlayerProgress({ roomId: room.roomId, uid, questionId: question.id, progressUpdate: timedOut })
          .catch(() => toast('หมดเวลา แต่บันทึกสถานะไม่สำเร็จ โปรดตรวจการเชื่อมต่อ', 'error'));
        autoAdvanceTimeout.current = window.setTimeout(() => void nextQuestion(true), 1500);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [view, isTeam, room, player, question, progress, revealed, uid, nextQuestion, showKnowledge]);

  useEffect(() => {
    if (room?.status === 'running' && autoAdvancePending.current) void nextQuestion(true);
  }, [room?.status, nextQuestion]);

  useEffect(() => () => { if (autoAdvanceTimeout.current !== null) window.clearTimeout(autoAdvanceTimeout.current); }, []);

  const clearRoomParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url);
  };

  function resetToMode() {
    setRoom(null); setMode(null); setView('mode'); setRoomCode(''); setCodeError('');
    setModeFlow(null); setActivePracticeSet(null);
    setTeamReviewQuestions(null); setTeamReviewError('');
    setLocalProgress({}); setShowKnowledge(false); setShowHint(false); setAnswer('');
    clearRoomParam();
  }

  const leave = async () => {
    if (room && uid && !isHost && (room.status === 'waiting' || (room.mode === 'team' && ['running', 'paused'].includes(room.status))) && room.players?.[uid]) {
      await gameService.leaveRoom(room.roomId, uid).catch(() => undefined);
    }
    resetToMode();
  };

  const hostGesture = () => {
    if (!isHost) { setHostModal(true); return; }
    setView(room && room.hostUid === uid ? 'host' : 'host-setup');
  };

  const hostLogout = async () => {
    await signOut(auth);
    resetToMode();
    toast('ออกจากโหมดควบคุมแล้ว', 'info');
  };

  const openPublishedSets = async (flow: 'team-sets' | 'practice-sets') => {
    setModeFlow(flow);
    setPublicSetsError('');
    setPublicSetsLoading(true);
    try {
      let activeUser = auth.currentUser;
      if (!activeUser) {
        const credential = await signInAnonymously(auth);
        activeUser = credential.user;
        setUser(activeUser);
        setAuthFailed(false);
      }
      const sets = await gameService.getPublishedQuestionSets();
      setPublishedQuestionSets(sets);
    } catch (error) {
      console.error('Could not load published game sets:', error);
      setPublishedQuestionSets([]);
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        setPublicSetsError('ไม่มีสิทธิ์อ่านชุดเกมที่เผยแพร่ กรุณาตรวจว่า Deploy Firestore Rules เวอร์ชันล่าสุดแล้ว');
      } else if (error instanceof FirebaseError && error.code === 'unauthenticated') {
        setPublicSetsError('ยืนยันตัวตนไม่สำเร็จ กรุณาตรวจว่าเปิด Anonymous Authentication ใน Firebase แล้วลองใหม่');
      } else {
        setPublicSetsError('โหลดชุดเกมที่เผยแพร่ไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ Firebase และลองอีกครั้ง');
      }
    } finally {
      setPublicSetsLoading(false);
    }
  };

  const selectMode = (m: GameMode) => {
    setCodeError('');
    if (m === 'team') {
      setMode('team');
      void openPublishedSets('team-sets');
      return;
    }
    setMode(null);
    setModeFlow('choice');
  };

  const startPublishedSet = async (set: PublishedGameSetSummary) => {
    if (modeFlow === 'team-sets') {
      if (createTeamRoomInFlight.current) return;
      createTeamRoomInFlight.current = true;
      setLoading(true);
      setPublicSetsLoading(true);
      try {
        const made = await gameService.createTeamRoomFromPublishedSet(set.id, set.name);
        setRoom(made);
        setRoomCode(made.roomId);
        setMode('team');
        setModeFlow(null);
        setView('game');
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url);
      } catch (error) {
        console.error('Teamwork room creation failed:', error);
        toast('สร้างเกม Teamwork ไม่สำเร็จ ตรวจสอบชุดเกมและการเชื่อมต่อแล้วลองอีกครั้ง', 'error');
      } finally {
        createTeamRoomInFlight.current = false;
        setPublicSetsLoading(false);
        setLoading(false);
      }
      return;
    }
    setPublicSetsLoading(true);
    setPublicSetsError('');
    try {
      const fullSet = await gameService.getPublishedQuestionSet(set.id);
      setActivePracticeSet(fullSet);
      setMode('solo');
      setModeFlow(null);
      setView('practice-game');
      setRoom(null);
      setLocalProgress({});
      setTimeLeft(fullSet.questionTimeSeconds);
    } catch (error) {
      console.error('Could not load selected published game set:', error);
      setPublicSetsError('โหลดชุดเกมนี้ไม่สำเร็จ อาจถูกถอนการเผยแพร่แล้ว กรุณาเลือกชุดอื่นหรือลองอีกครั้ง');
    } finally {
      setPublicSetsLoading(false);
    }
  };

  const chooseBattle = () => {
    setMode('solo');
    setModeFlow(null);
    setView('code');
  };

  const createRoom = async () => {
    const hostUser = auth.currentUser || user;
    if (!hostUser || loading || createRoomInFlight.current) return;
    createRoomInFlight.current = true;
    setLoading(true);
    try {
      const made = await gameService.createRoom({
        hostUid: hostUser.uid, hostEmail: hostUser.email || undefined, name: roomName.trim() || 'Social Science Challenge', mode: setupMode,
        customSettings: { ...DEFAULT_ROOM_SETTINGS, minPlayers, maxPlayers, minPiecesForHint, questionTimeSeconds, timerEnabled, randomizeQuestionOrder: randomize },
        customQuestions: setupQuestions
      });
      setRoom(made); setRoomCode(made.roomId); setMode(made.mode || 'solo'); setView('host');
      const url = new URL(window.location.href); url.searchParams.set('room', made.roomId); window.history.replaceState({}, '', url);
    } catch (error) {
      console.error('Room creation failed:', error);
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        toast('Firestore ปฏิเสธการสร้างห้อง กรุณา Deploy firestore.rules เวอร์ชันล่าสุดก่อน', 'error');
      } else {
        toast('สร้างห้องไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง', 'error');
      }
    } finally {
      createRoomInFlight.current = false;
      setLoading(false);
    }
  };

  const loadQuestionSet = (setId: string) => {
    const saved = savedQuestionSets.find(set => set.id === setId);
    if (!saved) return;
    setSetupQuestions(saved.questions.map(q => ({
      ...q,
      pieceCount: q.pieceCount ?? DEFAULT_PIECES,
      enabled: q.enabled ?? true
    })));
    setSetupQuestionSetName(saved.name);
    setActiveQuestionSetId(saved.id);
    setSetupMode('solo');
    setSetupPublished(saved.published === true);
    setRandomize(saved.randomizeOrder);
    setMinPlayers(saved.minPlayers);
    setMaxPlayers(saved.maxPlayers);
    setMinPiecesForHint(saved.minPiecesForHint ?? DEFAULT_ROOM_SETTINGS.minPiecesForHint);
    setQuestionTimeSeconds(saved.questionTimeSeconds ?? DEFAULT_ROOM_SETTINGS.questionTimeSeconds);
    setTimerEnabled(saved.timerEnabled ?? true);
    toast(`โหลดชุดเกม “${saved.name}” แล้ว`, 'success');
  };

  const createNewQuestionSet = () => {
    setSetupQuestions(DEFAULT_QUESTIONS.map(q => ({ ...q, pieceCount: q.pieceCount ?? DEFAULT_PIECES, enabled: q.enabled ?? true })));
    setSetupQuestionSetName('ชุดเกมใหม่');
    setActiveQuestionSetId(null);
    setSetupMode('solo');
    setSetupPublished(false);
    setRandomize(false);
    setSetupEditorOpen(false);
  };

  const saveQuestionSet = async () => {
    if (!uid || !setupQuestionSetName.trim() || questionSetSaving) return;
    if (setupPublished && !canPublishSetup) {
      toast('เผยแพร่ไม่ได้: ตรวจสอบให้ทุกข้อที่เปิดใช้งานมีภาพ หัวข้อ และคำตอบก่อน', 'error');
      return;
    }
    setQuestionSetSaving(true);
    try {
      const saved = await gameService.saveQuestionSet({
        ...(activeQuestionSetId ? { id: activeQuestionSetId } : {}),
        ownerUid: uid,
        name: setupQuestionSetName.trim(),
        mode: setupMode,
        questions: setupQuestions,
        randomizeOrder: randomize,
        minPlayers,
        maxPlayers,
        minPiecesForHint,
        questionTimeSeconds,
        timerEnabled,
        published: setupPublished
      });
      setSavedQuestionSets(previous => [saved, ...previous.filter(set => set.id !== saved.id)]);
      setActiveQuestionSetId(saved.id);
      setSetupQuestionSetName(saved.name);
      toast(setupPublished ? `บันทึกและเผยแพร่ชุดเกม “${saved.name}” แล้ว` : `บันทึกชุดเกม “${saved.name}” แล้ว`, 'success');
    } catch (error) {
      console.error('Could not save question set:', error);
      toast('บันทึกชุดเกมไม่สำเร็จ กรุณาตรวจ Firestore Rules แล้วลองอีกครั้ง', 'error');
    } finally {
      setQuestionSetSaving(false);
    }
  };

  const enterRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setCodeError('กรุณากรอกรหัสห้อง'); return; }
    setLoading(true); setCodeError('');
    try {
      let activeUser = auth.currentUser;
      if (!activeUser) {
        try {
          const credential = await signInAnonymously(auth);
          activeUser = credential.user;
          setUser(activeUser);
          setAuthFailed(false);
        } catch {
          setAuthFailed(true);
          setCodeError('ไม่สามารถเชื่อมต่อระบบผู้เล่นได้ กรุณาลองอีกครั้ง');
          return;
        }
      }
      const activeUid = activeUser.uid;
      const found = await gameService.getRoom(code);
      if (!found) { setCodeError('ไม่พบรหัสห้องนี้'); return; }
      if (found.hostUid === activeUid && activeUser.email === HOST_EMAIL && !activeUser.isAnonymous) { setRoom(found); setMode(found.mode || 'solo'); setView('host'); return; }
      const roomMode = found.mode || 'solo';
      if (mode && roomMode !== mode) { setCodeError(`ห้องนี้เป็นโหมด ${modeName(roomMode)} กรุณาย้อนกลับและเลือกโหมดให้ตรงกัน`); return; }
      if (found.status === 'cancelled') { setCodeError('ห้องนี้ถูกปิดแล้ว'); return; }
      const mine = found.players?.[activeUid];
      setRoom(found);
      if (mine && (found.status === 'running' || found.status === 'paused')) setView('game');
      else if (mine && found.status === 'finished') setView('results');
      else if (!((found.status === 'waiting' || (['running', 'paused'].includes(found.status) && roomMode === 'team')) && found.acceptingPlayers)) {
        setRoom(null);
        setCodeError('ห้องนี้ปิดรับผู้เล่นแล้ว');
      } else setView('player-setup');
    } catch {
      setCodeError('ไม่สามารถเข้าห้องได้ กรุณาลองอีกครั้ง');
    } finally { setLoading(false); }
  };

  const joinPlayer = async (displayName: string, avatar: EmojiAvatar): Promise<string | null> => {
    if (!room || !uid) return 'ไม่พบห้อง';
    try {
      const result = await gameService.joinRoom({ roomId: room.roomId, uid, displayName, avatarEmoji: avatar.emoji, avatarBgColor: avatar.bgGrad });
      if (!result.success) return result.error || 'เข้าห้องไม่สำเร็จ';
      if (result.room) setRoom(result.room);
      const joined = result.room || room;
      // Solo rooms start a player's own 60s clock only when the host has started the room.
      setView(joined.status === 'running' || joined.status === 'paused' ? 'game' : 'player-setup');
      return null;
    } catch {
      return 'ไม่สามารถเข้าร่วมห้องได้ กรุณาลองอีกครั้ง';
    }
  };

  const startGame = async () => {
    if (!room || room.hostUid !== uid) { toast('คุณไม่มีสิทธิ์ควบคุมห้องนี้', 'error'); return; }
    if (Object.keys(room.players || {}).length < room.settings.minPlayers) { toast('จำนวนผู้เล่นยังไม่ถึงขั้นต่ำ', 'error'); return; }
    if (activeQuestions.length === 0) { toast('ยังไม่มีคำถามที่เปิดใช้งาน', 'error'); return; }
    const startedAt = Date.now();
    const updates: Record<string, unknown> = { status: 'running', acceptingPlayers: false, startedAt, currentRoundQuestion: 1, totalPausedMilliseconds: 0 };
    for (const id of Object.keys(room.players || {})) {
      updates[`players.${id}.currentQuestionStartedAt`] = startedAt;
      updates[`players.${id}.pauseBaselineMilliseconds`] = 0;
    }
    try { await gameService.updateRoom(room.roomId, updates); toast('เริ่มเกมแล้ว', 'success'); }
    catch { toast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error'); }
  };

  const finishGame = async () => {
    if (!room) return;
    try { await gameService.updateRoom(room.roomId, { status: 'finished', finishedAt: Date.now() }); setView('results'); }
    catch { toast('ไม่สามารถจบเกมได้ กรุณาลองอีกครั้ง', 'error'); }
  };

  const finishTeamwork = async () => {
    if (!room) return;
    setTeamReviewQuestions(null);
    setTeamReviewError('');
    try {
      try {
        const questions = await gameService.getPrivateQuestions(room.roomId);
        if (!questions?.length) throw new Error('No private Teamwork questions were found.');
        setTeamReviewQuestions(questions.filter(question => question.enabled !== false));
      } catch (error) {
        console.error('Could not load Teamwork review questions:', error);
        setTeamReviewError('โหลดคลังทบทวนความรู้ไม่สำเร็จ แต่ยังดูสรุปผลการเล่นได้');
      }
      await gameService.updateRoom(room.roomId, { status: 'finished', finishedAt: Date.now() });
      setView('results');
      toast('จบเกม Teamwork แล้ว', 'success');
    } catch {
      toast('จบเกมไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'error');
    }
  };

  const closeRoom = async () => {
    if (!room) return;
    try { await gameService.updateRoom(room.roomId, { status: 'cancelled', acceptingPlayers: false }); resetToMode(); }
    catch { toast('ไม่สามารถปิดห้องได้ กรุณาลองอีกครั้ง', 'error'); }
  };

  const pauseGame = async () => {
    if (!room || room.status !== 'running') return;
    try { await gameService.updateRoom(room.roomId, { status: 'paused', pausedAt: Date.now() }); }
    catch { toast('พักเกมไม่สำเร็จ กรุณาลองอีกครั้ง', 'error'); }
  };

  const resumeGame = async () => {
    if (!room || room.status !== 'paused') return;
    const resumedAt = Date.now();
    const pauseDuration = Math.max(0, resumedAt - (room.pausedAt || resumedAt));
    const total = (room.totalPausedMilliseconds || 0) + pauseDuration;
    const updates: Record<string, unknown> = { status: 'running', totalPausedMilliseconds: total };
    for (const [id, p] of Object.entries(room.players || {})) {
      updates[`players.${id}.currentQuestionStartedAt`] = (p.currentQuestionStartedAt || room.startedAt || resumedAt)
        + Math.max(0, (room.totalPausedMilliseconds || 0) - (p.pauseBaselineMilliseconds || 0)) + pauseDuration;
      updates[`players.${id}.pauseBaselineMilliseconds`] = total;
    }
    try { await gameService.updateRoom(room.roomId, updates); }
    catch { toast('เล่นเกมต่อไม่สำเร็จ กรุณาลองอีกครั้ง', 'error'); }
  };

  const openEditor = async () => {
    if (!room) return;
    try {
      const list = room.mode === 'team' ? await gameService.getPrivateQuestions(room.roomId) : room.questions;
      setEditorQuestions(list && list.length ? list : room.questions);
    } catch { toast('ไม่สามารถโหลดคำถามได้ กรุณาลองอีกครั้ง', 'error'); }
  };

  const saveQuestions = async (updated: Question[], shuffle: boolean) => {
    if (!room || room.hostUid !== uid) throw new Error('forbidden');
    const ordered = room.mode !== 'team' && shuffle ? [...updated].sort(() => Math.random() - 0.5) : updated;
    await gameService.saveQuestions(room, ordered);
    await gameService.updateRoom(room.roomId, { 'settings.randomizeQuestionOrder': shuffle });
  };

  // ---- Solo gameplay ----
  const revealPiece = async (pieceId: number) => {
    if (!room || !uid || !question || answered || revealed.includes(pieceId) || room.status !== 'running' || timeLeft <= 0) return;
    if (!isValidPieceId(pieceId, pieceCount)) return;
    soundService.playPieceClick();
    const ids = [...revealed, pieceId];
    const next: PlayerProgress = { ...(progress || blankProgress(question.id)), piecesRevealed: ids.length, revealedPieceIds: ids };
    setLocalProgress(p => ({ ...p, [question.id]: next }));
    try { await gameService.updatePlayerProgress({ roomId: room.roomId, uid, questionId: question.id, progressUpdate: { piecesRevealed: ids.length, revealedPieceIds: ids } }); }
    catch { toast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error'); }
  };

  const randomReveal = () => {
    const id = pickRandomHiddenPiece(pieceCount, revealed);
    if (id === null) { toast('เปิดจิ๊กซอว์ครบทุกชิ้นแล้ว', 'info'); return; }
    void revealPiece(id);
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || room.status !== 'running' || !uid || !question || !answer.trim() || answered || timeLeft <= 0) return;
    const attempts = (progress?.attemptCount || 0) + 1;
    const base = progress || { ...blankProgress(question.id), piecesRevealed: revealed.length, revealedPieceIds: revealed };
    if (!gameService.checkAnswer(answer, question.acceptedAnswers)) {
      soundService.playWrong();
      setLocalProgress(p => ({ ...p, [question.id]: { ...base, attemptCount: attempts, wrongAttemptCount: (progress?.wrongAttemptCount || 0) + 1, answerStatus: 'unanswered' } }));
      toast('ยังไม่ถูกต้อง ลองสังเกตภาพอีกครั้งนะ', 'info');
      return;
    }
    soundService.playCorrect();
    const score = gameService.calculateQuestionScore({ piecesRevealed: Math.max(1, revealed.length), timeRemainingSeconds: room.settings.timerEnabled === false ? 0 : timeLeft, isCorrect: true, comboStreak: player?.comboStreak || 0, hintUsed: !!progress?.hintUsed, settings: room.settings });
    const nextCombo = (player?.comboStreak || 0) + 1;
    const next: PlayerProgress = { ...base, attemptCount: attempts, answeredCorrectly: true, answerStatus: 'correct', questionScore: score.totalQuestionScore, answerTimestamp: Date.now(), submittedAnswer: answer };
    if (nextCombo >= 3) soundService.playCombo(nextCombo);
    setLocalProgress(p => ({ ...p, [question.id]: next }));
    setShowKnowledge(true);
    toast(`ตอบถูก! +${score.totalQuestionScore} คะแนน`, 'success');
    try {
      await gameService.updatePlayerProgress({ roomId: room.roomId, uid, questionId: question.id, progressUpdate: next, scoreDelta: score.totalQuestionScore, isCorrect: true, newCombo: nextCombo, responseTimeSeconds: room.settings.questionTimeSeconds - timeLeft });
    } catch { toast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error'); }
  };

  const openHint = async () => {
    if (!room || room.status !== 'running' || !question || revealed.length < hintThreshold || progress?.hintUsed) return;
    setLocalProgress(p => ({ ...p, [question.id]: { ...(progress || { ...blankProgress(question.id), piecesRevealed: revealed.length, revealedPieceIds: revealed }), hintUsed: true } }));
    setShowHint(true);
    if (player) await gameService.updatePlayerProgress({ roomId: room.roomId, uid, questionId: question.id, progressUpdate: { hintUsed: true } }).catch(() => undefined);
  };

  const results = useMemo(() => (room ? gameService.calculateFinalLeaderboard(room) : []), [room]);
  const canPlay = room?.status === 'running' && (room.settings.timerEnabled === false || timeLeft > 0) && !answered;
  const urgent = room?.settings.timerEnabled !== false && timeLeft <= 10;

  const body = (() => {
    if (!authReady && view !== 'mode') return <div className="grid min-h-[60vh] place-items-center"><div role="status" className="flex items-center gap-2 font-semibold"><Loader2 className="animate-spin" aria-hidden />กำลังเตรียมเกม…</div></div>;

    if (view === 'mode') {
      return (
        <>
          {isHost && (
            <div className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center gap-2 rounded-2xl border border-lavender bg-lavender-soft px-4 py-2 text-sm">
              <span className="font-semibold text-lavender-deep">โหมดควบคุมเปิดอยู่</span>
              <button type="button" className="btn btn-sm btn-lavender" onClick={() => setView('host-setup')}>สร้างห้องใหม่</button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => void hostLogout()}>ออกจากโหมดควบคุม</button>
            </div>
          )}
          <ModeSelector onSelect={selectMode} onOpenHowToPlay={() => setHowToPlay(true)} />
        </>
      );
    }

    if (view === 'practice-game' && activePracticeSet) {
      return <SoloPracticeGame gameSet={activePracticeSet} onExit={resetToMode} />;
    }

    if (view === 'code') {
      return (
        <main className="mx-auto max-w-md px-4 py-10">
          <button type="button" className="btn btn-secondary btn-sm mb-4" onClick={() => { setView('mode'); setMode(null); setCodeError(''); }}><ArrowLeft size={16} aria-hidden />เปลี่ยนโหมด</button>
          <form className="card space-y-4 p-6" onSubmit={e => { e.preventDefault(); void enterRoom(); }}>
            <span className={`badge ${mode === 'team' ? 'badge-lavender' : ''}`}>{mode === 'team' ? <Users size={13} aria-hidden /> : <UserIcon size={13} aria-hidden />}โหมด {modeName(mode ?? undefined)}</span>
            <h1 className="text-2xl font-bold">กรอกรหัสห้อง</h1>
            <p className="text-sm text-ink-soft">ขอรหัสห้อง 6 ตัวอักษรจากโฮสต์ ไม่ต้องล็อกอิน</p>
            {authFailed && <p role="alert" className="card-tint-coral rounded-xl border p-3 text-sm text-coral-deep">ไม่สามารถเชื่อมต่อระบบได้ ตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า</p>}
            <div>
              <label htmlFor="room-code" className="sr-only">รหัสห้อง</label>
              <input id="room-code" className="input text-center font-mono text-2xl uppercase tracking-[0.4em]" value={roomCode} maxLength={6} autoFocus autoComplete="off"
                onChange={e => { setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeError(''); }} placeholder="ABC123" aria-invalid={!!codeError} aria-describedby={codeError ? 'code-error' : undefined} />
              {codeError && <p id="code-error" role="alert" className="mt-2 text-sm font-semibold text-coral-deep">{codeError}</p>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || roomCode.length < 6}>{loading ? <><Loader2 size={18} className="animate-spin" aria-hidden />กำลังตรวจสอบ…</> : 'เข้าห้อง'}</button>
          </form>
        </main>
      );
    }

    if (view === 'host-setup') {
      return <HostRoomSetup roomName={roomName} mode={setupMode} minPlayers={minPlayers} maxPlayers={maxPlayers} randomize={randomize} loading={loading}
        minPiecesForHint={minPiecesForHint} questionSetName={setupQuestionSetName} questionCount={setupQuestions.length}
        questionTimeSeconds={questionTimeSeconds}
        timerEnabled={timerEnabled}
        savedSets={savedQuestionSets} activeQuestionSetId={activeQuestionSetId} questionSetsLoading={questionSetsLoading} questionSetSaving={questionSetSaving}
        onRoomNameChange={setRoomName} onModeChange={setSetupMode} onMinPlayersChange={setMinPlayers} onMaxPlayersChange={setMaxPlayers} onRandomizeChange={setRandomize}
        onMinPiecesForHintChange={setMinPiecesForHint} onQuestionSetNameChange={setSetupQuestionSetName} onSelectQuestionSet={loadQuestionSet}
        onQuestionTimeSecondsChange={setQuestionTimeSeconds}
        onTimerEnabledChange={setTimerEnabled} published={setupPublished} canPublish={canPublishSetup} onPublishedChange={setSetupPublished}
        onCreateNewSet={createNewQuestionSet} onSaveQuestionSet={() => void saveQuestionSet()} onEditQuestions={() => setSetupEditorOpen(true)}
        onCreateRoom={() => void createRoom()} onCancel={() => setView('mode')} />;
    }

    if (view === 'host' && room) {
      if (room.hostUid !== uid || !isHost) return <div className="card m-6 p-6 text-center">คุณไม่มีสิทธิ์ควบคุมห้องนี้</div>;
      return <HostDashboard room={room} hostUid={uid} onStartGame={() => void startGame()} onPauseGame={() => void pauseGame()} onResumeGame={() => void resumeGame()} onEndGameEarly={() => void finishGame()} onOpenQuestionEditor={() => void openEditor()} onCloseRoom={() => void closeRoom()} onOpenHowToPlay={() => setHowToPlay(true)} />;
    }

    if (view === 'player-setup' && room) return <PlayerLobby room={room} currentUid={uid} onJoin={joinPlayer} />;

    if (view === 'results' && room) {
      return <PodiumLeaderboard room={room} results={results} isHost={isHost && room.hostUid === uid}
        knowledgeQuestions={teamReviewQuestions} knowledgeError={teamReviewError}
        onPlayAgain={() => { const m = mode; resetToMode(); if (m) selectMode(m); }} onBackToLobby={resetToMode} />;
    }

    if (view === 'game' && room && isTeam) return <TeamBoard room={room} uid={uid} isHost={isTeamController}
      onFinish={finishTeamwork} onCloseRoom={closeRoom} onOpenHowToPlay={() => setHowToPlay(true)} />;

    if (view === 'game' && room && question && player) {
      const stats: [string, string][] = [[`ข้อ`, `${questionIndex}/${activeQuestions.length}`], ['คะแนน', String(player.score || 0)], ['คอมโบ', `${player.comboStreak || 0} 🔥`]];
      return (
        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6">
          <div className={`card mb-4 p-3 ${urgent && canPlay ? 'card-tint-coral' : 'card-tint-mint'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">{stats.map(([k, v]) => <div key={k} className="rounded-xl bg-paper px-3 py-1.5 text-center"><p className="text-[11px] text-ink-soft">{k}</p><p className="font-bold">{v}</p></div>)}</div>
              <p className="text-2xl font-bold tabular-nums" role="timer" aria-label={room.settings.timerEnabled === false ? 'ไม่จำกัดเวลา' : `เวลาที่เหลือ ${timeLeft} วินาที`}>
                ⏱ {room.settings.timerEnabled === false ? '--:--' : `${timeLeft}s`} {urgent && canPlay && <span className="text-sm font-semibold text-coral-deep">ใกล้หมดเวลา!</span>}
              </p>
            </div>
            {room.settings.timerEnabled !== false && <div className="mt-2 h-3 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuemin={0} aria-valuemax={room.settings.questionTimeSeconds} aria-valuenow={timeLeft} aria-label="เวลาที่เหลือ">
              <div className={`h-full rounded-full transition-[width] duration-200 ${urgent ? 'bg-coral' : 'bg-mint-deep'}`} style={{ width: `${(timeLeft / room.settings.questionTimeSeconds) * 100}%` }} />
            </div>}
          </div>
          {room.status === 'paused' && <div role="status" className="card card-tint-butter mb-4 px-4 py-3 text-center text-sm font-semibold text-butter-deep">โฮสต์พักเกมอยู่ — เวลาจะเดินต่อเมื่อโฮสต์กดเล่นต่อ</div>}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <JigsawBoard imageFileName={question.imageFileName} pieceCount={pieceCount} revealedPieceIds={revealed} onRevealPiece={id => void revealPiece(id)} disabled={!canPlay} label={`ข้อ ${questionIndex}`}
              footer={<p className="text-center text-xs text-ink-soft">แตะชิ้นส่วนเพื่อเปิดภาพ · ชิ้นแรกฟรี · เปิดแล้วจะไม่ปิดกลับ</p>} />
            <section className="card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-mint-deep">หัวข้อ</p>
              <h1 className="mt-1 text-2xl font-bold">{question.topic}</h1>
              <form onSubmit={e => void submitAnswer(e)} className="mt-4 space-y-3">
                <label htmlFor="answer" className="block text-sm font-bold">คำตอบของคุณ</label>
                <input id="answer" className="input" value={answer} onChange={e => setAnswer(e.target.value)} disabled={!canPlay} placeholder="พิมพ์คำตอบ…" autoComplete="off" />
                <button className="btn btn-primary w-full" disabled={!canPlay || !answer.trim()}>ส่งคำตอบ</button>
              </form>
              <button type="button" onClick={randomReveal} disabled={!canPlay || revealed.length >= pieceCount} className="btn btn-sky mt-3 w-full"><Shuffle size={16} aria-hidden />สุ่มเปิดจิ๊กซอว์</button>
              <button type="button" onClick={() => void openHint()} disabled={!canPlay || revealed.length < hintThreshold || !!progress?.hintUsed || !question.hint} className="btn btn-butter mt-3 w-full">
                <Sparkles size={16} aria-hidden />ขอคำใบ้ ({Math.min(revealed.length, hintThreshold)}/{hintThreshold})
              </button>
              {(showHint || progress?.hintUsed) && question.hint && <div role="status" className="card card-tint-butter mt-3 p-3 text-sm leading-6">{question.hint}</div>}
              <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">{revealed.length}/{pieceCount} ชิ้นเปิดแล้ว · {room.status === 'paused' ? 'พักเกม' : answered ? 'ตอบถูกแล้ว' : timeLeft === 0 ? 'หมดเวลา' : 'กำลังเล่น'}</p>
            </section>
          </div>

          {showKnowledge && <KnowledgeModal question={question} progress={progress} timeRemaining={timeLeft} pieceCount={pieceCount} isLastQuestion={questionIndex >= activeQuestions.length} disabled={room.status !== 'running'} onNextQuestion={() => void nextQuestion(false)} />}
        </main>
      );
    }

    return <div className="card m-6 p-8 text-center"><p className="font-semibold">ไม่พบข้อมูลห้อง</p><button type="button" className="btn btn-primary mt-3" onClick={resetToMode}>กลับหน้าแรก</button></div>;
  })();

  const inRoom = view !== 'mode' && view !== 'code' && view !== 'host-setup';

  return (
    <div className="app-bg min-h-screen text-ink">
      <Navbar
        mode={mode ?? room?.mode ?? null}
        modeLabel={view === 'practice-game' ? 'Solo Practice' : undefined}
        userLabel={isHost ? 'ผู้ควบคุม' : player?.displayName}
        isHost={isHost}
        onOpenHowToPlay={() => setHowToPlay(true)}
        onLogout={inRoom ? () => void leave() : undefined}
        onNavigateHome={() => (view === 'game' || view === 'host' ? undefined : resetToMode())}
        onHostGesture={hostGesture}
      />
      <ToastHost />
      {!online && <div role="status" className="bg-butter px-4 py-2 text-center text-sm font-semibold text-butter-deep"><WifiOff className="mr-2 inline h-4 w-4" aria-hidden />การเชื่อมต่อขาดหาย — ความคืบหน้าออนไลน์อาจยังไม่ซิงก์</div>}
      {body}
      <HostAuthModal
        isOpen={hostModal}
        onClose={() => { setHostModal(false); if (!isHost && view === 'mode') setMode(null); }}
        onSuccess={hostUser => {
          setUser(hostUser);
          setAuthReady(true);
          setMode(null);
          setView('host-setup');
          toast('ยืนยันรหัสโฮสต์แล้ว ตั้งค่าห้องเพื่อเริ่มเกมได้เลย', 'success');
        }}
      />
      <HowToPlayModal isOpen={howToPlay} onClose={() => setHowToPlay(false)} />
      {modeFlow && <ModeFlowModal flow={modeFlow} sets={publishedQuestionSets} loading={publicSetsLoading || loading}
        error={publicSetsError} onClose={() => { setModeFlow(null); setMode(null); }}
        onBack={() => {
          if (modeFlow === 'practice-sets') setModeFlow('choice');
          else { setModeFlow(null); setMode(null); }
        }}
        onChoosePractice={() => void openPublishedSets('practice-sets')}
        onChooseBattle={chooseBattle} onSelectSet={set => void startPublishedSet(set)} />}
      {setupEditorOpen && (
        <QuestionEditorModal isOpen onClose={() => setSetupEditorOpen(false)} questions={setupQuestions} mode={setupMode} ownerUid={uid}
          randomizeOrder={randomize} onSaveQuestions={async (updated, shuffle) => { setSetupQuestions(updated); setRandomize(shuffle); }} />
      )}
      {editorQuestions && room && (
        <QuestionEditorModal isOpen onClose={() => setEditorQuestions(null)} questions={editorQuestions} mode={room.mode || 'solo'} ownerUid={uid}
          randomizeOrder={!!room.settings.randomizeQuestionOrder} onSaveQuestions={saveQuestions} />
      )}
    </div>
  );
}
