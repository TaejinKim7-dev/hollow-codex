import { describe, expect, it } from "vitest"
import { ARCHIVE_ARRIVE, ARCHIVE_MAP } from "../../src/core/codex/codex.ts"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()

/** 이 지도로 들어오는 출구의 도착 칸에서 걸어서(NPC는 무시) 닿는 칸 집합. */
function reachable(mapId: string): Set<string> {
  const map = content.maps[mapId]!
  const walk = (x: number, y: number): boolean => { const ch = map.rows[y]?.[x]; return ch !== undefined && content.tiles[ch]?.walk != null }
  const seen = new Set<string>()
  const q: { x: number; y: number }[] = []
  for (const m of Object.values(content.maps)) for (const e of m.exits) if (e.to === mapId) q.push(e.arrive)
  if (mapId === ARCHIVE_MAP) q.push(ARCHIVE_ARRIVE)   // 봉인 서고는 출구가 아니라 봉인석으로 들어온다
  while (q.length > 0) {
    const p = q.pop()!
    const k = `${p.x},${p.y}`
    if (seen.has(k) || !walk(p.x, p.y)) continue
    seen.add(k)
    q.push({ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 })
  }
  return seen
}

describe("NPC schedules never put someone where the player cannot walk up to them", () => {
  it("every schedule slot of every NPC has a reachable neighbouring cell (trees or walls must not seal a building door)", () => {
    const bad: string[] = []
    const cache = new Map<string, Set<string>>()
    for (const [id, npc] of Object.entries(content.npcs)) {
      const seen = cache.get(npc.map) ?? reachable(npc.map)
      cache.set(npc.map, seen)
      const slots = npc.schedule === undefined ? [{ hour: "-", pos: npc.pos }] : Object.entries(npc.schedule).map(([hour, pos]) => ({ hour, pos }))
      for (const s of slots) {
        const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${s.pos.x + dx!},${s.pos.y + dy!}`))
        if (!ok) bad.push(`${id} @${s.hour}h ${s.pos.x},${s.pos.y}`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe("maps connect", () => {
  it("every exit and every encounter cell can be reached on foot from where the player arrives, and every map can be reached from the start", () => {
    const bad: string[] = []
    const cache = new Map<string, Set<string>>()
    const seenOf = (mapId: string): Set<string> => { const c = cache.get(mapId) ?? reachable(mapId); cache.set(mapId, c); return c }
    const near = (seen: Set<string>, p: { x: number; y: number }): boolean => seen.has(`${p.x},${p.y}`) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${p.x + dx!},${p.y + dy!}`))
    for (const [id, map] of Object.entries(content.maps)) {
      const seen = seenOf(id)
      // 시작 지도는 시작 칸에서도 걸어 닿는다
      if (id === content.start.map) seen.add(`${content.start.pos.x},${content.start.pos.y}`)
      for (const e of map.exits) if (!near(seen, e.at)) bad.push(`${id}: exit at ${e.at.x},${e.at.y} unreachable`)
      for (const en of map.encounters) if (!near(seen, en.at)) bad.push(`${id}: encounter ${en.id} at ${en.at.x},${en.at.y} unreachable`)
    }
    const reached = new Set<string>([content.start.map]); const q = [content.start.map]
    while (q.length > 0) { const m = content.maps[q.pop()!]!; for (const e of m.exits) if (!reached.has(e.to)) { reached.add(e.to); q.push(e.to) } }
    for (const id of Object.keys(content.maps)) if (!reached.has(id) && id !== "map.sealed-archive") bad.push(`${id}: no path of exits from the start`)
    expect(bad).toEqual([])
  })
})
