import { describe, expect, it } from "vitest"
import { canRecruit, recordDeed } from "../../../src/core/virtue/conduct.ts"
import { step } from "../../../src/core/step.ts"
import { npcAt } from "../../../src/core/world/move.ts"
import type { GameEvent, GameState } from "../../../src/core/types.ts"
import { deepFreeze, stateWith, testContent } from "./fixture.ts"

const c = testContent()
const withAlly = (patch: Partial<GameState>) =>
  deepFreeze({ ...stateWith(patch), dialogue: { npcId: "npc.ally", pendingChoice: null } })

describe("conduct and companions", () => {
  it("recruit succeeds only when joinRequires facts are known", () => {
    expect(step(withAlly({}), { type: "recruit", npcId: "npc.ally" }, c).events).toEqual([])
    const r = step(withAlly({ facts: ["fact.secret"] }), { type: "recruit", npcId: "npc.ally" }, c)
    expect(r.events).toEqual([{ type: "companionJoined", npcId: "npc.ally" }])
    expect(r.state.party).toEqual(["npc.ally"]); expect(r.state.joinedAt).toEqual({ "npc.ally": 0 })
  })
  it("recruit is ignored unless talking to that NPC", () => {
    expect(step(stateWith({ facts: ["fact.secret"] }), { type: "recruit", npcId: "npc.ally" }, c).events).toEqual([])
  })
  it("a companion leaves after leaveAfterDeeds deeds against their virtue since joining", () => {
    const before = [{ virtue: "honesty", deed: "deed.lie", turn: 0 }] as const
    let s = step(withAlly({ facts: ["fact.secret"], deeds: [...before] }), { type: "recruit", npcId: "npc.ally" }, c).state
    s = recordDeed(s, c, "compassion", "deed.kill-innocent").state            // 다른 미덕 → 세지 않음
    const one = recordDeed(s, c, "honesty", "deed.lie")
    expect(one.state.party).toEqual(["npc.ally"])                                 // 가입 전 1건은 세지 않음
    const two = recordDeed(one.state, c, "honesty", "deed.lie")
    expect(two.events).toContainEqual({ type: "companionLeft", npcId: "npc.ally" })
    expect(two.state.party).toEqual([]); expect(two.state.departed).toEqual(["npc.ally"])
  })
  it("a departed companion rejoins once rejoinRequires facts are known", () => {
    const gone = withAlly({ facts: ["fact.secret"], departed: ["npc.ally"] })
    expect(step(gone, { type: "recruit", npcId: "npc.ally" }, c).events).toEqual([])
    const back = step(withAlly({ facts: ["fact.secret", "word.gamma"], departed: ["npc.ally"] }), { type: "recruit", npcId: "npc.ally" }, c)
    expect(back.state.party).toEqual(["npc.ally"]); expect(back.state.departed).toEqual([])
  })
  it("rejoining never duplicates a companion", () => {
    const s = withAlly({ facts: ["fact.secret", "word.gamma"], departed: ["npc.ally"] })
    const once = step(s, { type: "recruit", npcId: "npc.ally" }, c).state
    const twice = step(once, { type: "recruit", npcId: "npc.ally" }, c)
    expect(twice.state.party).toEqual(["npc.ally"]); expect(twice.events).toEqual([])
  })
  it("party holds at most three companions", () => {
    const ally = c.npcs["npc.ally"]!
    const crowd = { ...c, npcs: { ...c.npcs, "npc.c1": ally, "npc.c2": ally, "npc.c3": ally } }
    const full = withAlly({ facts: ["fact.secret"], party: ["npc.c1", "npc.c2", "npc.c3"], joinedAt: { "npc.c1": 0, "npc.c2": 0, "npc.c3": 0 } })
    expect(canRecruit(full, crowd, "npc.ally")).toBe(false)
    const rejected = step(full, { type: "recruit", npcId: "npc.ally" }, crowd)
    expect(rejected.events).toEqual([{ type: "companionJoinRejected", npcId: "npc.ally" }])
    expect(rejected.state).toBe(full)
  })
  it("a choice deed goes through recordDeed", () => {
    const sage = c.npcs["npc.sage"]!
    const repeatable = { ...c, npcs: { ...c.npcs, "npc.sage": { ...sage, topics: { ...sage.topics,
      "word.decoy": [{ textKey: "sage.ask", choice: sage.topics["word.decoy"]![0]!.choice! }] } } } }
    const s = deepFreeze({ ...stateWith({ facts: ["word.decoy"], party: ["npc.ally"], joinedAt: { "npc.ally": 0 } }), dialogue: { npcId: "npc.sage", pendingChoice: null } })
    const lie = [{ type: "ask", topic: "word.decoy" }, { type: "choose", optionId: "opt.lie" }] as const
    let st: GameState = s; const events: GameEvent[] = []
    for (const cmd of [...lie, ...lie]) { const r = step(st, cmd, repeatable); st = r.state; events.push(...r.events) }
    expect(events).toContainEqual({ type: "companionLeft", npcId: "npc.ally" })
    expect(st.party).toEqual([]); expect(st.departed).toEqual(["npc.ally"])
  })
  it("a party member is hidden from the map and does not block", () => {
    const s = stateWith({ mapId: "map.b", player: { ...stateWith({}).player, pos: { x: 1, y: 1 } }, party: ["npc.ally"], joinedAt: { "npc.ally": 0 } })
    expect(npcAt(s, c, { x: 2, y: 1 })).toBeNull()
    expect(step(s, { type: "move", dir: "e" }, c).state.player.pos).toEqual({ x: 2, y: 1 })
  })
})
