// Task 31 — M2 동행 상한 시나리오. 파티가 이미 3명(상한)일 때 네 번째 영입은 거부되고
// companionJoinRejected 이벤트만 나며 상태는 그대로다 (D5, D19).
import { describe, expect, it } from "vitest"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { MAX_PARTY } from "../../src/core/virtue/conduct.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()

/** 칼라스 마을, 엘린([18,4]) 남쪽 칸. 파티는 이미 상한(3명)으로 채워져 있다고 가정한다. */
function fullPartyAtElin() {
  const base = createInitialState(content, 1)
  return {
    ...base,
    mapId: "map.kalas",
    player: { ...base.player, pos: { x: 18, y: 5 } },
    party: ["npc.kalas.mira", "npc.kalas.nia", "npc.kalas.tobi"]
  }
}

describe("m2 party cap", () => {
  it("fills the party to the cap", () => {
    expect(fullPartyAtElin().party).toHaveLength(MAX_PARTY)
  })

  it("rejects a 4th companion with companionJoinRejected and no state change", () => {
    const opened = step(fullPartyAtElin(), { type: "interact", at: { x: 18, y: 4 } }, content)
    expect(opened.state.dialogue?.npcId).toBe("npc.kalas.elin")

    const rejected = step(opened.state, { type: "recruit", npcId: "npc.kalas.elin" }, content)
    expect(rejected.events).toContainEqual({ type: "companionJoinRejected", npcId: "npc.kalas.elin" })
    expect(rejected.state).toBe(opened.state)
    expect(rejected.state.party).toEqual(opened.state.party)
    expect(rejected.state.party).toHaveLength(MAX_PARTY)
  })
})
