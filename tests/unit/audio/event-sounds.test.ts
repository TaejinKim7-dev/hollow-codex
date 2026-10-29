import { describe, expect, it } from "vitest"
import type { Command, GameEvent } from "../../../src/core/types.ts"
import { eventSounds } from "../../../src/audio/event-sounds.ts"

const combat = (action: { kind: "defend" } | { kind: "endTurn" }): Command => ({ type: "combat", action })
const move: Command = { type: "move", dir: "n" }

describe("eventSounds", () => {
  it("plays the door sound on a map change but not when a ring trip changes the map", () => {
    expect(eventSounds([{ type: "mapChanged", mapId: "map.a" }], move)).toEqual(["map_change"])
    expect(eventSounds([{ type: "ringTraveled", from: "a", to: "b" }, { type: "mapChanged", mapId: "map.a" }], move)).toEqual([])
  })
  it("maps combat start and the three endings", () => {
    expect(eventSounds([{ type: "combatStarted", encounterId: "e" }], move)).toEqual(["combat_start"])
    expect(eventSounds([{ type: "combatEnded", outcome: "victory" }], move)).toEqual(["victory"])
    expect(eventSounds([{ type: "combatEnded", outcome: "defeat" }], move)).toEqual(["defeat"])
    expect(eventSounds([{ type: "combatEnded", outcome: "fled" }], move)).toEqual(["flee"])
  })
  it("maps story events", () => {
    const ev = (e: GameEvent) => eventSounds([e], move)
    expect(ev({ type: "companionJoined", npcId: "n" })).toEqual(["companion_join"])
    expect(ev({ type: "companionLeft", npcId: "n" })).toEqual(["companion_leave"])
    expect(ev({ type: "ringUnlocked", ringId: "r", fact: "f" })).toEqual(["ring_unlock"])
    expect(ev({ type: "abilityUnlocked", id: "a" })).toEqual(["ability"])
    expect(ev({ type: "crisisResolved", crisisId: "c", optionId: "o" })).toEqual(["crisis"])
    expect(ev({ type: "codexWritten", deductionId: "d", word: "w" })).toEqual(["codex_write"])
    expect(ev({ type: "epilogue", kind: "truth" })).toEqual(["epilogue"])
  })
  it("plays persuade only when a creature was actually persuaded, and defend on the defend command", () => {
    expect(eventSounds([{ type: "combatYield", target: "t", how: "persuaded" }], combat({ kind: "endTurn" }))).toEqual(["persuade"])
    expect(eventSounds([{ type: "combatYield", target: "t", how: "retreated" }], combat({ kind: "endTurn" }))).toEqual([])
    expect(eventSounds([], combat({ kind: "defend" }))).toEqual(["defend"])
    expect(eventSounds([], combat({ kind: "endTurn" }))).toEqual([])
  })
})
