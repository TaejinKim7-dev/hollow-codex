// Regression guard for NPC schedules (D13): an NPC position must never be what traps the player.
//
// A move into an NPC is a bump, and a bump does not advance time, so if every neighbour of the
// player's cell is a wall or an NPC at that hour, the hour never changes and the game is soft-locked
// (Dione (14,18) at 6-11h, fixed in this commit). The guard explores the real (cell, hour) state space
// of every map: from every entry point at every hour, one move = one hour, a cell is blocked when an
// NPC stands on it at the current hour (npcAt rules). Exit cells end the walk (the player leaves).
// It then requires:
//   1. every reachable state has at least one possible move (no soft-lock), and
//   2. from every reachable state some exit can still be reached (no NPC walls the player in for good),
//   3. every NPC the player could talk to with no schedules can still be talked to at some hour.
// Cells that terrain alone encloses are never reachable, so they are not flagged.
import { describe, expect, it } from "vitest"
import type { GameContent, NpcDef } from "../../../src/content/types.ts"
import { ARCHIVE_ARRIVE, ARCHIVE_MAP } from "../../../src/core/codex/codex.ts"
import { npcPositionAt } from "../../../src/core/dialogue/talk.ts"
import type { Id, Pos } from "../../../src/core/types.ts"
import { DIRS, offset, tileAt } from "../../../src/core/world/path.ts"
import { loadRealContent } from "../../scenario/play.ts"
import { testContent } from "../core/fixture.ts"

const content = loadRealContent()
const key = (p: Pos): string => `${p.x},${p.y}`

interface MapReport { traps: string[]; walledIn: string[]; unreachableNpcs: string[] }

/** Explores (cell, hour) states of one map. `npcCellAt` decides where an NPC stands at an hour. */
function exploreMap(c: GameContent, mapId: Id, npcCellAt: (npc: NpcDef, hour: number) => Pos): MapReport {
  const map = c.maps[mapId]!
  const npcs = Object.values(c.npcs).filter((n) => n.map === mapId)
  const occupied: Set<string>[] = Array.from({ length: 24 }, (_, h) => new Set(npcs.map((n) => key(npcCellAt(n, h)))))
  const walkable = (p: Pos): boolean => {
    const t = tileAt(c, mapId, p)
    return t !== null && t.walk !== null
  }
  const isExit = (p: Pos): boolean => map.exits.some((e) => e.at.x === p.x && e.at.y === p.y)

  // Entry points: every arrival into this map, the start cell, the archive arrival, and ring standing cells.
  const entries: Pos[] = []
  for (const m of Object.values(c.maps)) for (const e of m.exits) if (e.to === mapId) entries.push(e.arrive)
  if (c.start.map === mapId) entries.push(c.start.pos)
  if (mapId === ARCHIVE_MAP) entries.push(ARCHIVE_ARRIVE)
  for (const g of Object.values(c.rings)) {
    if (g.onOverworld !== mapId) continue
    for (const p of [g.at, ...DIRS.map((d) => offset(g.at, d))]) if (walkable(p) && !isExit(p)) entries.push(p)
  }

  const moves = (p: Pos, h: number): Pos[] =>
    DIRS.map((d) => offset(p, d)).filter((q) => walkable(q) && !occupied[h]!.has(key(q)))
  const sid = (p: Pos, h: number): string => `${key(p)}@${h}`

  // Forward reachability.
  const seen = new Map<string, { p: Pos; h: number }>()
  const queue: { p: Pos; h: number }[] = []
  for (const p of entries) for (let h = 0; h < 24; h++) {
    if (!seen.has(sid(p, h))) { seen.set(sid(p, h), { p, h }); queue.push({ p, h }) }
  }
  const succ = new Map<string, string[]>()
  for (let i = 0; i < queue.length; i++) {
    const { p, h } = queue[i]!
    if (isExit(p)) continue
    const nexts = moves(p, h).map((q) => ({ p: q, h: (h + 1) % 24 }))
    succ.set(sid(p, h), nexts.map((n) => sid(n.p, n.h)))
    for (const n of nexts) if (!seen.has(sid(n.p, n.h))) { seen.set(sid(n.p, n.h), n); queue.push(n) }
  }

  // States from which an exit can be reached (backwards fixpoint over the explored graph).
  const canLeave = new Set<string>([...seen.values()].filter((s) => isExit(s.p)).map((s) => sid(s.p, s.h)))
  for (let changed = map.exits.length > 0; changed; ) {
    changed = false
    for (const [id, list] of succ) if (!canLeave.has(id) && list.some((n) => canLeave.has(n))) { canLeave.add(id); changed = true }
  }

  const traps: string[] = []
  const walledIn: string[] = []
  for (const [id, s] of seen) {
    if (isExit(s.p)) continue
    if ((succ.get(id) ?? []).length === 0) traps.push(`${mapId} ${key(s.p)} at ${s.h}h`)
    else if (map.exits.length > 0 && !canLeave.has(id)) walledIn.push(`${mapId} ${key(s.p)} at ${s.h}h`)
  }
  const unreachableNpcs = Object.entries(c.npcs)
    .filter(([, n]) => n.map === mapId)
    .filter(([, n]) => ![...seen.values()].some((s) => !isExit(s.p) &&
      DIRS.some((d) => key(offset(s.p, d)) === key(npcCellAt(n, s.h)))))
    .map(([id]) => id)
  return { traps, walledIn, unreachableNpcs }
}

describe("NPC schedules never trap the player (real content)", () => {
  const maps = Object.keys(content.maps)
  const scheduled = Object.fromEntries(maps.map((m) => [m, exploreMap(content, m, npcPositionAt)]))
  const fixed = Object.fromEntries(maps.map((m) => [m, exploreMap(content, m, (n) => n.pos)]))

  it("no reachable cell is left without a single possible move at any hour", () => {
    expect(maps.flatMap((m) => scheduled[m]!.traps)).toEqual([])
  })

  it("from every reachable cell and hour the player can still get out of the map", () => {
    expect(maps.flatMap((m) => scheduled[m]!.walledIn)).toEqual([])
  })

  it("every NPC reachable without schedules can still be talked to at some hour", () => {
    const lost = maps.flatMap((m) => scheduled[m]!.unreachableNpcs.filter((id) => !fixed[m]!.unreachableNpcs.includes(id)))
    expect(lost).toEqual([])
  })

  it("the guard does see the real state space (sanity)", () => {
    expect(fixed["map.kalas"]!.unreachableNpcs).not.toContain("npc.kalas.elin")
    expect(maps.length).toBeGreaterThan(10)
  })
})

describe("the guard flags NPC-made traps and walls (fixture content)", () => {
  // fixture map.a: rows ["######", "#..,.#", "#....>", "#....#", "######"], exit (5,2), start (1,1)
  const base = testContent()
  const withNpcs = (npcs: Record<string, NpcDef>): GameContent => ({ ...base, npcs, rings: {} })
  const npc = (pos: Pos, schedule?: NpcDef["schedule"]): NpcDef =>
    ({ ...base.npcs["npc.sage"]!, pos, ...(schedule === undefined ? {} : { schedule }) })

  it("two NPCs that close the start corner at 6-11h are a trap", () => {
    const c = withNpcs({
      "npc.a": npc({ x: 3, y: 3 }, { "6": { x: 2, y: 1 } }),
      "npc.b": npc({ x: 4, y: 3 }, { "6": { x: 1, y: 2 } })
    })
    expect(exploreMap(c, "map.a", npcPositionAt).traps).toContain("map.a 1,1 at 6h")
    expect(exploreMap(c, "map.a", (n) => n.pos).traps).toEqual([])
  })

  it("an NPC that stands in front of the only exit at every hour walls the player in", () => {
    const c = withNpcs({ "npc.a": npc({ x: 4, y: 2 }) })
    expect(exploreMap(c, "map.a", npcPositionAt).walledIn.length).toBeGreaterThan(0)
  })
})
