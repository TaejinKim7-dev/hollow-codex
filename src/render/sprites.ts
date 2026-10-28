/** 옛 시트(칸 크기 tilePx)의 index번째 칸의 원본 사각형. 32px 칸에는 확대해서 그린다. */
export function legacyDraw(columns: number, tilePx: number, index: number): { sx: number; sy: number; sw: number; sh: number } {
  return { sx: (index % columns) * tilePx, sy: Math.floor(index / columns) * tilePx, sw: tilePx, sh: tilePx }
}

/**
 * 48×48 캐릭터 캔버스를 (cellX, cellY) 칸의 아래 중앙에 놓은 화면 사각형.
 * size = 칸 하나의 화면 크기(px). 칸 32px 기준 위로 16px, 좌우로 8px 넘친다.
 */
export function charDrawRect(cellX: number, cellY: number, size: number): { x: number; y: number; w: number; h: number } {
  return { x: cellX * size - size * 0.25, y: cellY * size - size * 0.5, w: size * 1.5, h: size * 1.5 }
}
