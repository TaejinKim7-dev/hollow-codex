// @vitest-environment jsdom
// B-1(a) 화면 연결: 메뉴 저장·불러오기·새 시작. jsdom에서 main.ts를 부팅하고
// mountPanels → dispatch → handleMenu('save'|'load'|'new', slotId) 흐름을 실제로 탄다.
// RED: jsdom 미설치 + main.ts 부팅 진입 export 이전에는 이 파일이 로드되지 못한다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { bootTestApp, installBrowserStubs, stateOf, uninstallBrowserStubs } from "./harness.ts"

vi.mock("virtual:content", async () => {
  const { silentContent: makeContent } = await import("./harness.ts")
  return { default: makeContent() }
})
vi.mock("virtual:credits", () => ({ default: [] }))

const START = { x: 1, y: 1 }

beforeEach(() => {
  installBrowserStubs()
})

afterEach(() => {
  uninstallBrowserStubs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("menu: save / load / new game", () => {
  it("saves the selected slot and loads it back after later moves", async () => {
    const app = await bootTestApp()
    app.dispatch({ type: "move", dir: "e" })
    const saved = stateOf()
    expect(saved?.player.pos).toEqual({ x: 2, y: 1 })

    await app.handleMenu("save", "slot-2")
    app.dispatch({ type: "move", dir: "s" })
    expect(stateOf()?.player.pos).not.toEqual(saved?.player.pos)

    await app.handleMenu("load", "slot-2")
    expect(stateOf()).toEqual(saved)
  })

  it("new game asks for confirmation and resets to the content start", async () => {
    const app = await bootTestApp()
    app.dispatch({ type: "move", dir: "e" })
    expect(stateOf()?.player.pos).toEqual({ x: 2, y: 1 })

    vi.spyOn(window, "confirm").mockReturnValue(true)
    await app.handleMenu("new", "slot-1")

    expect(window.confirm).toHaveBeenCalled()
    expect(stateOf()?.player.pos).toEqual(START)
    expect(stateOf()?.facts).toEqual([])
  })

  it("new game keeps the current game when the player cancels", async () => {
    const app = await bootTestApp()
    app.dispatch({ type: "move", dir: "e" })
    const before = stateOf()

    vi.spyOn(window, "confirm").mockReturnValue(false)
    await app.handleMenu("new", "slot-1")

    expect(stateOf()).toBe(before)
  })

  it("the panel's New button reaches handleMenu through onMenu", async () => {
    const app = await bootTestApp()
    app.dispatch({ type: "move", dir: "e" })

    document.querySelector<HTMLButtonElement>(".open-menu")?.click()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    document.querySelector<HTMLButtonElement>(".menu-action.new")?.click()

    await vi.waitFor(() => {
      expect(stateOf()?.player.pos).toEqual(START)
    })
  })
})
