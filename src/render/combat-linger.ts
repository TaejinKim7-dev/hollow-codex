import type { CombatUnit, GameEvent } from "../core/types.ts"

/**
 * 전투가 끝난 직후에도 마지막 일격이 보이도록 남겨 두는 장면의 유닛들.
 * core는 끝난 전투의 상태를 남기지 않으므로 직전 유닛에 이벤트를 적용해 만든다:
 * 처치된 유닛은 dead, 굴복·퇴각한 유닛은 retreated, 때린 유닛은 때린 칸(`at`)으로 옮긴다(적은 걸어와서 때린다).
 */
export function endedCombatUnits(before: readonly CombatUnit[], events: readonly GameEvent[]): CombatUnit[] {
  const gone = new Map<string, "dead" | "retreated">()
  const struckFrom = new Map<string, { x: number; y: number }>()
  for (const e of events) {
    if (e.type === "combatHit") {
      struckFrom.set(e.attacker, e.at)
      if (e.defeated) gone.set(e.target, "dead")
    } else if (e.type === "combatYield") {
      gone.set(e.target, "retreated")
    }
  }
  return before.map((u) => {
    const g = gone.get(u.id)
    const at = struckFrom.get(u.id)
    return { ...u, ...(g === undefined ? {} : { gone: g }), ...(at === undefined ? {} : { pos: at }) }
  })
}
