export interface PuzzlePieceDefinition {
  id: number; // 1-based, unique per board
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  center: { x: number; y: number };
  pathData: string;
}

export interface PuzzleLayout {
  cols: number;
  rows: number;
  width: number;
  height: number;
  pieces: PuzzlePieceDefinition[];
}

export const PUZZLE_WIDTH = 1000;
export const MIN_PIECES = 2;
export const MAX_PIECES = 60;
export const DEFAULT_PIECES = 10;
export const PIECE_PRESETS = [4, 6, 9, 12, 16, 25] as const;

export function clampPieceCount(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_PIECES;
  return Math.min(MAX_PIECES, Math.max(MIN_PIECES, n));
}

/**
 * Picks rows x cols (rows * cols === count) whose cells are closest to square
 * for the given image aspect ratio (width / height). Never assumes a perfect square count.
 */
export function chooseGrid(count: number, aspect = 1.5): { cols: number; rows: number } {
  const total = clampPieceCount(count);
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  let best = { cols: total, rows: 1 };
  let bestScore = Infinity;
  for (let rows = 1; rows <= total; rows++) {
    if (total % rows !== 0) continue;
    const cols = total / rows;
    const cellAspect = safeAspect * rows / cols; // cell width / cell height
    const score = Math.abs(Math.log(cellAspect));
    if (score < bestScore - 1e-9) {
      bestScore = score;
      best = { cols, rows };
    }
  }
  return best;
}

// Deterministic PRNG so every client builds identical tab shapes.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Classic interlocking tab between (x1,y1) and (x2,y2). tabDir: 1 out, -1 in, 0 flat.
function edge(x1: number, y1: number, x2: number, y2: number, tabDir: number): string {
  const f = (n: number) => n.toFixed(1);
  if (tabDir === 0) return `L ${f(x2)} ${f(y2)} `;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * tabDir;
  const ny = ux * tabDir;
  const p = (u: number, n: number) => `${f(x1 + u * len * ux + n * len * nx)},${f(y1 + u * len * uy + n * len * ny)}`;
  return (
    `L ${p(0.36, 0)} ` +
    `C ${p(0.38, -0.04)} ${p(0.38, 0.16)} ${p(0.44, 0.2)} ` +
    `C ${p(0.47, 0.23)} ${p(0.53, 0.23)} ${p(0.56, 0.2)} ` +
    `C ${p(0.62, 0.16)} ${p(0.62, -0.04)} ${p(0.64, 0)} ` +
    `L ${f(x2)} ${f(y2)} `
  );
}

export function buildPuzzleLayout(pieceCount: number, imageAspect = 1.5, seed = 1): PuzzleLayout {
  const aspect = Math.min(2.5, Math.max(0.4, Number.isFinite(imageAspect) && imageAspect > 0 ? imageAspect : 1.5));
  const { cols, rows } = chooseGrid(pieceCount, aspect);
  const width = PUZZLE_WIDTH;
  const height = Math.round(PUZZLE_WIDTH / aspect);
  const cw = width / cols;
  const ch = height / rows;
  const rand = mulberry32(seed * 7919 + cols * 31 + rows);

  // Internal seams: horizontal (between row r and r+1) and vertical (between col c and c+1).
  const horizontal: number[][] = Array.from({ length: Math.max(0, rows - 1) }, () =>
    Array.from({ length: cols }, () => (rand() < 0.5 ? 1 : -1)));
  const vertical: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: Math.max(0, cols - 1) }, () => (rand() < 0.5 ? 1 : -1)));

  const pieces: PuzzlePieceDefinition[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * cw;
      const x1 = (c + 1) * cw;
      const y0 = r * ch;
      const y1 = (r + 1) * ch;
      const top = r === 0 ? 0 : -horizontal[r - 1][c];
      const right = c === cols - 1 ? 0 : vertical[r][c];
      const bottom = r === rows - 1 ? 0 : horizontal[r][c];
      const left = c === 0 ? 0 : -vertical[r][c - 1];
      const path =
        `M ${x0.toFixed(1)} ${y0.toFixed(1)} ` +
        edge(x0, y0, x1, y0, top) +
        edge(x1, y0, x1, y1, right) +
        edge(x1, y1, x0, y1, bottom) +
        edge(x0, y1, x0, y0, left) +
        'Z';
      pieces.push({
        id: r * cols + c + 1,
        row: r,
        col: c,
        x: x0,
        y: y0,
        width: cw,
        height: ch,
        center: { x: x0 + cw / 2, y: y0 + ch / 2 },
        pathData: path
      });
    }
  }
  return { cols, rows, width, height, pieces };
}

export function isValidPieceId(id: number, pieceCount: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= clampPieceCount(pieceCount);
}

/** Picks one hidden piece id uniformly at random, or null when everything is revealed. */
export function pickRandomHiddenPiece(pieceCount: number, revealed: number[], rng: () => number = Math.random): number | null {
  const total = clampPieceCount(pieceCount);
  const shown = new Set(revealed);
  const hidden: number[] = [];
  for (let id = 1; id <= total; id++) if (!shown.has(id)) hidden.push(id);
  if (hidden.length === 0) return null;
  return hidden[Math.floor(rng() * hidden.length)];
}

export function allPieceIds(pieceCount: number): number[] {
  return Array.from({ length: clampPieceCount(pieceCount) }, (_, i) => i + 1);
}
