// Task 16 시나리오 테스트 공용 헬퍼. 실제 content/ 를 컴파일해 결정적 명령으로 재생한다.
// core/save, core/step 등은 그대로 쓰고, 여기서는 길찾기·대화 조합만 추가한다.
import { compileContent } from "../../src/content/compile.ts"
import { loadContentDir } from "../../src/content/load-node.ts"
import type { GameContent } from "../../src/content/types.ts"
import type { Command, GameEvent, GameState, Id, Pos } from "../../src/core/types.ts"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { DIRS, findPath, offset, tileAt } from "../../src/core/world/path.ts"
import type { Dir } from "../../src/core/types.ts"
import { npcAt } from "../../src/core/world/move.ts"
import { npcPositionAt } from "../../src/core/dialogue/talk.ts"

let realContent: GameContent | null = null
export const loadedContent = (): GameContent => {
  if (realContent === null) {
    const { content, errors } = compileContent(loadContentDir("content"))
    if (content === null) throw new Error(`loadRealContent: content compile failed\n${errors.join("\n")}`)
    realContent = content
  }
  return realContent
}

/** content/ 를 읽어 컴파일한다. 오류는 throw — 콘텐츠 배치 버그가 즉시 드러난다. */
export function loadRealContent(): GameContent {
  return loadedContent()
}

/** 명령 목록을 결정적으로 재생한다. 같은 seed + 같은 명령 = 같은 결과. */
export function play(content: GameContent, commands: readonly Command[], seed = 1): { state: GameState; events: GameEvent[] } {
  let state: GameState = createInitialState(content, seed)
  const events: GameEvent[] = []
  for (const command of commands) {
    const r = step(state, command, content)
    state = r.state
    events.push(...r.events)
  }
  return { state, events }
}

/** 지도 그래프를 BFS로 따라가 목적지 지도까지의 출구 체인을 찾는다. 길 없으면 null. */
function mapRoute(
  content: GameContent,
  from: Id,
  to: Id
): { at: Pos; to: Id }[] | null {
  if (from === to) return []
  const came = new Map<Id, { exit: { at: Pos; to: Id }; prev: Id } | null>([[from, null]])
  const queue: Id[] = [from]
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]!
    const map = content.maps[cur]
    if (map === undefined) continue
    for (const exit of map.exits) {
      if (came.has(exit.to)) continue
      came.set(exit.to, { exit: { at: exit.at, to: exit.to }, prev: cur })
      queue.push(exit.to)
    }
  }
  if (!came.has(to)) return null
  const exits: { at: Pos; to: Id }[] = []
  for (let id: Id = to; id !== from; ) {
    const link = came.get(id)
    if (link === undefined || link === null) return null
    exits.push(link.exit)
    id = link.prev
  }
  return exits.reverse()
}

/**
 * 현재 지도와 상관없이 목표 지도 `mapId`의 `target` 칸까지 `move` 명령 목록을 만든다.
 * 출구 칸을 밟아 지도가 바뀌면 그 도착 칸에서 이어 간다. NPC 칸과 (건너려는 출구 외의·이미 있는 지도의)
 * 출구 칸은 막힌다. `avoid`가 참인 칸도 막힌다. 길이 없으면 throw(콘텐츠 배치 오류를 시나리오가 바로 드러내기 위함).
 * NPC는 시간대마다 자리를 옮기므로(D13) 한 걸음마다 실제로 걸어 보고 그때의 NPC 자리로 길을 다시 찾는다.
 * 걸음 중에 전투가 시작되면(조우 칸) 거기서 멈춘다 — 이어지는 전투 수순은 호출자가 넣는다.
 */
export function walkTo(
  content: GameContent, start: GameState, mapId: Id, target: Pos,
  avoid: (p: Pos) => boolean = () => false, untilMap = false
): Command[] {
  const cmds: Command[] = []
  const passBlocked = (s: GameState, map: Id, skipExit: Pos | null): ((p: Pos) => boolean) => {
    const npcs = (p: Pos) => npcAt(s, content, p) !== null
    const exits = content.maps[map]?.exits ?? []
    const exitCells = (p: Pos) => exits.some((e) => e.at.x === p.x && e.at.y === p.y && (skipExit === null || e.at.x !== skipExit.x || e.at.y !== skipExit.y))
    return (p) => npcs(p) || exitCells(p) || avoid(p)
  }
  let s = start
  const go = (dir: Dir): void => {
    s = step(s, { type: "move", dir }, content).state
    cmds.push({ type: "move", dir })
  }
  /**
   * One step towards `goal` along a cached plan. The plan is recomputed when it runs out or its next cell is
   * blocked at this hour. If NPCs wall the goal off, step to a free neighbour instead (time passes).
   */
  let plan: Dir[] = []
  let planGoal: Pos | null = null
  const advance = (goal: Pos, blocked: (p: Pos) => boolean, what: string): void => {
    const sameGoal = planGoal !== null && planGoal.x === goal.x && planGoal.y === goal.y
    if (!sameGoal || plan.length === 0 || blocked(offset(s.player.pos, plan[0]!))) {
      plan = findPath(content, s.mapId, s.player.pos, goal, blocked) ?? []
      planGoal = goal
      if (plan.length === 0 && s.player.pos.x === goal.x && s.player.pos.y === goal.y) throw new Error(`walkTo: already at ${what} but map did not change`)
    }
    const next = plan.shift()
    if (next !== undefined) return go(next)
    planGoal = null
    const wait = DIRS.find((d) => {
      const q = offset(s.player.pos, d)
      const tile = tileAt(content, s.mapId, q)
      return tile !== null && tile.walk !== null && !blocked(q)
    })
    if (wait === undefined) throw new Error(`walkTo: no path to ${what}`)
    go(wait)
  }
  for (let guard = 0; guard < 32 && s.mapId !== mapId; guard++) {
    const route = mapRoute(content, s.mapId, mapId)
    if (route === null) throw new Error(`walkTo: no map route ${s.mapId} -> ${mapId}`)
    const exit = route[0]!
    const from = s.mapId
    for (let n = 0; n < 4096 && s.mapId === from && s.combat === null; n++) {
      advance(exit.at, passBlocked(s, s.mapId, exit.at), `exit ${s.mapId}@${exit.at.x},${exit.at.y}`)
    }
    if (s.mapId === from && s.combat === null) throw new Error(`walkTo: no path to exit ${s.mapId}@${exit.at.x},${exit.at.y}`)
    if (s.combat !== null) return cmds
  }
  if (s.mapId !== mapId) throw new Error(`walkTo: too many map hops ${start.mapId} -> ${mapId}`)
  if (untilMap) return cmds
  // 목표 칸이 (건너려는) 출구 칸이면 그 칸만은 막지 않는다 — 밟는 즉시 지도가 바뀌며 걷기는 끝난다.
  const targetIsExit = content.maps[mapId]?.exits.some((e) => e.at.x === target.x && e.at.y === target.y) ?? false
  const arrived = (): boolean => s.player.pos.x === target.x && s.player.pos.y === target.y
  for (let n = 0; n < 4096 && s.mapId === mapId && s.combat === null && !arrived(); n++) {
    advance(target, passBlocked(s, mapId, targetIsExit ? target : null), `${mapId}@${target.x},${target.y}`)
  }
  if (s.mapId === mapId && s.combat === null && !arrived()) throw new Error(`walkTo: no path to ${mapId}@${target.x},${target.y}`)
  return cmds
}

/** NPC의 지도 좌표. state를 주면 그 시각의 일과 자리(npcPositionAt), 없으면 기본 pos. */
export function npcPos(npcId: Id, state?: GameState): Pos {
  const npc = loadedContent().npcs[npcId]
  if (npc === undefined) throw new Error(`npcPos: unknown npc ${npcId}`)
  return state === undefined ? npc.pos : npcPositionAt(npc, state.time.hour)
}

/** makeScript가 돌려주는 조립기 타입. */
export type Script = ReturnType<typeof makeScript>

/**
 * NPC가 서 있는 칸(state 시각의 일과 자리)은 walkTo의 blocked 검사에 걸려 직접 목적지로 쓸 수 없다.
 * 그 주변 4방향 중 통행 가능하고(NPC·출구·미해결 조우가 아닌) 셀을 골라 돌려준다. 없으면 throw.
 */
export function approachCell(content: GameContent, state: GameState, mapId: Id, npcId: Id): Pos {
  const target = npcPos(npcId, state)
  const map = content.maps[mapId]
  const exits = map?.exits ?? []
  const encounters = map?.encounters ?? []
  for (const dir of DIRS) {
    const cell = offset(target, dir)
    const tile = tileAt(content, mapId, cell)
    if (tile === null || tile.walk === null) continue
    if (npcAt({ ...state, mapId }, content, cell) !== null) continue
    if (exits.some((e) => e.at.x === cell.x && e.at.y === cell.y)) continue
    if (encounters.some((e) => e.at.x === cell.x && e.at.y === cell.y && !state.clearedEncounters.includes(e.id))) continue
    return cell
  }
  throw new Error(`approachCell: no walkable neighbor for ${npcId} at ${target.x},${target.y}`)
}

/**
 * 대화 명령 조합. NPC가 인접해 있다고 가정(그 위치를 walkTo로 옮긴 뒤 쓴다).
 * `interact(at = NPC 칸)` → `ask(topic)`들 → `endTalk`.
 */
export function talk(npcId: Id, topics: readonly string[], state?: GameState): Command[] {
  const cmds: Command[] = [{ type: "interact", at: npcPos(npcId, state) }]
  for (const topic of topics) cmds.push({ type: "ask", topic })
  cmds.push({ type: "endTalk" })
  return cmds
}

/**
 * 대화 도중 명령(ask·choose·recruit·resolveCrisis)을 끼워 넣는 대화 조합.
 * `interact(at = NPC 칸)` → `mid`들 → `endTalk`.
 */
export function talkWith(npcId: Id, mid: readonly Command[], state?: GameState): Command[] {
  return [{ type: "interact", at: npcPos(npcId, state) }, ...mid, { type: "endTalk" }]
}

/**
 * 시나리오 명령 조립기. push()는 명령들을 즉시 step으로 재생해 현재 state를 갱신하고
 * 목록에도 쌓는다. 이렇게 조립한 목록을 play(content, cmds(), seed)로 그대로 재생할 수 있다.
 */
export function makeScript(content: GameContent, seed = 1): {
  push(cmds: readonly Command[]): void
  state(): GameState
  cmds(): Command[]
  /** Walks next to the NPC where its schedule puts it now (re-checked every step), avoiding uncleared encounters. */
  meet(mapId: Id, npcId: Id): void
  /** interact at the NPC's current scheduled cell → ask topics → endTalk. */
  talk(npcId: Id, topics: readonly string[]): void
  /** interact at the NPC's current scheduled cell → mid commands → endTalk. */
  talkWith(npcId: Id, mid: readonly Command[]): void
} {
  let s = createInitialState(content, seed)
  const list: Command[] = []
  const push = (cmds: readonly Command[]): void => {
    for (const c of cmds) {
      const r = step(s, c, content)
      s = r.state
      list.push(c)
    }
  }
  const adjacentNow = (mapId: Id, npcId: Id): boolean => {
    if (s.mapId !== mapId) return false
    const p = npcPos(npcId, s)
    return Math.abs(p.x - s.player.pos.x) + Math.abs(p.y - s.player.pos.y) === 1
  }
  return {
    push,
    state: () => s,
    cmds: () => list,
    meet(mapId, npcId) {
      const map = content.maps[mapId]
      const encounters = map?.encounters ?? []
      const exits = map?.exits ?? []
      const blocked = (p: Pos): boolean =>
        npcAt(s, content, p) !== null ||
        exits.some((e) => e.at.x === p.x && e.at.y === p.y) ||
        encounters.some((e) => e.at.x === p.x && e.at.y === p.y && !s.clearedEncounters.includes(e.id))
      if (s.mapId !== mapId) push(walkTo(content, s, mapId, s.player.pos, blocked, true))
      for (let n = 0; n < 4096 && !adjacentNow(mapId, npcId); n++) {
        if (s.combat !== null || s.mapId !== mapId) throw new Error(`meet: left ${mapId} or fought on the way to ${npcId}`)
        let path: Dir[] | null = null
        try {
          path = findPath(content, mapId, s.player.pos, approachCell(content, s, mapId, npcId), blocked)
        } catch {
          path = null   // no free cell next to the NPC right now
        }
        if (path !== null && path.length > 0) {
          push([{ type: "move", dir: path[0]! }])
          continue
        }
        // The NPC is walled in by its neighbours at this hour: wait by stepping to a free cell (time passes).
        const wait = DIRS.find((d) => {
          const q = offset(s.player.pos, d)
          const tile = tileAt(content, mapId, q)
          return tile !== null && tile.walk !== null && !blocked(q)
        })
        if (wait === undefined) throw new Error(`meet: stuck on the way to ${npcId}`)
        push([{ type: "move", dir: wait }])
      }
      if (!adjacentNow(mapId, npcId)) throw new Error(`meet: never got next to ${npcId}`)
    },
    talk(npcId, topics) {
      push(talk(npcId, topics, s))
    },
    talkWith(npcId, mid) {
      push(talkWith(npcId, mid, s))
    }
  }
}

/** 플레이어가 dir쪽 한 칸을 향하는 interact 명령. at을 명시하지 않는 대화 기본형 용도. */
export function adjacentCell(npcPos_: Pos, dir: Dir): Pos {
  return offset(npcPos_, dir)
}