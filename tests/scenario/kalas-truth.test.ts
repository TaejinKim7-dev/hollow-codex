// Task 16 — 진실의 길 시나리오: 늑대를 밀어내고 다리를 넘은 뒤, 아이·직조공·토비의 증언으로
// 고발관장에게 진실 선택지로 위기를 푼다. 행실 없이 마쳐야 한다.
import { describe, expect, it } from "vitest"
import type { Command } from "../../src/core/types.ts"
import { makeScript, play, walkTo } from "./play.ts"
import { loadRealContent } from "./play.ts"
import { WOLF_PUSH_WIN } from "./plans.ts"

const content = loadRealContent()

// 전투 후 상태를 갖는 조립기로 명령을 만든다(걷기 경로·전투 수순 모두 실제 규칙으로 검증된 것만 쌓인다).
function truthCommands(): Command[] {
  const w = makeScript(content)
  w.push(walkTo(content, w.state(), "map.field", { x: 15, y: 8 })) // 다리 입구 → 늑대 조우
  w.push(WOLF_PUSH_WIN)                                            // 밀어내 전멸, 행실 없음
  w.meet("map.kalas", "npc.kalas.child") // 아이
  w.talk("npc.kalas.child", ["job"])                          // word.lantern
  w.meet("map.kalas", "npc.kalas.mira") // 직조공
  w.talk("npc.kalas.mira", ["word.lantern"])                  // fact.kalas.lantern-shard
  w.meet("map.kalas", "npc.kalas.tobi")  // 토비
  w.talk("npc.kalas.tobi", ["word.lantern"])                  // fact.kalas.brother-witness
  w.meet("map.kalas", "npc.kalas.warden")  // 고발관장
  w.talkWith("npc.kalas.warden", [
    { type: "resolveCrisis", crisisId: "crisis.kalas.trial", optionId: "option.truth" }
  ])
  return w.cmds()
}

const commands = truthCommands()

describe("kalas truth scenario", () => {
  it("resolveCrisis option.truth, ledger-kept, no deeds", () => {
    const { state, events } = play(content, commands, 1)
    expect(state.crises["crisis.kalas.trial"]).toBe("option.truth")
    expect(state.flags).toContain("flag.kalas.ledger-kept")
    expect(state.deeds).toEqual([])
    expect(state.clearedEncounters).toContain("enc.field.wolves")
    expect(events).toContainEqual({ type: "crisisResolved", crisisId: "crisis.kalas.trial", optionId: "option.truth" })
  })
})