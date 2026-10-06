// Task 31 — M2 열석 고리 시나리오. 단서를 배우면 고리가 잠금 해제되고(ringUnlocked),
// ringStep으로 다른 고리(다른 오버월드)로 이동한다(ringTraveled). 단서가 없으면 아무 일도 없다.
import { describe, expect, it } from "vitest"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { learn } from "../../src/core/knowledge/notebook.ts"
import { loadRealContent, walkTo } from "./play.ts"

const content = loadRealContent()

describe("m2 moongate travel", () => {
  it("unlocks a ring when its fact is learned, then travel to the destination overworld", () => {
    const base = createInitialState(content, 1)
    // 대륙 오버월드에서 고리를 향해 걷는다.
    let state = { ...base, mapId: "map.over", player: { ...base.player, pos: { x: 6, y: 20 } } }
    for (const cmd of walkTo(content, state, "map.over", { x: 5, y: 20 })) state = step(state, cmd, content).state

    // 고리 이름·노래 단서(ring.honesty)를 배우면 잠금 해제된다.
    const learned = learn(state, ["fact.ring.honesty"], content)
    expect(learned.state.rings.knownFacts).toContain("fact.ring.honesty")
    expect(learned.events).toContainEqual({ type: "ringUnlocked", ringId: "ring.honesty", fact: "fact.ring.honesty" })

    // 지금 선 고리(ring.valor)에서 알려진 목적지(ring.honesty)로 이동.
    const traveled = step(learned.state, { type: "ringStep", at: "ring.valor" }, content)
    expect(traveled.state.mapId).toBe("map.field")
    expect(traveled.state.player.pos).toEqual({ x: 6, y: 7 })
    expect(traveled.events).toContainEqual({ type: "ringTraveled", from: "ring.valor", to: "ring.honesty" })
    expect(traveled.state.rings.visited).toContain("ring.valor")
  })

  it("does nothing at all with no known ring facts", () => {
    const state = createInitialState(content, 1)
    const r = step(state, { type: "ringStep", at: "ring.honesty" }, content)
    expect(r.state).toBe(state)
    expect(r.events).toEqual([])
  })

  it("ignores an unknown ring id", () => {
    const state = createInitialState(content, 1)
    const r = step(state, { type: "ringStep", at: "ring.nowhere" }, content)
    expect(r.state).toBe(state)
    expect(r.events).toEqual([])
  })
})
