import React from 'react';
import { X, HelpCircle, Award, Clock, Flame, Lightbulb, Puzzle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-card rounded-2xl border border-[#62F5C5]/40 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#103B32]/60 border-b border-[#62F5C5]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#62F5C5]" />
            <h3 className="font-display font-bold text-lg text-[#F5F0E6]">
              กติกาและวิธีเล่น Social-Science Arena
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#F5F0E6]/60 hover:text-[#F5F0E6] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-[#F5F0E6]/90">
          
          {/* 1. Core Mechanics */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-base text-[#62F5C5] flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-[#62F5C5]" /> 1. กลไกจิ๊กซอว์ 3D และการตอบคำถาม
            </h4>
            <p className="text-xs sm:text-sm text-[#F5F0E6]/80 leading-relaxed">
              ภาพปริศนาในแต่ละข้อจะถูกแบ่งออกเป็น 10 ชิ้นส่วนที่มีรูปร่างจิ๊กซอว์จริงแบบ 3D Isometric ผู้เล่นแต่ละคนมีกระดานส่วนตัวในห้องเดียวกัน สามารถคลิกเปิดชิ้นส่วนใดก็ได้เพื่อสังเกตองค์ประกอบของภาพและพิมพ์คำตอบส่งเข้าระบบ
            </p>
          </div>

          {/* 2. Scoring System Table */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-base text-[#D6B36A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D6B36A]" /> 2. สูตรการคำนวณคะแนน (Scoring Formula)
            </h4>
            <div className="p-3 rounded-xl bg-[#0B1715]/70 border border-[#D6B36A]/30 text-xs font-mono space-y-1 text-center">
              <span className="text-[#62F5C5]">คะแนนข้อ = คะแนนฐาน + โบนัสตอบถูก(20) + โบนัสตอบเร็ว(15) + โบนัสคอมโบ - บทลงโทษคำใบ้</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#62F5C5]/20">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#103B32]/70 text-[#F5F0E6]/70">
                  <tr>
                    <th className="py-2.5 px-3 text-center">จำนวนชิ้นที่เปิด</th>
                    <th className="py-2.5 px-3 text-center">คะแนนฐาน (Base)</th>
                    <th className="py-2.5 px-3">คำอธิบาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#62F5C5]/10">
                  <tr className="bg-emerald-950/20">
                    <td className="py-2 px-3 text-center font-bold text-[#62F5C5]">1 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold text-[#62F5C5]">100 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">ชิ้นแรกฟรี ไม่ถูกหักคะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">2 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">90 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนนต่อชิ้นที่เปิดเพิ่ม</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">3 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">80 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">4 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">70 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">5 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">60 คะแนน</td>
                    <td className="py-2 px-3 text-[#D6B36A]">เริ่มปลดล็อกปุ่มขอคำใบ้ (Hint)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">6 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">50 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">7 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">40 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">8 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">30 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">9 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">20 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">หัก 10 คะแนน</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center">10 ชิ้น</td>
                    <td className="py-2 px-3 text-center font-bold">10 คะแนน</td>
                    <td className="py-2 px-3 text-[#F5F0E6]/70">เปิดครบทั้งภาพ (คะแนนฐานขั้นต่ำ 10)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Bonuses & Combo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#103B32]/40 border border-[#62F5C5]/20 space-y-1">
              <div className="font-semibold text-xs text-[#62F5C5] flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> โบนัสตอบเร็ว (+15 คะแนน)
              </div>
              <p className="text-xs text-[#F5F0E6]/80">
                เมื่อส่งคำตอบถูกต้องในขณะที่เวลาของข้อเหลืออย่างน้อย <strong>30 วินาที</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#103B32]/40 border border-[#D6B36A]/20 space-y-1">
              <div className="font-semibold text-xs text-[#D6B36A] flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> คอมโบโบนัส (Combo Streak)
              </div>
              <p className="text-xs text-[#F5F0E6]/80">
                ตอบถูกติดต่อกัน: ถูก 2 ข้อ (+5), ถูก 3 ข้อ (+10), ถูก 4 ข้อขึ้นไป (+15) ต่อข้อ!
              </p>
            </div>
          </div>

          {/* 4. Important Rules */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-base text-[#F5F0E6] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#62F5C5]" /> 3. กฎความยุติธรรมและการเล่นต่อ
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#F5F0E6]/80 list-disc list-inside">
              <li><strong>ตอบผิด:</strong> ไม่ถูกหักคะแนน สามารถพิมพ์ตอบใหม่ได้จนกว่าเวลา 60 วินาทีจะหมด</li>
              <li><strong>คำใบ้:</strong> ปลดล็อกเมื่อเปิดจิ๊กซอว์อย่างน้อย 5 ชิ้นขึ้นไป</li>
              <li><strong>การหลุดจากเกม:</strong> หากอินเทอร์เน็ตขาดช่วงหรือรีเฟรชหน้า สามารถกด "เล่นต่อ" จากหน้าแรกเพื่อเล่นต่อจากข้อเดิมทันที</li>
              <li><strong>การจัดอันดับ:</strong> เรียงตาม: 1. คะแนนรวมสูงสุด 2. จำนวนข้อที่ตอบถูก 3. เวลาตอบรวมน้อยที่สุด</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0B1715]/90 border-t border-[#62F5C5]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-display font-bold bg-[#62F5C5] text-[#0B1715] hover:opacity-95 transition-all cursor-pointer"
          >
            เข้าใจแล้ว เข้าสู่สนามประลอง
          </button>
        </div>

      </div>
    </div>
  );
};
