// Task 16 — 규칙 검증(실제 콘텐츠): (a) 가짜 정답 추론 미확정, (b) 행실 기록/밀어내기, (c) 동료 합류·이탈·재합류, (d) 저장 중간 복원.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { createInitialState } from "../../src/core/state.ts"
import { deserialize, serialize } from "../../src/core/save/serialize.ts"
import { step } from "../../src/core/step.ts"
import { makeScript, play, talk, talkWith, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"
import { WOLF_KILL, WOLF_PUSH_WIN } from "./plans.ts"

const content = loadRealContent()

// ── (a) 가짜 정답: [word.truth, word.weapon, word.duty] → 미확정 ──────────────
function wrongWordsCommands(): Command[] {
  const w = makeScript(content)
  w.push(walkTo(content, w.state(), "map.field", { x: 3, y: 7 })) // 문지기
  w.push(talk("npc.field.gatekeeper", ["job", "word.pilgrim"]))   // word.truth
  w.push(walkTo(content, w.state(), "map.field", { x: 15, y: 8 })) // 다리
  w.push(WOLF_PUSH_WIN)
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 3 })) // 고발관장
  w.push(talk("npc.kalas.warden", ["job"]))                        // word.ledger
  w.push(walkTo(content, w.state(), "map.kalas", { x: 18, y: 3 })) // 엘린
  w.push(talk("npc.kalas.elin", ["word.ledger"]))                  // word.weapon
  w.push(walkTo(content, w.state(), "map.kalas", { x: 3, y: 11 })) // 고백관
  w.push(talk("npc.kalas.confessor", ["job"]))                     // word.duty
  w.push([
    { type: "fillSlot", deductionId: "deduction.honesty", slot: 0, word: "word.truth" },
    { type: "fillSlot", deductionId: "deduction.honesty", slot: 1, word: "word.weapon" },
    { type: "fillSlot", deductionId: "deduction.honesty", slot: 2, word: "word.duty" }
  ])
  return w.cmds()
}

// ── (c) 동료 흐름 ────────────────────────────────────────────────────────────
function companionCommands(): Command[] {
  const w = makeScript(content)
  w.push(walkTo(content, w.state(), "map.field", { x: 15, y: 8 }))  // 다리
  w.push(WOLF_PUSH_WIN)
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 3 }))  // 고발관장
  w.push(talk("npc.kalas.warden", ["job"]))                         // word.ledger
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 16 })) // 직조공
  w.push(talk("npc.kalas.mira", ["word.ledger"]))                   // fact.kalas.ledger-doubt
  w.push(walkTo(content, w.state(), "map.kalas", { x: 18, y: 3 }))  // 엘린
  w.push(talkWith("npc.kalas.elin", [{ type: "recruit", npcId: "npc.kalas.elin" }])) // 합류
  w.push(walkTo(content, w.state(), "map.kalas", { x: 28, y: 4 }))  // 서고 다녀오기
  w.push(walkTo(content, w.state(), "map.kalas", { x: 28, y: 3 }))  // flag.visited-archive 획득
  w.push(walkTo(content, w.state(), "map.kalas", { x: 3, y: 11 }))  // 고백관
  w.push(talkWith("npc.kalas.confessor", [
    { type: "ask", topic: "job" },
    { type: "choose", optionId: "option.confess-no" }               // honesty 행실 1
  ]))
  w.push(walkTo(content, w.state(), "map.kalas", { x: 17, y: 14 })) // 아이
  w.push(talk("npc.kalas.child", ["job"]))                          // word.lantern
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 16 })) // 직조공
  w.push(talk("npc.kalas.mira", ["word.lantern"]))                  // fact.kalas.lantern-shard
  w.push(walkTo(content, w.state(), "map.kalas", { x: 7, y: 20 }))  // 토비
  w.push(talk("npc.kalas.tobi", ["word.lantern"]))                  // fact.kalas.brother-witness
  w.push(walkTo(content, w.state(), "map.kalas", { x: 16, y: 3 }))  // 고발관장
  w.push(talkWith("npc.kalas.warden", [
    { type: "ask", topic: "word.trial" },
    { type: "choose", optionId: "option.deny-warden" }              // honesty 행실 2 → 엘린 이탈
  ]))
  w.push(walkTo(content, w.state(), "map.kalas", { x: 11, y: 4 }))  // 니아
  w.push(talk("npc.kalas.nia", ["word.ledger"]))                    // fact.kalas.elin-forgiven
  w.push(walkTo(content, w.state(), "map.kalas", { x: 18, y: 3 }))  // 엘린
  w.push(talkWith("npc.kalas.elin", [{ type: "recruit", npcId: "npc.kalas.elin" }])) // 재합류
  return w.cmds()
}

const wrongCommands = wrongWordsCommands()
const companionCmds = companionCommands()

describe("kalas rules (real content)", () => {
  it("(a) wrong words [truth, weapon, duty] leave the deduction unconfirmed", () => {
    const { state, events } = play(content, wrongCommands, 1)
    const page = state.deductions["deduction.honesty"]!
    expect(page.confirmed).toBe(false)
    expect(page.slots).toEqual(["word.truth", "word.weapon", "word.duty"])
    expect(events.some((e) => e.type === "deductionConfirmed")).toBe(false)
  })

  it("(b) killing a wolf records a compassion deed; pushing wolves off records none", () => {
    const killed = play(content, [
      ...walkTo(content, createInitialState(content, 1), "map.field", { x: 15, y: 8 }),
      ...WOLF_KILL
    ], 1)
    expect(killed.state.deeds).toContainEqual({ virtue: "compassion", deed: "deed.kill-innocent", turn: expect.any(Number) as number })
  })

  it("(b) pushing wolves off the bridge wins without any deed", () => {
    const pushed = play(content, [
      ...walkTo(content, createInitialState(content, 1), "map.field", { x: 15, y: 8 }),
      ...WOLF_PUSH_WIN
    ], 1)
    expect(pushed.state.deeds).toEqual([])
    expect(pushed.state.clearedEncounters).toContain("enc.field.wolves")
    expect(pushed.events.some((e) => e.type === "deed")).toBe(false)
  })

  it("(c) elin leaves after 2 honesty deeds and rejoins from nia's forgiveness", () => {
    const { state, events } = play(content, companionCmds, 1)
    expect(events.some((e) => e.type === "companionLeft" && e.npcId === "npc.kalas.elin")).toBe(true)
    expect(events.some((e) => e.type === "companionJoined" && e.npcId === "npc.kalas.elin")).toBe(true)
    expect(state.party).toEqual(["npc.kalas.elin"])
    expect(state.flags).toContain("flag.kalas.archive-asked")
    expect(state.flags).toContain("flag.kalas.warden-asked")
  })

  it("(d) a mid-run serialize/deserialize continues to the same final state", () => {
    const half = Math.floor(companionCmds.length / 2)
    const first = play(content, companionCmds.slice(0, half), 1).state
    const back = deserialize(serialize(first))
    if (!back.ok) throw new Error(back.reason)
    let s = back.state
    for (const cmd of companionCmds.slice(half)) s = step(s, cmd, content).state
    expect(s).toEqual(play(content, companionCmds, 1).state)
  })
})