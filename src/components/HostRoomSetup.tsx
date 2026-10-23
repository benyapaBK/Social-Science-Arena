import { ArrowLeft, BookOpen, Clock3, Lightbulb, Plus, Save, Shuffle, User } from 'lucide-react';
import type { GameMode, GameQuestionSet } from '../types';

interface Props {
  roomName: string;
  mode: GameMode;
  minPlayers: number;
  maxPlayers: number;
  randomize: boolean;
  minPiecesForHint: number;
  questionTimeSeconds: number;
  timerEnabled: boolean;
  published: boolean;
  canPublish: boolean;
  questionSetName: string;
  questionCount: number;
  savedSets: GameQuestionSet[];
  activeQuestionSetId: string | null;
  questionSetsLoading: boolean;
  questionSetSaving: boolean;
  loading: boolean;
  onRoomNameChange: (value: string) => void;
  onModeChange: (value: GameMode) => void;
  onMinPlayersChange: (value: number) => void;
  onMaxPlayersChange: (value: number) => void;
  onRandomizeChange: (value: boolean) => void;
  onMinPiecesForHintChange: (value: number) => void;
  onQuestionTimeSecondsChange: (value: number) => void;
  onTimerEnabledChange: (value: boolean) => void;
  onPublishedChange: (value: boolean) => void;
  onQuestionSetNameChange: (value: string) => void;
  onSelectQuestionSet: (id: string) => void;
  onCreateNewSet: () => void;
  onSaveQuestionSet: () => void;
  onEditQuestions: () => void;
  onCreateRoom: () => void;
  onCancel: () => void;
}

export function HostRoomSetup(p: Props) {
  const modes = [
    {
      value: 'solo',
      title: 'Battle',
      subtitle: 'สร้างห้องแข่งขัน',
      description: `ผู้เล่นเข้าร่วมด้วยรหัสห้อง · ${p.timerEnabled ? `${p.questionTimeSeconds} วินาทีต่อข้อ` : 'ไม่จำกัดเวลา'}`,
      Icon: User,
      selectedClass: 'border-mint-deep bg-mint-soft ring-2 ring-mint/70'
    }
  ] as const;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <button type="button" onClick={p.onCancel} className="btn btn-secondary btn-sm mb-5">
        <ArrowLeft size={16} aria-hidden />กลับ
      </button>

      <header className="mb-6 sm:mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-deep">Host setup</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">ตั้งค่าห้องเกม</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
          จัดการชุดเกมและกำหนดกติกาก่อนสร้างห้อง Battle; Teamwork และ Solo Practice เริ่มจากชุดเกมที่เผยแพร่แล้ว
        </p>
      </header>

      <div className="space-y-5">
        <section className="card p-5 sm:p-6" aria-labelledby="room-details-title">
          <div className="mb-4">
            <h2 id="room-details-title" className="text-lg font-bold">รายละเอียดห้อง</h2>
            <p className="mt-1 text-sm text-ink-soft">ตั้งชื่อที่ผู้เล่นมองเห็นเมื่อเข้าร่วมห้อง</p>
          </div>
          <label className="block text-sm font-semibold" htmlFor="room-name">
            ชื่อห้อง
            <input id="room-name" value={p.roomName} onChange={e => p.onRoomNameChange(e.target.value)} maxLength={60}
              placeholder="เช่น ห้องเรียนสังคมศาสตร์" className="input mt-2" />
          </label>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="game-set-title">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="game-set-title" className="flex items-center gap-2 text-lg font-bold">
                <BookOpen size={19} aria-hidden />ชุดคำถาม
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-soft">จัดการชุดเกม เผยแพร่ให้ Solo Practice ใช้ หรือเลือกชุดสำหรับสร้างห้อง Battle</p>
            </div>
            <span className="badge badge-sky">{p.questionCount} ข้อในชุดปัจจุบัน</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <label className="block text-sm font-semibold" htmlFor="saved-question-set">
              โหลดชุดที่บันทึกไว้
              <select id="saved-question-set" className="input mt-2" value={p.activeQuestionSetId || ''}
                disabled={p.questionSetsLoading || p.savedSets.length === 0}
                onChange={e => e.target.value && p.onSelectQuestionSet(e.target.value)}>
                <option value="">{p.questionSetsLoading ? 'กำลังโหลดชุดเกม…' : p.savedSets.length ? 'เลือกชุดเกมที่เคยบันทึก' : 'ยังไม่มีชุดเกมที่บันทึกไว้'}</option>
                {p.savedSets.map(set => <option key={set.id} value={set.id}>{set.name} · {set.questions.length} ข้อ</option>)}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="block text-sm font-semibold" htmlFor="question-set-name">
                ชื่อชุดเกม
                <input id="question-set-name" className="input mt-2" value={p.questionSetName}
                  onChange={e => p.onQuestionSetNameChange(e.target.value)} maxLength={60}
                  placeholder="เช่น ประวัติศาสตร์ไทย ชุดที่ 1" />
              </label>
              <button type="button" className="btn btn-secondary self-end" onClick={p.onCreateNewSet}>
                <Plus size={16} aria-hidden />ชุดใหม่
              </button>
              <button type="button" className="btn btn-sky self-end"
                disabled={p.questionSetSaving || !p.questionSetName.trim() || (p.published && !p.canPublish)}
                onClick={p.onSaveQuestionSet}>
                <Save size={16} aria-hidden />
                {p.questionSetSaving
                  ? 'กำลังบันทึก…'
                  : p.published
                    ? 'บันทึกและเผยแพร่'
                    : p.activeQuestionSetId
                      ? 'บันทึกชุดนี้'
                      : 'บันทึกชุดเกม'}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-cream/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-soft">ต้องการเพิ่ม แก้ไข หรือตั้งค่าข้อมูลของแต่ละข้อใช่ไหม?</p>
            <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={p.onEditQuestions}>
              <BookOpen size={16} aria-hidden />แก้ไขข้อมูลแต่ละข้อ
            </button>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-mint bg-mint-soft p-4">
            <input type="checkbox" checked={p.published} disabled={!p.published && !p.canPublish} onChange={event => p.onPublishedChange(event.target.checked)}
              className="mt-1 accent-[#2b3a55]" />
            <span>
              <span className="block text-sm font-bold">เผยแพร่ให้เลือกเล่นใน Teamwork และ Solo Practice</span>
              <span className="mt-1 block text-xs leading-5 text-ink-soft">ติ๊กช่องนี้แล้วกด “บันทึกและเผยแพร่” เพื่อให้ชุดเกมปรากฏในรายการเลือกเล่น ต้องมีภาพ หัวข้อ และคำตอบครบทุกข้อที่เปิดใช้งาน ผู้ใช้ที่ลงชื่อเข้าใช้สามารถอ่านข้อมูลในชุดเกมที่เผยแพร่ได้</span>
              {!p.canPublish && <span className="mt-1 block text-xs font-semibold text-coral-deep">ยังเผยแพร่ไม่ได้: ตรวจสอบข้อที่เปิดใช้งานให้มีภาพ หัวข้อ และคำตอบ</span>}
            </span>
          </label>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="game-settings-title">
          <div className="mb-5">
            <h2 id="game-settings-title" className="text-lg font-bold">โหมดและกติกา</h2>
            <p className="mt-1 text-sm text-ink-soft">กำหนดกติกาสำหรับห้อง Battle</p>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">ประเภทห้อง</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {modes.map(({ value, title, subtitle, description, Icon, selectedClass }) => (
                <label key={value}
                  className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors ${p.mode === value ? selectedClass : 'border-line bg-paper hover:bg-cream/70'}`}>
                  <input type="radio" name="room-mode" value={value} checked={p.mode === value}
                    onChange={() => p.onModeChange(value)} className="mt-1 accent-[#2b3a55]" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-bold">
                      <Icon size={17} aria-hidden />{title}<span className="font-medium text-ink-soft">· {subtitle}</span>
                    </span>
                    <span className="mt-1.5 block text-sm leading-5 text-ink-soft">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold" htmlFor="min-players">
              ผู้เล่นขั้นต่ำก่อนเริ่ม
              <input id="min-players" type="number" min={1} max={p.maxPlayers} value={p.minPlayers}
                onChange={e => p.onMinPlayersChange(Number(e.target.value))} className="input mt-2" />
            </label>
            <label className="block text-sm font-semibold" htmlFor="max-players">
              ผู้เล่นสูงสุด <span className="font-normal text-ink-soft">(ไม่เกิน 40 คน)</span>
              <input id="max-players" type="number" min={p.minPlayers} max={40} value={p.maxPlayers}
                onChange={e => p.onMaxPlayersChange(Number(e.target.value))} className="input mt-2" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-line bg-paper p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold" htmlFor="timer-enabled">
                <input id="timer-enabled" type="checkbox" checked={p.timerEnabled}
                  onChange={e => p.onTimerEnabledChange(e.target.checked)} className="mt-1 accent-[#2b3a55]" />
                <span>
                  <span className="flex items-center gap-2"><Clock3 size={17} aria-hidden />เปิดจับเวลาต่อข้อ</span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-ink-soft">ปิดเพื่อเล่นแบบไม่จำกัดเวลา</span>
                </span>
              </label>
              <label className="mt-3 block text-sm font-semibold" htmlFor="question-time-seconds">
                เวลาต่อข้อ
                <span className="mt-2 flex items-center gap-2">
                  <input id="question-time-seconds" type="number" min={5} max={600} step={5}
                    value={p.questionTimeSeconds} disabled={!p.timerEnabled}
                    onChange={e => p.onQuestionTimeSecondsChange(Math.max(5, Math.min(600, Number(e.target.value) || 5)))}
                    className="input min-w-0" />
                  <span className="shrink-0 font-medium text-ink-soft">วินาที</span>
                </span>
                <span className="mt-2 block text-xs font-normal leading-5 text-ink-soft">
                  5–600 วินาที · นับถอยหลังเฉพาะขณะเกมกำลังเล่น
                </span>
              </label>
            </section>

            <label className="block rounded-2xl border border-line bg-paper p-4 text-sm font-semibold" htmlFor="hint-piece-threshold">
              <span className="flex items-center gap-2"><Lightbulb size={17} aria-hidden />เปิดชิ้นก่อนขอคำใบ้</span>
              <span className="mt-3 flex items-center gap-2">
                <input id="hint-piece-threshold" type="number" min={0} max={60}
                  value={p.minPiecesForHint}
                  onChange={e => p.onMinPiecesForHintChange(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                  className="input min-w-0" />
                <span className="shrink-0 font-medium text-ink-soft">ชิ้น</span>
              </span>
              <span className="mt-2 block text-xs font-normal leading-5 text-ink-soft">
                0–60 ชิ้น · ตั้งเป็น 0 เพื่อขอคำใบ้ได้ตั้งแต่เริ่ม ในทั้งสองโหมด
              </span>
            </label>
          </div>

          {p.mode === 'solo' && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper p-4">
              <input type="checkbox" checked={p.randomize} onChange={e => p.onRandomizeChange(e.target.checked)}
                className="mt-1 accent-[#2b3a55]" />
              <span>
                <span className="flex items-center gap-2 text-sm font-bold"><Shuffle size={16} aria-hidden />สุ่มลำดับคำถาม</span>
                <span className="mt-1 block text-xs leading-5 text-ink-soft">สุ่มลำดับข้อสำหรับห้องนี้</span>
              </span>
            </label>
          )}
        </section>

        <section className="card card-tint-mint sticky bottom-3 z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-bold">พร้อมเริ่มเกมแล้วหรือยัง?</p>
            <p className="mt-1 text-sm text-ink-soft">ตรวจสอบชุดคำถามและการตั้งค่าก่อนยืนยันสร้างห้อง</p>
          </div>
          <button type="button" onClick={p.onCreateRoom}
            disabled={p.loading || p.minPlayers < 1 || p.maxPlayers < p.minPlayers || p.maxPlayers > 40 || p.questionCount === 0}
            className="btn btn-primary btn-lg w-full sm:w-auto sm:min-w-72">
            {p.loading ? 'กำลังสร้างห้อง…' : 'สร้างห้อง Battle'}
          </button>
        </section>
      </div>
    </main>
  );
}
