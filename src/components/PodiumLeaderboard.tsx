import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { BookOpen, CheckCircle2, Download, Flame, RotateCcw, Trophy, XCircle } from 'lucide-react';
import type { FinalPlayerResult, Question, Room } from '../types';
import { soundService } from '../services/soundService';
import { KnowledgeArchiveModal } from './KnowledgeArchiveModal';
import { getActiveQuestions } from './TeamBoard';

interface Props {
  room: Room;
  results: FinalPlayerResult[];
  onPlayAgain?: () => void;
  onBackToLobby: () => void;
  isHost?: boolean;
  knowledgeQuestions?: Question[] | null;
  knowledgeError?: string;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_TINT = ['card-tint-butter', 'card-tint-sky', 'card-tint-peach'];

export function PodiumLeaderboard({
  room,
  results,
  onPlayAgain,
  onBackToLobby,
  isHost = false,
  knowledgeQuestions,
  knowledgeError = ''
}: Props) {
  const [archive, setArchive] = useState(false);
  const isTeam = room.mode === 'team';

  useEffect(() => {
    soundService.playFireworks();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const end = Date.now() + 2500;
    const colors = ['#bdebdc', '#ffdcc4', '#e0d7f7', '#fff1b8', '#cde6fa'];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, []);

  const exportCsv = () => {
    if (!results.length) return;
    const head = ['อันดับ', 'ชื่อผู้เล่น', 'อวตาร', 'คะแนนรวม', 'ตอบถูก', 'เวลาตอบรวม(วินาที)', 'คอมโบสูงสุด'];
    const rows = results.map(r => [r.rank, `"${r.displayName.replace(/"/g, '""')}"`, r.avatarEmoji, r.finalScore, r.correctCount, r.totalResponseTime, r.maxCombo]);
    const blob = new Blob(['\uFEFF' + [head.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SocialScience_Arena_Room_${room.roomId}_Results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const active = getActiveQuestions(room);
  const solvedCount = active.filter(q => room.team?.solved?.[q.id]).length;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="text-center">
        <span className="badge badge-butter"><Trophy size={14} aria-hidden />สรุปผลการเล่น</span>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{isTeam ? 'ทีมของเราทำได้ยอดเยี่ยม!' : 'ผลการแข่งขัน'}</h1>
        <p className="mt-1 text-ink-soft">{room.name} · รหัส {room.roomId}</p>
      </header>

      {isTeam ? (
        <section className="card p-5" aria-label="สรุปรายข้อ">
          <h2 className="text-lg font-bold">ไขปริศนาได้ {solvedCount}/{active.length} ข้อ</h2>
          <ol className="mt-4 space-y-2">
            {active.map((q, i) => {
              const s = room.team?.solved?.[q.id];
              return (
                <li key={q.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-cream p-3 text-sm">
                  {s ? <CheckCircle2 size={18} className="text-mint-deep" aria-label="เฉลยแล้ว" /> : <XCircle size={18} className="text-coral-deep" aria-label="ยังไม่ได้เฉลย" />}
                  <strong>ข้อ {i + 1} {q.topic}</strong>
                  <span className="text-ink-soft">{s ? `เฉลย: ${s.answer}${s.solvedByName ? ` · ตอบถูกโดย ${s.solvedByName}` : s.via === 'host' ? ' · โฮสต์เฉลย' : ''}` : 'ไม่ได้เฉลย'}</span>
                </li>
              );
            })}
          </ol>
          {results.length > 0 && <p className="mt-4 text-sm text-ink-soft">ผู้เล่นในทีม: {results.map(r => `${r.avatarEmoji} ${r.displayName}`).join(', ')}</p>}
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="โพเดียม">
            {results.slice(0, 3).map((r, i) => (
              <div key={r.uid} className={`card ${PODIUM_TINT[i]} p-5 text-center ${i === 0 ? 'sm:-translate-y-3' : ''}`}>
                <div className="text-3xl" aria-hidden>{MEDAL[i]}</div>
                <div className="mt-1 text-4xl" aria-hidden>{r.avatarEmoji}</div>
                <p className="mt-1 text-sm font-semibold text-ink-soft">อันดับ {r.rank}</p>
                <p className="truncate text-lg font-bold">{r.displayName}</p>
                <p className="text-2xl font-bold">{r.finalScore} <span className="text-sm font-semibold">คะแนน</span></p>
              </div>
            ))}
          </section>

          <section className="card overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">ตารางอันดับ</caption>
              <thead><tr className="text-xs text-ink-soft"><th className="p-2">#</th><th className="p-2">ผู้เล่น</th><th className="p-2">คะแนน</th><th className="p-2">ตอบถูก</th><th className="p-2">เวลา(วิ)</th><th className="p-2"><Flame size={14} className="inline" aria-label="คอมโบ" /></th></tr></thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.uid} className="border-t border-line">
                    <td className="p-2 font-bold">{r.rank}</td>
                    <td className="p-2"><span aria-hidden>{r.avatarEmoji}</span> {r.displayName}</td>
                    <td className="p-2 font-bold">{r.finalScore}</td>
                    <td className="p-2">{r.correctCount}</td>
                    <td className="p-2">{r.totalResponseTime}</td>
                    <td className="p-2">{r.maxCombo}</td>
                  </tr>
                ))}
                {results.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink-soft">ยังไม่มีผลการเล่น</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-sky"
          disabled={isTeam && !knowledgeQuestions?.length}
          onClick={() => setArchive(true)}><BookOpen size={16} aria-hidden />ทบทวนความรู้</button>
        {isHost && <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={!results.length}><Download size={16} aria-hidden />Export CSV</button>}
        {onPlayAgain && <button type="button" className="btn btn-primary" onClick={onPlayAgain}><RotateCcw size={16} aria-hidden />เล่นอีกครั้ง</button>}
        <button type="button" className="btn btn-secondary" onClick={onBackToLobby}>กลับหน้าแรก</button>
      </div>
      {isTeam && knowledgeError && <p role="alert" className="text-center text-sm font-semibold text-coral-deep">{knowledgeError}</p>}

      {archive && <KnowledgeArchiveModal questions={isTeam ? knowledgeQuestions || [] : active} onClose={() => setArchive(false)} />}
    </main>
  );
}
