import { describe, expect, it } from "vitest"
import type { GameState, Id } from "../../../src/core/types.ts"
import { step } from "../../../src/core/step.ts"
import { learn, openHints } from "../../../src/core/knowledge/notebook.ts"
import { run, stateWith, testContent } from "./fixture.ts"

const c = testContent()
const words = ["word.alpha", "word.beta", "word.gamma", "word.decoy"]
const fill = (s: GameState, slot: number, word: Id | null) => step(s, { type: "fillSlot", deductionId: "deduction.test", slot, word }, c)
const knowing = stateWith({ facts: [...words].sort() })

describe("notebook", () => {
  it("learning a fact twice emits one factLearned", () => {
    const once = learn(stateWith({}), ["word.alpha"])
    expect(once.events).toEqual([{ type: "factLearned", id: "word.alpha" }])
    expect(learn(once.state, ["word.alpha"]).events).toEqual([])
  })
  it("learn keeps facts sorted and returns the same state when nothing is new", () => {
    const r = learn(stateWith({ facts: ["word.beta"] }), ["word.gamma", "word.alpha", "word.gamma"])
    expect(r.state.facts).toEqual(["word.alpha", "word.beta", "word.gamma"])
    expect(r.events).toEqual([{ type: "factLearned", id: "word.gamma" }, { type: "factLearned", id: "word.alpha" }])
    const s = stateWith({ facts: ["word.alpha"] })
    expect(learn(s, ["word.alpha"]).state).toBe(s)
  })
  it("a deduction confirms only when all three slots match the answer", () => {
    const r = run(knowing, [0, 1, 2].map((i) => ({ type: "fillSlot", deductionId: "deduction.test", slot: i, word: ["word.alpha", "word.beta", "word.gamma"][i]! })))
    expect(r.state.deductions["deduction.test"]?.confirmed).toBe(true)
    expect(r.events).toContainEqual({ type: "deductionConfirmed", id: "deduction.test" })
    expect(r.events).toContainEqual({ type: "abilityUnlocked", id: "ability.see-lies" })
    expect(r.events).toContainEqual({ type: "sfx", name: "confirm" })
    expect(r.state.abilities).toEqual(["ability.see-lies"])
  })
  it("fillSlot is also valid during dialogue", () => {
    const talking = stateWith({ facts: [...words].sort(), dialogue: { npcId: "npc.sage", pendingChoice: null } })
    expect(fill(talking, 0, "word.alpha").state.deductions["deduction.test"]?.slots[0]).toBe("word.alpha")
  })
  it("an already-unlocked ability is not announced again", () => {
    const s = stateWith({ facts: [...words].sort(), abilities: ["ability.see-lies"], deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", null], confirmed: false } } })
    const r = fill(s, 2, "word.gamma")
    expect(r.events.some((e) => e.type === "abilityUnlocked")).toBe(false)
    expect(r.events).toContainEqual({ type: "deductionConfirmed", id: "deduction.test" })
    expect(r.state.abilities).toEqual(["ability.see-lies"])
  })
  it("two correct slots give no confirmation and no signal", () => {
    const r = run(knowing, [
      { type: "fillSlot", deductionId: "deduction.test", slot: 0, word: "word.alpha" },
      { type: "fillSlot", deductionId: "deduction.test", slot: 1, word: "word.beta" },
      { type: "fillSlot", deductionId: "deduction.test", slot: 2, word: "word.decoy" }
    ])
    expect(r.events).toEqual([])
    expect(Object.keys(r.state.deductions["deduction.test"]!)).toEqual(["slots", "confirmed"])
    expect(r.state.deductions["deduction.test"]).toEqual({ slots: ["word.alpha", "word.beta", "word.decoy"], confirmed: false })
  })
  it("same word in two slots never confirms unless the answer says so", () => {
    const r = run(knowing, [0, 1, 2].map((slot) => ({ type: "fillSlot", deductionId: "deduction.test", slot, word: "word.alpha" })))
    expect(r.state.deductions["deduction.test"]?.confirmed).toBe(false)
    const same = { ...c, deductions: { ...c.deductions, "deduction.test": { ...c.deductions["deduction.test"]!, answer: ["word.alpha", "word.alpha", "word.alpha"] as const } } }
    let s: GameState = knowing
    for (const slot of [0, 1, 2]) s = step(s, { type: "fillSlot", deductionId: "deduction.test", slot, word: "word.alpha" }, same).state
    expect(s.deductions["deduction.test"]?.confirmed).toBe(true)
  })
  it("filling a slot with an unknown word is ignored", () => {
    const r = fill(stateWith({}), 0, "word.alpha")
    expect(r.events).toEqual([]); expect(r.state.deductions["deduction.test"]?.slots).toEqual([null, null, null])
  })
  it("a non-word fact or a bad slot index is ignored", () => {
    const s = stateWith({ facts: ["fact.secret", "word.alpha"] })
    expect(fill(s, 0, "fact.secret").state.deductions["deduction.test"]?.slots[0]).toBeNull()
    expect(fill(s, 3, "word.alpha").state).toBe(s)
    expect(fill(s, -1, "word.alpha").state).toBe(s)
    expect(fill(s, 0.5, "word.alpha").state).toBe(s)
  })
  it("an unknown deduction is ignored", () => {
    const r = step(knowing, { type: "fillSlot", deductionId: "deduction.nope", slot: 0, word: "word.alpha" }, c)
    expect(r.state).toBe(knowing); expect(r.events).toEqual([])
  })
  it("a null word clears a slot", () => {
    const s = fill(knowing, 1, "word.beta").state
    expect(fill(s, 1, null).state.deductions["deduction.test"]?.slots).toEqual([null, null, null])
  })
  it("a confirmed deduction cannot be changed", () => {
    const done = stateWith({ facts: [...words].sort(), deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } })
    expect(fill(done, 0, null).state).toBe(done)
  })
  it("openHints lists the missing facts for a locked crisis option", () => {
    expect(openHints(stateWith({}), c)).toContainEqual({ targetId: "opt.a", missing: ["fact.secret"] })
    expect(openHints(stateWith({}), c)).toContainEqual({ targetId: "opt.b", missing: ["deduction.test"] })
    expect(openHints(stateWith({ facts: ["fact.secret"] }), c).some((h) => h.targetId === "opt.a")).toBe(false)
  })
  it("openHints drops a crisis option once it is unlocked or the crisis is solved", () => {
    const done = stateWith({ deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } })
    expect(openHints(done, c).some((h) => h.targetId === "opt.b")).toBe(false)
    const solved = stateWith({ crises: { "crisis.test": "opt.a" } })
    expect(openHints(solved, c).some((h) => h.targetId === "opt.a" || h.targetId === "opt.b")).toBe(false)
  })
  it("openHints lists a locked topic only when its key is known, and never answer words", () => {
    expect(openHints(stateWith({}), c).some((h) => h.targetId === "npc.sage:word.beta")).toBe(false)
    expect(openHints(stateWith({ facts: ["word.beta"] }), c)).toContainEqual({ targetId: "npc.sage:word.beta", missing: ["fact.secret"] })
    const all = openHints(stateWith({}), c).flatMap((h) => h.missing)
    expect(all).not.toContain("word.gamma")
  })
  it("openHints skips a topic once any variant is open, and is sorted by targetId", () => {
    expect(openHints(stateWith({ facts: ["word.beta", "fact.secret"] }), c).some((h) => h.targetId === "npc.sage:word.beta")).toBe(false)
    const ids = openHints(stateWith({ facts: ["word.beta"] }), c).map((h) => h.targetId)
    expect(ids).toEqual([...ids].sort())
  })
})
