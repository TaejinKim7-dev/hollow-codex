import { DEFAULT_COMBAT_RULES, type CombatRules, type GameContent } from "../../content/types.ts"
import type { CombatState, CombatUnit, Dir, Id, Pos } from "../types.ts"
import { DIRS, findPathOnGrid, offset } from "../world/path.ts"
import { attackDamage, chainHits, facingToward } from "./rules.ts"
import { alive, manhattan, MAX_STEPS, occupied, samePos } from "./intents.ts"

const unitOf = (combat: CombatState, id: Id): CombatUnit | undefined => combat.units.find((u) => u.id === id)

/** 이 유닛이 이번 차례에 걸어갈 수 있는 칸(`move` 명령과 같은 규칙: 경로 1~MAX_STEPS칸, 다른 유닛 칸 제외). 이미 움직였거나 행동했으면 []. */
export function reachableCells(combat: CombatState, content: GameContent, unitId: Id): Pos[] {
  const unit = unitOf(combat, unitId)
  if (unit === undefined || !alive(unit) || unit.moved || unit.acted) return []
  const out: Pos[] = []
  const blocked = (p: Pos): boolean => occupied(combat.units, p, unit.id)
  for (let y = 0; y < combat.grid.length; y++) {
    for (let x = 0; x < (combat.grid[0]?.length ?? 0); x++) {
      const cell = { x, y }
      if (samePos(cell, unit.pos) || manhattan(cell, unit.pos) > MAX_STEPS) continue
      const path = findPathOnGrid(combat.grid, content.tiles, unit.pos, cell, blocked)
      if (path !== null && path.length >= 1 && path.length <= MAX_STEPS) out.push(cell)
    }
  }
  return out
}

/** 바로 옆(4방향)에 있는 살아 있는 적과 그쪽을 보는 방향. 이미 행동한 유닛이면 []. */
export function attackTargets(combat: CombatState, unitId: Id): { id: Id; pos: Pos; dir: Dir }[] {
  const unit = unitOf(combat, unitId)
  if (unit === undefined || !alive(unit) || unit.acted) return []
  const out: { id: Id; pos: Pos; dir: Dir }[] = []
  for (const dir of DIRS) {
    const pos = offset(unit.pos, dir)
    const target = combat.units.find((u) => u.side !== unit.side && alive(u) && samePos(u.pos, pos))
    if (target !== undefined) out.push({ id: target.id, pos, dir })
  }
  return out
}

/**
 * `attack`을 하면 줄 피해(주 타격 + 연계 추가타 합계)와 처치 여부, 연계 수. 방향·지형·연계는 rules(content.combat)를 따른다.
 * 모르는 유닛이면 피해 0. 공격자는 대상 쪽을 보고 친다(실제 공격과 같다).
 */
export function previewHit(combat: CombatState, attackerId: Id, targetId: Id, rules: CombatRules = DEFAULT_COMBAT_RULES): { amount: number; defeated: boolean; chain: number } {
  const found = unitOf(combat, attackerId)
  const target = unitOf(combat, targetId)
  if (found === undefined || target === undefined) return { amount: 0, defeated: false, chain: 0 }
  const attacker = { ...found, facing: facingToward(found.pos, target.pos) }
  const main = attackDamage(combat, rules, attacker, target)
  const left = target.hp - main
  if (left <= 0) return { amount: main, defeated: true, chain: 0 }
  const chain = chainHits(combat, rules, attacker, { ...target, hp: left })
  const total = main + chain.reduce((sum, h) => sum + h.amount, 0)
  return { amount: total, defeated: target.hp - total <= 0, chain: chain.length }
}
