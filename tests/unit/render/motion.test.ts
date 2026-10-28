import { describe, expect, it } from "vitest"
import { createMotion, WALK_MS } from "../../../src/render/motion.ts"

describe("RenderMotion", () => {
  it("starts at rest on its cell", () => {
    expect(createMotion({ x: 5, y: 5 }, "s").sample(0)).toEqual({ x: 5, y: 5, moving: false, frame: 0, dir: "s" })
  })
  it("interpolates a move over WALK_MS and then rests on the new cell", () => {
    expect(WALK_MS).toBe(130)
    const m = createMotion({ x: 5, y: 5 }, "s").onMoved({ x: 6, y: 5 }, "e", 1000)
    expect(m.sample(1000)).toMatchObject({ x: 5, moving: true, dir: "e" })
    expect(m.sample(1065)).toMatchObject({ x: 5.5, moving: true })
    expect(m.sample(1130)).toMatchObject({ x: 6, y: 5, moving: false, dir: "e" })
    expect(m.sample(5000)).toMatchObject({ x: 6, moving: false })
  })
  it("a new move mid-step starts from the previous end cell and never steps back", () => {
    const m = createMotion({ x: 5, y: 5 }, "s").onMoved({ x: 6, y: 5 }, "e", 1000).onMoved({ x: 7, y: 5 }, "e", 1060)
    expect(m.sample(1060).x).toBe(6)
    expect(m.sample(1125).x).toBeGreaterThan(6)
    expect(m.sample(1190)).toMatchObject({ x: 7, moving: false })
  })
  it("teleport jumps without interpolation", () => {
    const m = createMotion({ x: 5, y: 5 }, "s").onMoved({ x: 6, y: 5 }, "e", 1000).onTeleport({ x: 1, y: 2 }, "n")
    expect(m.sample(1010)).toEqual({ x: 1, y: 2, moving: false, frame: 0, dir: "n" })
  })
  it("alternates the walk frame every 65 ms while moving", () => {
    const m = createMotion({ x: 0, y: 0 }, "s").onMoved({ x: 1, y: 0 }, "e", 0)
    expect(m.sample(10).frame).toBe(0)
    expect(m.sample(70).frame).toBe(1)
  })
  it("does not mutate the previous motion", () => {
    const a = createMotion({ x: 0, y: 0 }, "s")
    a.onMoved({ x: 1, y: 0 }, "e", 0)
    expect(a.sample(0).x).toBe(0)
  })
})
