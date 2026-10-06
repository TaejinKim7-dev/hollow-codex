// Task 16 시나리오 테스트 공용 헬퍼. 실제 content/ 를 컴파일해 결정적 명령으로 재생한다.
// core/save, core/step 등은 그대로 쓰고, 여기서는 길찾기·대화 조합만 추가한다.
import { compileContent } from "../../src/content/compile.ts"
import { loadContentDir } from "../../src/content/load-node.ts"
import type { GameContent } from "../../src/content/types.ts"
import type { Command, GameEvent, GameState, Id, Pos } from "../../src/core/types.ts"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { findPath, offset } from "../../src/core/world/path.ts"
import type { Dir } from "../../src/core/types.ts"
import { npcAt } from "../../src/core/world/move.ts"

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
 * 출구 칸은 막힌다. 길이 없으면 throw(콘텐츠 배치 오류를 시나리오가 바로 드러내기 위함).
 */
export function walkTo(content: GameContent, start: GameState, mapId: Id, target: Pos): Command[] {
  const cmds: Command[] = []
  const passBlocked = (s: GameState, map: Id, skipExit: Pos | null): ((p: Pos) => boolean) => {
    const npcs = (p: Pos) => npcAt(s, content, p) !== null
    const exits = content.maps[map]?.exits ?? []
    const exitCells = (p: Pos) => exits.some((e) => e.at.x === p.x && e.at.y === p.y && (skipExit === null || e.at.x !== skipExit.x || e.at.y !== skipExit.y))
    return (p) => npcs(p) || exitCells(p)
  }
  let s = start
  for (let guard = 0; guard < 32 && s.mapId !== mapId; guard++) {
    const route = mapRoute(content, s.mapId, mapId)
    if (route === null) throw new Error(`walkTo: no map route ${s.mapId} -> ${mapId}`)
    const exit = route[0]!
    const path = findPath(content, s.mapId, s.player.pos, exit.at, passBlocked(s, s.mapId, exit.at))
    if (path === null) throw new Error(`walkTo: no path to exit ${s.mapId}@${exit.at.x},${exit.at.y}`)
    if (path.length === 0) throw new Error(`walkTo: already at exit ${s.mapId}@${exit.at.x},${exit.at.y} but map did not change`)
    for (const dir of path) {
      const r = step(s, { type: "move", dir }, content)
      s = r.state
      cmds.push({ type: "move", dir })
    }
  }
  if (s.mapId !== mapId) throw new Error(`walkTo: too many map hops ${start.mapId} -> ${mapId}`)
  // 목표 칸이 (건너려는) 출구 칸이면 그 칸만은 막지 않는다 — 밟는 즉시 지도가 바뀌며 걷기는 끝난다.
  const targetIsExit = content.maps[mapId]?.exits.some((e) => e.at.x === target.x && e.at.y === target.y) ?? false
  const path = findPath(content, mapId, s.player.pos, target, passBlocked(s, mapId, targetIsExit ? target : null))
  if (path === null) throw new Error(`walkTo: no path to ${mapId}@${target.x},${target.y}`)
  for (const dir of path) cmds.push({ type: "move", dir })
  return cmds
}

/** NPC의 지도 좌표. talk 계열 헬퍼가 `interact(at)`에 쓴다. */
export function npcPos(npcId: Id): Pos {
  const npc = loadedContent().npcs[npcId]
  if (npc === undefined) throw new Error(`npcPos: unknown npc ${npcId}`)
  return npc.pos
}

/**
 * 대화 명령 조합. NPC가 인접해 있다고 가정(그 위치를 walkTo로 옮긴 뒤 쓴다).
 * `interact(at = NPC 칸)` → `ask(topic)`들 → `endTalk`.
 */
export function talk(npcId: Id, topics: readonly string[]): Command[] {
  const cmds: Command[] = [{ type: "interact", at: npcPos(npcId) }]
  for (const topic of topics) cmds.push({ type: "ask", topic })
  cmds.push({ type: "endTalk" })
  return cmds
}

/**
 * 대화 도중 명령(ask·choose·recruit·resolveCrisis)을 끼워 넣는 대화 조합.
 * `interact(at = NPC 칸)` → `mid`들 → `endTalk`.
 */
export function talkWith(npcId: Id, mid: readonly Command[]): Command[] {
  return [{ type: "interact", at: npcPos(npcId) }, ...mid, { type: "endTalk" }]
}

/**
 * 시나리오 명령 조립기. push()는 명령들을 즉시 step으로 재생해 현재 state를 갱신하고
 * 목록에도 쌓는다. 이렇게 조립한 목록을 play(content, cmds(), seed)로 그대로 재생할 수 있다.
 */
export function makeScript(content: GameContent, seed = 1): {
  push(cmds: readonly Command[]): void
  state(): GameState
  cmds(): Command[]
} {
  let s = createInitialState(content, seed)
  const list: Command[] = []
  return {
    push(cmds) {
      for (const c of cmds) {
        const r = step(s, c, content)
        s = r.state
        list.push(c)
      }
    },
    state: () => s,
    cmds: () => list
  }
}

/** 플레이어가 dir쪽 한 칸을 향하는 interact 명령. at을 명시하지 않는 대화 기본형 용도. */
export function adjacentCell(npcPos_: Pos, dir: Dir): Pos {
  return offset(npcPos_, dir)
}