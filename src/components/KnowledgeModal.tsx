import { useEffect, useRef } from 'react';
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import type { PlayerProgress, Question } from '../types';
import { QuestionImage } from './QuestionImage';

interface Props {
  question: Question;
  progress: PlayerProgress | null;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  timeRemaining: number;
  pieceCount: number;
  disabled?: boolean;
}

export function KnowledgeModal({ question, progress, onNextQuestion, isLastQuestion, timeRemaining, pieceCount, disabled = false }: Props) {
  const isCorrect = progress?.answeredCorrectly ?? false;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { nextRef.current?.focus(); }, []);

  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="km-title" className="card flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${isCorrect ? 'card-tint-mint' : 'card-tint-butter'}`}>
          <div className="flex items-center gap-3">
            {isCorrect ? <CheckCircle2 size={30} className="text-mint-deep" aria-hidden /> : <AlertCircle size={30} className="text-butter-deep" aria-hidden />}
            <div>
              <h2 id="km-title" className="text-lg font-bold sm:text-xl">{isCorrect ? 'ตอบถูกต้อง ยอดเยี่ยมมาก!' : 'หมดเวลาสำหรับข้อนี้'}</h2>
              <p className="text-xs text-ink-soft">{isCorrect ? 'คุณได้รับคะแนนและโบนัสสะสมในข้อนี้' : 'อ่านเกร็ดความรู้แล้วไปต่อในข้อถัดไป'}</p>
            </div>
          </div>
          <div className="text-right"><span className="block text-xs text-ink-soft">คะแนนที่ได้</span><span className="text-2xl font-bold text-mint-deep">+{progress?.questionScore ?? 0}</span></div>
        </div>

        <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 rounded-2xl border border-line bg-cream p-3 sm:grid-cols-3">
            <QuestionImage imageFileName={question.imageFileName} alt={question.topic} className="h-32 w-full rounded-xl object-cover sm:h-full" />
            <div className="flex flex-col justify-center gap-2 sm:col-span-2">
              <span className="badge w-fit">{question.topic}</span>
              <h3 className="text-base font-bold sm:text-lg">เฉลย: <span className="text-peach-deep">{question.acceptedAnswers[0]}</span></h3>
              {question.acceptedAnswers.length > 1 && <p className="text-xs text-ink-soft">คำตอบที่ยอมรับได้: {question.acceptedAnswers.slice(0, 4).join(', ')}</p>}
            </div>
          </div>

          <div className="card card-tint-sky space-y-2 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-sky-deep"><BookOpen size={16} aria-hidden />เกร็ดความรู้ทางสังคมศาสตร์</p>
            <p className="leading-relaxed">{question.knowledge}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="card p-2.5"><Eye size={16} className="mx-auto mb-1 text-mint-deep" aria-hidden /><div className="text-[11px] text-ink-soft">เปิดจิ๊กซอว์</div><div className="font-bold">{progress?.piecesRevealed ?? 0} / {pieceCount} ชิ้น</div></div>
            <div className="card p-2.5"><Clock size={16} className="mx-auto mb-1 text-peach-deep" aria-hidden /><div className="text-[11px] text-ink-soft">เวลาที่เหลือ</div><div className="font-bold">{timeRemaining} วิ</div></div>
            <div className="card p-2.5"><Award size={16} className="mx-auto mb-1 text-lavender-deep" aria-hidden /><div className="text-[11px] text-ink-soft">สถานะข้อ</div><div className="font-bold">{isCorrect ? 'ตอบถูก' : 'หมดเวลา'}</div></div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-paper px-5 py-3">
          <span className="text-xs text-ink-soft">{isLastQuestion ? 'นี่คือข้อสุดท้ายของการแข่งขัน' : 'พร้อมแล้วกดไปข้อต่อไป'}</span>
          <button ref={nextRef} type="button" onClick={onNextQuestion} disabled={disabled} className="btn btn-primary">
            {isLastQuestion ? 'ดูผลการแข่งขัน' : 'ข้อถัดไป'}<ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
