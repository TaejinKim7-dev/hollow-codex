import { describe, expect, it } from "vitest"
import { auditFiles, BUNDLE_BUDGET_BYTES } from "../../src/audit/dist-rules.ts"

const js = (path: string, text: string) => ({ path, text, size: text.length })

describe("dist audit", () => {
  it("flags an external origin in shipped JS", () => {
    const out = auditFiles([js("assets/a.js", 'fetch("https://example.com/x")')])
    expect(out.some((m) => m.includes("assets/a.js") && m.includes("https://example.com"))).toBe(true)
  })
  it("allows the SVG namespace", () => {
    expect(auditFiles([js("assets/a.js", 'createElementNS("http://www.w3.org/2000/svg","svg")')])).toEqual([])
  })
  it("flags source maps", () => {
    expect(auditFiles([{ path: "assets/a.js.map", text: "{}", size: 2 }])).toHaveLength(1)
  })
  it("flags banned reference files", () => {
    const out = auditFiles([
      { path: "u4-alt-manual.pdf", text: null, size: 10 },
      { path: "docs/origin.txt", text: "", size: 0 }
    ])
    expect(out).toHaveLength(2)
  })
  it("flags a bundle over the budget", () => {
    const out = auditFiles([{ path: "assets/big.png", text: null, size: BUNDLE_BUDGET_BYTES + 1 }])
    expect(out.some((m) => m.includes("budget"))).toBe(true)
  })
  it("passes a clean dist", () => {
    expect(auditFiles([js("index.html", "<html></html>"), js("assets/a.js", "console.log(1)")])).toEqual([])
  })
})
