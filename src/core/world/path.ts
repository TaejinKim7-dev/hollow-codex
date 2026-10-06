import type { GameContent, MapDef } from "../../content/types.ts"
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

/** 지도 위 4방향 경로 탐색. 오버월드(isOverworld)는 terrainCost 비용을 따르고, 그 외는 M1의 BFS(걸음 수 최단)를 쓴다. */
export function findPath(content: GameContent, mapId: Id, from: Pos, to: Pos, blocked: (p: Pos) => boolean): Dir[] | null {
  const map = content.maps[mapId]
  if (!map) return null
  if (map.isOverworld === true) return findPathOnMap(map, content.tiles, from, to, blocked)
  return findPathOnGrid(map.rows, content.tiles, from, to, blocked)
}

/** 오버월드 맵의 4방향 Dijkstra. terrainCost(글리프 → 비용, null = 통행 불가)를 따른다.
 *  terrainCost에 없는 글리프는 walkable이면 비용 1, 아니면 통행 불가로 본다. 출발 칸은 검사하지 않는다. */
export function findPathOnMap(map: MapDef, tiles: GameContent["tiles"], from: Pos, to: Pos, blocked: (p: Pos) => boolean): Dir[] | null {
  if (from.x === to.x && from.y === to.y) return []
  const costOf = (ch: string): number | null => {
    const t = map.terrainCost
    if (t !== undefined) {
      const c = t[ch]
      if (c !== undefined) return c
    }
    const walk = tiles[ch]?.walk
    return walk === null || walk === undefined ? null : 1
  }
  const passCost = (p: Pos): number | null => {
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0) return null
    const ch = map.rows[p.y]?.[p.x]
    if (ch === undefined) return null
    const c = costOf(ch)
    return c === null || c === undefined || c <= 0 || blocked(p) ? null : c
  }
  if (passCost(to) === null) return null
  const key = (p: Pos) => `${p.x},${p.y}`
  const goalKey = key(to)
  const startKey = key(from)
  const dist = new Map<string, number>([[startKey, 0]])
  const came = new Map<string, { prev: Pos; dir: Dir }>()
  const heap: { cost: number; p: Pos }[] = []
  const heapPush = (cost: number, p: Pos): void => {
    heap.push({ cost, p })
    let i = heap.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if ((heap[parent]?.cost ?? 0) <= (heap[i]?.cost ?? 0)) break
      const child = heap[i]!
      heap[i] = heap[parent]!
      heap[parent] = child
      i = parent
    }
  }
  const heapPop = (): { cost: number; p: Pos } | null => {
    const top = heap[0] ?? null
    const last = heap.pop()
    if (heap.length > 0 && last !== undefined) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let smallest = i
        if (l < heap.length && (heap[l]?.cost ?? 0) < (heap[smallest]?.cost ?? 0)) smallest = l
        if (r < heap.length && (heap[r]?.cost ?? 0) < (heap[smallest]?.cost ?? 0)) smallest = r
        if (smallest === i) break
        const small = heap[smallest]!
        heap[smallest] = heap[i]!
        heap[i] = small
        i = smallest
      }
    }
    return top
  }
  heapPush(0, from)
  let reached = false
  while (heap.length > 0) {
    const cur = heapPop()
    if (cur === null) break
    const curKey = key(cur.p)
    if (dist.get(curKey) !== cur.cost) continue
    if (curKey === goalKey) {
      reached = true
      break
    }
    for (const dir of DIRS) {
      const next = offset(cur.p, dir)
      const w = passCost(next)
      if (w === null) continue
      const nk = key(next)
      const nd = cur.cost + w
      if (nd < (dist.get(nk) ?? Number.POSITIVE_INFINITY)) {
        dist.set(nk, nd)
        came.set(nk, { prev: cur.p, dir })
        heapPush(nd, next)
      }
    }
  }
  if (!reached) return null
  const path: Dir[] = []
  for (let p: Pos | null = to; p !== null && key(p) !== startKey; ) {
    const link = came.get(key(p))
    if (link === undefined) return null
    path.push(link.dir)
    p = link.prev
  }
  return path.reverse()
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
