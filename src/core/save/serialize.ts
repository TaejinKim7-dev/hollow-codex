import type { GameState } from "../types.ts"

export const SAVE_FORMAT = "hollow-codex-save"
export const SAVE_VERSION = 3

export type DeserializeResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: "corrupt" | "format" | "future-version" }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function defaultTime(): { hour: number; day: number } {
  return { hour: 8, day: 1 }
}

function defaultRings(): { visited: string[]; knownFacts: string[] } {
  return { visited: [], knownFacts: [] }
}

function defaultCodex(): { answers: Record<string, string>; finalWord: null; finalOpen: boolean } {
  return { answers: {}, finalWord: null, finalOpen: false }
}

/** M1 저장에는 time/rings/codex가 없다. 기본값을 붙여 현재 모양으로 만든다. */
export function migrateV1ToV2(state: unknown): unknown {
  if (!isObject(state)) return state
  return {
    ...state,
    time: state["time"] === undefined ? defaultTime() : state["time"],
    rings: state["rings"] === undefined ? defaultRings() : state["rings"],
    codex: state["codex"] === undefined ? defaultCodex() : state["codex"]
  }
}

/** v2 저장에는 language가 없다. 기본값 ko를 붙인다 (영문 i18n 추가). */
export function migrateV2ToV3(state: unknown): unknown {
  if (!isObject(state)) return state
  return {
    ...state,
    language: state["language"] === undefined ? "ko" : state["language"]
  }
}

/** 저장 형식이 올라갈 때마다 이전 버전의 state를 다음 버전으로 바꾸는 함수를 여기에 등록한다. */
export const MIGRATIONS: Readonly<Record<number, (s: unknown) => unknown>> = { 1: migrateV1ToV2, 2: migrateV2ToV3 }

export function serialize(state: GameState): string {
  return JSON.stringify({ format: SAVE_FORMAT, version: SAVE_VERSION, state })
}

/** 최소 state 모양 검사(필드별 타입). 완전한 GameState인지까지는 보장하지 않는다. */
function isMinimalState(value: unknown): value is GameState {
  if (!isObject(value)) return false
  const player = value["player"]
  if (!isObject(player)) return false
  const pos = player["pos"]
  if (!isObject(pos)) return false
  const time = value["time"]
  if (
    !isObject(time) ||
    typeof time["hour"] !== "number" || !Number.isFinite(time["hour"]) || time["hour"] < 0 || time["hour"] > 23 ||
    typeof time["day"] !== "number" || !Number.isFinite(time["day"]) || time["day"] < 1
  ) return false
  const rings = value["rings"]
  if (!isObject(rings) || !Array.isArray(rings["visited"]) || !Array.isArray(rings["knownFacts"])) return false
  const codex = value["codex"]
  if (!isObject(codex)) return false
  const answers = codex["answers"]
  if (!isObject(answers) || Array.isArray(answers)) return false
  if (!Object.values(answers).every((w) => typeof w === "string")) return false
  const finalWord = codex["finalWord"]
  if (finalWord !== null && typeof finalWord !== "string") return false
  if (typeof codex["finalOpen"] !== "boolean") return false
  return (
    (value["language"] === "ko" || value["language"] === "en") &&
    typeof value["mapId"] === "string" &&
    typeof value["turn"] === "number" &&
    typeof value["rng"] === "number" &&
    typeof pos["x"] === "number" &&
    typeof pos["y"] === "number" &&
    Array.isArray(value["facts"]) &&
    Array.isArray(value["deeds"]) &&
    Array.isArray(value["party"]) &&
    Array.isArray(value["departed"]) &&
    Array.isArray(value["flags"]) &&
    Array.isArray(value["abilities"]) &&
    Array.isArray(value["clearedEncounters"]) &&
    isObject(value["deductions"]) &&
    isObject(value["crises"]) &&
    isObject(value["joinedAt"]) &&
    (value["dialogue"] === null || isObject(value["dialogue"])) &&
    (value["combat"] === null || isObject(value["combat"]))
  )
}

/** 절대 throw하지 않는다. */
export function deserialize(text: string): DeserializeResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: "corrupt" }
  }
  if (!isObject(parsed)) return { ok: false, reason: "format" }
  if (parsed["format"] !== SAVE_FORMAT) return { ok: false, reason: "format" }

  const version = parsed["version"]
  if (typeof version !== "number") return { ok: false, reason: "corrupt" }
  if (version > SAVE_VERSION) return { ok: false, reason: "future-version" }

  let state = parsed["state"]
  for (let v = version; v < SAVE_VERSION; v++) {
    const migrate = MIGRATIONS[v]
    if (migrate === undefined) return { ok: false, reason: "corrupt" }
    state = migrate(state)
  }

  if (!isMinimalState(state)) return { ok: false, reason: "corrupt" }
  return { ok: true, state }
}