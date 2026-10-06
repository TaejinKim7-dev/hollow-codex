import type { GameContent } from "../../content/types.ts"
import type { GameEvent, GameState, Id, StepResult, Virtue } from "../types.ts"

/** 플레이어를 뺀 동행 최대 수. */
export const MAX_PARTY = 3

/** 행실 1건을 기록하고, 그 미덕을 어긴 횟수가 한도에 이른 동행 동료는 떠나게 한다(D11). */
export function recordDeed(state: GameState, content: GameContent, virtue: Virtue, deed: Id): StepResult {
  const deeds = [...state.deeds, { virtue, deed, turn: state.turn }]
  const events: GameEvent[] = [{ type: "deed", virtue, deed }]
  const party: Id[] = []
  const departed = [...state.departed]
  const joinedAt = { ...state.joinedAt }
  for (const id of state.party) {
    const companion = content.npcs[id]?.companion
    const since = state.joinedAt[id] ?? 0
    const broken = companion === undefined
      ? 0
      : deeds.slice(since).filter((d) => d.virtue === companion.virtue).length
    if (companion !== undefined && broken >= companion.leaveAfterDeeds) {
      if (!departed.includes(id)) departed.push(id)
      delete joinedAt[id]
      events.push({ type: "companionLeft", npcId: id })
    } else {
      party.push(id)
    }
  }
  return { state: { ...state, deeds, party, departed, joinedAt }, events }
}

/** 영입 가능: companion 있음 ∧ 동행 중 아님 ∧ 자리 있음 ∧ (재합류/첫 합류) 조건 단서를 모두 앎. */
export function canRecruit(state: GameState, content: GameContent, npcId: Id): boolean {
  const companion = content.npcs[npcId]?.companion
  if (companion === undefined) return false
  if (state.party.includes(npcId) || state.party.length >= MAX_PARTY) return false
  const needs = state.departed.includes(npcId) ? companion.rejoinRequires : companion.joinRequires
  return needs.every((id) => state.facts.includes(id))
}

/** recruit 명령: 그 NPC와 대화 중이고 canRecruit일 때만. 아니면 무시. */
export function recruit(state: GameState, npcId: Id, content: GameContent): StepResult {
  if (state.dialogue?.npcId !== npcId || !canRecruit(state, content, npcId)) return { state, events: [] }
  return {
    state: {
      ...state,
      party: [...state.party, npcId],
      departed: state.departed.filter((id) => id !== npcId),
      joinedAt: { ...state.joinedAt, [npcId]: state.deeds.length }
    },
    events: [{ type: "companionJoined", npcId }]
  }
}
