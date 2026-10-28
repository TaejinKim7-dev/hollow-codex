import type { GameContent } from "../../content/types.ts"
import type { CombatState, CombatUnit, Dir, Id, Pos } from "../types.ts"
import { DIRS, findPathOnGrid, offset } from "../world/path.ts"
import { damage } from "./grid.ts"
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

/** `attack`을 하면 줄 피해와 처치 여부(규칙 4: 방어 중이면 절반 올림). 모르는 유닛이면 피해 0. */
export function previewHit(combat: CombatState, attackerId: Id, targetId: Id): { amount: number; defeated: boolean } {
  const attacker = unitOf(combat, attackerId)
  const target = unitOf(combat, targetId)
  if (attacker === undefined || target === undefined) return { amount: 0, defeated: false }
  const amount = damage(attacker.attack, target)
  return { amount, defeated: target.hp - amount <= 0 }
}
