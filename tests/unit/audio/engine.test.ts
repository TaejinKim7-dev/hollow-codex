import { describe, expect, it } from "vitest"
import { createEngine } from "../../../src/audio/engine.ts"

interface Ramp { v: number; t: number }
class FakeSrc {
  buffer: unknown = null
  loop = false
  playbackRate = { value: 1 }
  started = 0
  stopped: number | null = null
  onended: (() => void) | null = null
  connect(): void {}
  disconnect(): void {}
  start(): void { this.started++ }
  stop(t?: number): void { this.stopped = t ?? 0 }
}
class FakeGainNode {
  ramps: Ramp[] = []
  gain = {
    value: 1,
    setValueAtTime: (): void => {},
    linearRampToValueAtTime: (v: number, t: number): void => { this.ramps.push({ v, t }) }
  }
  connect(): void {}
  disconnect(): void {}
}

function harness(opts: { failFetch?: boolean } = {}) {
  const sources: FakeSrc[] = []
  const gains: FakeGainNode[] = []
  const fetched: string[] = []
  const ctx = {
    currentTime: 0,
    destination: {},
    createGain: () => { const g = new FakeGainNode(); gains.push(g); return g },
    createBufferSource: () => { const s = new FakeSrc(); sources.push(s); return s },
    decodeAudioData: (): Promise<unknown> => Promise.resolve({ duration: 1 })
  }
  let created = 0
  const engine = createEngine({
    createContext: () => { created++; return ctx as unknown as AudioContext },
    fetchBuffer: (key, kind) => {
      fetched.push(`${kind}:${key}`)
      return opts.failFetch === true ? Promise.reject(new Error("404")) : Promise.resolve(new ArrayBuffer(8))
    }
  })
  return { engine, sources, gains, fetched, created: () => created }
}
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0))

describe("audio engine", () => {
  it("is silent and fetches nothing before unlock; the context is created only by unlock", async () => {
    const h = harness()
    h.engine.sfx("click")
    await flush()
    expect(h.fetched).toEqual([])
    expect(h.created()).toBe(0)
    h.engine.unlock()
    expect(h.created()).toBe(1)
    h.engine.unlock()
    expect(h.created()).toBe(1)
  })
  it("plays at most 3 copies of the same sound at once", async () => {
    const h = harness()
    h.engine.unlock()
    for (let i = 0; i < 4; i++) h.engine.sfx("footstep")
    await flush()
    expect(h.sources.filter((s) => s.started > 0)).toHaveLength(3)
    expect(h.fetched.filter((f) => f === "sfx:footstep")).toHaveLength(1)
  })
  it("frees a slot when a copy ends", async () => {
    const h = harness()
    h.engine.unlock()
    for (let i = 0; i < 3; i++) h.engine.sfx("footstep")
    await flush()
    h.sources[0]?.onended?.()
    h.engine.sfx("footstep")
    await flush()
    expect(h.sources.filter((s) => s.started > 0)).toHaveLength(4)
  })
  it("applies the playback rate", async () => {
    const h = harness()
    h.engine.unlock()
    h.engine.sfx("footstep", 1.05)
    await flush()
    expect(h.sources.find((s) => s.started > 0)?.playbackRate.value).toBe(1.05)
  })
  it("starting the same music twice plays it once, looped", async () => {
    const h = harness()
    h.engine.unlock()
    h.engine.music("field")
    h.engine.music("field")
    await flush()
    expect(h.fetched).toEqual(["music:field"])
    expect(h.sources.filter((s) => s.started > 0)).toHaveLength(1)
    expect(h.sources[0]?.loop).toBe(true)
  })
  it("cross-fades 1.5 s: old track ramps to 0 and is stopped, new track ramps up", async () => {
    const h = harness()
    h.engine.unlock()
    h.engine.music("field")
    await flush()
    h.engine.music("kalas")
    await flush()
    const started = h.sources.filter((s) => s.started > 0)
    expect(started).toHaveLength(2)
    expect(started[0]?.stopped).toBe(1.5)
    const rampsTo = (v: number): number => h.gains.filter((g) => g.ramps.some((r) => r.v === v && r.t === 1.5)).length
    expect(rampsTo(0)).toBeGreaterThanOrEqual(1)
    expect(rampsTo(1)).toBeGreaterThanOrEqual(2)
  })
  it("music asked for before unlock starts at unlock", async () => {
    const h = harness()
    h.engine.music("field")
    await flush()
    expect(h.fetched).toEqual([])
    h.engine.unlock()
    await flush()
    expect(h.fetched).toEqual(["music:field"])
  })
  it("music(null) fades out the current track", async () => {
    const h = harness()
    h.engine.unlock()
    h.engine.music("field")
    await flush()
    h.engine.music(null)
    expect(h.sources[0]?.stopped).toBe(1.5)
  })
  it("a failed fetch is silent, never throws, and the next call can try again", async () => {
    const h = harness({ failFetch: true })
    h.engine.unlock()
    h.engine.sfx("click")
    h.engine.music("field")
    await flush()
    expect(h.sources.filter((s) => s.started > 0)).toHaveLength(0)
    h.engine.sfx("click")
    await flush()
    expect(h.fetched.filter((f) => f === "sfx:click")).toHaveLength(2)
  })
  it("volumes default to music 0.5 / sfx 0.8 and clamp to 0..1", () => {
    const h = harness()
    expect(h.engine.volume("music")).toBe(0.5)
    expect(h.engine.volume("sfx")).toBe(0.8)
    h.engine.setVolume("music", 2)
    expect(h.engine.volume("music")).toBe(1)
    h.engine.setVolume("sfx", -1)
    expect(h.engine.volume("sfx")).toBe(0)
  })
  it("when no context can be made it stays silent without throwing", () => {
    const engine = createEngine({ createContext: () => null, fetchBuffer: () => Promise.resolve(new ArrayBuffer(0)) })
    expect(() => { engine.unlock(); engine.sfx("x"); engine.music("y") }).not.toThrow()
  })
})
