export interface Question {
  id: number;
  imageFileName: string;
  topic: string;
  hint: string;
  acceptedAnswers: string[];
  knowledge: string;
  extraQuestionEnabled?: boolean;
  extraQuestionPrompt?: string;
  extraAcceptedAnswers?: string[];
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
}

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  questionTimeSeconds: number; // default 60s
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
  hostEmail?: string;
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
