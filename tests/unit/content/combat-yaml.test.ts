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
    expect(content?.combat).toEqual({ direction: { ...DEFAULT_COMBAT_RULES.direction, back: 2 }, chain: DEFAULT_COMBAT_RULES.chain, terrain: { ".": { defense: 1 } } })
  })
  it("rejects a terrain glyph that is not a tile, a bad number, and unknown keys", () => {
    expect(compileContent({ ...raw(), "combat.yaml": { terrain: { Q: { defense: 1 } } } }).errors.some((e) => e.includes("terrain.Q"))).toBe(true)
    expect(compileContent({ ...raw(), "combat.yaml": { terrain: { ".": { defense: -1 } } } }).errors.length).toBeGreaterThan(0)
    expect(compileContent({ ...raw(), "combat.yaml": { direction: { back: 0 } } }).errors.length).toBeGreaterThan(0)
    expect(compileContent({ ...raw(), "combat.yaml": { speed: 1 } }).errors.length).toBeGreaterThan(0)
  })
})
