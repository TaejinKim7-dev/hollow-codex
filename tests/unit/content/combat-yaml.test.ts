import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { DEFAULT_COMBAT_RULES } from "../../../src/content/types.ts"

const raw = () => loadContentDir("tests/fixtures/content-min")

describe("combat.yaml in compile", () => {
  it("is optional: without it content.combat is absent", () => {
    expect(compileContent(raw()).content?.combat).toBeUndefined()
  })
  it("reads direction, chain and terrain, and fills missing parts with defaults", () => {
    const { content, errors } = compileContent({ ...raw(), "combat.yaml": { direction: { back: 2 }, terrain: { ".": { defense: 1 } } } })
    expect(errors).toEqual([])
    expect(content?.combat).toEqual({ direction: { ...DEFAULT_COMBAT_RULES.direction, back: 2 }, chain: DEFAULT_COMBAT_RULES.chain, momentum: DEFAULT_COMBAT_RULES.momentum, morale: DEFAULT_COMBAT_RULES.morale, breath: DEFAULT_COMBAT_RULES.breath, terrain: { ".": { defense: 1 } } })
  })
  it("reads the momentum section and rejects a bad max", () => {
    const ok = compileContent({ ...raw(), "combat.yaml": { momentum: { max: 4, weak: 2 } } })
    expect(ok.errors).toEqual([])
    expect(ok.content?.combat?.momentum).toEqual({ ...DEFAULT_COMBAT_RULES.momentum, max: 4, weak: 2 })
    expect(compileContent({ ...raw(), "combat.yaml": { momentum: { max: 0 } } }).errors.length).toBeGreaterThan(0)
    expect(compileContent({ ...raw(), "combat.yaml": { momentum: { speed: 1 } } }).errors.length).toBeGreaterThan(0)
  })
  it("reads the morale section and rejects a persuade ratio above 1", () => {
    const ok = compileContent({ ...raw(), "combat.yaml": { morale: { weakLoss: 2 } } })
    expect(ok.errors).toEqual([])
    expect(ok.content?.combat?.morale).toEqual({ ...DEFAULT_COMBAT_RULES.morale, weakLoss: 2 })
    expect(compileContent({ ...raw(), "combat.yaml": { morale: { persuadeRatio: 1.5 } } }).errors.length).toBeGreaterThan(0)
  })
  it("reads the breath section and rejects a negative cost", () => {
    const ok = compileContent({ ...raw(), "combat.yaml": { breath: { start: 3, calmLoss: 4 } } })
    expect(ok.errors).toEqual([])
    expect(ok.content?.combat?.breath).toEqual({ ...DEFAULT_COMBAT_RULES.breath, start: 3, calmLoss: 4 })
    expect(compileContent({ ...raw(), "combat.yaml": { breath: { cost: -1 } } }).errors.length).toBeGreaterThan(0)
  })
  it("rejects a terrain glyph that is not a tile, a bad number, and unknown keys", () => {
    expect(compileContent({ ...raw(), "combat.yaml": { terrain: { Q: { defense: 1 } } } }).errors.some((e) => e.includes("terrain.Q"))).toBe(true)
    expect(compileContent({ ...raw(), "combat.yaml": { terrain: { ".": { defense: -1 } } } }).errors.length).toBeGreaterThan(0)
    expect(compileContent({ ...raw(), "combat.yaml": { direction: { back: 0 } } }).errors.length).toBeGreaterThan(0)
    expect(compileContent({ ...raw(), "combat.yaml": { speed: 1 } }).errors.length).toBeGreaterThan(0)
  })
})

describe("creatures.yaml ai", () => {
  const withAi = (ai: unknown) => {
    const files = loadContentDir("content")
    const list = (files["creatures.yaml"] as Record<string, unknown>[]).map((c, i) => (i === 0 ? { ...c, ai } : c))
    return compileContent({ ...files, "creatures.yaml": list })
  }
  it("reads a known ai and rejects an unknown one", () => {
    const ok = withAi("pack")
    expect(ok.errors).toEqual([])
    expect(Object.values(ok.content!.creatures).some((c) => c.ai === "pack")).toBe(true)
    expect(withAi("berserk").errors.some((e) => e.includes("ai"))).toBe(true)
  })
})
