import { describe, expect, it } from "vitest"
import { combatObjectFit } from "../../../src/render/object-fit.ts"

describe("combatObjectFit", () => {
  it("shrinks a tall tree so it stays near its own cell instead of covering the cells above", () => {
    const f = combatObjectFit(80, 96, 1)
    expect(f).toBeLessThan(1)
    expect(96 * f).toBeLessThanOrEqual(32 * 1.6)
    expect(80 * f).toBeLessThanOrEqual(32 * 1.25)
  })
  it("never enlarges a small object", () => {
    expect(combatObjectFit(24, 24, 1)).toBe(1)
  })
  it("scales by the footprint width for wide objects", () => {
    expect(80 * combatObjectFit(80, 40, 3)).toBeLessThanOrEqual(32 * 3 * 1.25)
  })
})
