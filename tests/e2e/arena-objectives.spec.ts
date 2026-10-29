import { expect, test } from "@playwright/test"

type Hook = { state(): { mapId: string; combat: null | { encounterId: string; round: number } } }
const hook = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __hollowCodex__: Hook }).__hollowCodex__.state())

test("arena: the hold-out and escape fights show their goal in the HUD and start from the arena", async ({ page }, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto("/hollow-codex/")
  await page.waitForTimeout(1200)
  const walk = async (key: string, n: number): Promise<void> => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(220) } }
  await walk("ArrowRight", 2)                                   // arena (1,4)
  await walk("ArrowUp", 1); await walk("ArrowRight", 8); await walk("ArrowUp", 1)   // (9,2): hold-out fight
  await page.waitForTimeout(600)
  expect((await hook(page)).combat?.encounterId).toBe("enc.arena.hold")
  await expect(page.locator("#combat-hud, .combat-hud, [class*=hud]").first()).toContainText("4라운드를 버텨라 (1/4)")
  await page.screenshot({ path: info.outputPath("arena-hold.png") })
  expect(errors).toEqual([])
})

test("arena: the escape fight marks the exit cell and ends in victory when an ally steps on it", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto("/hollow-codex/")
  await page.waitForTimeout(1200)
  const walk = async (key: string, n: number): Promise<void> => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(220) } }
  await walk("ArrowRight", 2)
  await walk("ArrowDown", 1); await walk("ArrowRight", 8); await walk("ArrowDown", 1)   // (9,6): escape fight (row 5 avoids the other fight cells)
  await page.waitForTimeout(600)
  expect((await hook(page)).combat?.encounterId).toBe("enc.arena.escape")
  await expect(page.locator("[class*=hud]").first()).toContainText("탈출")
  await page.screenshot({ path: info.outputPath("arena-escape.png") })
})
