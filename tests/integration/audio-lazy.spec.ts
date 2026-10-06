// @vitest-environment jsdom
// B-4(e): the AudioContext must not be built while the module is loading. It is created on the
// first user input (a browser gesture is needed to start audio anyway).
// RED: before the lazy change, importing main.ts constructs one.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FakeAudioContext, bootTestApp, installBrowserStubs, uninstallBrowserStubs } from "./harness.ts"

vi.mock("virtual:content", async () => {
  const { silentContent } = await import("./harness.ts")
  return { default: silentContent() }
})
vi.mock("virtual:credits", () => ({ default: [] }))

let constructed = 0
class CountingAudioContext extends FakeAudioContext {
  constructor() {
    super()
    constructed += 1
  }
}

beforeEach(() => {
  constructed = 0
  installBrowserStubs()
  vi.stubGlobal("AudioContext", CountingAudioContext)
})

afterEach(() => {
  uninstallBrowserStubs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("lazy AudioContext", () => {
  it("is not built on module load and appears on the first user input", async () => {
    await bootTestApp()
    expect(constructed).toBe(0)

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }))
    expect(constructed).toBe(1)
  })
})
