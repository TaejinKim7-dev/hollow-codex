// Task 36 — M3 용맹 시나리오: 대륙 오버월드에서 솔강(map.town.valor)에 들어가
// NPC 대화로 단서를 모아 추론 3칸을 확정하고(ability.valor-shield), 투기장 챔피언의 위기
// (crisis.valor.challenge)를 후퇴를 허용하는 선택지로 푼다. 실제 content/ 를 사용한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { approachCell, makeScript, play, stallToSafe, talk, talkWith, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()
const TOWN = "map.town.valor"
const HUBS = [{ x: 16, y: 10 }, { x: 7, y: 8 }] as const

/** NPC pos 근처 통행 가능 셀로 걸어가 대화한다. 시간대는 매번 안전 버킷(0–5·12–17)에서 시작한다. */
function visit(w: ReturnType<typeof makeScript>, npcId: string, topics: string[]): void {
  stallToSafe(content, w, TOWN, HUBS)
  const cell = approachCell(content, w.state(), TOWN, npcId)
  w.push(walkTo(content, w.state(), TOWN, cell))
  w.push(talk(npcId, topics))
}

function commands(): Command[] {
  const w = makeScript(content)
  // 1. 대륙 오버월드 → 솔강 `+` 입구 [10,10] → 마을 내부 [1,1]
  w.push(walkTo(content, w.state(), TOWN, { x: 1, y: 1 }))
  // 2. NPC 대화: 노병(전투가·후퇴), 아이(용기), 대장장이(방패)
  visit(w, "npc.valor.veteran", ["job"])            // fact.solgang.battle-hymn, word.retreat
  visit(w, "npc.valor.child", ["job"])              // word.courage
  visit(w, "npc.valor.smith", ["job"])              // word.shield
  // 3. 추론 확정: 용기·후퇴·방패
  w.push([
    { type: "fillSlot", deductionId: "deduction.valor", slot: 0, word: "word.courage" },
    { type: "fillSlot", deductionId: "deduction.valor", slot: 1, word: "word.retreat" },
    { type: "fillSlot", deductionId: "deduction.valor", slot: 2, word: "word.shield" }
  ])
  // 4. 챔피언(champion)의 위기 — 후퇴 허용
  stallToSafe(content, w, TOWN, HUBS)
  const champion = approachCell(content, w.state(), TOWN, "npc.valor.champion")
  w.push(walkTo(content, w.state(), TOWN, champion))
  w.push(talkWith("npc.valor.champion", [
    { type: "resolveCrisis", crisisId: "crisis.valor.challenge", optionId: "option.allow-retreat" }
  ]))
  return w.cmds()
}

const cmds = commands()
const result = () => play(content, cmds, 1)

describe("m3 valor (Solgang) scenario", () => {
  it("enters the town and resolves the duel challenge by allowing retreat", () => {
    const { state } = result()
    expect(state.mapId).toBe(TOWN)
    expect(state.facts).toContain("fact.solgang.battle-hymn")
    expect(state.deductions["deduction.valor"]!.confirmed).toBe(true)
    expect(state.abilities).toContain("ability.valor-shield")
    expect(state.crises["crisis.valor.challenge"]).toBe("option.allow-retreat")
    expect(state.flags).toContain("flag.valor.retreat-allowed")
  })

  it("fires the deduction and crisis events", () => {
    const { events } = result()
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.valor" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.valor-shield" })
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.valor.challenge", optionId: "option.allow-retreat" })
  })
})