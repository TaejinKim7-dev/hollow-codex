// @vitest-environment jsdom
// B-1(b) 화면 연결: 열석 이동. 출발 고리에 서서 ringStep → ringTravel이
// ringTraveled·mapChanged·music 이벤트를 내고, 도착 칸(arrivalCell 규칙)에 선다.
// RED: 이 파일은 아직 tests/integration이 vitest include에 없고 jsdom도 없어 로드되지 못한다.
import { describe, expect, it } from "vitest"
import type { GameContent } from "../../src/content/types.ts"
import type { GameState, Pos } from "../../src/core/types.ts"
import { step } from "../../src/core/step.ts"
import { ringTravel } from "../../src/core/world/ring.ts"
import { stateWith, testContent } from "../unit/core/fixture.ts"

const ring = (at: Pos, fact: string, onOverworld: string): GameContent["rings"][string] => ({
  at,
  nameKey: "ring.name",
  songKey: "ring.song",
  fact,
  onOverworld
})

const content = (): GameContent => ({
  ...testContent(),
  rings: {
    "ring.a": ring({ x: 1, y: 1 }, "fact.alpha", "map.a"),
    "ring.b": ring({ x: 2, y: 1 }, "fact.beta", "map.b"),
    "ring.wall": ring({ x: 2, y: 0 }, "fact.wall", "map.a") // map.a (2,0)은 '#' — 통행 불가
  }
})

const known = ["fact.alpha", "fact.beta", "fact.wall"]

/** 플레이어가 pos에 서 있고 주어진 fact를 아는 상태. */
const standing = (pos: Pos, mapId = "map.a", knownFacts: readonly string[] = known): GameState => {
  const base = stateWith({})
  return stateWith({ mapId, player: { ...base.player, pos }, rings: { visited: [], knownFacts } })
}

describe("ring travel: departure → arrival", () => {
  it("moving to another map's ring emits mapChanged and music and lands on the destination cell", () => {
    const r = ringTravel(standing({ x: 1, y: 1 }), "ring.b", content())

    expect(r.state.mapId).toBe("map.b")
    expect(r.state.player.pos).toEqual({ x: 2, y: 1 })
    expect(r.events).toContainEqual({ type: "ringTraveled", from: "ring.a", to: "ring.b" })
    expect(r.events).toContainEqual({ type: "mapChanged", mapId: "map.b" })
    expect(r.events).toContainEqual({ type: "music", track: "music.b" })
    expect(r.state.rings.visited).toEqual(["ring.a", "ring.b"])
  })

  it("arriving on an impassable ring stone lands on the first free neighbour instead", () => {
    const r = ringTravel(standing({ x: 1, y: 1 }), "ring.wall", content())

    expect(r.state.mapId).toBe("map.a")
    expect(r.state.player.pos).toEqual({ x: 2, y: 1 }) // e는 벽, s가 첫 자유 이웃
    expect(r.events).toContainEqual({ type: "ringTraveled", from: "ring.a", to: "ring.wall" })
    expect(r.events.some((e) => e.type === "mapChanged")).toBe(false)
  })

  it("the same result holds through the ringStep command", () => {
    const s = standing({ x: 1, y: 1 })
    const r = step(s, { type: "ringStep", to: "ring.b" }, content())

    expect(r.state.mapId).toBe("map.b")
    expect(r.state.player.pos).toEqual({ x: 2, y: 1 })
    expect(r.events).toContainEqual({ type: "mapChanged", mapId: "map.b" })
    expect(r.events).toContainEqual({ type: "music", track: "music.b" })
  })

  it("cannot travel to a ring whose fact is unknown", () => {
    const s = standing({ x: 1, y: 1 }, "map.a", ["fact.alpha"])
    const r = ringTravel(s, "ring.b", content())

    expect(r.state).toBe(s)
    expect(r.events).toEqual([])
  })
})
