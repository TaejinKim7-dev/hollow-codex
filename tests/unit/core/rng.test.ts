import { describe, expect, it } from "vitest"
import { nextRandom } from "../../../src/core/rng.ts"

describe("nextRandom", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = nextRandom(1), b = nextRandom(1)
    expect(a).toEqual(b)
    let rng = 42
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      const r = nextRandom(rng)
      expect(r.value).toBeGreaterThanOrEqual(0); expect(r.value).toBeLessThan(1)
      expect(Number.isInteger(r.rng) && r.rng >= 0 && r.rng <= 0xffffffff).toBe(true)
      seen.add(r.value); rng = r.rng
    }
    expect(seen.size).toBeGreaterThan(990)
  })
})
