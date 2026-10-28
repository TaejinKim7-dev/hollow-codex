import { describe, expect, it } from "vitest"
import { sortDrawables, type Drawable } from "../../../src/render/layers.ts"

const d = (kind: Drawable["kind"], footX: number, footY: number, id: string): Drawable => ({ kind, footX, footY, id })

describe("sortDrawables", () => {
  it("draws larger footY later", () => {
    expect(sortDrawables([d("npc", 0, 5, "b"), d("npc", 0, 2, "a")]).map((x) => x.id)).toEqual(["a", "b"])
  })
  it("on the same row draws object, then npc, then player", () => {
    expect(sortDrawables([d("player", 0, 3, "p"), d("npc", 0, 3, "n"), d("object", 0, 3, "o")]).map((x) => x.id)).toEqual(["o", "n", "p"])
  })
  it("breaks remaining ties by footX then id", () => {
    expect(sortDrawables([d("npc", 4, 1, "z"), d("npc", 2, 1, "y"), d("npc", 2, 1, "x")]).map((x) => x.id)).toEqual(["x", "y", "z"])
  })
  it("does not mutate its input", () => {
    const input = [d("npc", 0, 5, "b"), d("npc", 0, 2, "a")]
    sortDrawables(input)
    expect(input.map((x) => x.id)).toEqual(["b", "a"])
  })
})
