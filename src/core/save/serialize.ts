import type { GameState } from "../types.ts"

export const SAVE_FORMAT = "hollow-codex-save"
export const SAVE_VERSION = 1

export type DeserializeResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: "corrupt" | "format" | "future-version" }

/** 저장 형식이 올라갈 때마다 이전 버전의 state를 다음 버전으로 바꾸는 함수를 여기에 등록한다. */
export const MIGRATIONS: Readonly<Record<number, (s: unknown) => unknown>> = {}

export function serialize(state: GameState): string {
  return JSON.stringify({ format: SAVE_FORMAT, version: SAVE_VERSION, state })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/** 최소 state 모양 검사(필드별 타입). 완전한 GameState인지까지는 보장하지 않는다. */
function isMinimalState(value: unknown): value is GameState {
  if (!isObject(value)) return false
  const player = value["player"]
  if (!isObject(player)) return false
  const pos = player["pos"]
  if (!isObject(pos)) return false
  return (
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