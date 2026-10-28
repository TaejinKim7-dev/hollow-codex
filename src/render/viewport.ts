import type { GameContent } from "../content/types.ts"
import type { GameState, Pos } from "../core/types.ts"

export const TILE = 32
const MIN_ROWS = 7
const MIN_COLS = 7
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

/** 전투 HUD(하단 조작 패널)가 가리는 아래쪽 높이(장치 픽셀). 전투 격자는 이 위쪽 영역에 맞춘다. */
export const COMBAT_RESERVE_RATIO = 0.17
export const combatReservePx = (canvasPx: { readonly w: number; readonly h: number }): number => Math.round(canvasPx.h * COMBAT_RESERVE_RATIO)

/**
 * 정수 배율을 높이로 먼저 고른다(칸 7줄이 들어가는 만큼, 2~4). 칸 수는 화면을 덮도록 올림한다 — 가장자리 칸은 잘린다(검은 여백 없음).
 * 지도가 시야보다 작을 때만 computeViewport가 가운데 정렬해 여백을 남긴다.
 */
export function chooseView(canvasPx: { readonly w: number; readonly h: number }): { scale: number; viewW: number; viewH: number } {
  const scale = clamp(Math.floor(canvasPx.h / (MIN_ROWS * TILE)), MIN_SCALE, MAX_SCALE)
  const size = TILE * scale
  return { scale, viewW: Math.max(MIN_COLS, Math.ceil(canvasPx.w / size)), viewH: Math.max(MIN_ROWS, Math.ceil(canvasPx.h / size)) }
}

/**
 * CSS 크기 × dpr 화면에 시야를 맞춘다(chooseView).
 * 지도가 시야보다 크면 center를 시야 중앙에 두고 가장자리에서 clamp, 작으면 왼쪽 위부터 두고 offsetPx로 가운데 정렬.
 */
export function computeViewport(
  canvasCss: { readonly w: number; readonly h: number },
  dpr: number,
  mapSize: { readonly w: number; readonly h: number },
  center: Pos,
  reserveBottomPx = 0
): Viewport {
  const vw = canvasCss.w * dpr
  const vh = canvasCss.h * dpr - reserveBottomPx
  const { scale, viewW, viewH } = chooseView({ w: vw, h: vh })
  const originTile: Pos = {
    x: mapSize.w <= viewW ? 0 : clamp(center.x - Math.floor(viewW / 2), 0, mapSize.w - viewW),
    y: mapSize.h <= viewH ? 0 : clamp(center.y - Math.floor(viewH / 2), 0, mapSize.h - viewH)
  }
  // 시야보다 큰 지도는 넘치는 만큼(음수)을 양쪽에 똑같이 나눠 잘리게 하고, 작은 지도는 가운데에 둔다.
  const offsetPx: Pos = {
    x: Math.floor((vw - Math.min(mapSize.w, viewW) * TILE * scale) / 2),
    y: Math.floor((vh - Math.min(mapSize.h, viewH) * TILE * scale) / 2)
  }
  return { scale, originTile, offsetPx, viewW, viewH }
}

/**
 * 걷기 보간 중에 세계를 밀어야 하는 장치 픽셀. 카메라가 보간 위치를 따라가되 실제 카메라처럼 지도 가장자리에서 멈춘다.
 * vp = 플레이어 칸 기준으로 구한 뷰포트, motion = 보간 중인 플레이어 위치(칸 단위 실수).
 * 그리기와 탭 좌표 계산이 같은 값을 써서 걷는 중에도 탭이 그려진 칸에 맞는다.
 */
export function cameraShiftPx(vp: Viewport, mapSize: { readonly w: number; readonly h: number }, motion: Pos): Pos {
  const size = TILE * vp.scale
  const origin = (m: number, view: number, mapLen: number): number => (mapLen <= view ? 0 : clamp(m - Math.floor(view / 2), 0, mapLen - view))
  return {
    x: Math.round((vp.originTile.x - origin(motion.x, vp.viewW, mapSize.w)) * size) || 0,
    y: Math.round((vp.originTile.y - origin(motion.y, vp.viewH, mapSize.h)) * size) || 0
  }
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
    return computeViewport(canvasPx, 1, { w: combat.grid[0]?.length ?? 0, h: combat.grid.length }, active?.pos ?? { x: 0, y: 0 }, combatReservePx(canvasPx))
  }
  const map = content.maps[state.mapId]
  return computeViewport(canvasPx, 1, { w: map?.rows[0]?.length ?? 0, h: map?.rows.length ?? 0 }, state.player.pos)
}

/** Canvas device-pixel point → tile (combat grid cell in combat, map tile otherwise). */
export function tileAtPointer(state: GameState, content: GameContent, canvasPx: { readonly w: number; readonly h: number }, px: Pos, motion?: Pos): Pos {
  const vp = frameViewport(state, content, canvasPx)
  if (motion === undefined || state.combat !== null) return screenToTile(px, vp)
  const map = content.maps[state.mapId]
  const shift = cameraShiftPx(vp, { w: map?.rows[0]?.length ?? 0, h: map?.rows.length ?? 0 }, motion)
  return screenToTile({ x: px.x - shift.x, y: px.y - shift.y }, vp)
}
