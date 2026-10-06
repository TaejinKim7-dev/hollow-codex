import type { GameContent, Topic } from "../../content/types.ts"
import type { Dir, GameEvent, GameState, Id, Pos, StepResult } from "../types.ts"
import { learn } from "../knowledge/notebook.ts"
import { addSorted, samePos } from "../state.ts"
import { recordDeed } from "../virtue/conduct.ts"
import { npcAt } from "../world/move.ts"
import { offset } from "../world/path.ts"

const DIRS: readonly Dir[] = ["n", "e", "s", "w"]
const UNKNOWN_KEY = "npc.default.unknown"
const CHIP_KINDS = new Set(["word", "person", "place"])

/** 대화 칩(D8): name, job, 아는 word·person·place 단서(id 정렬). npcId는 시그니처 호환용. */
export function availableTopics(state: GameState, content: GameContent, _npcId: Id): string[] {
  const known = state.facts.filter((id) => CHIP_KINDS.has(content.facts[id]?.kind ?? "")).sort()
  return ["name", "job", ...known]
}

/** 조건(requires, requiresFlags, excludeFlags)을 처음 만족하는 변형(D9). 없으면 null. */
export function pickVariant(state: GameState, variants: readonly Topic[]): Topic | null {
  return variants.find((v) =>
    (v.requires ?? []).every((id) => state.facts.includes(id)) &&
    (v.requiresFlags ?? []).every((f) => state.flags.includes(f)) &&
    !(v.excludeFlags ?? []).some((f) => state.flags.includes(f))
  ) ?? null
}

const said = (npcId: Id, textKey: string, lie: boolean): GameEvent => ({ type: "said", npcId, textKey, lie })

/** 탐험 중 interact: 인접 NPC와 대화를 연다. */
export function interact(state: GameState, at: Pos | undefined, content: GameContent): StepResult {
  let facing = state.player.facing
  let target: Pos
  if (at !== undefined) {
    const dir = DIRS.find((d) => samePos(offset(state.player.pos, d), at))
    if (dir === undefined) return { state, events: [] }
    facing = dir
    target = at
  } else {
    target = offset(state.player.pos, facing)
  }
  const turned = facing === state.player.facing ? state : { ...state, player: { ...state.player, facing } }
  const npcId = npcAt(turned, content, target)
  if (npcId === null) return { state: turned, events: [] }
  const npc = content.npcs[npcId]!
  return {
    state: { ...turned, dialogue: { npcId, pendingChoice: null } },
    events: [said(npcId, npc.greetKey, false)]
  }
}

export function ask(state: GameState, topic: string, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  const dialogue = state.dialogue
  if (dialogue === null || dialogue.pendingChoice !== null) return ignored
  if (!availableTopics(state, content, dialogue.npcId).includes(topic)) return ignored

  const { npcId } = dialogue
  const variants = content.npcs[npcId]?.topics[topic]
  const variant = variants === undefined ? null : pickVariant(state, variants)
  if (variant === null) return { state, events: [said(npcId, UNKNOWN_KEY, false)] }

  const flagged = { ...state, flags: addSorted(state.flags, variant.setsFlags ?? []) }
  const learned = learn(flagged, variant.grants ?? [])
  const next = variant.choice !== undefined
    ? { ...learned.state, dialogue: { npcId, pendingChoice: topic } }
    : learned.state
  return { state: next, events: [said(npcId, variant.textKey, variant.lie ?? false), ...learned.events] }
}

export function choose(state: GameState, optionId: Id, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  const dialogue = state.dialogue
  if (dialogue === null || dialogue.pendingChoice === null) return ignored

  const { npcId, pendingChoice } = dialogue
  const variants = content.npcs[npcId]?.topics[pendingChoice]
  const variant = variants === undefined ? null : pickVariant(state, variants)
  const option = variant?.choice?.find((o) => o.optionId === optionId)
  if (option === undefined) return ignored

  const flagged = { ...state, flags: addSorted(state.flags, option.setsFlags ?? []) }
  const learned = learn(flagged, option.grants ?? [])
  const events: GameEvent[] = [said(npcId, option.textKey, false), ...learned.events]
  let next: GameState = { ...learned.state, dialogue: { npcId, pendingChoice: null } }
  if (option.deed !== undefined) {
    const recorded = recordDeed(next, content, option.deed.virtue, option.deed.deed)
    next = recorded.state
    events.push(...recorded.events)
  }
  return { state: next, events }
}

export function endTalk(state: GameState): StepResult {
  if (state.dialogue === null) return { state, events: [] }
  return { state: { ...state, dialogue: null }, events: [] }
}
