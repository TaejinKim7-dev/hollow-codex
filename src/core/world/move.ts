import type { GameContent } from "../../content/types.ts"
import type { Dir, GameEvent, GameState, Id, Pos, StepResult } from "../types.ts"
import { startCombat } from "../combat/grid.ts"
import { addSorted, samePos } from "../state.ts"
import { findPath, offset, tileAt } from "./path.ts"

export { tileAt } from "./path.ts"

/** state.mapId 지도에서 p에 선 NPC. 동행 중(party)인 NPC는 지도에서 빠진다(D19). */
export function npcAt(state: GameState, content: GameContent, p: Pos): Id | null {
  for (const [id, npc] of Object.entries(content.npcs)) {
    if (npc.map === state.mapId && samePos(npc.pos, p) && !state.party.includes(id)) return id
  }
  return null
}

export function move(state: GameState, dir: Dir, content: GameContent): StepResult {
  const from = state.player.pos
  const target = offset(from, dir)
  const tile = tileAt(content, state.mapId, target)
  if (tile === null || tile.walk === null || npcAt(state, content, target) !== null) {
    return { state: { ...state, player: { ...state.player, facing: dir } }, events: [{ type: "bumped" }] }
  }
  let next: GameState = { ...state, turn: state.turn + tile.walk, player: { ...state.player, facing: dir, pos: target } }
  const events: GameEvent[] = [{ type: "moved", pos: target }]
  const map = content.maps[state.mapId]
  if (!map) throw new Error(`unknown map: ${state.mapId}`)

  const exit = map.exits.find((e) => samePos(e.at, target))
  if (exit) {
    const dest = content.maps[exit.to]
    if (!dest) throw new Error(`unknown map: ${exit.to}`)
    next = {
      ...next,
      mapId: exit.to,
      player: { ...next.player, pos: exit.arrive, hp: dest.heals ? next.player.maxHp : next.player.hp },
      flags: addSorted(next.flags, dest.enterFlags)
    }
    events.push({ type: "mapChanged", mapId: exit.to }, { type: "music", track: dest.music })
    return { state: next, events }
  }

  const encounter = map.encounters.find((e) => samePos(e.at, target) && !state.clearedEncounters.includes(e.id))
  if (encounter) {
    const def = content.encounters[encounter.id]
    if (!def) throw new Error(`unknown encounter: ${encounter.id}`)
    next = startCombat(next, content, encounter.id, from)
    events.push({ type: "combatStarted", encounterId: encounter.id }, { type: "music", track: def.music })
  }
  return { state: next, events }
}

/** BFS 경로(NPC 칸은 막힘)의 첫 걸음만 move로 실행한다. 경로가 없거나 이미 도착했으면 그대로. */
export function moveTo(state: GameState, target: Pos, content: GameContent): StepResult {
  const path = findPath(content, state.mapId, state.player.pos, target, (p) => npcAt(state, content, p) !== null)
  const first = path?.[0]
  if (first === undefined) return { state, events: [] }
  return move(state, first, content)
}
