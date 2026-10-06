import { describe, expect, it } from "vitest"
import { parseScore } from "../../../src/audio/score.ts"

const one = (notes: string, tempo = 120) =>
  parseScore({ tempo, loop: false, channels: [{ wave: "square50", volume: 1, notes }] })

describe("parseScore", () => {
  it("parses A4/4 at 120 bpm to 440 Hz lasting 0.5 s", () => {
    expect(one("A4/4").events).toEqual([{ channel: 0, time: 0, duration: 0.5, freq: 440 }])
  })

  it("dotted notes last 1.5x", () => {
    expect(one("A4/4.").events[0]?.duration).toBeCloseTo(0.75)
  })

  it("rests have freq null and advance time", () => {
    expect(one("r/8 C4/8").events).toEqual([
      { channel: 0, time: 0, duration: 0.25, freq: null },
      { channel: 0, time: 0.25, duration: 0.25, freq: expect.closeTo(261.63, 1) }
    ])
  })

  it("sharps and flats name the same pitch", () => {
    expect(one("C#5/4").events[0]?.freq).toBeCloseTo(one("Db5/4").events[0]!.freq!)
  })

  it("noise hits have freq 0", () => {
    expect(
      parseScore({ tempo: 120, loop: false, channels: [{ wave: "noise", volume: 1, notes: "x/8" }] })
        .events[0]?.freq
    ).toBe(0)
  })

  it("rejects an unknown note name with the token in the error", () => {
    expect(() => one("H4/4")).toThrow('bad note "H4/4"')
  })

  it("length is the longest channel", () => {
    const s = parseScore({
      tempo: 120,
      loop: true,
      channels: [
        { wave: "square50", volume: 1, notes: "A4/4" },
        { wave: "triangle", volume: 1, notes: "A3/2 A3/4" }
      ]
    })
    expect(s.length).toBeCloseTo(1.5)
  })
})