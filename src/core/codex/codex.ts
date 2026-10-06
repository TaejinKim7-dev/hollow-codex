// Task 42 — 봉인 서고 + 빈 경전 코어 로직 (M5).
// core 순수성: 브라우저 전역·Math.random을 쓰지 않고, 입력 state를 바꾸지 않은 새 객체를 돌려준다.
import type { GameContent } from "../../content/types.ts"
import type { GameState, Id, Pos, StepResult, Virtue } from "../types.ts"
import { samePos } from "../state.ts"

/** 봉인석이 놓인 map.field의 셀. 칼라스 고리 안쪽 중앙 (D1, D9). */
export const SEAL_CELL: Pos = { x: 7, y: 7 }
/** 봉인석이 있는 지도. */
export const SEAL_MAP: Id = "map.field"
/** 봉인 서고 지도와 플레이어가 들어서는 셀. */
export const ARCHIVE_MAP: Id = "map.sealed-archive"
export const ARCHIVE_ARRIVE: Pos = { x: 8, y: 1 }

/** 빈 경전의 8쪽 = 여덟 미덕. 순서가 곧 벽감 순서 (D10, D11). */
export const CODEX_PAGES: readonly { readonly deductionId: Id; readonly virtue: Virtue }[] = [
  { deductionId: "deduction.honesty", virtue: "honesty" },
  { deductionId: "deduction.compassion", virtue: "compassion" },
  { deductionId: "deduction.valor", virtue: "valor" },
  { deductionId: "deduction.justice", virtue: "justice" },
  { deductionId: "deduction.sacrifice", virtue: "sacrifice" },
  { deductionId: "deduction.honor", virtue: "honor" },
  { deductionId: "deduction.spirituality", virtue: "spirituality" },
  { deductionId: "deduction.humility", virtue: "humility" }
] as const

/** 빈 경전이 쓰는 8개 추론 id (선언적). */
export const CODEX_DEDUCTION_IDS: readonly Id[] = CODEX_PAGES.map((p) => p.deductionId)

/** 한 쪽이 받는 단어. content(deduction.yaml의 codexWord)에서 온다. 컴파일러가 정답 단어 중 하나인지 확인한다. */
export function codexWordOf(content: GameContent, deductionId: Id): Id | null {
  return content.deductions[deductionId]?.codexWord ?? null
}

/** 마지막 장의 답 → 에필로그 종류 (§4 매트릭스). */
export const EPILOGUE_BY_WORD: Readonly<Record<Id, "truth" | "love" | "courage">> = {
  "word.truth": "truth",
  "word.love": "love",
  "word.courage": "courage"
}

/** 봉인 해제 조건: 열석 고리 7개를 모두 밟았는가 (D6). */
export function checkArchiveUnlocked(state: GameState, _content: GameContent): boolean {
  return state.rings.visited.length >= 7
}

/** 봉인석 위에 섰고 봉인이 풀렸으면 서고 도착지를 돌려준다. 아니면 null. */
export function enterSealedArchive(
  state: GameState,
  content: GameContent,
  playerPos: Pos,
  currentMapId: Id
): { readonly mapId: Id; readonly pos: Pos } | null {
  if (currentMapId !== SEAL_MAP) return null
  if (!samePos(SEAL_CELL, playerPos)) return null
  if (!checkArchiveUnlocked(state, content)) return null
  return { mapId: ARCHIVE_MAP, pos: ARCHIVE_ARRIVE }
}

/**
 * 빈 경전 한 쪽을 적는다(D11: 이미 추론 확정한 것). 다음을 모두 만족할 때만 적고, 아니면 무시(같은 state, 이벤트 0):
 * 봉인 서고 안이다 · 그 미덕의 추론을 확정했다 · 그 단어를 안다 · 그 쪽의 codexWord(content)와 같다.
 * 이미 적힌 쪽, 모든 쪽이 적힌 뒤, 마지막 장을 고른 뒤에도 무시한다.
 */
export function writeCodex(state: GameState, deductionId: Id, word: Id, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  if (state.codex.finalWord !== null) return ignored
  if (state.mapId !== ARCHIVE_MAP) return ignored
  if (!CODEX_DEDUCTION_IDS.includes(deductionId)) return ignored
  if (state.deductions[deductionId]?.confirmed !== true) return ignored
  if (!state.facts.includes(word)) return ignored
  if (codexWordOf(content, deductionId) !== word) return ignored
  if (state.codex.answers[deductionId] !== undefined) return ignored
  if (CODEX_DEDUCTION_IDS.every((id) => state.codex.answers[id] !== undefined)) return ignored
  const answers = { ...state.codex.answers, [deductionId]: word }
  const finalOpen = CODEX_DEDUCTION_IDS.every((id) => answers[id] !== undefined)
  return {
    state: { ...state, codex: { ...state.codex, answers, finalOpen } },
    events: [{ type: "codexWritten", deductionId, word }]
  }
}

/**
 * 마지막 장을 쓴다. 8쪽이 다 적혀 finalOpen이고, 고른 단어가 세 원리 중 하나일 때만.
 * 선택과 함께 에필로그 종류를 이벤트로 알린다 (D13, D16).
 */
export function writeFinal(state: GameState, word: Id, _content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  if (!state.codex.finalOpen) return ignored
  if (state.codex.finalWord !== null) return ignored
  const kind = EPILOGUE_BY_WORD[word]
  if (kind === undefined) return ignored
  return {
    state: { ...state, codex: { ...state.codex, finalWord: word } },
    events: [{ type: "codexFinalChosen", word }, { type: "epilogue", kind }]
  }
}
