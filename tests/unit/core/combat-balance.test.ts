import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"

// 자동 대전(scripts/sim/combat-sim.ts)을 돌려, 모든 조우가 (단독이든 동료와든) 끝나고(정체 없음) 12라운드 안에 끝나는지 확인한다.
describe("combat balance guard", () => {
  it("every encounter finishes within 12 rounds under the greedy policy, with or without the drill instructor", () => {
    const out = execFileSync("node", ["scripts/sim/combat-sim.ts"], { encoding: "utf8" })
    const rows = out.split("\n").slice(1).filter((l) => l.startsWith("enc."))
    expect(rows.length).toBeGreaterThanOrEqual(20)
    for (const row of rows) {
      const cols = row.trim().split(/\s+/)
      expect(["victory", "defeat"], row).toContain(cols[2])
      expect(Number(cols[3]), row).toBeLessThanOrEqual(12)
    }
  })
})

describe("story encounter retune (2026-10-30)", () => {
  it("each virtue town's story fight has at least two enemies (the single-enemy versions ended in 1-2 rounds)", () => {
    const { content } = compileContent(loadContentDir("content"))
    const ids = ["compassion.robbers", "honor.duelist", "humility.silencer", "justice.mourner", "sacrifice.martyr", "spirituality.fake-monk", "valor.duelist"]
    for (const id of ids) expect(content!.encounters[`enc.${id}`]!.enemies.length, id).toBeGreaterThanOrEqual(2)
  })
  it("the fixed-plan fights (wolves in the field, robbers in the archive) keep their layout", () => {
    const { content } = compileContent(loadContentDir("content"))
    expect(content!.encounters["enc.field.wolves"]!.enemies).toHaveLength(3)
    expect(content!.encounters["enc.archive.robbers"]!.enemies).toHaveLength(2)
  })
})
