import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const forbidden = /\b(document|window|HTMLElement|CanvasRenderingContext2D|AudioContext)\b|Math\.random/

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return tsFiles(p)
    return e.isFile() && p.endsWith(".ts") ? [p] : []
  })
}

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

describe("core purity", () => {
  it("src/core references no browser globals or Math.random", () => {
    const files = tsFiles("src/core")
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter((f) => forbidden.test(stripComments(readFileSync(f, "utf8"))))
    expect(offenders).toEqual([])
  })
  it("the comment stripper keeps code and drops comments", () => {
    expect(forbidden.test(stripComments("// window\n/* document */ const a = 1"))).toBe(false)
    expect(forbidden.test(stripComments("const r = Math.random()"))).toBe(true)
  })
})
