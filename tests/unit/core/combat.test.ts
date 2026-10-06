import { describe, expect, it } from "vitest"
import { computeIntents } from "../../../src/core/combat/grid.ts"
import { step } from "../../../src/core/step.ts"
import type { CombatAction, CombatState, CombatUnit, GameState } from "../../../src/core/types.ts"
import { at, deepFreeze, stateWith, testContent } from "./fixture.ts"

const c = testContent()

// 헬퍼(이 파일 안): 유닛 기본값 + 교전 상태. mapId "map.a", 플레이어 위치 (1,3)(조우 칸), returnPos (1,2).
const P = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "player", side: "ally", creature: null, pos: { x, y }, hp: 10, attack: 3, ...patch }) as const
const S = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "creature.slime#0", side: "enemy", creature: "creature.slime", pos: { x, y }, hp: 4, attack: 2, ...patch }) as const
const B = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "creature.bandit#1", side: "enemy", creature: "creature.bandit", pos: { x, y }, hp: 3, attack: 4, ...patch }) as const

type UnitSeed = Pick<CombatUnit, "id" | "side" | "creature" | "pos" | "hp" | "attack"> & Partial<CombatUnit>

// combatState(units, patch?) — 각 유닛에 defending/moved/acted false, gone null을 채우고, intents = computeIntents, active = 규칙 1, round 1, grid = enc.a 격자.
function combatState(seeds: readonly UnitSeed[], patch: Partial<GameState> = {}): GameState {
  const units: CombatUnit[] = seeds.map((u) => ({ defending: false, moved: false, acted: false, gone: null, ...u }))
  const active = units.find((u) => u.side === "ally" && u.gone === null && !u.acted)?.id ?? "player"
  const base: CombatState = { encounterId: "enc.a", grid: c.encounters["enc.a"]!.grid, units, active, round: 1, intents: {}, returnPos: { x: 1, y: 2 } }
  const combat: CombatState = { ...base, intents: computeIntents(base, c) }
  const s = stateWith({})
  return deepFreeze({ ...s, player: { ...s.player, pos: { x: 1, y: 3 } }, combat, ...patch })
}
const act = (s: GameState, action: CombatAction) => step(s, { type: "combat", action }, c)
const unit = (s: GameState, id: string) => s.combat!.units.find((u) => u.id === id)!

describe("grid combat", () => {
  it("starting an encounter computes intents toward the nearest ally", () => {
    const s = step(at(1, 2), { type: "move", dir: "s" }, c).state                // 실제 시작: player (2,4), slime (2,0), bandit (4,1)
    expect(s.combat?.intents["creature.slime#0"]).toEqual({ moveTo: { x: 2, y: 3 }, attack: "player" })
  })
  it("intents are shown before the enemy acts and enemies follow them", () => {
    const s = combatState([P(2, 4), S(2, 0)])
    expect(s.combat?.intents["creature.slime#0"]).toEqual({ moveTo: { x: 2, y: 3 }, attack: "player" })
    const r = act(s, { kind: "endTurn" })
    expect(unit(r.state, "creature.slime#0").pos).toEqual({ x: 2, y: 3 })
    expect(unit(r.state, "player").hp).toBe(8)
    expect(r.state.combat?.round).toBe(2)
    expect(r.state.combat?.intents["creature.slime#0"]).toEqual({ moveTo: { x: 2, y: 3 }, attack: "player" })
  })
  it("defending halves damage rounding up", () => {
    const r = act(combatState([P(2, 4), B(2, 3)]), { kind: "defend" })
    expect(unit(r.state, "player").hp).toBe(8)                                     // ceil(4 / 2) = 2
    expect(unit(r.state, "player").defending).toBe(false)                          // 다음 차례 시작 때 풀림
  })
  it("pushing an enemy off the grid makes it retreat, not die", () => {
    const r = act(combatState([P(2, 1), S(2, 0), B(0, 4)]), { kind: "push", dir: "n" })
    expect(unit(r.state, "creature.slime#0").gone).toBe("retreated")
    expect(r.state.deeds).toEqual([])
    expect(r.events).toContainEqual({ type: "sfx", name: "push" })
  })
  it("pushing into a wall or unit deals 1 damage and stays", () => {
    const r = act(combatState([P(2, 2), S(2, 1), B(2, 0)]), { kind: "push", dir: "n" })
    expect(unit(r.state, "creature.slime#0").pos).toEqual({ x: 2, y: 1 })
    expect(unit(r.state, "creature.slime#0").hp).toBe(3)
  })
  it("killing a non-evil creature records a compassion deed", () => {
    const r = act(combatState([P(2, 1), S(2, 0, { hp: 3 }), B(4, 4)]), { kind: "attack", dir: "n" })
    expect(unit(r.state, "creature.slime#0").gone).toBe("dead")
    expect(r.state.deeds).toEqual([{ virtue: "compassion", deed: "deed.kill-innocent", turn: 0 }])
    const evil = act(combatState([P(2, 1), B(2, 0), S(4, 4)]), { kind: "attack", dir: "n" })
    expect(unit(evil.state, "creature.bandit#1").gone).toBe("dead")
    expect(evil.state.deeds).toEqual([])
  })
  it("persuade works only on a non-evil creature whose lore fact is known", () => {
    const unknown = act(combatState([P(2, 1), S(2, 0), B(4, 4)]), { kind: "persuade", dir: "n" })
    expect(unit(unknown.state, "creature.slime#0").gone).toBeNull()
    expect(unknown.state.combat?.round).toBe(2)                                    // 차례는 썼다
    const known = act(combatState([P(2, 1), S(2, 0), B(4, 4)], { facts: ["fact.slime-lore"] }), { kind: "persuade", dir: "n" })
    expect(unit(known.state, "creature.slime#0").gone).toBe("retreated")
    const evil = act(combatState([P(2, 1), B(2, 0), S(4, 4)], { facts: ["fact.bandit-lore"] }), { kind: "persuade", dir: "n" })
    expect(unit(evil.state, "creature.bandit#1").gone).toBeNull()
  })
  it("flee works only from an edge tile", () => {
    const inner = combatState([P(2, 2), S(4, 4)])
    const stay = act(inner, { kind: "flee" })
    expect(stay.state).toBe(inner); expect(stay.events).toEqual([])
    const r = act(combatState([P(0, 2), S(4, 4)]), { kind: "flee" })
    expect(r.events).toContainEqual({ type: "combatEnded", outcome: "fled" })
    expect(r.state.combat).toBeNull(); expect(r.state.player.pos).toEqual({ x: 1, y: 2 })
    expect(r.state.clearedEncounters).toEqual([])
  })
  it("combat ends in victory when no enemy remains, adds the encounter to clearedEncounters", () => {
    const r = act(combatState([P(2, 1), S(2, 0, { hp: 3 })]), { kind: "attack", dir: "n" })
    expect(r.events).toContainEqual({ type: "combatEnded", outcome: "victory" })
    expect(r.events.at(-1)).toEqual({ type: "music", track: "music.a" })
    expect(r.state.combat).toBeNull(); expect(r.state.clearedEncounters).toEqual(["enc.a"])
    expect(r.state.player.pos).toEqual({ x: 1, y: 3 }); expect(r.state.player.hp).toBe(10)
  })
  it("combat ends in defeat when every ally is gone", () => {
    const r = act(combatState([P(2, 1, { hp: 1 }), B(2, 0)]), { kind: "endTurn" })
    expect(r.events).toContainEqual({ type: "combatEnded", outcome: "defeat" })
    expect(r.state.mapId).toBe("map.a"); expect(r.state.player.pos).toEqual({ x: 1, y: 1 }); expect(r.state.player.hp).toBe(1)
    expect(r.state.clearedEncounters).toEqual([])
  })
  it("a moved unit cannot move again but can still act", () => {
    const moved = act(combatState([P(2, 4), S(0, 0)]), { kind: "move", to: { x: 2, y: 2 } }).state
    expect(unit(moved, "player")).toMatchObject({ pos: { x: 2, y: 2 }, moved: true, acted: false })
    expect(moved.combat?.active).toBe("player")
    expect(act(moved, { kind: "move", to: { x: 2, y: 1 } }).state).toBe(moved)
    expect(act(moved, { kind: "move", to: { x: 2, y: 0 } }).state).toBe(moved)   // 이미 이동함(거리와 무관)
    expect(act(moved, { kind: "defend" }).state.combat?.round).toBe(2)
  })
  it("a move farther than three tiles or onto a unit is ignored", () => {
    const s = combatState([P(2, 4), S(2, 0)])
    expect(act(s, { kind: "move", to: { x: 2, y: 0 } }).state).toBe(s)
    expect(act(s, { kind: "move", to: { x: 0, y: 1 } }).state).toBe(s)            // 거리 5
  })
})
