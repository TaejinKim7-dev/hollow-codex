import type { GameContent } from "../content/types.ts"
import type { GameState, Id, Pos } from "./types.ts"

export function createInitialState(content: GameContent, seed: number): GameState {
  const { start } = content
  return {
    version: 1,
    rng: seed >>> 0,
    turn: 0,
    mapId: start.map,
    player: { pos: start.pos, facing: "s", hp: start.hp, maxHp: start.hp, attack: start.attack },
    facts: [],
    deductions: Object.fromEntries(Object.keys(content.deductions).map((id) => [id, { slots: [null, null, null], confirmed: false }])),
    abilities: [],
    deeds: [],
    party: [],
    departed: [],
    joinedAt: {},
    crises: {},
    flags: [],
    dialogue: null,
    combat: null,
    clearedEncounters: []
  }
}

/** 정렬·중복 없는 목록에 항목을 더한다. 새로 더할 게 없으면 같은 배열을 돌려준다. */
export function addSorted(list: readonly Id[], items: readonly Id[]): readonly Id[] {
  const missing = items.filter((id) => !list.includes(id))
  if (missing.length === 0) return list
  return [...new Set([...list, ...missing])].sort()
}

export const samePos = (a: Pos, b: Pos): boolean => a.x === b.x && a.y === b.y
