import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { buildPuzzleLayout, clampPieceCount, isValidPieceId } from '../services/puzzleService';
import { useQuestionImage } from './QuestionImage';
import { toast } from './Toast';

const PIECE_PALETTES = [
  ['#bdebdc', '#e3f6ef', '#74c9b1'],
  ['#cde6fa', '#e8f3fc', '#80bde8'],
  ['#e0d7f7', '#f1edfc', '#a995df'],
  ['#ffdcc4', '#fff0e4', '#efaa78'],
  ['#fff1b8', '#fff9dc', '#e6c757']
];

interface Props {
  imageFileName: string;
  pieceCount: number;
  revealedPieceIds: number[];
  onRevealPiece?: (pieceId: number) => void;
  disabled?: boolean;
  label?: string;
  controls?: ReactNode; // rendered inside the fullscreen wrapper so it stays usable
  footer?: ReactNode;
  fullscreenTargetRef?: RefObject<HTMLElement | null>;
  hideFullscreenControl?: boolean;
}

export default function JigsawBoard({ imageFileName, pieceCount, revealedPieceIds, onRevealPiece, disabled, label, controls, footer, fullscreenTargetRef, hideFullscreenControl }: Props) {
  const uid = useId().replace(/:/g, '');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.5);
  const [fullscreen, setFullscreen] = useState(false);
  const { url, status } = useQuestionImage(imageFileName);
  const total = clampPieceCount(pieceCount);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    const img = new Image();
    img.onload = () => alive && img.naturalWidth && img.naturalHeight && setAspect(img.naturalWidth / img.naturalHeight);
    img.src = url;
    return () => { alive = false; };
  }, [url]);

  const layout = useMemo(() => buildPuzzleLayout(total, aspect, 3), [total, aspect]);
  const revealed = useMemo(() => new Set(revealedPieceIds), [revealedPieceIds]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === (fullscreenTargetRef?.current || wrapperRef.current));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [fullscreenTargetRef]);

  useEffect(() => () => {
    const target = fullscreenTargetRef?.current || wrapperRef.current;
    if (document.fullscreenElement === target) void document.exitFullscreen();
  }, [fullscreenTargetRef]);

  const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const isFull = fullscreen;

  const toggleFullscreen = useCallback(async () => {
    if (isFull) {
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }
    const target = fullscreenTargetRef?.current || wrapperRef.current;
    if (!canFullscreen || !target) {
      toast('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอ', 'error');
      return;
    }
    try {
      await target.requestFullscreen();
    } catch {
      toast('เปิดเต็มหน้าจอไม่สำเร็จ กรุณาอนุญาตจากเบราว์เซอร์แล้วลองอีกครั้ง', 'error');
    }
  }, [isFull, canFullscreen, fullscreenTargetRef]);

  const reveal = (id: number) => {
    if (disabled || status !== 'ready' || !onRevealPiece || revealed.has(id) || !isValidPieceId(id, total)) return;
    onRevealPiece(id);
  };

  const revealedCount = layout.pieces.filter(p => revealed.has(p.id)).length;

  return (
    <div
      ref={wrapperRef}
      className={`flex min-h-0 flex-col gap-3 ${isFull ? 'min-h-0 flex-1' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink" aria-live="polite">
          {label ? `${label} · ` : ''}เปิดแล้ว {revealedCount}/{total} ชิ้น
        </p>
        {!hideFullscreenControl && <button type="button" onClick={toggleFullscreen} className="btn btn-secondary btn-sm">
          {isFull ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
          {isFull ? 'ออกจากเต็มหน้าจอ' : 'เปิดเต็มหน้าจอ'}
        </button>}
      </div>

      {controls && <div>{controls}</div>}
      {status === 'loading' && <p role="status" className="text-center text-sm font-semibold text-ink-soft">กำลังโหลดภาพคำถาม…</p>}

      <div className={`${isFull ? 'min-h-0 flex-1' : ''} flex items-center justify-center overflow-hidden rounded-3xl border border-line bg-paper p-2 shadow-sm sm:p-3`}>
        {status === 'error' ? (
          <div role="alert" className="py-16 text-center font-semibold text-coral-deep">ไม่สามารถเปิดภาพได้</div>
        ) : (
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="block h-auto max-h-full w-full select-none"
            style={isFull ? { maxHeight: 'calc(100vh - 11rem)' } : { maxHeight: '75vh' }}
            role="group"
            aria-label={`กระดานจิ๊กซอว์ ${total} ชิ้น`}
          >
            <defs>
              <linearGradient id={`${uid}-piece-fill`} x1="0" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity=".62" />
                <stop offset="22%" stopColor="#ffffff" stopOpacity=".2" />
                <stop offset="100%" stopColor="#52647c" stopOpacity=".08" />
              </linearGradient>
              <filter id={`${uid}-piece-shadow`} x="-20%" y="-20%" width="150%" height="160%">
                <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#293752" floodOpacity=".32" />
              </filter>
              <filter id={`${uid}-image-shadow`} x="-20%" y="-20%" width="150%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#293752" floodOpacity=".25" />
              </filter>
              {layout.pieces.map(p => (
                <clipPath key={p.id} id={`${uid}-clip-${p.id}`}><path d={p.pathData} /></clipPath>
              ))}
            </defs>
            {layout.pieces.map((p, i) => {
              const open = revealed.has(p.id);
              const fontSize = Math.min(p.width, p.height) * 0.32;
              const palette = PIECE_PALETTES[i % PIECE_PALETTES.length];
              return (
                <g
                  key={p.id}
                  role="button"
                  tabIndex={open || disabled || status !== 'ready' || !onRevealPiece ? -1 : 0}
                  aria-label={open ? `ชิ้นที่ ${p.id} เปิดแล้ว` : `เปิดชิ้นที่ ${p.id}`}
                  aria-disabled={open || disabled || status !== 'ready' || !onRevealPiece}
                  className={open || disabled || status !== 'ready' || !onRevealPiece ? '' : 'cursor-pointer'}
                  onClick={() => reveal(p.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(p.id); } }}
                >
                  {open ? (
                    <g className="tile-revealed">
                      <g clipPath={`url(#${uid}-clip-${p.id})`}>
                        {url && <image href={url} x={0} y={0} width={layout.width} height={layout.height} preserveAspectRatio="xMidYMid slice" />}
                      </g>
                      <path d={p.pathData} fill="none" stroke="#ffffff" strokeWidth={Math.max(1.2, fontSize * 0.035)} filter={`url(#${uid}-image-shadow)`} />
                    </g>
                  ) : (
                    <g>
                      <path d={p.pathData} transform="translate(0 5)" fill={palette[2]} stroke={palette[2]} strokeWidth={Math.max(1.5, fontSize * 0.05)} />
                      <path d={p.pathData} fill={palette[0]} stroke="#ffffff" strokeWidth={Math.max(1, fontSize * 0.04)} filter={`url(#${uid}-piece-shadow)`} />
                      <path d={p.pathData} fill={`url(#${uid}-piece-fill)`} stroke={palette[1]} strokeWidth={Math.max(1, fontSize * 0.025)} />
                      <text x={p.center.x} y={p.center.y + fontSize * 0.34} textAnchor="middle" fontSize={fontSize} fontWeight={800}
                        fill="#172b4d" stroke="#ffffff" strokeWidth={Math.max(1, fontSize * 0.045)} paintOrder="stroke">{p.id}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {footer}
    </div>
  );
}
