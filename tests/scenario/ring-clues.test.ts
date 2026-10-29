import { describe, expect, it } from "vitest"
import { createInitialState } from "../../src/core/state.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()

describe("ring clues are teachable in the real content", () => {
  it("every ring's fact is granted by some NPC topic (so ring travel can actually be unlocked in play)", () => {
    const granted = new Set<string>()
    for (const npc of Object.values(content.npcs)) for (const lines of Object.values(npc.topics)) for (const v of lines) for (const g of v.grants ?? []) granted.add(g)
    for (const ring of Object.values(content.rings)) expect(granted.has(ring.fact), ring.fact).toBe(true)
    void createInitialState
  })
})
