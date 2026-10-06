import { describe, expect, it } from "vitest"
import { step } from "../../../src/core/step.ts"
import { at, deepFreeze, run, stateWith, testContent } from "./fixture.ts"

const c = testContent()

describe("move", () => {
  it("moves one tile and advances the turn by the terrain cost", () => {
    const grass = step(at(1, 1), { type: "move", dir: "e" }, c)           // (2,1) 풀
    expect(grass.state.player.pos).toEqual({ x: 2, y: 1 })
    expect(grass.state.turn).toBe(1)
    expect(grass.events).toEqual([{ type: "moved", pos: { x: 2, y: 1 } }])
    const bush = step(at(2, 1), { type: "move", dir: "e" }, c)            // (3,1) 덤불
    expect(bush.state.turn).toBe(2)
  })
  it("bumps into a blocking tile without moving or spending a turn", () => {
    const r = step(at(1, 1), { type: "move", dir: "n" }, c)
    expect(r.events).toEqual([{ type: "bumped" }])
    expect(r.state.player.pos).toEqual({ x: 1, y: 1 }); expect(r.state.turn).toBe(0)
    expect(r.state.player.facing).toBe("n")
  })
  it("bumps into an NPC", () => {
    expect(step(at(2, 3), { type: "move", dir: "e" }, c).events).toEqual([{ type: "bumped" }])   // (3,3) sage
  })
  it("changes map at an exit and arrives at the exit's arrive position", () => {
    const r = step(at(4, 2), { type: "move", dir: "e" }, c)
    expect(r.state.mapId).toBe("map.b"); expect(r.state.player.pos).toEqual({ x: 1, y: 1 })
    expect(r.events).toEqual([{ type: "moved", pos: { x: 5, y: 2 } }, { type: "mapChanged", mapId: "map.b" }, { type: "music", track: "music.b" }])
    expect(r.state.flags).toEqual(["flag.visited-b"])
  })
  it("entering a healing map restores hp", () => {
    const { "npc.ally": _ally, ...npcs } = c.npcs
    const healing = { ...c, npcs, maps: { ...c.maps, "map.b": { ...c.maps["map.b"]!, exits: [{ at: { x: 2, y: 1 }, to: "map.a", arrive: { x: 4, y: 2 } }] } } }
    const hurt = stateWith({ mapId: "map.b", player: { ...stateWith({}).player, pos: { x: 1, y: 1 }, hp: 2 } })
    const r = step(hurt, { type: "move", dir: "e" }, healing)
    expect(r.state.mapId).toBe("map.a"); expect(r.state.player.hp).toBe(10)
  })
  it("starts the encounter placed on the tile", () => {
    const r = step(at(1, 2), { type: "move", dir: "s" }, c)                // (1,3) enc.a
    expect(r.events.map((e) => e.type)).toEqual(["moved", "combatStarted", "music"])
    expect(r.state.combat?.encounterId).toBe("enc.a")
    expect(r.state.combat?.returnPos).toEqual({ x: 1, y: 2 })
    expect(r.state.combat?.units.map((u) => u.id)).toEqual(["player", "creature.slime#0", "creature.bandit#1"])
    const cleared = stateWith({ ...at(1, 2), clearedEncounters: ["enc.a"] })
    expect(step(cleared, { type: "move", dir: "s" }, c).state.combat).toBeNull()
  })
  it("moveTo walks the BFS path one step per command until the target", () => {
    const { state, events } = run(at(1, 1), Array(4).fill({ type: "moveTo", target: { x: 4, y: 2 } }))
    expect(state.player.pos).toEqual({ x: 4, y: 2 })
    expect(events.filter((e) => e.type === "moved")).toHaveLength(4)
    expect(step(state, { type: "moveTo", target: { x: 4, y: 2 } }, c).events).toEqual([])
  })
  it("commands other than combat are ignored during combat", () => {
    const inCombat = step(at(1, 2), { type: "move", dir: "s" }, c).state
    const r = step(deepFreeze(inCombat), { type: "move", dir: "n" }, c)
    expect(r.events).toEqual([]); expect(r.state).toBe(inCombat)
  })
})
