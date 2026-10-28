import { combatObjectFit } from "./object-fit.ts"
import type { GameContent, MapDef, SpriteRef } from "../content/types.ts"
import type { Dir, GameState, Id, Pos } from "../core/types.ts"
import { npcPositionAt } from "../core/dialogue/talk.ts"
import { BASE_SET, GROUND_SETS, wangTables } from "./assets.ts"
import { overlayTiles, type OverlayTile } from "./autotile.ts"
import { sortDrawables, type Drawable } from "./layers.ts"
import type { MotionFrame } from "./motion.ts"
import { characterImageKey, charDrawRect, idleBobPx, legacyDraw } from "./sprites.ts"
import { cameraShiftPx, frameViewport, TILE, type Viewport } from "./viewport.ts"
import type { CombatOverlay } from "./combat-overlay.ts"
import type { FxFrame } from "./fx.ts"
import { t } from "../ui/strings.ts"

/** 화면에 그릴 때 쓰는 이미지 묶음. sheets = 옛 16px 시트, images = 지도별로 불러온 새 그림(키는 assets/sprites 아래 경로). */
export interface RenderResources {
  readonly sheets: Readonly<Record<string, HTMLImageElement>>
  readonly images: ReadonlyMap<string, HTMLImageElement>
}

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
  motion: MotionFrame,
  combatFx: CombatFxView | null = null
): void {
  ctx.imageSmoothingEnabled = false
  clear(ctx)
  if (state.combat !== null) drawCombat(ctx, res, content, state, combatFx)
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
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const tile = content.tiles[map.rows[y]?.[x] ?? ""]
      if (tile?.sprite !== undefined) drawLegacy(ctx, res, content, tile.sprite, screenX(vp, x, size), screenY(vp, y, size), size)
      else if (tile?.ground !== undefined || map.ground?.[y]?.[x] != null) drawBaseGrass(ctx, res, screenX(vp, x, size), screenY(vp, y, size), size)
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

/** 풀 한 칸(바닥). 땅 종류가 있는 칸의 바탕이다. */
function drawBaseGrass(ctx: CanvasRenderingContext2D, res: RenderResources, dx: number, dy: number, size: number): void {
  const base = wangTables[BASE_SET]?.["0000"]
  const img = res.images.get(`tilesets/${BASE_SET}/sheet`)
  if (base !== undefined && img !== undefined) ctx.drawImage(img, base.col * TILE, base.row * TILE, TILE, TILE, dx, dy, size, size)
}

/** 물건 하나를 깊이 정렬 목록에 넣을 항목으로. 그림이 아직 없으면 null. 발자국 왼쪽 아래 칸 (x, y)에 아래 가운데를 맞춘다. */
function objectItem(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, vp: Viewport, size: number, id: Id, x: number, y: number, fitToCell = false): Item | null {
  const def = content.objects[id]
  const img = def === undefined ? undefined : res.images.get(`objects/${def.image}`)
  if (def === undefined || img === undefined) return null
  return {
    kind: "object", footX: x, footY: y - def.sortOffset, id: `${id}@${x},${y}`,
    draw: () => {
      const k = fitToCell ? combatObjectFit(img.width, img.height, def.footprint[0]) : 1
      const w = img.width * vp.scale * k, h = img.height * vp.scale * k
      ctx.drawImage(img, screenX(vp, x, size) + (def.footprint[0] * size - w) / 2, screenY(vp, y, size) + size - h, w, h)
    }
  }
}

function drawMap(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, state: GameState, vp: Viewport, motion: MotionFrame): void {
  const map = content.maps[state.mapId]
  if (!map) return
  const size = TILE * vp.scale
  ctx.save()
  const shift = cameraShiftPx(vp, { w: map.rows[0]?.length ?? 0, h: map.rows.length }, motion)
  ctx.translate(shift.x, shift.y)
  drawGround(ctx, res, content, map, vp, size)

  const items: Item[] = []
  const mapW = map.rows[0]?.length ?? 0
  const putObject = (id: Id, x: number, y: number): void => {
    const item = objectItem(ctx, res, content, vp, size, id, x, y)
    if (item !== null) items.push(item)
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
    draw: () => drawCharacter(ctx, res, content, content.playerSprite, motion.x, motion.y, motion.dir, vp, size, motion.moving, motion.frame)
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

/** 전투 연출 입력: 연출 프레임과(있으면) 조작 힌트. */
export interface CombatFxView { readonly frame: FxFrame; readonly overlay: CombatOverlay | null }
const NO_FX: FxFrame = { shake: { x: 0, y: 0 }, units: {}, hp: {}, floats: [], slashes: [], sparks: [], ghosts: [], banner: null }

function drawCombat(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, state: GameState, view: CombatFxView | null): void {
  const combat = state.combat
  if (!combat) return
  const fx = view?.frame ?? NO_FX
  const active = combat.units.find((u) => u.id === combat.active)
  const vp = frameViewport(state, content, { w: ctx.canvas.width, h: ctx.canvas.height })
  const size = TILE * vp.scale
  ctx.save()
  ctx.translate(Math.round(fx.shake.x * vp.scale), Math.round(fx.shake.y * vp.scale))
  const items: Item[] = []
  const gridH = combat.grid.length
  const gridW = combat.grid[0]?.length ?? 0
  // 격자 바깥까지 화면 전체를 가장자리 땅으로 이어 채운다(검은 여백 없음). 물건은 격자 안에만 둔다.
  const cx0 = Math.floor(-vp.offsetPx.x / size) - 1, cx1 = Math.ceil((ctx.canvas.width - vp.offsetPx.x) / size) + 1
  const cy0 = Math.floor(-vp.offsetPx.y / size) - 1, cy1 = Math.ceil((ctx.canvas.height - vp.offsetPx.y) / size) + 1
  for (let gy = cy0; gy < cy1; gy++) {
    for (let gx = cx0; gx < cx1; gx++) {
      const inside = gx >= 0 && gx < gridW && gy >= 0 && gy < gridH
      const ch = combat.grid[Math.min(gridH - 1, Math.max(0, gy))]?.[Math.min(gridW - 1, Math.max(0, gx))]
      const tile = ch !== undefined ? content.tiles[ch] : undefined
      if (tile?.sprite) drawLegacy(ctx, res, content, tile.sprite, screenX(vp, gx, size), screenY(vp, gy, size), size)
      else if (tile?.ground !== undefined) drawBaseGrass(ctx, res, screenX(vp, gx, size), screenY(vp, gy, size), size)
      if (inside && tile?.object !== undefined) {
        const item = objectItem(ctx, res, content, vp, size, tile.object, gx, gy, true)
        if (item !== null) items.push(item)
      }
    }
  }
  // 전투가 일어나는 격자만 또렷하게: 바깥은 어둡게 눌러 구분한다.
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)"
  const gx0 = screenX(vp, 0, size), gy0 = screenY(vp, 0, size), gx1 = screenX(vp, gridW, size), gy1 = screenY(vp, gridH, size)
  ctx.fillRect(-size, -size, ctx.canvas.width + 2 * size, gy0 + size)
  ctx.fillRect(-size, gy1, ctx.canvas.width + 2 * size, ctx.canvas.height - gy1 + size)
  ctx.fillRect(-size, gy0, gx0 + size, gy1 - gy0)
  ctx.fillRect(gx1, gy0, ctx.canvas.width - gx1 + size, gy1 - gy0)
  // 조작 힌트: 갈 수 있는 칸(파랑), 칠 수 있는 적(빨강 테두리)
  const overlay = view?.overlay ?? null
  if (overlay !== null) {
    for (const p of overlay.reachable) {
      ctx.fillStyle = "rgba(90, 150, 255, 0.30)"
      ctx.fillRect(screenX(vp, p.x, size), screenY(vp, p.y, size), size, size)
      ctx.strokeStyle = "rgba(170, 205, 255, 0.55)"
      ctx.lineWidth = Math.max(1, vp.scale)
      ctx.strokeRect(screenX(vp, p.x, size) + 0.5, screenY(vp, p.y, size) + 0.5, size - 1, size - 1)
    }
    for (const tg of overlay.targets) strokeCell(ctx, vp, tg.pos, size, "#ff3b30", vp.scale * 1.5)
  }
  const sideKind = (u: { readonly side: "ally" | "enemy" }): "player" | "npc" => (u.side === "ally" ? "player" : "npc")
  for (const unit of combat.units) {
    if (unit.gone !== null) continue
    const f = fx.units[unit.id]
    items.push({
      kind: sideKind(unit), footX: unit.pos.x + (f?.dx ?? 0), footY: unit.pos.y + (f?.dy ?? 0), id: unit.id,
      draw: () => drawCharacter(ctx, res, content, unitSprite(content, unit), unit.pos.x + (f?.dx ?? 0), unit.pos.y + (f?.dy ?? 0), unit.side === "ally" ? "e" : "w", vp, size, false, 0, f?.flash ?? 0, 1)
    })
  }
  for (const g of fx.ghosts) {
    items.push({
      kind: sideKind(g.unit), footX: g.unit.pos.x + g.dx, footY: g.unit.pos.y + g.dy, id: `ghost:${g.unit.id}`,
      draw: () => drawCharacter(ctx, res, content, unitSprite(content, g.unit), g.unit.pos.x + g.dx, g.unit.pos.y + g.dy, g.unit.side === "ally" ? "e" : "w", vp, size, false, 0, g.flash, g.alpha)
    })
  }
  for (const item of sortDrawables(items)) item.draw()

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

  // 체력 막대(발 아래), 슬래시·스파크, 피해 숫자, 예상 피해
  for (const unit of combat.units) {
    if (unit.gone !== null) continue
    const bar = fx.hp[unit.id]
    const f = fx.units[unit.id]
    drawHpBar(ctx, vp, size, unit.pos.x + (f?.dx ?? 0), unit.pos.y + (f?.dy ?? 0), bar?.shown ?? unit.hp, bar?.trail ?? unit.hp, bar?.max ?? Math.max(unit.hp, 1))
  }
  for (const g of fx.ghosts) {                       // 방금 쓰러진 유닛의 체력 막대도 끝까지 줄어드는 걸 보여 준다
    const bar = fx.hp[g.unit.id]
    if (bar === undefined) continue
    ctx.globalAlpha = g.alpha
    drawHpBar(ctx, vp, size, g.unit.pos.x + g.dx, g.unit.pos.y + g.dy, bar.shown, bar.trail, bar.max)
    ctx.globalAlpha = 1
  }
  for (const sl of fx.slashes) drawSlash(ctx, vp, size, sl.x, sl.y, sl.dir, sl.age)
  ctx.fillStyle = "#ffe9a8"
  for (const sp of fx.sparks) {
    ctx.globalAlpha = Math.max(0, 1 - sp.age)
    const px = Math.max(2, Math.round(2 * vp.scale))
    ctx.fillRect(Math.round(screenX(vp, sp.x, size) + size / 2 - px / 2), Math.round(screenY(vp, sp.y, size) + size / 2 - px / 2), px, px)
  }
  ctx.globalAlpha = 1
  for (const fl of fx.floats) drawFloat(ctx, vp, size, fl.x, fl.y, fl.text, fl.kind, fl.age)
  if (overlay !== null) {
    for (const tg of overlay.targets) {
      const label = tg.defeated ? t(state.language, content.strings, "ui.combat.preview-defeat") : `-${tg.amount}`
      drawFloat(ctx, vp, size, tg.pos.x, tg.pos.y - 0.15, label, tg.defeated ? "defeat" : "normal", 0)
    }
  }
  ctx.restore()
  if (fx.banner !== null) drawBanner(ctx, t(state.language, content.strings, "ui.combat.enemy-turn"), fx.banner.alpha, vp.scale)
}

function hpColor(ratio: number): string {
  return ratio > 0.5 ? "#6fcf55" : ratio > 0.25 ? "#e8c43a" : "#e5483b"
}

function drawHpBar(ctx: CanvasRenderingContext2D, vp: Viewport, size: number, cellX: number, cellY: number, shown: number, trail: number, max: number): void {
  const w = Math.round(size * 0.78), h = Math.max(3, Math.round(size * 0.1))
  const x = Math.round(screenX(vp, cellX, size) + (size - w) / 2)
  const y = Math.round(screenY(vp, cellY, size) + size + 2 * vp.scale)
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
  const ratio = (v: number): number => Math.max(0, Math.min(1, v / Math.max(1, max)))
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
  ctx.fillRect(x, y, Math.round(w * ratio(trail)), h)
  ctx.fillStyle = hpColor(ratio(shown))
  ctx.fillRect(x, y, Math.round(w * ratio(shown)), h)
}

function drawSlash(ctx: CanvasRenderingContext2D, vp: Viewport, size: number, cellX: number, cellY: number, dir: Dir, age: number): void {
  const cx = screenX(vp, cellX, size) + size / 2, cy = screenY(vp, cellY, size) + size / 2
  const rot = { e: 0, s: Math.PI / 2, w: Math.PI, n: -Math.PI / 2 }[dir]
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot + Math.PI)                                   // 공격이 들어온 쪽에서 대상 쪽으로 휘두르는 호
  ctx.globalAlpha = Math.max(0, 1 - age)
  ctx.lineCap = "round"
  for (const [r, w, color] of [[0.5, 5, "#ffffff"], [0.42, 3, "#ffd36b"]] as const) {
    ctx.strokeStyle = color
    ctx.lineWidth = w * vp.scale
    ctx.beginPath()
    ctx.arc(0, 0, size * r, -1.0, -1.0 + 2.0 * Math.min(1, age * 2 + 0.25))
    ctx.stroke()
  }
  ctx.restore()
}

function drawFloat(ctx: CanvasRenderingContext2D, vp: Viewport, size: number, cellX: number, cellY: number, text: string, kind: "normal" | "defeat", age: number): void {
  const px = Math.round(size * (kind === "defeat" ? 0.52 : 0.4))
  ctx.save()
  ctx.font = `bold ${px}px "NeoDunggeunmo", monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.globalAlpha = Math.max(0, 1 - age * age)
  const x = screenX(vp, cellX, size) + size / 2, y = screenY(vp, cellY, size)
  ctx.lineWidth = Math.max(3, Math.round(px * 0.18))
  ctx.strokeStyle = "#1a1210"
  ctx.strokeText(text, x, y)
  ctx.fillStyle = kind === "defeat" ? "#ffd23f" : "#ffffff"
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawBanner(ctx: CanvasRenderingContext2D, text: string, alpha: number, scale: number): void {
  const h = Math.round(22 * scale), y = Math.round(ctx.canvas.height * 0.12)
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.85
  ctx.fillStyle = "#1a1210"
  ctx.fillRect(0, y, ctx.canvas.width, h)
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
  ctx.fillStyle = "#ff9d6b"
  ctx.font = `bold ${Math.round(14 * scale)}px "NeoDunggeunmo", monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, ctx.canvas.width / 2, y + h / 2)
  ctx.restore()
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
function drawCharacter(
  ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, ref: SpriteRef, x: number, y: number, dir: Dir, vp: Viewport, size: number,
  moving = false, frame = 0, flash = 0, alpha = 1
): void {
  if ("char" in ref) {
    const pick = characterImageKey(ref.char, dir, moving, frame, (k) => res.images.has(k))
    const img = res.images.get(pick.key) ?? res.images.get(characterImageKey(ref.char, dir, false, 0, () => false).key)
    if (img === undefined) return
    const r = charDrawRect(x, y, size)
    const bob = moving && !pick.walking ? idleBobPx(frame) * vp.scale : 0
    blit(ctx, img, 0, 0, img.width, img.height, vp.offsetPx.x + r.x - vp.originTile.x * size, vp.offsetPx.y + r.y - vp.originTile.y * size + bob, r.w, r.h, flash, alpha)
    return
  }
  drawLegacy(ctx, res, content, ref, screenX(vp, x, size), screenY(vp, y, size), size, flash, alpha)
}

function drawLegacy(ctx: CanvasRenderingContext2D, res: RenderResources, content: GameContent, ref: SpriteRef, dx: number, dy: number, size: number, flash = 0, alpha = 1): void {
  if ("char" in ref) return
  const img = res.sheets[ref.sheet]
  if (!img) return
  const sheet = content.sheets[ref.sheet]
  const r = legacyDraw(sheet?.columns ?? 1, sheet?.tile ?? 16, ref.index)
  blit(ctx, img, r.sx, r.sy, r.sw, r.sh, dx, dy, size, size, flash, alpha)
}

let tint: HTMLCanvasElement | null = null
/** 스프라이트를 그린다. flash > 0이면 실루엣만 흰색으로 덮어(맞은 순간 점멸), alpha < 1이면 투명하게(사라지는 중). */
function blit(
  ctx: CanvasRenderingContext2D, img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number,
  dx: number, dy: number, dw: number, dh: number, flash: number, alpha: number
): void {
  if (flash <= 0 && alpha >= 1) { ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh); return }
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
  if (flash > 0 && typeof document !== "undefined") {
    tint ??= document.createElement("canvas")
    const w = Math.max(1, Math.round(dw)), h = Math.max(1, Math.round(dh))
    if (tint.width !== w || tint.height !== h) { tint.width = w; tint.height = h }
    const c = tint.getContext("2d")
    if (c !== null) {
      c.imageSmoothingEnabled = false
      c.globalCompositeOperation = "source-over"
      c.clearRect(0, 0, w, h)
      c.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
      c.globalCompositeOperation = "source-atop"
      c.fillStyle = `rgba(255, 255, 255, ${Math.min(1, flash)})`
      c.fillRect(0, 0, w, h)
      ctx.drawImage(tint, dx, dy, dw, dh)
      ctx.restore()
      return
    }
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.restore()
}
