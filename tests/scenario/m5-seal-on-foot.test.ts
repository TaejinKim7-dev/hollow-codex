// The seal opens after footprints at 7 rings (D6). Ring facts have no grant path in content yet, so
// on real content the rings can only be visited on foot; this proves the archive is reachable that way.
import { describe, expect, it } from "vitest"
import { SEAL_CELL } from "../../src/core/codex/codex.ts"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import type { GameState, Pos } from "../../src/core/types.ts"
import { DIRS, offset, tileAt } from "../../src/core/world/path.ts"
import { loadRealContent, walkTo } from "./play.ts"

const content = loadRealContent()

/** A walkable cell beside the ring stone (or the ring cell itself when it is walkable). */
function besideRing(at: Pos, mapId: string): Pos {
  if (tileAt(content, mapId, at)?.walk !== null) return at
  const cell = DIRS.map((d) => offset(at, d)).find((p) => {
    const t = tileAt(content, mapId, p)
    return t !== null && t.walk !== null && !content.maps[mapId]!.encounters.some((e) => e.at.x === p.x && e.at.y === p.y)
  })
  if (cell === undefined) throw new Error(`no cell beside ${at.x},${at.y}`)
  return cell
}

describe("m5 seal reached on foot", () => {
  it("walking to the 7 continent rings, then onto the seal, enters the sealed archive", () => {
    const base = createInitialState(content, 1)
    let state: GameState = { ...base, mapId: "map.over", player: { ...base.player, pos: { x: 14, y: 23 } } }
    const continent = Object.entries(content.rings).filter(([, g]) => g.onOverworld === "map.over")
    expect(continent).toHaveLength(7)
    for (const [, g] of continent) {
      for (const cmd of walkTo(content, state, "map.over", besideRing(g.at, "map.over"))) state = step(state, cmd, content).state
    }
    expect(state.rings.visited).toEqual(continent.map(([id]) => id).sort())
    for (const cmd of walkTo(content, state, "map.field", SEAL_CELL)) state = step(state, cmd, content).state
    expect(state.mapId).toBe("map.sealed-archive")
  })
})
