import { DEFAULT_COMBAT_RULES, FIGHTER, type CombatRules, type GameContent, type UnitClass } from "../../content/types.ts"
import type { CombatState, CombatUnit, Dir, Pos } from "../types.ts"
import { offset } from "../world/path.ts"
import { alive, manhattan } from "./intents.ts"

const OPPOSITE: Readonly<Record<Dir, Dir>> = { n: "s", s: "n", e: "w", w: "e" }

/** from에서 to를 바라보는 방향. 가로·세로 거리가 같으면 세로 쪽. */
export function facingToward(from: Pos, to: Pos): Dir {
  const dx = to.x - from.x, dy = to.y - from.y
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "e" : "w") : dy > 0 ? "s" : "n"
}

/** 공격자가 대상의 정면·옆·등 뒤 중 어디에 서 있는가. 바라보는 방향이 없는 대상은 항상 정면(보정 없음). */
export function sideOf(target: CombatUnit, attackerPos: Pos): "front" | "side" | "back" {
  if (target.facing === undefined) return "front"
  const toward = facingToward(target.pos, attackerPos)
  return toward === target.facing ? "front" : toward === OPPOSITE[target.facing] ? "back" : "side"
}

export const rulesOf = (content: GameContent): CombatRules => content.combat ?? DEFAULT_COMBAT_RULES

/** 유닛의 병과 값(병과가 없거나 표에 없으면 fighter). */
export function classOf(rules: CombatRules, unit: Pick<CombatUnit, "class">): UnitClass {
  return (unit.class === undefined ? undefined : rules.classes[unit.class]) ?? FIGHTER
}

/** 한 차례에 걸을 수 있는 최대 칸 수. */
export const unitMove = (rules: CombatRules, unit: Pick<CombatUnit, "class">): number => classOf(rules, unit).move

/**
 * 이 유닛이 dir 방향 한 줄로 맞힐 수 있는 상대. 그 줄에서 처음 만나는 살아 있는 유닛이 상대편이고 거리가 병과 사거리 안일 때만 대상이다.
 * 중간에 같은 편이 서 있거나 사거리 밖(너무 가깝거나 멀다)이면 null(오사 없음). 지형은 막지 않는다.
 */
export function shotTarget(combat: Pick<CombatState, "units">, rules: CombatRules, unit: CombatUnit, dir: Dir): { target: CombatUnit; dist: number } | null {
  const { rangeMin, rangeMax } = classOf(rules, unit)
  let p = unit.pos
  for (let dist = 1; dist <= rangeMax; dist++) {
    p = offset(p, dir)
    const hit = combat.units.find((u) => alive(u) && u.pos.x === p.x && u.pos.y === p.y)
    if (hit === undefined) continue
    return hit.side !== unit.side && dist >= rangeMin ? { target: hit, dist } : null
  }
  return null
}

/** unit이 지금 자리에서 targetId를 맞힐 수 있는 방향(없으면 null). 예고와 적 단계가 같은 판정을 쓰게 한다. */
export function shotDir(combat: Pick<CombatState, "units">, rules: CombatRules, unit: CombatUnit, targetId: string): Dir | null {
  for (const dir of ["n", "e", "s", "w"] as const) if (shotTarget(combat, rules, unit, dir)?.target.id === targetId) return dir
  return null
}

/** 그 칸의 지형 방어 보정(격자 밖·정의 없음 = 0). */
export function terrainDefense(grid: readonly string[], rules: CombatRules, pos: Pos): number {
  const ch = grid[pos.y]?.[pos.x]
  return ch === undefined ? 0 : rules.terrain[ch]?.defense ?? 0
}

/**
 * 공격 1회의 피해. 공격력 × 방향 배율(반올림) − 지형 방어 − 병과 방어(최소 1), 방어 자세면 절반 올림.
 * 방향·지형이 없으면 옛 규칙(공격력, 방어 자세면 ceil(공격력/2))과 같다.
 */
export function attackDamage(combat: Pick<CombatState, "grid">, rules: CombatRules, attacker: CombatUnit, target: CombatUnit): number {
  const factor = target.side === "ally" && !rules.direction.vsAllies ? 1 : rules.direction[sideOf(target, attacker.pos)]
  const mark = target.marked === true ? rules.breath.markBonus : 1
  const raw = Math.max(1, Math.round(attacker.attack * factor * mark) - terrainDefense(combat.grid, rules, target.pos) - classOf(rules, target).takenDefense)
  return target.defending ? Math.ceil(raw / 2) : raw
}

export interface ChainHit { readonly attacker: string; readonly target: string; readonly amount: number; readonly defeated: boolean; readonly hp: number; readonly at: Pos }

/**
 * 연계 추가타: 주 타격 뒤 target(이미 맞은 상태)의 4방 인접 칸에 있는 같은 편 유닛이 units 순서대로 한 번씩 더 친다.
 * 피해 = max(1, round(그 유닛의 정상 피해 × ratio)). 대상이 쓰러지면 거기서 멈춘다. 적 쪽 연계는 rules.chain.enemies가 켜졌을 때만.
 */
export function chainHits(combat: CombatState, rules: CombatRules, attacker: CombatUnit, target: CombatUnit): ChainHit[] {
  if (attacker.side === "enemy" && !rules.chain.enemies) return []
  const out: ChainHit[] = []
  let hp = target.hp
  if (hp <= 0) return out
  for (const u of combat.units) {
    if (u.id === attacker.id || u.side !== attacker.side || !alive(u) || manhattan(u.pos, target.pos) !== 1) continue
    const amount = Math.max(1, Math.round(attackDamage(combat, rules, u, { ...target, hp }) * rules.chain.ratio))
    hp -= amount
    out.push({ attacker: u.id, target: target.id, amount, defeated: hp <= 0, hp: Math.max(0, hp), at: u.pos })
    if (hp <= 0) break
  }
  return out
}
