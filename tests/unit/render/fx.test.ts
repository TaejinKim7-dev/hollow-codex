import { describe, expect, it } from "vitest"
import type { CombatUnit, GameEvent } from "../../../src/core/types.ts"
import { createFx } from "../../../src/render/fx.ts"

const unit = (id: string, side: "ally" | "enemy", x: number, y: number, hp: number, patch: Partial<CombatUnit> = {}): CombatUnit => ({
  id, side, creature: side === "enemy" ? "creature.slime" : null, pos: { x, y }, hp, attack: 3, defending: false, moved: false, acted: false, gone: null, ...patch
})
const hit = (attacker: string, target: string, amount: number, hp: number, defeated = false): GameEvent => ({ type: "combatHit", attacker, target, amount, defeated, hp, at: { x: 0, y: 0 } })
const T0 = 1000
const mag = (v: { x: number; y: number }) => Math.hypot(v.x, v.y)

/** player (2,1) hits slime (2,0): hp 4 → 1 */
function oneHit() {
  const player = unit("player", "ally", 2, 1, 10)
  const before = [player, unit("e0", "enemy", 2, 0, 4)]
  const after = [player, unit("e0", "enemy", 2, 0, 1)]
  const fx = createFx()
  fx.reset(before)
  fx.enqueue([hit("player", "e0", 3, 1)], before, after, T0)
  return { fx, before, after }
}

describe("fx: idle", () => {
  it("with nothing queued everything is empty/zero and not busy", () => {
    const fx = createFx()
    fx.reset([unit("player", "ally", 2, 1, 10)])
    const f = fx.sample(T0)
    expect(f.shake).toEqual({ x: 0, y: 0 })
    expect(f.units).toEqual({})
    expect(f.floats).toEqual([]); expect(f.slashes).toEqual([]); expect(f.sparks).toEqual([]); expect(f.ghosts).toEqual([]); expect(f.banner).toBeNull()
    expect(f.hp["player"]).toEqual({ shown: 10, trail: 10, max: 10 })
    expect(fx.busy(T0)).toBe(false)
    expect(fx.takeCues(T0)).toEqual([])
  })
})

describe("fx: one attack (410 ms: windup 100, lunge 80, impact at 180, hit-stop 70, return 80, tail 80)", () => {
  it("the attacker winds up away from the target, lunges 0.55 cell toward it at impact, holds, then returns", () => {
    const { fx } = oneHit()
    expect(fx.sample(T0 + 50).units["player"]!.dy).toBeGreaterThan(0)          // target is north → wind up south
    expect(fx.sample(T0 + 180).units["player"]!.dy).toBeCloseTo(-0.55, 2)
    expect(fx.sample(T0 + 220).units["player"]!.dy).toBeCloseTo(-0.55, 2)      // hit-stop: held
    expect(Math.abs(fx.sample(T0 + 290).units["player"]!.dy)).toBeLessThan(0.55)
    expect(fx.sample(T0 + 420).units["player"]?.dy ?? 0).toBeCloseTo(0, 5)
  })
  it("the target flashes white at impact, fades within ~120 ms, and is knocked back along the blow", () => {
    const { fx } = oneHit()
    expect(fx.sample(T0 + 170).units["e0"]?.flash ?? 0).toBe(0)
    expect(fx.sample(T0 + 180).units["e0"]!.flash).toBeCloseTo(1, 2)
    expect(fx.sample(T0 + 310).units["e0"]?.flash ?? 0).toBe(0)
    expect(fx.sample(T0 + 200).units["e0"]!.dy).toBeLessThan(0)                // pushed away from attacker (north)
  })
  it("the screen shakes at impact proportionally to damage (capped) and settles", () => {
    const { fx } = oneHit()
    expect(mag(fx.sample(T0 + 100).shake)).toBe(0)
    expect(mag(fx.sample(T0 + 181).shake)).toBeGreaterThan(5)
    expect(mag(fx.sample(T0 + 181).shake)).toBeLessThanOrEqual(6.01)
    expect(mag(fx.sample(T0 + 400).shake)).toBe(0)
  })
  it("a damage number rises from the target, then disappears", () => {
    const { fx } = oneHit()
    expect(fx.sample(T0 + 100).floats).toEqual([])
    const [f] = fx.sample(T0 + 300).floats
    expect(f).toMatchObject({ text: "-3", kind: "normal" })
    expect(f!.age).toBeGreaterThan(0.1); expect(f!.age).toBeLessThan(0.4)
    expect(f!.y).toBeLessThan(0)                                              // above the target cell (target y = 0)
    expect(fx.sample(T0 + 900).floats).toEqual([])
  })
  it("a slash arc and six sparks appear at the target for a short time", () => {
    const { fx } = oneHit()
    expect(fx.sample(T0 + 200).slashes).toHaveLength(1)
    expect(fx.sample(T0 + 200).slashes[0]).toMatchObject({ x: 2, y: 0, dir: "n" })
    expect(fx.sample(T0 + 200).sparks).toHaveLength(6)
    expect(fx.sample(T0 + 700).slashes).toEqual([]); expect(fx.sample(T0 + 700).sparks).toEqual([])
  })
  it("the hp bar keeps the old value until impact, drops over 250 ms, and a trail follows later", () => {
    const { fx } = oneHit()
    expect(fx.sample(T0 + 179).hp["e0"]!.shown).toBe(4)
    const mid = fx.sample(T0 + 180 + 125).hp["e0"]!
    expect(mid.shown).toBeGreaterThan(1); expect(mid.shown).toBeLessThan(4)
    const done = fx.sample(T0 + 180 + 250).hp["e0"]!
    expect(done.shown).toBe(1); expect(done.trail).toBeGreaterThan(1); expect(done.max).toBe(4)
    expect(fx.sample(T0 + 2000).hp["e0"]).toEqual({ shown: 1, trail: 1, max: 4 })
  })
  it("stays busy until its last effect is over (the damage number lives to impact + 600), and offers exactly one sound cue at impact", () => {
    const { fx } = oneHit()
    expect(fx.busy(T0 + 400)).toBe(true); expect(fx.busy(T0 + 700)).toBe(true); expect(fx.busy(T0 + 781)).toBe(false)
    expect(fx.takeCues(T0 + 179)).toEqual([])
    expect(fx.takeCues(T0 + 181)).toEqual([{ at: T0 + 180, amount: 3, index: 0, defeated: false }])
    expect(fx.takeCues(T0 + 500)).toEqual([])
  })
})

describe("fx: sequences and kills", () => {
  it("sampling during the 410 ms sequence does not cut the damage number short", () => {
    const { fx } = oneHit()
    fx.sample(T0 + 430)                                                             // past the sequencing step, inside the number's life
    expect(fx.sample(T0 + 500).floats).toHaveLength(1)
    expect(fx.sample(T0 + 500).hp["e0"]!.trail).toBeGreaterThan(1)                  // the trail is still catching up
  })
  it("a killed target's ghost fades to the end even though the sequence step is shorter", () => {
    const player = unit("player", "ally", 2, 1, 10)
    const before = [player, unit("e0", "enemy", 2, 0, 3)]
    const after = [player, unit("e0", "enemy", 2, 0, 0, { gone: "dead" })]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([hit("player", "e0", 3, 0, true)], before, after, T0)
    fx.sample(T0 + 420)
    expect(fx.sample(T0 + 500).ghosts[0]!.alpha).toBeGreaterThan(0)
    expect(fx.busy(T0 + 500)).toBe(true)
  })
  it("two attacks in one batch play one after the other, 410 ms apart, with rising cue indexes", () => {
    const player = unit("player", "ally", 2, 1, 10)
    const e0 = unit("e0", "enemy", 2, 0, 4)
    const before = [player, e0]
    const after = [{ ...player, hp: 8 }, { ...e0, hp: 1 }]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([hit("player", "e0", 3, 1), hit("e0", "player", 2, 8)], before, after, T0)
    expect(fx.takeCues(T0 + 5000).map((c) => [c.at, c.index])).toEqual([[T0 + 180, 0], [T0 + 410 + 180, 1]])
    expect(fx.busy(T0 + 1000)).toBe(true); expect(fx.busy(T0 + 411 + 781)).toBe(false)
  })
  it("a batch queued while another is playing starts after it", () => {
    const { fx, before, after } = oneHit()
    fx.enqueue([hit("player", "e0", 1, 0)], after, before, T0 + 100)
    expect(fx.takeCues(T0 + 5000).map((c) => c.at)).toEqual([T0 + 180, T0 + 410 + 180])
  })
  it("a killed target stays visible as a ghost until impact + 100 ms, then fades over 300 ms and is gone", () => {
    const player = unit("player", "ally", 2, 1, 10)
    const before = [player, unit("e0", "enemy", 2, 0, 3)]
    const after = [player, unit("e0", "enemy", 2, 0, 0, { gone: "dead" })]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([hit("player", "e0", 3, 0, true)], before, after, T0)
    // sample() assumes time only moves forward (it tidies finished effects), so ask in order
    expect(fx.sample(T0).ghosts.map((g) => [g.unit.id, g.alpha])).toEqual([["e0", 1]])
    expect(fx.sample(T0 + 180).floats[0]).toMatchObject({ text: "-3", kind: "defeat" })
    expect(fx.sample(T0 + 180 + 100 + 150).ghosts[0]!.alpha).toBeCloseTo(0.5, 1)
    expect(fx.sample(T0 + 180 + 100 + 300).ghosts).toEqual([])
  })
  it("a creature that yields (persuaded / pushed out) also fades out, without a damage number", () => {
    const player = unit("player", "ally", 2, 1, 10)
    const before = [player, unit("e0", "enemy", 2, 0, 4)]
    const after = [player, unit("e0", "enemy", 2, 0, 4, { gone: "retreated" })]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([{ type: "combatYield", target: "e0", how: "persuaded" }], before, after, T0)
    expect(fx.sample(T0 + 100).ghosts[0]!.alpha).toBe(1)
    expect(fx.sample(T0 + 100).floats).toEqual([])
    expect(fx.sample(T0 + 1000).ghosts).toEqual([])
  })
})

describe("fx: movement, banner, clear, determinism", () => {
  it("a unit whose cell changed slides there over 160 ms (offset = old − new, shrinking to 0)", () => {
    const before = [unit("player", "ally", 2, 4, 10)]
    const after = [unit("player", "ally", 2, 1, 10, { moved: true })]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([], before, after, T0)
    expect(fx.sample(T0).units["player"]).toMatchObject({ dx: 0, dy: 3 })
    expect(fx.sample(T0 + 80).units["player"]!.dy).toBeGreaterThan(0); expect(fx.sample(T0 + 80).units["player"]!.dy).toBeLessThan(3)
    expect(fx.sample(T0 + 160).units["player"]?.dy ?? 0).toBe(0)
    expect(fx.busy(T0 + 150)).toBe(true); expect(fx.busy(T0 + 161)).toBe(false)
  })
  it("attacks wait for the slides of the same batch (enemy phase: walk, then strike)", () => {
    const player = unit("player", "ally", 2, 4, 10)
    const before = [player, unit("e0", "enemy", 2, 0, 4)]
    const after = [{ ...player, hp: 8 }, unit("e0", "enemy", 2, 3, 4)]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([hit("e0", "player", 2, 8)], before, after, T0)
    expect(fx.takeCues(T0 + 5000)[0]!.at).toBe(T0 + 160 + 180)
  })
  it("an enemy attacker raises the enemy-turn banner around its action; an ally attack does not", () => {
    const player = unit("player", "ally", 2, 1, 10)
    const e0 = unit("e0", "enemy", 2, 0, 4)
    const fx = createFx(); fx.reset([player, e0])
    fx.enqueue([hit("e0", "player", 2, 8)], [player, e0], [{ ...player, hp: 8 }, e0], T0)
    expect(fx.sample(T0 + 100).banner?.text).toBe("enemy")
    expect(fx.sample(T0 + 2000).banner).toBeNull()
    expect(oneHit().fx.sample(T0 + 100).banner).toBeNull()
  })
  it("in one batch the enemy phase starts after the ally's blow: banner and enemy slide wait 410 ms", () => {
    const player = unit("player", "ally", 2, 4, 10)
    const e0 = unit("e0", "enemy", 2, 2, 4)
    const before = [player, e0]
    const after = [{ ...player, hp: 8 }, { ...unit("e0", "enemy", 2, 3, 3) }]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([hit("player", "e0", 1, 3), hit("e0", "player", 2, 8)], before, after, T0)
    expect(fx.sample(T0 + 100).banner).toBeNull()
    expect(fx.sample(T0 + 100).units["e0"]?.dy).toBeCloseTo(-1, 1)             // still standing on its old cell (offset = old − new)
    expect(fx.sample(T0 + 410 + 80).units["e0"]!.dy).toBeGreaterThan(-1)       // now sliding
    expect(fx.sample(T0 + 410 + 100).banner?.text).toBe("enemy")
    expect(fx.takeCues(T0 + 5000).map((c) => c.at)).toEqual([T0 + 180, T0 + 410 + 160 + 180])
  })
  it("enemies that only walk (no attack) still get the banner and a slide after the ally's action", () => {
    const player = unit("player", "ally", 2, 4, 10)
    const before = [player, unit("e0", "enemy", 2, 0, 4)]
    const after = [player, unit("e0", "enemy", 2, 3, 4)]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([], before, after, T0, true)
    expect(fx.sample(T0 + 50).banner?.text).toBe("enemy")
    expect(fx.sample(T0).units["e0"]).toMatchObject({ dy: -3 })
  })
  it("a push in the middle of the player's turn (no enemy phase) slides the unit at once and raises no banner", () => {
    const player = unit("player", "ally", 2, 4, 10)
    const before = [player, unit("e0", "enemy", 2, 2, 4)]
    const after = [player, unit("e0", "enemy", 2, 1, 4)]
    const fx = createFx(); fx.reset(before)
    fx.enqueue([], before, after, T0, false)
    expect(fx.sample(T0 + 50).banner).toBeNull()
    expect(fx.sample(T0).units["e0"]).toMatchObject({ dy: 1 })
  })
  it("clear() drops everything, including pending cues", () => {
    const { fx } = oneHit()
    fx.clear()
    expect(fx.sample(T0 + 200).units).toEqual({}); expect(fx.sample(T0 + 200).floats).toEqual([]); expect(fx.sample(T0 + 200).hp).toEqual({})
    expect(fx.takeCues(T0 + 5000)).toEqual([]); expect(fx.busy(T0 + 100)).toBe(false)
  })
  it("same input, same output (no randomness)", () => {
    expect(oneHit().fx.sample(T0 + 230)).toEqual(oneHit().fx.sample(T0 + 230))
  })
})

describe("fx speed", () => {
  it("a faster fx runs the same timeline in proportionally less time", () => {
    const player = unit("player", "ally", 2, 1, 10)
    const before = [player, unit("e0", "enemy", 2, 0, 4)]
    const after = [player, unit("e0", "enemy", 2, 0, 1)]
    const mk = (speed: number) => { const fx = createFx(speed); fx.reset(before); fx.enqueue([hit("player", "e0", 3, 1)], before, after, T0); return fx }
    const endOf = (fx: ReturnType<typeof mk>): number => { let t = T0; while (fx.busy(t)) t += 5; return t - T0 }
    const slow = endOf(mk(1)), fast = endOf(mk(1.5))
    expect(fast).toBeLessThan(slow * 0.75)
    const f = mk(1.5)
    expect(f.takeCues(T0 + 120 - 1)).toHaveLength(0)
    expect(f.takeCues(T0 + 120 + 1)).toHaveLength(1)
  })
})

describe("fx: chain hits", () => {
  const player = unit("player", "ally", 2, 1, 10)
  const mate = unit("mate", "ally", 1, 0, 10)
  const before = [player, mate, unit("e0", "enemy", 2, 0, 6)]
  const after = [player, mate, unit("e0", "enemy", 2, 0, 1)]
  const chainHit: GameEvent = { type: "combatHit", attacker: "mate", target: "e0", amount: 2, defeated: false, hp: 1, at: { x: 1, y: 0 }, chain: 1 }
  const mk = () => { const fx = createFx(); fx.reset(before); fx.enqueue([hit("player", "e0", 3, 3), chainHit], before, after, T0); return fx }

  it("a chain hit follows the main hit sooner than a normal full attack would, and raises the sound index", () => {
    const fx = mk()
    const cues = fx.takeCues(T0 + 2000)
    expect(cues).toHaveLength(2)
    expect(cues[1]!.index).toBe(1)
    expect(cues[1]!.at - cues[0]!.at).toBeLessThan(410)
    expect(cues[1]!.at - cues[0]!.at).toBeGreaterThan(150)
  })
  it("shows a chain counter float (kind chain, text = hit number) once the chain hit lands", () => {
    const fx = mk()
    const t = T0 + 250 + 200
    const chain = fx.sample(t).floats.filter((f) => f.kind === "chain")
    expect(chain).toHaveLength(1)
    expect(chain[0]!.text).toBe("2")
  })
  it("the chain attacker lunges toward the target too", () => {
    const fx = mk()
    expect(Math.hypot(fx.sample(T0 + 250 + 160).units["mate"]!.dx, fx.sample(T0 + 250 + 160).units["mate"]!.dy)).toBeGreaterThan(0.2)
  })
})

describe("fx: special", () => {
  const player = unit("player", "ally", 2, 1, 10)
  const before = [player, unit("e0", "enemy", 2, 0, 9), unit("e1", "enemy", 3, 0, 9)]
  const after = [player, unit("e0", "enemy", 2, 0, 3), unit("e1", "enemy", 3, 0, 6)]
  const sp = (target: string, amount: number, hp: number): GameEvent => ({ type: "combatHit", attacker: "player", target, amount, defeated: false, hp, at: { x: 2, y: 1 }, special: true })
  const mk = (speed = 1) => { const fx = createFx(speed); fx.reset(before); fx.enqueue([sp("e0", 6, 3), sp("e1", 3, 6)], before, after, T0); return fx }

  it("raises a special banner first and holds the strike until it has shown", () => {
    const fx = mk()
    expect(fx.sample(T0 + 100).banner).toEqual({ text: "special", alpha: expect.any(Number) })
    expect(fx.sample(T0 + 100).units["player"]).toBeUndefined()
    expect(fx.takeCues(T0 + 300)).toHaveLength(0)
    expect(fx.takeCues(T0 + 1500)).toHaveLength(2)
  })
  it("a special impact shakes harder than a normal one with the same damage", () => {
    const normal = oneHit().fx
    const shakeNormal = Math.max(...Array.from({ length: 30 }, (_, i) => mag(normal.sample(T0 + 180 + i * 6).shake)))
    const fx = mk(); const hold = 350
    const shakeSpecial = Math.max(...Array.from({ length: 30 }, (_, i) => mag(fx.sample(T0 + hold + 180 + i * 6).shake)))
    expect(shakeSpecial).toBeGreaterThan(shakeNormal)
  })
  it("both victims show their damage numbers at impact", () => {
    const fx = mk()
    expect(fx.sample(T0 + 350 + 200).floats.map((f) => f.text).sort()).toEqual(["-3", "-6"])
  })
})

describe("fx: hp bar max", () => {
  it("uses the unit's maxHp so a wounded unit's bar is not drawn full", () => {
    const fx = createFx()
    fx.reset([unit("player", "ally", 2, 1, 3, { maxHp: 12 })])
    expect(fx.sample(T0).hp["player"]).toEqual({ shown: 3, trail: 3, max: 12 })
  })
})
