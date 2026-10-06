import { describe, expect, it } from "vitest"
import { renderSfx, SFX } from "../../../src/audio/sfx.ts"

describe("renderSfx", () => {
  it("length is ms × sampleRate / 1000", () => {
    expect(renderSfx(SFX.step, 44100)).toHaveLength(1764)
  })

  it("peak amplitude ≤ 1", () => {
    for (const p of Object.values(SFX)) {
      expect(Math.max(...renderSfx(p, 22050).map(Math.abs))).toBeLessThanOrEqual(1)
    }
  })

  it("same params give identical samples", () => {
    expect(renderSfx(SFX.hit, 22050)).toEqual(renderSfx(SFX.hit, 22050))
  })
})