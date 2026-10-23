import { useEffect, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type Kind = 'success' | 'error' | 'info';
interface Item { id: number; kind: Kind; message: string }

const listeners = new Set<(i: Item) => void>();
let counter = 0;

export function toast(message: string, kind: Kind = 'info') {
  const item = { id: ++counter, kind, message };
  listeners.forEach(l => l(item));
}

const STYLE: Record<Kind, string> = {
  success: 'card-tint-mint text-mint-deep',
  error: 'card-tint-coral text-coral-deep',
  info: 'card-tint-sky text-sky-deep'
};

export function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const timers = new Set<number>();
    const onToast = (item: Item) => {
      setItems(prev => [...prev.slice(-3), item]);
      const t = window.setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== item.id));
        timers.delete(t);
      }, item.kind === 'error' ? 6000 : 3500);
      timers.add(t);
    };
    listeners.add(onToast);
    return () => { listeners.delete(onToast); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[80] flex flex-col items-center gap-2 px-3" aria-live="polite">
      {items.map(i => (
        <div key={i.id} role={i.kind === 'error' ? 'alert' : 'status'} className={`card pointer-events-auto flex max-w-md items-center gap-2 px-4 py-3 text-sm font-semibold ${STYLE[i.kind]}`}>
          {i.kind === 'success' ? <CheckCircle2 size={18} aria-hidden /> : i.kind === 'error' ? <XCircle size={18} aria-hidden /> : <Info size={18} aria-hidden />}
          <span>{i.message}</span>
        </div>
      ))}
    </div>
  );
}
