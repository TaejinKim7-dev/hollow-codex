// Task 41 — M4 겸손 시나리오: 대륙 오버월드에서 헤론(map.town.humility)에 들어가
// 침묵 규칙대로 짧게 말하는 NPC들에게서 침묵·듣기·셋을 배워 추론 3칸을 확정한다.
// 겸손은 능력이 아니라 깨달음 그 자체이므로(D5) ability 단언은 없다.
// 장로의 위기(crisis.humility.name)를 스스로 이름을 말하는 선택지로 푼다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { approachCell, makeScript, play, stallToSafe, talk, talkWith, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.humility"
const HUBS = [{ x: 12, y: 10 }, { x: 13, y: 10 }] as const

/** NPC pos 근처 통행 가능 셀로 걸어가 대화한다. 시간대는 매번 안전 버킷(0–5·12–17)에서 시작한다. */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  stallToSafe(content, w, TOWN, HUBS)
  const cell = approachCell(content, w.state(), TOWN, npcId)
  w.push(walkTo(content, w.state(), TOWN, cell))
  w.push(talk(npcId, topics))
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 헤론 `+` 입구 [32,40] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화 (침묵 규칙 — 대사가 매우 짧다): 듣는 이(듣기·침묵), 서고지기(셋), 조용한 장로(진짜 이름)
  visit(w, "npc.humility.listener", ["job"])     // word.listening, word.silence
  visit(w, "npc.humility.librarian", ["job"])    // word.three
  visit(w, "npc.humility.silent-elder", ["name"]) // fact.heron.real-name
  // 3. 추론 확정: 침묵·듣기·셋 (겸손은 자동 확정 — ability 없음)
  w.push([
    { type: "fillSlot", deductionId: "deduction.humility", slot: 0, word: "word.silence" },
    { type: "fillSlot", deductionId: "deduction.humility", slot: 1, word: "word.listening" },
    { type: "fillSlot", deductionId: "deduction.humility", slot: 2, word: "word.three" }
  ])
  // 4. 조용한 장로의 위기 — 스스로 이름을 말하기
  stallToSafe(content, w, TOWN, HUBS)
  const elder = approachCell(content, w.state(), TOWN, "npc.humility.silent-elder")
  w.push(walkTo(content, w.state(), TOWN, elder))
  w.push(talkWith("npc.humility.silent-elder", [
    { type: "resolveCrisis", crisisId: "crisis.humility.name", optionId: "option.speak-name" }
  ]))
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m4 humility (Heron) scenario", () => {
  it("enters the town and speaks the name with the humility deduction", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.heron.real-name")
    expect(state.deductions["deduction.humility"]!.confirmed).toBe(true)
    expect(state.crises["crisis.humility.name"]).toBe("option.speak-name")
    expect(state.flags).toContain("flag.humility.name-spoken")
    // D5 — 겸손의 깨달음은 능력이 아니다.
    expect(state.abilities).toEqual([])
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.humility" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.humility.name", optionId: "option.speak-name" })
  })
})
