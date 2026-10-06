// Task 16 — 등불의 길 시나리오: 문지기·고발관장·엘린·아이에게서 단어를 모으고, 서고에서 도굴꾼을
// 격파해 사서의 편지를 받은 뒤, 세 칸 추론을 확정해 ability.see-lies를 얻고 등불 선택지로 위기를 푼다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, talk, talkWith, walkTo } from "./play.ts"
import { loadRealContent, play } from "./play.ts"
import { ROBBER_WIN, WOLF_PUSH_WIN } from "./plans.ts"

const content = loadRealContent()

function lanternCommands(): Command[] {
  const w = makeScript(content)
  w.push(walkTo(content, w.state(), "map.field", { x: 3, y: 7 }))  // 문지기
  w.push(talk("npc.field.gatekeeper", ["job", "word.pilgrim"]))     // word.pilgrim, word.truth
  w.push(walkTo(content, w.state(), "map.field", { x: 15, y: 8 }))  // 다리 → 늑대 조우
  w.push(WOLF_PUSH_WIN)                                             // 밀어내 전멸
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 3 }))  // 고발관장
  w.push(talk("npc.kalas.warden", ["job"]))                         // word.ledger, word.trial
  w.push(walkTo(content, w.state(), "map.kalas", { x: 18, y: 3 }))  // 엘린
  w.push(talk("npc.kalas.elin", ["word.ledger"]))                   // word.weapon
  w.push(walkTo(content, w.state(), "map.kalas", { x: 17, y: 14 })) // 아이
  w.push(talk("npc.kalas.child", ["job"]))                          // word.lantern
  w.push(walkTo(content, w.state(), "map.kalas", { x: 28, y: 4 }))  // 서고 입구 → 시작 (2,6)
  w.push(walkTo(content, w.state(), "map.archive", { x: 5, y: 6 })) // 복도를 지나 도굴꾼 조우
  w.push(ROBBER_WIN)                                                // 격파
  w.push(walkTo(content, w.state(), "map.archive", { x: 6, y: 4 })) // 사서
  w.push(talk("npc.kalas.librarian", ["word.pilgrim"]))             // fact.kalas.pilgrim-letter
  w.push([
    { type: "fillSlot", deductionId: "deduction.honesty", slot: 0, word: "word.truth" },
    { type: "fillSlot", deductionId: "deduction.honesty", slot: 1, word: "word.weapon" },
    { type: "fillSlot", deductionId: "deduction.honesty", slot: 2, word: "word.lantern" }
  ])                                                                 // 추론 확정
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 3 }))  // 고발관장
  w.push(talkWith("npc.kalas.warden", [
    { type: "resolveCrisis", crisisId: "crisis.kalas.trial", optionId: "option.lantern" }
  ]))
  return w.cmds()
}

const commands = lanternCommands()

describe("kalas lantern scenario", () => {
  it("resolveCrisis option.lantern, ledger-burned, see-lies, robbers cleared", () => {
    const { state, events } = play(content, commands, 1)
    expect(state.crises["crisis.kalas.trial"]).toBe("option.lantern")
    expect(state.flags).toContain("flag.kalas.ledger-burned")
    expect(state.abilities).toContain("ability.see-lies")
    expect(state.clearedEncounters).toContain("enc.archive.robbers")
    expect(state.deeds).toEqual([])
    expect(events).toContainEqual({ type: "deductionConfirmed", id: "deduction.honesty" })
    expect(events).toContainEqual({ type: "abilityUnlocked", id: "ability.see-lies" })
  })
})