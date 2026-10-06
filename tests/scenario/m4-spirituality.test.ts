// Task 41 — M4 영성 시나리오: 대륙 오버월드에서 엘리아(map.town.spirituality)에 들어가
// NPC 대화로 진실·사랑·용기를 배워 추론 3칸을 확정하고(ability.spirituality-mind),
// 주지의 위기(crisis.spirituality.license)를 명상을 여는 선택지로 푼다. 실제 content/ 를 사용한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, play, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.spirituality"

/** NPC의 지금 일과 자리 옆으로 걸어가 대화한다(시간대가 바뀌면 걸음마다 다시 맞춘다). */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  w.meet(TOWN, npcId)
  w.talk(npcId, topics)
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 엘리아 `+` 입구 [6,36] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화: 은둔자(진실·조용한 노래), 치유사(용기), 정원지기(사랑)
  visit(w, "npc.spirituality.hermit", ["job"])    // word.truth, fact.elia.silent-chant
  visit(w, "npc.spirituality.healer", ["job"])    // word.courage
  visit(w, "npc.spirituality.gardener", ["job"])  // word.love
  // 3. 추론 확정: 진실·사랑·용기
  w.push([
    { type: "fillSlot", deductionId: "deduction.spirituality", slot: 0, word: "word.truth" },
    { type: "fillSlot", deductionId: "deduction.spirituality", slot: 1, word: "word.love" },
    { type: "fillSlot", deductionId: "deduction.spirituality", slot: 2, word: "word.courage" }
  ])
  // 4. 주지의 위기 — 명상 문 열기
  w.meet(TOWN, "npc.spirituality.monk")
  w.talkWith("npc.spirituality.monk", [
    { type: "resolveCrisis", crisisId: "crisis.spirituality.license", optionId: "option.open-meditation" }
  ])
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m4 spirituality (Elia) scenario", () => {
  it("enters the town and opens meditation with the spirituality deduction", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.elia.silent-chant")
    expect(state.deductions["deduction.spirituality"]!.confirmed).toBe(true)
    expect(state.abilities).toContain("ability.spirituality-mind")
    expect(state.crises["crisis.spirituality.license"]).toBe("option.open-meditation")
    expect(state.flags).toContain("flag.spirituality.meditation-open")
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.spirituality" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.spirituality-mind" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.spirituality.license", optionId: "option.open-meditation" })
  })
})
