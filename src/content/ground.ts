import type { Pos } from "../core/types.ts"

/** 땅 종류. 풀이 기본이고 나머지는 풀 위에 덮어 그린다(floor는 서고 같은 풀 없는 지도의 바닥). */
export type Ground = "grass" | "path" | "water" | "stone" | "floor"
export const GROUNDS: readonly Ground[] = ["grass", "path", "water", "stone", "floor"]

export interface ObjectDef {
  /** `assets/sprites/objects/` 아래 PNG 경로(확장자 없이), 예: "kalas/house". 발자국 아래 가운데에 맞춰 그린다. */
  readonly image: string
  readonly footprint: readonly [number, number]   // [칸 폭, 칸 높이]
  readonly blocks: boolean
  /** 깊이 정렬에 쓰는 발 줄을 아래 줄에서 몇 칸 위로 잡을지(기본 0). 걸어 들어가는 큰 물건(열석 고리)이 안에 선 사람을 가리지 않게 한다. */
  readonly sortOffset: number
}

/** 물건 발자국이 차지한 칸이 합쳐진 뒤의 "걷지 못함" 글리프(사설 영역 문자). tiles에 `walk: null`로 자동 등록된다. */
export const BLOCKER = ""

export interface ObjectPlacement { readonly id: string; readonly at: Pos }

/**
 * 물건 발자국을 rows에 합친다. at은 발자국의 왼쪽 아래 칸. 막는 물건(blocks)만 BLOCKER로 바꾼다.
 * 지도 밖으로 나가거나 모르는 물건 id면 errors에 적고 그 물건은 건너뛴다.
 */
export function mergeObjectFootprints(
  rows: readonly string[],
  placements: readonly ObjectPlacement[],
  defs: Readonly<Record<string, ObjectDef>>
): { rows: string[]; errors: string[] } {
  const grid = rows.map((r) => [...r])
  const errors: string[] = []
  for (const p of placements) {
    const def = defs[p.id]
    if (def === undefined) { errors.push(`unknown object "${p.id}"`); continue }
    const [w, h] = def.footprint
    const x0 = p.at.x, y0 = p.at.y - h + 1
    if (x0 < 0 || y0 < 0 || x0 + w > (grid[0]?.length ?? 0) || p.at.y >= grid.length) {
      errors.push(`object "${p.id}" at [${p.at.x}, ${p.at.y}] is outside the map`)
      continue
    }
    if (!def.blocks) continue
    for (let y = y0; y <= p.at.y; y++) for (let x = x0; x < x0 + w; x++) (grid[y] as string[])[x] = BLOCKER
  }
  return { rows: grid.map((r) => r.join("")), errors }
}

/**
 * 풀이 아닌 두 땅이 (대각선 포함) 맞닿으면 오류. 한쪽이라도 exempt("x,y")이면 허용한다(다리 아래).
 * 땅이 없는 칸(null, 옛 그림 타일)은 무시한다.
 */
export function checkGroundAdjacency(ground: readonly (readonly (Ground | null)[])[], exempt: ReadonlySet<string>): string[] {
  const errors: string[] = []
  for (let y = 0; y < ground.length; y++) {
    const row = ground[y] ?? []
    for (let x = 0; x < row.length; x++) {
      const a = row[x] ?? null
      if (a === null || a === "grass") continue
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]] as const) {
        const b = ground[y + dy]?.[x + dx] ?? null
        if (b === null || b === "grass" || b === a) continue
        if (exempt.has(`${x},${y}`) || exempt.has(`${x + dx},${y + dy}`)) continue
        errors.push(`ground adjacency: ${a} next to ${b} at (${x},${y})`)
      }
    }
  }
  return errors
}
