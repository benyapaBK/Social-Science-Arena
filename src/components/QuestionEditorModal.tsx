import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Save, Check, Shuffle, Image as ImageIcon, HelpCircle, BookOpen } from 'lucide-react';
import { Question } from '../types';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSaveQuestions: (updatedQuestions: Question[], randomizeOrder: boolean) => void;
  randomizeOrder: boolean;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSaveQuestions,
  randomizeOrder: initialRandomizeOrder
}) => {
  const [editedQuestions, setEditedQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [randomizeOrder, setRandomizeOrder] = useState<boolean>(initialRandomizeOrder);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentQ = editedQuestions[selectedIdx] || editedQuestions[0];

  const handleUpdateCurrent = (field: keyof Question, value: any) => {
    setEditedQuestions(prev => {
      const copy = [...prev];
      copy[selectedIdx] = {
        ...copy[selectedIdx],
        [field]: value
      };
      return copy;
    });
  };

  const handleAnswersTextChange = (text: string) => {
    const list = text.split('\n').map(s => s.trim()).filter(Boolean);
    handleUpdateCurrent('acceptedAnswers', list.length > 0 ? list : ['']);
  };

  const handleAddQuestion = () => {
    const nextId = Math.max(0, ...editedQuestions.map(q => q.id)) + 1;
    const newQ: Question = {
      id: nextId,
      imageFileName: `q${((nextId - 1) % 10) + 1}.png`,
      topic: `หัวข้อใหม่ข้อที่ ${nextId}`,
      hint: 'พิมพ์คำใบ้ของภาพนี้...',
      acceptedAnswers: ['คำตอบที่ 1', 'Answer 1'],
      knowledge: 'พิมพ์เกร็ดความรู้ทางสังคมศาสตร์ที่จะแสดงเมื่อผู้เล่นตอบถูกหรือหมดเวลา...',
      extraQuestionEnabled: false
    };

    setEditedQuestions(prev => [...prev, newQ]);
    setSelectedIdx(editedQuestions.length);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    if (editedQuestions.length <= 1) {
      alert('ต้องมีคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    const filtered = editedQuestions.filter((_, idx) => idx !== indexToDelete);
    setEditedQuestions(filtered);
    setSelectedIdx(Math.max(0, indexToDelete - 1));
  };

  const handleSave = () => {
    onSaveQuestions(editedQuestions, randomizeOrder);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl glass-card rounded-2xl border border-[#62F5C5]/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#103B32]/70 border-b border-[#62F5C5]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#62F5C5]" />
            <h3 className="font-display font-bold text-lg text-[#F5F0E6]">
              จัดการชุดคำถามและคำตอบ (Host Question & Answer Editor)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#F5F0E6]/60 hover:text-[#F5F0E6] hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Selector Tabs & Randomize Toggle */}
        <div className="px-6 py-3 bg-[#0B1715]/60 border-b border-[#62F5C5]/10 flex flex-wrap items-center justify-between gap-3">
          {/* Question Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl py-1">
            {editedQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer flex-shrink-0 ${
                  selectedIdx === idx
                    ? 'bg-[#62F5C5] text-[#0B1715] shadow-[0_0_12px_rgba(98,245,197,0.4)]'
                    : 'bg-[#103B32]/40 text-[#F5F0E6]/70 hover:text-[#F5F0E6] border border-[#62F5C5]/15'
                }`}
              >
                ข้อ {idx + 1}
              </button>
            ))}

            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#D6B36A]/20 hover:bg-[#D6B36A]/30 border border-[#D6B36A]/40 text-[#D6B36A] flex-shrink-0 cursor-pointer"
              title="เพิ่มข้อใหม่"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มข้อ</span>
            </button>
          </div>

          {/* Randomize order toggle for transparency (Section 3.1 & 8.5) */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F5F0E6]/80 hover:text-[#F5F0E6]">
            <input
              type="checkbox"
              checked={randomizeOrder}
              onChange={(e) => setRandomizeOrder(e.target.checked)}
              className="accent-[#62F5C5] w-4 h-4 rounded cursor-pointer"
            />
            <Shuffle className="w-3.5 h-3.5 text-[#62F5C5]" />
            <span>สลับลำดับข้อแบบสุ่ม (เพื่อความโปร่งใสกลุ่มใหญ่)</span>
          </label>
        </div>

        {/* Selected Question Editor Body */}
        {currentQ && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-[#F5F0E6]">
            
            {/* Top Row: Topic & Image Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[#62F5C5] flex items-center gap-1">
                  หัวข้อหลัก (Topic)
                </label>
                <input
                  type="text"
                  value={currentQ.topic}
                  onChange={(e) => handleUpdateCurrent('topic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1715]/80 border border-[#62F5C5]/30 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#62F5C5]"
                  placeholder="เช่น บุคคลสำคัญด้านการพัฒนาประเทศ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#D6B36A] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> ไฟล์ภาพปริศนา (Image)
                </label>
                <select
                  value={currentQ.imageFileName}
                  onChange={(e) => handleUpdateCurrent('imageFileName', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B1715]/80 border border-[#D6B36A]/40 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#D6B36A]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={`q${n}.png`}>
                      q{n}.png (ภาพข้อที่ {n})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hint Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#62F5C5] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> คำใบ้หลัก (Hint - ปลดล็อกเมื่อเปิดครบ 5 ชิ้น)
              </label>
              <textarea
                rows={2}
                value={currentQ.hint}
                onChange={(e) => handleUpdateCurrent('hint', e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0B1715]/80 border border-[#62F5C5]/30 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#62F5C5]"
                placeholder="ระบุคำใบ้..."
              />
            </div>

            {/* Accepted Answers List (1 per line) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#D6B36A]">
                  คำตอบที่ยอมรับได้หลายรูปแบบ (Accepted Answers — 1 คำตอบต่อ 1 บรรทัด)
                </label>
                <span className="text-[11px] text-[#F5F0E6]/50">
                  ระบบตรวจจับแบบไม่สนตัวพิมพ์เล็ก/ใหญ่และตัดช่องว่างให้อัตโนมัติ
                </span>
              </div>
              <textarea
                rows={4}
                value={currentQ.acceptedAnswers.join('\n')}
                onChange={(e) => handleAnswersTextChange(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0B1715]/80 border border-[#D6B36A]/40 text-sm text-[#F5F0E6] font-mono focus:outline-none focus:border-[#D6B36A]"
                placeholder="รัชกาลที่ 9&#10;ร.9&#10;ร9&#10;King Rama 9"
              />
            </div>

            {/* Educational Knowledge Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#62F5C5] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> ข้อมูลความรู้หลังตอบ (Knowledge Text)
              </label>
              <textarea
                rows={4}
                value={currentQ.knowledge}
                onChange={(e) => handleUpdateCurrent('knowledge', e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0B1715]/80 border border-[#62F5C5]/30 text-sm text-[#F5F0E6] leading-relaxed focus:outline-none focus:border-[#62F5C5]"
                placeholder="เนื้อหาสาระความรู้จากเอกสาร..."
              />
            </div>

            {/* Optional 2nd Question Toggle (Section 1.2) */}
            <div className="pt-2 border-t border-[#62F5C5]/10 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F5F0E6]/70">
                <input
                  type="checkbox"
                  checked={currentQ.extraQuestionEnabled || false}
                  onChange={(e) => handleUpdateCurrent('extraQuestionEnabled', e.target.checked)}
                  className="accent-[#62F5C5] w-4 h-4 rounded cursor-pointer"
                />
                <span>เปิดใช้คำถามเสริมข้อที่สอง (Optional Extra Question)</span>
              </label>

              <button
                type="button"
                onClick={() => handleDeleteQuestion(selectedIdx)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบข้อนี้</span>
              </button>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0B1715]/90 border-t border-[#62F5C5]/20 flex items-center justify-between">
          <span className="text-xs text-[#F5F0E6]/60">
            จำนวนคำถามทั้งหมด: <strong>{editedQuestions.length}</strong> ข้อ
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#F5F0E6]/70 hover:text-[#F5F0E6] transition-colors"
            >
              ยกเลิก
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-[#62F5C5] to-[#40C59D] text-[#0B1715] hover:opacity-95 shadow-[0_0_15px_rgba(98,245,197,0.35)] transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกสำเร็จ</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกชุดคำถามเข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
