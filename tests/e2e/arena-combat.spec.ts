import { expect, test } from "@playwright/test"

type Hook = { state(): { mapId: string; combat: null | { units: { id: string; side: string; pos: { x: number; y: number } }[] } } }
const hook = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __hollowCodex__: Hook }).__hollowCodex__.state())

test("arena: walk in from the field and a wolf fight starts; trees do not cover the enemy row", async ({ page }, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto("/hollow-codex/")
  await expect(page.locator("#screen")).toBeVisible()
  await page.waitForTimeout(1200)
  const walk = async (key: string, n: number): Promise<void> => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(220) } }
  await walk("ArrowRight", 2)                       // field (9,7): entrance
  expect((await hook(page)).mapId).toBe("map.arena")
  await walk("ArrowUp", 2); await walk("ArrowRight", 4)   // (5,2): wolves
  await page.waitForTimeout(600)
  const s = await hook(page)
  expect(s.combat).not.toBeNull()
  expect(s.combat!.units.filter((u) => u.side === "enemy")).toHaveLength(3)
  await page.screenshot({ path: info.outputPath("arena-combat.png") })
  expect(errors).toEqual([])
})
