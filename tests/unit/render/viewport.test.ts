import { describe, expect, it } from "vitest"
import { cameraShiftPx, chooseView, combatReservePx, computeViewport, screenToTile, TILE } from "../../../src/render/viewport.ts"

describe("chooseView (the view covers the whole canvas: columns/rows round UP, edge cells are cut)", () => {
  it("1280×720 gives scale 3, 14 columns and 8 rows", () => { expect(chooseView({ w: 1280, h: 720 })).toEqual({ scale: 3, viewW: 14, viewH: 8 }) })
  it("a short canvas drops to scale 2", () => { expect(chooseView({ w: 1280, h: 560 })).toEqual({ scale: 2, viewW: 20, viewH: 9 }) })
  it("a tiny canvas still gets scale 2 and at least 7 columns and rows", () => { expect(chooseView({ w: 300, h: 200 })).toEqual({ scale: 2, viewW: 7, viewH: 7 }) })
  it("a huge canvas caps the scale at 4", () => { expect(chooseView({ w: 2560, h: 1440 })).toEqual({ scale: 4, viewW: 20, viewH: 12 }) })
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

describe("no black bars on a map larger than the view", () => {
  it("2000×1214: the drawn cells cover the whole canvas and the overflow is split evenly", () => {
    const vp = computeViewport({ w: 2000, h: 1214 }, 1, { w: 24, h: 16 }, { x: 12, y: 8 })
    const size = TILE * vp.scale
    expect(vp.viewW * size).toBeGreaterThanOrEqual(2000)
    expect(vp.viewH * size).toBeGreaterThanOrEqual(1214)
    expect(vp.offsetPx.x).toBeLessThanOrEqual(0)
    expect(vp.offsetPx.y).toBeLessThanOrEqual(0)
    expect(vp.offsetPx.y).toBe(Math.floor((1214 - vp.viewH * size) / 2))
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
  it("portrait screens reserve 25% (the HUD stacks taller there)", () => {
    expect(combatReservePx({ w: 390, h: 844 })).toBe(211)
  })
  it("the whole grid always fits: the scale drops until the grid is inside the canvas (width and height)", () => {
    const canvas = { w: 390, h: 844 }
    const vp = computeViewport(canvas, 1, { w: 7, h: 7 }, { x: 3, y: 3 }, combatReservePx(canvas), { w: 7, h: 7 })
    expect(vp.scale).toBe(1)                                   // 390 px wide holds 7 cells only at ×1 (224 px)
    expect(vp.offsetPx.x).toBe(Math.floor((390 - 7 * TILE) / 2))
    expect(vp.offsetPx.y + 7 * TILE).toBeLessThanOrEqual(844 - 211)
  })
  it("a phone's real canvas (3× pixel ratio) gets the big scale and the grid still fits", () => {
    const canvas = { w: 1170, h: 2532 }
    const vp = computeViewport(canvas, 1, { w: 7, h: 7 }, { x: 3, y: 3 }, combatReservePx(canvas), { w: 7, h: 7 })
    expect(vp.scale).toBe(4)
    expect(vp.offsetPx.x).toBeGreaterThanOrEqual(0)
    expect(vp.offsetPx.y + 7 * TILE * 4).toBeLessThanOrEqual(2532 - combatReservePx(canvas))
  })
  it("without a reserve nothing changes", () => {
    expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 7, h: 7 }, { x: 3, y: 3 })).toEqual(computeViewport({ w: 1280, h: 720 }, 1, { w: 7, h: 7 }, { x: 3, y: 3 }, 0))
  })
})

describe("cameraShiftPx (the world slides with the interpolated camera, clamped like the real one)", () => {
  const canvas = { w: 1280, h: 720 }
  it("one cell behind in open space shifts the world by one cell", () => {
    const vp = computeViewport(canvas, 1, { w: 32, h: 24 }, { x: 16, y: 12 })
    expect(cameraShiftPx(vp, { w: 32, h: 24 }, { x: 15, y: 12 })).toEqual({ x: TILE * vp.scale, y: 0 })
  })
  it("does not shift when the camera is pinned at the map edge", () => {
    const vp = computeViewport(canvas, 1, { w: 32, h: 24 }, { x: 1, y: 12 })
    expect(cameraShiftPx(vp, { w: 32, h: 24 }, { x: 0.5, y: 12 })).toEqual({ x: 0, y: 0 })
  })
  it("does not shift when the map is narrower than the view", () => {
    const vp = computeViewport(canvas, 1, { w: 8, h: 5 }, { x: 4, y: 2 })
    expect(cameraShiftPx(vp, { w: 8, h: 5 }, { x: 3, y: 2 })).toEqual({ x: 0, y: 0 })
  })
  it("is zero at rest", () => {
    const vp = computeViewport(canvas, 1, { w: 32, h: 24 }, { x: 16, y: 12 })
    expect(cameraShiftPx(vp, { w: 32, h: 24 }, { x: 16, y: 12 })).toEqual({ x: 0, y: 0 })
  })
})
