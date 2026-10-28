import type { GameContent } from "../content/types.ts"
import type { GameState, Pos } from "../core/types.ts"

export const TILE = 32
const VIEW_ROWS = 7
const MIN_COLS = 7
const MAX_COLS = 15
const MIN_SCALE = 2
const MAX_SCALE = 4

/** 화면 위 타일 시야. scale은 장치 픽셀 단위 정수, offsetPx는 장치 픽셀 기준 중앙 정렬 오프셋. */
export interface Viewport {
  readonly scale: number
  readonly originTile: Pos
  readonly offsetPx: Pos
  readonly viewW: number
  readonly viewH: number
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** 정수 배율을 높이로 먼저 고르고(2~4), 그 배율에서 들어가는 가로 칸 수(7~15)를 정한다. 세로는 7칸. */
export function chooseView(canvasPx: { readonly w: number; readonly h: number }): { scale: number; viewW: number; viewH: number } {
  const scale = clamp(Math.floor(canvasPx.h / (VIEW_ROWS * TILE)), MIN_SCALE, MAX_SCALE)
  const viewW = clamp(Math.floor(canvasPx.w / (TILE * scale)), MIN_COLS, MAX_COLS)
  return { scale, viewW, viewH: VIEW_ROWS }
}

/**
 * CSS 크기 × dpr 화면에 시야를 맞춘다(chooseView).
 * 지도가 시야보다 크면 center를 시야 중앙에 두고 가장자리에서 clamp, 작으면 왼쪽 위부터 두고 offsetPx로 가운데 정렬.
 */
export function computeViewport(
  canvasCss: { readonly w: number; readonly h: number },
  dpr: number,
  mapSize: { readonly w: number; readonly h: number },
  center: Pos
): Viewport {
  const vw = canvasCss.w * dpr
  const vh = canvasCss.h * dpr
  const { scale, viewW, viewH } = chooseView({ w: vw, h: vh })
  const originTile: Pos = {
    x: mapSize.w <= viewW ? 0 : clamp(center.x - Math.floor(viewW / 2), 0, mapSize.w - viewW),
    y: mapSize.h <= viewH ? 0 : clamp(center.y - Math.floor(viewH / 2), 0, mapSize.h - viewH)
  }
  const offsetPx: Pos = {
    x: Math.floor((vw - Math.min(mapSize.w, viewW) * TILE * scale) / 2),
    y: Math.floor((vh - Math.min(mapSize.h, viewH) * TILE * scale) / 2)
  }
  return { scale, originTile, offsetPx, viewW, viewH }
}

/** 장치 픽셀 → 지도 타일 좌표(내림). vp의 역변환. */
export function screenToTile(px: Pos, vp: Viewport): Pos {
  const step = TILE * vp.scale
  return {
    x: Math.floor((px.x - vp.offsetPx.x) / step) + vp.originTile.x,
    y: Math.floor((px.y - vp.offsetPx.y) / step) + vp.originTile.y
  }
}

/**
 * The viewport a frame is drawn with (device pixels, dpr already applied by the caller's canvas size):
 * in combat the encounter grid centred on the active unit, otherwise the map centred on the player.
 * drawFrame, the canvas tap handler and the combat aim handler all use this, so a tap hits the drawn cell.
 */
export function frameViewport(state: GameState, content: GameContent, canvasPx: { readonly w: number; readonly h: number }): Viewport {
  const combat = state.combat
  if (combat !== null) {
    const active = combat.units.find((u) => u.id === combat.active)
    return computeViewport(canvasPx, 1, { w: combat.grid[0]?.length ?? 0, h: combat.grid.length }, active?.pos ?? { x: 0, y: 0 })
  }
  const map = content.maps[state.mapId]
  return computeViewport(canvasPx, 1, { w: map?.rows[0]?.length ?? 0, h: map?.rows.length ?? 0 }, state.player.pos)
}

/** Canvas device-pixel point → tile (combat grid cell in combat, map tile otherwise). */
export function tileAtPointer(state: GameState, content: GameContent, canvasPx: { readonly w: number; readonly h: number }, px: Pos): Pos {
  return screenToTile(px, frameViewport(state, content, canvasPx))
}
