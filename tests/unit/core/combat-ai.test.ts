import { describe, expect, it } from "vitest"
import { DEFAULT_COMBAT_RULES, type CreatureAi } from "../../../src/content/types.ts"
import type { CombatState, CombatUnit } from "../../../src/core/types.ts"
import { computeIntents } from "../../../src/core/combat/intents.ts"
import { testContent } from "./fixture.ts"

const base = testContent()
const withAi = (ai: CreatureAi) => ({ ...base, creatures: { ...base.creatures, "creature.slime": { ...base.creatures["creature.slime"]!, ai } } })
const u = (id: string, side: "ally" | "enemy", x: number, y: number, patch: Partial<CombatUnit> = {}): CombatUnit => ({
  id, side, creature: side === "enemy" ? "creature.slime" : null, pos: { x, y }, hp: 10, attack: 2, defending: false, moved: false, acted: false, gone: null, ...patch
})
const state = (units: CombatUnit[]): CombatState => ({ encounterId: "enc.a", grid: ["......", "......", "......", "......", "......", "......"], units, active: "player", round: 1, intents: {}, returnPos: { x: 0, y: 0 } })
const plain = { ...base, tiles: { ...base.tiles } }

describe("enemy AI personalities", () => {
  it("aggressive goes for the closest ally", () => {
    const s = state([u("player", "ally", 0, 5), u("mate", "ally", 5, 1, { hp: 3 }), u("e", "enemy", 4, 1)])
    expect(computeIntents(s, withAi("aggressive"))["e"]!.attack).toBe("mate")
  })
  it("skirmisher goes for the weakest ally even when it is farther", () => {
    const s = state([u("player", "ally", 1, 1, { hp: 12 }), u("mate", "ally", 5, 5, { hp: 2 }), u("e", "enemy", 2, 1)])
    expect(computeIntents(s, withAi("aggressive"))["e"]!.attack).toBe("player")
    const sk = computeIntents(s, withAi("skirmisher"))["e"]!
    expect(sk.moveTo.x + sk.moveTo.y).toBeGreaterThan(3)   // heads toward (5,5)
  })
  it("pack prefers the ally another enemy is already next to", () => {
    const s = state([u("player", "ally", 0, 1), u("mate", "ally", 4, 3), u("e0", "enemy", 4, 4), u("e1", "enemy", 3, 1)])
    const c = withAi("pack")
    expect(computeIntents(s, c)["e1"]!.attack).toBeDefined()
    const aggressive = computeIntents(s, withAi("aggressive"))["e1"]!
    expect(aggressive.attack).toBe("player")
    expect(computeIntents(s, c)["e1"]!.moveTo).not.toEqual(aggressive.moveTo)
  })
  it("cautious keeps its distance once its morale is at half or less, and attacks otherwise", () => {
    const hurt = state([u("player", "ally", 2, 2), u("e", "enemy", 2, 3, { morale: 2, maxMorale: 6 })])
    const out = computeIntents(hurt, withAi("cautious"))["e"]!
    expect(out.attack).toBeNull()
    expect(Math.abs(out.moveTo.x - 2) + Math.abs(out.moveTo.y - 2)).toBeGreaterThan(1)
    const fresh = state([u("player", "ally", 2, 2), u("e", "enemy", 2, 3, { morale: 6, maxMorale: 6 })])
    expect(computeIntents(fresh, withAi("cautious"))["e"]!.attack).toBe("player")
  })
  it("coward turns tail earlier than cautious (three quarters)", () => {
    const s = state([u("player", "ally", 2, 2), u("e", "enemy", 2, 3, { morale: 4, maxMorale: 6 })])
    expect(computeIntents(s, withAi("cautious"))["e"]!.attack).toBe("player")
    expect(computeIntents(s, withAi("coward"))["e"]!.attack).toBeNull()
  })
  void plain
})

describe("class-aware enemy intents", () => {
  const cls = { ...base, combat: { ...DEFAULT_COMBAT_RULES, classes: { ...DEFAULT_COMBAT_RULES.classes, archer: { move: 2, rangeMin: 2, rangeMax: 3, takenDefense: 0 }, runner: { move: 4, rangeMin: 1, rangeMax: 1, takenDefense: 0 } } } }
  const archer = (x: number, y: number) => u("e", "enemy", x, y, { class: "archer" })
  it("an enemy archer in a line at range shoots, backing off to the far end of its range", () => {
    const i = computeIntents(state([u("player", "ally", 2, 5), archer(2, 3)]), cls)["e"]!
    expect(i).toEqual({ moveTo: { x: 2, y: 2 }, attack: "player" })
  })
  it("steps back to a firing cell instead of standing adjacent", () => {
    const i = computeIntents(state([u("player", "ally", 2, 3), archer(2, 2)]), cls)["e"]!
    expect(i.attack).toBe("player")
    expect(Math.abs(i.moveTo.x - 2) + Math.abs(i.moveTo.y - 3)).toBeGreaterThanOrEqual(2)
  })
  it("walks toward the ally when no firing cell is within reach", () => {
    const i = computeIntents(state([u("player", "ally", 0, 5), archer(5, 0)]), cls)["e"]!
    expect(i.attack).toBeNull()
    expect(i.moveTo).not.toEqual({ x: 5, y: 0 })
  })
  it("an enemy runner covers 4 steps", () => {
    const i = computeIntents(state([u("player", "ally", 0, 5), u("e", "enemy", 5, 5, { class: "runner" })]), cls)["e"]!
    expect(5 - i.moveTo.x + (5 - i.moveTo.y)).toBe(4)
  })
})
