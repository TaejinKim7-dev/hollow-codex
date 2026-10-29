import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"

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
