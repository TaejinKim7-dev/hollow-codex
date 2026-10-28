import type { GameContent } from "../content/types.ts"
import { attackTargets, previewHit, reachableCells } from "../core/combat/preview.ts"
import type { GameState, Id, Pos } from "../core/types.ts"

export interface CombatOverlay {
  readonly reachable: readonly Pos[]
  readonly targets: readonly { readonly id: Id; readonly pos: Pos; readonly amount: number; readonly defeated: boolean }[]
}

/** 지금 조작할 수 있는 활성 아군의 이동 가능 칸과 공격 가능한 적(예상 피해 포함). 전투 중이 아니거나 이미 행동했으면 null. */
export function combatOverlay(state: GameState, content: GameContent): CombatOverlay | null {
  const combat = state.combat
  if (combat === null) return null
  const actor = combat.units.find((u) => u.id === combat.active)
  if (actor === undefined || actor.side !== "ally" || actor.gone !== null || actor.acted) return null
  return {
    reachable: reachableCells(combat, content, actor.id),
    targets: attackTargets(combat, actor.id).map((t) => ({ id: t.id, pos: t.pos, ...previewHit(combat, actor.id, t.id) }))
  }
}
