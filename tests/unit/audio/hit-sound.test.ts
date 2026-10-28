import { describe, expect, it } from "vitest"
import { hitRate } from "../../../src/audio/hit-sound.ts"

describe("hitRate (playback rate of the hit sound)", () => {
  it("bigger blows sound lower", () => {
    expect(hitRate(1, 0, false)).toBeGreaterThan(hitRate(5, 0, false))
  })
  it("each hit in a chain is a little higher than the one before", () => {
    expect(hitRate(2, 1, false)).toBeCloseTo(hitRate(2, 0, false) + 0.06, 5)
    expect(hitRate(2, 2, false)).toBeGreaterThan(hitRate(2, 1, false))
  })
  it("the blow that defeats is lower", () => {
    expect(hitRate(2, 0, true)).toBeCloseTo(hitRate(2, 0, false) - 0.05, 5)
  })
  it("stays inside 0.7..1.4", () => {
    expect(hitRate(999, 0, true)).toBeGreaterThanOrEqual(0.7)
    expect(hitRate(1, 99, false)).toBeLessThanOrEqual(1.4)
  })
})
