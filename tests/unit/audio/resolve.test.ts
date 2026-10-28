import { describe, expect, it } from "vitest"
import { compileContent } from "../../../src/content/compile.ts"
import { loadContentDir } from "../../../src/content/load-node.ts"
import { footstepKey, missingAudioKeys, resolveSfx, resolveTrack } from "../../../src/audio/resolve.ts"

const audio = {
  sfx: { step: "footstep", learn: "clue", bump: "bump" },
  footsteps: { grass: "footstep", stone: "footstep_stone", water: "footstep_wood" },
  music: { "music.field": "field", "music.overworld": "field" }
}

describe("resolvers", () => {
  it("resolveSfx maps a core sfx name to a file key, or null (silence) when unmapped", () => {
    expect(resolveSfx(audio, "learn")).toBe("clue")
    expect(resolveSfx(audio, "nonexistent")).toBeNull()
  })
  it("footstepKey follows the ground, falling back to grass for legacy (null) and unlisted grounds", () => {
    expect(footstepKey(audio, "stone")).toBe("footstep_stone")
    expect(footstepKey(audio, null)).toBe("footstep")
    expect(footstepKey(audio, "path")).toBe("footstep")
  })
  it("resolveTrack maps a music id to a bgm file key, or null", () => {
    expect(resolveTrack(audio, "music.overworld")).toBe("field")
    expect(resolveTrack(audio, "music.nowhere")).toBeNull()
  })
  it("missingAudioKeys lists mapped keys that have no file", () => {
    expect(missingAudioKeys(audio, new Set(["footstep", "clue", "bump", "footstep_stone"]), new Set(["field"]))).toEqual(["sfx footstep_wood"])
    expect(missingAudioKeys(audio, new Set(["footstep", "clue", "bump", "footstep_stone", "footstep_wood"]), new Set())).toEqual(["music field"])
  })
})

describe("audio.yaml in compile", () => {
  const raw = () => loadContentDir("tests/fixtures/content-min")
  it("each section is optional and defaults to an empty map", () => {
    expect(compileContent(raw()).content?.audio).toEqual({ sfx: {}, footsteps: {}, music: { "music.min": "kalas" } })
  })
  it("a map whose music id is not in audio.yaml fails the build (a typo would otherwise be silent)", () => {
    const { content, errors } = compileContent({ ...raw(), "audio.yaml": { music: { "music.other": "kalas" } } })
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("music.min"))).toBe(true)
  })
  it("reads sfx, footsteps and music tables", () => {
    const { content, errors } = compileContent({ ...raw(), "audio.yaml": { sfx: { step: "footstep" }, footsteps: { stone: "footstep_stone" }, music: { "music.min": "kalas" } } })
    expect(errors).toEqual([])
    expect(content?.audio.footsteps).toEqual({ stone: "footstep_stone" })
    expect(content?.audio.music).toEqual({ "music.min": "kalas" })
  })
  it("rejects a footsteps key that is not a ground", () => {
    const { content, errors } = compileContent({ ...raw(), "audio.yaml": { footsteps: { lava: "x" }, music: { "music.min": "kalas" } } })
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("lava"))).toBe(true)
  })
})
