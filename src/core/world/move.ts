import type { GameContent } from "../../content/types.ts"
import type { Dir, GameEvent, GameState, Id, Pos, StepResult, TimeState } from "../types.ts"
import { startCombat } from "../combat/grid.ts"
import { addSorted, samePos } from "../state.ts"
import { enterSealedArchive } from "../codex/codex.ts"
import { npcPositionAt } from "../dialogue/talk.ts"
import { findPath, offset, tileAt } from "./path.ts"
import { enterOverworldTarget } from "./overworld.ts"

export { tileAt } from "./path.ts"

/** 시간을 1시간 진행한다 (D12). 24시가 되면 day가 올라가고 hour가 0으로 감긴다. */
function advanceTime(time: TimeState): { state: TimeState; events: GameEvent[] } {
  const hour = time.hour + 1
  if (hour < 24) {
    return { state: { hour, day: time.day }, events: [{ type: "timePassed", hour, day: time.day }] }
  }
  const day = time.day + 1
  return { state: { hour: 0, day }, events: [{ type: "timePassed", hour: 0, day }, { type: "dayPassed", day }] }
}

/** state.mapId 지도에서 p에 서 있는 NPC. 일과(schedule)를 반영한다(D13). 동행 중(party)인 NPC는 지도에서 빠진다(D19). */
export function npcAt(state: GameState, content: GameContent, p: Pos): Id | null {
  for (const [id, npc] of Object.entries(content.npcs)) {
    if (npc.map === state.mapId && samePos(npcPositionAt(npc, state.time.hour), p) && !state.party.includes(id)) return id
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
  const t = advanceTime(state.time)
  let next: GameState = { ...state, turn: state.turn + tile.walk, time: t.state, player: { ...state.player, facing: dir, pos: target } }
  const events: GameEvent[] = [{ type: "moved", pos: target }, ...t.events]
  const map = content.maps[state.mapId]
  if (!map) throw new Error(`unknown map: ${state.mapId}`)

  // 오버월드 마을 입구 (D8) 또는 칼라스 봉인석(봉인 해제 시, M5): 발이 닿는 즉시 도착지로 이동한다.
  const entry = enterOverworldTarget(state, content, target, state.mapId)
    ?? enterSealedArchive(state, content, target, state.mapId)
  if (entry !== null) {
    const dest = content.maps[entry.mapId]
    if (!dest) throw new Error(`unknown map: ${entry.mapId}`)
    next = {
      ...next,
      mapId: entry.mapId,
      player: { ...next.player, pos: entry.pos, hp: dest.heals ? next.player.maxHp : next.player.hp },
      flags: addSorted(next.flags, dest.enterFlags)
    }
    events.push({ type: "mapChanged", mapId: entry.mapId }, { type: "music", track: dest.music })
    return { state: next, events }
  }

  // 비오버월드 지도의 내부 출구 (M1). 오버월드 출구는 위의 enterOverworldTarget이 처리한다.
  if (!map.isOverworld) {
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
