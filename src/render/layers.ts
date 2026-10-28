export interface Drawable {
  readonly kind: "object" | "npc" | "player"
  readonly footX: number
  readonly footY: number
  readonly id: string
}

const KIND_RANK: Readonly<Record<Drawable["kind"], number>> = { object: 0, npc: 1, player: 2 }

/** 그리는 순서: 발이 선 칸의 y가 클수록 나중, 같으면 물건 → NPC → 플레이어, 그다음 footX, id. 입력은 바뀌지 않는다. */
export function sortDrawables<T extends Drawable>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => a.footY - b.footY || KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.footX - b.footX || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )
}
