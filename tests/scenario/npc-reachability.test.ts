import { describe, expect, it } from "vitest"
import { loadRealContent } from "./play.ts"

const content = loadRealContent()

/** 이 지도로 들어오는 출구의 도착 칸에서 걸어서(NPC는 무시) 닿는 칸 집합. */
function reachable(mapId: string): Set<string> {
  const map = content.maps[mapId]!
  const walk = (x: number, y: number): boolean => { const ch = map.rows[y]?.[x]; return ch !== undefined && content.tiles[ch]?.walk != null }
  const seen = new Set<string>()
  const q: { x: number; y: number }[] = []
  for (const m of Object.values(content.maps)) for (const e of m.exits) if (e.to === mapId) q.push(e.arrive)
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
