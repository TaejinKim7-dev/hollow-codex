// Task 18 — NPC 일과: npcPositionAt 버킷 선택과 pos 폴백, 그리고 interact 연동.
import { describe, expect, it } from "vitest"
import { npcPositionAt } from "../../../src/core/dialogue/talk.ts"
import { step } from "../../../src/core/step.ts"
import type { NpcDef } from "../../../src/content/types.ts"
import { stateWith, testContent } from "./fixture.ts"

const base = testContent().npcs["npc.sage"]!
const withSched = (schedule: NonNullable<NpcDef["schedule"]>): NpcDef => ({ ...base, schedule })

describe("npcPositionAt", () => {
  it("returns the schedule bucket pos for the hour's bucket (7,9 → bucket 6; 13,15 → bucket 12; 19 → bucket 18)", () => {
    const npc = withSched({ "0": { x: 4, y: 4 }, "6": { x: 1, y: 1 }, "12": { x: 2, y: 2 }, "18": { x: 3, y: 3 } })
    expect(npcPositionAt(npc, 7)).toEqual({ x: 1, y: 1 })
    expect(npcPositionAt(npc, 9)).toEqual({ x: 1, y: 1 })
    expect(npcPositionAt(npc, 13)).toEqual({ x: 2, y: 2 })
    expect(npcPositionAt(npc, 15)).toEqual({ x: 2, y: 2 })
    expect(npcPositionAt(npc, 19)).toEqual({ x: 3, y: 3 })
    expect(npcPositionAt(npc, 21)).toEqual({ x: 3, y: 3 })
  })
  it("returns the schedule bucket pos exactly on bucket boundaries (0, 6, 12, 18)", () => {
    const npc = withSched({ "0": { x: 0, y: 0 }, "6": { x: 1, y: 1 }, "12": { x: 2, y: 2 }, "18": { x: 3, y: 3 } })
    for (const [hour, want] of [
      [0, { x: 0, y: 0 }], [1, { x: 0, y: 0 }], [5, { x: 0, y: 0 }],
      [6, { x: 1, y: 1 }], [11, { x: 1, y: 1 }],
      [12, { x: 2, y: 2 }], [17, { x: 2, y: 2 }],
      [18, { x: 3, y: 3 }], [23, { x: 3, y: 3 }]
    ] as const) {
      expect(npcPositionAt(npc, hour)).toEqual(want)
    }
  })
  it("falls back to npc.pos when schedule is absent", () => {
    for (const hour of [0, 5, 6, 12, 18, 23]) expect(npcPositionAt(base, hour)).toEqual(base.pos)
  })
  it("falls back to npc.pos when the bucket key is missing from the schedule", () => {
    const npc = withSched({ "12": { x: 9, y: 9 } })
    expect(npcPositionAt(npc, 3)).toEqual(base.pos)   // bucket "0" missing
    expect(npcPositionAt(npc, 7)).toEqual(base.pos)    // bucket "6" missing
    expect(npcPositionAt(npc, 12)).toEqual({ x: 9, y: 9 })
    expect(npcPositionAt(npc, 20)).toEqual(base.pos)   // bucket "18" missing
  })
  it("is pure: same input yields the same output and the npc is untouched", () => {
    const npc = withSched({ "12": { x: 9, y: 9 } })
    const before = JSON.stringify(npc)
    const a = npcPositionAt(npc, 12)
    const b = npcPositionAt(npc, 12)
    expect(a).toEqual(b)
    expect(JSON.stringify(npc)).toBe(before)
  })
})

describe("interact with a scheduled NPC", () => {
  // 밤(0)엔 sage가 낮자리 (3,3)이 아니라 (2,3)에 서 있다.
  const scheduledSage: NpcDef = { ...base, schedule: { "0": { x: 2, y: 3 }, "6": base.pos, "12": base.pos, "18": base.pos } }
  const c = { ...testContent(), npcs: { ...testContent().npcs, "npc.sage": scheduledSage } }

  it("finds the NPC at its scheduled night position", () => {
    const night = stateWith({ time: { hour: 0, day: 1 }, player: { ...stateWith({}).player, pos: { x: 2, y: 4 }, facing: "n" } })
    const r = step(night, { type: "interact" }, c)
    expect(r.state.dialogue?.npcId).toBe("npc.sage")
  })
  it("does not find the NPC at its day position during the night bucket", () => {
    const night = stateWith({ time: { hour: 0, day: 1 }, player: { ...stateWith({}).player, pos: { x: 2, y: 3 }, facing: "e" } })
    expect(step(night, { type: "interact" }, c).state.dialogue).toBeNull()
  })
  it("finds the NPC back at its day position during the day bucket", () => {
    const day = stateWith({ time: { hour: 12, day: 1 }, player: { ...stateWith({}).player, pos: { x: 2, y: 3 }, facing: "e" } })
    const r = step(day, { type: "interact" }, c)
    expect(r.state.dialogue?.npcId).toBe("npc.sage")
  })
})