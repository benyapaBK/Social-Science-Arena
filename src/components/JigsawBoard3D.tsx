import React, { useState } from 'react';
import { 
  PUZZLE_PIECES, 
  PUZZLE_WIDTH, 
  PUZZLE_HEIGHT, 
  PuzzlePieceDefinition 
} from '../services/puzzleService';
import { soundService } from '../services/soundService';
import { Eye, Layers, Compass, Sparkles } from 'lucide-react';

interface JigsawBoard3DProps {
  imageSrc: string; // e.g. /assets/q1.png
  revealedPieceIds: number[];
  onRevealPiece: (pieceId: number) => void;
  disabled?: boolean;
  questionNumber: number;
  totalQuestions: number;
  allRevealed?: boolean;
}

export const JigsawBoard3D: React.FC<JigsawBoard3DProps> = ({
  imageSrc,
  revealedPieceIds,
  onRevealPiece,
  disabled = false,
  questionNumber,
  totalQuestions,
  allRevealed = false
}) => {
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [hoveredPiece, setHoveredPiece] = useState<number | null>(null);

  const handlePieceClick = (piece: PuzzlePieceDefinition) => {
    if (disabled) return;
    if (revealedPieceIds.includes(piece.id) || allRevealed) return;

    soundService.playPieceClick();
    onRevealPiece(piece.id);
  };

  const isPieceRevealed = (id: number) => allRevealed || revealedPieceIds.includes(id);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Mode & View Toggle Bar */}
      <div className="w-full max-w-7xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#F5F0E6]/70 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#62F5C5] animate-ping" />
            เปิดแล้ว: <strong className="text-[#62F5C5]">{allRevealed ? 10 : revealedPieceIds.length}</strong> / 10 ชิ้น
          </span>
          {revealedPieceIds.length === 0 && !allRevealed && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D6B36A]/20 text-[#D6B36A] border border-[#D6B36A]/30 font-medium">
              🎁 ชิ้นแรกฟรี!
            </span>
          )}
        </div>

        <button
          onClick={() => setIs3DMode(!is3DMode)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#103B32]/70 hover:bg-[#103B32] text-[#F5F0E6] border border-[#62F5C5]/30 transition-all hover:border-[#62F5C5]"
          title={is3DMode ? "เปลี่ยนเป็นมุมมองระนาบตรง (Flat 2D View)" : "เปลี่ยนเป็นมุมมองสามมิติ (Isometric 3D View)"}
        >
          {is3DMode ? (
            <>
              <Layers className="w-3.5 h-3.5 text-[#62F5C5]" />
              <span>มุมมอง 3D ไอโซเมตริก</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-[#D6B36A]" />
              <span>มุมมองระนาบตรง 2D</span>
            </>
          )}
        </button>
      </div>

      {/* 3D Isometric Viewport Container */}
      <div 
        className="w-full max-w-7xl relative perspective-1000 flex items-center justify-center p-3 sm:p-6 transition-all duration-500"
        style={{ minHeight: '520px' }}
      >
        <div
          className={`w-full relative transition-all duration-700 ease-out preserve-3d ${
            is3DMode 
              ? 'transform sm:scale-[0.98] rotate-x-[18deg] -rotate-z-[5deg] rotate-y-[6deg] hover:rotate-x-[15deg] hover:-rotate-z-[4deg] hover:rotate-y-[4deg]' 
              : 'transform-none'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.75)) drop-shadow(0 0 20px rgba(98,245,197,0.15))'
          }}
        >
          {/* Wooden / Deep Emerald 3D Base Slab under the puzzle */}
          <div 
            className="absolute -inset-3 sm:-inset-5 rounded-2xl bg-gradient-to-br from-[#103B32] via-[#0B1715] to-[#050C0A] border-2 border-[#62F5C5]/30 shadow-2xl pointer-events-none"
            style={{
              transform: 'translateZ(-14px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(98,245,197,0.1)'
            }}
          >
            {/* Subtle corner golden studs */}
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#D6B36A] shadow-md border border-[#F5F0E6]/50" />
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#D6B36A] shadow-md border border-[#F5F0E6]/50" />
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#D6B36A] shadow-md border border-[#F5F0E6]/50" />
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#D6B36A] shadow-md border border-[#F5F0E6]/50" />
          </div>

          {/* Master SVG Puzzle Board */}
          <svg
            viewBox={`0 0 ${PUZZLE_WIDTH} ${PUZZLE_HEIGHT}`}
            className="w-full h-auto block select-none overflow-visible rounded-xl"
            style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.6))' }}
          >
            {/* SVG Defs: Clips, Filters & Patterns */}
            <defs>
              {/* Individual clipPath for each piece */}
              {PUZZLE_PIECES.map(piece => (
                <clipPath key={piece.clipPathId} id={piece.clipPathId}>
                  <path d={piece.pathData} />
                </clipPath>
              ))}

              {/* Full Board Clip */}
              <clipPath id="full-board-clip">
                <rect x="0" y="0" width={PUZZLE_WIDTH} height={PUZZLE_HEIGHT} rx="12" />
              </clipPath>

              {/* Glowing Neon Edge Filter */}
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Drop Shadow for lifted piece */}
              <filter id="piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Board Background Base (Lobby.png with low opacity & grid watermark) */}
            <g clipPath="url(#full-board-clip)">
              <rect x="0" y="0" width={PUZZLE_WIDTH} height={PUZZLE_HEIGHT} fill="#0B1715" />
              <image 
                href="/assets/Lobby.png" 
                x="0" 
                y="0" 
                width={PUZZLE_WIDTH} 
                height={PUZZLE_HEIGHT} 
                preserveAspectRatio="xMidYMid slice" 
                opacity="0.14" 
              />
              <rect x="0" y="0" width={PUZZLE_WIDTH} height={PUZZLE_HEIGHT} fill="none" stroke="rgba(98,245,197,0.2)" strokeWidth="2" />
            </g>

            {/* Render each of the 10 Jigsaw Pieces */}
            {PUZZLE_PIECES.map((piece) => {
              const revealed = isPieceRevealed(piece.id);
              const isHovered = hoveredPiece === piece.id && !revealed && !disabled;

              return (
                <g 
                  key={piece.id}
                  onClick={() => handlePieceClick(piece)}
                  onMouseEnter={() => setHoveredPiece(piece.id)}
                  onMouseLeave={() => setHoveredPiece(null)}
                  className={`transition-all duration-300 ${
                    revealed 
                      ? 'cursor-default' 
                      : disabled 
                        ? 'cursor-not-allowed opacity-80' 
                        : 'cursor-pointer'
                  }`}
                  style={{
                    transformOrigin: `${piece.center.x}px ${piece.center.y}px`,
                    transform: isHovered 
                      ? 'scale(1.03) translateZ(10px)' 
                      : revealed 
                        ? 'translateZ(2px)' 
                        : 'translateZ(0px)',
                    filter: isHovered 
                      ? 'url(#piece-shadow)' 
                      : 'none'
                  }}
                >
                  {/* --- REVEALED STATE: Shows actual clipped part of the question photo --- */}
                  {revealed ? (
                    <g className="animate-in fade-in duration-500">
                      {/* Clipped image slice */}
                      <image
                        href={imageSrc}
                        x="0"
                        y="0"
                        width={PUZZLE_WIDTH}
                        height={PUZZLE_HEIGHT}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#${piece.clipPathId})`}
                      />

                      {/* Glossy 3D Bevel Overlay on revealed piece */}
                      <path
                        d={piece.pathData}
                        fill="none"
                        stroke="rgba(98, 245, 197, 0.45)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="pointer-events-none"
                      />

                      {/* Subtle golden corner lock icon or indicator */}
                      <circle
                        cx={piece.center.x}
                        cy={piece.center.y}
                        r="14"
                        fill="rgba(11, 23, 21, 0.45)"
                        stroke="#62F5C5"
                        strokeWidth="1.5"
                        opacity="0.75"
                        className="pointer-events-none transition-opacity hover:opacity-10"
                      />
                      <text
                        x={piece.center.x}
                        y={piece.center.y + 4.5}
                        textAnchor="middle"
                        fill="#62F5C5"
                        fontSize="12"
                        fontWeight="bold"
                        className="pointer-events-none select-none font-mono"
                        opacity="0.8"
                      >
                        ✓
                      </text>
                    </g>
                  ) : (
                    /* --- UNREVEALED FROSTED TILE STATE: Mystery tile with Piece Number --- */
                    <g>
                      {/* Shaded Emerald Glass Body */}
                      <path
                        d={piece.pathData}
                        fill={isHovered ? '#14463C' : '#0F3029'}
                        stroke={isHovered ? '#62F5C5' : 'rgba(98, 245, 197, 0.3)'}
                        strokeWidth={isHovered ? '3.5' : '1.8'}
                        strokeLinejoin="round"
                        style={{
                          transition: 'all 0.25s ease',
                          filter: isHovered ? 'url(#neon-glow)' : 'none'
                        }}
                      />

                      {/* Textured Frosted Pattern inside unrevealed piece */}
                      <path
                        d={piece.pathData}
                        fill="url(#frosted-dots)"
                        opacity={isHovered ? 0.35 : 0.2}
                      />

                      {/* Piece Number Badge Cluster */}
                      <g className="pointer-events-none">
                        {/* Outer Glow Ring on Hover */}
                        {isHovered && (
                          <circle
                            cx={piece.center.x}
                            cy={piece.center.y}
                            r="28"
                            fill="none"
                            stroke="#62F5C5"
                            strokeWidth="2"
                            opacity="0.6"
                            className="animate-ping"
                          />
                        )}

                        {/* Metallic / Gold Badge Background */}
                        <circle
                          cx={piece.center.x}
                          cy={piece.center.y}
                          r="22"
                          fill="rgba(11, 23, 21, 0.88)"
                          stroke={isHovered ? '#62F5C5' : '#D6B36A'}
                          strokeWidth={isHovered ? '2.5' : '2'}
                          style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))' }}
                        />

                        {/* Piece Number (1-10) */}
                        <text
                          x={piece.center.x}
                          y={piece.center.y + 7}
                          textAnchor="middle"
                          fill={isHovered ? '#62F5C5' : '#D6B36A'}
                          fontSize="20"
                          fontWeight="700"
                          fontFamily="'Kanit', sans-serif"
                          className="select-none tracking-tight"
                        >
                          {piece.id}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Control hints */}
      <div className="text-center mt-2">
        <p className="text-xs text-[#F5F0E6]/60 flex items-center justify-center gap-2">
          <span>คลิกที่ชิ้นส่วนเพื่อเปิดภาพปริศนา</span>
          <span className="text-[#62F5C5]">•</span>
          <span>เปิดครบ 5 ชิ้นเพื่อขอคำใบ้</span>
          <span className="text-[#D6B36A]">•</span>
          <span>ยิ่งเปิดน้อยชิ้น ยิ่งได้คะแนนสูง!</span>
        </p>
      </div>
    </div>
  );
};
