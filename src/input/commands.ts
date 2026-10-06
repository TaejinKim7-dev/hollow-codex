import type { GameContent } from "../content/types.ts"
import type { Command, Dir, GameState, Pos } from "../core/types.ts"
import { manhattan, samePos } from "../core/combat/intents.ts"
import { npcAt } from "../core/world/move.ts"

/** 키 입력으로 열 수 있는 UI 패널. */
export type UiAction = { readonly ui: "notebook" | "menu" }
export type InputMode = "explore" | "dialogue" | "combat"

/** state가 현재 어느 입력 모드인지. 전투가 대화보다 우선한다. */
export function modeOf(state: GameState): InputMode {
  if (state.combat !== null) return "combat"
  if (state.dialogue !== null) return "dialogue"
  return "explore"
}

const MOVE_KEYS: Readonly<Record<string, Dir>> = {
  ArrowUp: "n", w: "n", W: "n",
  ArrowRight: "e", d: "e", D: "e",
  ArrowDown: "s", s: "s", S: "s",
  ArrowLeft: "w", a: "w", A: "w"
}

/** 계획 Task 12의 키→명령 표. */
export function keyToCommand(key: string, mode: InputMode): Command | UiAction | null {
  if (key === "Tab") return { ui: "notebook" }
  if (key === "Escape") {
    if (mode === "dialogue") return { type: "endTalk" }
    if (mode === "explore" || mode === "combat") return { ui: "menu" }
    return null
  }
  if (mode !== "explore") return null
  const dir = MOVE_KEYS[key]
  if (dir !== undefined) return { type: "move", dir }
  if (key === "Enter" || key === " ") return { type: "interact" }
  return null
}

/** 화면 탭 → 명령. 탐험: 인접 NPC interact, 먼 NPC·플레이어 칸 무시, 그 외 moveTo. 전투: 격자 좌표로 combat move. 대화: 무시. */
export function pointerToCommand(tile: Pos, state: GameState, content: GameContent): Command | null {
  if (state.combat !== null) return { type: "combat", action: { kind: "move", to: tile } }
  if (state.dialogue !== null) return null
  const npc = npcAt(state, content, tile)
  if (npc !== null) return manhattan(state.player.pos, tile) === 1 ? { type: "interact", at: tile } : null
  if (samePos(state.player.pos, tile)) return null
  return { type: "moveTo", target: tile }
}