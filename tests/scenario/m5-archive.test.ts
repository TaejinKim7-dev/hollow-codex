// Task 44 — M5 봉인 서고 traversal + 빈 경전 8쪽 + 마지막 장 + 에필로그 시나리오.
// 실제 content/ 로 대륙에서 칼라스 들판의 봉인석을 밟아 서고에 들어가, 8개 벽감를 돌며
// 미덕 정답 단어를 적고, 마지막 장에 진실·사랑·용기를 골라 각 에필로그 이벤트가 나는지 검증한다.
import { describe, expect, it } from "vitest"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import {
  CODEX_PAGES,
  codexWordOf,
  EPILOGUE_BY_WORD,
  SEAL_CELL
} from "../../src/core/codex/codex.ts"
import type { Command, GameEvent, GameState, Id, Pos } from "../../src/core/types.ts"
import { loadRealContent, walkTo } from "./play.ts"

const content = loadRealContent()

/** 봉인 서고 8쪽 벽감의 `>` 셀. 서고 maps.yaml의 위·아래 4개씩 (Task 42). */
const ALCOVES: readonly Pos[] = [
  { x: 2, y: 2 },
  { x: 6, y: 2 },
  { x: 10, y: 2 },
  { x: 13, y: 2 },
  { x: 2, y: 16 },
  { x: 6, y: 16 },
  { x: 10, y: 16 },
  { x: 13, y: 16 }
]

/**
 * 열석 고리 7개를 이미 밟은(봉인 해제) 상태로 대륙 오버월드 칼라스 입구 앞에 선다.
 * 여덟 마을의 추론은 확정했고 그 답 단어를 안다 — 각 마을 시나리오(kalas-*, m3-*, m4-*)가 실제 플레이로
 * 확정까지 가는 것을 보이고, 여기서는 그 결과를 주입한다. 경전 쪽은 확정한 추론이 없으면 적히지 않는다.
 */
function unlockedOverworld(): GameState {
  const base = createInitialState(content, 1)
  const visited = Object.keys(content.rings).slice(0, 7)
  const deductions = Object.fromEntries(Object.entries(content.deductions).map(([id, d]) => [id, { slots: [...d.answer], confirmed: true }]))
  const facts = [...new Set(Object.values(content.deductions).flatMap((d) => d.answer))].sort()
  return {
    ...base,
    mapId: "map.over",
    player: { ...base.player, pos: { x: 14, y: 23 } },
    deductions,
    facts,
    rings: { ...base.rings, visited }
  }
}

interface Run { readonly state: GameState; readonly entered: GameState; readonly events: readonly GameEvent[] }

/** 대륙 → 들판 봉인석 → 서고 → 8쪽 → 마지막 장까지 명령을 재생하고 결과를 돌려준다. */
function runArchive(word: Id): Run {
  let state = unlockedOverworld()
  const events: GameEvent[] = []
  const push = (cmds: readonly Command[]): void => {
    for (const cmd of cmds) {
      const r = step(state, cmd, content)
      state = r.state
      events.push(...r.events)
    }
  }
  // 대륙 → 칼라스 들판 → 고리 안쪽 봉인석 [7,7]. 밟는 즉시 서고로 mapChanged.
  push(walkTo(content, state, "map.field", SEAL_CELL))
  const entered = state
  // 8개 벽감를 차례로 걸어가 정답 한 단어를 적는다.
  for (let i = 0; i < CODEX_PAGES.length; i++) {
    const page = CODEX_PAGES[i]!
    push(walkTo(content, state, "map.sealed-archive", ALCOVES[i]!))
    push([{ type: "writeCodex", deductionId: page.deductionId, word: codexWordOf(content, page.deductionId)! }])
  }
  // 마지막 장 "세 원리를 아우르는 하나".
  push([{ type: "writeFinal", word }])
  return { state, entered, events }
}

const runs = new Map<Id, Run>()
const run = (word: Id): Run => {
  const cached = runs.get(word)
  if (cached !== undefined) return cached
  const result = runArchive(word)
  runs.set(word, result)
  return result
}

describe("m5 sealed archive traversal", () => {
  it("walks from the overworld onto the seal and enters the sealed archive", () => {
    const { state, entered, events } = run("word.truth")
    expect(state.mapId).toBe("map.sealed-archive")
    expect(entered.mapId).toBe("map.sealed-archive")
    expect(entered.player.pos).toEqual({ x: 8, y: 1 })
    expect(events).toContainEqual({ type: "mapChanged", mapId: "map.sealed-archive" })
    expect(state.flags).toContain("flag.sealed-archive-opened")
  })

  it("does not enter the archive when fewer than 7 rings are visited", () => {
    const base = createInitialState(content, 1)
    const locked: GameState = {
      ...base,
      mapId: "map.field",
      player: { ...base.player, pos: { x: 7, y: 8 } }
    }
    let state = locked
    for (const cmd of walkTo(content, state, "map.field", SEAL_CELL)) state = step(state, cmd, content).state
    expect(state.mapId).toBe("map.field")
    expect(state.player.pos).toEqual(SEAL_CELL)
  })

  it("writes all 8 pages and opens the final page", () => {
    const { state } = run("word.truth")
    expect(Object.keys(state.codex.answers)).toHaveLength(8)
    for (const page of CODEX_PAGES) {
      expect(state.codex.answers[page.deductionId]).toBe(codexWordOf(content, page.deductionId))
    }
    expect(state.codex.finalOpen).toBe(true)
  })
})

describe("m5 final chapter epilogues", () => {
  const cases = [
    { word: "word.truth", kind: "truth" },
    { word: "word.love", kind: "love" },
    { word: "word.courage", kind: "courage" }
  ] as const

  for (const { word, kind } of cases) {
    it(`choosing ${word} records it and emits the ${kind} epilogue`, () => {
      const { state, events } = run(word)
      expect(state.codex.finalWord).toBe(word)
      expect(EPILOGUE_BY_WORD[word]).toBe(kind)
      expect(events).toContainEqual({ type: "codexFinalChosen", word })
      expect(events).toContainEqual({ type: "epilogue", kind })
      expect(events.filter((e) => e.type === "epilogue")).toHaveLength(1)
    })
  }
})
