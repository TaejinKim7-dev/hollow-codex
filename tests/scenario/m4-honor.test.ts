// Task 41 — M4 명예 시나리오: 대륙 오버월드에서 아르곤(map.town.honor)에 들어가
// NPC 대화로 진실·용기·명예를 배워 추론 3칸을 확정하고(ability.honor-truth),
// 원로의 위기(crisis.honor.lineage)를 진실을 세우는 선택지로 푼다. 실제 content/ 를 사용한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, play, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.honor"

/** NPC의 지금 일과 자리 옆으로 걸어가 대화한다(시간대가 바뀌면 걸음마다 다시 맞춘다). */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  w.meet(TOWN, npcId)
  w.talk(npcId, topics)
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 아르곤 `+` 입구 [22,18] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화: 후계자(진실·가문의 노래), 원로(명예), 검술 사부(용기)
  visit(w, "npc.honor.heir", ["job"])         // word.truth, fact.argon.lineage-song
  visit(w, "npc.honor.elder", ["job"])        // word.honor
  visit(w, "npc.honor.swordmaster", ["job"])  // word.courage
  // 3. 추론 확정: 진실·용기·명예
  w.push([
    { type: "fillSlot", deductionId: "deduction.honor", slot: 0, word: "word.truth" },
    { type: "fillSlot", deductionId: "deduction.honor", slot: 1, word: "word.courage" },
    { type: "fillSlot", deductionId: "deduction.honor", slot: 2, word: "word.honor" }
  ])
  // 4. 원로의 위기 — 진실된 가문 세우기
  w.meet(TOWN, "npc.honor.elder")
  w.talkWith("npc.honor.elder", [
    { type: "resolveCrisis", crisisId: "crisis.honor.lineage", optionId: "option.truth-lineage" }
  ])
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m4 honor (Argon) scenario", () => {
  it("enters the town and restores the lineage truth with the honor deduction", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.argon.lineage-song")
    expect(state.deductions["deduction.honor"]!.confirmed).toBe(true)
    expect(state.abilities).toContain("ability.honor-truth")
    expect(state.crises["crisis.honor.lineage"]).toBe("option.truth-lineage")
    expect(state.flags).toContain("flag.honor.lineage-truth")
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.honor" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.honor-truth" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.honor.lineage", optionId: "option.truth-lineage" })
  })
})
