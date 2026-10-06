// Task 36 — M3 정의 시나리오: 대륙 오버월드에서 셀레스(map.town.justice)에 들어가
// NPC 대화로 단서를 모아 추론 3칸(진실·공정·사랑, word.truth는 M1 칼라스산)을 확정하고
// (ability.justice-eye), 재판관의 위기(crisis.justice.mourning)를 미망인을 위로하는
// 선택지로 푼다. 실제 content/ 를 사용한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, play, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.justice"

/** NPC의 지금 일과 자리 옆으로 걸어가 대화한다(시간대가 바뀌면 걸음마다 다시 맞춘다). */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  w.meet(TOWN, npcId)
  w.talk(npcId, topics)
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 셀레스 `+` 입구 [40,6] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화: 죄수(진실·공정), 미망인(조문 자장가), 무덤 파는 이(사랑)
  visit(w, "npc.justice.prisoner", ["job", "word.truth"])   // word.truth, word.fairness
  visit(w, "npc.justice.widow", ["job"])                    // word.compassion, fact.seles.mourning-lullaby
  visit(w, "npc.justice.gravedigger", ["word.compassion"])  // word.love
  // 3. 추론 확정: 진실·공정·사랑
  w.push([
    { type: "fillSlot", deductionId: "deduction.justice", slot: 0, word: "word.truth" },
    { type: "fillSlot", deductionId: "deduction.justice", slot: 1, word: "word.fairness" },
    { type: "fillSlot", deductionId: "deduction.justice", slot: 2, word: "word.love" }
  ])
  // 4. 재판관(judge)의 위기 — 미망인 위로
  w.meet(TOWN, "npc.justice.judge")
  w.talkWith("npc.justice.judge", [
    { type: "resolveCrisis", crisisId: "crisis.justice.mourning", optionId: "option.comfort-widow" }
  ])
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m3 justice (Seles) scenario", () => {
  it("enters the town and resolves the mourning crisis by comforting the widow", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.seles.mourning-lullaby")
    expect(state.deductions["deduction.justice"]!.confirmed).toBe(true)
    expect(state.abilities).toContain("ability.justice-eye")
    expect(state.crises["crisis.justice.mourning"]).toBe("option.comfort-widow")
    expect(state.flags).toContain("flag.justice.mourning-lifted")
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.justice" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.justice-eye" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.justice.mourning", optionId: "option.comfort-widow" })
  })
})