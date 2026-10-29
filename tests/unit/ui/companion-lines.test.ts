import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { createInitialState } from "../../../src/core/state.ts"
import { companionLines } from "../../../src/ui/companion-lines.ts"

const { content } = compileContent(loadContentDir("content"))
const c = content!
const companions = Object.entries(c.npcs).filter(([, n]) => n.companion !== undefined).map(([id]) => id)

describe("companion lines", () => {
  it("every story companion (all but the arena trainer) has join, leave and rejoin lines in ko and en", () => {
    const missing: string[] = []
    for (const id of companions.filter((x) => x !== "npc.arena.trainer")) {
      for (const lang of ["ko", "en"] as const) for (const kind of ["join", "leave", "rejoin"]) if (c.strings[lang]?.[`companion.${id}.${kind}`] === undefined) missing.push(`${lang} ${id} ${kind}`)
    }
    expect(missing).toEqual([])
  })
  it("picks join for a first-time recruit, rejoin for a returning companion, leave on departure", () => {
    const id = "npc.valor.sergeant"
    const base = createInitialState(c, 1)
    const joined = [{ type: "companionJoined", npcId: id } as const]
    const first = companionLines(joined, base, c)
    const again = companionLines(joined, { ...base, departed: [id] }, c)
    const left = companionLines([{ type: "companionLeft", npcId: id }], base, c)
    expect(first).toHaveLength(1); expect(again).toHaveLength(1); expect(left).toHaveLength(1)
    expect(new Set([first[0], again[0], left[0]]).size).toBe(3)
    expect(first[0]).not.toContain("⟦")
  })
  it("says nothing for a companion without lines or for other events", () => {
    const base = createInitialState(c, 1)
    expect(companionLines([{ type: "companionJoined", npcId: "npc.arena.trainer" }], base, c)).toEqual([])
    expect(companionLines([{ type: "moved", pos: { x: 0, y: 0 } }], base, c)).toEqual([])
  })
})
