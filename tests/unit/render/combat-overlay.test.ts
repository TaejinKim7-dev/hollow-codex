import { describe, expect, it } from "vitest"
import { step } from "../../../src/core/step.ts"
import { combatOverlay } from "../../../src/render/combat-overlay.ts"
import { at, testContent } from "../core/fixture.ts"

const c = testContent()
const start = () => step(at(1, 2), { type: "move", dir: "s" }, c).state          // player (2,4), slime (2,0), bandit (4,1)
const near = () => step(start(), { type: "combat", action: { kind: "move", to: { x: 2, y: 1 } } }, c).state

describe("combatOverlay", () => {
  it("is null outside combat", () => { expect(combatOverlay(at(1, 2), c)).toBeNull() })
  it("on the player's turn shows reachable cells and no targets when nothing is adjacent", () => {
    const o = combatOverlay(start(), c)!
    expect(o.reachable.length).toBeGreaterThan(0)
    expect(o.targets).toEqual([])
  })
  it("shows an attackable enemy with the damage it would take, and nothing to walk to once moved", () => {
    const o = combatOverlay(near(), c)!
    expect(o.reachable).toEqual([])
    expect(o.targets).toEqual([{ id: "creature.slime#0", pos: { x: 2, y: 0 }, amount: 3, defeated: false }])
  })
  it("is null when the active unit has acted (nothing to choose)", () => {
    const s = near()
    const acted = { ...s, combat: { ...s.combat!, units: s.combat!.units.map((u) => (u.id === "player" ? { ...u, acted: true } : u)) } }
    expect(combatOverlay(acted, c)).toBeNull()
  })
})
