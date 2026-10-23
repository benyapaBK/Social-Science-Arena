export type GameMode = 'solo' | 'team';

export interface Question {
  id: number;
  // "q1.png" -> /assets/q1.png, "img:<id>" -> Firestore questionImages/<id>, "" -> no image
  imageFileName: string;
  topic: string;
  hint: string;
  acceptedAnswers: string[];
  knowledge: string;
  pieceCount?: number; // default 10
  enabled?: boolean;   // default true
  updatedAt?: number;
  extraQuestionEnabled?: boolean;
  extraQuestionPrompt?: string;
  extraAcceptedAnswers?: string[];
}

export interface GameQuestionSet {
  id: string;
  ownerUid: string;
  name: string;
  mode: GameMode;
  questions: Question[];
  randomizeOrder: boolean;
  minPlayers: number;
  maxPlayers: number;
  minPiecesForHint: number;
  questionTimeSeconds: number;
  timerEnabled?: boolean;
  published?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PublishedGameSetSummary {
  id: string;
  name: string;
  questionCount: number;
  minPieceCount: number;
  maxPieceCount: number;
  questionTimeSeconds: number;
  timerEnabled: boolean;
  updatedAt: number;
}

export interface TeamSolved {
  answer: string;
  knowledge: string;
  at: number;
  via: 'answer' | 'host';
  solvedBy?: string;
  solvedByName?: string;
}

// Shared Teamwork board state. Only the room host may write it.
export interface TeamState {
  currentIndex: number;                // index into the enabled-question list
  revealed: Record<string, number[]>;  // question id -> revealed piece ids (1-based)
  solved: Record<string, TeamSolved>;  // question id -> reveal info
  hintVisible: boolean;
  hintText: string;
  currentQuestionStartedAt?: number;
  remainingTimeSeconds?: number;
  resetAt?: Record<string, number>; // question id -> last host reset (ignores older answers)
  updatedAt: number;
}

export interface TeamAnswer {
  text: string;
  at: number;
}

export interface PlayerProgress {
  questionId: number;
  piecesRevealed: number;
  revealedPieceIds: number[];
  attemptCount: number;
  wrongAttemptCount: number;
  answeredCorrectly: boolean;
  answerStatus: 'unanswered' | 'answering' | 'correct' | 'timeout';
  answerTimestamp?: number;
  questionScore: number;
  hintUsed: boolean;
  knowledgeRead: boolean;
  completedAt?: number;
  submittedAnswer?: string;
}

export interface RoomPlayer {
  uid: string;
  displayName: string;
  photoURL?: string;
  avatarEmoji: string;
  avatarBgColor?: string;
  joinedAt: number;
  ready: boolean;
  connectionStatus: 'online' | 'offline';
  currentQuestion: number;
  currentQuestionStartedAt?: number;
  pauseBaselineMilliseconds?: number;
  score: number;
  correctCount: number;
  comboStreak: number;
  maxCombo: number;
  lastUpdatedAt: number;
  totalResponseTime: number;
  progress?: Record<number, PlayerProgress>;
  mode?: GameMode;
  sessionId?: string;
  teamAnswers?: Record<string, TeamAnswer>; // question id -> latest answer (Teamwork)
}

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  questionTimeSeconds: number; // default 60s
  timerEnabled?: boolean;
  totalTimeSeconds: number;    // default 600s
  baseScoreFirstPiece: number; // default 100
  penaltyPerPiece: number;     // default 10
  correctBonus: number;        // default 20
  speedBonus: number;          // default 15
  speedBonusThreshold: number; // default 30s remaining
  minPiecesForHint: number;    // default 5
  hintPenalty: number;         // default 0 or set by host
  comboBonusEnabled: boolean;  // default true
  allowRetryOnWrong: boolean;  // default true
  showKnowledgeModal: boolean; // default true
  randomizeQuestionOrder: boolean; // default false
  revealFullImageOnTimeout: boolean; // default true
}

export interface Room {
  roomId: string;
  name: string;
  description?: string;
  hostUid: string;
  controllerUid?: string;
  publishedSetId?: string;
  hostEmail?: string;
  mode?: GameMode; // missing on legacy rooms => 'solo'
  team?: TeamState;
  status: 'waiting' | 'ready' | 'running' | 'paused' | 'finished' | 'cancelled';
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  pausedAt?: number;
  totalPausedMilliseconds?: number;
  settings: RoomSettings;
  questionSetVersion: number;
  questions: Question[];
  currentRoundQuestion: number;
  acceptingPlayers: boolean;
  players: Record<string, RoomPlayer>;
}

export interface FinalPlayerResult {
  rank: number;
  uid: string;
  displayName: string;
  avatarEmoji: string;
  finalScore: number;
  correctCount: number;
  totalResponseTime: number;
  maxCombo: number;
  questionBreakdown: Array<{
    questionId: number;
    score: number;
    piecesRevealed: number;
    answeredCorrectly: boolean;
    hintUsed: boolean;
  }>;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  action: string;
  targetUid?: string;
  reason?: string;
  createdAt: number;
  metadata?: any;
}
