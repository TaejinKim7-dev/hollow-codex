import { describe, expect, it } from "vitest"
import { characterImageKey, charDrawRect, idleBobPx, legacyDraw } from "../../../src/render/sprites.ts"

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

describe("characterImageKey", () => {
  const has = (keys: string[]) => (k: string) => keys.includes(k)
  it("uses the walk frame while moving when the character has walk art", () => {
    expect(characterImageKey("elin-B", "e", true, 2, has(["characters/elin-B/walk-east/2"]))).toEqual({ key: "characters/elin-B/walk-east/2", walking: true })
  })
  it("falls back to the still image (and asks for a bob) when moving without walk art", () => {
    expect(characterImageKey("warden-kalas", "n", true, 1, has([]))).toEqual({ key: "characters/warden-kalas/rot-north", walking: false })
  })
  it("uses the still image at rest even if walk art exists", () => {
    expect(characterImageKey("elin-B", "s", false, 0, has(["characters/elin-B/walk-south/0"]))).toEqual({ key: "characters/elin-B/rot-south", walking: false })
  })
})

describe("idleBobPx", () => {
  it("lifts the sprite 2px on odd frames", () => {
    expect([0, 1, 2, 3].map(idleBobPx)).toEqual([0, -2, 0, -2])
  })
})
