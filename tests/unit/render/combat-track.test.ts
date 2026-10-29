import { describe, expect, it } from "vitest"
import type { CombatState, CombatUnit, GameEvent, GameState } from "../../../src/core/types.ts"
import { createCombatTrack, type CombatFx } from "../../../src/render/combat-track.ts"

const unit = (id: string, side: "ally" | "enemy", x: number, y: number, hp: number): CombatUnit => ({
  id, side, creature: side === "enemy" ? "creature.wolf" : null, pos: { x, y }, hp, attack: 2, defending: false, moved: false, acted: false, gone: null
})

const makeCombat = (round: number, units: readonly CombatUnit[]): CombatState => ({
  encounterId: "enc.wolf",
  grid: ["...", "...", "..."],
  units,
  active: units[0]?.id ?? "player",
  round,
  intents: {},
  returnPos: { x: 0, y: 0 }
})

const makeState = (combat: CombatState | null): GameState =>
  ({ combat } as unknown as GameState)

const fakeFx = () => {
  const calls: { method: string; args: unknown[] }[] = []
  let busyValue = false
  const fx: CombatFx = {
    reset: (units) => calls.push({ method: "reset", args: [units] }),
    enqueue: (events, before, after, now, enemyPhase) => calls.push({ method: "enqueue", args: [events, before, after, now, enemyPhase] }),
    clear: () => calls.push({ method: "clear", args: [] }),
    busy: () => busyValue
  }
  return { fx, calls, setBusy: (v: boolean) => { busyValue = v } }
}

describe("createCombatTrack", () => {
  const NOW = 1234

  it("on combat start resets fx with the new combat units and keeps no linger state", () => {
    const { fx, calls } = fakeFx()
    const track = createCombatTrack(fx)
    const prev = makeState(null)
    const nextUnits = [unit("player", "ally", 1, 1, 10), unit("e0", "enemy", 1, 0, 3)]
    const next = makeState(makeCombat(1, nextUnits))
    track.apply(prev, next, [], NOW)
    expect(calls).toEqual([{ method: "reset", args: [nextUnits] }])
    expect(track.lingerState).toBeNull()
  })

  it("on combat in progress enqueues events with previous/next units, now, and enemyPhase true only when the round changes", () => {
    const { fx, calls } = fakeFx()
    const track = createCombatTrack(fx)
    const prevUnits = [unit("player", "ally", 1, 1, 10), unit("e0", "enemy", 1, 0, 3)]
    const nextUnits = [unit("player", "ally", 1, 1, 10), unit("e0", "enemy", 1, 0, 1)]
    const prev = makeState(makeCombat(1, prevUnits))
    const next = makeState(makeCombat(1, nextUnits))
    const events: GameEvent[] = [{ type: "combatHit", attacker: "player", target: "e0", amount: 2, defeated: false, hp: 1, at: { x: 1, y: 0 } }]
    track.apply(prev, next, events, NOW)
    expect(calls).toEqual([{ method: "enqueue", args: [events, prevUnits, nextUnits, NOW, false] }])
    expect(track.lingerState).toBeNull()

    calls.length = 0
    const prev2 = makeState(makeCombat(1, prevUnits))
    const next2 = makeState(makeCombat(2, nextUnits))
    track.apply(prev2, next2, events, NOW + 100)
    expect(calls).toEqual([{ method: "enqueue", args: [events, prevUnits, nextUnits, NOW + 100, true] }])
  })

  it("on combat end with a final blow retains the previous scene and enqueues the ended units", () => {
    const { fx, calls } = fakeFx()
    const track = createCombatTrack(fx)
    const prevUnits = [unit("player", "ally", 1, 1, 10), unit("e0", "enemy", 1, 0, 3)]
    const prev = makeState(makeCombat(2, prevUnits))
    const next = makeState(null)
    const events: GameEvent[] = [
      { type: "combatHit", attacker: "player", target: "e0", amount: 3, defeated: true, hp: 0, at: { x: 1, y: 0 } },
      { type: "combatEnded", outcome: "victory" }
    ]
    track.apply(prev, next, events, NOW)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.method).toBe("enqueue")
    expect(calls[0]!.args[0]).toEqual(events)
    expect(calls[0]!.args[1]).toEqual(prevUnits)
    expect(calls[0]!.args[3]).toBe(NOW)
    const ended = calls[0]!.args[2] as CombatUnit[]
    expect(ended.find((u) => u.id === "e0")!.gone).toBe("dead")

    expect(track.lingerState).not.toBeNull()
    expect(track.lingerState!.combat).not.toBeNull()
    expect(track.lingerState!.combat!.units.find((u) => u.id === "e0")!.gone).toBe("dead")
  })

  it("on combat end without a final blow (flee) clears fx and releases the retained linger state", () => {
    const { fx, calls } = fakeFx()
    const track = createCombatTrack(fx)
    const prev = makeState(makeCombat(2, [unit("player", "ally", 1, 1, 10), unit("e0", "enemy", 1, 0, 3)]))
    const next = makeState(null)
    track.apply(prev, next, [{ type: "combatEnded", outcome: "fled" }], NOW)
    expect(calls).toEqual([{ method: "clear", args: [] }])
    expect(track.lingerState).toBeNull()
  })

  it("update releases the linger state once fx is no longer busy", () => {
    const { fx, calls, setBusy } = fakeFx()
    const track = createCombatTrack(fx)
    const prevUnits = [unit("player", "ally", 1, 1, 10), unit("e0", "enemy", 1, 0, 3)]
    const prev = makeState(makeCombat(2, prevUnits))
    track.apply(prev, makeState(null), [{ type: "combatHit", attacker: "player", target: "e0", amount: 3, defeated: true, hp: 0, at: { x: 1, y: 0 } }], NOW)
    calls.length = 0
    expect(track.lingerState).not.toBeNull()
    setBusy(true)
    track.update(NOW + 500)
    expect(track.lingerState).not.toBeNull()
    expect(calls).toEqual([])
    setBusy(false)
    track.update(NOW + 1000)
    expect(track.lingerState).toBeNull()
    expect(calls).toEqual([{ method: "clear", args: [] }])
  })
})
