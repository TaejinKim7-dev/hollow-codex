import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { missingCharacterSprites } from "../../../src/content/sprites-check.ts"

type Obj = Record<string, unknown>
const raw = () => loadContentDir("tests/fixtures/content-min")
const withSprite = (sprite: unknown) => {
  const npcs = structuredClone(raw()["towns/min/npcs.yaml"] as Obj[])
  ;(npcs[0] as Obj)["sprite"] = sprite
  return { ...raw(), "towns/min/npcs.yaml": npcs }
}

describe("char sprite refs", () => {
  it("accepts char.<name> and keeps the legacy [sheet, index] form", () => {
    const a = compileContent(withSprite("char.warden-kalas"))
    expect(a.errors).toEqual([])
    expect(a.content?.npcs["npc.min.sage"]?.sprite).toEqual({ char: "warden-kalas" })
    const b = compileContent(withSprite(["test", 3]))
    expect(b.content?.npcs["npc.min.sage"]?.sprite).toEqual({ sheet: "test", index: 3 })
  })
  it("rejects a malformed char reference", () => {
    const { content, errors } = compileContent(withSprite("char."))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("sprite"))).toBe(true)
  })
  it("reads an optional per-sheet tile size, default 16", () => {
    const { content } = compileContent(raw())
    expect(content?.sheets["test"]?.tile).toBe(16)
  })
  it("lists character sprites whose folder does not exist", () => {
    const { content } = compileContent(withSprite("char.nobody"))
    expect(missingCharacterSprites(content!, (name) => name === "warden-kalas")).toEqual(["npc.min.sage: char.nobody"])
    const ok = compileContent(withSprite("char.warden-kalas"))
    expect(missingCharacterSprites(ok.content!, (name) => name === "warden-kalas")).toEqual([])
  })
})
