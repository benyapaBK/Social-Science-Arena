import React from 'react';
import { Question, PlayerProgress } from '../types';
import { CheckCircle2, AlertCircle, ArrowRight, BookOpen, Flame, Award, Eye, Clock } from 'lucide-react';

interface KnowledgeModalProps {
  question: Question;
  progress: PlayerProgress | null;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  timeRemaining: number;
  disabled?: boolean;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({
  question,
  progress,
  onNextQuestion,
  isLastQuestion,
  timeRemaining,
  disabled = false
}) => {
  const isCorrect = progress?.answeredCorrectly ?? false;
  const score = progress?.questionScore ?? 0;
  const pieces = progress?.piecesRevealed ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl glass-card rounded-2xl border-2 border-[#62F5C5]/40 shadow-[0_0_50px_rgba(98,245,197,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Status Header Banner */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isCorrect 
            ? 'bg-gradient-to-r from-emerald-950/80 via-[#103B32]/90 to-emerald-950/80 border-[#62F5C5]/30' 
            : 'bg-gradient-to-r from-amber-950/80 via-[#103B32]/90 to-amber-950/80 border-[#D6B36A]/30'
        }`}>
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <div className="w-10 h-10 rounded-full bg-[#62F5C5]/20 border border-[#62F5C5] flex items-center justify-center text-[#62F5C5]">
                <CheckCircle2 className="w-6 h-6 animate-bounce" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#D6B36A]/20 border border-[#D6B36A] flex items-center justify-center text-[#D6B36A]">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5F0E6]">
                {isCorrect ? 'ตอบถูกต้อง ยอดเยี่ยมมาก!' : 'หมดเวลาสำหรับข้อนี้'}
              </h3>
              <p className="text-xs text-[#F5F0E6]/70">
                {isCorrect 
                  ? 'คุณได้รับคะแนนและโบนัสสะสมในข้อนี้' 
                  : 'เรียนรู้สาระความรู้ทางสังคมศาสตร์แล้วไปต่อในข้อถัดไป'}
              </p>
            </div>
          </div>

          {/* Points Badge */}
          <div className="text-right">
            <span className="text-xs text-[#F5F0E6]/60 block">คะแนนที่ได้</span>
            <span className="font-display font-extrabold text-2xl text-[#62F5C5]">
              +{score}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Topic & Image Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0B1715]/60 border border-[#62F5C5]/20 rounded-xl p-3">
            <div className="sm:col-span-1 rounded-lg overflow-hidden border border-[#62F5C5]/30 h-32 sm:h-auto relative bg-black">
              <img 
                src={`/assets/${question.imageFileName}`} 
                alt={question.topic}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-[#F5F0E6]/80 font-mono">
                {question.imageFileName}
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center space-y-2">
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[#62F5C5]/15 text-[#62F5C5] border border-[#62F5C5]/30 w-fit">
                {question.topic}
              </span>
              <h4 className="font-display font-bold text-base sm:text-lg text-[#F5F0E6]">
                เฉลย: <span className="text-[#D6B36A]">{question.acceptedAnswers[0]}</span>
              </h4>
              {question.acceptedAnswers.length > 1 && (
                <p className="text-xs text-[#F5F0E6]/60">
                  คำตอบที่ยอมรับได้: {question.acceptedAnswers.slice(0, 4).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Educational Content from DOCX */}
          <div className="glass-panel rounded-xl p-4 sm:p-5 border border-[#62F5C5]/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#62F5C5]">
              <BookOpen className="w-4 h-4 text-[#62F5C5]" />
              <span>เกร็ดความรู้ทางสังคมศาสตร์ (Knowledge Insight)</span>
            </div>
            <p className="text-sm sm:text-base text-[#F5F0E6]/90 leading-relaxed indent-4">
              {question.knowledge}
            </p>
          </div>

          {/* Round Stats Breakdown Cluster */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="bg-[#103B32]/40 border border-[#62F5C5]/20 rounded-xl p-2.5">
              <Eye className="w-4 h-4 mx-auto text-[#62F5C5] mb-1" />
              <div className="text-[11px] text-[#F5F0E6]/60">เปิดจิ๊กซอว์</div>
              <div className="font-display font-bold text-base text-[#F5F0E6]">{pieces} / 10 ชิ้น</div>
            </div>

            <div className="bg-[#103B32]/40 border border-[#62F5C5]/20 rounded-xl p-2.5">
              <Clock className="w-4 h-4 mx-auto text-[#D6B36A] mb-1" />
              <div className="text-[11px] text-[#F5F0E6]/60">เวลาที่เหลือ</div>
              <div className="font-display font-bold text-base text-[#D6B36A]">{timeRemaining} วิ</div>
            </div>

            <div className="bg-[#103B32]/40 border border-[#62F5C5]/20 rounded-xl p-2.5">
              <Award className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <div className="text-[11px] text-[#F5F0E6]/60">สถานะข้อ</div>
              <div className="font-display font-bold text-base text-emerald-400">
                {isCorrect ? 'ตอบถูก' : 'หมดเวลา'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="px-6 py-4 bg-[#0B1715]/90 border-t border-[#62F5C5]/20 flex items-center justify-between">
          <span className="text-xs text-[#F5F0E6]/60">
            {progress?.answerStatus === 'timeout' && !isLastQuestion
              ? 'ระบบกำลังเตรียมไปข้อถัดไป หรือกดปุ่มเพื่อไปทันที'
              : isLastQuestion ? 'นี่คือข้อสุดท้ายของการแข่งขัน' : 'พร้อมแล้วกดไปข้อต่อไป'}
          </span>

          <button
            onClick={onNextQuestion}
            disabled={disabled}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-[#62F5C5] to-[#40C59D] text-[#0B1715] hover:opacity-95 shadow-[0_0_20px_rgba(98,245,197,0.4)] transition-all transform active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{isLastQuestion ? 'ดูผลการแข่งขันและโพเดียม' : 'ข้อถัดไป'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
