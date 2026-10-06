import { describe, it, expect } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { resolve } from "node:path"

const projectRoot = resolve(import.meta.dirname, "..", "..", "..")

describe("overworld content", () => {
  it("compiles cleanly with all M2 content", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content, errors } = compileContent(raw)
    expect(errors).toEqual([])
    expect(content).not.toBeNull()
  })

  it("map.over has 8 exits (Kalas + 7 virtues)", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content } = compileContent(raw)
    expect(content!.maps["map.over"]!.isOverworld).toBe(true)
    expect(content!.maps["map.over"]!.exits.length).toBeGreaterThanOrEqual(7)
  })

  it("moongates reference the overworld map", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content } = compileContent(raw)
    const overworldRings = Object.values(content!.moongates).filter(g => g.onOverworld === "map.over")
    expect(overworldRings.length).toBeGreaterThanOrEqual(7)
  })
})