import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { loadMapAssets, mapAssetPrefixes, normalizeGlobKeys } from "../../../src/render/assets.ts"

type Obj = Record<string, unknown>
function content() {
  const base = loadContentDir("tests/fixtures/content-min")
  const tiles = base["tiles.yaml"] as Obj
  const patched = {
    ...base,
    "tiles.yaml": {
      ...tiles,
      player: "char.stranger-B-navy",
      tiles: {
        ...(tiles["tiles"] as Obj),
        g: { ground: "grass", walk: 1 }, p: { ground: "path", walk: 1 }, w: { ground: "water", walk: null },
        T: { ground: "grass", walk: null, object: "obj.tree" }
      }
    },
    "objects.yaml": [{ id: "obj.tree", image: "kalas/tree-oak", footprint: [1, 1], blocks: true }, { id: "obj.house", image: "kalas/house", footprint: [2, 2], blocks: true }],
    "towns/min/maps.yaml": [{ id: "map.min", rows: ["########", "#gggTpg#", "#gwwggg#", "#gggggg#", "########"], exits: [], music: "music.min", objects: [{ id: "obj.house", at: [5, 3] }] }],
    "towns/min/npcs.yaml": (() => { const n = structuredClone(base["towns/min/npcs.yaml"] as Obj[]); (n[0] as Obj)["sprite"] = "char.warden-kalas"; return n })()
  }
  const { content: c, errors } = compileContent(patched)
  expect(errors).toEqual([])
  return c!
}

describe("mapAssetPrefixes", () => {
  it("lists tilesets for the grounds used, objects (placed and per-tile), and characters, once each, sorted", () => {
    expect(mapAssetPrefixes(content(), "map.min")).toEqual([
      "characters/stranger-B-navy/",
      "characters/warden-kalas/",
      "objects/kalas/house",
      "objects/kalas/tree-oak",
      "tilesets/grass-path-v3/",
      "tilesets/grass-water/"
    ])
  })
})

describe("normalizeGlobKeys", () => {
  it("keys urls by path under assets/sprites without extension", () => {
    const m = normalizeGlobKeys({ "../../assets/sprites/objects/kalas/house.png": "/h.png" })
    expect(m.get("objects/kalas/house")).toBe("/h.png")
  })
})

class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ""
  set src(v: string) { this._src = v; setTimeout(() => (v.includes("bad") ? this.onerror?.() : this.onload?.()), 0) }
  get src(): string { return this._src }
}

describe("loadMapAssets", () => {
  const urls = new Map([
    ["objects/kalas/house", "/house.png"],
    ["characters/a/rot-south", "/a-south.png"],
    ["characters/a/rot-north", "/a-bad.png"],
    ["characters/b/rot-south", "/b-south.png"]
  ])
  it("loads every file under the prefixes and keeps the ones that loaded; a failing file never throws", async () => {
    const out = await loadMapAssets(urls, ["objects/kalas/house", "characters/a/"], () => new FakeImage() as unknown as HTMLImageElement)
    expect([...out.keys()].sort()).toEqual(["characters/a/rot-south", "objects/kalas/house"])
  })
  it("returns an empty map when nothing matches", async () => {
    expect((await loadMapAssets(urls, ["nope/"], () => new FakeImage() as unknown as HTMLImageElement)).size).toBe(0)
  })
})
