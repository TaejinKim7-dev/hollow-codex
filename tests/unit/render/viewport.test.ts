import { describe, expect, it } from "vitest"
import { computeViewport, screenToTile } from "../../../src/render/viewport.ts"

describe("computeViewport", () => {
  it("integer scale for a 1280×720 canvas at dpr 1 is 4", () => {
    expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 16, y: 12 }).scale).toBe(4)
  })
  it("uses device pixels", () => { expect(computeViewport({ w: 640, h: 360 }, 2, { w: 32, h: 24 }, { x: 0, y: 0 }).scale).toBe(4) })
  it("clamps at the map's top-left corner", () => {
    expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 0, y: 0 }).originTile).toEqual({ x: 0, y: 0 })
  })
  it("clamps at the bottom-right corner", () => {
    expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 31, y: 23 }).originTile).toEqual({ x: 17, y: 13 })
  })
  it("never goes below scale 1", () => { expect(computeViewport({ w: 100, h: 80 }, 1, { w: 32, h: 24 }, { x: 0, y: 0 }).scale).toBe(1) })
  it("centres a map smaller than the view", () => {
    const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 12, h: 10 }, { x: 5, y: 5 })
    expect(vp.originTile).toEqual({ x: 0, y: 0 }); expect(vp.offsetPx).toEqual({ x: 256, y: 40 })
  })
  it("screenToTile inverts the viewport", () => {
    const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 16, y: 12 })
    expect(screenToTile({ x: vp.offsetPx.x + 64 * 2 + 1, y: vp.offsetPx.y + 1 }, vp)).toEqual({ x: vp.originTile.x + 2, y: vp.originTile.y })
  })
})