import { describe, expect, it } from "vitest"
import { loadVolumes, saveVolume } from "../../../src/audio/volume-store.ts"

const memory = (init: Record<string, string> = {}) => {
  const data = { ...init }
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v } }
}

describe("volume store", () => {
  it("loads saved volumes and leaves unsaved ones null", () => {
    expect(loadVolumes(memory({ "hollow-codex.volume.music": "0.25" }))).toEqual({ music: 0.25, sfx: null })
  })
  it("ignores values that are not numbers in 0..1", () => {
    expect(loadVolumes(memory({ "hollow-codex.volume.music": "loud", "hollow-codex.volume.sfx": "7" }))).toEqual({ music: null, sfx: null })
  })
  it("returns nulls when storage is missing or throws", () => {
    expect(loadVolumes(null)).toEqual({ music: null, sfx: null })
    expect(loadVolumes({ getItem: () => { throw new Error("blocked") } })).toEqual({ music: null, sfx: null })
  })
  it("saves a volume and swallows storage errors", () => {
    const m = memory()
    saveVolume(m, "sfx", 0.6)
    expect(m.data["hollow-codex.volume.sfx"]).toBe("0.6")
    expect(() => saveVolume({ setItem: () => { throw new Error("full") } }, "sfx", 0.5)).not.toThrow()
    expect(() => saveVolume(null, "sfx", 0.5)).not.toThrow()
  })
})
