// Task 41 — M4 희생 시나리오: 대륙 오버월드에서 디오네(map.town.sacrifice)에 들어가
// NPC 대화로 헌신·사랑·용기를 배워 추론 3칸을 확정하고(ability.sacrifice-meaning),
// 제단 사제의 위기(crisis.sacrifice.altar)를 제단을 여는 선택지로 푼다. 실제 content/ 를 사용한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, play, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.sacrifice"

/** NPC의 지금 일과 자리 옆으로 걸어가 대화한다(시간대가 바뀌면 걸음마다 다시 맞춘다). */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  w.meet(TOWN, npcId)
  w.talk(npcId, topics)
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 디오네 `+` 입구 [58,30] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화: 사제(헌신), 과부(사랑·망자의 노래), 석공(용기)
  visit(w, "npc.sacrifice.altar-priest", ["job"])  // word.devotion
  visit(w, "npc.sacrifice.widow", ["job"])         // word.love, fact.dione.widow-song
  visit(w, "npc.sacrifice.mason", ["job"])         // word.courage
  // 3. 추론 확정: 헌신·사랑·용기
  w.push([
    { type: "fillSlot", deductionId: "deduction.sacrifice", slot: 0, word: "word.devotion" },
    { type: "fillSlot", deductionId: "deduction.sacrifice", slot: 1, word: "word.love" },
    { type: "fillSlot", deductionId: "deduction.sacrifice", slot: 2, word: "word.courage" }
  ])
  // 4. 제단 사제의 위기 — 제단 열기
  w.meet(TOWN, "npc.sacrifice.altar-priest")
  w.talkWith("npc.sacrifice.altar-priest", [
    { type: "resolveCrisis", crisisId: "crisis.sacrifice.altar", optionId: "option.open-altar" }
  ])
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m4 sacrifice (Dione) scenario", () => {
  it("enters the town and opens the altar with the sacrifice deduction", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.dione.widow-song")
    expect(state.deductions["deduction.sacrifice"]!.confirmed).toBe(true)
    expect(state.abilities).toContain("ability.sacrifice-meaning")
    expect(state.crises["crisis.sacrifice.altar"]).toBe("option.open-altar")
    expect(state.flags).toContain("flag.sacrifice.altar-opened")
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.sacrifice" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.sacrifice-meaning" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.sacrifice.altar", optionId: "option.open-altar" })
  })
})
