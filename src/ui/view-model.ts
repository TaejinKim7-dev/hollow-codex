// UI 표시 전용 뷰 모델 (Task 13 PART A). DOM·렌더링 부수 효과 없음.
import type { FactKind, GameContent } from "../content/types.ts"
import type { CombatAction, GameState, Id, Pos, Virtue } from "../core/types.ts"
import { availableTopics, pickVariant } from "../core/dialogue/talk.ts"
import { crisisOptions } from "../core/crisis/crisis.ts"
import { CODEX_PAGES } from "../core/codex/codex.ts"
import { getEpilogue } from "../core/epilogue/epilogue.ts"
import { openHints } from "../core/knowledge/notebook.ts"
import { canRecruit } from "../core/virtue/conduct.ts"
import { ringHere } from "../core/world/ring.ts"
import { t } from "./strings.ts"

/** 대화 기록 한 줄. 상태에 없으므로 UI가 said 이벤트를 모아 log로 가진다. */
export interface SaidLine { readonly textKey: string; readonly lie: boolean }

export interface DialogueView {
  npcName: string
  lines: { text: string; lieMark: boolean }[]          // lieMark = lie ∧ ability.see-lies 보유
  chips: { topic: string; label: string }[]            // availableTopics, 라벨 = topic.name/job/fact.labelKey
  choices: { optionId: Id; label: string }[]           // pendingChoice가 있을 때만
  crisis: { optionId: Id; label: string; available: boolean; hints: string[] }[] | null
  canRecruit: boolean
}

export interface NotebookView {
  facts: Record<FactKind, { id: Id; label: string }[]>  // 6 kind 키 모두 존재, 각 목록은 label 정렬
  deductions: { id: Id; sentence: string; slots: (string | null)[]; confirmed: boolean; words: { id: Id; label: string }[] }[]
  hints: string[]                                       // 들른 마을의 openHints missing → hintKey 문구, 중복 제거·정렬
}

export interface CombatView {
  active: string                                        // 활성 유닛 이름(플레이어 = t("player.name"))
  actions: CombatAction["kind"][]                       // moved면 move 빠짐, flee는 가장자리만, 항상 endTurn
  units: { id: Id; name: string; hp: number; side: "ally" | "enemy"; evilKnown: boolean | null }[]
}

/** 빈 경전 인터페이스 (M5 Task 42). 8쪽 슬롯 + 마지막 장 + 에필로그 화면. */
export interface CodexView {
  /** confirmed = the virtue's deduction is confirmed; only then can the page be written (D11). */
  pages: { deductionId: Id; virtue: Virtue; title: string; answer: string | null; confirmed: boolean; words: { id: Id; label: string }[] }[]
  finalOpen: boolean
  finalWord: string | null
  finalChoices: { id: Id; label: string }[]
  /** After the final chapter: the chosen word's epilogue (title, prologue, one message per town). */
  epilogue: { title: string; prologue: string; messages: string[] } | null
}

/** 열석 고리 메뉴. here = 지금 서 있는 고리 이름(아니면 null). 이동은 고리 위에서만, 지금 고리는 목록에서 빠진다. */
export interface RingsView {
  here: string | null
  rings: { id: Id; name: string; song: string; canTravel: boolean }[]
}

export function ringsView(state: GameState, content: GameContent): RingsView {
  const s = content.strings
  const lang = state.language
  const hereId = ringHere(state, content)
  const here = hereId === null ? null : t(lang, s, content.moongates[hereId]?.nameKey ?? hereId)
  const rings = Object.entries(content.moongates)
    .filter(([id, g]) => id !== hereId && state.rings.knownFacts.includes(g.fact))
    .map(([id, g]) => ({ id, name: t(lang, s, g.nameKey), song: t(lang, s, g.songKey), canTravel: hereId !== null }))
  return { here, rings }
}

const FINAL_WORD_IDS: readonly Id[] = ["word.truth", "word.love", "word.courage"]

export function dialogueView(
  state: GameState,
  content: GameContent,
  log: readonly SaidLine[]
): DialogueView | null {
  const dialogue = state.dialogue
  const npc = dialogue === null ? undefined : content.npcs[dialogue.npcId]
  if (dialogue === null || npc === undefined) return null
  const s = content.strings
  const lang = state.language

  const seeLies = state.abilities.includes("ability.see-lies")
  const lines = log.map((line) => ({ text: t(lang, s, line.textKey), lieMark: line.lie && seeLies }))

  const chips = availableTopics(state, content, dialogue.npcId).map((topic) => ({
    topic,
    label: t(lang, s, topic === "name" ? "topic.name" : topic === "job" ? "topic.job" : `${topic}.label`)
  }))

  let choices: DialogueView["choices"] = []
  if (dialogue.pendingChoice !== null) {
    const variants = content.npcs[dialogue.npcId]?.topics[dialogue.pendingChoice]
    const variant = variants === undefined ? null : pickVariant(state, variants)
    for (const option of variant?.choice ?? []) {
      choices = [...choices, { optionId: option.optionId, label: t(lang, s, option.labelKey) }]
    }
  }

  let crisis: DialogueView["crisis"] = null
  for (const [crisisId, def] of Object.entries(content.crises)) {
    if (def.npc !== dialogue.npcId || state.crises[crisisId] !== undefined) continue
    const rows = crisisOptions(state, content, crisisId).map(({ optionId, available, missing }) => ({
      optionId,
      label: t(lang, s, def.options[optionId]?.labelKey ?? optionId),
      available,
      hints: missing.map((id) => content.facts[id]?.hintKey ?? content.deductions[id]?.hintKey)
        .filter((key): key is string => key !== undefined)
        .map((key) => t(lang, s, key))
    }))
    crisis = crisis === null ? rows : [...crisis, ...rows]
  }

  return {
    npcName: t(lang, s, npc.nameKey),
    lines,
    chips,
    choices,
    crisis,
    canRecruit: canRecruit(state, content, dialogue.npcId)
  }
}

const byLabel = (a: { readonly label: string }, b: { readonly label: string }): number =>
  a.label < b.label ? -1 : a.label > b.label ? 1 : 0

/**
 * 소문 힌트는 플레이어가 들른 마을 것만 보인다. 힌트 대상(위기 선택지 id 또는 "npcId:topic")의 NPC가 선 지도의
 * flag.town.<마을> enterFlag를 state.flags에 가졌으면 들른 것이다. 마을 깃발이 없는 지도의 힌트는 그대로 보인다.
 */
function hintTownVisited(state: GameState, content: GameContent, targetId: Id): boolean {
  let npcId: Id | undefined = targetId.includes(":") ? targetId.slice(0, targetId.indexOf(":")) : undefined
  if (npcId === undefined) {
    npcId = Object.values(content.crises).find((c) => c.options[targetId] !== undefined)?.npc
  }
  const map = npcId === undefined ? undefined : content.maps[content.npcs[npcId]?.map ?? ""]
  const townFlags = (map?.enterFlags ?? []).filter((f) => f.startsWith("flag.town."))
  return townFlags.length === 0 || townFlags.some((f) => state.flags.includes(f))
}

export function notebookView(state: GameState, content: GameContent): NotebookView {
  const s = content.strings
  const lang = state.language
  const knownOf = (kind: FactKind): { id: Id; label: string }[] =>
    state.facts
      .filter((id) => content.facts[id]?.kind === kind)
      .map((id) => ({ id, label: t(lang, s, content.facts[id]?.labelKey ?? id) }))
      .sort(byLabel)

  const facts = {
    person: knownOf("person"),
    place: knownOf("place"),
    word: knownOf("word"),
    song: knownOf("song"),
    meaning: knownOf("meaning"),
    creature: knownOf("creature")
  } satisfies Record<FactKind, { id: Id; label: string }[]>

  const deductions = Object.entries(content.deductions).map(([id, def]) => {
    const page = state.deductions[id]
    const slots = (page?.slots ?? [null, null, null]).map((w) =>
      w === null ? null : t(lang, s, content.facts[w]?.labelKey ?? w)
    )
    return {
      id,
      sentence: t(lang, s, def.sentenceKey),
      slots,
      confirmed: page?.confirmed ?? false,
      words: knownOf("word")
    }
  })

  const seen = new Set<string>()
  const hintStrings: string[] = []
  for (const hint of openHints(state, content)) {
    if (!hintTownVisited(state, content, hint.targetId)) continue
    for (const id of hint.missing) {
      const key = content.facts[id]?.hintKey ?? content.deductions[id]?.hintKey
      if (key !== undefined && !seen.has(key)) {
        seen.add(key)
        hintStrings.push(t(lang, s, key))
      }
    }
  }
  hintStrings.sort()

  return { facts, deductions, hints: hintStrings }
}

const onEdge = (grid: readonly string[], p: Pos): boolean => {
  const width = grid[0]?.length ?? 0
  return p.x === 0 || p.y === 0 || p.x === width - 1 || p.y === grid.length - 1
}

export function codexView(state: GameState, content: GameContent): CodexView {
  const s = content.strings
  const lang = state.language
  const words = state.facts
    .filter((id) => content.facts[id]?.kind === "word")
    .map((id) => ({ id, label: t(lang, s, content.facts[id]?.labelKey ?? id) }))
    .sort(byLabel)
  const pages = CODEX_PAGES.map(({ deductionId, virtue }) => {
    const written = state.codex.answers[deductionId] ?? null
    return {
      deductionId,
      virtue,
      title: t(lang, s, `archive.alcove.${virtue}.title`),
      answer: written === null ? null : t(lang, s, content.facts[written]?.labelKey ?? written),
      confirmed: state.deductions[deductionId]?.confirmed === true,
      words
    }
  })
  const finalChoices = FINAL_WORD_IDS
    .filter((id) => content.facts[id] !== undefined)
    .map((id) => ({ id, label: t(lang, s, content.facts[id]?.labelKey ?? id) }))
  const finalWord =
    state.codex.finalWord === null ? null : t(lang, s, content.facts[state.codex.finalWord]?.labelKey ?? state.codex.finalWord)
  let epilogue: CodexView["epilogue"] = null
  if (state.codex.finalWord !== null) {
    const entry = getEpilogue(state.codex.finalWord)
    epilogue = {
      title: t(lang, s, entry.titleKey),
      prologue: t(lang, s, entry.prologueKey),
      messages: entry.townMessages.map((m) => t(lang, s, m.messageKey))
    }
  }
  return { pages, finalOpen: state.codex.finalOpen, finalWord, finalChoices, epilogue }
}

export function combatView(state: GameState, content: GameContent): CombatView | null {
  const combat = state.combat
  if (combat === null) return null
  const s = content.strings
  const lang = state.language
  const actor = combat.units.find((u) => u.id === combat.active)

  const actions: CombatAction["kind"][] = ["attack", "push", "persuade", "defend"]
  if (actor !== undefined && !actor.moved) actions.push("move")
  if (actor !== undefined && onEdge(combat.grid, actor.pos)) actions.push("flee")
  actions.push("endTurn")

  const active = combat.active === "player"
    ? t(lang, s, "player.name")
    : t(lang, s, content.npcs[combat.active]?.nameKey ?? combat.active)

  const units = combat.units.map((u): CombatView["units"][number] => {
    const name = u.side === "ally"
      ? u.id === "player"
        ? t(lang, s, "player.name")
        : t(lang, s, content.npcs[u.id]?.nameKey ?? u.id)
      : t(lang, s, u.creature === null ? u.id : content.creatures[u.creature]?.nameKey ?? u.creature)
    let evilKnown: boolean | null = null
    if (u.side === "enemy" && u.creature !== null) {
      const creature = content.creatures[u.creature]
      if (creature !== undefined && state.facts.includes(creature.lore)) evilKnown = creature.evil
    }
    return { id: u.id, name, hp: u.hp, side: u.side, evilKnown }
  })

  return { active, actions, units }
}