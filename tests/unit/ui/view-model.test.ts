// Task 13 view-model 단위 테스트 (Step 1: 실패 먼저). DOM·렌더링 없음.
import { describe, expect, it } from "vitest"
import { step } from "../../../src/core/step.ts"
import type { GameState } from "../../../src/core/types.ts"
import { t } from "../../../src/ui/strings.ts"
import { combatView, dialogueView, notebookView } from "../../../src/ui/view-model.ts"
import { at, deepFreeze, stateWith, testContent } from "../core/fixture.ts"

const c = testContent()

const talking = (patch: Partial<GameState>): GameState =>
  deepFreeze({ ...stateWith(patch), dialogue: { npcId: "npc.sage", pendingChoice: null } })

describe("dialogueView", () => {
  it("lie marks appear only with the see-lies ability", () => {
    const log = [{ textKey: "sage.self", lie: true }]
    expect(dialogueView(talking({}), c, log)?.lines[0]?.lieMark).toBe(false)
    expect(dialogueView(talking({ abilities: ["ability.see-lies"] }), c, log)?.lines[0]?.lieMark).toBe(true)
  })
  it("chips list only topics available for this NPC", () => {
    const v = dialogueView(talking({ facts: ["fact.secret", "word.alpha"] }), c, [])
    expect(v?.chips.map((x) => x.topic)).toEqual(["name", "job", "word.alpha"])
    expect(v?.chips[2]?.label).toBe("word.alpha.label")
  })
  it("the crisis appears with availability and hints when talking to its NPC", () => {
    expect(dialogueView(talking({}), c, [])?.crisis).toEqual([
      { optionId: "opt.a", label: "opt.a.label", available: false, hints: ["fact.secret.hint"] },
      { optionId: "opt.b", label: "opt.b.label", available: false, hints: ["deduction.test.hint"] }
    ])
  })
})

describe("notebookView", () => {
  it("the deduction page shows chosen words, never a correctness count", () => {
    const s = stateWith({
      facts: ["word.alpha", "word.decoy"],
      deductions: { "deduction.test": { slots: ["word.alpha", null, "word.decoy"], confirmed: false } }
    })
    const d = notebookView(s, c).deductions[0]!
    expect(d.slots).toEqual(["word.alpha.label", null, "word.decoy.label"])
    expect(Object.keys(d).sort()).toEqual(["confirmed", "id", "sentence", "slots", "words"])
  })
  it("hints show hint text of missing facts", () => {
    expect(notebookView(stateWith({}), c).hints).toEqual(["deduction.test.hint", "fact.secret.hint"])
  })
})

describe("combatView", () => {
  it("unknown creature nature shows as null", () => {
    const s = step(at(1, 2), { type: "move", dir: "s" }, c).state
    expect(combatView(s, c)?.units.find((u) => u.id === "creature.slime#0")?.evilKnown).toBeNull()
    const known = deepFreeze({ ...s, facts: ["fact.slime-lore"] })
    expect(combatView(known, c)?.units.find((u) => u.id === "creature.slime#0")?.evilKnown).toBe(false)
  })
})

describe("t", () => {
  it("t marks a missing key", () => {
    expect(t({}, "x.y")).toBe("⟦x.y⟧")
    expect(t({ a: "안녕 {n}" }, "a", { n: "엘린" })).toBe("안녕 엘린")
  })
})