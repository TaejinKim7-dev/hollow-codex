import type { GameContent, MapDef, SpriteRef } from "../content/types.ts"
import type { Dir, GameState, Id, Pos } from "../core/types.ts"
import { npcPositionAt } from "../core/dialogue/talk.ts"
import { BASE_SET, GROUND_SETS, wangTables } from "./assets.ts"
import { overlayTiles, type OverlayTile } from "./autotile.ts"
import { sortDrawables, type Drawable } from "./layers.ts"
import type { MotionFrame } from "./motion.ts"
import { charDrawRect, legacyDraw } from "./sprites.ts"
import { frameViewport, TILE, type Viewport } from "./viewport.ts"

/** 화면에 그릴 때 쓰는 이미지 묶음. sheets = 옛 16px 시트, images = 지도별로 불러온 새 그림(키는 assets/sprites 아래 경로). */
export interface RenderResources {
  readonly sheets: Readonly<Record<string, HTMLImageElement>>
  readonly images: ReadonlyMap<string, HTMLImageElement>
}

const DIR_NAME: Readonly<Record<Dir, string>> = { n: "north", e: "east", s: "south", w: "west" }
const OVERLAY_ORDER = ["path", "water"] as const

/**
 * 프레임을 하나 그린다. 테스트 없음(사용자 확인).
 * - 탐험: 땅 층 → 물건·NPC·플레이어(발 y 순서) . 걷기 보간은 세계를 (칸 위치 − 보간 위치)만큼 밀어 카메라가 부드럽게 따라가게 한다.
 * - 전투: 격자 → 유닛 → 적 예고 화살표(노란 선) → 공격 대상 빨간 테두리 → 활성 아군 흰 테두리.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  res: RenderResources,
  state: GameState,
  content: GameContent,
  vp: Viewport,
  motion: MotionFrame
): void {
  ctx.imageSmoothingEnabled = false
  clear(ctx)
  if (state.combat !== null) drawCombat(ctx, res, content, state)
  else drawMap(ctx, res, content, state, vp, motion)
}

function clear(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

const screenX = (vp: Viewport, x: number, size: number): number => vp.offsetPx.x + (x - vp.originTile.x) * size
const screenY = (vp: Viewport, y: number, size: number): number => vp.offsetPx.y + (y - vp.originTile.y) * size

const overlayCache = new WeakMap<object, Map<string, readonly OverlayTile[]>>()
function cachedOverlay(map: MapDef, kind: (typeof OVERLAY_ORDER)[number], set: string): readonly OverlayTile[] {
  const ground = map.ground
  const table = wangTables[set]
  if (ground === undefined || table === undefined) return []
  let byKind = overlayCache.get(ground)
  if (byKind === undefined) { byKind = new Map(); overlayCache.set(ground, byKind) }
  let tiles = byKind.get(kind)
  if (tiles === undefined) { tiles = overlayTiles(ground, kind, table); byKind.set(kind, tiles) }
  return tiles
}

function drawGround(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, map: MapDef, vp: Viewport, size: number): void {
  const mapW = map.rows[0]?.length ?? 0
  const mapH = map.rows.length
  // 시야 밖 한 칸씩 더 그린다: 걷기 보간으로 세계가 밀릴 때 가장자리에 검은 틈이 보이지 않게.
  const x0 = Math.max(0, vp.originTile.x - 1), y0 = Math.max(0, vp.originTile.y - 1)
  const x1 = Math.min(mapW, vp.originTile.x + vp.viewW + 1), y1 = Math.min(mapH, vp.originTile.y + vp.viewH + 1)
  ctx.save()
  ctx.beginPath()
  ctx.rect(screenX(vp, 0, size), screenY(vp, 0, size), mapW * size, mapH * size)
  ctx.clip()
  const base = wangTables[BASE_SET]?.["0000"]
  const baseImg = res.images.get(`tilesets/${BASE_SET}/sheet`)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const tile = content.tiles[map.rows[y]?.[x] ?? ""]
      if (tile?.sprite !== undefined) drawLegacy(ctx, res, content, tile.sprite, screenX(vp, x, size), screenY(vp, y, size), size)
      else if (tile?.ground !== undefined && base !== undefined && baseImg !== undefined) {
        ctx.drawImage(baseImg, base.col * TILE, base.row * TILE, TILE, TILE, screenX(vp, x, size), screenY(vp, y, size), size, size)
      }
    }
  }
  for (const kind of OVERLAY_ORDER) {
    const set = GROUND_SETS[kind]
    const img = set === undefined ? undefined : res.images.get(`tilesets/${set}/sheet`)
    if (set === undefined || img === undefined) continue
    for (const t of cachedOverlay(map, kind, set)) {
      if (t.vx < x0 || t.vx > x1 + 1 || t.vy < y0 || t.vy > y1 + 1) continue
      ctx.drawImage(img, t.col * TILE, t.row * TILE, TILE, TILE, screenX(vp, t.vx - 0.5, size), screenY(vp, t.vy - 0.5, size), size, size)
    }
  }
  ctx.restore()
}

type Item = Drawable & { readonly draw: () => void }

function drawMap(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, state: GameState, vp: Viewport, motion: MotionFrame): void {
  const map = content.maps[state.mapId]
  if (!map) return
  const size = TILE * vp.scale
  ctx.save()
  ctx.translate(Math.round((state.player.pos.x - motion.x) * size), Math.round((state.player.pos.y - motion.y) * size))
  drawGround(ctx, res, content, map, vp, size)

  const items: Item[] = []
  const mapW = map.rows[0]?.length ?? 0
  const putObject = (id: Id, x: number, y: number): void => {
    const def = content.objects[id]
    const img = def === undefined ? undefined : res.images.get(`objects/${def.image}`)
    if (def === undefined || img === undefined) return
    items.push({
      kind: "object", footX: x, footY: y - def.sortOffset, id: `${id}@${x},${y}`,
      draw: () => {
        const w = img.width * vp.scale, h = img.height * vp.scale
        ctx.drawImage(img, screenX(vp, x, size) + (def.footprint[0] * size - w) / 2, screenY(vp, y, size) + size - h, w, h)
      }
    })
  }
  for (const o of map.objects ?? []) putObject(o.id, o.at.x, o.at.y)
  for (let y = Math.max(0, vp.originTile.y - 2); y < Math.min(map.rows.length, vp.originTile.y + vp.viewH + 4); y++) {
    for (let x = Math.max(0, vp.originTile.x - 2); x < Math.min(mapW, vp.originTile.x + vp.viewW + 2); x++) {
      const obj = content.tiles[map.rows[y]?.[x] ?? ""]?.object
      if (obj !== undefined) putObject(obj, x, y)
    }
  }
  for (const npc of npcsToDraw(state, content)) {
    if (npc.pos.x < vp.originTile.x - 2 || npc.pos.x > vp.originTile.x + vp.viewW + 1) continue
    if (npc.pos.y < vp.originTile.y - 2 || npc.pos.y > vp.originTile.y + vp.viewH + 1) continue
    items.push({ kind: "npc", footX: npc.pos.x, footY: npc.pos.y, id: npc.id, draw: () => drawCharacter(ctx, res, content, npc.sprite, npc.pos.x, npc.pos.y, "s", vp, size) })
  }
  items.push({
    kind: "player", footX: motion.x, footY: motion.y, id: "player",
    draw: () => drawCharacter(ctx, res, content, content.playerSprite, motion.x, motion.y, motion.dir, vp, size)
  })
  for (const item of sortDrawables(items)) item.draw()
  ctx.restore()
}

/** 지금 지도에 그릴 NPC와 위치. 일과(schedule)를 시간대로 반영한다(npcAt과 같은 규칙). 동행 중인 NPC는 빠진다. */
export function npcsToDraw(state: GameState, content: GameContent): { readonly id: Id; readonly pos: Pos; readonly sprite: SpriteRef }[] {
  return Object.entries(content.npcs)
    .filter(([id, npc]) => npc.map === state.mapId && !state.party.includes(id))
    .map(([id, npc]) => ({ id, pos: npcPositionAt(npc, state.time.hour), sprite: npc.sprite }))
}

function drawCombat(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, state: GameState): void {
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
      if (!tile?.sprite) continue
      drawLegacy(ctx, res, content, tile.sprite, screenX(vp, gx, size), screenY(vp, gy, size), size)
    }
  }
  for (const unit of combat.units) {
    if (unit.gone !== null) continue
    drawCharacter(ctx, res, content, unitSprite(content, unit), unit.pos.x, unit.pos.y, unit.side === "ally" ? "e" : "w", vp, size)
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

/** 인물·크리처 한 명. 새 `char.*`는 48px 캔버스를 칸 아래 중앙에, 옛 시트 칸은 칸 크기로 확대해 그린다. (x, y)는 칸 좌표(보간 중에는 실수). */
function drawCharacter(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, ref: SpriteRef, x: number, y: number, dir: Dir, vp: Viewport, size: number): void {
  if ("char" in ref) {
    const img = res.images.get(`characters/${ref.char}/rot-${DIR_NAME[dir]}`)
    if (img === undefined) return
    const r = charDrawRect(x, y, size)
    ctx.drawImage(img, vp.offsetPx.x + r.x - vp.originTile.x * size, vp.offsetPx.y + r.y - vp.originTile.y * size, r.w, r.h)
    return
  }
  drawLegacy(ctx, res, content, ref, screenX(vp, x, size), screenY(vp, y, size), size)
}

function drawLegacy(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, ref: SpriteRef, dx: number, dy: number, size: number): void {
  if ("char" in ref) return
  const img = res.sheets[ref.sheet]
  if (!img) return
  const sheet = content.sheets[ref.sheet]
  const r = legacyDraw(sheet?.columns ?? 1, sheet?.tile ?? 16, ref.index)
  ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, size, size)
}
