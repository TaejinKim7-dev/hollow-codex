// The codex is the ending: a page may only be written in the sealed archive, for a deduction the
// player has CONFIRMED, with a word the player knows. The page's word comes from content (codexWord).
import { describe, expect, it } from "vitest"
import { ARCHIVE_ARRIVE, ARCHIVE_MAP, CODEX_PAGES } from "../../../src/core/codex/codex.ts"
import { createInitialState } from "../../../src/core/state.ts"
import { step } from "../../../src/core/step.ts"
import type { GameEvent, GameState } from "../../../src/core/types.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()
const allWords = [...new Set(Object.values(content.deductions).flatMap((d) => d.answer))].sort()

/** Turn 1, standing in the archive, knowing every answer word, with the given deductions confirmed. */
function inArchive(confirmed: readonly string[]): GameState {
  const base = createInitialState(content, 1)
  const deductions = Object.fromEntries(Object.entries(base.deductions).map(([id, page]) =>
    [id, confirmed.includes(id) ? { slots: [...content.deductions[id]!.answer], confirmed: true } : page]))
  return { ...base, turn: 1, mapId: ARCHIVE_MAP, player: { ...base.player, pos: ARCHIVE_ARRIVE }, facts: allWords, deductions }
}

function tryEverything(start: GameState): { state: GameState; events: GameEvent[] } {
  let state = start
  const events: GameEvent[] = []
  for (const page of CODEX_PAGES) {
    for (const word of allWords) {
      const r = step(state, { type: "writeCodex", deductionId: page.deductionId, word }, content)
      state = r.state
      events.push(...r.events)
    }
  }
  for (const word of allWords) {
    const r = step(state, { type: "writeFinal", word }, content)
    state = r.state
    events.push(...r.events)
  }
  return { state, events }
}

describe("codex gating on real content", () => {
  it("the epilogue at turn 1 with zero confirmed deductions is refused", () => {
    const { state, events } = tryEverything(inArchive([]))
    expect(state.codex.answers).toEqual({})
    expect(state.codex.finalOpen).toBe(false)
    expect(events.filter((e) => e.type === "epilogue" || e.type === "codexWritten")).toEqual([])
  })

  it("every codex page has a content codexWord that is one of its deduction's answer words", () => {
    for (const page of CODEX_PAGES) {
      const d = content.deductions[page.deductionId]
      expect(d?.codexWord, page.deductionId).toBeDefined()
      expect(d?.answer, page.deductionId).toContain(d?.codexWord)
    }
  })

  it("a confirmed deduction's page takes exactly its codexWord, only inside the archive", () => {
    const id = "deduction.valor"
    const word = content.deductions[id]!.codexWord!
    const ready = inArchive([id])
    const written = step(ready, { type: "writeCodex", deductionId: id, word }, content)
    expect(written.state.codex.answers[id]).toBe(word)
    // the same write outside the archive is refused
    const outside = { ...ready, mapId: "map.field" }
    expect(step(outside, { type: "writeCodex", deductionId: id, word }, content).state).toBe(outside)
    // an unconfirmed page is refused even with the right word
    const other = "deduction.honesty"
    const otherWord = content.deductions[other]!.codexWord!
    expect(step(ready, { type: "writeCodex", deductionId: other, word: otherWord }, content).state).toBe(ready)
  })

  it("a word the player does not know is refused", () => {
    const id = "deduction.valor"
    const word = content.deductions[id]!.codexWord!
    const ready = inArchive([id])
    const forgot = { ...ready, facts: ready.facts.filter((f) => f !== word) }
    expect(step(forgot, { type: "writeCodex", deductionId: id, word }, content).state).toBe(forgot)
  })

  it("with all eight confirmed, all pages and the final chapter can be written", () => {
    const { state, events } = tryEverything(inArchive(CODEX_PAGES.map((p) => p.deductionId)))
    expect(Object.keys(state.codex.answers)).toHaveLength(8)
    expect(events.filter((e) => e.type === "epilogue")).toHaveLength(1)
  })
})
