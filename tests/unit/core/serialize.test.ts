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
    expect(deserialize(JSON.stringify({ format: "hollow-codex-save", version: 2, state: {} }))).toEqual({ ok: false, reason: "future-version" })
    expect(deserialize(JSON.stringify({ format: "hollow-codex-save", version: 1, state: { mapId: 3 } }))).toEqual({ ok: false, reason: "corrupt" })
    expect(deserialize("null")).toEqual({ ok: false, reason: "format" })
  })
})