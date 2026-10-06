import type { GameContent } from "../../content/types.ts"
import type { CombatUnit, GameState, Id, Pos } from "../types.ts"

/** 조우를 시작한다(D6, D12, D13). 예고(intents)는 Task 10이 계산한다. */
export function startCombat(state: GameState, content: GameContent, encounterId: Id, returnPos: Pos): GameState {
  const encounter = content.encounters[encounterId]
  if (!encounter) throw new Error(`unknown encounter: ${encounterId}`)
  const fresh = { defending: false, moved: false, acted: false, gone: null } as const
  const allyStats: { id: Id; hp: number; attack: number }[] = [
    { id: "player", hp: state.player.hp, attack: state.player.attack },
    ...state.party.map((id) => {
      const companion = content.npcs[id]?.companion
      if (!companion) throw new Error(`party member without companion: ${id}`)
      return { id, hp: companion.hp, attack: companion.attack }
    })
  ]
  const allies: CombatUnit[] = allyStats.flatMap((a, i) => {
    const pos = encounter.allyStart[i]
    return pos ? [{ id: a.id, side: "ally", creature: null, pos, hp: a.hp, attack: a.attack, ...fresh }] : []
  })
  const enemies: CombatUnit[] = encounter.enemies.map((e, i) => {
    const creature = content.creatures[e.creature]
    if (!creature) throw new Error(`unknown creature: ${e.creature}`)
    return { id: `${e.creature}#${i}`, side: "enemy", creature: e.creature, pos: e.at, hp: creature.hp, attack: creature.attack, ...fresh }
  })
  return {
    ...state,
    combat: { encounterId, grid: encounter.grid, units: [...allies, ...enemies], active: "player", round: 1, intents: {}, returnPos }
  }
}
