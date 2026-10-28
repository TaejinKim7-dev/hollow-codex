import { describe, expect, it } from "vitest"
import { computeIntents } from "../../../src/core/combat/grid.ts"
import { step } from "../../../src/core/step.ts"
import type { CombatAction, CombatState, CombatUnit, GameEvent, GameState } from "../../../src/core/types.ts"
import { deepFreeze, stateWith, testContent } from "./fixture.ts"

const c = testContent()
const P = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "player", side: "ally", creature: null, pos: { x, y }, hp: 10, attack: 3, ...patch }) as const
const S = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "creature.slime#0", side: "enemy", creature: "creature.slime", pos: { x, y }, hp: 4, attack: 2, ...patch }) as const
const B = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "creature.bandit#1", side: "enemy", creature: "creature.bandit", pos: { x, y }, hp: 3, attack: 4, ...patch }) as const
type UnitSeed = Pick<CombatUnit, "id" | "side" | "creature" | "pos" | "hp" | "attack"> & Partial<CombatUnit>

function combatState(seeds: readonly UnitSeed[], patch: Partial<GameState> = {}): GameState {
  const units: CombatUnit[] = seeds.map((u) => ({ defending: false, moved: false, acted: false, gone: null, ...u }))
  const active = units.find((u) => u.side === "ally" && u.gone === null && !u.acted)?.id ?? "player"
  const base: CombatState = { encounterId: "enc.a", grid: c.encounters["enc.a"]!.grid, units, active, round: 1, intents: {}, returnPos: { x: 1, y: 2 } }
  const combat: CombatState = { ...base, intents: computeIntents(base, c) }
  const s = stateWith({})
  return deepFreeze({ ...s, player: { ...s.player, pos: { x: 1, y: 3 } }, combat, ...patch })
}
const act = (s: GameState, action: CombatAction) => step(s, { type: "combat", action }, c)
const hits = (events: readonly GameEvent[]) => events.filter((e) => e.type === "combatHit")

describe("combat events for the hit-feel layer", () => {
  it("an ally attack reports attacker, target, damage, remaining hp, and keeps the sfx", () => {
    const r = act(combatState([P(2, 1), S(2, 0), B(4, 4)]), { kind: "attack", dir: "n" })
    expect(r.events).toContainEqual({ type: "combatHit", attacker: "player", target: "creature.slime#0", amount: 3, defeated: false, hp: 1, at: { x: 2, y: 1 } })
    expect(r.events).toContainEqual({ type: "sfx", name: "hit" })
  })
  it("a killing blow is flagged defeated", () => {
    const r = act(combatState([P(2, 1), S(2, 0, { hp: 3 }), B(4, 4)]), { kind: "attack", dir: "n" })
    expect(r.events).toContainEqual({ type: "combatHit", attacker: "player", target: "creature.slime#0", amount: 3, defeated: true, hp: 0, at: { x: 2, y: 1 } })
  })
  it("enemy-phase hits are reported in order with the enemy as attacker; defending halves the amount (rounded up)", () => {
    const r = act(combatState([P(2, 4), B(2, 3)]), { kind: "defend" })
    expect(hits(r.events)).toEqual([{ type: "combatHit", attacker: "creature.bandit#1", target: "player", amount: 2, defeated: false, hp: 8, at: { x: 2, y: 3 } }])
  })
  it("two enemies hit one after the other, in unit order", () => {
    const r = act(combatState([P(2, 4), S(2, 3), B(3, 4)]), { kind: "endTurn" })
    expect(hits(r.events).map((e) => (e as { attacker: string }).attacker)).toEqual(["creature.slime#0", "creature.bandit#1"])
  })
  it("an enemy that walks before it strikes reports the cell it struck from", () => {
    const r = act(combatState([P(2, 4), S(2, 0), B(4, 0)]), { kind: "endTurn" })
    const slime = hits(r.events).find((e) => (e as { attacker: string }).attacker === "creature.slime#0")
    expect((slime as { at: { x: number; y: number } } | undefined)?.at).toEqual({ x: 2, y: 3 })
  })
  it("a push off the grid is a retreat, a push into a wall is a 1-damage hit", () => {
    const off = act(combatState([P(2, 1), S(2, 0), B(0, 4)]), { kind: "push", dir: "n" })
    expect(off.events).toContainEqual({ type: "combatYield", target: "creature.slime#0", how: "retreated" })
    const wall = act(combatState([P(2, 2), S(2, 1), B(2, 0)]), { kind: "push", dir: "n" })
    expect(wall.events).toContainEqual({ type: "combatHit", attacker: "player", target: "creature.slime#0", amount: 1, defeated: false, hp: 3, at: { x: 2, y: 2 } })
  })
  it("a successful persuasion is a yield, a failed one is not", () => {
    const known = act(combatState([P(2, 1), S(2, 0), B(4, 4)], { facts: ["fact.slime-lore"] }), { kind: "persuade", dir: "n" })
    expect(known.events).toContainEqual({ type: "combatYield", target: "creature.slime#0", how: "persuaded" })
    const unknown = act(combatState([P(2, 1), S(2, 0), B(4, 4)]), { kind: "persuade", dir: "n" })
    expect(unknown.events.some((e) => e.type === "combatYield")).toBe(false)
  })
})
