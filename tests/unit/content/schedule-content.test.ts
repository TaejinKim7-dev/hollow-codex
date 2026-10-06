// NPC day/night schedules (D13) from real content: the compiler keeps them, core resolves them by
// hour, and the renderer draws NPCs where core says they are.
import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { createInitialState } from "../../../src/core/state.ts"
import { step } from "../../../src/core/step.ts"
import type { GameState } from "../../../src/core/types.ts"
import { npcAt } from "../../../src/core/world/move.ts"
import { npcsToDraw } from "../../../src/render/canvas.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()
const GATE = "npc.field.gatekeeper"   // schedule: 0 [4,7], 6 [4,8], 12 [4,7], 18 [3,7]

const at = (hour: number, pos: { x: number; y: number }): GameState => {
  const base = createInitialState(content, 1)
  return { ...base, mapId: "map.field", time: { hour, day: 1 }, player: { ...base.player, pos } }
}

describe("real-content schedules", () => {
  it("the compiler keeps every NPC's schedule", () => {
    const withSchedule = Object.values(content.npcs).filter((n) => n.schedule !== undefined)
    expect(withSchedule.length).toBe(Object.keys(content.npcs).length)
    expect(content.npcs[GATE]?.schedule).toEqual({ "0": { x: 4, y: 7 }, "6": { x: 4, y: 8 }, "12": { x: 4, y: 7 }, "18": { x: 3, y: 7 } })
  })

  it("the gatekeeper stands in different places at different hours", () => {
    expect(npcAt(at(8, { x: 7, y: 7 }), content, { x: 4, y: 8 })).toBe(GATE)
    expect(npcAt(at(8, { x: 7, y: 7 }), content, { x: 4, y: 7 })).toBeNull()
    expect(npcAt(at(13, { x: 7, y: 7 }), content, { x: 4, y: 7 })).toBe(GATE)
    expect(npcAt(at(20, { x: 7, y: 7 }), content, { x: 3, y: 7 })).toBe(GATE)
  })

  it("the player can talk to the gatekeeper at the morning spot only in the morning", () => {
    const morning = step(at(8, { x: 5, y: 8 }), { type: "interact", at: { x: 4, y: 8 } }, content)
    expect(morning.state.dialogue?.npcId).toBe(GATE)
    const noon = at(13, { x: 5, y: 8 })
    expect(step(noon, { type: "interact", at: { x: 4, y: 8 } }, content).state.dialogue).toBeNull()
  })

  it("the renderer draws NPCs at their scheduled position", () => {
    const morning = npcsToDraw(at(8, { x: 7, y: 7 }), content).find((n) => n.id === GATE)
    expect(morning?.pos).toEqual({ x: 4, y: 8 })
    const evening = npcsToDraw(at(19, { x: 7, y: 7 }), content).find((n) => n.id === GATE)
    expect(evening?.pos).toEqual({ x: 3, y: 7 })
  })
})

describe("schedule validation", () => {
  type Obj = Record<string, unknown>
  const raw = () => loadContentDir("tests/fixtures/content-min")
  const sageWith = (schedule: unknown) => {
    const list = raw()["towns/min/npcs.yaml"] as Obj[]
    return [{ ...structuredClone(list[0] as Obj), schedule }]
  }
  const errorsFor = (schedule: unknown) => compileContent({ ...raw(), "towns/min/npcs.yaml": sageWith(schedule) }).errors

  it("accepts a valid schedule", () => {
    expect(errorsFor({ "0": [1, 1], "6": [2, 1], "12": [1, 1], "18": [2, 1] })).toEqual([])
  })
  it("rejects an unknown bucket key", () => {
    expect(errorsFor({ "7": [1, 1] }).some((e) => e.includes("schedule"))).toBe(true)
  })
  it("rejects two NPCs on the same cell in the same hour bucket", () => {
    const list = raw()["towns/min/npcs.yaml"] as Obj[]
    const sage = { ...structuredClone(list[0] as Obj), schedule: { "6": [1, 1] } }
    const twin = { ...structuredClone(list[0] as Obj), id: "npc.min.twin", pos: [1, 1], schedule: { "0": [2, 1] } }
    const { errors } = compileContent({ ...raw(), "towns/min/npcs.yaml": [sage, twin] })
    // bucket 6: sage [1,1] vs twin pos [1,1]; bucket 0: sage pos [2,1] vs twin [2,1]
    expect(errors.filter((e) => e.includes("same cell")).length).toBe(2)
  })
  it("rejects a scheduled cell that is a wall or outside the map", () => {
    expect(errorsFor({ "6": [0, 0] }).some((e) => e.includes("schedule") && e.includes("not walkable"))).toBe(true)
    expect(errorsFor({ "6": [9, 9] }).some((e) => e.includes("schedule") && e.includes("outside"))).toBe(true)
  })
})
