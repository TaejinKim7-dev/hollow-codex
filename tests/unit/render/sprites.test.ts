import { describe, expect, it } from "vitest"
import { charDrawRect, legacyDraw } from "../../../src/render/sprites.ts"

describe("legacyDraw", () => {
  it("maps a 16px sheet index to its source rect", () => {
    expect(legacyDraw(12, 16, 13)).toEqual({ sx: 16, sy: 16, sw: 16, sh: 16 })
  })
})

describe("charDrawRect", () => {
  it("places a 48px canvas on a 32px cell: half a cell up, a quarter cell out each side", () => {
    expect(charDrawRect(2, 3, 96)).toEqual({ x: 2 * 96 - 24, y: 3 * 96 - 48, w: 144, h: 144 })
  })
})
