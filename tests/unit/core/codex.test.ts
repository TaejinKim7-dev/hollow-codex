// Task 42 — 봉인 서고 + 빈 경전 코어 로직 (M5). TDD: 실패 먼저.
import { describe, expect, it } from "vitest"
import type { GameContent } from "../../../src/content/types.ts"
import {
  CODEX_ANSWER_BY_DEDUCTION,
  CODEX_DEDUCTION_IDS,
  SEAL_CELL,
  checkArchiveUnlocked,
  enterSealedArchive,
  writeCodex,
  writeFinal
} from "../../../src/core/codex/codex.ts"
import { step } from "../../../src/core/step.ts"
import type { GameState } from "../../../src/core/types.ts"
import { stateWith, testContent } from "./fixture.ts"

const c: GameContent = testContent()

/** 7개 고리를 방문한(봉인 해제) 상태. */
const unlocked = (patch: Partial<GameState> = {}): GameState =>
  stateWith({ rings: { visited: ["r1", "r2", "r3", "r4", "r5", "r6", "r7"], knownFacts: [] }, ...patch })

/** 8쪽을 모두 정답 단어로 채운 상태를 만든다. */
function fillAll(state: GameState): GameState {
  let s = state
  for (const deductionId of CODEX_DEDUCTION_IDS) {
    s = writeCodex(s, deductionId, CODEX_ANSWER_BY_DEDUCTION[deductionId]!, c).state
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
    const result = writeCodex(stateWith({}), "deduction.honesty", "word.truth", c)
    expect(result.state.codex.answers["deduction.honesty"]).toBe("word.truth")
    expect(result.events).toContainEqual({ type: "codexWritten", deductionId: "deduction.honesty", word: "word.truth" })
  })
  it("rejects a word that does not match the page answer", () => {
    const s = stateWith({})
    const result = writeCodex(s, "deduction.honesty", "word.weapon", c)
    expect(result.state).toBe(s)
    expect(result.events).toEqual([])
  })
  it("ignores unknown deduction ids", () => {
    const s = stateWith({})
    expect(writeCodex(s, "deduction.unknown", "word.truth", c)).toEqual({ state: s, events: [] })
  })
  it("opens the final page once all 8 pages are written", () => {
    const partial = writeCodex(stateWith({}), "deduction.honesty", "word.truth", c).state
    expect(partial.codex.finalOpen).toBe(false)
    expect(fillAll(stateWith({})).codex.finalOpen).toBe(true)
  })
  it("is ignored once all 8 pages are filled", () => {
    const full = fillAll(stateWith({}))
    const again = writeCodex(full, "deduction.honesty", "word.truth", c)
    expect(again.state).toBe(full)
    expect(again.events).toEqual([])
  })
})

describe("writeFinal", () => {
  it("is ignored while the final page is not open", () => {
    const s = stateWith({})
    expect(writeFinal(s, "word.truth", c)).toEqual({ state: s, events: [] })
  })
  it("records the chosen word and emits the matching epilogue", () => {
    const full = fillAll(stateWith({}))
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
    const full = fillAll(stateWith({}))
    expect(writeFinal(full, "word.honor", c)).toEqual({ state: full, events: [] })
  })
  it("ignores a second final choice", () => {
    const full = fillAll(stateWith({}))
    const chosen = writeFinal(full, "word.love", c).state
    expect(writeFinal(chosen, "word.truth", c)).toEqual({ state: chosen, events: [] })
  })
})

describe("step routing", () => {
  it("routes writeCodex from explore", () => {
    const r = step(stateWith({}), { type: "writeCodex", deductionId: "deduction.honesty", word: "word.truth" }, c)
    expect(r.state.codex.answers["deduction.honesty"]).toBe("word.truth")
  })
  it("routes writeFinal from explore once open", () => {
    const r = step(fillAll(stateWith({})), { type: "writeFinal", word: "word.courage" }, c)
    expect(r.state.codex.finalWord).toBe("word.courage")
  })
})
