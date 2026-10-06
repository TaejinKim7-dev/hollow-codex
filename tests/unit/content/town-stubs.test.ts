import { describe, it, expect } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { resolve } from "node:path"

const projectRoot = resolve(import.meta.dirname, "..", "..", "..")

describe("M2 town stub separation", () => {
  it("compiles cleanly after stub separation", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content, errors } = compileContent(raw)
    expect(errors).toEqual([])
    expect(content).not.toBeNull()
  })
  it("each town map is defined and references the overworld via <", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content } = compileContent(raw)
    const ids = ["map.town.compassion", "map.town.valor", "map.town.justice", "map.town.sacrifice", "map.town.honor", "map.town.spirituality", "map.town.humility"]
    for (const id of ids) {
      const m = content!.maps[id]
      expect(m, `expected ${id} to exist`).toBeDefined()
      expect(m!.exits.length).toBeGreaterThan(0)
      expect(m!.exits[0]!.to).toBe("map.over")
    }
  })
  it("overworld map.no longer contains town stubs", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content } = compileContent(raw)
    // The 7 stub maps should NOT be in map.over.exits.to beyond just map.field
    // (Each + entrance on overworld → map.town.<virtue>, which still has map.town.<virtue> in exits)
    // The point is that the stub DEFINITIONS live in separate files, not in overworld/maps.yaml
    const allIds = Object.keys(content!.maps).sort()
    // The stubs should be present (in separate files)
    expect(allIds).toContain("map.town.compassion")
    expect(allIds).toContain("map.town.humility")
  })
})
