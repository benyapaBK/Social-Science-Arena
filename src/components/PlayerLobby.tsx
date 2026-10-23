import { useMemo, useState, type FormEvent } from 'react';
import { Check, Loader2, Users } from 'lucide-react';
import type { Room } from '../types';
import { EMOJI_AVATARS, type EmojiAvatar } from '../data/emojis';

export const MAX_NAME_LENGTH = 20;

export function sanitizeDisplayName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

interface Props {
  room: Room;
  currentUid: string;
  onJoin: (displayName: string, avatar: EmojiAvatar) => Promise<string | null>; // returns error message or null
}

export function PlayerLobby({ room, currentUid, onJoin }: Props) {
  const existing = room.players?.[currentUid];
  const isTeam = room.mode === 'team';
  const [name, setName] = useState(existing?.displayName || '');
  const [avatarId, setAvatarId] = useState<string>(() => {
    const mine = EMOJI_AVATARS.find(a => a.emoji === existing?.avatarEmoji);
    if (mine) return mine.id;
    const taken = new Set(Object.values(room.players || {}).map(p => p.avatarEmoji));
    return (EMOJI_AVATARS.find(a => !taken.has(a.emoji)) || EMOJI_AVATARS[0]).id;
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const takenByOthers = useMemo(
    () => new Set(Object.entries(room.players || {}).filter(([uid]) => uid !== currentUid).map(([, p]) => p.avatarEmoji)),
    [room.players, currentUid]
  );
  const players = Object.values(room.players || {});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const clean = sanitizeDisplayName(name);
    if (!clean) { setError('กรุณาระบุชื่อผู้เล่น (ห้ามเว้นว่างหรือใส่เฉพาะช่องว่าง)'); return; }
    const avatar = EMOJI_AVATARS.find(a => a.id === avatarId) || EMOJI_AVATARS[0];
    if (takenByOthers.has(avatar.emoji)) { setError('อวตารนี้มีผู้เล่นอื่นเลือกแล้ว กรุณาเลือกอวตารอื่น'); return; }
    setBusy(true);
    setError('');
    const problem = await onJoin(clean, avatar);
    if (problem) setError(problem);
    setBusy(false);
  };

  if (existing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <section className="card p-6 text-center sm:p-8">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-mint text-5xl" aria-hidden>{existing.avatarEmoji}</div>
          <h1 className="mt-4 text-2xl font-bold">ยินดีต้อนรับ, {existing.displayName}!</h1>
          <p className="mt-1 text-sm text-ink-soft">ห้อง <strong>{room.name}</strong> · รหัส <span className="font-mono font-bold">{room.roomId}</span></p>
          <p role="status" className="card-tint-butter mt-5 rounded-2xl border p-3 text-sm font-semibold text-butter-deep">กำลังรอโฮสต์กดเริ่มเกม…</p>
          <h2 className="mt-6 flex items-center justify-center gap-2 text-sm font-bold"><Users size={16} aria-hidden />ผู้เล่นในห้อง ({players.length}/{room.settings.maxPlayers})</h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {players.map(p => (
              <li key={p.uid} className="badge badge-sky !text-sm"><span aria-hidden>{p.avatarEmoji}</span>{p.displayName}{p.uid === currentUid ? ' (คุณ)' : ''}</li>
            ))}
          </ul>
          {isTeam && <p className="mt-4 text-xs text-ink-soft">โหมดทีม: โฮสต์จะเปิดชิ้นส่วนภาพ ส่วนคุณช่วยกันสังเกตและส่งคำตอบ</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <form onSubmit={submit} className="card space-y-6 p-5 sm:p-8" noValidate>
        <header>
          <h1 className="text-2xl font-bold">ตั้งค่าผู้เล่น</h1>
          <p className="mt-1 text-sm text-ink-soft">ห้อง <strong>{room.name}</strong> · ไม่ต้องล็อกอินและไม่เก็บอีเมล</p>
        </header>

        {error && <p role="alert" className="card-tint-coral rounded-xl border p-3 text-sm font-semibold text-coral-deep">{error}</p>}

        <label className="block text-sm font-semibold" htmlFor="player-name">
          ชื่อผู้เล่น <span className="font-normal text-ink-soft">(สูงสุด {MAX_NAME_LENGTH} ตัวอักษร)</span>
          <input id="player-name" className="input mt-2" value={name} maxLength={MAX_NAME_LENGTH} onChange={e => setName(e.target.value)} placeholder="เช่น น้องมะลิ" autoComplete="nickname" autoFocus />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">เลือกอวตาร</legend>
          <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto rounded-2xl border border-line bg-cream p-2 sm:grid-cols-8" role="radiogroup">
            {EMOJI_AVATARS.map(a => {
              const taken = takenByOthers.has(a.emoji);
              const selected = a.id === avatarId;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${a.name}${taken ? ' (ถูกเลือกแล้ว)' : ''}`}
                  disabled={taken}
                  onClick={() => setAvatarId(a.id)}
                  className={`relative grid aspect-square place-items-center rounded-xl border-2 text-2xl transition ${selected ? 'border-ink bg-mint' : 'border-transparent bg-paper hover:bg-mint-soft'} disabled:opacity-30`}
                >
                  <span aria-hidden>{a.emoji}</span>
                  {selected && <Check size={12} className="absolute right-1 top-1 text-mint-deep" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy ? <><Loader2 size={18} className="animate-spin" aria-hidden />กำลังเข้าห้อง…</> : isTeam ? 'เข้าร่วมทีม' : 'เริ่มเกม'}
        </button>
      </form>
    </main>
  );
}
