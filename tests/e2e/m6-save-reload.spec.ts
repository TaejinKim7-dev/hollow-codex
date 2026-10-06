// B-2 스모크 e2e: 새 게임 → 칼라스 들판에서 NPC와 대화(단어 습득) → 저장 → 새로고침 → 불러오기.
// window.__hollowCodex__ 훅의 state/dispatch/handleMenu를 쓴다(B-1에서 main.ts가 export한 함수들).
// RED: 훅에 dispatch/handleMenu가 없으면 두 번째 단계에서 실패한다.
import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

interface Snapshot {
  readonly mapId: string
  readonly pos: { readonly x: number; readonly y: number }
  readonly time: { readonly hour: number; readonly day: number }
  readonly turn: number
  readonly facts: readonly string[]
}

interface GameHook {
  state(): {
    mapId: string
    player: { pos: { x: number; y: number } }
    time: { hour: number; day: number }
    turn: number
    facts: readonly string[]
  } | null
  dispatch(command: unknown): void
  handleMenu(action: "save" | "load" | "new", slotId: string): Promise<void>
}

async function waitForBoot(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const hook = (window as unknown as { __hollowCodex__?: { state(): unknown } }).__hollowCodex__
    return hook?.state() != null
  })
}

async function mapId(page: Page): Promise<string> {
  return (await page.evaluate(() => {
    return (window as unknown as { __hollowCodex__: { state(): { mapId: string } | null } }).__hollowCodex__.state()?.mapId ?? ""
  })) as string
}

async function snapshot(page: Page): Promise<Snapshot> {
  return (await page.evaluate(() => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    const s = hook.state()!
    return { mapId: s.mapId, pos: s.player.pos, time: s.time, turn: s.turn, facts: [...s.facts] }
  })) as Snapshot
}

/** dispatch(moveTo)를 반복해 target 칸까지 한 걸음씩 옮긴다. 훅의 터치 반복과 함께 수렴한다. */
async function walkTo(page: Page, target: { x: number; y: number }): Promise<void> {
  await page.evaluate((t) => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    for (let i = 0; i < 200; i++) {
      const s = hook.state()
      if (s === null) return
      if (s.player.pos.x === t.x && s.player.pos.y === t.y) return
      hook.dispatch({ type: "moveTo", target: t })
    }
  }, target)
  await page.waitForFunction((t) => {
    const hook = (window as unknown as { __hollowCodex__: { state(): { player: { pos: { x: number; y: number } } } | null } }).__hollowCodex__
    const s = hook.state()
    return s !== null && s.player.pos.x === t.x && s.player.pos.y === t.y
  }, target)
}

test("M6 smoke: new game → talk on the Kalas field → save → reload → load restores the state", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

  await page.goto("/hollow-codex/")
  await expect(page.locator("#screen")).toBeVisible()
  await waitForBoot(page)

  // 1. 첫 부팅은 콘텐츠 시작(칼라스 들판)이다.
  expect(await mapId(page)).toBe("map.field")

  // 2. 새 게임 (확인은 받는다).
  await page.evaluate(async () => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    ;(window as unknown as { confirm: (m?: string) => boolean }).confirm = () => true
    await hook.handleMenu("new", "slot-1")
  })
  expect((await snapshot(page)).turn).toBe(0)

  // 3. 칼라스 들판의 문지기 옆으로 걸어간다 (시각 8–11시 일과 칸).
  await walkTo(page, { x: 5, y: 8 })

  // 4. 대화: job → word.pilgrim, word.pilgrim → word.truth.
  await page.evaluate(() => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    hook.dispatch({ type: "interact", at: { x: 4, y: 8 } })
    hook.dispatch({ type: "ask", topic: "job" })
    hook.dispatch({ type: "ask", topic: "word.pilgrim" })
    hook.dispatch({ type: "endTalk" })
  })
  expect((await snapshot(page)).facts).toEqual(["word.pilgrim", "word.truth"])

  // 5. 저장 시점을 만든다 (위치도 기본값과 다르게).
  await page.evaluate(() => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    hook.dispatch({ type: "move", dir: "s" })
  })
  const before = await snapshot(page)
  expect(before.pos).toEqual({ x: 5, y: 9 })

  // 6. slot-1에 저장.
  await page.evaluate(async () => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    await hook.handleMenu("save", "slot-1")
  })

  // 7. 새로고침 → 다시 부팅(자동 슬롯은 비어 있어 새 게임).
  await page.reload()
  await waitForBoot(page)
  expect((await snapshot(page)).facts).toEqual([])

  // 8. slot-1 불러오기 → 저장 시점과 같아야 한다.
  await page.evaluate(async () => {
    const hook = (window as unknown as { __hollowCodex__: GameHook }).__hollowCodex__
    await hook.handleMenu("load", "slot-1")
  })
  const after = await snapshot(page)

  expect(after.mapId).toBe(before.mapId)
  expect(after.pos).toEqual(before.pos)
  expect(after.time).toEqual(before.time)
  expect(after.turn).toBe(before.turn)
  expect(after.facts).toEqual(before.facts)
  expect(errors).toEqual([])
})
