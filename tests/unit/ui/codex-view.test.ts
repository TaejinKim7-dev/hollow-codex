// The codex panel: pages lock until their deduction is confirmed; after the final chapter the
// epilogue for the chosen word is rendered from content strings (title, prologue, 8 town messages).
import { describe, expect, it } from "vitest"
import { CODEX_PAGES } from "../../../src/core/codex/codex.ts"
import { createInitialState } from "../../../src/core/state.ts"
import type { GameState } from "../../../src/core/types.ts"
import { t } from "../../../src/ui/strings.ts"
import { codexView } from "../../../src/ui/view-model.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()
const TOWNS = ["honesty", "compassion", "valor", "justice", "sacrifice", "honor", "spirituality", "humility"]

function finished(finalWord: string, language: "ko" | "en" = "ko"): GameState {
  const base = createInitialState(content, 1)
  const answers = Object.fromEntries(CODEX_PAGES.map((p) => [p.deductionId, content.deductions[p.deductionId]!.codexWord!]))
  return { ...base, language, mapId: "map.sealed-archive", codex: { answers, finalWord, finalOpen: true } }
}

describe("codexView", () => {
  it("has no epilogue before the final chapter", () => {
    expect(codexView(createInitialState(content, 1), content).epilogue).toBeNull()
  })

  for (const kind of ["truth", "love", "courage"] as const) {
    it(`renders the ${kind} epilogue strings for word.${kind}`, () => {
      for (const lang of ["ko", "en"] as const) {
        const v = codexView(finished(`word.${kind}`, lang), content)
        const tr = (k: string): string => t(lang, content.strings, k)
        expect(v.epilogue).toEqual({
          title: tr(`epilogue.${kind}.title`),
          prologue: tr(`epilogue.${kind}.prologue`),
          messages: TOWNS.map((town) => tr(`epilogue.${kind}.${town}.text`))
        })
        // real text, not keys
        expect(v.epilogue!.messages.every((m) => !m.startsWith("epilogue."))).toBe(true)
      }
    })
  }

  it("pages are locked until their deduction is confirmed", () => {
    const base = createInitialState(content, 1)
    const one = { ...base, deductions: { ...base.deductions, "deduction.valor": { slots: [null, null, null], confirmed: true } } }
    const pages = codexView(one, content).pages
    expect(pages.filter((p) => p.confirmed).map((p) => p.deductionId)).toEqual(["deduction.valor"])
  })
})
