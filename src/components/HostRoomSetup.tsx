import React from 'react';
import { ArrowLeft, Shuffle, Users } from 'lucide-react';

interface HostRoomSetupProps {
  roomName: string;
  minPlayers: number;
  maxPlayers: number;
  randomize: boolean;
  loading: boolean;
  onRoomNameChange: (value: string) => void;
  onMinPlayersChange: (value: number) => void;
  onMaxPlayersChange: (value: number) => void;
  onRandomizeChange: (value: boolean) => void;
  onCreateRoom: () => void;
  onCancel: () => void;
}

export const HostRoomSetup: React.FC<HostRoomSetupProps> = ({
  roomName,
  minPlayers,
  maxPlayers,
  randomize,
  loading,
  onRoomNameChange,
  onMinPlayersChange,
  onMaxPlayersChange,
  onRandomizeChange,
  onCreateRoom,
  onCancel
}) => (
  <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <button
      type="button"
      onClick={onCancel}
      className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
    >
      <ArrowLeft size={17} />
      กลับหน้า Lobby
    </button>

    <section className="glass-card rounded-2xl border border-[#D6B36A]/30 p-5 sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-[#D6B36A]/10 p-3 text-[#D6B36A]">
          <Users size={24} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-[#62F5C5]">Host setup</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">ตั้งค่าห้องเกม</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">
            หลังสร้างห้อง ระบบจะแสดงรหัส ลิงก์เชิญ และ QR Code ในหน้า Host Dashboard
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <label className="block text-sm font-medium">
          ชื่อห้อง
          <input
            value={roomName}
            onChange={event => onRoomNameChange(event.target.value)}
            maxLength={60}
            placeholder="เช่น ห้องเรียนสังคมศาสตร์"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-[#62F5C5]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            ผู้เล่นขั้นต่ำก่อนเริ่ม
            <input
              type="number"
              min={1}
              max={maxPlayers}
              value={minPlayers}
              onChange={event => onMinPlayersChange(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-[#62F5C5]"
            />
          </label>
          <label className="block text-sm font-medium">
            ผู้เล่นสูงสุด (ไม่เกิน 40 คน)
            <input
              type="number"
              min={minPlayers}
              max={40}
              value={maxPlayers}
              onChange={event => onMaxPlayersChange(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-[#62F5C5]"
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <input
            type="checkbox"
            checked={randomize}
            onChange={event => onRandomizeChange(event.target.checked)}
            className="mt-1 accent-[#62F5C5]"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Shuffle size={16} className="text-[#62F5C5]" />
              สุ่มลำดับคำถาม
            </span>
            <span className="mt-1 block text-xs leading-5 text-white/55">
              ใช้ภาพและคำถามทั้ง 10 ข้อ โดยสุ่มลำดับสำหรับห้องนี้
            </span>
          </span>
        </label>

        <div className="rounded-xl border border-[#62F5C5]/15 bg-[#103B32]/30 p-4 text-sm leading-6 text-white/70">
          <p className="font-semibold text-[#62F5C5]">กติกาเริ่มต้นของห้อง</p>
          <p>10 ข้อ · ข้อละ 60 วินาที · เริ่มได้เมื่อมีผู้เล่นอย่างน้อย {minPlayers} คน</p>
          <p>ระบบจะสร้างลิงก์และ QR Code หลังสร้างห้องสำเร็จ</p>
        </div>

        <button
          type="button"
          onClick={onCreateRoom}
          disabled={loading || minPlayers < 1 || maxPlayers < minPlayers || maxPlayers > 40}
          className="w-full rounded-xl bg-[#62F5C5] px-5 py-3.5 font-bold text-[#0B1715] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'กำลังสร้างห้อง...' : 'สร้างห้องและเปิด Host Dashboard'}
        </button>
      </div>
    </section>
  </main>
);
