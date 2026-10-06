// Task 13 PART B: #ui 아래 DOM 패널 마운트. ui/ 는 core가 아니므로 DOM 접근을 쓴다.
// 모든 화면 문구는 content/strings/ko.yaml 키를 t()로 조회한다. 화면 코드에 한국어를 직접 쓰지 않는다.
// 언어(ko/en)는 state.language에서 온다. 고정 문구는 refreshStatics()가 언어 변경 시 다시 채운다.
import "./panels.css"
import type { LedgerRow } from "../content/ledger.ts"
import type { FactKind, GameContent } from "../content/types.ts"
import type { CombatAction, Command, Dir, GameState, Id, Pos, TimeState } from "../core/types.ts"
import type { UiAction } from "../input/commands.ts"
import { computeViewport, screenToTile } from "../render/viewport.ts"
import { offset } from "../core/world/path.ts"
import { t } from "./strings.ts"
import { combatView, codexView, dialogueView, notebookView, type NotebookView, type SaidLine } from "./view-model.ts"

type TabName = "facts" | "deductions" | "hints"
/** 방향 대기 상태(panels 안의 지역 상태). move는 칸 대기, 나머지는 방향 대기. */
type Aim = { readonly kind: "move" } | { readonly kind: "attack" | "push" | "persuade" }

const FACT_KINDS: readonly FactKind[] = ["person", "place", "word", "song", "meaning", "creature"]
const DIR_KEYS: Readonly<Record<string, Dir>> = {
  ArrowUp: "n", w: "n", W: "n",
  ArrowRight: "e", d: "e", D: "e",
  ArrowDown: "s", s: "s", S: "s",
  ArrowLeft: "w", a: "w", A: "w"
}
const SLOT_IDS = ["auto", "slot-1", "slot-2", "slot-3"] as const
const SLOT_SUFFIX: Readonly<Record<string, string>> = { auto: "A", "slot-1": "1", "slot-2": "2", "slot-3": "3" }

/** 태그·클래스·텍스트로 요소를 만든다. 44px 터치 최소 크기는 panels.css가 보장한다. */
function make<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className !== undefined) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** from에서 to가 인접한 방향만. 대각선·2칸 이상이면 null. */
const dirFromOffset = (from: Pos, to: Pos): Dir | null => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 1 && dy === 0) return "e"
  if (dx === -1 && dy === 0) return "w"
  if (dy === 1 && dx === 0) return "s"
  if (dy === -1 && dx === 0) return "n"
  return null
}

/** 크레딧 분류. 순서는 화면 표시 순서다. LEDGER에 'code' 행이 없으면 그 묶음은 그리지 않는다. */
type CreditCategory = "fonts" | "tiles" | "music" | "code"
const CREDIT_CATEGORIES: readonly CreditCategory[] = ["fonts", "tiles", "music", "code"]

/** 자산 경로로 크레딧 묶음을 정한다. 알 수 없는 경로는 code로 모은다. */
function creditCategory(path: string): CreditCategory {
  if (path.startsWith("assets/fonts/")) return "fonts"
  if (path.startsWith("assets/tiles/")) return "tiles"
  if (path.startsWith("content/music/")) return "music"
  return "code"
}

/** 원래 순서를 유지하며 경로 기준으로 묶는다. 빈 묶음은 돌려주지 않는다. */
function groupCredits(rows: readonly LedgerRow[]): readonly [CreditCategory, readonly LedgerRow[]][] {
  const groups = new Map<CreditCategory, LedgerRow[]>()
  for (const row of rows) {
    const category = creditCategory(row.path)
    const list = groups.get(category)
    if (list === undefined) groups.set(category, [row])
    else list.push(row)
  }
  return CREDIT_CATEGORIES.flatMap((category) => {
    const list = groups.get(category)
    return list === undefined ? [] : [[category, list] as const]
  })
}

/** 게임 시간 표시 문자열. {day}일차 {hour}시 형태로 ui.day-hour 키를 치환한다. */
export function formatTime(lang: string, strings: GameContent["strings"], time: TimeState): string {
  return t(lang, strings, "ui.day-hour", { day: String(time.day), hour: String(time.hour) })
}

export interface MountedPanels {
  render(state: GameState, log: readonly SaidLine[]): void
  toggle(panel: "notebook" | "menu" | "rings"): void
  onMenu(handler: (action: "save" | "load" | "new") => void): void
}

export function mountPanels(
  root: HTMLElement,
  content: GameContent,
  dispatch: (c: Command | UiAction) => void,
  credits: readonly LedgerRow[]
): MountedPanels {
  const s = content.strings
  let state: GameState | null = null
  let log: readonly SaidLine[] = []
  let aim: Aim | null = null
  let lang: "ko" | "en" = "ko"
  let menuAction: ((action: "save" | "load" | "new") => void) | null = null
  const canvas = document.getElementById("screen") as HTMLCanvasElement | null

  /** 현재 언어로 문자열을 조회한다. 언어는 render가 state.language로 갱신한다. */
  const tr = (key: string, vars?: Readonly<Record<string, string>>): string => t(lang, s, key, vars)

  /** 화면 구석 버튼(generic Chrome)이 가려져야 하는지. */
  const syncChrome = (): void => {
    const covered = !dialogue.hidden || !notebook.hidden || !menu.hidden || !ringsMenu.hidden || !codex.hidden
    openNotebook.hidden = covered
    openRings.hidden = covered
    openMenu.hidden = covered
    openCodex.hidden = covered || state?.mapId !== "map.sealed-archive"
  }

  // ── 화면 오른쪽 위 버튼 ────────────────
  const openNotebook = make("button", "open-notebook")
  openNotebook.addEventListener("click", () => toggle("notebook"))
  const openRings = make("button", "open-rings")
  openRings.addEventListener("click", () => toggle("rings"))
  const openMenu = make("button", "open-menu")
  openMenu.addEventListener("click", () => toggle("menu"))
  const openCodex = make("button", "open-codex")
  openCodex.hidden = true
  openCodex.addEventListener("click", () => {
    codex.hidden = !codex.hidden
    if (!codex.hidden) {
      notebook.hidden = true
      menu.hidden = true
      ringsMenu.hidden = true
    }
    syncChrome()
  })
  const timeIndicator = make("div", "time-indicator")

  // ── 대화 패널 ─────────────────────────
  const dialogue = make("section", "dialogue")
  dialogue.hidden = true
  const dlgHeader = make("header")
  const dlgName = make("span", "npc-name")
  const dlgClose = make("button", "close")
  dlgClose.addEventListener("click", () => dispatch({ type: "endTalk" }))
  dlgHeader.append(dlgName, dlgClose)
  const dlgLog = make("div", "log")
  const dlgChips = make("div", "chips")
  const dlgChoices = make("div", "choices")
  const dlgCrisis = make("div", "crisis")
  const dlgRecruit = make("button", "recruit")
  dlgRecruit.hidden = true
  dlgRecruit.addEventListener("click", () => {
    const npcId = state?.dialogue?.npcId
    if (npcId !== undefined) dispatch({ type: "recruit", npcId })
  })
  const dlgEndTalk = make("button", "end-talk")
  dlgEndTalk.addEventListener("click", () => dispatch({ type: "endTalk" }))
  dialogue.append(dlgHeader, dlgLog, dlgChips, dlgChoices, dlgCrisis, dlgRecruit, dlgEndTalk)

  /** 선택지 optionId가 어느 위기(crisisId) 것인지. 대화 중인 NPC의 미해결 위기만 본다. */
  const crisisIdForOption = (optionId: Id): Id | null => {
    const npcId = state?.dialogue?.npcId
    if (npcId === undefined) return null
    for (const [crisisId, crisis] of Object.entries(content.crises)) {
      if (crisis.npc !== npcId) continue
      if (state !== null && state.crises[crisisId] !== undefined) continue
      if (crisis.options[optionId] !== undefined) return crisisId
    }
    return null
  }

  const renderDialogue = (next: GameState): void => {
    const view = dialogueView(next, content, log)
    if (view === null) {
      dialogue.hidden = true
      syncChrome()
      return
    }
    dialogue.hidden = false
    dlgName.textContent = view.npcName

    dlgLog.replaceChildren()
    for (const line of view.lines) {
      const row = make("div", "line")
      row.appendChild(make("span", "text", line.text))
      if (line.lieMark) row.appendChild(make("span", "lie-mark", "!"))
      dlgLog.appendChild(row)
    }

    dlgChips.replaceChildren()
    for (const chip of view.chips) {
      const b = make("button", "chip", chip.label)
      b.setAttribute("aria-label", tr("ui.aria.ask-topic", { topic: chip.label }))
      b.addEventListener("click", () => dispatch({ type: "ask", topic: chip.topic }))
      dlgChips.appendChild(b)
    }

    dlgChoices.replaceChildren()
    for (const choice of view.choices) {
      const b = make("button", "choice", choice.label)
      b.setAttribute("aria-label", tr("ui.aria.choose-option", { option: choice.label }))
      b.addEventListener("click", () => dispatch({ type: "choose", optionId: choice.optionId }))
      dlgChoices.appendChild(b)
    }

    dlgCrisis.replaceChildren()
    if (view.crisis !== null) {
      for (const row of view.crisis) {
        const wrap = make("div", "crisis-option")
        const b = make("button", "crisis", row.label)
        b.setAttribute("aria-label", tr("ui.aria.choose-option", { option: row.label }))
        b.disabled = !row.available
        b.addEventListener("click", () => {
          const crisisId = crisisIdForOption(row.optionId)
          if (crisisId !== null) dispatch({ type: "resolveCrisis", crisisId, optionId: row.optionId })
        })
        wrap.appendChild(b)
        if (row.hints.length > 0) {
          const hints = make("ul", "hints")
          for (const hint of row.hints) hints.appendChild(make("li", undefined, hint))
          wrap.appendChild(hints)
        }
        dlgCrisis.appendChild(wrap)
      }
    }

    dlgRecruit.hidden = !view.canRecruit
    syncChrome()
  }

  // ── 수첩 패널 ─────────────────────────
  const notebook = make("section", "notebook")
  notebook.hidden = true
  const noteHeader = make("header")
  const noteTitle = make("span", "title")
  noteHeader.appendChild(noteTitle)
  const noteClose = make("button", "close")
  noteClose.addEventListener("click", () => {
    notebook.hidden = true
    syncChrome()
  })
  noteHeader.appendChild(noteClose)
  const tabButtons: Record<TabName, HTMLButtonElement> = {
    facts: make("button", "tab-button active"),
    deductions: make("button", "tab-button"),
    hints: make("button", "tab-button")
  }
  const tabs = make("nav", "tabs")
  tabs.append(tabButtons.facts, tabButtons.deductions, tabButtons.hints)
  const tabFacts = make("div", "tab facts")
  const tabDeductions = make("div", "tab deductions")
  tabDeductions.hidden = true
  const tabHints = make("div", "tab hints")
  tabHints.hidden = true
  notebook.append(noteHeader, tabs, tabFacts, tabDeductions, tabHints)

  const switchTab = (tab: TabName): void => {
    for (const [name, btn] of Object.entries(tabButtons) as [TabName, HTMLButtonElement][]) {
      btn.classList.toggle("active", name === tab)
    }
    tabFacts.hidden = tab !== "facts"
    tabDeductions.hidden = tab !== "deductions"
    tabHints.hidden = tab !== "hints"
  }
  tabButtons.facts.addEventListener("click", () => switchTab("facts"))
  tabButtons.deductions.addEventListener("click", () => switchTab("deductions"))
  tabButtons.hints.addEventListener("click", () => switchTab("hints"))

  /** 추론 문장의 {1}{2}{3} 자리를 <select>로 바꾼다. 확정 페이지는 select 비활성. */
  const sentenceRow = (ded: NotebookView["deductions"][number]): HTMLElement => {
    const row = make("span", "sentence")
    const parts = ded.sentence.split(/\{([123])\}/)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!
      if (part === "") continue
      if (part === "1" || part === "2" || part === "3") {
        const slot = Number(part) - 1
        const select = make("select", "slot")
        select.setAttribute("aria-label", tr("ui.aria.deduction-slot", { n: String(slot + 1) }))
        select.disabled = ded.confirmed
        select.appendChild(make("option"))
        for (const word of ded.words) {
          const opt = make("option", undefined, word.label)
          opt.value = word.id
          select.appendChild(opt)
        }
        const current = ded.slots[slot] ?? null
        const currentId = current === null ? null : ded.words.find((w) => w.label === current)?.id ?? null
        if (currentId !== null) select.value = currentId
        select.addEventListener("change", () => {
          const word = select.value === "" ? null : select.value
          dispatch({ type: "fillSlot", deductionId: ded.id, slot, word })
        })
        row.appendChild(select)
      } else {
        row.appendChild(document.createTextNode(part))
      }
    }
    return row
  }

  const renderNotebook = (next: GameState): void => {
    const view = notebookView(next, content)

    tabFacts.replaceChildren()
    for (const kind of FACT_KINDS) {
      const items = view.facts[kind]
      if (items.length === 0) continue
      const group = make("div", "fact-group")
      group.appendChild(make("h3", "kind", tr(`ui.kind.${kind}`)))
      const ul = make("ul", "facts")
      for (const item of items) ul.appendChild(make("li", undefined, item.label))
      group.appendChild(ul)
      tabFacts.appendChild(group)
    }

    tabDeductions.replaceChildren()
    for (const ded of view.deductions) {
      const page = make("div", "deduction")
      if (ded.confirmed) page.classList.add("confirmed")
      page.appendChild(sentenceRow(ded))
      tabDeductions.appendChild(page)
    }

    tabHints.replaceChildren()
    const hints = make("ul", "hints")
    for (const hint of view.hints) hints.appendChild(make("li", undefined, hint))
    tabHints.appendChild(hints)
  }

  // ── 전투 HUD ──────────────────────────
  const hud = make("section", "combat-hud")
  hud.hidden = true
  const hudInfo = make("div", "info")
  const hudActive = make("span", "active")
  hudInfo.appendChild(hudActive)
  const hudUnits = make("div", "units")
  const hudActions = make("div", "actions")
  hud.append(hudInfo, hudUnits, hudActions)

  const combatActor = (): { readonly pos: Pos } | null => {
    const combat = state?.combat
    if (combat === null || combat === undefined) return null
    return combat.units.find((u) => u.id === combat.active) ?? null
  }

  /** 캔버스 클릭 위치를 전투 격자 타일로. drawCombat과 같은 뷰포트 계산을 따른다. */
  const canvasToGrid = (event: PointerEvent): Pos | null => {
    if (canvas === null) return null
    const combat = state?.combat
    if (combat === null || combat === undefined) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    const mapSize = { w: combat.grid[0]?.length ?? 0, h: combat.grid.length }
    const actor = combat.units.find((u) => u.id === combat.active)
    const vp = computeViewport({ w: canvas.width, h: canvas.height }, 1, mapSize, actor?.pos ?? { x: 0, y: 0 })
    const px = (event.clientX - rect.left) * (canvas.width / rect.width)
    const py = (event.clientY - rect.top) * (canvas.height / rect.height)
    return screenToTile({ x: px, y: py }, vp)
  }

  const onActionClick = (kind: CombatAction["kind"]): void => {
    const current = state
    if (current === null) return
    if (kind === "attack" || kind === "push" || kind === "persuade") {
      aim = aim !== null && aim.kind === kind ? null : { kind }
      renderCombat(current)
      return
    }
    if (kind === "move") {
      // 이동은 직접(방향 키/인접 탭). 대기 중이면 취소.
      aim = aim !== null ? null : { kind }
      renderCombat(current)
      return
    }
    aim = null
    dispatch({ type: "combat", action: { kind } })
  }

  const renderCombat = (next: GameState): void => {
    const view = combatView(next, content)
    if (view === null) {
      hud.hidden = true
      aim = null
      syncChrome()
      return
    }
    hud.hidden = false
    hudActive.textContent = view.active

    hudUnits.replaceChildren()
    for (const unit of view.units) {
      const chip = make("span", `unit side-${unit.side}`, `${unit.name} · HP ${unit.hp}`)
      if (unit.side === "enemy") {
        const nature = unit.evilKnown === null
          ? tr("ui.unknown-nature")
          : unit.evilKnown ? tr("ui.evil") : tr("ui.not-evil")
        chip.appendChild(make("span", "nature", `(${nature})`))
      }
      hudUnits.appendChild(chip)
    }

    hudActions.replaceChildren()
    for (const kind of view.actions) {
      const b = make("button", `action ${kind}`, tr(`ui.combat.${kind}`))
      b.setAttribute("aria-label", tr(`ui.combat.${kind}`))
      if (aim !== null && aim.kind === kind) b.classList.add("aiming")
      b.addEventListener("click", () => onActionClick(kind))
      hudActions.appendChild(b)
    }
    hud.classList.toggle("aiming", aim !== null)
    syncChrome()
  }

  /** 방향 대기 중: 다음 방향 키를 소비해 combat 명령을 만든다. 핵심 입력 처리로 새지 않게 막는다. */
  const onKeyDown = (event: KeyboardEvent): void => {
    const a = aim
    if (a === null) return
    const dir = DIR_KEYS[event.key]
    if (dir === undefined) return
    const current = state
    const actor = current === null ? null : combatActor()
    if (current === null || actor === null) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (a.kind === "move") {
      dispatch({ type: "combat", action: { kind: "move", to: offset(actor.pos, dir) } })
    } else {
      dispatch({ type: "combat", action: { kind: a.kind, dir } })
    }
    aim = null
    renderCombat(current)
  }
  window.addEventListener("keydown", onKeyDown)

  /** 방향 대기 중: 인접 칸 탭을 소비해 방향을 구한다. move는 아무 칸 탭. */
  const onCanvasPointer = (event: PointerEvent): void => {
    const a = aim
    if (a === null) return
    const current = state
    const actor = current === null ? null : combatActor()
    if (current === null || actor === null) return
    const tile = canvasToGrid(event)
    if (tile === null) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (a.kind === "move") {
      dispatch({ type: "combat", action: { kind: "move", to: tile } })
    } else {
      const dir = dirFromOffset(actor.pos, tile)
      if (dir === null) return
      dispatch({ type: "combat", action: { kind: a.kind, dir } })
    }
    aim = null
    renderCombat(current)
  }
  canvas?.addEventListener("pointerdown", onCanvasPointer)

  // ── 메뉴 패널 ─────────────────────────
  const menu = make("section", "menu")
  menu.hidden = true
  const menuHeader = make("header")
  const menuTitle = make("span", "title")
  menuHeader.appendChild(menuTitle)
  const menuClose = make("button", "close")
  menuClose.addEventListener("click", () => {
    menu.hidden = true
    syncChrome()
  })
  menuHeader.appendChild(menuClose)

  const slots = make("div", "slots")
  const slotButtons = new Map<string, HTMLButtonElement>()
  for (const id of SLOT_IDS) {
    const b = make("button", "slot")
    b.dataset["slot"] = id
    b.addEventListener("click", () => {
      for (const [slotId, btn] of slotButtons) btn.classList.toggle("selected", slotId === id)
    })
    slotButtons.set(id, b)
    slots.appendChild(b)
  }
  const menuSave = make("button", "menu-action save")
  menuSave.addEventListener("click", () => menuAction?.("save"))
  const menuLoad = make("button", "menu-action load")
  menuLoad.addEventListener("click", () => menuAction?.("load"))
  const menuNew = make("button", "menu-action new")
  menuNew.addEventListener("click", () => menuAction?.("new"))
  const langButton = make("button", "menu-action language")
  langButton.addEventListener("click", () => {
    dispatch({ type: "setLanguage", language: lang === "ko" ? "en" : "ko" })
  })

  const creditsBox = make("details", "credits")
  const creditsSummary = make("summary")
  creditsBox.appendChild(creditsSummary)
  const creditsIntro = make("p", "intro")
  creditsBox.appendChild(creditsIntro)
  const creditsGroupTitles = new Map<CreditCategory, HTMLHeadingElement>()
  for (const [category, rows] of groupCredits(credits)) {
    const group = make("section", `credits-group ${category}`)
    const title = make("h4", "group-title")
    creditsGroupTitles.set(category, title)
    group.appendChild(title)
    const list = make("ul", "list")
    for (const row of rows) {
      list.appendChild(make("li", "credit", `${row.author} · ${row.license} · ${row.source}`))
    }
    group.appendChild(list)
    creditsBox.appendChild(group)
  }

  menu.append(menuHeader, slots, menuSave, menuLoad, menuNew, langButton, creditsBox)

  // ── 열석 고리 메뉴 ────────────────────
  const ringsMenu = make("section", "rings-menu")
  ringsMenu.hidden = true
  const ringsHeader = make("header")
  const ringsTitle = make("span", "title")
  ringsHeader.appendChild(ringsTitle)
  const ringsClose = make("button", "close")
  ringsClose.addEventListener("click", () => {
    ringsMenu.hidden = true
    syncChrome()
  })
  ringsHeader.appendChild(ringsClose)
  const ringsList = make("div", "rings")
  ringsMenu.append(ringsHeader, ringsList)

  /** state.rings.knownFacts로 열린 고리(songKey 아는 고리)를 나열한다. 없으면 안내 문구. */
  const renderRings = (next: GameState): void => {
    const available = Object.entries(content.moongates).filter(([, g]) =>
      next.rings.knownFacts.includes(g.fact)
    )
    ringsList.replaceChildren()
    if (available.length === 0) {
      ringsList.appendChild(make("p", "empty", tr("ui.no-rings")))
      return
    }
    for (const [ringId, gate] of available) {
      const row = make("div", "ring")
      row.appendChild(make("span", "name", tr(gate.nameKey)))
      row.appendChild(make("span", "song", tr(gate.songKey)))
      const go = make("button", "travel", tr("ui.ring-travel"))
      go.setAttribute("aria-label", tr("ui.aria.travel", { name: tr(gate.nameKey) }))
      go.addEventListener("click", () => {
        dispatch({ type: "ringStep", at: ringId })
        ringsMenu.hidden = true
        syncChrome()
      })
      row.appendChild(go)
      ringsList.appendChild(row)
    }
  }

  // ── 빈 경전 (M5 Task 42) ───────────────
  const codex = make("section", "codex")
  codex.hidden = true
  const codexHeader = make("header")
  const codexTitle = make("span", "title")
  codexHeader.appendChild(codexTitle)
  const codexClose = make("button", "close")
  codexClose.addEventListener("click", () => {
    codex.hidden = true
    syncChrome()
  })
  codexHeader.appendChild(codexClose)
  const codexPages = make("div", "pages")
  const codexFinal = make("div", "final-page")
  const codexEpilogue = make("section", "epilogue")
  codex.append(codexHeader, codexPages, codexFinal, codexEpilogue)

  /** 8쪽 슬롯과 마지막 장·에필로그 화면. 서고(map.sealed-archive)에 있을 때만 버튼이 보인다. */
  const renderCodex = (next: GameState): void => {
    const view = codexView(next, content)

    codexPages.replaceChildren()
    for (const page of view.pages) {
      const row = make("div", "page")
      row.appendChild(make("h3", "page-title", page.title))
      if (page.answer !== null) {
        row.classList.add("written")
        row.appendChild(make("p", "answer", page.answer))
      } else {
        const select = make("select", "word")
        select.setAttribute("aria-label", tr("ui.aria.codex-page", { name: page.title }))
        select.disabled = view.finalOpen
        select.appendChild(make("option"))
        for (const word of page.words) {
          const opt = make("option", undefined, word.label)
          opt.value = word.id
          select.appendChild(opt)
        }
        const write = make("button", "write", tr("archive.alcove.write"))
        write.setAttribute("aria-label", tr("ui.aria.codex-write", { name: page.title }))
        write.disabled = view.finalOpen
        write.addEventListener("click", () => {
          if (select.value !== "") dispatch({ type: "writeCodex", deductionId: page.deductionId, word: select.value })
        })
        row.append(select, write)
      }
      codexPages.appendChild(row)
    }

    codexFinal.replaceChildren()
    if (view.finalOpen && view.finalWord === null) {
      codexFinal.appendChild(make("h3", "final-title", tr("archive.final-page.title")))
      codexFinal.appendChild(make("p", "prompt", tr("archive.final-page.prompt")))
      for (const choice of view.finalChoices) {
        const b = make("button", "final", choice.label)
        b.setAttribute("aria-label", tr("ui.aria.final", { name: choice.label }))
        b.addEventListener("click", () => dispatch({ type: "writeFinal", word: choice.id }))
        codexFinal.appendChild(b)
      }
    }

    codexEpilogue.replaceChildren()
    codexEpilogue.hidden = view.finalWord === null
    if (view.finalWord !== null) {
      codexEpilogue.appendChild(make("h3", "epilogue-title", tr("archive.epilogue.title")))
      codexEpilogue.appendChild(make("p", "word", view.finalWord))
      codexEpilogue.appendChild(make("p", "placeholder", tr("archive.epilogue.placeholder")))
    }

    if (next.mapId !== "map.sealed-archive") codex.hidden = true
    syncChrome()
  }

  // ── 조립 ──────────────────────────────
  root.append(openNotebook, openRings, openMenu, openCodex, timeIndicator, dialogue, notebook, hud, menu, ringsMenu, codex)

  /** Escape로 열린 덮개를 닫고 연 버튼으로 초점을 돌린다. 연 덮개가 없으면 기본 입력(Escape→메뉴)에 맡긴다. */
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return
    let trigger: HTMLButtonElement | null = null
    if (!codex.hidden) {
      codex.hidden = true
      trigger = openCodex
    } else if (!notebook.hidden) {
      notebook.hidden = true
      trigger = openNotebook
    } else if (!menu.hidden) {
      menu.hidden = true
      trigger = openMenu
    } else if (!ringsMenu.hidden) {
      ringsMenu.hidden = true
      trigger = openRings
    } else {
      return
    }
    aim = null
    syncChrome()
    trigger.focus()
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  window.addEventListener("keydown", onEscape)

  /** 고정 문구 전부를 현재 언어(lang)로 다시 채운다. 언어가 바뀌었을 때만 render가 부른다. */
  const refreshStatics = (): void => {
    openNotebook.textContent = tr("ui.notebook")
    openNotebook.setAttribute("aria-label", tr("ui.aria.open-notebook"))
    openRings.textContent = tr("ui.open-rings")
    openRings.setAttribute("aria-label", tr("ui.aria.open-rings"))
    openMenu.textContent = tr("ui.menu")
    openMenu.setAttribute("aria-label", tr("ui.aria.open-menu"))
    openCodex.textContent = tr("ui.open-codex")
    openCodex.setAttribute("aria-label", tr("ui.aria.open-codex"))
    dlgClose.textContent = tr("ui.close")
    dlgClose.setAttribute("aria-label", tr("ui.close"))
    dlgRecruit.textContent = tr("ui.recruit")
    dlgRecruit.setAttribute("aria-label", tr("ui.aria.recruit"))
    dlgEndTalk.textContent = tr("ui.end-talk")
    dlgEndTalk.setAttribute("aria-label", tr("ui.end-talk"))
    noteTitle.textContent = tr("ui.notebook")
    noteClose.textContent = tr("ui.close")
    noteClose.setAttribute("aria-label", tr("ui.close"))
    tabButtons.facts.textContent = tr("ui.tab.facts")
    tabButtons.deductions.textContent = tr("ui.tab.deductions")
    tabButtons.hints.textContent = tr("ui.tab.hints")
    tabButtons.facts.setAttribute("aria-label", tr("ui.aria.tab", { tab: tr("ui.tab.facts") }))
    tabButtons.deductions.setAttribute("aria-label", tr("ui.aria.tab", { tab: tr("ui.tab.deductions") }))
    tabButtons.hints.setAttribute("aria-label", tr("ui.aria.tab", { tab: tr("ui.tab.hints") }))
    menuTitle.textContent = tr("ui.menu")
    menuClose.textContent = tr("ui.close")
    menuClose.setAttribute("aria-label", tr("ui.close"))
    for (const id of SLOT_IDS) {
      const b = slotButtons.get(id)
      if (b === undefined) continue
      b.textContent = `${tr("ui.save")} ${SLOT_SUFFIX[id] ?? id}`
      b.setAttribute("aria-label", tr("ui.aria.save-slot", { slot: SLOT_SUFFIX[id] ?? id }))
    }
    menuSave.textContent = tr("ui.save")
    menuSave.setAttribute("aria-label", tr("ui.save"))
    menuLoad.textContent = tr("ui.load")
    menuLoad.setAttribute("aria-label", tr("ui.load"))
    menuNew.textContent = tr("ui.new")
    menuNew.setAttribute("aria-label", tr("ui.new"))
    langButton.textContent = tr("ui.language")
    langButton.setAttribute("aria-label", tr("ui.language"))
    creditsSummary.textContent = tr("ui.credits")
    creditsSummary.setAttribute("aria-label", tr("ui.credits"))
    creditsIntro.textContent = tr("ui.credits-intro")
    for (const [category, title] of creditsGroupTitles) title.textContent = tr(`ui.credits.group.${category}`)
    ringsTitle.textContent = tr("ui.open-rings")
    ringsClose.textContent = tr("ui.close")
    ringsClose.setAttribute("aria-label", tr("ui.close"))
    codexTitle.textContent = tr("archive.name")
    codexClose.textContent = tr("ui.close")
    codexClose.setAttribute("aria-label", tr("ui.close"))
  }

  const toggle = (panel: "notebook" | "menu" | "rings"): void => {
    notebook.hidden = panel !== "notebook" ? true : !notebook.hidden
    menu.hidden = panel !== "menu" ? true : !menu.hidden
    ringsMenu.hidden = panel !== "rings" ? true : !ringsMenu.hidden
    codex.hidden = true
    aim = null
    syncChrome()
  }

  const onMenu = (handler: (action: "save" | "load" | "new") => void): void => {
    menuAction = handler
  }

  refreshStatics()
  syncChrome()

  return {
    render(nextState, lines) {
      state = nextState
      log = lines
      if (nextState.language !== lang) {
        lang = nextState.language
        refreshStatics()
      }
      const timeText = formatTime(lang, s, nextState.time)
      timeIndicator.textContent = timeText
      timeIndicator.setAttribute("aria-label", tr("ui.aria.time", { time: timeText }))
      renderDialogue(nextState)
      renderNotebook(nextState)
      renderCombat(nextState)
      renderRings(nextState)
      renderCodex(nextState)
    },
    toggle,
    onMenu
  }
}