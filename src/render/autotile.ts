import type { Ground } from "../content/ground.ts"

/** 모서리 4개의 패턴("NW NE SW SE" 순, 1 = 덮어 그릴 땅) → 시트 안 칸(32px 단위). */
export type WangTable = Readonly<Record<string, { readonly col: number; readonly row: number }>>
/** NW, NE, SW, SE — true면 그 모서리가 덮어 그릴 땅. */
export type Corners = readonly [boolean, boolean, boolean, boolean]

export interface OverlayTile { readonly vx: number; readonly vy: number; readonly col: number; readonly row: number }

const keyOf = (c: Corners): string => c.map((b) => (b ? "1" : "0")).join("")

/** 모서리 패턴에 맞는 시트 칸. 덮어 그릴 땅이 하나도 없으면 null(바닥 풀만 그린다). */
export function pickWang(table: WangTable, corners: Corners): { col: number; row: number } | null {
  if (!corners.some(Boolean)) return null
  const cell = table[keyOf(corners)]
  return cell === undefined ? null : { col: cell.col, row: cell.row }
}

/**
 * 듀얼 그리드: 꼭짓점 (vx, vy) 하나가 칸 (vx-1,vy-1)·(vx,vy-1)·(vx-1,vy)·(vx,vy)를 모서리로 갖는 타일 하나가 된다.
 * 화면에서는 이 타일을 반 칸(-16px) 엇갈려 그린다. 지도 밖은 가장 가까운 안쪽 칸으로 본다(가장자리 길이 끊기지 않는다).
 */
export function overlayTiles(ground: readonly (readonly (Ground | null)[])[], kind: Ground, table: WangTable): OverlayTile[] {
  const h = ground.length
  const w = ground[0]?.length ?? 0
  const is = (x: number, y: number): boolean => ground[Math.min(h - 1, Math.max(0, y))]?.[Math.min(w - 1, Math.max(0, x))] === kind
  const out: OverlayTile[] = []
  for (let vy = 0; vy <= h; vy++) {
    for (let vx = 0; vx <= w; vx++) {
      const cell = pickWang(table, [is(vx - 1, vy - 1), is(vx, vy - 1), is(vx - 1, vy), is(vx, vy)])
      if (cell !== null) out.push({ vx, vy, col: cell.col, row: cell.row })
    }
  }
  return out
}
