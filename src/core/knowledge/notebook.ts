import type { GameContent } from "../../content/types.ts"
import type { GameEvent, GameState, Id, StepResult } from "../types.ts"
import { crisisOptions } from "../crisis/crisis.ts"
import { addSorted } from "../state.ts"

/**
 * 모르는 단서만 수첩에 더한다(정렬 유지). 새로 배운 것마다 factLearned(입력 순서).
 * 그 단서를 fact로 쓰는 열석 고리(content.moongates 첫 일치)가 있으면 knownFacts에 자동 추가하고 ringUnlocked를 낸다.
 * 이미 아는 단서는 다시 배울 수 없다(변화 없음 → 이벤트 없음).
 */
export function learn(state: GameState, ids: readonly Id[], content: GameContent): StepResult {
  const fresh = [...new Set(ids)].filter((id) => !state.facts.includes(id))
  if (fresh.length === 0) return { state, events: [] }

  const events: GameEvent[] = []
  let knownFacts = state.rings.knownFacts
  for (const id of fresh) {
    events.push({ type: "factLearned", id })
    const gate = Object.entries(content.moongates).find(([, g]) => g.fact === id)
    if (gate !== undefined && !knownFacts.includes(id)) {
      knownFacts = addSorted(knownFacts, [id])
      events.push({ type: "ringUnlocked", ringId: gate[0], fact: id })
    }
  }
  const rings = knownFacts === state.rings.knownFacts ? state.rings : { ...state.rings, knownFacts }
  return { state: { ...state, facts: addSorted(state.facts, fresh), rings }, events }
}

/** 추론 페이지의 한 칸을 바꾼다. 세 칸이 정답과 순서대로 모두 같을 때만 확정한다(맞은 개수 신호 없음). */
export function fillSlot(state: GameState, deductionId: Id, slot: number, word: Id | null, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  const def = content.deductions[deductionId]
  const page = state.deductions[deductionId]
  if (def === undefined || page === undefined || page.confirmed) return ignored
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) return ignored
  if (word !== null && (!state.facts.includes(word) || content.facts[word]?.kind !== "word")) return ignored

  const slots = page.slots.map((w, i) => (i === slot ? word : w))
  const confirmed = def.answer.every((w, i) => slots[i] === w)
  const next = { ...state, deductions: { ...state.deductions, [deductionId]: { slots, confirmed } } }
  if (!confirmed) return { state: next, events: [] }

  const newAbilities = def.unlocks.filter((id) => !state.abilities.includes(id))
  return {
    state: { ...next, abilities: addSorted(state.abilities, newAbilities) },
    events: [
      { type: "deductionConfirmed", id: deductionId },
      ...newAbilities.map((id): GameEvent => ({ type: "abilityUnlocked", id })),
      { type: "sfx", name: "confirm" }
    ]
  }
}

/**
 * 소문 힌트(D17). 못 고르는 위기 선택지와, 아는 단서를 키로 가졌지만 잠긴 topic의 부족한 단서만 보여 준다.
 * 추론의 정답 단어는 절대 넣지 않는다. 부족한 추론은 추론 id로 가리킨다.
 */
export function openHints(state: GameState, content: GameContent): { targetId: Id; missing: Id[] }[] {
  const hints: { targetId: Id; missing: Id[] }[] = []

  for (const crisisId of Object.keys(content.crises)) {
    if (state.crises[crisisId] !== undefined) continue
    for (const { optionId, missing } of crisisOptions(state, content, crisisId)) {
      if (missing.length > 0) hints.push({ targetId: optionId, missing })
    }
  }

  for (const [npcId, npc] of Object.entries(content.npcs)) {
    for (const [key, variants] of Object.entries(npc.topics)) {
      if (!state.facts.includes(key) || variants.length === 0) continue
      const unknownOf = (requires: readonly Id[] | undefined) => (requires ?? []).filter((id) => !state.facts.includes(id))
      if (!variants.every((v) => unknownOf(v.requires).length > 0)) continue
      hints.push({ targetId: `${npcId}:${key}`, missing: unknownOf(variants[0]!.requires).sort() })
    }
  }

  return hints.sort((a, b) => (a.targetId < b.targetId ? -1 : a.targetId > b.targetId ? 1 : 0))
}
