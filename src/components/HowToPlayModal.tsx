import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SOLO = [
  'เลือก Solo Player แล้วเลือก Solo Practice เพื่อฝึกด้วยชุดเกมที่ Host เผยแพร่ หรือเลือก Battle เพื่อเข้าห้องด้วยรหัส',
  'Solo Practice ไม่ต้องเข้าร่วมห้องแข่งขัน ส่วน Battle ให้ตั้งชื่อและเลือกอีโมจิก่อนเข้าห้อง',
  'แตะชิ้นส่วนเพื่อเปิดภาพ แล้วพิมพ์คำตอบก่อนหมดเวลาตามกติกาของชุดเกม',
  'ใช้คำใบ้ได้เมื่อเปิดชิ้นส่วนถึงจำนวนที่ Host กำหนด'
];
const TEAM = [
  'เลือก Teamwork จากหน้า Lobby แล้วเลือกชุดเกมที่ Host เผยแพร่ ไม่ต้องกรอกรหัสห้องหรือเข้าสู่ระบบ Host',
  'ครูหรือผู้ควบคุมเป็นผู้เปิดชิ้นส่วนและใช้ปุ่มบนแถบควบคุมด้านบน',
  'นักเรียนช่วยกันสังเกตภาพและตอบด้วยวาจา ครูพิมพ์คำตอบเพื่อตรวจสอบ',
  'ใช้แถบด้านข้างเพื่อเปิดคำใบ้และดูเฉลยซ้ำได้'
];

export function HowToPlayModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="htp-title" className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto">
        <header className="flex items-center justify-between border-b border-line bg-butter-soft px-5 py-4">
          <h2 id="htp-title" className="text-xl font-bold">วิธีเล่น</h2>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-1 hover:bg-butter"><X size={20} aria-hidden /></button>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <section className="card card-tint-mint p-4">
            <h3 className="font-bold">Solo Player · Solo Practice / Battle</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">{SOLO.map(s => <li key={s}>{s}</li>)}</ol>
          </section>
          <section className="card card-tint-lavender p-4">
            <h3 className="font-bold">Teamwork · เล่นเป็นทีม</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">{TEAM.map(s => <li key={s}>{s}</li>)}</ol>
          </section>
        </div>
        <div className="flex justify-end border-t border-line p-4"><button type="button" onClick={onClose} className="btn btn-primary">เข้าใจแล้ว</button></div>
      </div>
    </div>
  );
}
