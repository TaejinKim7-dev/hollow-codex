import type { GameContent } from "../../content/types.ts"
import type { GameState, Id, StepResult } from "../types.ts"
import { addSorted } from "../state.ts"

/**
 * 열석 고리 사용 (D9, D10). 고리 칸에서 실행되는 ringStep 명령을 처리한다.
 * - 알려진 fact가 하나라도 있으면 현재 고리를 visited(정렬·중복 없음)에 기록한다.
 * - 도착 후보 = 현재 고리와 다르고, 도착 fact를 아는 고리. 결정적으로 첫 후보를 고른다.
 * - 알려진 fact가 없거나 후보가 없으면 이동하지 않는다.
 * - 모르는 고리 id는 무시(같은 state, 이벤트 0).
 */
export function ringTravel(state: GameState, ringId: Id, content: GameContent): StepResult {
  const gate = content.moongates[ringId]
  if (gate === undefined || state.rings.knownFacts.length === 0) return { state, events: [] }
  const visited = addSorted(state.rings.visited, [ringId])
  const candidates = Object.entries(content.moongates).filter(([id, g]) =>
    id !== ringId && state.rings.knownFacts.includes(g.fact)
  )
  const first = candidates[0]
  if (first === undefined) return { state: { ...state, rings: { ...state.rings, visited } }, events: [] }
  const [toId, toGate] = first
  return {
    state: {
      ...state,
      mapId: toGate.onOverworld,
      player: { ...state.player, pos: toGate.at },
      rings: { ...state.rings, visited }
    },
    events: [{ type: "ringTraveled", from: ringId, to: toId }]
  }
}