import { describe, expect, it } from "vitest"
import { learn } from "../../../src/core/knowledge/notebook.ts"
import { run, stateWith, testContent } from "./fixture.ts"
import type { GameContent } from "../../../src/content/types.ts"

const c = (): GameContent => ({
  ...testContent(),
  moongates: {
    "ring.alpha": { at: { x: 0, y: 0 }, nameKey: "ring.alpha.name", songKey: "ring.alpha.song", fact: "fact.alpha", onOverworld: "map.a" },
    "ring.beta": { at: { x: 5, y: 5 }, nameKey: "ring.beta.name", songKey: "ring.beta.song", fact: "fact.beta", onOverworld: "map.a" },
    "ring.alt": { at: { x: 2, y: 2 }, nameKey: "ring.alt.name", songKey: "ring.alt.song", fact: "fact.alpha", onOverworld: "map.a" }  // shares fact
  },
  facts: {
    ...testContent().facts,
    "fact.alpha": { kind: "song", labelKey: "fact.alpha.label", hintKey: "fact.alpha.hint" },
    "fact.beta": { kind: "song", labelKey: "fact.beta.label", hintKey: "fact.beta.hint" }
  }
})

/** 대화를 거쳐 fact.alpha를 실제로 배우는 콘텐츠 (name 칩이 fact.alpha를 부여). */
const dialogueC = (): GameContent => {
  const base = c()
  const sage = base.npcs["npc.sage"]!
  return {
    ...base,
    npcs: {
      ...base.npcs,
      "npc.sage": { ...sage, topics: { ...sage.topics, name: [{ textKey: "sage.name", grants: ["fact.alpha"] }] } }
    }
  }
}

describe("ring state", () => {
  it("auto-unlocks rings when their fact is learned", () => {
    const s = stateWith({ facts: [], rings: { visited: [], knownFacts: [] } })
    const result = learn(s, ["fact.alpha"], c())
    expect(result.state.rings.knownFacts).toContain("fact.alpha")
    expect(result.events.filter(e => e.type === "ringUnlocked").length).toBeGreaterThan(0)
  })
  it("does not emit ringUnlocked for a fact with no associated ring", () => {
    const s = stateWith({})
    const result = learn(s, ["fact.secret"], c())
    expect(result.events).toContainEqual({ type: "factLearned", id: "fact.secret" })
    expect(result.events.filter(e => e.type === "ringUnlocked")).toHaveLength(0)
    expect(result.state.rings.knownFacts).toEqual([])
  })
  it("ringUnlocked event references the first matching ring", () => {
    const s = stateWith({})
    const result = learn(s, ["fact.alpha"], c())
    const evt = result.events.find(e => e.type === "ringUnlocked")
    expect(evt).toEqual({ type: "ringUnlocked", ringId: "ring.alpha", fact: "fact.alpha" })
  })
  it("knownFacts remains sorted and deduped after multiple unlocks", () => {
    const s = stateWith({ facts: [], rings: { visited: [], knownFacts: [] } })
    const first = learn(s, ["fact.beta"], c())
    const second = learn(first.state, ["fact.beta", "fact.alpha"], c())
    expect(second.state.facts).toEqual(["fact.alpha", "fact.beta"])
    expect(second.state.rings.knownFacts).toEqual(["fact.alpha", "fact.beta"])
    expect(second.events.filter(e => e.type === "ringUnlocked")).toEqual([
      { type: "ringUnlocked", ringId: "ring.alpha", fact: "fact.alpha" }
    ])
  })
  it("a fact already learned does not re-unlock (no ringUnlocked, no state change)", () => {
    const s = stateWith({ facts: ["fact.alpha"], rings: { visited: [], knownFacts: [] } })
    const result = learn(s, ["fact.alpha"], c())
    expect(result.state).toBe(s)
    expect(result.events).toEqual([])
    expect(result.state.rings.knownFacts).toEqual([])
  })
  it("fact already in knownFacts does not emit ringUnlocked again", () => {
    const s = stateWith({ facts: [], rings: { visited: [], knownFacts: ["fact.alpha"] } })
    const result = learn(s, ["fact.alpha"], c())
    expect(result.state.rings.knownFacts).toEqual(["fact.alpha"])
    expect(result.events.filter(e => e.type === "ringUnlocked")).toHaveLength(0)
  })
  it("learning through the dialogue command also unlocks the ring", () => {
    const s = stateWith({ player: { ...stateWith({}).player, pos: { x: 3, y: 2 } } })
    const result = run(s, [{ type: "interact" }, { type: "ask", topic: "name" }], dialogueC())
    expect(result.state.rings.knownFacts).toContain("fact.alpha")
    expect(result.events).toContainEqual({ type: "ringUnlocked", ringId: "ring.alpha", fact: "fact.alpha" })
  })
})