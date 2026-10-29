import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { createInitialState } from "../../../src/core/state.ts"
import { codexView, combatView, dialogueView, notebookView, ringsView } from "../../../src/ui/view-model.ts"
import { startCombat } from "../../../src/core/combat/grid.ts"

// 실제 콘텐츠로 모든 NPC를 모든 단서를 안 채 불러 보고, 대화 칩·위기 선택지 라벨이 문자열 표에서 빠진 자리표시(⟦키⟧)가 아닌지 확인한다.
const { content } = compileContent(loadContentDir("content"))

describe("real content: no unresolved labels in dialogue chips and crisis options", () => {
  it("every NPC, with every fact known, shows only resolved chip labels (ko and en)", () => {
    expect(content).not.toBeNull()
    const c = content!
    const bad: string[] = []
    for (const lang of ["ko", "en"] as const) {
      for (const npcId of Object.keys(c.npcs)) {
        const base = createInitialState(c, 1)
        const s = { ...base, language: lang, facts: Object.keys(c.facts), dialogue: { npcId, pendingChoice: null } }
        const v = dialogueView(s, c, [])
        for (const chip of v?.chips ?? []) if (chip.label.includes("⟦")) bad.push(`${lang} ${npcId} ${chip.topic} → ${chip.label}`)
        for (const row of v?.crisis ?? []) if (row.label.includes("⟦") || row.hints.some((h) => h.includes("⟦"))) bad.push(`${lang} ${npcId} crisis ${row.optionId}`)
        if (v?.crisisText?.includes("⟦")) bad.push(`${lang} ${npcId} crisisText`)
      }
    }
    expect(bad).toEqual([])
  })

  it("the notebook, codex, rings and every encounter's combat HUD resolve all their strings (ko and en)", () => {
    const c = content!
    const bad: string[] = []
    const scan = (where: string, v: unknown): void => { const text = JSON.stringify(v); if (text.includes("⟦")) bad.push(`${where}: ${text.slice(text.indexOf("⟦"), text.indexOf("⟦") + 60)}`) }
    for (const lang of ["ko", "en"] as const) {
      const base = { ...createInitialState(c, 1), language: lang, facts: Object.keys(c.facts), abilities: Object.keys(c.abilities) }
      scan(`${lang} notebook`, notebookView(base, c))
      scan(`${lang} codex`, codexView(base, c))
      scan(`${lang} rings`, ringsView(base, c))
      for (const encId of Object.keys(c.encounters)) {
        const s = startCombat({ ...base, party: [] }, c, encId, { x: 0, y: 0 })
        scan(`${lang} combat ${encId}`, combatView(s, c))
      }
    }
    expect(bad).toEqual([])
  })
})
