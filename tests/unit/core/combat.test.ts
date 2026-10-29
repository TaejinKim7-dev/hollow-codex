import type { EncounterObjective } from "../../../src/content/types.ts"
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
const withBreath = (st: GameState, breath: number): GameState => ({ ...st, combat: { ...st.combat!, breath } })
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
  it("a repeatable encounter is not recorded as cleared, so it can be fought again", () => {
    const enc = c.encounters["enc.a"]!
    const rc = { ...c, encounters: { ...c.encounters, "enc.a": { ...enc, repeatable: true } } }
    const r = step(combatState([P(2, 1), S(2, 0, { hp: 3 })]), { type: "combat", action: { kind: "attack", dir: "n" } }, rc)
    expect(r.events).toContainEqual({ type: "combatEnded", outcome: "victory" })
    expect(r.state.clearedEncounters).toEqual([])
  })
  describe("C-2: direction, chain", () => {
    const M = (x: number, y: number, patch: Partial<CombatUnit> = {}) => ({ id: "npc.mate", side: "ally", creature: null, pos: { x, y }, hp: 8, attack: 4, ...patch }) as const
    it("hitting an enemy from behind hurts more than from the front (facing decides)", () => {
      const front = act(combatState([P(2, 1), S(2, 0, { hp: 9, facing: "s" }), B(4, 4)]), { kind: "attack", dir: "n" })
      const back = act(combatState([P(2, 1), S(2, 0, { hp: 9, facing: "n" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(unit(front.state, "creature.slime#0").hp).toBe(6)   // 3 × 1.0
      expect(unit(back.state, "creature.slime#0").hp).toBe(4)   // round(3 × 1.5) = 5
    })
    it("a teammate next to the target adds a chain hit (event with chain 1), and can finish it", () => {
      const r = act(combatState([P(2, 1), M(1, 0), S(2, 0, { hp: 5, facing: "s" }), B(4, 4)]), { kind: "attack", dir: "n" })
      const hits = r.events.filter((e) => e.type === "combatHit")
      expect(hits).toHaveLength(2)
      expect(hits[0]).toMatchObject({ attacker: "player", amount: 3, defeated: false, hp: 2 })
      expect(hits[1]).toMatchObject({ attacker: "npc.mate", chain: 1, defeated: true, hp: 0 })   // mate 4 × side(1.25) → 5 × 0.5 = 2.5 → 3 ≥ 2
      expect(unit(r.state, "creature.slime#0").gone).toBe("dead")
    })
    it("no chain when the main hit already defeats, and none from a teammate who is not adjacent to the target", () => {
      expect(act(combatState([P(2, 1), M(1, 0), S(2, 0, { hp: 3 }), B(4, 4)]), { kind: "attack", dir: "n" }).events.filter((e) => e.type === "combatHit")).toHaveLength(1)
      expect(act(combatState([P(2, 1), M(0, 3), S(2, 0, { hp: 9 }), B(4, 4)]), { kind: "attack", dir: "n" }).events.filter((e) => e.type === "combatHit")).toHaveLength(1)
    })
    it("the attacker turns to face the target, and a move turns the unit toward its last step", () => {
      expect(unit(act(combatState([P(2, 1), S(2, 0, { hp: 9 }), B(4, 4)]), { kind: "attack", dir: "n" }).state, "player").facing).toBe("n")
      expect(unit(act(combatState([P(2, 3), S(2, 0), B(4, 4)]), { kind: "move", to: { x: 3, y: 3 } }).state, "player").facing).toBe("e")
    })
  })
  describe("C-3a: momentum and special", () => {
    const withMomentum = (st: GameState, momentum: number): GameState => ({ ...st, combat: { ...st.combat!, momentum } })
    const M2 = (x: number, y: number) => ({ id: "npc.mate", side: "ally", creature: null, pos: { x, y }, hp: 8, attack: 4 }) as const
    it("a front hit gives no momentum; a flank/back hit gives 1; a chain hit and a defeat add more", () => {
      const front = act(combatState([P(2, 1), S(2, 0, { hp: 9, facing: "s" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(front.state.combat!.momentum ?? 0).toBe(0)
      const back = act(combatState([P(2, 1), S(2, 0, { hp: 9, facing: "n" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(back.state.combat!.momentum).toBe(1)
      const chained = act(combatState([P(2, 1), M2(1, 0), S(2, 0, { hp: 5, facing: "s" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(chained.state.combat!.momentum).toBe(2)   // chain hit 1 + defeat 1
    })
    it("special needs a full gauge and an adjacent enemy; it hits ×2, splashes adjacent enemies, and empties the gauge", () => {
      const base = combatState([P(2, 1), S(2, 0, { hp: 20, facing: "s" }), { ...S(3, 0, { hp: 20 }), id: "creature.slime#7" }, B(4, 4)])
      const early = act(withMomentum(base, 5), { kind: "special", dir: "n" })
      expect(early.events).toEqual([])
      expect(early.state.combat!.momentum).toBe(5)
      const r = act(withMomentum(base, 6), { kind: "special", dir: "n" })
      const hits = r.events.filter((e) => e.type === "combatHit")
      expect(hits[0]).toMatchObject({ attacker: "player", target: "creature.slime#0", amount: 6, special: true })   // 3 × 2
      expect(hits[1]).toMatchObject({ target: "creature.slime#7", amount: 3, special: true })                          // round(6 × 0.5)
      expect(r.state.combat!.momentum).toBe(0)
      expect(r.state.combat!.round).toBe(2)   // the only ally acted, so the enemy phase ran
    })
  })
  describe("C-4: morale", () => {
    it("a hit lowers the enemy's morale by the damage, plus 1 for a flank or back hit", () => {
      const front = act(combatState([P(2, 1), S(2, 0, { hp: 9, morale: 9, maxMorale: 9, facing: "s" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(unit(front.state, "creature.slime#0").morale).toBe(5)   // 9 − 3 hit − 1 isolation (the enemy phase ran: the player is the only ally)
      const back = act(combatState([P(2, 1), S(2, 0, { hp: 9, morale: 9, maxMorale: 9, facing: "n" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(unit(back.state, "creature.slime#0").morale).toBe(2)   // 9 − (5 damage + 1 flank) − 1 isolation
    })
    it("persuading without the lore fact only works once the morale is at or below half", () => {
      const high = act(combatState([P(2, 1), S(2, 0, { hp: 4, morale: 4, maxMorale: 4 }), B(4, 4)]), { kind: "persuade", dir: "n" })
      expect(unit(high.state, "creature.slime#0").gone).toBeNull()
      const low = act(combatState([P(2, 1), S(2, 0, { hp: 4, morale: 2, maxMorale: 4 }), B(4, 4)]), { kind: "persuade", dir: "n" })
      expect(unit(low.state, "creature.slime#0").gone).toBe("retreated")
      expect(low.events).toContainEqual({ type: "combatYield", target: "creature.slime#0", how: "persuaded" })
    })
    it("an evil enemy whose morale reaches 0 retreats instead of fighting on; a non-evil one stays", () => {
      const evil = act(combatState([P(2, 1, { attack: 1 }), B(2, 0, { hp: 5, morale: 1, maxMorale: 5, facing: "s" }), S(4, 4)]), { kind: "attack", dir: "n" })
      expect(unit(evil.state, "creature.bandit#1").gone).toBe("retreated")
      expect(evil.events).toContainEqual({ type: "combatYield", target: "creature.bandit#1", how: "retreated" })
      const kind = act(combatState([P(2, 1, { attack: 1 }), S(2, 0, { hp: 5, morale: 1, maxMorale: 5, facing: "s" }), B(4, 4)]), { kind: "attack", dir: "n" })
      expect(unit(kind.state, "creature.slime#0").gone).toBeNull()
    })
    it("a lone enemy loses morale each round (isolation)", () => {
      const s0 = combatState([P(2, 1), S(2, 4, { hp: 9, morale: 5, maxMorale: 5 }), B(0, 4, { hp: 9, morale: 5, maxMorale: 5 })])
      const r = act(s0, { kind: "endTurn" })               // enemy phase runs, round 2; both are ≥3 apart → both isolated
      expect(unit(r.state, "creature.slime#0").morale).toBe(4)
      expect(unit(r.state, "creature.bandit#1").morale).toBe(4)
    })
    it("an evil enemy whose morale hits 0 in the enemy phase (isolation) retreats at once and ends the fight", () => {
      const s0 = combatState([P(2, 3), B(2, 0, { hp: 9, morale: 1, maxMorale: 3 })])
      const r = act(s0, { kind: "endTurn" })
      expect(r.events).toContainEqual({ type: "combatYield", target: "creature.bandit#1", how: "retreated" })
      expect(r.events).toContainEqual({ type: "combatEnded", outcome: "victory" })
      expect(r.state.combat).toBeNull()
    })
    it("starting a fight fills each enemy's morale from the creature (default = its hp)", () => {
      const s = step(at(1, 2), { type: "move", dir: "s" }, c).state
      const e = s.combat!.units.find((u) => u.side === "enemy")!
      expect(e.morale).toBe(e.hp); expect(e.maxMorale).toBe(e.hp)
    })
  })
  describe("C-4: objectives", () => {
    const withObjective = (objective: EncounterObjective) => ({ ...c, encounters: { ...c.encounters, "enc.a": { ...c.encounters["enc.a"]!, objective } } })
    it("survive: the fight is won when the round counter passes the limit, enemies or not", () => {
      const cc = withObjective({ kind: "survive", rounds: 2 })
      const s0 = combatState([P(2, 3), S(2, 0, { hp: 99 }), B(4, 0, { hp: 99 })])
      const r1 = step(s0, { type: "combat", action: { kind: "endTurn" } }, cc)
      expect(r1.state.combat).not.toBeNull()                          // round 2 starts: still going
      const r2 = step(r1.state, { type: "combat", action: { kind: "endTurn" } }, cc)
      expect(r2.events).toContainEqual({ type: "combatEnded", outcome: "victory" })
      expect(r2.state.combat).toBeNull()
    })
    it("escape: an ally stepping onto the exit cell wins at once", () => {
      const cc = withObjective({ kind: "escape", at: { x: 3, y: 3 } })
      const r = step(combatState([P(2, 3), S(2, 0, { hp: 99 })]), { type: "combat", action: { kind: "move", to: { x: 3, y: 3 } } }, cc)
      expect(r.events).toContainEqual({ type: "combatEnded", outcome: "victory" })
    })
    it("without an objective the fight still needs every enemy gone", () => {
      const r = act(combatState([P(2, 3), S(2, 0, { hp: 99 })]), { kind: "move", to: { x: 3, y: 3 } })
      expect(r.state.combat).not.toBeNull()
    })
  })
  describe("C-3b: breath and skills", () => {
    const learned = (st: GameState, ...abilities: string[]): GameState => ({ ...st, abilities })
    const act2 = (st: GameState, action: CombatAction) => step(st, { type: "combat", action }, c)
    const M3 = (x: number, y: number) => ({ id: "npc.mate", side: "ally", creature: null, pos: { x, y }, hp: 8, attack: 4 }) as const
    it("a fight starts with the starting breath and each round restores some, up to the max", () => {
      const s = step(at(1, 2), { type: "move", dir: "s" }, c).state
      expect(s.combat!.breath).toBe(2)
      const r = act2(withBreath(combatState([P(2, 3), S(2, 0, { hp: 9 }), B(0, 0, { hp: 9 })]), 5), { kind: "endTurn" })
      expect(r.state.combat!.breath).toBe(5)                                   // already at max
      expect(act2(withBreath(combatState([P(2, 3), S(2, 0, { hp: 9 }), B(0, 0, { hp: 9 })]), 2), { kind: "endTurn" }).state.combat!.breath).toBe(3)
    })
    it("calm lowers an adjacent enemy's morale by calmLoss, costs 1 breath, and needs the ability", () => {
      const base = withBreath(combatState([P(2, 1), S(2, 0, { hp: 9, morale: 9, maxMorale: 9 }), B(4, 4)]), 2)
      expect(act2(base, { kind: "skill", skill: "calm", dir: "n" }).events).toEqual([])           // no ability yet
      const r = act2(learned(base, "ability.compassion-persuade"), { kind: "skill", skill: "calm", dir: "n" })
      expect(unit(r.state, "creature.slime#0").morale).toBe(5)                                      // 9 − 3 calm − 1 isolation (enemy phase ran)
      expect(r.state.combat!.breath).toBe(2)                                                        // 2 − 1 cost + 1 regen
    })
    it("without enough breath a skill is ignored", () => {
      const base = learned(withBreath(combatState([P(2, 1), S(2, 0, { hp: 9, morale: 9, maxMorale: 9 }), B(4, 4)]), 0), "ability.compassion-persuade")
      expect(act2(base, { kind: "skill", skill: "calm", dir: "n" }).events).toEqual([])
    })
    it("guard puts the actor and adjacent allies on defend", () => {
      const base = learned(withBreath(combatState([P(2, 3), M3(1, 3), S(2, 0, { hp: 9 }), B(4, 0, { hp: 9 })]), 2), "ability.valor-shield")
      const r = act2(base, { kind: "skill", skill: "guard" })
      expect(unit(r.state, "player").defending).toBe(true)
      expect(unit(r.state, "npc.mate").defending).toBe(true)
      expect(r.state.combat!.breath).toBe(1)                                                        // the mate has not acted yet, so no enemy phase / regen
    })
    it("mark makes the next hit on that enemy hurt more (×1.5)", () => {
      const M4 = { id: "npc.mate", side: "ally", creature: null, pos: { x: 1, y: 0 }, hp: 8, attack: 4 } as const
      const base = learned(withBreath(combatState([P(2, 1), M4, S(2, 0, { hp: 30, facing: "s" }), B(4, 4)]), 3), "ability.justice-eye")
      const marked = act2(base, { kind: "skill", skill: "mark", dir: "n" })
      expect(unit(marked.state, "creature.slime#0").marked).toBe(true)
      const hit = act2(marked.state, { kind: "attack", dir: "e" }).events.find((e) => e.type === "combatHit")
      expect(hit).toMatchObject({ amount: 8 })                                                      // 4 × side 1.25 × mark 1.5 = 7.5 → 8
    })
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

describe("startCombat maxHp", () => {
  it("records each unit's full hp so a wounded player starts with a partly filled bar", () => {
    const s = step(at(1, 2), { type: "move", dir: "s" }, c).state
    const wounded = { ...s.combat!, units: s.combat!.units }
    expect(wounded.units.find((u) => u.id === "player")!.maxHp).toBe(s.player.maxHp)
    expect(wounded.units.find((u) => u.side === "enemy")!.maxHp).toBe(wounded.units.find((u) => u.side === "enemy")!.hp)
  })
})
