import { describe, it, expect } from "vitest"
import { resolve } from "node:path"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { t } from "../../../src/ui/strings.ts"

const projectRoot = resolve(import.meta.dirname, "..", "..", "..")

describe("i18n", () => {
  it("returns Korean text for ko:ui.notebook", () => {
    const strings = { ko: { "ui.notebook": "수첩" }, en: { "ui.notebook": "Notebook" } }
    expect(t("ko", strings, "ui.notebook")).toBe("수첩")
    expect(t("en", strings, "ui.notebook")).toBe("Notebook")
  })
  it("falls back to ko when a key is missing in en", () => {
    const strings = { ko: { "ui.x": "한국어" }, en: {} }
    expect(t("en", strings, "ui.x")).toBe("한국어")
  })
  it("substitutes {day} and {hour} placeholders", () => {
    const strings = { ko: { "ui.day-hour": "{day}일차 {hour}시" }, en: { "ui.day-hour": "{day} day, {hour}:00" } }
    expect(t("en", strings, "ui.day-hour", { day: 3, hour: 14 })).toBe("3 day, 14:00")
  })
  it("keeps en.yaml at exact key parity with ko.yaml and compiles", () => {
    const raw = loadContentDir(resolve(projectRoot, "content"))
    const { content, errors } = compileContent(raw)
    expect(errors).toEqual([])
    expect(content).not.toBeNull()
    expect(content!.strings["en"]).toBeDefined()
    const koKeys = Object.keys(raw["strings/ko.yaml"] as Record<string, unknown>).sort()
    const enKeys = Object.keys(raw["strings/en.yaml"] as Record<string, unknown>).sort()
    expect(koKeys).toEqual(enKeys)
    // compileContent already validated parity, spot-check the bundle shape
    expect(content!.strings["ko"]?.["ui.notebook"]).toBe("수첩")
    expect(content!.strings["en"]?.["ui.notebook"]).toBe("Notebook")
  })
})