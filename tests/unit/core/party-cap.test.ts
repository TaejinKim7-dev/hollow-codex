import { describe, expect, it } from "vitest"
import { run, stateWith } from "./fixture.ts"

// recruit 명령은 step이 대화 중일 때만 전달하므로(M1) 대화 상태를 함께 준비한다.
const talksToAlly = (patch: Parameters<typeof stateWith>[0]): ReturnType<typeof stateWith> =>
  stateWith({ ...patch, dialogue: { npcId: "npc.ally", pendingChoice: null } })

describe("party cap (max 3)", () => {
  it("accepts recruits while party has < 3 members", () => {
    // testContent's npc.ally has joinRequires:[fact.secret]
    const s = talksToAlly({ party: [], facts: ["fact.secret"] })
    const { state, events } = run(s, [{ type: "recruit", npcId: "npc.ally" }])
    expect(state.party).toContain("npc.ally")
    expect(events.some(e => e.type === "companionJoined")).toBe(true)
  })
  it("rejects 4th recruit with companionJoinRejected and no state change", () => {
    const s = talksToAlly({
      party: ["npc.a", "npc.b", "npc.c"],
      facts: ["fact.secret"],
      abilities: ["ability.see-lies"]
    })
    const before = s
    const { state, events } = run(s, [{ type: "recruit", npcId: "npc.ally" }])
    expect(state).toBe(before) // same reference
    expect(state.party).toEqual(["npc.a", "npc.b", "npc.c"])
    expect(events).toEqual([{ type: "companionJoinRejected", npcId: "npc.ally" }])
  })
  it("rejects a departed companion's rejoin attempt while party is at cap", () => {
    const s = talksToAlly({
      party: ["npc.a", "npc.b", "npc.c"],
      departed: ["npc.ally"],
      facts: ["fact.secret"],
      abilities: ["ability.see-lies"]
    })
    const { state, events } = run(s, [{ type: "recruit", npcId: "npc.ally" }])
    expect(state).toBe(s)
    expect(events).toEqual([{ type: "companionJoinRejected", npcId: "npc.ally" }])
  })
  it("does not emit companionJoinRejected for party at exactly 2", () => {
    const s = talksToAlly({
      party: ["npc.a", "npc.b"],
      facts: ["fact.secret"]
    })
    const { events } = run(s, [{ type: "recruit", npcId: "npc.ally" }])
    expect(events.some(e => e.type === "companionJoinRejected")).toBe(false)
    expect(events.some(e => e.type === "companionJoined")).toBe(true)
  })
})