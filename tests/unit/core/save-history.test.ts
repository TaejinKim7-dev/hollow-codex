// Saves written by earlier deploys must still load. The fixtures below are literal JSON
// shapes taken from the git history of src/core/types.ts and src/core/save/serialize.ts:
// - v1 (2f0a470, M1): no time, rings, codex or language; only the Kalas deduction existed.
// - v2 (5ed4b8f..83dcff0, M2-M4): time and rings, no codex, no language.
// - v2 (db80970, M5-M6 before i18n): codex present, no language.
// They are NOT built from createInitialState, which already has every current field.
import { describe, expect, it } from "vitest"
import { deserialize } from "../../../src/core/save/serialize.ts"
import { normalizeLoaded } from "../../../src/core/save/normalize.ts"
import { step } from "../../../src/core/step.ts"
import type { GameState } from "../../../src/core/types.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()

const m1State = {
  version: 1, rng: 12345, turn: 40, mapId: "map.kalas",
  player: { pos: { x: 10, y: 10 }, facing: "s", hp: 12, maxHp: 12, attack: 3 },
  facts: ["word.lantern", "word.truth"],
  deductions: { "deduction.honesty": { slots: ["word.truth", null, null], confirmed: false } },
  abilities: [], deeds: [], party: [], departed: [], joinedAt: {}, crises: {}, flags: [],
  dialogue: null, combat: null, clearedEncounters: []
}

const m4State = {
  version: 1, rng: 777, turn: 900, mapId: "map.over",
  time: { hour: 14, day: 5 },
  rings: { visited: [], knownFacts: ["fact.ring.honesty"] },
  player: { pos: { x: 14, y: 23 }, facing: "e", hp: 9, maxHp: 12, attack: 3 },
  facts: ["fact.ring.honesty", "word.truth"],
  deductions: Object.fromEntries(
    ["deduction.honesty", "deduction.compassion", "deduction.valor", "deduction.justice",
      "deduction.sacrifice", "deduction.honor", "deduction.spirituality", "deduction.humility"]
      .map((id) => [id, { slots: [null, null, null], confirmed: false }])
  ),
  abilities: [], deeds: [], party: [], departed: [], joinedAt: {}, crises: {}, flags: ["flag.visited-archive"],
  dialogue: null, combat: null, clearedEncounters: ["enc.field.wolves"]
}

const m5State = { ...m4State, codex: { answers: {}, finalWord: null, finalOpen: false } }

const save = (version: number, state: unknown): string =>
  JSON.stringify({ format: "hollow-codex-save", version, state })

function loadOk(text: string): GameState {
  const r = deserialize(text)
  expect(r.ok).toBe(true)
  if (!r.ok) throw new Error(`deserialize failed: ${r.reason}`)
  return normalizeLoaded(r.state, content)
}

describe("historical saves load into the current shape", () => {
  it("v1 (M1) save → current: fills time, rings, codex, language", () => {
    const s = loadOk(save(1, m1State))
    expect(s.time).toEqual({ hour: 8, day: 1 })
    expect(s.rings).toEqual({ visited: [], knownFacts: [] })
    expect(s.codex).toEqual({ answers: {}, finalWord: null, finalOpen: false })
    expect(s.language).toBe("ko")
    expect(s.turn).toBe(40)
    expect(s.deductions["deduction.honesty"]).toEqual({ slots: ["word.truth", null, null], confirmed: false })
  })

  it("v2 (M2-M4) save without codex or language → current", () => {
    const s = loadOk(save(2, m4State))
    expect(s.codex).toEqual({ answers: {}, finalWord: null, finalOpen: false })
    expect(s.language).toBe("ko")
    expect(s.time).toEqual({ hour: 14, day: 5 })
    expect(s.rings.knownFacts).toEqual(["fact.ring.honesty"])
    expect(s.clearedEncounters).toEqual(["enc.field.wolves"])
  })

  it("v2 (M5) save with codex but no language → current", () => {
    const s = loadOk(save(2, m5State))
    expect(s.language).toBe("ko")
    expect(s.codex).toEqual({ answers: {}, finalWord: null, finalOpen: false })
  })

  it("a loaded v1 save gets every deduction page from content (towns added after M1)", () => {
    const s = loadOk(save(1, m1State))
    for (const id of Object.keys(content.deductions)) {
      expect(s.deductions[id], id).toBeDefined()
    }
    // the existing Kalas page is kept as it was
    expect(s.deductions["deduction.honesty"]?.slots).toEqual(["word.truth", null, null])
  })

  it("an M1 player can confirm the compassion deduction after loading", () => {
    const loaded = loadOk(save(1, m1State))
    const words = content.deductions["deduction.compassion"]!.answer
    let s: GameState = { ...loaded, facts: [...new Set([...loaded.facts, ...words])].sort() }
    words.forEach((w, i) => { s = step(s, { type: "fillSlot", deductionId: "deduction.compassion", slot: i, word: w }, content).state })
    expect(s.deductions["deduction.compassion"]?.confirmed).toBe(true)
  })

  it("normalizeLoaded returns the same object when nothing is missing", () => {
    const s = loadOk(save(2, m5State))
    expect(normalizeLoaded(s, content)).toBe(s)
  })
})
