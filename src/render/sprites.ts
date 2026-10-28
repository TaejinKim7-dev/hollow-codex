import type { Dir } from "../core/types.ts"

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

export const DIR_NAME: Readonly<Record<Dir, string>> = { n: "north", e: "east", s: "south", w: "west" }

/**
 * 이 순간 그릴 캐릭터 이미지 키. 움직이는 중이고 걷기 그림(walk-<방향>/<프레임>)이 불러와져 있으면 그것,
 * 아니면 대기 그림. walking=false인데 움직이는 중이면 호출자가 idleBobPx로 위아래 흔들림을 준다.
 */
export function characterImageKey(name: string, dir: Dir, moving: boolean, frame: number, has: (key: string) => boolean): { key: string; walking: boolean } {
  const walk = `characters/${name}/walk-${DIR_NAME[dir]}/${frame}`
  if (moving && has(walk)) return { key: walk, walking: true }
  return { key: `characters/${name}/rot-${DIR_NAME[dir]}`, walking: false }
}

/** 걷기 그림이 없는 인물의 걷는 동안 흔들림(칸 32px 기준 px). */
export function idleBobPx(frame: number): number {
  return frame % 2 === 1 ? -2 : 0
}
