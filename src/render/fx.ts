import type { CombatUnit, Dir, GameEvent, Id } from "../core/types.ts"

/**
 * 전투 연출 시간표. core는 결과만 계산하고(이벤트), 여기서 그 결과를 시간에 펼친다.
 * 시계는 밖에서 넣는다(`now`, ms) — 같은 입력이면 같은 출력이고 난수는 쓰지 않는다. 상태 규칙에는 아무 영향이 없다.
 * 공격 1회 = 410 ms: 예비동작 0–100 → 돌진 100–180 → 충돌 180(히트스톱 70) → 복귀 250–330 → 여운 → 다음 공격 410.
 */
export interface UnitFx { dx: number; dy: number; flash: number; alpha: number }   // dx,dy: 칸 단위
export interface FxFrame {
  shake: { x: number; y: number }                                                   // 원본 픽셀(32px 칸 기준)
  units: Readonly<Record<Id, UnitFx>>
  hp: Readonly<Record<Id, { shown: number; trail: number; max: number }>>
  floats: readonly { x: number; y: number; text: string; kind: "normal" | "defeat"; age: number }[]   // x,y: 칸 좌표, age 0..1
  slashes: readonly { x: number; y: number; dir: Dir; age: number }[]
  sparks: readonly { x: number; y: number; age: number }[]
  ghosts: readonly { unit: CombatUnit; alpha: number; dx: number; dy: number; flash: number }[]      // 이미 상태에서 사라진 유닛이 페이드 아웃하는 모습
  banner: { text: "enemy"; alpha: number } | null
}
export interface HitCue { at: number; amount: number; index: number; defeated: boolean }
export interface Fx {
  reset(units: readonly CombatUnit[]): void
  enqueue(events: readonly GameEvent[], before: readonly CombatUnit[], after: readonly CombatUnit[], now: number): void
  sample(now: number): FxFrame
  takeCues(now: number): HitCue[]
  busy(now: number): boolean
  clear(): void
}

const ATTACK_MS = 410, IMPACT = 180, MOVE_MS = 160, YIELD_HOLD = 150, YIELD_FADE = 300, DEFEAT_HOLD = 100, DEFEAT_FADE = 300
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
const smooth = (p: number): number => { const q = clamp01(p); return q * q * (3 - 2 * q) }
const lerp = (a: number, b: number, p: number): number => a + (b - a) * clamp01(p)

interface Attack { s: number; attacker: Id; target: Id; ux: number; uy: number; dir: Dir; amount: number; defeated: boolean; index: number; tx: number; ty: number }
interface Tween { id: Id; dx: number; dy: number; start: number }
interface HpTrack { id: Id; from: number; to: number; impact: number }
interface GhostFx { unit: CombatUnit; holdUntil: number; fadeMs: number; target: Id }

/** 공격자가 대상 쪽(+)으로 나가는 정도(칸). 예비동작은 반대쪽(-0.12). */
function lunge(t: number): number {
  if (t < 0) return 0
  if (t < 100) return -0.12 * smooth(t / 100)
  if (t < IMPACT) return lerp(-0.12, 0.42, (t - 100) / 80)
  if (t < 250) return 0.42
  if (t < 330) return 0.42 * (1 - (t - 250) / 80)
  return 0
}

const dirOf = (ux: number, uy: number): Dir => (Math.abs(ux) > Math.abs(uy) ? (ux > 0 ? "e" : "w") : uy > 0 ? "s" : "n")

export function createFx(): Fx {
  let max: Record<Id, number> = {}
  let base: Record<Id, number> = {}        // 연출이 끝난 뒤의 hp
  let run: Record<Id, number> = {}         // 지금까지 큐에 넣은 마지막 hp(다음 공격의 시작값)
  let attacks: Attack[] = []
  let tweens: Tween[] = []
  let tracks: HpTrack[] = []
  let ghosts: GhostFx[] = []
  let cues: HitCue[] = []
  let banners: { start: number }[] = []
  let cursor = 0

  const clear = (): void => { max = {}; base = {}; run = {}; attacks = []; tweens = []; tracks = []; ghosts = []; cues = []; banners = []; cursor = 0 }

  return {
    reset(units) {
      clear()
      for (const u of units) { max[u.id] = u.hp; base[u.id] = u.hp; run[u.id] = u.hp }
    },
    clear,
    enqueue(events, before, after, now) {
      const find = (list: readonly CombatUnit[], id: Id): CombatUnit | undefined => list.find((u) => u.id === id)
      let t = Math.max(now, cursor)
      const batchStart = t
      let enemyActs = false
      for (const u of after) {
        const b = find(before, u.id)
        if (b === undefined) continue
        max[u.id] = Math.max(max[u.id] ?? 0, b.hp, u.hp)
        if (run[u.id] === undefined) { base[u.id] = b.hp; run[u.id] = b.hp }
        if (b.pos.x !== u.pos.x || b.pos.y !== u.pos.y) {
          tweens.push({ id: u.id, dx: b.pos.x - u.pos.x, dy: b.pos.y - u.pos.y, start: t })
          if (u.side === "enemy") enemyActs = true
        }
      }
      if (tweens.some((tw) => tw.start === t)) t += MOVE_MS
      let index = 0
      const hitIds = new Set<Id>()
      for (const e of events) {
        if (e.type === "combatHit") {
          const a = find(after, e.attacker) ?? find(before, e.attacker)
          const d = find(after, e.target) ?? find(before, e.target)
          if (a === undefined || d === undefined) continue
          const vx = d.pos.x - a.pos.x, vy = d.pos.y - a.pos.y
          const len = Math.hypot(vx, vy) || 1
          const ux = vx / len, uy = vy / len
          attacks.push({ s: t, attacker: e.attacker, target: e.target, ux, uy, dir: dirOf(ux, uy), amount: e.amount, defeated: e.defeated, index, tx: d.pos.x, ty: d.pos.y })
          const from = run[e.target] ?? find(before, e.target)?.hp ?? e.hp + e.amount
          tracks.push({ id: e.target, from, to: e.hp, impact: t + IMPACT })
          run[e.target] = e.hp
          hitIds.add(e.target)
          cues.push({ at: t + IMPACT, amount: e.amount, index, defeated: e.defeated })
          if (e.defeated) {
            const snap = find(before, e.target)
            if (snap !== undefined) ghosts.push({ unit: snap, holdUntil: t + IMPACT + DEFEAT_HOLD, fadeMs: DEFEAT_FADE, target: e.target })
          }
          if (a.side === "enemy") enemyActs = true
          index += 1
          t += ATTACK_MS
        } else if (e.type === "combatYield") {
          const snap = find(before, e.target)
          if (snap !== undefined) ghosts.push({ unit: snap, holdUntil: t + YIELD_HOLD, fadeMs: YIELD_FADE, target: e.target })
          t += 200
        }
      }
      for (const u of after) if (!hitIds.has(u.id)) { base[u.id] = u.hp; run[u.id] = u.hp }
      if (enemyActs) banners.push({ start: batchStart })
      cursor = Math.max(cursor, t)
    },
    takeCues(now) {
      const due = cues.filter((c) => c.at <= now)
      cues = cues.filter((c) => c.at > now)
      return due
    },
    busy: (now) => now < cursor,
    sample(now) {
      const units: Record<Id, UnitFx> = {}
      const add = (id: Id, dx: number, dy: number, flash: number): void => {
        const cur = units[id] ?? { dx: 0, dy: 0, flash: 0, alpha: 1 }
        units[id] = { dx: cur.dx + dx, dy: cur.dy + dy, flash: Math.max(cur.flash, flash), alpha: 1 }
      }
      let shakeX = 0, shakeY = 0
      const floats: FxFrame["floats"][number][] = []
      const slashes: FxFrame["slashes"][number][] = []
      const sparks: FxFrame["sparks"][number][] = []

      for (const tw of tweens) {
        const p = (now - tw.start) / MOVE_MS
        if (p < 1) add(tw.id, tw.dx * (1 - smooth(p)), tw.dy * (1 - smooth(p)), 0)
      }
      for (const a of attacks) {
        const t = now - a.s
        const l = lunge(t)
        if (l !== 0) add(a.attacker, a.ux * l, a.uy * l, 0)
        if (t >= IMPACT && t < 330) {
          const k = 0.22 * (1 - (t - IMPACT) / 150)
          add(a.target, a.ux * Math.max(0, k), a.uy * Math.max(0, k), t < 300 ? 1 - (t - IMPACT) / 120 : 0)
        }
        if (t >= IMPACT && t < 360) {
          const amp = Math.min(6, 2 + a.amount * 1.5) * (1 - (t - IMPACT) / 180)
          const ph = (t - IMPACT) / 12 + a.index * 1.7
          shakeX += amp * Math.cos(ph)
          shakeY += amp * Math.sin(ph * 1.3)
        }
        if (t >= IMPACT && t < 780) floats.push({ x: a.tx, y: a.ty - 0.25 - 0.6 * ((t - IMPACT) / 600), text: `-${a.amount}`, kind: a.defeated ? "defeat" : "normal", age: (t - IMPACT) / 600 })
        if (t >= IMPACT && t < 330) slashes.push({ x: a.tx, y: a.ty, dir: a.dir, age: (t - IMPACT) / 150 })
        if (t >= IMPACT && t < 430) {
          const age = (t - IMPACT) / 250
          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3 + a.index * 0.4
            const r = 0.08 + 0.4 * age
            sparks.push({ x: a.tx + r * Math.cos(ang), y: a.ty + r * Math.sin(ang), age })
          }
        }
      }

      const ghostFrames: FxFrame["ghosts"][number][] = []
      for (const g of ghosts) {
        const alpha = now <= g.holdUntil ? 1 : 1 - (now - g.holdUntil) / g.fadeMs
        if (alpha <= 0) continue
        const own = units[g.target]
        ghostFrames.push({ unit: g.unit, alpha, dx: own?.dx ?? 0, dy: own?.dy ?? 0, flash: own?.flash ?? 0 })
      }

      const hp: Record<Id, { shown: number; trail: number; max: number }> = {}
      for (const id of Object.keys(max)) {
        let shown = base[id] ?? 0, trail = shown
        for (const tr of tracks) {
          if (tr.id !== id || now < tr.impact) continue
          shown = lerp(tr.from, tr.to, (now - tr.impact) / 250)
          trail = lerp(tr.from, tr.to, (now - tr.impact - 150) / 400)
        }
        hp[id] = { shown, trail, max: max[id] ?? 0 }
      }

      let banner: FxFrame["banner"] = null
      for (const b of banners) {
        const t = now - b.start
        if (t >= 0 && t < 700) banner = { text: "enemy", alpha: Math.min(clamp01(t / 100), clamp01((700 - t) / 200)) }
      }

      if (now >= cursor) {                                    // 연출이 모두 끝났으면 hp를 확정하고 목록을 비운다
        for (const tr of tracks) base[tr.id] = tr.to
        attacks = []; tweens = []; tracks = []; ghosts = []; banners = []
      }
      return { shake: { x: shakeX, y: shakeY }, units, hp, floats, slashes, sparks, ghosts: ghostFrames, banner }
    }
  }
}
