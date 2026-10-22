export interface PuzzlePieceDefinition {
  id: number;
  row: number;
  col: number;
  center: { x: number; y: number };
  pathData: string;
  clipPathId: string;
  viewBox: string;
}

export const PUZZLE_COLS = 5;
export const PUZZLE_ROWS = 2;
export const PUZZLE_WIDTH = 1000;
export const PUZZLE_HEIGHT = 650;

/**
 * Predefined tab orientations for a 5x2 jigsaw puzzle grid (10 pieces).
 * 1 = tab outwards (positive offset)
 * -1 = tab inwards / blank (negative offset)
 * 0 = flat border
 */
// Horizontal borders between Row 0 and Row 1 (5 segments)
const HORIZONTAL_TABS = [1, -1, 1, -1, 1];

// Vertical borders between Col c and Col c+1 (2 rows x 4 inner columns)
// row 0: col 0-1, 1-2, 2-3, 3-4
// row 1: col 0-1, 1-2, 2-3, 3-4
const VERTICAL_TABS = [
  [-1, 1, -1, 1], // row 0
  [1, -1, 1, -1]  // row 1
];

/**
 * Generates an authentic interlocking jigsaw edge between (x1, y1) and (x2, y2).
 * direction: 1 for tab outwards, -1 for tab inwards (blank), 0 for flat edge
 */
function createJigsawEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tabDir: number
): string {
  if (tabDir === 0) {
    return `L ${x2.toFixed(1)} ${y2.toFixed(1)} `;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  // Unit vectors along the edge (ux, uy) and perpendicular to it (nx, ny)
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular vector pointing "outwards" relative to edge direction
  const nx = -uy * tabDir;
  const ny = ux * tabDir;

  // Key relative points along the edge (0 to 1) and tab depth (perpendicular)
  const p = (u: number, n: number) => {
    const px = x1 + u * len * ux + n * len * nx;
    const py = y1 + u * len * uy + n * len * ny;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  };

  // Classic interlocking tab shape with smooth cubic bezier curves:
  // 1. Line to base of neck (0.36)
  // 2. Curve inward slightly into neck (0.38, -0.04) then flare out into round head bulb (0.42, 0.16)
  // 3. Bulb crown peak (0.50, 0.22)
  // 4. Return curve through opposite side of head (0.58, 0.16) to neck (0.62, -0.04)
  // 5. Connect back to baseline (0.64, 0) and line to end
  return (
    `L ${p(0.36, 0)} ` +
    `C ${p(0.38, -0.04)} ${p(0.38, 0.16)} ${p(0.44, 0.20)} ` +
    `C ${p(0.47, 0.23)} ${p(0.53, 0.23)} ${p(0.56, 0.20)} ` +
    `C ${p(0.62, 0.16)} ${p(0.62, -0.04)} ${p(0.64, 0)} ` +
    `L ${x2.toFixed(1)} ${y2.toFixed(1)} `
  );
}

/**
 * Builds all 10 interlocking 3D jigsaw puzzle piece paths for a 1000x650 viewport.
 */
export function generate10PiecePuzzle(): PuzzlePieceDefinition[] {
  const pieces: PuzzlePieceDefinition[] = [];
  const colW = PUZZLE_WIDTH / PUZZLE_COLS;
  const rowH = PUZZLE_HEIGHT / PUZZLE_ROWS;

  let idCounter = 1;

  for (let r = 0; r < PUZZLE_ROWS; r++) {
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const xLeft = c * colW;
      const xRight = (c + 1) * colW;
      const yTop = r * rowH;
      const yBottom = (r + 1) * rowH;

      // Determine tabs for 4 sides: Top, Right, Bottom, Left
      // Top edge (from top-left to top-right)
      const topTab = r === 0 ? 0 : -HORIZONTAL_TABS[c]; // Opposite of bottom of row r-1

      // Right edge (from top-right to bottom-right)
      const rightTab = c === PUZZLE_COLS - 1 ? 0 : VERTICAL_TABS[r][c];

      // Bottom edge (from bottom-right to bottom-left)
      const bottomTab = r === PUZZLE_ROWS - 1 ? 0 : HORIZONTAL_TABS[c];

      // Left edge (from bottom-left to top-left)
      const leftTab = c === 0 ? 0 : -VERTICAL_TABS[r][c - 1];

      // Build path clockwise starting at top-left
      let path = `M ${xLeft.toFixed(1)} ${yTop.toFixed(1)} `;

      // Top edge: (xLeft, yTop) -> (xRight, yTop)
      path += createJigsawEdge(xLeft, yTop, xRight, yTop, topTab);

      // Right edge: (xRight, yTop) -> (xRight, yBottom)
      path += createJigsawEdge(xRight, yTop, xRight, yBottom, rightTab);

      // Bottom edge: (xRight, yBottom) -> (xLeft, yBottom)
      path += createJigsawEdge(xRight, yBottom, xLeft, yBottom, bottomTab);

      // Left edge: (xLeft, yBottom) -> (xLeft, yTop)
      path += createJigsawEdge(xLeft, yBottom, xLeft, yTop, leftTab);

      path += 'Z';

      const pieceId = idCounter++;
      pieces.push({
        id: pieceId,
        row: r,
        col: c,
        center: {
          x: xLeft + colW / 2,
          y: yTop + rowH / 2
        },
        pathData: path,
        clipPathId: `piece-clip-${pieceId}`,
        viewBox: `0 0 ${PUZZLE_WIDTH} ${PUZZLE_HEIGHT}`
      });
    }
  }

  return pieces;
}

export const PUZZLE_PIECES = generate10PiecePuzzle();
