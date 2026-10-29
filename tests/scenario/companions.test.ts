import { describe, expect, it } from "vitest"
import { startCombat } from "../../src/core/combat/grid.ts"
import { recordDeed } from "../../src/core/virtue/conduct.ts"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import type { GameState } from "../../src/core/types.ts"
import { dialogueView } from "../../src/ui/view-model.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const companions = Object.entries(content.npcs).filter(([, n]) => n.companion !== undefined)

describe("companions in the real content", () => {
  it("every town has one: eight in all (Kalas and the seven virtue towns), plus the arena instructor", () => {
    const virtues = new Set(companions.map(([, n]) => n.companion!.virtue))
    for (const v of ["honesty", "compassion", "valor", "justice", "sacrifice", "honor", "spirituality", "humility"]) expect(virtues.has(v as never), v).toBe(true)
  })
  for (const [id, npc] of companions) {
    it(`${id}: recruitable once its join facts are known, fights in the party, and leaves after ${npc.companion!.leaveAfterDeeds} deeds against its virtue`, () => {
      const c = npc.companion!
      const base = createInitialState(content, 1)
      const without = { ...base, dialogue: { npcId: id, pendingChoice: null } } as GameState
      if (c.joinRequires.length > 0) expect(dialogueView(without, content, [])?.canRecruit, "needs its facts first").toBe(false)
      const talking = { ...without, facts: [...c.joinRequires] } as GameState
      expect(dialogueView(talking, content, [])?.canRecruit).toBe(true)
      const joined = step(talking, { type: "recruit", npcId: id }, content).state
      expect(joined.party).toContain(id)
      const fight = startCombat({ ...joined, dialogue: null }, content, "enc.arena.wolves", { x: 0, y: 0 })
      expect(fight.combat!.units.find((u) => u.id === id)?.hp).toBe(c.hp)
      let s: GameState = joined
      for (let i = 0; i < c.leaveAfterDeeds; i++) s = recordDeed(s, content, c.virtue, `deed.test-${i}`).state
      expect(s.party).not.toContain(id)
      expect(s.departed).toContain(id)
    })
  }
})

describe("companion rejoin conditions are obtainable", () => {
  it("every fact a departed companion needs to rejoin is granted by some topic or crisis choice", () => {
    const content = loadRealContent()
    const granted = new Set<string>()
    for (const npc of Object.values(content.npcs)) for (const lines of Object.values(npc.topics)) for (const v of lines) { for (const g of v.grants ?? []) granted.add(g); for (const ch of v.choice ?? []) for (const g of ch.grants ?? []) granted.add(g) }
    const needs = Object.entries(content.npcs).flatMap(([id, n]) => (n.companion?.rejoinRequires ?? []).map((f) => [id, f] as const))
    expect(needs.length).toBeGreaterThanOrEqual(8)
    for (const [id, fact] of needs) expect(granted.has(fact), `${id} needs ${fact}`).toBe(true)
  })
})
