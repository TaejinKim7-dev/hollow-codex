// B-3 저장 파일 회귀: 리터럴 옛 저장 JSON fixture를 저장소에 남기고, 로드 경로가 지금 형상으로
// 마이그레이션·정규화하는지 고정한다. fixture는 createInitialState로 만들지 않는다 — 그 시점의 실제 모양이다.
// RED: fixture JSON이 없으면 readFileSync가 실패해 3개 테스트가 모두 빨간색이 된다.
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  MIGRATIONS,
  SAVE_VERSION,
  deserialize,
  migrateV1ToV2,
  migrateV2ToV3
} from "../../../src/core/save/serialize.ts"
import { normalizeLoaded } from "../../../src/core/save/normalize.ts"
import type { GameState } from "../../../src/core/types.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()
const savesDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../fixtures/saves")
const readFixture = (name: string): string => readFileSync(resolve(savesDir, name), "utf8")
const parse = (name: string): { version: number; state: Record<string, unknown> } =>
  JSON.parse(readFixture(name)) as { version: number; state: Record<string, unknown> }

const loadOk = (name: string): GameState => {
  const r = deserialize(readFixture(name))
  expect(r.ok).toBe(true)
  if (!r.ok) throw new Error(`deserialize(${name}) failed: ${r.reason}`)
  return r.state
}

describe("literal old-save fixtures (tests/fixtures/saves)", () => {
  it("v1 (M1) migrates v1→v2→v3 and normalizeLoaded backfills pages and town flags", () => {
    const raw = parse("v1.json")
    expect(raw.version).toBe(1)
    expect(raw.state["time"]).toBeUndefined()
    expect(raw.state["rings"]).toBeUndefined()
    expect(raw.state["codex"]).toBeUndefined()
    expect(raw.state["language"]).toBeUndefined()

    // 명시적 마이그레이션 사슬: 두 단계 모두 빠진 필드를 채운다.
    const migrated = migrateV2ToV3(migrateV1ToV2(raw.state)) as Record<string, unknown>
    expect(migrated["time"]).toEqual({ hour: 8, day: 1 })
    expect(migrated["rings"]).toEqual({ visited: [], knownFacts: [] })
    expect(migrated["codex"]).toEqual({ answers: {}, finalWord: null, finalOpen: false })
    expect(migrated["language"]).toBe("ko")

    // deserialize는 MIGRATIONS[1]과 MIGRATIONS[2]를 순서대로 적용한다.
    const loaded = loadOk("v1.json")
    expect(loaded.turn).toBe(40)
    expect(loaded.time).toEqual({ hour: 8, day: 1 })
    expect(loaded.rings).toEqual({ visited: [], knownFacts: [] })
    expect(loaded.codex).toEqual({ answers: {}, finalWord: null, finalOpen: false })
    expect(loaded.language).toBe("ko")
    expect(loaded.facts).toEqual(["word.lantern", "word.truth"])

    // content 백필: M1에 없던 추론 페이지를 더하고, 지금 선 지도의 enterFlag(마을 깃발)를 더한다.
    const state = normalizeLoaded(loaded, content)
    for (const id of Object.keys(content.deductions)) expect(state.deductions[id], id).toBeDefined()
    expect(state.deductions["deduction.honesty"]?.slots).toEqual(["word.truth", null, null])
    expect(state.flags).toContain("flag.town.kalas")
  })

  it("v2 (M2-M4) fills only codex and language and keeps time, rings and town flags", () => {
    const raw = parse("v2.json")
    expect(raw.version).toBe(2)
    expect(raw.state["codex"]).toBeUndefined()
    expect(raw.state["language"]).toBeUndefined()
    expect(raw.state["time"]).toEqual({ hour: 14, day: 5 })
    expect(raw.state["rings"]).toEqual({ visited: [], knownFacts: ["fact.ring.honesty"] })

    const migrated = migrateV2ToV3(raw.state) as Record<string, unknown>
    expect(migrated["codex"]).toEqual({ answers: {}, finalWord: null, finalOpen: false })
    expect(migrated["language"]).toBe("ko")
    expect(migrated["time"]).toEqual({ hour: 14, day: 5 })
    expect(migrated["rings"]).toEqual({ visited: [], knownFacts: ["fact.ring.honesty"] })

    const loaded = loadOk("v2.json")
    expect(loaded.codex).toEqual({ answers: {}, finalWord: null, finalOpen: false })
    expect(loaded.language).toBe("ko")
    expect(loaded.time).toEqual({ hour: 14, day: 5 })
    expect(loaded.rings.knownFacts).toEqual(["fact.ring.honesty"])
    expect(loaded.flags).toContain("flag.town.compassion")
    expect(loaded.clearedEncounters).toEqual(["enc.field.wolves"])

    const state = normalizeLoaded(loaded, content)
    expect(state.time).toEqual(loaded.time)
    expect(state.rings).toEqual(loaded.rings)
    expect(state.codex).toEqual(loaded.codex)
    expect(state.flags).toContain("flag.town.compassion")
  })

  it("v3 is the current version and loads unchanged (no migration needed)", () => {
    expect(SAVE_VERSION).toBe(3)
    expect(Object.keys(MIGRATIONS).sort()).toEqual(["1", "2"])

    const raw = parse("v3.json")
    expect(raw.version).toBe(3)

    const loaded = loadOk("v3.json")
    expect(loaded).toEqual(raw.state as unknown as GameState)
    expect(loaded.language).toBe("en")
    expect(loaded.codex.answers).toEqual({ "deduction.honesty": "word.truth" })
    expect(loaded.codex.finalWord).toBe("word.truth")
    expect(loaded.codex.finalOpen).toBe(true)
    expect(loaded.time).toEqual({ hour: 20, day: 7 })
    expect(loaded.rings.visited).toEqual(["ring.honesty"])
    expect(loaded.abilities).toEqual(["ability.see-lies"])
    expect(loaded.flags).toContain("flag.sealed-archive-opened")

    // 이미 모든 필드가 채워져 있으면 normalizeLoaded는 같은 객체를 돌려준다.
    expect(normalizeLoaded(loaded, content)).toBe(loaded)
  })
})
