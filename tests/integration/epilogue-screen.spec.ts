// @vitest-environment jsdom
// B-1(c) 화면 연결: 마지막 장 → 에필로그. writeFinal이 고른 원리의 이벤트를 내고,
// 빈 경전 패널이 그 원리의 제목·머리말·마을 메시지 8개를 실제로 그린다.
// RED: jsdom 미설치 + tests/integration 미포함이라 지금은 로드되지 못한다.
import { describe, expect, it } from "vitest"
import { createInitialState } from "../../src/core/state.ts"
import type { GameState, Id } from "../../src/core/types.ts"
import { writeFinal } from "../../src/core/codex/codex.ts"
import { EPILOGUES, getEpilogue, selectEpilogue } from "../../src/core/epilogue/epilogue.ts"
import { mountPanels } from "../../src/ui/panels.ts"
import { t } from "../../src/ui/strings.ts"
import { loadRealContent } from "../scenario/play.ts"

const content = loadRealContent()
const words: readonly Id[] = ["word.truth", "word.love", "word.courage"]

/** 봉인 서고에 있고 8쪽을 다 적은 상태. */
function finalOpenState(): GameState {
  const base = createInitialState(content, 1)
  return { ...base, mapId: "map.sealed-archive", codex: { ...base.codex, finalOpen: true } }
}

function mount(): { root: HTMLElement; panels: ReturnType<typeof mountPanels> } {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const panels = mountPanels(root, content, () => {}, [])
  return { root, panels }
}

describe("final chapter → epilogue", () => {
  it("writeFinal emits the chosen principle and the matching epilogue", () => {
    for (const word of words) {
      const r = writeFinal(finalOpenState(), word, content)
      const kind = selectEpilogue(word)
      expect(r.state.codex.finalWord).toBe(word)
      expect(r.events).toContainEqual({ type: "codexFinalChosen", word })
      expect(r.events).toContainEqual({ type: "epilogue", kind })
    }
  })

  it("has three epilogues with eight town messages each", () => {
    expect(EPILOGUES).toHaveLength(3)
    for (const entry of EPILOGUES) {
      expect(entry.townMessages).toHaveLength(8)
      expect(new Set(entry.townMessages.map((m) => m.townId)).size).toBe(8)
    }
  })

  it("renders the chosen word's title and eight town messages in the codex panel", () => {
    const { root, panels } = mount()
    for (const word of words) {
      const entry = getEpilogue(word)
      const state = writeFinal(finalOpenState(), word, content).state
      panels.render(state, [])

      const title = root.querySelector(".codex .epilogue .epilogue-title")?.textContent
      expect(title).toBe(t("ko", content.strings, entry.titleKey))
      expect(title).not.toContain("⟦")

      const messages = [...root.querySelectorAll(".codex .epilogue .towns .town-message")].map((n) => n.textContent)
      expect(messages).toHaveLength(8)
      expect(messages).toEqual(entry.townMessages.map((m) => t("ko", content.strings, m.messageKey)))
      expect(messages.some((text) => (text ?? "").includes("⟦"))).toBe(false)
    }
  })

  it("shows a different epilogue for each principle (no shared town text)", () => {
    const { root, panels } = mount()
    const rendered: string[][] = []
    for (const word of words) {
      panels.render(writeFinal(finalOpenState(), word, content).state, [])
      rendered.push([...root.querySelectorAll(".codex .epilogue .town-message")].map((n) => n.textContent ?? ""))
    }
    expect(rendered[0]).not.toEqual(rendered[1])
    expect(rendered[1]).not.toEqual(rendered[2])
    expect(rendered[0]).not.toEqual(rendered[2])
  })
})
