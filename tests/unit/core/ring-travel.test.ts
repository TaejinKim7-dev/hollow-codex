// Ring travel contract: ringStep { to } = the chosen DESTINATION. The player must stand on (or, for an
// impassable ring stone, next to) a ring; the destination must be a different ring whose fact is known.
import { describe, expect, it } from "vitest"
import type { GameContent } from "../../../src/content/types.ts"
import type { Pos } from "../../../src/core/types.ts"
import { run, stateWith, testContent } from "./fixture.ts"

const ring = (at: Pos, fact: string, onOverworld: string) => ({ at, nameKey: "n", songKey: "s", fact, onOverworld })
const c = (): GameContent => ({
  ...testContent(),
  rings: {
    "ring.a": ring({ x: 1, y: 1 }, "fact.alpha", "map.a"),
    "ring.b": ring({ x: 2, y: 1 }, "fact.beta", "map.b"),
    "ring.c": ring({ x: 4, y: 1 }, "fact.gamma", "map.a"),
    "ring.stone": ring({ x: 5, y: 3 }, "fact.stone", "map.a")   // a '#' cell: impassable stone
  }
})
const known = ["fact.alpha", "fact.beta", "fact.gamma", "fact.stone"]
const standing = (pos: Pos, knownFacts: readonly string[] = known, mapId = "map.a") =>
  stateWith({ mapId, player: { ...stateWith({}).player, pos }, rings: { visited: [], knownFacts } })

describe("ringStep { to }", () => {
  it("goes to the chosen destination, not the first known ring", () => {
    const r = run(standing({ x: 1, y: 1 }), [{ type: "ringStep", to: "ring.c" }], c())
    expect(r.state.mapId).toBe("map.a")
    expect(r.state.player.pos).toEqual({ x: 4, y: 1 })
    expect(r.events).toContainEqual({ type: "ringTraveled", from: "ring.a", to: "ring.c" })
    const r2 = run(standing({ x: 1, y: 1 }), [{ type: "ringStep", to: "ring.stone" }], c())
    expect(r2.events).toContainEqual({ type: "ringTraveled", from: "ring.a", to: "ring.stone" })
  })

  it("records both the origin and the destination in visited (sorted)", () => {
    const r = run(standing({ x: 1, y: 1 }), [{ type: "ringStep", to: "ring.c" }], c())
    expect(r.state.rings.visited).toEqual(["ring.a", "ring.c"])
  })

  it("changing map emits mapChanged and music and applies the map's enterFlags", () => {
    const r = run(standing({ x: 1, y: 1 }), [{ type: "ringStep", to: "ring.b" }], c())
    expect(r.state.mapId).toBe("map.b")
    expect(r.state.player.pos).toEqual({ x: 2, y: 1 })
    expect(r.events).toContainEqual({ type: "mapChanged", mapId: "map.b" })
    expect(r.events).toContainEqual({ type: "music", track: "music.b" })
    expect(r.state.flags).toContain("flag.visited-b")
  })

  it("cannot teleport from a non-ring tile", () => {
    const s = standing({ x: 3, y: 2 })
    const r = run(s, [{ type: "ringStep", to: "ring.c" }], c())
    expect(r.state).toBe(s)
    expect(r.events).toEqual([])
  })

  it("cannot teleport from a ring cell on another map", () => {
    const s = standing({ x: 1, y: 1 }, known, "map.b")   // (1,1) on map.b is not ring.a
    expect(run(s, [{ type: "ringStep", to: "ring.c" }], c()).state).toBe(s)
  })

  it("unknown destination ignored", () => {
    const s = standing({ x: 1, y: 1 })
    const r = run(s, [{ type: "ringStep", to: "ring.nowhere" }], c())
    expect(r.state).toBe(s)
    expect(r.events).toEqual([])
  })

  it("a destination whose fact is not known is ignored", () => {
    const s = standing({ x: 1, y: 1 }, ["fact.alpha"])
    expect(run(s, [{ type: "ringStep", to: "ring.c" }], c()).state).toBe(s)
  })

  it("the ring the player stands on is not a destination", () => {
    const s = standing({ x: 1, y: 1 })
    expect(run(s, [{ type: "ringStep", to: "ring.a" }], c()).state).toBe(s)
  })

  it("standing next to an impassable ring stone counts; arriving at one lands on a free neighbour", () => {
    const from = run(standing({ x: 4, y: 3 }), [{ type: "ringStep", to: "ring.a" }], c())
    expect(from.events).toContainEqual({ type: "ringTraveled", from: "ring.stone", to: "ring.a" })
    // arrival: n (5,2) is an exit, e is outside, s is a wall -> w (4,3)
    const to = run(standing({ x: 1, y: 1 }), [{ type: "ringStep", to: "ring.stone" }], c())
    expect(to.state.player.pos).toEqual({ x: 4, y: 3 })
  })
})

describe("walking to a ring leaves a footprint (visited, D6)", () => {
  it("stepping onto a ring cell or beside an impassable ring stone marks it visited", () => {
    const onto = run(standing({ x: 2, y: 1 }, []), [{ type: "move", dir: "w" }], c())   // (1,1) = ring.a
    expect(onto.state.rings.visited).toEqual(["ring.a"])
    const beside = run(standing({ x: 4, y: 2 }, []), [{ type: "move", dir: "s" }], c())  // (4,3) is next to the ring.stone wall
    expect(beside.state.rings.visited).toEqual(["ring.stone"])
  })
  it("an ordinary step does not touch visited", () => {
    const s = standing({ x: 2, y: 2 }, [])
    const r = run(s, [{ type: "move", dir: "e" }], c())
    expect(r.state.rings).toBe(s.rings)
  })
})
