// Task 42 — 봉인 서고 + 빈 경전 코어 로직 (M5). TDD: 실패 먼저.
import { describe, expect, it } from "vitest"
import type { GameContent } from "../../../src/content/types.ts"
import {
  ARCHIVE_MAP,
  CODEX_DEDUCTION_IDS,
  CODEX_PAGES,
  SEAL_CELL,
  checkArchiveUnlocked,
  enterSealedArchive,
  writeCodex,
  writeFinal
} from "../../../src/core/codex/codex.ts"
import { step } from "../../../src/core/step.ts"
import type { GameState } from "../../../src/core/types.ts"
import { stateWith, testContent } from "./fixture.ts"

/** Test-only page words (the real ones are codexWord in each town deduction.yaml). */
const PAGE_WORD: Readonly<Record<string, string>> = {
  honesty: "word.truth", compassion: "word.love", valor: "word.courage", justice: "word.truth",
  sacrifice: "word.devotion", honor: "word.honor", spirituality: "word.truth", humility: "word.silence"
}
const wordOf = (deductionId: string): string => PAGE_WORD[deductionId.replace("deduction.", "")]!
const base = testContent()
const c: GameContent = {
  ...base,
  deductions: {
    ...base.deductions,
    ...Object.fromEntries(CODEX_PAGES.map((p) => {
      const w = wordOf(p.deductionId)
      return [p.deductionId, { sentenceKey: "s", hintKey: "h", answer: [w, w, w] as const, unlocks: [], codexWord: w }]
    }))
  }
}
const ALL_WORDS = [...new Set([...Object.values(PAGE_WORD), "word.weapon", "word.love", "word.courage"])].sort()

/** In the sealed archive, every page's deduction confirmed and every word known (the gate for writing). */
const ready = (patch: Partial<GameState> = {}): GameState => stateWith({
  mapId: ARCHIVE_MAP,
  facts: ALL_WORDS,
  deductions: Object.fromEntries(CODEX_DEDUCTION_IDS.map((id) => [id, { slots: [wordOf(id), wordOf(id), wordOf(id)], confirmed: true }])),
  ...patch
})

/** 7개 고리를 방문한(봉인 해제) 상태. */
const unlocked = (patch: Partial<GameState> = {}): GameState =>
  stateWith({ rings: { visited: ["r1", "r2", "r3", "r4", "r5", "r6", "r7"], knownFacts: [] }, ...patch })

/** 8쪽을 모두 정답 단어로 채운 상태를 만든다. */
function fillAll(state: GameState): GameState {
  let s = state
  for (const deductionId of CODEX_DEDUCTION_IDS) {
    s = writeCodex(s, deductionId, wordOf(deductionId), c).state
  }
  return s
}

describe("checkArchiveUnlocked", () => {
  it("is locked until 7 rings are visited", () => {
    expect(checkArchiveUnlocked(stateWith({ rings: { visited: ["a", "b"], knownFacts: [] } }), c)).toBe(false)
    expect(checkArchiveUnlocked(stateWith({ rings: { visited: ["a", "b", "c", "d", "e", "f"], knownFacts: [] } }), c)).toBe(false)
  })
  it("unlocks once 7 rings are visited", () => {
    expect(checkArchiveUnlocked(unlocked(), c)).toBe(true)
  })
})

describe("enterSealedArchive", () => {
  it("returns the archive destination on the seal cell when unlocked", () => {
    expect(enterSealedArchive(unlocked({ mapId: "map.field" }), c, SEAL_CELL, "map.field")).toEqual({
      mapId: "map.sealed-archive",
      pos: { x: 8, y: 1 }
    })
  })
  it("is null on the seal cell while locked", () => {
    const locked = stateWith({ mapId: "map.field", rings: { visited: ["a"], knownFacts: [] } })
    expect(enterSealedArchive(locked, c, SEAL_CELL, "map.field")).toBeNull()
  })
  it("is null off the seal cell or outside map.field", () => {
    expect(enterSealedArchive(unlocked({ mapId: "map.field" }), c, { x: 1, y: 1 }, "map.field")).toBeNull()
    expect(enterSealedArchive(unlocked({ mapId: "map.a" }), c, SEAL_CELL, "map.a")).toBeNull()
  })
})

describe("writeCodex", () => {
  it("fills a page and emits codexWritten", () => {
    const result = writeCodex(ready(), "deduction.honesty", "word.truth", c)
    expect(result.state.codex.answers["deduction.honesty"]).toBe("word.truth")
    expect(result.events).toContainEqual({ type: "codexWritten", deductionId: "deduction.honesty", word: "word.truth" })
  })
  it("rejects a word that does not match the page answer", () => {
    const s = ready()
    const result = writeCodex(s, "deduction.honesty", "word.weapon", c)
    expect(result.state).toBe(s)
    expect(result.events).toEqual([])
  })
  it("ignores unknown deduction ids", () => {
    const s = ready()
    expect(writeCodex(s, "deduction.unknown", "word.truth", c)).toEqual({ state: s, events: [] })
  })
  it("opens the final page once all 8 pages are written", () => {
    const partial = writeCodex(ready(), "deduction.honesty", "word.truth", c).state
    expect(partial.codex.finalOpen).toBe(false)
    expect(fillAll(ready()).codex.finalOpen).toBe(true)
  })
  it("is ignored once all 8 pages are filled", () => {
    const full = fillAll(ready())
    const again = writeCodex(full, "deduction.honesty", "word.truth", c)
    expect(again.state).toBe(full)
    expect(again.events).toEqual([])
  })
})

describe("writeFinal", () => {
  it("is ignored while the final page is not open", () => {
    const s = ready()
    expect(writeFinal(s, "word.truth", c)).toEqual({ state: s, events: [] })
  })
  it("records the chosen word and emits the matching epilogue", () => {
    const full = fillAll(ready())
    const cases = [
      { word: "word.truth", kind: "truth" },
      { word: "word.love", kind: "love" },
      { word: "word.courage", kind: "courage" }
    ] as const
    for (const { word, kind } of cases) {
      const result = writeFinal(full, word, c)
      expect(result.state.codex.finalWord).toBe(word)
      expect(result.events).toContainEqual({ type: "codexFinalChosen", word })
      expect(result.events).toContainEqual({ type: "epilogue", kind })
    }
  })
  it("ignores a word that is none of the three principles", () => {
    const full = fillAll(ready())
    expect(writeFinal(full, "word.honor", c)).toEqual({ state: full, events: [] })
  })
  it("ignores a second final choice", () => {
    const full = fillAll(ready())
    const chosen = writeFinal(full, "word.love", c).state
    expect(writeFinal(chosen, "word.truth", c)).toEqual({ state: chosen, events: [] })
  })
})

describe("step routing", () => {
  it("routes writeCodex from explore", () => {
    const r = step(ready(), { type: "writeCodex", deductionId: "deduction.honesty", word: "word.truth" }, c)
    expect(r.state.codex.answers["deduction.honesty"]).toBe("word.truth")
  })
  it("routes writeFinal from explore once open", () => {
    const r = step(fillAll(ready()), { type: "writeFinal", word: "word.courage" }, c)
    expect(r.state.codex.finalWord).toBe("word.courage")
  })
})
