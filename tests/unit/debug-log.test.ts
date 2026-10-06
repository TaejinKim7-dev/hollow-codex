// Key points log what happened so an issue can be traced. Quiet by default;
// `?debug=1` turns console output on. The last entries stay in memory.
import { describe, expect, it, vi } from "vitest"
import { createDebugLog, debugEnabledFromUrl } from "../../src/debug-log.ts"

describe("debug log", () => {
  it("keeps entries in a bounded buffer and stays off the console when disabled", () => {
    const warn = vi.fn()
    const log = createDebugLog({ enabled: false, limit: 3, warn, now: () => 1000 })
    for (let i = 0; i < 5; i += 1) log.log("prompt", { i })
    expect(warn).not.toHaveBeenCalled()
    expect(log.entries().map((entry) => entry.data)).toEqual([{ i: 2 }, { i: 3 }, { i: 4 }])
    expect(log.entries()[0]).toMatchObject({ t: 1000, event: "prompt" })
  })

  it("writes to console.warn with a [hc] tag when enabled", () => {
    const warn = vi.fn()
    const log = createDebugLog({ enabled: true, limit: 10, warn, now: () => 5 })
    log.log("korean-enter", { route: "game" })
    expect(warn).toHaveBeenCalledWith("[hc]", "korean-enter", { route: "game" })
  })

  it("is enabled by ?debug=1 only", () => {
    expect(debugEnabledFromUrl("http://x/hollow-codex/?debug=1")).toBe(true)
    expect(debugEnabledFromUrl("http://x/hollow-codex/")).toBe(false)
    expect(debugEnabledFromUrl("http://x/hollow-codex/?debug=0")).toBe(false)
  })
})

describe("debug log sink", () => {
  it("forwards every entry to the sink (dev server file log), even when console output is off", () => {
    const sink = vi.fn()
    const log = createDebugLog({ enabled: false, sink, now: () => 7 })
    log.log("key-wait", { on: true })
    expect(sink).toHaveBeenCalledWith({ t: 7, event: "key-wait", data: { on: true } })
  })

  it("never lets a failing sink break the game", () => {
    const log = createDebugLog({ enabled: false, sink: () => { throw new Error("offline") } })
    expect(() => log.log("x")).not.toThrow()
    expect(log.entries()).toHaveLength(1)
  })
})
