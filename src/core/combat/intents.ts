import type { GameContent } from "../../content/types.ts"
import type { CombatState, CombatUnit, Dir, Id, Pos } from "../types.ts"
import { DIRS, findPathOnGrid, offset } from "../world/path.ts"

/** 적이 한 라운드에 걷는 최대 칸 수. 아군의 move 한도도 같다. */
export const MAX_STEPS = 3

export const samePos = (a: Pos, b: Pos): boolean => a.x === b.x && a.y === b.y
export const manhattan = (a: Pos, b: Pos): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
export const alive = (u: CombatUnit): boolean => u.gone === null

/** 규칙 1: units 순서상 첫 번째로 살아 있고 아직 행동하지 않은 아군. 없으면 null. */
export function nextActive(units: readonly CombatUnit[]): Id | null {
  return units.find((u) => u.side === "ally" && alive(u) && !u.acted)?.id ?? null
}

/** 살아 있는 다른 유닛이 서 있는 칸인가. */
export function occupied(units: readonly CombatUnit[], p: Pos, except: Id | null = null): boolean {
  return units.some((u) => u.id !== except && alive(u) && samePos(u.pos, p))
}

/**
 * 대상에게 붙는 경로. 이미 인접이면 [].
 * 대상의 옆 칸을 대상 기준 n, e, s, w 순서로 보고 경로가 가장 짧은 첫 칸을 고른다. 갈 수 없으면 null.
 */
function approach(combat: CombatState, content: GameContent, from: Pos, target: Pos, blocked: (p: Pos) => boolean): Dir[] | null {
  if (manhattan(from, target) === 1) return []
  let best: Dir[] | null = null
  for (const dir of DIRS) {
    const path = findPathOnGrid(combat.grid, content.tiles, from, offset(target, dir), blocked)
    if (path !== null && (best === null || path.length < best.length)) best = path
  }
  return best
}

/** 성격 임계: 마음이 최대의 이 비율 이하이면 물러난다. */
const RETREAT_RATIO: Readonly<Record<string, number>> = { cautious: 0.5, coward: 0.75 }

/** 이 적이 한 걸음 내(MAX_STEPS)로 갈 수 있는 칸(제자리 포함). */
function stepCells(combat: CombatState, content: GameContent, enemy: CombatUnit, blocked: (p: Pos) => boolean): Pos[] {
  const out: Pos[] = [enemy.pos]
  for (let y = 0; y < combat.grid.length; y++) {
    for (let x = 0; x < (combat.grid[0]?.length ?? 0); x++) {
      const cell = { x, y }
      if (samePos(cell, enemy.pos) || manhattan(cell, enemy.pos) > MAX_STEPS) continue
      const path = findPathOnGrid(combat.grid, content.tiles, enemy.pos, cell, blocked)
      if (path !== null && path.length >= 1 && path.length <= MAX_STEPS) out.push(cell)
    }
  }
  return out
}

/**
 * 규칙 10: 살아 있는 적마다 예고(어디로 가서 누구를 칠지)를 계산한다.
 * 기본(aggressive) 대상 = 붙는 경로가 가장 짧은 살아 있는 아군(동점이면 units 순서 앞).
 * 성격(creature.ai): skirmisher = 가장 약한 아군, pack = 다른 적이 이미 붙어 있는 아군, cautious/coward = 마음이 임계 이하면 가장 가까운 아군에게서 멀어진다.
 * 다른 살아 있는 유닛의 칸과 앞의 적이 예약한 moveTo는 막힌 칸이다.
 */
export function computeIntents(combat: CombatState, content: GameContent): CombatState["intents"] {
  const intents: Record<Id, { moveTo: Pos; attack: Id | null }> = {}
  const reserved: Pos[] = []
  for (const enemy of combat.units) {
    if (enemy.side !== "enemy" || !alive(enemy)) continue
    const blocked = (p: Pos) => reserved.some((r) => samePos(r, p)) || occupied(combat.units, p, enemy.id)
    const ai = (enemy.creature === null ? undefined : content.creatures[enemy.creature]?.ai) ?? "aggressive"
    const allies = combat.units.filter((u) => u.side === "ally" && alive(u))
    const limit = RETREAT_RATIO[ai]
    if (limit !== undefined && enemy.morale !== undefined && enemy.maxMorale !== undefined && allies.length > 0 && enemy.morale <= Math.ceil(enemy.maxMorale * limit)) {
      const nearest = (p: Pos): number => Math.min(...allies.map((a) => manhattan(p, a.pos)))
      const cells = stepCells(combat, content, enemy, blocked).filter((p) => !blocked(p) || samePos(p, enemy.pos))
      const away = cells.reduce((best, c) => (nearest(c) > nearest(best) ? c : best), enemy.pos)
      intents[enemy.id] = { moveTo: away, attack: null }
      reserved.push(away)
      continue
    }
    let best: { target: CombatUnit; path: Dir[]; score: number } | null = null
    for (const ally of allies) {
      const path = approach(combat, content, enemy.pos, ally.pos, blocked)
      if (path === null) continue
      const score = ai === "skirmisher" ? ally.hp * 100 + path.length
        : ai === "pack" ? path.length - combat.units.filter((o) => o.id !== enemy.id && o.side === "enemy" && alive(o) && manhattan(o.pos, ally.pos) === 1).length * 2
        : path.length
      if (best === null || score < best.score) best = { target: ally, path, score }
    }
    let moveTo = enemy.pos
    for (const dir of best?.path.slice(0, MAX_STEPS) ?? []) moveTo = offset(moveTo, dir)
    const attack = best !== null && manhattan(moveTo, best.target.pos) === 1 ? best.target.id : null
    intents[enemy.id] = { moveTo, attack }
    reserved.push(moveTo)
  }
  return intents
}
