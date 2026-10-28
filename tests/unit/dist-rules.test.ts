import { describe, expect, it } from "vitest"
import { auditFiles, BUDGETS, WORKBOX_WARNING_URL } from "../../src/audit/dist-rules.ts"

const js = (path: string, text: string) => ({ path, text, size: text.length })

describe("dist audit", () => {
  it("flags an external origin in shipped JS", () => {
    const out = auditFiles([js("assets/a.js", 'fetch("https://example.com/x")')])
    expect(out.some((m) => m.includes("assets/a.js") && m.includes("https://example.com"))).toBe(true)
  })
  it("allows the SVG namespace", () => {
    expect(auditFiles([js("assets/a.js", 'createElementNS("http://www.w3.org/2000/svg","svg")')])).toEqual([])
  })
  it("allows the inert Workbox precache warning URL", () => {
    const out = auditFiles([js("workbox-abc.js", `console.warn("Learn more at ${WORKBOX_WARNING_URL}")`)])
    expect(out).toEqual([])
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
  const bin = (path: string, size: number) => ({ path, text: null, size })
  const opts = { bgmKeys: new Set(["field", "kalas"]) }

  it("flags art over its budget", () => {
    const out = auditFiles([bin("assets/big-AbCd1234.png", BUDGETS.art + 1)], opts)
    expect(out.some((m) => m.includes("art") && m.includes("budget"))).toBe(true)
  })
  it("flags audio over its budget and code over its budget", () => {
    expect(auditFiles([bin("assets/x-AbCd1234.ogg", BUDGETS.audio + 1)], opts).some((m) => m.includes("audio") && m.includes("budget"))).toBe(true)
    expect(auditFiles([bin("assets/index-AbCd1234.js", BUDGETS.code + 1)], opts).some((m) => m.includes("code") && m.includes("budget"))).toBe(true)
  })
  it("allows large background music: it is lazy-loaded, so it does not count toward the first load", () => {
    const out = auditFiles([bin("assets/field-AbCd1234.ogg", 6 * 1024 * 1024), bin("assets/kalas-AbCd1234.ogg", 6 * 1024 * 1024)], opts)
    expect(out).toEqual([])
  })
  it("flags a first load (everything except background music) over its budget", () => {
    const out = auditFiles([bin("assets/a-AbCd1234.png", 3 * 1024 * 1024), bin("assets/b-AbCd1234.ogg", 2 * 1024 * 1024 + 1)], opts)
    expect(out.some((m) => m.includes("first load"))).toBe(true)
  })
  it("flags files that come from assets-private or lab", () => {
    const out = auditFiles([bin("assets/assets-private-x.ogg", 5), bin("lab/index.html", 5), bin("assets/lab/a.js", 5)], opts)
    expect(out.some((m) => m.includes("lab/index.html") && m.includes("dev-only"))).toBe(true)
    expect(out.some((m) => m.includes("assets-private"))).toBe(true)
  })
  it("passes a clean dist", () => {
    expect(auditFiles([js("index.html", "<html></html>"), js("assets/a.js", "console.log(1)")])).toEqual([])
  })
})
