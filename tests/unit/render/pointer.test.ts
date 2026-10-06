// A tap on the canvas maps to a tile with the SAME viewport the frame was drawn with:
// the encounter grid (centred on the active unit) in combat, the map (centred on the player) otherwise.
import { describe, expect, it } from "vitest"
import { frameViewport, tileAtPointer } from "../../../src/render/viewport.ts"
import { computeViewport, TILE } from "../../../src/render/viewport.ts"
import { at, run, testContent } from "../core/fixture.ts"

const c = testContent()
const canvas = { w: 1280, h: 720 }

describe("tileAtPointer", () => {
  it("in combat, a tap on grid cell (3,2) maps to (3,2)", () => {
    // fixture: stepping south from (1,2) onto (1,3) starts enc.a (5x5 grid)
    const s = run(at(1, 2), [{ type: "move", dir: "s" }]).state
    expect(s.combat).not.toBeNull()
    const combat = s.combat!
    const active = combat.units.find((u) => u.id === combat.active)!
    const gridVp = computeViewport(canvas, 1, { w: 5, h: 5 }, active.pos)   // what drawCombat uses
    expect(frameViewport(s, c, canvas)).toEqual(gridVp)
    const size = TILE * gridVp.scale
    const px = { x: gridVp.offsetPx.x + 3 * size + size / 2, y: gridVp.offsetPx.y + 2 * size + size / 2 }
    expect(tileAtPointer(s, c, canvas, px)).toEqual({ x: 3, y: 2 })
  })

  it("in exploration, it uses the map viewport centred on the player", () => {
    const s = at(2, 2)
    const vp = computeViewport(canvas, 1, { w: 6, h: 5 }, s.player.pos)
    expect(frameViewport(s, c, canvas)).toEqual(vp)
    const size = TILE * vp.scale
    expect(tileAtPointer(s, c, canvas, { x: vp.offsetPx.x + 4 * size + 1, y: vp.offsetPx.y + 1 * size + 1 })).toEqual({ x: 4, y: 1 })
  })
})
