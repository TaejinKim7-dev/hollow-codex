import { describe, it, expect } from "vitest"
import { run, stateWith } from "./fixture.ts"

describe("time system", () => {
  it("advances 1 hour per move", () => {
    const { state } = run(stateWith({}), [{ type: "move", dir: "e" }])
    expect(state.time).toEqual({ hour: 9, day: 1 })
  })
  it("wraps hour to 0 and increments day at 24", () => {
    const { state, events } = run(stateWith({ time: { hour: 23, day: 1 } }), [{ type: "move", dir: "e" }])
    expect(state.time).toEqual({ hour: 0, day: 2 })
    expect(events.map(e => e.type)).toContain("timePassed")
    expect(events.map(e => e.type)).toContain("dayPassed")
  })
  it("emits timePassed every move", () => {
    const { events } = run(stateWith({}), [{ type: "move", dir: "e" }, { type: "move", dir: "e" }])
    expect(events.filter(e => e.type === "timePassed")).toHaveLength(2)
  })
})
// ringTravel tests live in ring-travel.test.ts (contract changed in the fix wave: `to` = destination).
