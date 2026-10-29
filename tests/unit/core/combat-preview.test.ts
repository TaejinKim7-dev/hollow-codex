import { describe, expect, it } from "vitest"
import { computeIntents } from "../../../src/core/combat/grid.ts"
import { attackTargets, previewHit, reachableCells } from "../../../src/core/combat/preview.ts"
import type { CombatState, CombatUnit } from "../../../src/core/types.ts"
import { DEFAULT_COMBAT_RULES } from "../../../src/content/types.ts"
import { testContent } from "./fixture.ts"

const c = testContent()
const P = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "player", side: "ally", creature: null, pos: { x, y }, hp: 10, attack: 3, ...patch }) as const
const S = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "creature.slime#0", side: "enemy", creature: "creature.slime", pos: { x, y }, hp: 4, attack: 2, ...patch }) as const
const B = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "creature.bandit#1", side: "enemy", creature: "creature.bandit", pos: { x, y }, hp: 3, attack: 4, ...patch }) as const
type Seed = Pick<CombatUnit, "id" | "side" | "creature" | "pos" | "hp" | "attack"> & Partial<CombatUnit>
function combat(seeds: readonly Seed[]): CombatState {
  const units: CombatUnit[] = seeds.map((u) => ({ defending: false, moved: false, acted: false, gone: null, ...u }))
  const base: CombatState = { encounterId: "enc.a", grid: c.encounters["enc.a"]!.grid, units, active: "player", round: 1, intents: {}, returnPos: { x: 1, y: 2 } }
  return { ...base, intents: computeIntents(base, c) }
}
const key = (p: { x: number; y: number }) => `${p.x},${p.y}`

describe("reachableCells", () => {
  it("lists cells within 3 steps, not the unit's own cell, not occupied cells", () => {
    const cells = reachableCells(combat([P(2, 4), S(2, 0), B(4, 1)]), c, "player").map(key)
    expect(cells).toContain("2,1")           // 3 steps north
    expect(cells).toContain("0,4")           // 2 steps west
    expect(cells).not.toContain("2,0")       // 4 steps and occupied
    expect(cells).not.toContain("2,4")       // itself
  })
  it("excludes cells occupied by other units even when within range", () => {
    const cells = reachableCells(combat([P(2, 4), S(2, 3), B(4, 0)]), c, "player").map(key)
    expect(cells).not.toContain("2,3")
  })
  it("is empty once the unit has moved or acted", () => {
    expect(reachableCells(combat([P(2, 4, { moved: true }), S(2, 0), B(4, 1)]), c, "player")).toEqual([])
    expect(reachableCells(combat([P(2, 4, { acted: true }), S(2, 0), B(4, 1)]), c, "player")).toEqual([])
  })
})

describe("attackTargets", () => {
  it("lists living adjacent enemies with the direction to face them", () => {
    expect(attackTargets(combat([P(2, 1), S(2, 0), B(3, 1)]), c, "player")).toEqual([
      { id: "creature.slime#0", pos: { x: 2, y: 0 }, dir: "n", dist: 1 },
      { id: "creature.bandit#1", pos: { x: 3, y: 1 }, dir: "e", dist: 1 }
    ])
  })
  it("ignores far enemies, dead enemies and a unit that already acted", () => {
    expect(attackTargets(combat([P(2, 4), S(2, 0), B(4, 1)]), c, "player")).toEqual([])
    expect(attackTargets(combat([P(2, 1), S(2, 0, { gone: "dead" }), B(4, 4)]), c, "player")).toEqual([])
    expect(attackTargets(combat([P(2, 1, { acted: true }), S(2, 0), B(4, 4)]), c, "player")).toEqual([])
  })
})

describe("previewHit", () => {
  it("shows the damage the attack would do and whether it would defeat", () => {
    const s = combat([P(2, 1), S(2, 0, { hp: 3 }), B(4, 4)])
    expect(previewHit(s, "player", "creature.slime#0")).toEqual({ amount: 3, defeated: true, chain: 0 })
    expect(previewHit(combat([P(2, 1), S(2, 0), B(4, 4)]), "player", "creature.slime#0")).toEqual({ amount: 3, defeated: false, chain: 0 })
  })
  it("halves (rounded up) against a defending target", () => {
    const s = combat([P(2, 1), S(2, 0, { defending: true }), B(4, 4)])
    expect(previewHit(s, "player", "creature.slime#0").amount).toBe(2)
  })
})

describe("class movement", () => {
  const withClasses = { ...c, combat: { ...DEFAULT_COMBAT_RULES, classes: { ...DEFAULT_COMBAT_RULES.classes, runner: { move: 4, rangeMin: 1, rangeMax: 1, takenDefense: 0 }, guardian: { move: 2, rangeMin: 1, rangeMax: 1, takenDefense: 1 } } } }
  it("a runner can reach a cell 4 steps away, a fighter and a guardian cannot", () => {
    const at = (cls: string | undefined) => reachableCells(combat([P(0, 4, cls === undefined ? {} : { class: cls }), S(4, 0), B(4, 1)]), withClasses, "player").map(key)
    expect(at("runner")).toContain("4,4")
    expect(at(undefined)).not.toContain("4,4")
    expect(at(undefined)).toContain("3,4")
    expect(at("guardian")).not.toContain("3,4")
    expect(at("guardian")).toContain("2,4")
  })
})

describe("ranged attack (archer: range 2-3 in a straight line)", () => {
  const rc = { ...c, combat: { ...DEFAULT_COMBAT_RULES, classes: { ...DEFAULT_COMBAT_RULES.classes, archer: { move: 2, rangeMin: 2, rangeMax: 3, takenDefense: 0 } } } }
  const A = (x: number, y: number) => P(x, y, { class: "archer" })
  const targets = (units: ReturnType<typeof P>[] | Parameters<typeof combat>[0]) => attackTargets(combat(units), rc, "player")
  it("hits the first enemy at distance 2 and 3 in a line", () => {
    expect(targets([A(2, 4), S(2, 2)]).map((t) => [t.id, t.dir, t.dist])).toEqual([["creature.slime#0", "n", 2]])
    expect(targets([A(2, 4), S(2, 1)]).map((t) => t.dist)).toEqual([3])
  })
  it("cannot hit an adjacent enemy or one beyond range 3", () => {
    expect(targets([A(2, 4), S(2, 3)])).toEqual([])
    expect(targets([A(0, 4), S(0, 0)])).toEqual([])
  })
  it("does not shoot through a friend and ignores enemies behind the first unit", () => {
    const friend = { id: "comp", side: "ally", creature: null, pos: { x: 2, y: 3 }, hp: 5, attack: 2 } as const
    expect(targets([A(2, 4), friend, S(2, 2)])).toEqual([])
    expect(targets([A(2, 4), S(2, 3), B(2, 2)])).toEqual([])   // 바로 앞 적이 가까워 못 치고, 그 뒤 적은 가려진다
  })
  it("stays safe at the grid edge", () => {
    expect(() => targets([A(0, 0), S(4, 4)])).not.toThrow()
    expect(targets([A(0, 0), S(4, 4)])).toEqual([])
  })
})
