import type { GameContent, SpriteRef } from "../content/types.ts"
import type { GameState, Id, Pos } from "../core/types.ts"
import { npcPositionAt } from "../core/dialogue/talk.ts"
import { frameViewport, TILE, VIEW_H, VIEW_W, type Viewport } from "./viewport.ts"

/**
 * 프레임을 하나 그린다. 테스트 없음(사용자 확인).
 * - 캔버스 크기 = CSS × dpr은 호출자가 정한 것으로 간주하고(여기서는 건드리지 않음),
 *   좌표는 vp(장치 픽셀 기준)로 그린다.
 * - 탐험: 시야 타일 → NPC → 플레이어. vp는 지도 기준으로 호출자가 구한다.
 * - 전투: 호출자 vp 대신 전투 격자에 맞춰 뷰포트를 다시 구하고, 격자 → 유닛 →
 *   적 예고 화살표(노란 선 2px×scale) → 공격 대상 빨간 테두리 → 활성 아군 흰 테두리.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheets: Readonly<Record<string, HTMLImageElement>>,
  state: GameState,
  content: GameContent,
  vp: Viewport
): void {
  ctx.imageSmoothingEnabled = false
  clear(ctx)
  if (state.combat !== null) drawCombat(ctx, sheets, content, state)
  else drawMap(ctx, sheets, content, state, vp)
}

function clear(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

const screenX = (vp: Viewport, x: number, size: number): number => vp.offsetPx.x + (x - vp.originTile.x) * size
const screenY = (vp: Viewport, y: number, size: number): number => vp.offsetPx.y + (y - vp.originTile.y) * size

function drawMap(ctx: CanvasRenderingContext2D, sheets: Readonly<Record<string, HTMLImageElement>>, content: GameContent, state: GameState, vp: Viewport): void {
  const map = content.maps[state.mapId]
  if (!map) return
  const size = TILE * vp.scale
  const mapW = map.rows[0]?.length ?? 0
  const mapH = map.rows.length
  for (let y = vp.originTile.y; y < Math.min(mapH, vp.originTile.y + VIEW_H); y++) {
    const row = map.rows[y]
    if (!row) continue
    for (let x = vp.originTile.x; x < Math.min(mapW, vp.originTile.x + VIEW_W); x++) {
      const ch = row[x]
      const tile = ch !== undefined ? content.tiles[ch] : undefined
      if (!tile) continue
      drawSprite(ctx, sheets, content, tile.sprite, screenX(vp, x, size), screenY(vp, y, size), size)
    }
  }
  for (const npc of npcsToDraw(state, content)) {
    if (npc.pos.x < vp.originTile.x || npc.pos.x >= vp.originTile.x + VIEW_W) continue
    if (npc.pos.y < vp.originTile.y || npc.pos.y >= vp.originTile.y + VIEW_H) continue
    drawSprite(ctx, sheets, content, npc.sprite, screenX(vp, npc.pos.x, size), screenY(vp, npc.pos.y, size), size)
  }
  drawSprite(ctx, sheets, content, content.playerSprite, screenX(vp, state.player.pos.x, size), screenY(vp, state.player.pos.y, size), size)
}

/** 지금 지도에 그릴 NPC와 위치. 일과(schedule)를 시간대로 반영한다(npcAt과 같은 규칙). 동행 중인 NPC는 빠진다. */
export function npcsToDraw(state: GameState, content: GameContent): { readonly id: Id; readonly pos: Pos; readonly sprite: SpriteRef }[] {
  return Object.entries(content.npcs)
    .filter(([id, npc]) => npc.map === state.mapId && !state.party.includes(id))
    .map(([id, npc]) => ({ id, pos: npcPositionAt(npc, state.time.hour), sprite: npc.sprite }))
}

function drawCombat(ctx: CanvasRenderingContext2D, sheets: Readonly<Record<string, HTMLImageElement>>, content: GameContent, state: GameState): void {
  const combat = state.combat
  if (!combat) return
  const active = combat.units.find((u) => u.id === combat.active)
  const vp = frameViewport(state, content, { w: ctx.canvas.width, h: ctx.canvas.height })
  const size = TILE * vp.scale
  for (let gy = 0; gy < combat.grid.length; gy++) {
    const row = combat.grid[gy]
    if (!row) continue
    for (let gx = 0; gx < row.length; gx++) {
      const ch = row[gx]
      const tile = ch !== undefined ? content.tiles[ch] : undefined
      if (!tile) continue
      drawSprite(ctx, sheets, content, tile.sprite, screenX(vp, gx, size), screenY(vp, gy, size), size)
    }
  }
  for (const unit of combat.units) {
    if (unit.gone !== null) continue
    drawSprite(ctx, sheets, content, unitSprite(content, unit), screenX(vp, unit.pos.x, size), screenY(vp, unit.pos.y, size), size)
  }
  for (const enemy of combat.units) {
    if (enemy.side !== "enemy" || enemy.gone !== null) continue
    const intent = combat.intents[enemy.id]
    if (!intent) continue
    const from = cellCenter(vp, enemy.pos, size)
    const to = cellCenter(vp, intent.moveTo, size)
    ctx.strokeStyle = "#ffd700"
    ctx.lineWidth = 2 * vp.scale
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    if (intent.attack !== null) {
      const target = combat.units.find((u) => u.id === intent.attack)
      if (target && target.gone === null) strokeCell(ctx, vp, target.pos, size, "#ff0000", vp.scale)
    }
  }
  if (active && active.gone === null && active.side === "ally") strokeCell(ctx, vp, active.pos, size, "#ffffff", vp.scale)
}

function unitSprite(content: GameContent, unit: { readonly id: string; readonly creature: string | null }): SpriteRef {
  if (unit.id === "player") return content.playerSprite
  if (unit.creature === null) {
    const npc = content.npcs[unit.id]
    if (npc) return npc.sprite
  }
  const creature = unit.creature !== null ? content.creatures[unit.creature] : undefined
  if (creature) return creature.sprite
  return content.playerSprite
}

const cellCenter = (vp: Viewport, p: Pos, size: number): Pos => ({
  x: screenX(vp, p.x, size) + size / 2,
  y: screenY(vp, p.y, size) + size / 2
})

function strokeCell(ctx: CanvasRenderingContext2D, vp: Viewport, p: Pos, size: number, color: string, scale: number): void {
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, Math.floor(2 * scale))
  ctx.strokeRect(screenX(vp, p.x, size) + 1, screenY(vp, p.y, size) + 1, size - 2, size - 2)
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheets: Readonly<Record<string, HTMLImageElement>>,
  content: GameContent,
  ref: SpriteRef,
  dx: number,
  dy: number,
  size: number
): void {
  const img = sheets[ref.sheet]
  if (!img) return
  const columns = content.sheets[ref.sheet]?.columns ?? 1
  const sx = (ref.index % columns) * TILE
  const sy = Math.floor(ref.index / columns) * TILE
  ctx.drawImage(img, sx, sy, TILE, TILE, dx, dy, size, size)
}