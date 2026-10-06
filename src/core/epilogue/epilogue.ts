// Task 43 — 세 가지 에필로그 변형 (M5).
// core 순수성: 브라우저 전역·Math.random을 쓰지 않고, 입력을 바꾸지 않는 순수 함수만 둔다.
import type { Id } from "../types.ts"

/** 마지막 장에서 고른 세 원리 중 하나. */
export type EpilogueKind = "truth" | "love" | "courage"

/** 한 마을 대표가 전하는 에필로그 한 줄. */
export interface EpilogueTownMessage {
  readonly townId: Id
  readonly messageKey: string
}

/** 한 원리에 대응하는 에필로그 전체. */
export interface EpilogueEntry {
  readonly kind: EpilogueKind
  readonly titleKey: string
  readonly prologueKey: string
  readonly townMessages: ReadonlyArray<EpilogueTownMessage>
}

/** 여덟 마을(미덕)의 대표 id. 마을 이름이 아니라 미덕 슬러그로 통일한다. */
const TOWN_IDS: ReadonlyArray<Id> = [
  "honesty",
  "compassion",
  "valor",
  "justice",
  "sacrifice",
  "honor",
  "spirituality",
  "humility"
]

/** 각 원리의 마을 메시지 8개를 `epilogue.<kind>.<townId>.text` 키로 묶는다. */
function townMessages(kind: EpilogueKind): ReadonlyArray<EpilogueTownMessage> {
  return TOWN_IDS.map((townId) => ({ townId, messageKey: `epilogue.${kind}.${townId}.text` }))
}

/** 3종 에필로그 — 고른 단어에 따라 마을들이 다른 이야기를 한다 (D5, §4 매트릭스). */
export const EPILOGUES: ReadonlyArray<EpilogueEntry> = [
  {
    kind: "truth",
    titleKey: "epilogue.truth.title",
    prologueKey: "epilogue.truth.prologue",
    townMessages: townMessages("truth")
  },
  {
    kind: "love",
    titleKey: "epilogue.love.title",
    prologueKey: "epilogue.love.prologue",
    townMessages: townMessages("love")
  },
  {
    kind: "courage",
    titleKey: "epilogue.courage.title",
    prologueKey: "epilogue.courage.prologue",
    townMessages: townMessages("courage")
  }
] as const

/** 마지막 장에 고른 단어 → 에필로그 종류. 모르는 단어는 진실로 본다. */
export function selectEpilogue(word: Id): EpilogueKind {
  if (word === "word.truth") return "truth"
  if (word === "word.love") return "love"
  if (word === "word.courage") return "courage"
  return "truth"
}

/** 고른 단어에 해당하는 에필로그 전체를 돌려준다. */
export function getEpilogue(word: Id): EpilogueEntry {
  const kind = selectEpilogue(word)
  return EPILOGUES.find((e) => e.kind === kind) ?? EPILOGUES[0]!
}
