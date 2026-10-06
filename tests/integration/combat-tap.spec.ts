// @vitest-environment jsdom
// B-1(e) 화면 연결: 전투 탭. 전투 중 캔버스를 탭하면 frameViewport(전투 격자) → tileAtPointer로
// 칸을 구해 그 칸으로 이동한다(지도 뷰포트가 아니라 그려진 격자와 같은 칸).
// RED: jsdom 미설치 + tests/integration 미포함이라 지금은 로드되지 못한다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { frameViewport, tileAtPointer, TILE } from "../../src/render/viewport.ts"
import { bootTestApp, installBrowserStubs, silentContent, stateOf, uninstallBrowserStubs } from "./harness.ts"

vi.mock("virtual:content", async () => {
  const { silentContent: makeContent } = await import("./harness.ts")
  return { default: makeContent() }
})
vi.mock("virtual:credits", () => ({ default: [] }))

const CANVAS = { w: 1280, h: 720 }

beforeEach(() => {
  installBrowserStubs()
})

afterEach(() => {
  uninstallBrowserStubs()
  vi.restoreAllMocks()
  vi.resetModules()
})

/** start(1,1)에서 남쪽으로 두 걸음 — (1,3) 조우 칸에서 전투가 시작된다. */
async function bootIntoCombat(): Promise<typeof import("../../src/main.ts")> {
  const app = await bootTestApp()
  app.dispatch({ type: "move", dir: "s" })
  app.dispatch({ type: "move", dir: "s" })
  expect(stateOf()?.combat).not.toBeNull()
  return app
}

function canvas(): HTMLCanvasElement {
  return document.getElementById("screen") as HTMLCanvasElement
}

function cellPoint(cell: { x: number; y: number }, vp: ReturnType<typeof frameViewport>): { x: number; y: number } {
  const size = TILE * vp.scale
  return { x: vp.offsetPx.x + cell.x * size + size / 2, y: vp.offsetPx.y + cell.y * size + size / 2 }
}

describe("combat tap", () => {
  it("a tap on a drawn grid cell becomes a combat move to that cell", async () => {
    await bootIntoCombat()
    const content = silentContent()
    const before = stateOf()
    expect(before?.combat).not.toBeNull()

    const vp = frameViewport(before!, content, CANVAS)
    const target = { x: 2, y: 3 } // 플레이어 (2,4) 바로 위 빈 칸
    const point = cellPoint(target, vp)

    canvas().dispatchEvent(new MouseEvent("pointerdown", { clientX: point.x, clientY: point.y, bubbles: true }))

    const player = stateOf()?.combat?.units.find((u) => u.id === "player")
    expect(player?.pos).toEqual(target)
  })

  it("tileAtPointer with the frame viewport maps drawn cells back to grid cells", async () => {
    await bootIntoCombat()
    const content = silentContent()
    const state = stateOf()!
    const vp = frameViewport(state, content, CANVAS)

    for (const cell of [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 1, y: 2 }]) {
      expect(tileAtPointer(state, content, CANVAS, cellPoint(cell, vp))).toEqual(cell)
    }
  })
})
