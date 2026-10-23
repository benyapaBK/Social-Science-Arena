import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Lightbulb, Send } from 'lucide-react';
import type { GameQuestionSet } from '../types';
import { gameService } from '../services/gameService';
import { clampPieceCount, isValidPieceId } from '../services/puzzleService';
import JigsawBoard from './JigsawBoard';

interface Props {
  gameSet: GameQuestionSet;
  onExit: () => void;
}

export default function SoloPracticeGame({ gameSet, onExit }: Props) {
  const questions = useMemo(() => {
    const active = gameSet.questions.filter(question => question.enabled !== false);
    if (!gameSet.randomizeOrder) return active;
    const shuffled = [...active];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [gameSet]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [remaining, setRemaining] = useState(gameSet.questionTimeSeconds);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const pieceCount = clampPieceCount(question?.pieceCount ?? 9);
  const timed = gameSet.timerEnabled !== false;

  useEffect(() => {
    if (!timed || solved || finished) return;
    const timer = window.setInterval(() => {
      setRemaining(previous => {
        if (previous <= 1) {
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timed, solved, finished, index, pieceCount]);

  useEffect(() => {
    if (!timed || remaining !== 0 || solved || finished) return;
    setSolved(true);
    setRevealed(Array.from({ length: pieceCount }, (_, i) => i + 1));
    setFeedback('หมดเวลา — เปิดภาพเฉลยแล้ว');
  }, [timed, remaining, solved, finished, pieceCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHintOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!question || finished) {
    return (
      <main className="solo-practice-shell">
        <section className="solo-practice-finish card">
          <CheckCircle2 size={48} className="mx-auto text-mint-deep" aria-hidden />
          <h1 className="mt-4 text-3xl font-bold">ฝึกเล่นเสร็จแล้ว!</h1>
          <p className="mt-2 text-ink-soft">เล่นครบ {questions.length} ข้อ จากชุดเกม “{gameSet.name}”</p>
          <button type="button" className="btn btn-primary mt-6" onClick={onExit}><ArrowLeft size={17} aria-hidden />กลับไปเลือกโหมด</button>
        </section>
      </main>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || solved || (timed && remaining <= 0)) return;
    if (!gameService.checkAnswer(answer, question.acceptedAnswers)) {
      setFeedback('ยังไม่ถูกต้อง ลองสังเกตภาพและตอบอีกครั้ง');
      setAnswer('');
      return;
    }
    setFeedback('ตอบถูกต้อง!');
    setSolved(true);
    setRevealed(Array.from({ length: pieceCount }, (_, i) => i + 1));
    setAnswer('');
  };

  const revealPiece = (id: number) => {
    if (solved || !isValidPieceId(id, pieceCount)) return;
    setRevealed(previous => previous.includes(id) ? previous : [...previous, id]);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex(previous => previous + 1);
    setRevealed([]);
    setAnswer('');
    setFeedback('');
    setHintOpen(false);
    setHintUsed(false);
    setSolved(false);
    setRemaining(gameSet.questionTimeSeconds);
  };

  return (
    <main className="solo-practice-shell">
      <header className="solo-practice-header">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onExit}><ArrowLeft size={16} aria-hidden /><span className="hidden sm:inline">ออกจากเกม</span></button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-mint-deep">SOLO PRACTICE · {gameSet.name}</p>
          <h1 className="truncate text-lg font-bold">{question.topic}</h1>
          <p className="text-xs text-ink-soft">ข้อ {index + 1}/{questions.length} · เปิดแล้ว {revealed.length}/{pieceCount} ชิ้น</p>
        </div>
        <div className="solo-practice-clock"><Clock3 size={18} aria-hidden />{timed ? `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}` : '--:--'}</div>
      </header>

      <div className="solo-practice-layout">
        <section className="solo-practice-board">
          <JigsawBoard imageFileName={question.imageFileName} pieceCount={pieceCount} revealedPieceIds={revealed}
            onRevealPiece={revealPiece} disabled={solved || (timed && remaining <= 0)} label={`ข้อ ${index + 1}`} />
        </section>
        <aside className="solo-practice-panel">
          <form onSubmit={submit}>
            <label htmlFor="practice-answer" className="mb-2 block font-bold">คำตอบของคุณ</label>
            <div className="flex gap-2">
              <input id="practice-answer" className="input min-w-0" value={answer} onChange={event => setAnswer(event.target.value)}
                disabled={solved || (timed && remaining <= 0)} placeholder="พิมพ์คำตอบ…" autoComplete="off" />
              <button type="submit" className="btn btn-primary" disabled={!answer.trim() || solved || (timed && remaining <= 0)} aria-label="ส่งคำตอบ"><Send size={17} aria-hidden /></button>
            </div>
          </form>
          <button type="button" className="btn btn-sky mt-3 w-full" disabled={solved || revealed.length >= pieceCount}
            onClick={() => {
              const hidden = Array.from({ length: pieceCount }, (_, i) => i + 1).filter(id => !revealed.includes(id));
              const nextId = hidden[Math.floor(Math.random() * hidden.length)];
              if (nextId) revealPiece(nextId);
            }}>สุ่มเปิดชิ้นส่วน</button>
          <button type="button" className="btn btn-butter mt-3 w-full"
            disabled={!question.hint || revealed.length < (gameSet.minPiecesForHint ?? 5) || solved}
            onClick={() => { setHintUsed(true); setHintOpen(true); }}><Lightbulb size={17} aria-hidden />{hintUsed ? 'ดูคำใบ้ที่ใช้แล้ว' : 'เปิดคำใบ้'}</button>
          {feedback && <p role="status" className="mt-3 rounded-xl bg-cream p-3 text-sm font-semibold">{feedback}</p>}
          {solved && <section className="mt-4 rounded-2xl border border-mint bg-mint-soft p-4">
            <h2 className="flex items-center gap-2 font-bold text-mint-deep"><CheckCircle2 size={19} aria-hidden />เฉลย: {question.acceptedAnswers[0]}</h2>
            {question.knowledge && <p className="mt-3 flex gap-2 text-sm leading-6"><BookOpen size={17} className="mt-1 shrink-0" aria-hidden />{question.knowledge}</p>}
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={next}>{index + 1 === questions.length ? 'จบการฝึก' : 'ข้อต่อไป'}</button>
          </section>}
        </aside>
      </div>

      {hintOpen && <div className="mode-flow-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setHintOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="practice-hint-title" className="team-info-dialog team-info-hint">
          <header className="team-info-header"><div><span className="badge badge-lavender">ข้อ {index + 1}/{questions.length}</span><h2 id="practice-hint-title" className="mt-2 text-xl font-bold">คำใบ้</h2></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHintOpen(false)}>ปิด</button></header>
          <div className="team-info-body"><Lightbulb size={32} className="text-butter-deep" aria-hidden /><p className="team-info-emphasis">{question.hint}</p></div>
        </section>
      </div>}
    </main>
  );
}
