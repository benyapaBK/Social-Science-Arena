import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ImagePlus, Loader2, Plus, Replace, Save, Trash2, X, Eye } from 'lucide-react';
import type { GameMode, Question } from '../types';
import { QuestionImage } from './QuestionImage';
import ConfirmDialog from './ConfirmDialog';
import { toast } from './Toast';
import { compressImageFile, saveQuestionImage, validateImageFile } from '../services/imageService';
import { chooseGrid, clampPieceCount, DEFAULT_PIECES, MAX_PIECES, MIN_PIECES, PIECE_PRESETS } from '../services/puzzleService';

const MAX_QUESTIONS = 20;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  mode: GameMode;
  ownerUid: string;
  randomizeOrder: boolean;
  onSaveQuestions: (updated: Question[], randomizeOrder: boolean) => Promise<void>;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
interface Staged { dataUrl: string; width: number; height: number }

export function QuestionEditorModal({ isOpen, onClose, questions, mode, ownerUid, randomizeOrder: initialRandomize, onSaveQuestions }: Props) {
  const [items, setItems] = useState<Question[]>(() => questions.map(q => ({ ...q })));
  const [sel, setSel] = useState(0);
  const [randomize, setRandomize] = useState(initialRandomize);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [staged, setStaged] = useState<Staged | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [confirmDelImage, setConfirmDelImage] = useState(false);
  const [confirmDelQuestion, setConfirmDelQuestion] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !staged && !confirmDelImage && !confirmDelQuestion && !previewOpen) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, staged, confirmDelImage, confirmDelQuestion, previewOpen]);

  const q = items[Math.min(sel, items.length - 1)];
  const pieceCount = clampPieceCount(q?.pieceCount ?? DEFAULT_PIECES);
  const grid = useMemo(() => chooseGrid(pieceCount, 1.5), [pieceCount]);

  if (!isOpen || !q) return null;

  const patch = (changes: Partial<Question>) => {
    setSaveState('idle');
    setItems(prev => prev.map((it, i) => (i === sel ? { ...it, ...changes, updatedAt: Date.now() } : it)));
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) { toast(problem, 'error'); return; }
    setImageBusy(true);
    try {
      setStaged(await compressImageFile(file));
    } catch {
      toast('ไม่สามารถเปิดภาพได้ ไฟล์อาจเสียหายหรือใหญ่เกินไป', 'error');
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmStaged = async () => {
    if (!staged) return;
    setImageBusy(true);
    try {
      const ref = await saveQuestionImage(ownerUid, staged.dataUrl, staged.width, staged.height);
      patch({ imageFileName: ref });
      setStaged(null);
      toast('อัปโหลดรูปภาพแล้ว กด “บันทึกคำถาม” เพื่อใช้งานจริง', 'success');
    } catch {
      toast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error');
    } finally {
      setImageBusy(false);
    }
  };

  const addQuestion = () => {
    if (items.length >= MAX_QUESTIONS) { toast(`เพิ่มได้สูงสุด ${MAX_QUESTIONS} ข้อ`, 'error'); return; }
    const nextId = Math.max(0, ...items.map(i => i.id)) + 1;
    setItems(prev => [...prev, { id: nextId, imageFileName: '', topic: `หัวข้อข้อที่ ${nextId}`, hint: '', acceptedAnswers: [], knowledge: '', pieceCount: DEFAULT_PIECES, enabled: true, updatedAt: Date.now() }]);
    setSel(items.length);
    setSaveState('idle');
  };

  const deleteQuestion = () => {
    setConfirmDelQuestion(false);
    if (items.length <= 1) { toast('ต้องมีคำถามอย่างน้อย 1 ข้อ', 'error'); return; }
    setItems(prev => prev.filter((_, i) => i !== sel));
    setSel(Math.max(0, sel - 1));
    setSaveState('idle');
  };

  const save = async () => {
    if (saveState === 'saving') return;
    setSaveState('saving');
    try {
      await onSaveQuestions(items.map(i => ({ ...i, pieceCount: clampPieceCount(i.pieceCount ?? DEFAULT_PIECES), acceptedAnswers: i.acceptedAnswers.filter(a => a.trim()) })), randomize);
      setSaveState('saved');
      closeTimer.current = window.setTimeout(onClose, 700);
    } catch {
      setSaveState('error');
    }
  };

  const warnings: string[] = [];
  if (!q.imageFileName) warnings.push('ยังไม่มีรูปภาพ');
  if (!q.hint.trim()) warnings.push('ยังไม่มีคำใบ้');
  if (!q.acceptedAnswers.some(a => a.trim())) warnings.push('ยังไม่มีคำตอบที่ยอมรับ');
  if (pieceCount > 3 && (grid.rows === 1 || grid.cols === 1)) warnings.push(`${pieceCount} เป็นจำนวนเฉพาะ จึงแบ่งเป็นแถบยาว 1 แถว ลองเปลี่ยนเป็นจำนวนอื่น`);

  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="qe-title" className="card flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-line bg-mint-soft px-5 py-3">
          <h2 id="qe-title" className="text-lg font-bold">จัดการคำถามและรูปภาพ</h2>
          <button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง" className="rounded-lg p-1 hover:bg-mint"><X size={20} aria-hidden /></button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-2">
          <div className="flex max-w-full gap-1.5 overflow-x-auto py-1" role="tablist" aria-label="เลือกข้อ">
            {items.map((it, i) => (
              <button key={it.id} role="tab" aria-selected={i === sel} type="button" onClick={() => setSel(i)} className={`btn btn-sm shrink-0 ${i === sel ? 'btn-primary' : 'btn-secondary'} ${it.enabled === false ? 'opacity-60' : ''}`}>ข้อ {i + 1}</button>
            ))}
          </div>
          <button type="button" onClick={addQuestion} className="btn btn-sm btn-sky"><Plus size={15} aria-hidden />เพิ่มข้อ</button>
          {mode === 'solo' && (
            <label className="ml-auto flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={randomize} onChange={e => { setRandomize(e.target.checked); setSaveState('idle'); }} className="accent-[#2b3a55]" />สุ่มลำดับข้อ</label>
          )}
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[18rem_1fr]">
          <section aria-label="รูปภาพ" className="space-y-3">
            <div className="aspect-[3/2] overflow-hidden rounded-2xl border border-line bg-cream">
              {q.imageFileName ? <QuestionImage imageFileName={q.imageFileName} alt={`รูปข้อ ${sel + 1}`} className="h-full w-full object-cover" /> : (
                <div className="grid h-full place-items-center text-center text-sm text-ink-soft"><span><ImagePlus className="mx-auto mb-1" aria-hidden />ยังไม่มีรูปภาพ</span></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="qe-file" onChange={e => void pickFile(e.target.files?.[0])} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm btn-primary" disabled={imageBusy} onClick={() => fileRef.current?.click()}>
                {imageBusy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : q.imageFileName ? <Replace size={15} aria-hidden /> : <ImagePlus size={15} aria-hidden />}
                {q.imageFileName ? 'เปลี่ยนรูปภาพ' : 'เพิ่มรูปภาพ'}
              </button>
              <button type="button" className="btn btn-sm btn-secondary" disabled={!q.imageFileName} onClick={() => setPreviewOpen(true)}><Eye size={15} aria-hidden />ดูตัวอย่าง</button>
              <button type="button" className="btn btn-sm btn-danger" disabled={!q.imageFileName} onClick={() => setConfirmDelImage(true)}><Trash2 size={15} aria-hidden />ลบรูปภาพ</button>
            </div>
            <p className="text-xs text-ink-soft">รองรับ PNG, JPG, WebP ไม่เกิน 8 MB (ระบบย่อภาพอัตโนมัติ)</p>
          </section>

          <section className="space-y-4" aria-label="รายละเอียดคำถาม">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={q.enabled !== false} onChange={e => patch({ enabled: e.target.checked })} className="accent-[#2b3a55]" />เปิดใช้งานข้อนี้</label>

            <label className="block text-sm font-semibold" htmlFor="qe-topic">หัวข้อ
              <input id="qe-topic" className="input mt-1" value={q.topic} maxLength={80} onChange={e => patch({ topic: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold" htmlFor="qe-hint">คำใบ้ (ผู้เล่นเห็นเมื่อโฮสต์เปิด)
              <textarea id="qe-hint" className="input mt-1" rows={2} maxLength={300} value={q.hint} onChange={e => patch({ hint: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold" htmlFor="qe-answers">คำตอบที่ยอมรับ (บรรทัดละ 1 คำตอบ)
              <textarea id="qe-answers" key={`${q.id}-answers`} className="input mt-1" rows={4} defaultValue={q.acceptedAnswers.join('\n')} onBlur={e => patch({ acceptedAnswers: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
            </label>
            <label className="block text-sm font-semibold" htmlFor="qe-know">เกร็ดความรู้ (แสดงหลังเฉลย)
              <textarea id="qe-know" className="input mt-1" rows={2} value={q.knowledge} onChange={e => patch({ knowledge: e.target.value })} />
            </label>

            <fieldset className="card card-tint-lavender p-4">
              <legend className="px-2 text-sm font-bold">จำนวนชิ้นจิ๊กซอว์</legend>
              <div className="flex flex-wrap items-center gap-3">
                <input aria-label="จำนวนชิ้น (ช่องตัวเลข)" type="number" min={MIN_PIECES} max={MAX_PIECES} value={pieceCount} onChange={e => patch({ pieceCount: clampPieceCount(e.target.value) })} className="input !w-24" />
                <input aria-label="จำนวนชิ้น (แถบเลื่อน)" type="range" min={MIN_PIECES} max={MAX_PIECES} value={pieceCount} onChange={e => patch({ pieceCount: Number(e.target.value) })} className="min-w-32 flex-1 accent-[#6a54b8]" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PIECE_PRESETS.map(n => (
                  <button key={n} type="button" aria-pressed={pieceCount === n} className={`btn btn-sm ${pieceCount === n ? 'btn-lavender !border-ink' : 'btn-secondary'}`} onClick={() => patch({ pieceCount: n })}>{n} ชิ้น</button>
                ))}
                <button type="button" className={`btn btn-sm ${PIECE_PRESETS.every(n => n !== pieceCount) ? 'btn-lavender !border-ink' : 'btn-secondary'}`} onClick={() => document.querySelector<HTMLInputElement>('input[type=number][aria-label^="จำนวนชิ้น"]')?.focus()}>กำหนดเอง</button>
              </div>
              <p className="mt-2 text-sm text-ink-soft">ตารางที่ใช้: {grid.cols} × {grid.rows} (คอลัมน์ × แถว) · ปรับตามสัดส่วนภาพอัตโนมัติ</p>
            </fieldset>

            {warnings.length > 0 && (
              <ul className="card card-tint-butter space-y-1 p-3 text-sm text-butter-deep" role="status">
                {warnings.map(w => <li key={w} className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{w}</li>)}
              </ul>
            )}
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmDelQuestion(true)}><Trash2 size={15} aria-hidden />ลบข้อนี้</button>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-paper px-5 py-3">
          <p role="status" className="mr-auto text-sm font-semibold">
            {saveState === 'saving' && <span className="text-sky-deep">กำลังบันทึก…</span>}
            {saveState === 'saved' && <span className="text-mint-deep"><Check size={14} className="mr-1 inline" aria-hidden />บันทึกข้อมูลเรียบร้อยแล้ว</span>}
            {saveState === 'error' && <span className="text-coral-deep">ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง</span>}
          </p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saveState === 'saving' || imageBusy}>
            {saveState === 'saving' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />}บันทึกคำถาม
          </button>
        </footer>
      </div>

      {staged && (
        <div className="modal-backdrop" style={{ zIndex: 70 }}>
          <div role="dialog" aria-modal="true" aria-label="ตัวอย่างรูปภาพก่อนบันทึก" className="card w-full max-w-lg p-5">
            <h3 className="font-bold">ตัวอย่างรูปภาพใหม่</h3>
            <img src={staged.dataUrl} alt="ตัวอย่างรูปภาพที่เลือก" className="mt-3 max-h-80 w-full rounded-2xl object-contain" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" disabled={imageBusy} onClick={() => setStaged(null)}>ยกเลิก</button>
              <button type="button" className="btn btn-primary" disabled={imageBusy} onClick={() => void confirmStaged()}>{imageBusy ? 'กำลังบันทึกรูป…' : 'ใช้รูปนี้'}</button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="modal-backdrop" style={{ zIndex: 70 }} onMouseDown={e => { if (e.target === e.currentTarget) setPreviewOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label="ดูตัวอย่างรูปภาพ" className="card w-full max-w-3xl p-4">
            <QuestionImage imageFileName={q.imageFileName} alt={`รูปข้อ ${sel + 1}`} className="max-h-[75vh] w-full rounded-2xl object-contain" />
            <div className="mt-3 text-right"><button type="button" autoFocus className="btn btn-secondary" onClick={() => setPreviewOpen(false)}>ปิด</button></div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmDelImage} danger title="ลบรูปภาพของข้อนี้?" confirmLabel="ลบรูปภาพ" onCancel={() => setConfirmDelImage(false)} onConfirm={() => { patch({ imageFileName: '' }); setConfirmDelImage(false); }}>
        ข้อ {sel + 1} จะไม่มีรูปภาพจนกว่าจะเพิ่มรูปใหม่ (ข้ออื่นไม่ได้รับผลกระทบ)
      </ConfirmDialog>
      <ConfirmDialog open={confirmDelQuestion} danger title={`ลบข้อ ${sel + 1} ทั้งข้อ?`} confirmLabel="ลบข้อนี้" onCancel={() => setConfirmDelQuestion(false)} onConfirm={deleteQuestion}>
        หัวข้อ “{q.topic}” จะถูกลบเมื่อกดบันทึกคำถาม
      </ConfirmDialog>
    </div>
  );
}
