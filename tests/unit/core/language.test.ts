// i18n: 언어 전환은 core의 순수 step(s)을 통과해야 한다 (DOM 없음).
import { describe, expect, it } from "vitest"
import { step } from "../../../src/core/step.ts"
import { stateWith, testContent } from "./fixture.ts"

describe("setLanguage", () => {
  it("switches the state language", () => {
    const s = stateWith({})
    const { state } = step(s, { type: "setLanguage", language: "en" }, testContent())
    expect(state.language).toBe("en")
  })
  it("keeps every other field unchanged", () => {
    const s = stateWith({ turn: 7 })
    const { state } = step(s, { type: "setLanguage", language: "en" }, testContent())
    expect(state.turn).toBe(7)
    expect(state.rng).toBe(s.rng)
    expect(state.mapId).toBe(s.mapId)
    expect(state.player).toEqual(s.player)
    expect(Object.keys(state).sort()).toEqual(Object.keys(s).sort())
  })
  it("returns the same state when the language is unchanged", () => {
    const s = stateWith({})
    const r = step(s, { type: "setLanguage", language: "ko" }, testContent())
    expect(r.state).toBe(s)
    expect(r.events).toEqual([])
  })
})