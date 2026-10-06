import { describe, expect, it } from "vitest"
import { availableTopics, pickVariant } from "../../../src/core/dialogue/talk.ts"
import { step } from "../../../src/core/step.ts"
import type { Dir } from "../../../src/core/types.ts"
import { deepFreeze, stateWith, testContent } from "./fixture.ts"

const c = testContent()
const facing = (x: number, y: number, f: Dir) => stateWith({ player: { ...stateWith({}).player, pos: { x, y }, facing: f } })
const talking = deepFreeze({
  ...stateWith({}),
  player: { ...stateWith({}).player, pos: { x: 2, y: 3 }, facing: "e" as Dir },
  dialogue: { npcId: "npc.sage", pendingChoice: null }
})

describe("dialogue", () => {
  it("interact opens a dialogue with the NPC the player faces", () => {
    const r = step(facing(2, 3, "e"), { type: "interact" }, c)
    expect(r.state.dialogue).toEqual({ npcId: "npc.sage", pendingChoice: null })
    expect(r.events).toEqual([{ type: "said", npcId: "npc.sage", textKey: "sage.greet", lie: false }])
  })
  it("interact at an adjacent tile turns the player toward it", () => {
    const r = step(facing(3, 2, "n"), { type: "interact", at: { x: 3, y: 3 } }, c)
    expect(r.state.player.facing).toBe("s"); expect(r.state.dialogue?.npcId).toBe("npc.sage")
    expect(step(facing(1, 1, "n"), { type: "interact", at: { x: 3, y: 3 } }, c).state.dialogue).toBeNull()
  })
  it("interact with nobody there changes nothing", () => {
    const s = facing(1, 1, "e")
    const r = step(s, { type: "interact" }, c)
    expect(r.state).toBe(s); expect(r.events).toEqual([])
    const t = step(s, { type: "interact", at: { x: 1, y: 2 } }, c)
    expect(t.state.player.facing).toBe("s"); expect(t.state.dialogue).toBeNull(); expect(t.events).toEqual([])
  })
  it("asking a topic says its text and grants its facts", () => {
    const r = step(talking, { type: "ask", topic: "job" }, c)
    expect(r.events).toEqual([
      { type: "said", npcId: "npc.sage", textKey: "sage.job", lie: false },
      { type: "factLearned", id: "word.alpha" }, { type: "factLearned", id: "word.decoy" }
    ])
  })
  it('a topic with unmet requires answers with the NPC\'s default "모른다" key', () => {
    const s = deepFreeze({ ...talking, facts: ["word.beta"] })
    expect(step(s, { type: "ask", topic: "word.beta" }, c).events).toEqual([{ type: "said", npcId: "npc.sage", textKey: "npc.default.unknown", lie: false }])
  })
  it("asking about an unknown word is ignored", () => {
    expect(step(talking, { type: "ask", topic: "word.beta" }, c).events).toEqual([])
  })
  it("a known word the NPC has no topic for answers with the default key", () => {
    const s = deepFreeze({ ...talking, facts: ["word.gamma"] })
    expect(step(s, { type: "ask", topic: "word.gamma" }, c).events).toEqual([{ type: "said", npcId: "npc.sage", textKey: "npc.default.unknown", lie: false }])
  })
  it("a lie topic marks the said event lie: true", () => {
    const s = deepFreeze({ ...talking, facts: ["fact.person.sage"] })
    expect(step(s, { type: "ask", topic: "fact.person.sage" }, c).events[0]).toMatchObject({ textKey: "sage.self", lie: true })
  })
  it("a choice topic waits for choose, then records the option's deed", () => {
    const asked = step(deepFreeze({ ...talking, facts: ["word.decoy"] }), { type: "ask", topic: "word.decoy" }, c).state
    expect(asked.dialogue?.pendingChoice).toBe("word.decoy")
    expect(step(asked, { type: "ask", topic: "name" }, c).events).toEqual([])
    const r = step(asked, { type: "choose", optionId: "opt.lie" }, c)
    expect(r.events).toContainEqual({ type: "deed", virtue: "honesty", deed: "deed.lie" })
    expect(r.state.deeds).toEqual([{ virtue: "honesty", deed: "deed.lie", turn: 0 }])
    expect(r.state.flags).toContain("flag.asked"); expect(r.state.dialogue?.pendingChoice).toBeNull()
    expect(step(r.state, { type: "ask", topic: "word.decoy" }, c).events[0]).toMatchObject({ textKey: "sage.asked" })   // excludeFlags → 다음 변형
  })
  it("choose emits said, then facts, then the deed; unknown options are ignored", () => {
    const asked = step(deepFreeze({ ...talking, facts: ["word.decoy"] }), { type: "ask", topic: "word.decoy" }, c).state
    expect(step(asked, { type: "choose", optionId: "opt.nope" }, c)).toEqual({ state: asked, events: [] })
    const h = step(asked, { type: "choose", optionId: "opt.honest" }, c)
    expect(h.events).toEqual([
      { type: "said", npcId: "npc.sage", textKey: "o.h.t", lie: false },
      { type: "factLearned", id: "fact.secret" }
    ])
    expect(h.state.deeds).toEqual([])
    const l = step(asked, { type: "choose", optionId: "opt.lie" }, c)
    expect(l.events).toEqual([
      { type: "said", npcId: "npc.sage", textKey: "o.l.t", lie: false },
      { type: "deed", virtue: "honesty", deed: "deed.lie" }
    ])
  })
  it("choose without a pending choice is ignored", () => {
    expect(step(talking, { type: "choose", optionId: "opt.lie" }, c)).toEqual({ state: talking, events: [] })
  })
  it("movement is ignored while a dialogue is open", () => {
    for (const cmd of [{ type: "move", dir: "n" }, { type: "moveTo", target: { x: 1, y: 1 } }, { type: "interact" }] as const) {
      const r = step(talking, cmd, c)
      expect(r.events).toEqual([]); expect(r.state.player.pos).toEqual({ x: 2, y: 3 })
    }
  })
  it("endTalk closes the dialogue", () => {
    const r = step(talking, { type: "endTalk" }, c)
    expect(r.state.dialogue).toBeNull(); expect(r.events).toEqual([])
  })
  it("availableTopics lists name, job and known word/person/place facts", () => {
    const s = stateWith({ facts: ["fact.person.sage", "fact.secret", "word.alpha"] })
    expect(availableTopics(s, c, "npc.sage")).toEqual(["name", "job", "fact.person.sage", "word.alpha"])
  })
  it("pickVariant takes the first variant whose conditions hold", () => {
    const v = c.npcs["npc.sage"]!.topics["word.decoy"]!
    expect(pickVariant(stateWith({}), v)?.textKey).toBe("sage.ask")
    expect(pickVariant(stateWith({ flags: ["flag.asked"] }), v)?.textKey).toBe("sage.asked")
    const beta = c.npcs["npc.sage"]!.topics["word.beta"]!
    expect(pickVariant(stateWith({}), beta)).toBeNull()
    expect(pickVariant(stateWith({ facts: ["fact.secret"] }), beta)?.textKey).toBe("sage.beta")
    expect(pickVariant(stateWith({}), [{ textKey: "x", requiresFlags: ["f"] }])).toBeNull()
    expect(pickVariant(stateWith({ flags: ["f"] }), [{ textKey: "x", requiresFlags: ["f"] }])?.textKey).toBe("x")
  })
})
