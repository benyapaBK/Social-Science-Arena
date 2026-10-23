import { BookOpen, X } from 'lucide-react';
import type { Question } from '../types';
import { QuestionImage } from './QuestionImage';

interface Props {
  questions: Question[];
  onClose: () => void;
}

export function KnowledgeArchiveModal({ questions, onClose }: Props) {
  return (
    <div className="modal-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="knowledge-archive-title" className="card flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-line bg-sky-soft px-5 py-4">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-sky-deep" aria-hidden />
            <div>
              <h2 id="knowledge-archive-title" className="text-lg font-bold sm:text-2xl">ปิดท้ายด้วยคลังความรู้</h2>
              <p className="text-xs text-ink-soft">ทบทวนภาพ เฉลย และสาระสังคมศาสตร์ทั้ง {questions.length} ข้อ</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิดคลังความรู้" className="rounded-lg p-2 hover:bg-sky"><X size={22} aria-hidden /></button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {questions.map((q, i) => (
              <article key={q.id} className="card overflow-hidden">
                <div className="grid grid-cols-[minmax(120px,.8fr)_1.2fr] gap-3">
                  <QuestionImage imageFileName={q.imageFileName} alt={`ภาพโจทย์ ${i + 1}: ${q.topic}`} className="h-full min-h-36 w-full object-cover" />
                  <div className="space-y-2 py-3 pr-3">
                    <p className="text-[11px] font-semibold text-mint-deep">ข้อ {i + 1} · {q.topic}</p>
                    <p className="text-sm font-bold text-peach-deep">เฉลย: {q.acceptedAnswers[0]}</p>
                    <p className="text-xs leading-5 text-ink-soft">{q.knowledge}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <footer className="flex justify-end border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="btn btn-primary">ปิดและกลับหน้าสรุปคะแนน</button>
        </footer>
      </section>
    </div>
  );
}
