import type { GameContent } from "../../content/types.ts"
import type { Dir, Id, Pos } from "../types.ts"

export const DIRS: readonly Dir[] = ["n", "e", "s", "w"]
export const DELTA: Readonly<Record<Dir, Pos>> = { n: { x: 0, y: -1 }, e: { x: 1, y: 0 }, s: { x: 0, y: 1 }, w: { x: -1, y: 0 } }

export const offset = (p: Pos, dir: Dir): Pos => ({ x: p.x + DELTA[dir].x, y: p.y + DELTA[dir].y })

/** 지도 밖이면 null. 알 수 없는 글자는 막힌 칸(walk null)으로 본다. */
export function tileAt(content: GameContent, mapId: Id, p: Pos): { walk: number | null } | null {
  const map = content.maps[mapId]
  return map ? gridTileAt(map.rows, content.tiles, p) : null
}

/** 격자 칸의 타일. 격자 밖이면 null, 알 수 없는 글자는 막힌 칸(walk null). */
export function gridTileAt(grid: readonly string[], tiles: GameContent["tiles"], p: Pos): { walk: number | null } | null {
  if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0) return null
  const ch = grid[p.y]?.[p.x]
  if (ch === undefined) return null
  return { walk: tiles[ch]?.walk ?? null }
}

/** 지도 위 4방향 BFS. findPathOnGrid에 지도 rows를 넘긴다. */
export function findPath(content: GameContent, mapId: Id, from: Pos, to: Pos, blocked: (p: Pos) => boolean): Dir[] | null {
  const map = content.maps[mapId]
  if (!map) return null
  return findPathOnGrid(map.rows, content.tiles, from, to, blocked)
}

/** 4방향 BFS(이웃 순서 n, e, s, w), 칸 수 최단. 지형 비용은 무시한다. 출발 칸은 검사하지 않는다. */
export function findPathOnGrid(grid: readonly string[], tiles: GameContent["tiles"], from: Pos, to: Pos, blocked: (p: Pos) => boolean): Dir[] | null {
  if (from.x === to.x && from.y === to.y) return []
  const passable = (p: Pos) => {
    const tile = gridTileAt(grid, tiles, p)
    return tile !== null && tile.walk !== null && !blocked(p)
  }
  if (!passable(to)) return null
  const key = (p: Pos) => `${p.x},${p.y}`
  const came = new Map<string, { prev: Pos; dir: Dir }>([[key(from), { prev: from, dir: "n" }]])
  const queue: Pos[] = [from]
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]!
    for (const dir of DIRS) {
      const next = offset(cur, dir)
      const k = key(next)
      if (came.has(k) || !passable(next)) continue
      came.set(k, { prev: cur, dir })
      if (next.x === to.x && next.y === to.y) {
        const path: Dir[] = []
        for (let p = next; key(p) !== key(from); ) {
          const link = came.get(key(p))!
          path.push(link.dir)
          p = link.prev
        }
        return path.reverse()
      }
      queue.push(next)
    }
  }
  return null
}
