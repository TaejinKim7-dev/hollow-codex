import { describe, expect, it } from "vitest"
import { chooseView, combatReservePx, computeViewport, screenToTile, TILE } from "../../../src/render/viewport.ts"

describe("chooseView", () => {
  it("1280×720 gives scale 3 and 13 columns", () => { expect(chooseView({ w: 1280, h: 720 })).toEqual({ scale: 3, viewW: 13, viewH: 7 }) })
  it("a short canvas drops to scale 2 and caps columns at 15", () => { expect(chooseView({ w: 1280, h: 560 })).toEqual({ scale: 2, viewW: 15, viewH: 7 }) })
  it("a tiny canvas still gets scale 2 and at least 7 columns", () => { expect(chooseView({ w: 300, h: 200 })).toEqual({ scale: 2, viewW: 7, viewH: 7 }) })
  it("a huge canvas caps at scale 4 and 15 columns", () => { expect(chooseView({ w: 2560, h: 1440 })).toEqual({ scale: 4, viewW: 15, viewH: 7 }) })
})

describe("computeViewport", () => {
  it("TILE is 32", () => { expect(TILE).toBe(32) })
  it("uses device pixels", () => { expect(computeViewport({ w: 640, h: 360 }, 2, { w: 32, h: 24 }, { x: 0, y: 0 }).scale).toBe(3) })
  it("clamps at the map's top-left corner", () => {
    expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 0, y: 0 }).originTile).toEqual({ x: 0, y: 0 })
  })
  it("clamps at the bottom-right corner", () => {
    const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 31, y: 23 })
    expect(vp.originTile).toEqual({ x: 32 - vp.viewW, y: 24 - vp.viewH })
  })
  it("centres a map smaller than the view", () => {
    const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 8, h: 5 }, { x: 4, y: 2 })
    expect(vp.originTile).toEqual({ x: 0, y: 0 })
    expect(vp.offsetPx).toEqual({ x: Math.floor((1280 - 8 * 32 * 3) / 2), y: Math.floor((720 - 5 * 32 * 3) / 2) })
  })
  it("screenToTile inverts the viewport", () => {
    const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 16, y: 12 })
    const step = TILE * vp.scale
    expect(screenToTile({ x: vp.offsetPx.x + step * 2 + 1, y: vp.offsetPx.y + 1 }, vp)).toEqual({ x: vp.originTile.x + 2, y: vp.originTile.y })
  })
})

describe("combat viewport", () => {
  it("reserves the bottom 17% of the canvas for the HUD: the grid is centred in what is left", () => {
    const canvas = { w: 1280, h: 720 }
    expect(combatReservePx(canvas)).toBe(122)
    const vp = computeViewport(canvas, 1, { w: 7, h: 7 }, { x: 3, y: 3 }, 122)
    expect(vp.scale).toBe(2)   // 598 px left: 7 rows fit at ×2 (448) but not ×3 (672)
    const gridBottom = vp.offsetPx.y + 7 * TILE * vp.scale
    expect(gridBottom).toBeLessThanOrEqual(720 - 122)
    expect(vp.offsetPx.y).toBe(Math.floor((598 - 448) / 2))
  })
  it("without a reserve nothing changes", () => {
    expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 7, h: 7 }, { x: 3, y: 3 })).toEqual(computeViewport({ w: 1280, h: 720 }, 1, { w: 7, h: 7 }, { x: 3, y: 3 }, 0))
  })
})
