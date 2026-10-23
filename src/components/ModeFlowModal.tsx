import { useEffect } from 'react';
import { ArrowLeft, BookOpen, Loader2, Swords, Users, X } from 'lucide-react';
import type { PublishedGameSetSummary } from '../types';

export type ModeFlow = 'choice' | 'team-sets' | 'practice-sets';

interface Props {
  flow: ModeFlow;
  sets: PublishedGameSetSummary[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onBack: () => void;
  onChoosePractice: () => void;
  onChooseBattle: () => void;
  onSelectSet: (set: PublishedGameSetSummary) => void;
}

export default function ModeFlowModal({ flow, sets, loading, error, onClose, onBack, onChoosePractice, onChooseBattle, onSelectSet }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const choosingSet = flow !== 'choice';

  return (
    <div className="mode-flow-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="mode-flow-title" className="mode-flow-dialog">
        <header className="flex items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            {choosingSet && <button type="button" className="btn btn-secondary btn-sm" onClick={onBack} aria-label="ย้อนกลับ"><ArrowLeft size={17} aria-hidden /></button>}
            <div className="min-w-0">
              <h2 id="mode-flow-title" className="text-xl font-bold sm:text-2xl">
                {flow === 'choice' ? 'เลือกวิธีเล่น' : flow === 'team-sets' ? 'เลือกชุดเกม Teamwork' : 'เลือกชุดเกม Solo Practice'}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {flow === 'choice' ? 'เลือกฝึกเล่นคนเดียว หรือเข้าร่วมการแข่งขัน Battle' : 'เลือกชุดเกมที่ Host เผยแพร่และพร้อมเล่น'}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label="ปิดหน้าต่าง"><X size={18} aria-hidden /></button>
        </header>

        {flow === 'choice' ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <article className="mode-flow-card mode-flow-card-practice">
              <span className="mode-flow-icon"><BookOpen size={28} aria-hidden /></span>
              <h3>Solo Practice</h3>
              <p>ฝึกเล่นคนเดียวด้วยชุดเกมที่ Host เตรียมและเผยแพร่ไว้ ไม่ต้องเข้าห้องแข่งขัน</p>
              <button type="button" className="btn btn-primary mt-auto w-full" onClick={onChoosePractice}>เลือกชุดเกม</button>
            </article>
            <article className="mode-flow-card mode-flow-card-battle">
              <span className="mode-flow-icon"><Swords size={28} aria-hidden /></span>
              <h3>Battle</h3>
              <p>แข่งขันร่วมกับผู้เล่นคนอื่น โดยใช้รหัสห้องจาก Host และตั้งชื่อพร้อมเลือกอีโมจิ</p>
              <button type="button" className="btn btn-lavender mt-auto w-full" onClick={onChooseBattle}>เข้าร่วม Battle</button>
            </article>
          </div>
        ) : (
          <div className="mode-flow-set-list">
            {loading && <p role="status" className="flex items-center justify-center gap-2 py-10 font-semibold"><Loader2 className="animate-spin" aria-hidden />กำลังโหลดชุดเกม…</p>}
            {!loading && error && <p role="alert" className="card-tint-coral rounded-xl border p-4 text-sm font-semibold text-coral-deep">{error}</p>}
            {!loading && !error && sets.length === 0 && (
              <div className="rounded-2xl border border-line bg-cream/70 p-6 text-center">
                <Users size={28} className="mx-auto text-ink-soft" aria-hidden />
                <p className="mt-3 font-bold">ยังไม่มีชุดเกมที่พร้อมเล่น</p>
                <p className="mt-1 text-sm text-ink-soft">โปรดให้ Host เผยแพร่ชุดเกมที่มีภาพและคำตอบครบก่อน</p>
              </div>
            )}
            {!loading && sets.map(set => (
                <button key={set.id} type="button" className="mode-flow-set" disabled={loading} onClick={() => onSelectSet(set)}>
                  <span className="mode-flow-set-icon"><BookOpen size={22} aria-hidden /></span>
                  <span className="min-w-0 flex-1 text-left">
                    <strong className="block truncate text-base">{set.name}</strong>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {set.questionCount} ข้อ · {set.minPieceCount}–{set.maxPieceCount} ชิ้น
                      {' · '}{set.timerEnabled === false ? 'ไม่จำกัดเวลา' : `${set.questionTimeSeconds} วิ/ข้อ`}
                    </span>
                  </span>
                  <span className="btn btn-primary btn-sm">{flow === 'team-sets' ? 'เริ่ม Teamwork' : 'เริ่มฝึก'}</span>
                </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
