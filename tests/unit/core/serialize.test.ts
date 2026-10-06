import { describe, expect, it } from "vitest"
import { deserialize, serialize } from "../../../src/core/save/serialize.ts"
import { step } from "../../../src/core/step.ts"
import { at, run, stateWith, testContent } from "./fixture.ts"

const c = testContent()

describe("save format", () => {
  it("round-trips a state", () => {
    const s = run(stateWith({}), [{ type: "move", dir: "e" }, { type: "move", dir: "e" }]).state
    expect(deserialize(serialize(s))).toEqual({ ok: true, state: s })
  })
  it("round-trips a state in the middle of combat", () => {
    const s = run(at(1, 2), [{ type: "move", dir: "s" }, { type: "combat", action: { kind: "defend" } }]).state
    const back = deserialize(serialize(s))
    expect(back).toEqual({ ok: true, state: s })
    if (back.ok) expect(step(back.state, { type: "combat", action: { kind: "endTurn" } }, c)).toEqual(step(s, { type: "combat", action: { kind: "endTurn" } }, c))
  })
  it("corrupt and future saves are rejected without throwing", () => {
    expect(deserialize("{")).toEqual({ ok: false, reason: "corrupt" })
    expect(deserialize(JSON.stringify({ format: "other", version: 1, state: {} }))).toEqual({ ok: false, reason: "format" })
    expect(deserialize(JSON.stringify({ format: "hollow-codex-save", version: 3, state: {} }))).toEqual({ ok: false, reason: "future-version" })
    expect(deserialize(JSON.stringify({ format: "hollow-codex-save", version: 1, state: { mapId: 3 } }))).toEqual({ ok: false, reason: "corrupt" })
    expect(deserialize("null")).toEqual({ ok: false, reason: "format" })
  })
  it("migrates an M1-era save (no time, no rings) to v2 defaults", () => {
    const m1Save = JSON.stringify({
      format: "hollow-codex-save",
      version: 1,
      state: {
        version: 1, rng: 1, turn: 5, mapId: "map.a",
        player: { pos: { x: 1, y: 1 }, facing: "s", hp: 10, maxHp: 10, attack: 3 },
        facts: [], deductions: {}, abilities: [], deeds: [],
        party: [], departed: [], joinedAt: {}, crises: {}, flags: [],
        dialogue: null, combat: null, clearedEncounters: []
      }
    })
    const result = deserialize(m1Save)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.state.time).toEqual({ hour: 8, day: 1 })
      expect(result.state.rings).toEqual({ visited: [], knownFacts: [] })
    }
  })
  it("rejects future version (> 2)", () => {
    const future = JSON.stringify({ format: "hollow-codex-save", version: 3, state: {} })
    expect(deserialize(future)).toEqual({ ok: false, reason: "future-version" })
  })
  it("rejects a save with malformed time field", () => {
    const bad = JSON.stringify({
      format: "hollow-codex-save", version: 2,
      state: {
        version: 2, rng: 1, turn: 0, mapId: "map.a",
        player: { pos: { x: 1, y: 1 }, facing: "s", hp: 10, maxHp: 10, attack: 3 },
        facts: [], deductions: {}, abilities: [], deeds: [],
        party: [], departed: [], joinedAt: {}, crises: {}, flags: [],
        dialogue: null, combat: null, clearedEncounters: [],
        time: "not-an-object",
        rings: { visited: [], knownFacts: [] }
      }
    })
    expect(deserialize(bad)).toEqual({ ok: false, reason: "corrupt" })
  })
  it("rejects a save with malformed rings field", () => {
    const bad = JSON.stringify({
      format: "hollow-codex-save", version: 2,
      state: {
        version: 2, rng: 1, turn: 0, mapId: "map.a",
        player: { pos: { x: 1, y: 1 }, facing: "s", hp: 10, maxHp: 10, attack: 3 },
        facts: [], deductions: {}, abilities: [], deeds: [],
        party: [], departed: [], joinedAt: {}, crises: {}, flags: [],
        dialogue: null, combat: null, clearedEncounters: [],
        time: { hour: 8, day: 1 },
        rings: "not-an-object"
      }
    })
    expect(deserialize(bad)).toEqual({ ok: false, reason: "corrupt" })
  })
})