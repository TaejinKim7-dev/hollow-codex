import { expect, test } from "@playwright/test"

type Hook = { state(): { combat: null | { round: number; units: { id: string; side: string }[] } }; dispatch(c: unknown): void; debugTeleport(map: string, x: number, y: number): void }
const run = <T,>(page: import("@playwright/test").Page, fn: (h: Hook) => T) => page.evaluate((src) => { const h = (window as unknown as { __hollowCodex__: Hook }).__hollowCodex__; return (new Function("h", `return (${src})(h)`))(h) as T }, fn.toString())

test("arena: the escort fight has a ward and a goal line; the ambush brings reinforcements in round 3", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto("/hollow-codex/?debug=1")
  await expect(page.locator("#screen")).toBeVisible()
  await page.waitForTimeout(1200)
  await run(page, (h) => h.debugTeleport("map.arena", 11, 3))
  await page.keyboard.press("ArrowUp")
  await page.waitForTimeout(800)
  expect(await run(page, (h) => h.state().combat!.units.some((u) => u.id === "ward" && u.side === "ally"))).toBe(true)
  await expect(page.locator(".combat-hud")).toContainText("호위")
  await run(page, (h) => h.dispatch({ type: "combat", action: { kind: "flee" } }))
  await page.waitForTimeout(400)
  await run(page, (h) => h.debugTeleport("map.arena", 11, 5))
  await page.keyboard.press("ArrowDown")
  await page.waitForTimeout(800)
  const enemies = () => run(page, (h) => h.state().combat?.units.filter((u) => u.side === "enemy").length ?? 0)
  const before = await enemies()
  for (let i = 0; i < 2; i++) { await run(page, (h) => h.dispatch({ type: "combat", action: { kind: "endTurn" } })); await page.waitForTimeout(2200) }
  await expect(page.locator(".notice").first()).toContainText("증원")
  expect(await enemies()).toBeGreaterThan(before - 1)   // 늑대가 죽지 않았다면 2명이 더 늘었다
  expect(errors).toEqual([])
})
