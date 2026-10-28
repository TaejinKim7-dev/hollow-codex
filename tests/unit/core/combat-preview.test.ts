import { describe, expect, it } from "vitest"
import { computeIntents } from "../../../src/core/combat/grid.ts"
import { attackTargets, previewHit, reachableCells } from "../../../src/core/combat/preview.ts"
import type { CombatState, CombatUnit } from "../../../src/core/types.ts"
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
    expect(attackTargets(combat([P(2, 1), S(2, 0), B(3, 1)]), "player")).toEqual([
      { id: "creature.slime#0", pos: { x: 2, y: 0 }, dir: "n" },
      { id: "creature.bandit#1", pos: { x: 3, y: 1 }, dir: "e" }
    ])
  })
  it("ignores far enemies, dead enemies and a unit that already acted", () => {
    expect(attackTargets(combat([P(2, 4), S(2, 0), B(4, 1)]), "player")).toEqual([])
    expect(attackTargets(combat([P(2, 1), S(2, 0, { gone: "dead" }), B(4, 4)]), "player")).toEqual([])
    expect(attackTargets(combat([P(2, 1, { acted: true }), S(2, 0), B(4, 4)]), "player")).toEqual([])
  })
})

describe("previewHit", () => {
  it("shows the damage the attack would do and whether it would defeat", () => {
    const s = combat([P(2, 1), S(2, 0, { hp: 3 }), B(4, 4)])
    expect(previewHit(s, "player", "creature.slime#0")).toEqual({ amount: 3, defeated: true })
    expect(previewHit(combat([P(2, 1), S(2, 0), B(4, 4)]), "player", "creature.slime#0")).toEqual({ amount: 3, defeated: false })
  })
  it("halves (rounded up) against a defending target", () => {
    const s = combat([P(2, 1), S(2, 0, { defending: true }), B(4, 4)])
    expect(previewHit(s, "player", "creature.slime#0").amount).toBe(2)
  })
})
