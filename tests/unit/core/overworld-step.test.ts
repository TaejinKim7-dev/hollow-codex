// Task 20 — 오버월드 마을 입구 타일은 발이 닿는 즉시 마을 내부로 이동한다 (D8, 엣지 케이스 9).
// enterOverworldTarget(overworld.ts)로 입구 판정하고, move()가 advanceTime 후에 호출한다.
import { describe, expect, it } from "vitest"
import type { GameContent } from "../../../src/content/types.ts"
import type { GameState } from "../../../src/core/types.ts"
import { step } from "../../../src/core/step.ts"
import { enterOverworldTarget } from "../../../src/core/world/overworld.ts"
import { stateWith, testContent } from "./fixture.ts"

/** 오버월드 지도 1장 + 입구 2개 + 각각 도착 마을. `+`는 입구/길 타일. */
const entryContent = (): GameContent => {
  const c = testContent()
  return {
    ...c,
    tiles: {
      ...c.tiles,
      "+": { sprite: { sheet: "t", index: 1 }, walk: 1 }
    },
    maps: {
      ...c.maps,
      "map.over": {
        rows: ["....#", ".++.#", "....#", "....."],
        terrainCost: { ".": 1, "+": 1, "#": null },
        isOverworld: true,
        exits: [
          { at: { x: 1, y: 1 }, to: "map.town.a", arrive: { x: 1, y: 1 } },
          { at: { x: 2, y: 1 }, to: "map.town.b", arrive: { x: 2, y: 1 } }
        ],
        music: "music.a",
        encounters: [],
        enterFlags: [],
        heals: false
      },
      "map.town.a": {
        rows: ["####", "#..#", "####"],
        exits: [],
        music: "music.a",
        encounters: [],
        enterFlags: [],
        heals: false
      },
      "map.town.b": {
        rows: ["####", "#..#", "####"],
        exits: [],
        music: "music.a",
        encounters: [],
        enterFlags: [],
        heals: false
      }
    }
  }
}

const c = entryContent()

/** map.over 위의 상태. 시간은 기본값(8시)에서 시작한다. */
const overAt = (x: number, y: number): GameState =>
  stateWith({ mapId: "map.over", player: { ...stateWith({}).player, pos: { x, y } } })

describe("overworld town entry", () => {
  it("enters the town when stepping onto an overworld entrance tile", () => {
    const r = step(overAt(1, 0), { type: "move", dir: "s" }, c)      // (1,1) = exits[0].at
    expect(r.state.mapId).toBe("map.town.a")
    expect(r.state.player.pos).toEqual({ x: 1, y: 1 })
    expect(r.events).toContainEqual({ type: "mapChanged", mapId: "map.town.a" })
    expect(r.events.map((e) => e.type)).toEqual(["moved", "timePassed", "mapChanged", "music"])
  })
  it("does not change maps when stepping onto a non-entrance tile", () => {
    const r = step(overAt(0, 1), { type: "move", dir: "s" }, c)      // (0,2) — 입구가 아님
    expect(r.state.mapId).toBe("map.over")
    expect(r.state.player.pos).toEqual({ x: 0, y: 2 })
    expect(r.events.some((e) => e.type === "mapChanged")).toBe(false)
  })
  it("uses the matching exit when the map has several", () => {
    const r = step(overAt(2, 0), { type: "move", dir: "s" }, c)      // (2,1) = exits[1].at
    expect(r.state.mapId).toBe("map.town.b")
    expect(r.state.player.pos).toEqual({ x: 2, y: 1 })
  })
  it("does not fire mapChanged for a self-loop exit", () => {
    const loop = {
      ...c,
      maps: { ...c.maps, "map.over": { ...c.maps["map.over"]!, exits: [{ at: { x: 1, y: 1 }, to: "map.over", arrive: { x: 3, y: 3 } }] } }
    }
    const r = step(overAt(1, 0), { type: "move", dir: "s" }, loop)
    expect(r.state.mapId).toBe("map.over")
    expect(r.events.some((e) => e.type === "mapChanged")).toBe(false)
  })
})

describe("enterOverworldTarget", () => {
  it("returns the destination map and arrive cell for an entrance tile", () => {
    expect(enterOverworldTarget(overAt(1, 1), c, { x: 1, y: 1 }, "map.over"))
      .toEqual({ mapId: "map.town.a", pos: { x: 1, y: 1 } })
  })
  it("returns null on a non-entrance tile", () => {
    expect(enterOverworldTarget(overAt(0, 0), c, { x: 0, y: 0 }, "map.over")).toBeNull()
  })
  it("returns null on a non-overworld map even when an exit matches", () => {
    // map.a는 비오버월드 지도지만 (5,2)에 exits[0].at이 있다 — 마을 입구가 아님.
    expect(enterOverworldTarget(stateWith({ mapId: "map.a" }), c, { x: 5, y: 2 }, "map.a")).toBeNull()
  })
  it("returns null for a self-loop exit", () => {
    const loop = {
      ...c,
      maps: { ...c.maps, "map.over": { ...c.maps["map.over"]!, exits: [{ at: { x: 1, y: 1 }, to: "map.over", arrive: { x: 3, y: 3 } }] } }
    }
    expect(enterOverworldTarget(overAt(1, 1), loop, { x: 1, y: 1 }, "map.over")).toBeNull()
  })
})