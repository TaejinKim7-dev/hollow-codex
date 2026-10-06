import type { GameContent } from "../../content/types.ts"
import type { GameState, Id, StepResult } from "../types.ts"
import { addSorted } from "../state.ts"

/** 위기의 선택지를 content 순서대로. missing = 모르는 requires + 미확정 requiresDeductions(정렬). */
export function crisisOptions(
  state: GameState,
  content: GameContent,
  crisisId: Id
): { optionId: Id; available: boolean; missing: Id[] }[] {
  const crisis = content.crises[crisisId]
  if (crisis === undefined) return []
  return Object.entries(crisis.options).map(([optionId, option]) => {
    const missing = [
      ...option.requires.filter((id) => !state.facts.includes(id)),
      ...option.requiresDeductions.filter((id) => state.deductions[id]?.confirmed !== true)
    ].sort()
    return { optionId, available: missing.length === 0, missing }
  })
}

/**
 * resolveCrisis 명령(D10): 위기 NPC와 대화 중이고 선택 대기가 없을 때만, 아직 풀리지 않은 위기의
 * 고를 수 있는 선택지를 적용한다. 그 밖에는 무시.
 */
export function resolveCrisis(state: GameState, crisisId: Id, optionId: Id, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  const crisis = content.crises[crisisId]
  const option = crisis?.options[optionId]
  if (crisis === undefined || option === undefined) return ignored
  if (state.crises[crisisId] !== undefined) return ignored
  if (state.dialogue === null || state.dialogue.npcId !== crisis.npc || state.dialogue.pendingChoice !== null) return ignored
  if (crisisOptions(state, content, crisisId).find((o) => o.optionId === optionId)?.available !== true) return ignored

  return {
    state: {
      ...state,
      crises: { ...state.crises, [crisisId]: optionId },
      flags: addSorted(state.flags, option.setsFlags)
    },
    events: [
      { type: "said", npcId: crisis.npc, textKey: option.textKey, lie: false },
      { type: "crisisResolved", crisisId, optionId }
    ]
  }
}
