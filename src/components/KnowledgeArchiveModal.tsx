import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { Question } from '../types';

interface KnowledgeArchiveModalProps {
  questions: Question[];
  onClose: () => void;
}

export const KnowledgeArchiveModal: React.FC<KnowledgeArchiveModalProps> = ({ questions, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6">
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="knowledge-archive-title"
      className="glass-card flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#62F5C5]/40 shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-[#62F5C5]/20 bg-[#103B32]/80 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-[#62F5C5]" />
          <div>
            <h2 id="knowledge-archive-title" className="text-lg font-bold sm:text-2xl">ปิดท้ายด้วยคลังความรู้</h2>
            <p className="text-xs text-white/60">ทบทวนภาพ เฉลย และสาระสังคมศาสตร์ทั้ง 10 ข้อ</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดคลังความรู้"
          className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={22} />
        </button>
      </header>

      <div className="overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {questions.map((question, index) => (
            <article key={`${question.id}-${question.imageFileName}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
              <div className="grid grid-cols-[minmax(120px,.8fr)_1.2fr] gap-3">
                <img
                  src={`/assets/${question.imageFileName}`}
                  alt={`ภาพโจทย์ ${index + 1}: ${question.topic}`}
                  className="h-full min-h-36 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-2 py-3 pr-3">
                  <p className="text-[11px] font-semibold text-[#62F5C5]">ข้อ {index + 1} · {question.topic}</p>
                  <p className="text-sm font-bold text-[#D6B36A]">เฉลย: {question.acceptedAnswers[0]}</p>
                  <p className="text-xs leading-5 text-white/75">{question.knowledge}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <footer className="flex justify-end border-t border-white/10 bg-[#0B1715]/80 px-5 py-3">
        <button type="button" onClick={onClose} className="rounded-xl bg-[#62F5C5] px-5 py-2.5 font-bold text-[#0B1715]">
          ปิดและกลับหน้าสรุปคะแนน
        </button>
      </footer>
    </section>
  </div>
);
