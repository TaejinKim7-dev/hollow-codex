import { describe, it, expect } from "vitest"
import { run, stateWith, testContent } from "./fixture.ts"

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

describe("ringTravel", () => {
  // Use a content with 2 moongates, one known fact
  const c = { ...testContent(), moongates: {
    "ring.a": { at: { x: 0, y: 0 }, nameKey: "ring.a.name", songKey: "ring.a.song", fact: "fact.alpha", onOverworld: "map.a" },
    "ring.b": { at: { x: 5, y: 5 }, nameKey: "ring.b.name", songKey: "ring.b.song", fact: "fact.beta", onOverworld: "map.a" }
  }}
  it("travels to a ring whose fact is known", () => {
    const s = stateWith({ rings: { visited: [], knownFacts: ["fact.beta"] } })
    const result = run(s, [{ type: "ringStep", at: "ring.a" }], c)
    expect(result.state.mapId).toBe("map.a")
    expect(result.state.player.pos).toEqual({ x: 5, y: 5 })
    expect(result.events).toContainEqual({ type: "ringTraveled", from: "ring.a", to: "ring.b" })
  })
  it("ignores unknown ring", () => {
    const s = stateWith({})
    const result = run(s, [{ type: "ringStep", at: "ring.nonexistent" }], c)
    expect(result.state).toBe(s)
    expect(result.events).toEqual([])
  })
  it("does not travel if no known rings", () => {
    const s = stateWith({ rings: { visited: [], knownFacts: [] } })
    const result = run(s, [{ type: "ringStep", at: "ring.a" }], c)
    expect(result.state).toBe(s)
  })
  it("adds to visited (sorted, dedup)", () => {
    const s = stateWith({ rings: { visited: [], knownFacts: ["fact.alpha"] } })
    const result = run(s, [{ type: "ringStep", at: "ring.a" }], c)
    expect(result.state.rings.visited).toContain("ring.a")
  })
})