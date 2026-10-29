import { describe, expect, it } from "vitest"
import { DEFAULT_COMBAT_RULES, FIGHTER } from "../../../src/content/types.ts"
import type { CombatRules } from "../../../src/content/types.ts"
import type { CombatState, CombatUnit } from "../../../src/core/types.ts"
import { attackDamage, chainHits, classOf, facingToward, sideOf, terrainDefense, unitMove } from "../../../src/core/combat/rules.ts"

const u = (id: string, side: "ally" | "enemy", x: number, y: number, patch: Partial<CombatUnit> = {}): CombatUnit => ({
  id, side, creature: side === "enemy" ? "c" : null, pos: { x, y }, hp: 10, attack: 4, defending: false, moved: false, acted: false, gone: null, ...patch
})
const grid = ["ggggg", "ggggg", "ggghg", "ggggg", "ggggg"]
const state = (units: CombatUnit[]): CombatState => ({ encounterId: "e", grid, units, active: "player", round: 1, intents: {}, returnPos: { x: 0, y: 0 } })
const rules: CombatRules = { ...DEFAULT_COMBAT_RULES, terrain: { h: { defense: 1 } } }

describe("facingToward", () => {
  it("picks the dominant axis; ties prefer the vertical axis", () => {
    expect(facingToward({ x: 2, y: 2 }, { x: 2, y: 0 })).toBe("n")
    expect(facingToward({ x: 2, y: 2 }, { x: 4, y: 2 })).toBe("e")
    expect(facingToward({ x: 2, y: 2 }, { x: 3, y: 3 })).toBe("s")
    expect(facingToward({ x: 2, y: 2 }, { x: 0, y: 1 })).toBe("w")
  })
})

describe("sideOf: where the attacker stands relative to the target's facing", () => {
  it("front, side and back", () => {
    const target = u("t", "enemy", 2, 2, { facing: "n" })
    expect(sideOf(target, { x: 2, y: 1 })).toBe("front")
    expect(sideOf(target, { x: 3, y: 2 })).toBe("side")
    expect(sideOf(target, { x: 1, y: 2 })).toBe("side")
    expect(sideOf(target, { x: 2, y: 3 })).toBe("back")
  })
  it("a target without a facing has no direction bonus", () => {
    expect(sideOf(u("t", "enemy", 2, 2), { x: 2, y: 3 })).toBe("front")
  })
})

describe("terrainDefense", () => {
  it("reads the defense of the tile the unit stands on, 0 elsewhere", () => {
    expect(terrainDefense(grid, rules, { x: 3, y: 2 })).toBe(1)
    expect(terrainDefense(grid, rules, { x: 0, y: 0 })).toBe(0)
    expect(terrainDefense(grid, rules, { x: 9, y: 9 })).toBe(0)
  })
})

describe("attackDamage", () => {
  const atk = u("player", "ally", 2, 3)
  it("front 4, side 5, back 6", () => {
    const at = (facing: "n" | "e" | "s") => attackDamage(state([atk]), rules, atk, u("t", "enemy", 2, 2, { facing }))
    expect(at("s")).toBe(4)   // target faces the attacker (south): front
    expect(at("e")).toBe(5)   // faces east: attacker is on its side
    expect(at("n")).toBe(6)   // faces away: back
  })
  it("allies take no direction bonus unless vsAllies is on", () => {
    const e = u("e", "enemy", 2, 3), ally = u("a", "ally", 2, 2, { facing: "n" })   // attacked from behind
    expect(attackDamage(state([e]), rules, e, ally)).toBe(4)
    const on: CombatRules = { ...rules, direction: { ...rules.direction, vsAllies: true } }
    expect(attackDamage(state([e]), on, e, ally)).toBe(6)
  })
  it("terrain defense is subtracted after the multiplier, never below 1", () => {
    const onHill = u("t", "enemy", 3, 2, { facing: "s" })
    expect(attackDamage(state([atk]), rules, u("p", "ally", 3, 3), onHill)).toBe(3)
    expect(attackDamage(state([atk]), rules, u("w", "ally", 3, 3, { attack: 1 }), onHill)).toBe(1)
  })
  it("a defending target takes half, rounded up, after everything else", () => {
    expect(attackDamage(state([atk]), rules, atk, u("t", "enemy", 2, 2, { facing: "n", defending: true }))).toBe(3)
  })
  it("without facing or terrain it equals the old rule", () => {
    expect(attackDamage(state([atk]), DEFAULT_COMBAT_RULES, atk, u("t", "enemy", 2, 2))).toBe(4)
    expect(attackDamage(state([atk]), DEFAULT_COMBAT_RULES, atk, u("t", "enemy", 2, 2, { defending: true }))).toBe(2)
  })
})

describe("chainHits", () => {
  const target = u("t", "enemy", 2, 2, { hp: 20, facing: "s" })
  it("every other living ally orthogonally adjacent to the target adds a hit of ratio × its damage, in unit order", () => {
    const a = u("player", "ally", 2, 3), b = u("b", "ally", 1, 2), c = u("c", "ally", 3, 2), far = u("far", "ally", 0, 0)
    const hits = chainHits(state([a, b, c, far, target]), rules, a, target)
    expect(hits.map((h) => h.attacker)).toEqual(["b", "c"])
    expect(hits.map((h) => h.amount)).toEqual([3, 3])   // side ×1.25 → 5, ×0.5 → round(2.5)=3
  })
  it("stops when a chain hit defeats the target, and is empty when nobody is adjacent", () => {
    const a = u("player", "ally", 2, 3), b = u("b", "ally", 1, 2), c = u("c", "ally", 3, 2)
    const weak = { ...target, hp: 3 }
    expect(chainHits(state([a, b, c, weak]), rules, a, weak).map((h) => [h.attacker, h.defeated])).toEqual([["b", true]])
    expect(chainHits(state([a, target]), rules, a, target)).toEqual([])
  })
  it("enemies chain only when the rules allow it", () => {
    const e1 = u("e1", "enemy", 2, 1), e2 = u("e2", "enemy", 1, 2), player = u("player", "ally", 2, 2, { hp: 20 })
    expect(chainHits(state([player, e1, e2]), rules, e1, player)).toEqual([])
    const on: CombatRules = { ...rules, chain: { ratio: 0.5, enemies: true } }
    expect(chainHits(state([player, e1, e2]), on, e1, player).map((h) => h.attacker)).toEqual(["e2"])
  })
})

describe("classOf / unitMove", () => {
  const rules = { ...DEFAULT_COMBAT_RULES, classes: { ...DEFAULT_COMBAT_RULES.classes, runner: { move: 4, rangeMin: 1, rangeMax: 1, takenDefense: 0 } } }
  it("falls back to fighter without or with an unknown class", () => {
    expect(classOf(rules, {})).toEqual(FIGHTER)
    expect(classOf(rules, { class: "nope" })).toEqual(FIGHTER)
  })
  it("reads the unit's own class", () => {
    expect(unitMove(rules, { class: "runner" })).toBe(4)
    expect(unitMove(rules, {})).toBe(3)
  })
})
