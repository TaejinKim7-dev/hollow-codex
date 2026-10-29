import { expect, test } from "@playwright/test"

type Unit = { id: string; side: string; class?: string; hp: number }
type Hook = { state(): { combat: null | { units: Unit[] } }; dispatch(c: unknown): void; debugJoin(ids: string[]): void; debugTeleport(map: string, x: number, y: number): void }
const hook = <T,>(page: import("@playwright/test").Page, fn: (h: Hook) => T) => page.evaluate((src) => { const h = (window as unknown as { __hollowCodex__: Hook }).__hollowCodex__; return (new Function("h", `return (${src})(h)`))(h) as T }, fn.toString())

test("arena classes: archers and shield bearers fight, enemy archers shoot from a distance", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto("/hollow-codex/?debug=1")
  await expect(page.locator("#screen")).toBeVisible()
  await page.waitForTimeout(1200)
  await hook(page, (h) => h.debugJoin(["npc.spirituality.novice", "npc.arena.trainer"]))
  await hook(page, (h) => h.debugTeleport("map.arena", 7, 3))
  await page.keyboard.press("ArrowUp")
  await page.waitForTimeout(800)
  const classes = await hook(page, (h) => h.state().combat!.units.map((u) => `${u.side}:${u.class ?? "-"}`).sort())
  expect(classes).toEqual(["ally:-", "ally:archer", "ally:guardian", "enemy:archer", "enemy:archer", "enemy:guardian"])
  await expect(page.locator(".combat-hud")).toContainText("궁수")
  const allyHp = () => hook(page, (h) => h.state().combat!.units.filter((u) => u.side === "ally").reduce((n, u) => n + u.hp, 0))
  const start = await allyHp()
  for (let round = 0; round < 4 && (await allyHp()) === start; round++) {
    for (let i = 0; i < 3; i++) { await hook(page, (h) => h.dispatch({ type: "combat", action: { kind: "endTurn" } })); await page.waitForTimeout(60) }
    await page.waitForTimeout(1800)
  }
  expect(await allyHp()).toBeLessThan(start)   // 적 궁수가 거리를 두고 쏴서 아군이 다쳤다
  expect(errors).toEqual([])
})
