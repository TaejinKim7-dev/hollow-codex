import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import type { GameContent } from "../../../src/content/types.ts"
import { findPath, offset } from "../../../src/core/world/path.ts"
import { testContent } from "./fixture.ts"

/** D20 오버월드 지도: terrainCost(비용)· isOverworld. `T`와 `#`는 통행 불가, `.`·`+`는 비용 1. */
const overworldContent = (): GameContent => {
  const c = testContent()
  return {
    ...c,
    // `T`·`+`·`~` 타일은 walk 1로 두고, 오버월드 비용은 terrainCost가 정한다
    // (T=null 통행 불가, ~=100 비싼 길). 그래야 기존 BFS와 정말로 갈린다.
    tiles: {
      ...c.tiles,
      T: { sprite: { sheet: "t", index: 0 }, walk: 1 },
      "+": { sprite: { sheet: "t", index: 1 }, walk: 1 },
      "~": { sprite: { sheet: "t", index: 1 }, walk: 1 }
    },
    maps: {
      ...c.maps,
      "map.over": {
        rows: ["..##.", "...#.", "#....", "..T..", "+++++"],
        terrainCost: { ".": 1, T: null, "#": null, "+": 1 },
        isOverworld: true,
        exits: [{ at: { x: 0, y: 4 }, to: "map.b", arrive: { x: 1, y: 1 } }],
        music: "music.a",
        encounters: [],
        enterFlags: [],
        heals: false
      },
      // `~`는 비용 100 — 싸게 돌아가는 4칸 경로가 직진(101)보다 낫다.
      "map.weight": {
        rows: [".~.", "..."],
        terrainCost: { ".": 1, "~": 100 },
        isOverworld: true,
        exits: [],
        music: "music.a",
        encounters: [],
        enterFlags: [],
        heals: false
      }
    }
  }
}

describe("findPath on overworld", () => {
  it("treats a terrainCost null glyph (T) as impassable", () => {
    expect(findPath(overworldContent(), "map.over", { x: 1, y: 3 }, { x: 2, y: 3 }, () => false)).toBeNull()
  })
  it("walks at cost 1 around overworld obstacles", () => {
    const path = findPath(overworldContent(), "map.over", { x: 0, y: 0 }, { x: 4, y: 0 }, () => false)
    expect(path).not.toBeNull()
    expect(path!.length).toBe(8)
  })
  it("never steps on impassable terrain", () => {
    const c = overworldContent()
    const rows = c.maps["map.over"]!.rows
    const path = findPath(c, "map.over", { x: 0, y: 0 }, { x: 4, y: 4 }, () => false)
    expect(path).not.toBeNull()
    let pos = { x: 0, y: 0 }
    for (const dir of path!) {
      pos = offset(pos, dir)
      expect(rows[pos.y]![pos.x]).not.toBe("#")
      expect(rows[pos.y]![pos.x]).not.toBe("T")
    }
    expect(pos).toEqual({ x: 4, y: 4 })
  })
  it("pays terrain cost and prefers a longer cheap route", () => {
    expect(findPath(overworldContent(), "map.weight", { x: 0, y: 0 }, { x: 2, y: 0 }, () => false)).toEqual(["s", "e", "e", "n"])
  })
})

describe("compile overworld and ring validation", () => {
  const raw = () => loadContentDir("tests/fixtures/content-min")
  const withFile = (path: string, value: unknown) => ({ ...raw(), [path]: value })
  type Obj = Record<string, unknown>
  const overworldMap = (patch: Obj = {}): Obj => ({
    id: "map.over", rows: ["....."], terrainCost: { ".": 1 }, isOverworld: true,
    exits: [{ at: [0, 0], to: "map.min", arrive: [1, 1] }], music: "music.min", ...patch
  })
  const mapsWith = (extra: Obj[]): Obj[] => [...(raw()["towns/min/maps.yaml"] as Obj[]), ...extra]
  const rings = (patch: Obj = {}): Obj[] => [
    { id: "ring.a", at: [0, 0], name: "ring.a.name", song: "ring.a.song", fact: "fact.min.person", onOverworld: "map.min", ...patch }
  ]

  it("compiles a valid ring", () => {
    const { content, errors } = compileContent(withFile("rings.yaml", rings()))
    expect(errors).toEqual([])
    expect(content?.rings["ring.a"]).toEqual({
      at: { x: 0, y: 0 }, nameKey: "ring.a.name", songKey: "ring.a.song", fact: "fact.min.person", onOverworld: "map.min"
    })
  })
  it("rejects an overworld map without terrainCost", () => {
    const m = overworldMap()
    delete m["terrainCost"]
    const { content, errors } = compileContent(withFile("towns/min/maps.yaml", mapsWith([m])))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("map.over") && e.includes("terrainCost"))).toBe(true)
  })
  it("rejects an overworld map without exits", () => {
    const { content, errors } = compileContent(withFile("towns/min/maps.yaml", mapsWith([overworldMap({ exits: [] })])))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("map.over") && e.includes("exits"))).toBe(true)
  })
  it("rejects a non-ASCII terrainCost glyph", () => {
    const { content, errors } = compileContent(withFile("towns/min/maps.yaml", mapsWith([overworldMap({ terrainCost: { 한: 1 } })])))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("terrainCost") && e.includes("ASCII"))).toBe(true)
  })
  it("rejects a ring with an unknown onOverworld map", () => {
    const { content, errors } = compileContent(withFile("rings.yaml", rings({ onOverworld: "map.nonexistent" })))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("ring.a") && e.includes("map.nonexistent"))).toBe(true)
  })
  it("rejects a ring whose fact is not in content", () => {
    const { content, errors } = compileContent(withFile("rings.yaml", rings({ fact: "fact.missing" })))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("ring.a") && e.includes("fact.missing"))).toBe(true)
  })
})