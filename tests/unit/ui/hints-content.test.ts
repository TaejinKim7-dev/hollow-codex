// The hints tab (rumours, D17 / FR-NTB-08): only towns the player has been to, rendered as text,
// and no hint may name a deduction answer word (that would pre-solve the 3-slot puzzle).
import { describe, expect, it } from "vitest"
import { createInitialState } from "../../../src/core/state.ts"
import type { GameState } from "../../../src/core/types.ts"
import { t } from "../../../src/ui/strings.ts"
import { dialogueView, notebookView } from "../../../src/ui/view-model.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()
const LANGS = ["ko", "en"] as const
const TOWNS = ["kalas", "compassion", "valor", "justice", "sacrifice", "honor", "spirituality", "humility"]
const DEDUCTION_OF: Readonly<Record<string, string>> = {
  kalas: "deduction.honesty", compassion: "deduction.compassion", valor: "deduction.valor", justice: "deduction.justice",
  sacrifice: "deduction.sacrifice", honor: "deduction.honor", spirituality: "deduction.spirituality", humility: "deduction.humility"
}
const text = (lang: "ko" | "en", key: string): string => t(lang, content.strings, key)
const dedHint = (lang: "ko" | "en", town: string): string => text(lang, content.deductions[DEDUCTION_OF[town]!]!.hintKey)
const visitedAll = (lang: "ko" | "en"): GameState => {
  const base = createInitialState(content, 1)
  return { ...base, language: lang, flags: [...new Set([...base.flags, ...TOWNS.map((x) => `flag.town.${x}`)])].sort() }
}

/** Labels of every deduction answer word, per language. */
const answerLabels = (lang: "ko" | "en"): string[] =>
  [...new Set(Object.values(content.deductions).flatMap((d) => d.answer))].map((w) => text(lang, content.facts[w]!.labelKey))
const mentions = (lang: "ko" | "en", hint: string, label: string): boolean =>
  lang === "ko" ? hint.includes(label) : new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(hint)

describe("hints tab scope", () => {
  it("at the start shows only the start town's hints (no other town's deduction hint)", () => {
    const hints = notebookView(createInitialState(content, 1), content).hints
    expect(hints).toContain(dedHint("ko", "kalas"))
    for (const town of TOWNS.slice(1)) expect(hints, town).not.toContain(dedHint("ko", town))
  })

  it("a town's hints appear once the player has entered it", () => {
    const base = createInitialState(content, 1)
    const after = { ...base, flags: [...base.flags, "flag.town.compassion"].sort() }
    expect(notebookView(after, content).hints).toContain(dedHint("ko", "compassion"))
  })

  it("entering a town map sets its town flag", () => {
    for (const town of TOWNS.slice(1)) {
      expect(content.maps[`map.town.${town}`]?.enterFlags, town).toContain(`flag.town.${town}`)
    }
    expect(createInitialState(content, 1).flags).toContain("flag.town.kalas")
  })

  it("hints are rendered text, not string keys", () => {
    for (const lang of LANGS) {
      for (const hint of notebookView(visitedAll(lang), content).hints) {
        expect(content.strings[lang]![hint], hint).toBeUndefined()
      }
    }
  })
})

describe("no hint names a deduction answer word", () => {
  it("rendered: the hints tab with every town visited (ko and en)", () => {
    for (const lang of LANGS) {
      const labels = answerLabels(lang)
      const hints = notebookView(visitedAll(lang), content).hints
      expect(hints.length).toBeGreaterThan(10)
      for (const hint of hints) {
        for (const label of labels) expect(mentions(lang, hint, label), `${lang}: "${hint}" names "${label}"`).toBe(false)
      }
    }
  })

  it("rendered: crisis option hints in dialogue (ko and en)", () => {
    for (const lang of LANGS) {
      const labels = answerLabels(lang)
      for (const crisis of Object.values(content.crises)) {
        const s = { ...visitedAll(lang), mapId: content.npcs[crisis.npc]!.map, dialogue: { npcId: crisis.npc, pendingChoice: null } }
        for (const row of dialogueView(s, content, [])?.crisis ?? []) {
          for (const hint of row.hints) {
            for (const label of labels) expect(mentions(lang, hint, label), `${lang}: "${hint}" names "${label}"`).toBe(false)
          }
        }
      }
    }
  })

  it("source: every fact and deduction hint string (ko and en)", () => {
    const keys = [...new Set([...Object.values(content.facts).map((f) => f.hintKey), ...Object.values(content.deductions).map((d) => d.hintKey)])]
    const bad: string[] = []
    for (const lang of LANGS) {
      const labels = answerLabels(lang)
      for (const key of keys) for (const label of labels) if (mentions(lang, text(lang, key), label)) bad.push(`${lang} ${key}: ${label}`)
    }
    expect(bad).toEqual([])
  })

  it("the spirituality hint no longer points at the three principles", () => {
    expect(text("ko", "spirituality.deduction.spirituality.hint")).not.toContain("세 원리")
    expect(text("en", "spirituality.deduction.spirituality.hint")).not.toMatch(/three principles/i)
  })
})

describe("valor and humility hints do not paraphrase the answer words", () => {
  // Each entry is a hint that used to spell the answer out in plain words (a label synonym),
  // which the literal-label guard above cannot see. The phrase must be gone in both languages.
  const leaks: readonly { readonly key: string; readonly ko: string; readonly en: RegExp }[] = [
    { key: "valor.deduction.valor.hint", ko: "물러섬", en: /stepping back/i },
    { key: "valor.word.courage.hint", ko: "돌아오는 것", en: /coming back/i },
    { key: "valor.word.retreat.hint", ko: "도망이라 부르는", en: /calls fleeing/i },
    { key: "valor.word.shield.hint", ko: "등을 막는", en: /blocks your back/i },
    { key: "humility.deduction.humility.hint", ko: "남은 하나", en: /the last one/i },
    { key: "humility.word.three.hint", ko: "적힌 수", en: /a number written/i }
  ]
  it("removes the answer-revealing paraphrase from each hint", () => {
    for (const { key, ko, en } of leaks) {
      expect(text("ko", key), key).not.toContain(ko)
      expect(text("en", key), key).not.toMatch(en)
    }
  })
})
