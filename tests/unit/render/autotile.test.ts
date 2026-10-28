import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { Ground } from "../../../src/content/ground.ts"
import { overlayTiles, pickWang, type WangTable } from "../../../src/render/autotile.ts"

const table: WangTable = {
  "0000": { col: 0, row: 0 }, "1000": { col: 1, row: 0 }, "0100": { col: 2, row: 0 }, "0010": { col: 3, row: 0 }, "0001": { col: 0, row: 1 },
  "1100": { col: 1, row: 1 }, "0011": { col: 2, row: 1 }, "1010": { col: 3, row: 1 }, "0101": { col: 0, row: 2 }, "1111": { col: 1, row: 2 }
}
const grid = (rows: string[]): (Ground | null)[][] => rows.map((r) => [...r].map((c) => (c === "p" ? "path" : c === "g" ? "grass" : null)))

describe("pickWang", () => {
  it("returns null when no corner is the overlay ground", () => { expect(pickWang(table, [false, false, false, false])).toBeNull() })
  it("looks up the corner pattern NW,NE,SW,SE", () => {
    expect(pickWang(table, [true, false, false, false])).toEqual({ col: 1, row: 0 })
    expect(pickWang(table, [false, false, true, true])).toEqual({ col: 2, row: 1 })
    expect(pickWang(table, [true, true, true, true])).toEqual({ col: 1, row: 2 })
  })
})

describe("overlayTiles", () => {
  it("a single path cell in the middle gets four corner tiles, one per surrounding vertex", () => {
    const tiles = overlayTiles(grid(["ggg", "gpg", "ggg"]), "path", table)
    expect(tiles.map((t) => `${t.vx},${t.vy}`).sort()).toEqual(["1,1", "1,2", "2,1", "2,2"])
    const at = (vx: number, vy: number) => tiles.find((t) => t.vx === vx && t.vy === vy)
    expect(at(1, 1)).toMatchObject({ col: 0, row: 1 })   // the path is this vertex's SE corner
    expect(at(2, 1)).toMatchObject({ col: 3, row: 0 })   // SW
    expect(at(1, 2)).toMatchObject({ col: 2, row: 0 })   // NE
    expect(at(2, 2)).toMatchObject({ col: 1, row: 0 })   // NW
  })
  it("treats cells outside the map as the nearest edge cell, so an edge path keeps going", () => {
    const tiles = overlayTiles(grid(["p"]), "path", table)
    expect(tiles.map((t) => `${t.vx},${t.vy}`).sort()).toEqual(["0,0", "0,1", "1,0", "1,1"])
    expect(tiles.every((t) => t.col === 1 && t.row === 2)).toBe(true)
  })
  it("ignores cells of other ground and legacy null cells", () => {
    expect(overlayTiles(grid(["ggg", "g.g", "ggg"]), "path", table)).toEqual([])
  })
})

describe("generated tables", () => {
  for (const id of ["grass-path-v3", "grass-water"]) {
    it(`${id}/autotile.json covers all 16 corner patterns inside the 4×4 sheet`, () => {
      const t = JSON.parse(readFileSync(`assets/sprites/tilesets/${id}/autotile.json`, "utf8")) as WangTable
      const keys = Object.keys(t).sort()
      expect(keys).toHaveLength(16)
      for (let i = 0; i < 16; i++) expect(keys).toContain(i.toString(2).padStart(4, "0"))
      const cells = new Set(Object.values(t).map((c) => `${c.col},${c.row}`))
      expect(cells.size).toBe(16)
      for (const c of Object.values(t)) { expect(c.col).toBeGreaterThanOrEqual(0); expect(c.col).toBeLessThan(4); expect(c.row).toBeGreaterThanOrEqual(0); expect(c.row).toBeLessThan(4) }
    })
  }
})
