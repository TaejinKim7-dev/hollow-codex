import type { GameContent } from "../../content/types.ts"
import type { GameEvent, GameState, Id, Pos, StepResult } from "../types.ts"
import { addSorted, samePos } from "../state.ts"
import { npcPositionAt } from "../dialogue/talk.ts"
import { DIRS, offset, tileAt } from "./path.ts"

const adjacent = (a: Pos, b: Pos): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

/**
 * 플레이어가 서 있는 고리(D9). 고리 칸 위, 또는 고리 돌이 통행 불가일 때 그 바로 옆(상하좌우)이면 그 고리다.
 * 고리 칸 위가 옆보다 우선이고, 같은 순위면 content 순서상 처음 것. 같은 지도(onOverworld)만 본다.
 */
export function ringHere(state: GameState, content: GameContent): Id | null {
  const here = Object.entries(content.rings).filter(([, g]) => g.onOverworld === state.mapId)
  const on = here.find(([, g]) => samePos(g.at, state.player.pos))
  if (on !== undefined) return on[0]
  const next = here.find(([, g]) => tileAt(content, g.onOverworld, g.at)?.walk === null && adjacent(g.at, state.player.pos))
  return next === undefined ? null : next[0]
}

/** 도착 칸: 고리 칸이 걸을 수 있으면 그 칸, 아니면 걸을 수 있고 출구·조우·NPC가 없는 첫 이웃(n, e, s, w). */
export function arrivalCell(content: GameContent, mapId: Id, at: Pos, hour: number): Pos | null {
  const map = content.maps[mapId]
  if (map === undefined) return null
  const walkable = (p: Pos): boolean => {
    const tile = tileAt(content, mapId, p)
    return tile !== null && tile.walk !== null
  }
  const free = (p: Pos): boolean =>
    walkable(p) &&
    !map.exits.some((e) => samePos(e.at, p)) &&
    !map.encounters.some((e) => samePos(e.at, p)) &&
    !Object.values(content.npcs).some((n) => n.map === mapId && samePos(npcPositionAt(n, hour), p))
  if (walkable(at)) return at
  for (const dir of DIRS) {
    const p = offset(at, dir)
    if (free(p)) return p
  }
  return null
}

/**
 * 열석 고리로 이동한다 (D9, D10). `toId` = 고른 도착 고리.
 * - 플레이어가 고리 위(또는 고리 돌 옆)에 서 있어야 한다. 아니면 무시.
 * - 도착 고리는 content에 있고, 지금 고리와 다르고, 그 fact를 알아야 한다. 아니면 무시(같은 state, 이벤트 0).
 * - 출발·도착 고리를 visited(정렬·중복 없음)에 기록한다.
 * - 지도가 바뀌면 mapChanged·music을 내고, 도착 지도의 enterFlags·heals를 적용한다(출구로 들어갈 때와 같다).
 */
export function ringTravel(state: GameState, toId: Id, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  const fromId = ringHere(state, content)
  const dest = content.rings[toId]
  if (fromId === null || dest === undefined || fromId === toId) return ignored
  if (!state.rings.knownFacts.includes(dest.fact)) return ignored
  const destMap = content.maps[dest.onOverworld]
  const pos = arrivalCell(content, dest.onOverworld, dest.at, state.time.hour)
  if (destMap === undefined || pos === null) return ignored

  const visited = addSorted(state.rings.visited, [fromId, toId])
  const events: GameEvent[] = [{ type: "ringTraveled", from: fromId, to: toId }]
  let next: GameState = {
    ...state,
    player: { ...state.player, pos },
    rings: { ...state.rings, visited }
  }
  if (dest.onOverworld !== state.mapId) {
    next = {
      ...next,
      mapId: dest.onOverworld,
      player: { ...next.player, hp: destMap.heals ? next.player.maxHp : next.player.hp },
      flags: addSorted(state.flags, destMap.enterFlags)
    }
    events.push({ type: "mapChanged", mapId: dest.onOverworld }, { type: "music", track: destMap.music })
  }
  return { state: next, events }
}
