import {
  Room,
  TeamSolved,
  RoomPlayer, 
  Question, 
  RoomSettings, 
  PlayerProgress, 
  FinalPlayerResult, 
  AuditLog,
  GameMode,
  TeamState,
  GameQuestionSet,
  PublishedGameSetSummary
} from '../types';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { auth, db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  deleteField,
  getDocs,
  query,
  where,
  runTransaction
} from 'firebase/firestore';

// Default settings as specified in Master Prompt
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  minPlayers: 1,
  maxPlayers: 20,
  questionTimeSeconds: 60,
  timerEnabled: true,
  totalTimeSeconds: 600,
  baseScoreFirstPiece: 100,
  penaltyPerPiece: 10,
  correctBonus: 20,
  speedBonus: 15,
  speedBonusThreshold: 30,
  minPiecesForHint: 5,
  hintPenalty: 0,
  comboBonusEnabled: true,
  allowRetryOnWrong: true,
  showKnowledgeModal: true,
  randomizeQuestionOrder: false,
  revealFullImageOnTimeout: true
};

class GameService {
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('social_science_arena_channel');
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  // --- Normalization & Answer Checking ---

  public normalizeAnswer(str: string): string {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”]/g, '')
      .replace(/\s+/g, ' ');
  }

  public checkAnswer(userAnswer: string, acceptedAnswers: string[]): boolean {
    const normalizedUser = this.normalizeAnswer(userAnswer);
    if (!normalizedUser) return false;

    return acceptedAnswers.some(ans => {
      const normalizedAccepted = this.normalizeAnswer(ans);
      return normalizedUser === normalizedAccepted;
    });
  }

  // --- Scoring Engine ---

  public calculateQuestionScore(params: {
    piecesRevealed: number;
    timeRemainingSeconds: number;
    isCorrect: boolean;
    comboStreak: number;
    hintUsed: boolean;
    settings: RoomSettings;
  }): {
    baseScore: number;
    correctBonus: number;
    speedBonus: number;
    comboBonus: number;
    hintPenalty: number;
    totalQuestionScore: number;
    newComboStreak: number;
  } {
    const { piecesRevealed, timeRemainingSeconds, isCorrect, comboStreak, hintUsed, settings } = params;

    if (!isCorrect) {
      return {
        baseScore: 0,
        correctBonus: 0,
        speedBonus: 0,
        comboBonus: 0,
        hintPenalty: 0,
        totalQuestionScore: 0,
        newComboStreak: 0
      };
    }

    // Base score = max(10, 100 - 10 * (piecesRevealed - 1))
    const baseScore = Math.max(10, settings.baseScoreFirstPiece - settings.penaltyPerPiece * Math.max(0, piecesRevealed - 1));
    const correctBonus = settings.correctBonus;
    const speedBonus = timeRemainingSeconds >= settings.speedBonusThreshold ? settings.speedBonus : 0;

    let comboBonus = 0;
    const newComboStreak = comboStreak + 1;
    if (settings.comboBonusEnabled) {
      if (newComboStreak >= 4) {
        comboBonus = 15;
      } else if (newComboStreak === 3) {
        comboBonus = 10;
      } else if (newComboStreak === 2) {
        comboBonus = 5;
      }
    }

    const hintPenalty = hintUsed ? (settings.hintPenalty || 0) : 0;
    const totalQuestionScore = Math.max(0, baseScore + correctBonus + speedBonus + comboBonus - hintPenalty);

    return {
      baseScore,
      correctBonus,
      speedBonus,
      comboBonus,
      hintPenalty,
      totalQuestionScore,
      newComboStreak
    };
  }

  // --- Room ID Generator ---
  public generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // --- Room Management ---

  public async createRoom(params: {
    hostUid: string;
    hostEmail?: string;
    name: string;
    description?: string;
    customSettings?: Partial<RoomSettings>;
    customQuestions?: Question[];
    mode?: GameMode;
  }): Promise<Room> {
    const mode: GameMode = params.mode || 'solo';
    const roomId = this.generateRoomId();
    const settings: RoomSettings = {
      ...DEFAULT_ROOM_SETTINGS,
      ...(params.customSettings || {})
    };

    let questions = params.customQuestions && params.customQuestions.length > 0 
      ? [...params.customQuestions] 
      : [...DEFAULT_QUESTIONS];

    if (mode === 'solo' && settings.randomizeQuestionOrder) {
      questions = this.shuffleArray([...questions]);
    }

    const fullQuestions = questions;
    if (mode === 'team') questions = this.redactQuestions(questions);

    const createdAt = Date.now();
    const startsTeamImmediately = mode === 'team';
    const newRoom: Room = {
      mode,
      ...(mode === 'team' ? { team: this.initialTeamState(createdAt, settings.questionTimeSeconds, settings.timerEnabled !== false) } : {}),
      roomId,
      name: params.name || `Social-Science Arena #${roomId}`,
      description: params.description || '',
      hostUid: params.hostUid,
      ...(params.hostEmail ? { hostEmail: params.hostEmail } : {}),
      status: 'waiting',
      createdAt,
      settings,
      questionSetVersion: 1,
      questions,
      currentRoundQuestion: 1,
      acceptingPlayers: true,
      players: {}
    };

    const roomRef = doc(db, 'rooms', roomId);
    await setDoc(roomRef, newRoom);
    if (mode === 'team') {
      await setDoc(doc(db, 'rooms', roomId, 'private', 'questions'), { questions: fullQuestions, updatedAt: Date.now() });
      const teamStartedAt = Date.now();
      await updateDoc(roomRef, {
        status: 'running',
        startedAt: teamStartedAt,
        'team.currentQuestionStartedAt': settings.timerEnabled === false ? deleteField() : teamStartedAt,
        'team.remainingTimeSeconds': settings.questionTimeSeconds
      });
      newRoom.startedAt = teamStartedAt;
      if (settings.timerEnabled !== false && newRoom.team) newRoom.team.currentQuestionStartedAt = teamStartedAt;
    }
    const createdRoom = startsTeamImmediately ? { ...newRoom, status: 'running' as const } : newRoom;

    // Local / Broadcast sync backup
    this.saveLocalRoom(createdRoom);
    this.broadcastUpdate('ROOM_UPDATED', createdRoom);

    return createdRoom;
  }

  public subscribeToRoom(roomId: string, onUpdate: (room: Room | null) => void): () => void {
    let unsubFirestore: (() => void) | null = null;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      unsubFirestore = onSnapshot(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.data() as Room;
          this.saveLocalRoom(roomData);
          onUpdate(roomData);
        } else {
          // Check local fallback
          const local = this.getLocalRoom(roomId);
          onUpdate(local);
        }
      }, (err) => {
        console.warn('Firestore listener error, using local/broadcast sync:', err);
        const local = this.getLocalRoom(roomId);
        onUpdate(local);
      });
    } catch (e) {
      console.warn('Snapshot setup error:', e);
      const local = this.getLocalRoom(roomId);
      onUpdate(local);
    }

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'ROOM_UPDATED' && event.data.room?.roomId === roomId) {
        onUpdate(event.data.room);
      }
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', handleBroadcast);
    }

    return () => {
      if (unsubFirestore) unsubFirestore();
      if (this.broadcastChannel) {
        this.broadcastChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }

  public async getRoom(roomId: string): Promise<Room | null> {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as Room;
        this.saveLocalRoom(room);
        return room;
      }
    } catch (e) {
      console.warn('Get room firestore failed, trying local fallback:', e);
    }
    return this.getLocalRoom(roomId);
  }

  public async updateRoom(roomId: string, updates: Partial<Room> | Record<string, unknown>): Promise<void> {
    // Dotted field paths are allowed (e.g. "players.<uid>"), so no read-modify-write of whole maps.
    await updateDoc(doc(db, 'rooms', roomId), updates as Record<string, unknown>);
  }

  public redactQuestions(questions: Question[]): Question[] {
    return questions.map(q => ({
      ...q,
      hint: '',
      acceptedAnswers: [],
      knowledge: '',
      ...(q.extraQuestionEnabled ? { extraAcceptedAnswers: [] } : {})
    }));
  }

  public initialTeamState(startedAt = Date.now(), remainingTimeSeconds = DEFAULT_ROOM_SETTINGS.questionTimeSeconds, timerEnabled = true): TeamState {
    return {
      currentIndex: 0, revealed: {}, solved: {}, hintVisible: false, hintText: '',
      ...(timerEnabled ? { currentQuestionStartedAt: startedAt } : {}),
      remainingTimeSeconds, updatedAt: startedAt
    };
  }

  public async getPrivateQuestions(roomId: string): Promise<Question[] | null> {
    const snap = await getDoc(doc(db, 'rooms', roomId, 'private', 'questions'));
    return snap.exists() ? ((snap.data().questions || []) as Question[]) : null;
  }

  // Host: replace the question set. Team rooms keep answers in the host-only private doc.
  public async saveQuestions(room: Room, questions: Question[]): Promise<void> {
    const stamped = questions.map(q => ({ ...q, updatedAt: q.updatedAt || Date.now() }));
    if (room.mode === 'team') {
      await setDoc(doc(db, 'rooms', room.roomId, 'private', 'questions'), { questions: stamped, updatedAt: Date.now() });
      await this.updateRoom(room.roomId, { questions: this.redactQuestions(stamped), questionSetVersion: (room.questionSetVersion || 1) + 1 });
    } else {
      await this.updateRoom(room.roomId, { questions: stamped, questionSetVersion: (room.questionSetVersion || 1) + 1 });
    }
  }

  public async getQuestionSets(ownerUid: string): Promise<GameQuestionSet[]> {
    const sets = await getDocs(query(
      collection(db, 'questionSets'),
      where('ownerUid', '==', ownerUid)
    ));
    return sets.docs
      .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }) as GameQuestionSet)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async getPublishedQuestionSets(): Promise<PublishedGameSetSummary[]> {
    const snapshots = await getDocs(query(
      collection(db, 'questionSets'),
      where('published', '==', true)
    ));
    return snapshots.docs
      .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }) as GameQuestionSet)
      .filter(set => this.isPlayableQuestionSet(set))
      .map(set => {
        const questions = set.questions.filter(question => question.enabled !== false);
        const pieceCounts = questions.map(question => Math.min(60, Math.max(2, question.pieceCount ?? 9)));
        return {
          id: set.id,
          name: set.name || 'ชุดเกม',
          questionCount: questions.length,
          minPieceCount: Math.min(...pieceCounts),
          maxPieceCount: Math.max(...pieceCounts),
          questionTimeSeconds: Number.isInteger(set.questionTimeSeconds)
            ? Math.min(600, Math.max(5, set.questionTimeSeconds))
            : 60,
          timerEnabled: set.timerEnabled !== false,
          updatedAt: set.updatedAt || 0
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async getPublishedQuestionSet(setId: string): Promise<GameQuestionSet> {
    const snapshot = await getDoc(doc(db, 'questionSets', setId));
    if (!snapshot.exists() || snapshot.get('published') !== true) {
      throw new Error('This game set is unavailable or has been unpublished.');
    }
    const set = { id: snapshot.id, ...snapshot.data() } as GameQuestionSet;
    if (!this.isPlayableQuestionSet(set)) {
      throw new Error('This published game set is incomplete.');
    }
    return {
      ...set,
      questionTimeSeconds: Number.isInteger(set.questionTimeSeconds)
        ? Math.min(600, Math.max(5, set.questionTimeSeconds))
        : 60,
      minPiecesForHint: Number.isInteger(set.minPiecesForHint)
        ? Math.min(60, Math.max(0, set.minPiecesForHint))
        : 5,
      timerEnabled: set.timerEnabled !== false,
      randomizeOrder: set.randomizeOrder === true
    };
  }

  public async createTeamRoomFromPublishedSet(setId: string, name = 'Social Science Challenge'): Promise<Room> {
    const gameSet = await this.getPublishedQuestionSet(setId);
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Sign in before creating a Teamwork room.');

    const sourceQuestions = gameSet.questions;
    const roomQuestions = gameSet.randomizeOrder ? this.shuffleArray([...sourceQuestions]) : [...sourceQuestions];
    const now = Date.now();
    const questionTimeSeconds = Number.isInteger(gameSet.questionTimeSeconds)
      ? Math.min(600, Math.max(5, gameSet.questionTimeSeconds))
      : 60;
    const timerEnabled = gameSet.timerEnabled !== false;
    const minPiecesForHint = Number.isInteger(gameSet.minPiecesForHint)
      ? Math.min(60, Math.max(0, gameSet.minPiecesForHint))
      : 5;
    const roomId = this.generateRoomId();
    const room: Room = {
      roomId,
      name: name.trim().slice(0, 60) || 'Social Science Challenge',
      description: '',
      hostUid: currentUser.uid,
      controllerUid: currentUser.uid,
      publishedSetId: setId,
      mode: 'team',
      status: 'running',
      createdAt: now,
      startedAt: now,
      settings: {
        minPlayers: 1,
        maxPlayers: 1,
        questionTimeSeconds,
        timerEnabled,
        totalTimeSeconds: 600,
        baseScoreFirstPiece: 100,
        penaltyPerPiece: 10,
        correctBonus: 20,
        speedBonus: 15,
        speedBonusThreshold: 30,
        minPiecesForHint,
        hintPenalty: 0,
        comboBonusEnabled: false,
        allowRetryOnWrong: true,
        showKnowledgeModal: true,
        randomizeQuestionOrder: gameSet.randomizeOrder === true,
        revealFullImageOnTimeout: true
      },
      questionSetVersion: 1,
      questions: this.redactQuestions(roomQuestions),
      currentRoundQuestion: 1,
      acceptingPlayers: false,
      players: {},
      team: this.initialTeamState(now, questionTimeSeconds, timerEnabled)
    };

    const roomRef = doc(db, 'rooms', roomId);
    await runTransaction(db, async transaction => {
      const existingRoom = await transaction.get(roomRef);
      if (existingRoom.exists()) throw new Error('Room ID collision; retry the action.');
      transaction.set(roomRef, room);
      transaction.set(doc(db, 'rooms', roomId, 'private', 'questions'), {
        questions: sourceQuestions,
        updatedAt: now
      });
    });
    this.saveLocalRoom(room);
    this.broadcastUpdate('ROOM_UPDATED', room);
    return room;
  }

  private isPlayableQuestionSet(set: GameQuestionSet): boolean {
    const activeQuestions = Array.isArray(set.questions)
      ? set.questions.filter(question => question?.enabled !== false)
      : [];
    return activeQuestions.length > 0 && activeQuestions.every(question =>
      typeof question.topic === 'string'
      && question.topic.trim().length > 0
      && typeof question.imageFileName === 'string'
      && question.imageFileName.trim().length > 0
      && Array.isArray(question.acceptedAnswers)
      && question.acceptedAnswers.some(answer => typeof answer === 'string' && answer.trim().length > 0)
    );
  }

  public async saveQuestionSet(input: Omit<GameQuestionSet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<GameQuestionSet> {
    const id = input.id || doc(collection(db, 'questionSets')).id;
    const ref = doc(db, 'questionSets', id);
    const previous = input.id ? await getDoc(ref) : null;
    const timestamp = Date.now();
    const saved: GameQuestionSet = {
      ...input,
      id,
      name: input.name.trim(),
      questions: input.questions.map(q => ({ ...q, updatedAt: q.updatedAt || timestamp })),
      createdAt: previous?.exists() ? ((previous.data().createdAt as number | undefined) ?? timestamp) : timestamp,
      updatedAt: timestamp
    };
    const { id: _id, ...document } = saved;
    await setDoc(ref, document);
    return saved;
  }

  // --- Teamwork (host-only writes; each call touches a single field path) ---

  public async teamSetIndex(roomId: string, index: number, timerEnabled: boolean, questionTimeSeconds: number): Promise<void> {
    const now = Date.now();
    await this.updateRoom(roomId, {
      'team.currentIndex': index,
      'team.hintVisible': false,
      'team.hintText': '',
      'team.remainingTimeSeconds': questionTimeSeconds,
      'team.currentQuestionStartedAt': timerEnabled ? now : deleteField(),
      'team.updatedAt': now
    });
  }

  public async teamSetRevealed(roomId: string, questionId: number, pieceIds: number[]): Promise<void> {
    await this.updateRoom(roomId, { [`team.revealed.${questionId}`]: pieceIds, 'team.updatedAt': Date.now() });
  }

  public async teamSetHint(roomId: string, visible: boolean, text: string): Promise<void> {
    await this.updateRoom(roomId, { 'team.hintVisible': visible, 'team.hintText': visible ? text : '', 'team.updatedAt': Date.now() });
  }

  public async teamMarkSolved(roomId: string, questionId: number, solved: TeamSolved): Promise<void> {
    const clean = Object.fromEntries(Object.entries(solved).filter(([, v]) => v !== undefined));
    await this.updateRoom(roomId, { [`team.solved.${questionId}`]: clean, 'team.updatedAt': Date.now() });
  }

  public async teamResetQuestion(roomId: string, questionId: number, timerEnabled: boolean, questionTimeSeconds: number, running: boolean): Promise<void> {
    const now = Date.now();
    await this.updateRoom(roomId, {
      [`team.revealed.${questionId}`]: deleteField(),
      [`team.solved.${questionId}`]: deleteField(),
      [`team.resetAt.${questionId}`]: now,
      'team.hintVisible': false,
      'team.hintText': '',
      'team.remainingTimeSeconds': questionTimeSeconds,
      'team.currentQuestionStartedAt': timerEnabled && running ? now : deleteField(),
      'team.updatedAt': now
    });
  }

  public async teamPause(roomId: string, remainingTimeSeconds: number): Promise<void> {
    await this.updateRoom(roomId, {
      status: 'paused',
      'team.remainingTimeSeconds': remainingTimeSeconds,
      'team.currentQuestionStartedAt': deleteField(),
      'team.updatedAt': Date.now()
    });
  }

  public async teamStartTimer(roomId: string, remainingTimeSeconds: number): Promise<void> {
    const now = Date.now();
    await this.updateRoom(roomId, {
      'team.currentQuestionStartedAt': now,
      'team.remainingTimeSeconds': remainingTimeSeconds,
      'team.updatedAt': now
    });
  }

  public async teamResume(roomId: string, timerEnabled: boolean): Promise<void> {
    const updates: Record<string, unknown> = { status: 'running', 'team.updatedAt': Date.now() };
    if (timerEnabled) updates['team.currentQuestionStartedAt'] = Date.now();
    await this.updateRoom(roomId, updates);
  }

  // Player: submit a Teamwork answer (only touches the player's own entry).
  public async submitTeamAnswer(roomId: string, uid: string, questionId: number, text: string): Promise<void> {
    await this.updateRoom(roomId, {
      [`players.${uid}.teamAnswers.${questionId}`]: { text: text.trim().slice(0, 120), at: Date.now() },
      [`players.${uid}.lastUpdatedAt`]: Date.now()
    });
  }

  // Join Room with Duplicate Avatar Lock enforcement
  public async joinRoom(params: {
    roomId: string;
    uid: string;
    displayName: string;
    photoURL?: string;
    avatarEmoji: string;
    avatarBgColor?: string;
  }): Promise<{ success: boolean; error?: string; room?: Room }> {
    const room = await this.getRoom(params.roomId);
    if (!room) {
      return { success: false, error: 'ไม่พบห้องเกมนี้ (Room not found)' };
    }

    const currentPlayers = room.players || {};
    const isExisting = !!currentPlayers[params.uid];

    if (room.status === 'cancelled') {
      return { success: false, error: 'ห้องเกมนี้ถูกยกเลิกแล้ว (Room was cancelled)' };
    }

    if (room.status === 'finished') {
      return { success: false, error: 'เกมในห้องนี้จบลงแล้ว (Game already finished)' };
    }

    const canJoinActiveTeam = room.mode === 'team' && (room.status === 'running' || room.status === 'paused') && room.acceptingPlayers;
    if (!isExisting && ((room.status !== 'waiting' && !canJoinActiveTeam) || !room.acceptingPlayers)) {
      return { success: false, error: 'ห้องนี้ปิดรับผู้เล่นแล้ว (Room closed)' };
    }

    const playerCount = Object.keys(currentPlayers).length;

    if (!isExisting && playerCount >= room.settings.maxPlayers) {
      return { success: false, error: 'ห้องเกมนี้มีผู้เล่นเต็มแล้ว (Room is full)' };
    }

    // Duplicate Emoji Avatar Lock check
    for (const [existingUid, p] of Object.entries(currentPlayers)) {
      if (existingUid !== params.uid && p.avatarEmoji === params.avatarEmoji) {
        return { 
          success: false, 
          error: `อวตารอีโมจิ ${params.avatarEmoji} มีผู้เล่นท่านอื่นเลือกไปแล้ว กรุณาเลือกอวตารรูปแบบอื่นจาก 40 แบบ` 
        };
      }
    }

    const playerRecord: RoomPlayer = {
      uid: params.uid,
      displayName: params.displayName || 'Player',
      photoURL: params.photoURL,
      avatarEmoji: params.avatarEmoji,
      avatarBgColor: params.avatarBgColor || 'from-emerald-700 to-teal-500',
      joinedAt: currentPlayers[params.uid]?.joinedAt || Date.now(),
      ready: true,
      connectionStatus: 'online',
      currentQuestion: currentPlayers[params.uid]?.currentQuestion || 1,
      score: currentPlayers[params.uid]?.score || 0,
      correctCount: currentPlayers[params.uid]?.correctCount || 0,
      comboStreak: currentPlayers[params.uid]?.comboStreak || 0,
      maxCombo: currentPlayers[params.uid]?.maxCombo || 0,
      lastUpdatedAt: Date.now(),
      totalResponseTime: currentPlayers[params.uid]?.totalResponseTime || 0,
      progress: currentPlayers[params.uid]?.progress || {},
      mode: room.mode || 'solo',
      ...(currentPlayers[params.uid]?.teamAnswers ? { teamAnswers: currentPlayers[params.uid].teamAnswers } : {})
    };

    const updatedRoom: Room = {
      ...room,
      players: { ...currentPlayers, [params.uid]: playerRecord }
    };

    await this.updateRoom(params.roomId, { [`players.${params.uid}`]: playerRecord });

    return { success: true, room: updatedRoom };
  }

  // Update Player Progress in Room
  public async updatePlayerProgress(params: {
    roomId: string;
    uid: string;
    questionId: number;
    progressUpdate: Partial<PlayerProgress>;
    scoreDelta?: number;
    isCorrect?: boolean;
    newCombo?: number;
    responseTimeSeconds?: number;
  }): Promise<void> {
    const room = await this.getRoom(params.roomId);
    if (!room || !room.players[params.uid]) return;

    const player = room.players[params.uid];
    const prevProgress = player.progress?.[params.questionId] || {
      questionId: params.questionId,
      piecesRevealed: 0,
      revealedPieceIds: [],
      attemptCount: 0,
      wrongAttemptCount: 0,
      answeredCorrectly: false,
      answerStatus: 'unanswered',
      questionScore: 0,
      hintUsed: false,
      knowledgeRead: false
    };

    const updatedProgress: PlayerProgress = {
      ...prevProgress,
      ...params.progressUpdate
    };

    const updatedScore = Math.max(0, (player.score || 0) + (params.scoreDelta || 0));
    const updatedCorrectCount = (player.correctCount || 0) + (params.isCorrect ? 1 : 0);
    const updatedCombo = params.newCombo !== undefined ? params.newCombo : player.comboStreak;
    const updatedMaxCombo = Math.max(player.maxCombo || 0, updatedCombo);
    const updatedResponseTime = (player.totalResponseTime || 0) + (params.responseTimeSeconds || 0);

    const updatedPlayer: RoomPlayer = {
      ...player,
      score: updatedScore,
      correctCount: updatedCorrectCount,
      comboStreak: updatedCombo,
      maxCombo: updatedMaxCombo,
      totalResponseTime: updatedResponseTime,
      lastUpdatedAt: Date.now(),
      progress: {
        ...(player.progress || {}),
        [params.questionId]: updatedProgress
      }
    };

    await this.updateRoom(params.roomId, { [`players.${params.uid}`]: updatedPlayer });
  }

  // Advance to next question for individual player
  public async advancePlayerQuestion(roomId: string, uid: string, nextQ: number): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.players[uid]) return;

    const currentQuestionStartedAt = Date.now();
    const updatedPlayer = {
      ...room.players[uid],
      currentQuestion: nextQ,
      currentQuestionStartedAt,
      pauseBaselineMilliseconds: room.totalPausedMilliseconds || 0,
      lastUpdatedAt: Date.now()
    };

    await this.updateRoom(roomId, { [`players.${uid}`]: updatedPlayer });
  }

  // Kick Player (Host action)
  public async leaveRoom(roomId: string, uid: string): Promise<void> {
    await this.updateRoom(roomId, { [`players.${uid}`]: deleteField() });
  }

  public async kickPlayer(roomId: string, hostUid: string, targetUid: string, reason?: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room || room.hostUid !== hostUid) return false;

    await this.updateRoom(roomId, { [`players.${targetUid}`]: deleteField() });
    await this.addAuditLog(roomId, hostUid, 'Host', 'KICK_PLAYER', targetUid, reason || 'Kicked by host');
    return true;
  }

  // Calculate final results and ranks
  public calculateFinalLeaderboard(room: Room): FinalPlayerResult[] {
    const playersList = Object.values(room.players || {});
    
    // Sort according to Master Prompt rules (Section 18.3):
    // 1. Total score desc
    // 2. Correct count desc
    // 3. Total response time asc
    const sorted = [...playersList].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }
      return a.totalResponseTime - b.totalResponseTime;
    });

    return sorted.map((p, idx) => ({
      rank: idx + 1,
      uid: p.uid,
      displayName: p.displayName,
      avatarEmoji: p.avatarEmoji,
      finalScore: p.score,
      correctCount: p.correctCount,
      totalResponseTime: Math.round(p.totalResponseTime),
      maxCombo: p.maxCombo || p.comboStreak || 0,
      questionBreakdown: Object.values(p.progress || {}).map(prog => ({
        questionId: prog.questionId,
        score: prog.questionScore,
        piecesRevealed: prog.piecesRevealed,
        answeredCorrectly: prog.answeredCorrectly,
        hintUsed: prog.hintUsed
      }))
    }));
  }

  // Audit Logs
  public async addAuditLog(
    roomId: string,
    actorUid: string,
    actorName: string,
    action: string,
    targetUid?: string,
    reason?: string
  ): Promise<void> {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUid,
      actorName,
      action,
      targetUid,
      reason,
      createdAt: Date.now()
    };

    try {
      const logRef = doc(db, 'rooms', roomId, 'auditLogs', log.id);
      await setDoc(logRef, log);
    } catch (e) {
      // Local log fallback
      const key = `audit_${roomId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(log);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  }

  // --- Local / Offline Storage Helpers ---
  private saveLocalRoom(room: Room) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`room_${room.roomId}`, JSON.stringify(room));
      const roomsIndex = JSON.parse(localStorage.getItem('my_rooms_index') || '[]');
      if (!roomsIndex.includes(room.roomId)) {
        roomsIndex.unshift(room.roomId);
        localStorage.setItem('my_rooms_index', JSON.stringify(roomsIndex.slice(0, 30)));
      }
    } catch (e) {
      // ignore
    }
  }

  private getLocalRoom(roomId: string): Room | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`room_${roomId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  private broadcastUpdate(type: string, room: Room) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, room });
      } catch (e) {
        // ignore
      }
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const gameService = new GameService();
