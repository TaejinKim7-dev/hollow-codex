import { describe, expect, it } from "vitest"
import type { CombatUnit, GameEvent } from "../../../src/core/types.ts"
import { endedCombatUnits } from "../../../src/render/combat-linger.ts"

const unit = (id: string, side: "ally" | "enemy", x: number, y: number, hp: number): CombatUnit => ({
  id, side, creature: null, pos: { x, y }, hp, attack: 2, defending: false, moved: false, acted: false, gone: null
})

describe("endedCombatUnits (the scene kept on screen after the last blow)", () => {
  const before = [unit("player", "ally", 2, 4, 1), unit("e0", "enemy", 2, 0, 3)]
  it("marks a unit that was defeated as dead and a yielded one as retreated", () => {
    const events: GameEvent[] = [{ type: "combatHit", attacker: "player", target: "e0", amount: 3, defeated: true, hp: 0, at: { x: 2, y: 1 } }]
    expect(endedCombatUnits(before, events).find((u) => u.id === "e0")!.gone).toBe("dead")
    const yielded = endedCombatUnits(before, [{ type: "combatYield", target: "e0", how: "persuaded" }])
    expect(yielded.find((u) => u.id === "e0")!.gone).toBe("retreated")
  })
  it("moves an enemy that walked up and killed the player to the cell it struck from (not where it started)", () => {
    const events: GameEvent[] = [{ type: "combatHit", attacker: "e0", target: "player", amount: 2, defeated: true, hp: 0, at: { x: 2, y: 3 } }]
    const after = endedCombatUnits(before, events)
    expect(after.find((u) => u.id === "e0")!.pos).toEqual({ x: 2, y: 3 })
    expect(after.find((u) => u.id === "player")!.gone).toBe("dead")
  })
  it("leaves everyone else untouched and does not mutate the input", () => {
    const events: GameEvent[] = [{ type: "combatHit", attacker: "player", target: "e0", amount: 1, defeated: false, hp: 2, at: { x: 2, y: 4 } }]
    const after = endedCombatUnits(before, events)
    expect(after.find((u) => u.id === "e0")!.gone).toBeNull()
    expect(before[1]!.gone).toBeNull()
  })
})
