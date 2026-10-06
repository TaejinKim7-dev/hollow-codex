// Task 31 — M2 열석 고리 시나리오. 단서를 배우면 고리가 잠금 해제되고(ringUnlocked),
// ringStep으로 다른 고리(다른 오버월드)로 이동한다(ringTraveled). 단서가 없으면 아무 일도 없다.
import { describe, expect, it } from "vitest"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { learn } from "../../src/core/knowledge/notebook.ts"
import { loadRealContent, walkTo } from "./play.ts"

const content = loadRealContent()

describe("m2 moongate travel", () => {
  /** Walks next to ring.valor's stone at (4,20) on the continent, with the given ring facts known. */
  function besideValor(facts: readonly string[]) {
    const base = createInitialState(content, 1)
    let state = { ...base, mapId: "map.over", player: { ...base.player, pos: { x: 6, y: 20 } } }
    for (const cmd of walkTo(content, state, "map.over", { x: 5, y: 20 })) state = step(state, cmd, content).state
    return learn(state, facts, content)
  }

  it("unlocks a ring when its fact is learned, then travel to the destination overworld", () => {
    const learned = besideValor(["fact.ring.honesty"])
    expect(learned.state.rings.knownFacts).toContain("fact.ring.honesty")
    expect(learned.events).toContainEqual({ type: "ringUnlocked", ringId: "ring.honesty", fact: "fact.ring.honesty" })

    // 지금 선 고리(ring.valor 돌 옆)에서 고른 목적지(ring.honesty)로 이동.
    const traveled = step(learned.state, { type: "ringStep", to: "ring.honesty" }, content)
    expect(traveled.state.mapId).toBe("map.field")
    expect(traveled.state.player.pos).toEqual({ x: 6, y: 7 })
    expect(traveled.events).toContainEqual({ type: "ringTraveled", from: "ring.valor", to: "ring.honesty" })
    expect(traveled.events).toContainEqual({ type: "mapChanged", mapId: "map.field" })
    expect(traveled.events).toContainEqual({ type: "music", track: content.maps["map.field"]!.music })
    expect(traveled.state.rings.visited).toEqual(["ring.honesty", "ring.valor"])
  })

  it("with three or more rings known, each choice goes to that ring", () => {
    const learned = besideValor(["fact.ring.honesty", "fact.ring.justice", "fact.ring.humility"])
    for (const to of ["ring.justice", "ring.humility", "ring.honesty"]) {
      const r = step(learned.state, { type: "ringStep", to }, content)
      expect(r.events).toContainEqual({ type: "ringTraveled", from: "ring.valor", to })
      const gate = content.moongates[to]!
      expect(r.state.mapId).toBe(gate.onOverworld)
      const d = Math.abs(r.state.player.pos.x - gate.at.x) + Math.abs(r.state.player.pos.y - gate.at.y)
      expect(d).toBeLessThanOrEqual(1)   // on the ring cell, or beside an impassable ring stone
    }
  })

  it("cannot teleport from the start field away from the ring, or from inside a town", () => {
    const base = createInitialState(content, 1)
    const known = { ...base, rings: { visited: [], knownFacts: ["fact.ring.valor"] } }
    const far = { ...known, player: { ...known.player, pos: { x: 12, y: 3 } } }
    expect(step(far, { type: "ringStep", to: "ring.valor" }, content).state).toBe(far)
    const inTown = { ...known, mapId: "map.kalas", player: { ...known.player, pos: { x: 6, y: 7 } } }
    expect(step(inTown, { type: "ringStep", to: "ring.valor" }, content).state).toBe(inTown)
  })

  it("does nothing at all with no known ring facts", () => {
    const state = createInitialState(content, 1)
    const r = step(state, { type: "ringStep", to: "ring.honesty" }, content)
    expect(r.state).toBe(state)
    expect(r.events).toEqual([])
  })

  it("ignores an unknown ring id", () => {
    const state = createInitialState(content, 1)
    const r = step(state, { type: "ringStep", to: "ring.nowhere" }, content)
    expect(r.state).toBe(state)
    expect(r.events).toEqual([])
  })
})
