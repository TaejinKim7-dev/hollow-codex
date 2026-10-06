import { describe, expect, it } from "vitest"
import { crisisOptions } from "../../../src/core/crisis/crisis.ts"
import { step } from "../../../src/core/step.ts"
import type { GameState } from "../../../src/core/types.ts"
import { deepFreeze, stateWith, testContent } from "./fixture.ts"

const c = testContent()
const atSage = (patch: Partial<GameState>) =>
  deepFreeze({ ...stateWith(patch), dialogue: { npcId: "npc.sage", pendingChoice: null } })
const resolve = (s: GameState, optionId: string) =>
  step(s, { type: "resolveCrisis", crisisId: "crisis.test", optionId }, c)

describe("town crisis", () => {
  it("an option is available only when its facts and deductions are met", () => {
    expect(crisisOptions(stateWith({}), c, "crisis.test")).toEqual([
      { optionId: "opt.a", available: false, missing: ["fact.secret"] },
      { optionId: "opt.b", available: false, missing: ["deduction.test"] }
    ])
    const done = stateWith({ facts: ["fact.secret"], deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } })
    expect(crisisOptions(done, c, "crisis.test").every((o) => o.available)).toBe(true)
  })
  it("resolving sets the option's flags and emits crisisResolved", () => {
    const r = resolve(atSage({ facts: ["fact.secret"] }), "opt.a")
    expect(r.state.crises).toEqual({ "crisis.test": "opt.a" }); expect(r.state.flags).toContain("flag.a")
    expect(r.events).toEqual([
      { type: "said", npcId: "npc.sage", textKey: "opt.a.text", lie: false },
      { type: "crisisResolved", crisisId: "crisis.test", optionId: "opt.a" }
    ])
  })
  it("a crisis resolves once", () => {
    const once = resolve(atSage({ facts: ["fact.secret"], deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } }), "opt.a").state
    const again = resolve(once, "opt.b")
    expect(again.events).toEqual([]); expect(again.state.crises["crisis.test"]).toBe("opt.a")
  })
  it("an unavailable option cannot be resolved", () => {
    expect(resolve(atSage({}), "opt.a").events).toEqual([])
  })
  it("resolving needs a dialogue with the crisis NPC", () => {
    expect(resolve(stateWith({ facts: ["fact.secret"] }), "opt.a").events).toEqual([])
    const other = deepFreeze({ ...stateWith({ facts: ["fact.secret"] }), dialogue: { npcId: "npc.ally", pendingChoice: null } })
    expect(resolve(other, "opt.a").events).toEqual([])
  })
  it("a pending choice blocks resolving", () => {
    const s = deepFreeze({ ...stateWith({ facts: ["fact.secret"] }), dialogue: { npcId: "npc.sage", pendingChoice: "word.decoy" } })
    expect(resolve(s, "opt.a").events).toEqual([])
  })
  it("unknown crisis or option is ignored", () => {
    expect(crisisOptions(stateWith({}), c, "crisis.nope")).toEqual([])
    const s = atSage({ facts: ["fact.secret"] })
    expect(step(s, { type: "resolveCrisis", crisisId: "crisis.nope", optionId: "opt.a" }, c).events).toEqual([])
    expect(resolve(s, "opt.nope").events).toEqual([])
  })
})
