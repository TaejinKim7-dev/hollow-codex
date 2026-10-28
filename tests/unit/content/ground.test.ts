import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { BLOCKER, checkGroundAdjacency, mergeObjectFootprints } from "../../../src/content/ground.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import type { Ground } from "../../../src/content/ground.ts"

type Obj = Record<string, unknown>
const defs = {
  "obj.house": { image: "kalas/house", footprint: [2, 2] as const, blocks: true },
  "obj.bridge": { image: "bridge/bridge", footprint: [1, 1] as const, blocks: false }
}
const rows5 = ["....." , ".....", ".....", ".....", "....."]

describe("mergeObjectFootprints", () => {
  it("turns a blocking footprint into BLOCKER cells, anchored at the bottom-left cell", () => {
    const { rows, errors } = mergeObjectFootprints(rows5, [{ id: "obj.house", at: { x: 2, y: 3 } }], defs)
    expect(errors).toEqual([])
    expect(rows).toEqual(["....." , ".....", `..${BLOCKER}${BLOCKER}.`, `..${BLOCKER}${BLOCKER}.`, "....."])
  })
  it("leaves rows alone for a non-blocking object", () => {
    expect(mergeObjectFootprints(rows5, [{ id: "obj.bridge", at: { x: 1, y: 1 } }], defs).rows).toEqual(rows5)
  })
  it("reports an object that leaves the map", () => {
    const { errors } = mergeObjectFootprints(rows5, [{ id: "obj.house", at: { x: 4, y: 3 } }], defs)
    expect(errors.some((e) => e.includes("outside the map"))).toBe(true)
  })
  it("reports an unknown object id", () => {
    expect(mergeObjectFootprints(rows5, [{ id: "obj.nope", at: { x: 0, y: 0 } }], defs).errors.some((e) => e.includes("obj.nope"))).toBe(true)
  })
})

const g = (s: string[]): (Ground | null)[][] =>
  s.map((r) => [...r].map((c) => ({ g: "grass", p: "path", w: "water", s: "stone", "-": null } as Record<string, Ground | null>)[c] ?? null))

describe("checkGroundAdjacency", () => {
  it("allows grass next to anything", () => { expect(checkGroundAdjacency(g(["gpg", "ggg", "gwg"]), new Set())).toEqual([]) })
  it("rejects path next to water, diagonals included", () => {
    expect(checkGroundAdjacency(g(["pg", "gw"]), new Set())).toEqual(["ground adjacency: path next to water at (0,0)"])
  })
  it("allows it when one of the two cells is exempt (under a bridge)", () => {
    expect(checkGroundAdjacency(g(["pw"]), new Set(["1,0"]))).toEqual([])
  })
  it("ignores cells without ground (legacy sprite tiles)", () => { expect(checkGroundAdjacency(g(["p-w"]), new Set())).toEqual([]) })
})

const raw = () => loadContentDir("tests/fixtures/content-min")
const withTiles = (extra: Obj, objects?: unknown, mapPatch?: Obj) => {
  const base = raw()
  const tiles = { ...(base["tiles.yaml"] as Obj), tiles: { ...((base["tiles.yaml"] as Obj)["tiles"] as Obj), ...extra } }
  const maps = structuredClone(base["towns/min/maps.yaml"] as Obj[])
  Object.assign(maps[0] as Obj, mapPatch ?? {})
  return { ...base, "tiles.yaml": tiles, "towns/min/maps.yaml": maps, ...(objects === undefined ? {} : { "objects.yaml": objects }) }
}

describe("compile: ground and objects", () => {
  it("accepts a ground-only tile and builds the map's ground grid", () => {
    const { content, errors } = compileContent(withTiles({ g: { ground: "grass", walk: 1 } }, undefined, { rows: ["####", "#gg#", "####"] }))
    expect(errors).toEqual([])
    expect(content?.maps["map.min"]?.ground?.[1]).toEqual([null, "grass", "grass", null])
  })
  it("rejects a tile with neither sprite nor ground", () => {
    const { content, errors } = compileContent(withTiles({ g: { walk: 1 } }))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes('tiles."g"'))).toBe(true)
  })
  it("rejects an unknown ground class", () => {
    expect(compileContent(withTiles({ g: { ground: "lava", walk: 1 } })).content).toBeNull()
  })
  it("merges object footprints into rows as walk-blocking BLOCKER cells", () => {
    const objects = [{ id: "obj.rock", image: "kalas/tree-oak", footprint: [1, 1], blocks: true }]
    const { content, errors } = compileContent(withTiles({}, objects, { rows: ["#####", "#...#", "#####"], objects: [{ id: "obj.rock", at: [3, 1] }] }))
    expect(errors).toEqual([])
    expect(content?.maps["map.min"]?.rows[1]).toBe(`#..${BLOCKER}#`)
    expect(content?.tiles[BLOCKER]?.walk).toBeNull()
    expect(content?.objects["obj.rock"]?.footprint).toEqual([1, 1])
  })
  it("fails the build when path touches water", () => {
    const { content, errors } = compileContent(withTiles(
      { p: { ground: "path", walk: 1 }, w: { ground: "water", walk: null } },
      undefined,
      { rows: ["####", "#pw#", "####"] }
    ))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("ground adjacency: path next to water"))).toBe(true)
  })
  it("keeps a legacy sprite-only map without a ground grid", () => {
    expect(compileContent(raw()).content?.maps["map.min"]?.ground).toBeUndefined()
  })
})
