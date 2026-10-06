// Task 31 — M2 대륙 traversal 시나리오. 실제 content/ 로 오버월드에서 칼라스까지 들어갔다 나오고,
// 다른 미덕 마을(compassion)에 들렀다 나오는 왕복을 걷기만으로 검증한다.
// 시작 상태는 대륙 오버월드(칼라스 입구 바로 북쪽). 정문(`+`)을 밟을 때 mapChanged가 나야 한다.
import { describe, expect, it } from "vitest"
import type { Command, GameEvent, GameState } from "../../src/core/types.ts"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { loadRealContent, walkTo } from "./play.ts"
import { WOLF_PUSH_WIN } from "./plans.ts"

const content = loadRealContent()

/** 대륙 오버월드 스폰 — 칼라스 입구 `+`([14,24]) 바로 북쪽 칸. */
function overStart(): GameState {
  const base = createInitialState(content, 1)
  return { ...base, mapId: "map.over", player: { ...base.player, pos: { x: 14, y: 23 } } }
}

interface Run { state: GameState; events: GameEvent[]; moves: number }

/** 만든 명령을 그 자리에서 step으로 재생하며 상태·이벤트·걸음 수를 모은다. */
function run(): Run {
  let state = overStart()
  const events: GameEvent[] = []
  let moves = 0
  const push = (cmds: readonly Command[]): void => {
    for (const cmd of cmds) {
      if (cmd.type === "move") moves += 1
      const r = step(state, cmd, content)
      state = r.state
      events.push(...r.events)
    }
  }
  // 대륙 → 칼라스 들판(map.field) 다리 입구. 다리 [15,8]은 유일한 강 건널목이라 늑대 조우가 필수다.
  push(walkTo(content, state, "map.field", { x: 15, y: 8 }))
  push(WOLF_PUSH_WIN)                                             // 밀어내 전멸, 행실 없음
  // 들판 → 칼라스 마을(map.kalas)
  push(walkTo(content, state, "map.kalas", { x: 1, y: 12 }))
  // 칼라스 마을 → 들판 → 대륙 (들판의 `<` 출구로 되돌아온다)
  push(walkTo(content, state, "map.over", { x: 14, y: 24 }))
  // 대륙 → 다른 미덕 마을(compassion) 입장
  push(walkTo(content, state, "map.town.compassion", { x: 1, y: 1 }))
  // 미덕 마을 → 대륙 (마을 `<` 출구)
  push(walkTo(content, state, "map.over", { x: 50, y: 8 }))
  return { state, events, moves }
}

const result = run()

describe("m2 continent traversal", () => {
  it("walks the Kalas round trip and a virtue-town round trip, ending on the overworld", () => {
    expect(result.state.mapId).toBe("map.over")
    expect(result.state.player.pos).toEqual({ x: 50, y: 8 })
  })

  it("fires mapChanged for the Kalas entrance, its interior and the virtue town", () => {
    const changed = result.events.filter((e): e is { type: "mapChanged"; mapId: string } => e.type === "mapChanged").map((e) => e.mapId)
    expect(changed).toContain("map.field")
    expect(changed).toContain("map.kalas")
    expect(changed).toContain("map.town.compassion")
    expect(result.events.some((e) => e.type === "companionJoinRejected")).toBe(false)
  })

  it("advances time exactly one hour per walked step", () => {
    const total = 8 + result.moves
    expect(result.state.time).toEqual({ hour: total % 24, day: 1 + Math.floor(total / 24) })
    expect(result.moves).toBeGreaterThan(10)
    expect(result.events.filter((e) => e.type === "timePassed")).toHaveLength(result.moves)
  })
})
