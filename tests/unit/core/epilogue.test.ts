// Task 43 — 세 가지 에필로그 변형 + 마을 메시지 (M5). TDD: 실패 먼저.
import { describe, expect, it } from "vitest"
import { EPILOGUES, getEpilogue, selectEpilogue } from "../../../src/core/epilogue/epilogue.ts"

describe("selectEpilogue", () => {
  it("returns 'truth' for word.truth", () => {
    expect(selectEpilogue("word.truth")).toBe("truth")
  })
  it("returns 'love' for word.love", () => {
    expect(selectEpilogue("word.love")).toBe("love")
  })
  it("returns 'courage' for word.courage", () => {
    expect(selectEpilogue("word.courage")).toBe("courage")
  })
  it("defaults to 'truth' for unknown words", () => {
    expect(selectEpilogue("word.unknown")).toBe("truth")
  })
})

describe("getEpilogue", () => {
  it("returns a full entry with 8 town messages", () => {
    const e = getEpilogue("word.truth")
    expect(e.kind).toBe("truth")
    expect(e.townMessages.length).toBe(8)
  })
  it("all 3 epilogues have 8 town messages each", () => {
    expect(EPILOGUES.length).toBe(3)
    for (const e of EPILOGUES) {
      expect(e.townMessages.length).toBe(8)
    }
  })
  it("each townId appears in every epilogue", () => {
    const townIds = new Set<string>()
    for (const e of EPILOGUES) {
      for (const m of e.townMessages) townIds.add(m.townId)
    }
    // Should have 8 unique town ids across all epilogues
    expect(townIds.size).toBe(8)
  })
})

describe("epilogue content shape", () => {
  it("covers truth, love and courage exactly once", () => {
    expect(EPILOGUES.map((e) => e.kind).sort()).toEqual(["courage", "love", "truth"])
  })
  it("keys every string under the epilogue namespace", () => {
    for (const e of EPILOGUES) {
      expect(e.titleKey.startsWith("epilogue.")).toBe(true)
      expect(e.prologueKey.startsWith("epilogue.")).toBe(true)
      for (const m of e.townMessages) {
        expect(m.messageKey).toBe(`epilogue.${e.kind}.${m.townId}.text`)
      }
    }
  })
  it("uses different text per kind — no shared town keys between epilogues", () => {
    const all: string[] = []
    for (const e of EPILOGUES) for (const m of e.townMessages) all.push(m.messageKey)
    expect(new Set(all).size).toBe(all.length)
  })
  it("selects the matching entry for every supported word", () => {
    expect(getEpilogue("word.love").kind).toBe("love")
    expect(getEpilogue("word.courage").kind).toBe("courage")
  })
})
