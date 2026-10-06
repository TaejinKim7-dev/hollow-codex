import { expect, test } from "@playwright/test"

test("boots: #screen visible and no console errors in 2s", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

  await page.goto("/hollow-codex/")
  await expect(page.locator("#screen")).toBeVisible()
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/hollow-codex/manifest.webmanifest")

  await page.waitForTimeout(2000)
  expect(errors).toEqual([])

  // M2: fresh boot has time/rings defaults (no auto-save in a fresh browser context).
  const snapshot = await page.evaluate(() => {
    const hook = (window as unknown as { __hollowCodex__?: { state(): unknown } }).__hollowCodex__
    return hook?.state() ?? null
  })
  expect(snapshot).not.toBeNull()
  const state = snapshot as { time: unknown; rings: unknown }
  expect(state.time).toEqual({ hour: 8, day: 1 })
  expect(state.rings).toEqual({ visited: [], knownFacts: [] })
})