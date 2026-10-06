import { expect, test } from "@playwright/test"

test("boots: #screen visible and no console errors in 2s", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

  await page.goto("/hollow-codex/")
  await expect(page.locator("#screen")).toBeVisible()

  await page.waitForTimeout(2000)
  expect(errors).toEqual([])
})