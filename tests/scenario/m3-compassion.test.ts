// Task 36 — M3 연민 시나리오: 대륙 오버월드에서 리오나(map.town.compassion)에 들어가
// NPC 대화로 단서를 모아 추론 3칸을 확정하고(ability.compassion-persuade), 자선관장의 위기
// (crisis.compassion.hoard)를 육아당 문을 여는 선택지로 푼다. 실제 content/ 를 사용한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, play, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.compassion"

/** NPC의 지금 일과 자리 옆으로 걸어가 대화한다(시간대가 바뀌면 걸음마다 다시 맞춘다). */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  w.meet(TOWN, npcId)
  w.talk(npcId, topics)
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 리오나 `+` 입구 [50,8] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화: 방랑자(노래), 아이(나눔), 거지(선물→사랑)
  visit(w, "npc.compassion.wanderer", ["job"])           // fact.reona.wanderer, fact.reona.song
  visit(w, "npc.compassion.child", ["job"])              // word.sharing
  visit(w, "npc.compassion.beggar", ["job", "word.gift"]) // word.gift, word.love
  // 3. 추론 확정: 나눔·선물·사랑
  w.push([
    { type: "fillSlot", deductionId: "deduction.compassion", slot: 0, word: "word.sharing" },
    { type: "fillSlot", deductionId: "deduction.compassion", slot: 1, word: "word.gift" },
    { type: "fillSlot", deductionId: "deduction.compassion", slot: 2, word: "word.love" }
  ])
  // 4. 자선관장(almoner)의 위기 — 육아당 문 열기
  w.meet(TOWN, "npc.compassion.almoner")
  w.talkWith("npc.compassion.almoner", [
    { type: "resolveCrisis", crisisId: "crisis.compassion.hoard", optionId: "option.open-pantry" }
  ])
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m3 compassion (Reona) scenario", () => {
  it("enters the town and resolves the hoard crisis with the deduction and the song", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.reona.song")
    expect(state.deductions["deduction.compassion"]!.confirmed).toBe(true)
    expect(state.abilities).toContain("ability.compassion-persuade")
    expect(state.crises["crisis.compassion.hoard"]).toBe("option.open-pantry")
    expect(state.flags).toContain("flag.compassion.pantry-open")
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.compassion" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.compassion-persuade" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.compassion.hoard", optionId: "option.open-pantry" })
  })
})