import "./ui/fonts.css"
import content from "virtual:content"
import credits from "virtual:credits"
import { createChipPlayer } from "./audio/synth.ts"
import { renderSfx, SFX } from "./audio/sfx.ts"
import type { SfxParams } from "./audio/sfx.ts"
import { step } from "./core/step.ts"
import type { Command, GameEvent, GameState, Pos } from "./core/types.ts"
import { keyToCommand, modeOf, pointerToCommand } from "./input/commands.ts"
import type { UiAction } from "./input/commands.ts"
import { drawFrame } from "./render/canvas.ts"
import { computeViewport, screenToTile } from "./render/viewport.ts"
import { createIndexedDbSlotStore } from "./save/slot-store.ts"
import { createSession } from "./save/session.ts"
import type { SessionNotice } from "./save/session.ts"
import type { SaidLine } from "./ui/view-model.ts"
import { createDebugLog, debugEnabledFromUrl } from "./debug-log.ts"
import { mountPanels } from "./ui/panels.ts"
import type { MountedPanels } from "./ui/panels.ts"
import { t } from "./ui/strings.ts"

const log = createDebugLog({ enabled: debugEnabledFromUrl(location.href) })
log.log("boot")
log.log("content", { maps: Object.keys(content.maps).length })
log.log("credits", { files: credits.length })

const screen = document.getElementById("screen") as HTMLCanvasElement | null
if (screen === null) throw new Error("missing #screen")
const canvas = screen
const ctx = canvas.getContext("2d")
if (ctx === null) throw new Error("canvas 2d unavailable")
const canvas2d = ctx
screen.style.position = "fixed"
screen.style.inset = "0"
screen.style.width = "100vw"
screen.style.height = "100vh"
screen.style.imageRendering = "pixelated"

// ── 시트 이미지 ─────────────────────────────────────────
const imageUrls = import.meta.glob<string>("../assets/tiles/*.png", { query: "?url", import: "default", eager: true })
const sheets: Record<string, HTMLImageElement> = {}
for (const [id, sheet] of Object.entries(content.sheets)) {
  const key = Object.keys(imageUrls).find((k) => k.endsWith(`/${sheet.file}`))
  const img = new Image()
  if (key === undefined) log.log("sheet-missing", { id, file: sheet.file })
  else img.src = imageUrls[key] ?? ""
  if (img.src === "") log.log("sheet-missing", { id, file: sheet.file })
  sheets[id] = img
}

// ── 저장소와 오디오 ─────────────────────────────────────
/** IndexedDB가 없거나 막힌 브라우저에서도 부팅한다. 없으면 session이 메모리 저장소(이 탭 한정)를 쓴다. */
function openStore(): ReturnType<typeof createIndexedDbSlotStore> | null {
  try {
    return typeof indexedDB === "undefined" ? null : createIndexedDbSlotStore(indexedDB)
  } catch (error) {
    log.log("storage-unavailable", String(error))
    return null
  }
}
const session = createSession({
  store: openStore(),
  content,
  now: () => Date.now(),
  seed: () => Date.now() >>> 0,
  log: (event, data) => log.log(event, data)
})
const audio = new AudioContext()
const player = createChipPlayer(audio)

let state: GameState | null = null
let panels: MountedPanels | null = null
let dialogueLog: SaidLine[] = []
let lastAutoTurn = 0

// ── 효과음 ──────────────────────────────────────────────
function playSfx(name: string): void {
  const params = (SFX as Record<string, SfxParams | undefined>)[name]
  if (params === undefined) return
  const buffer = audio.createBuffer(1, Math.round((params.ms * audio.sampleRate) / 1000), audio.sampleRate)
  buffer.copyToChannel(renderSfx(params, audio.sampleRate), 0)
  const src = audio.createBufferSource()
  src.buffer = buffer
  src.connect(audio.destination)
  src.start()
}

// ── 그리기와 리사이즈 ───────────────────────────────────
let cssSize = { w: 0, h: 0 }
let frameQueued = false
function draw(): void {
  const s = state
  const ui = panels
  if (s === null || ui === null) return
  const map = content.maps[s.mapId]
  if (map === undefined) return
  const mapSize = { w: map.rows[0]?.length ?? 0, h: map.rows.length }
  const vp = computeViewport(cssSize, devicePixelRatio, mapSize, s.player.pos)
  drawFrame(canvas2d, sheets, s, content, vp)
  ui.render(s, dialogueLog)
}
function scheduleFrame(): void {
  if (frameQueued) return
  frameQueued = true
  requestAnimationFrame(() => {
    frameQueued = false
    draw()
  })
}
function resize(): void {
  const rect = canvas.getBoundingClientRect()
  cssSize = { w: rect.width, h: rect.height }
  canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio))
  canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio))
  scheduleFrame()
}
new ResizeObserver(resize).observe(canvas)

// ── 대화 로그와 자동 저장 ───────────────────────────────
/** 화면을 막지 않는 짧은 안내. 문구는 ui.notice.<name> 키다. */
function showNotice(name: SessionNotice): void {
  const node = document.createElement("div")
  node.className = "notice"
  node.setAttribute("role", "status")
  node.textContent = t(state?.language ?? "ko", content.strings, `ui.notice.${name}`)
  document.body.appendChild(node)
  window.setTimeout(() => node.remove(), 4000)
}

function maybeAutoSave(next: GameState, events: readonly GameEvent[]): void {
  const triggered =
    next.turn - lastAutoTurn >= 50 ||
    events.some((e) =>
      e.type === "mapChanged" || e.type === "crisisResolved" || e.type === "combatEnded" || e.type === "dayPassed"
    )
  if (triggered) {
    lastAutoTurn = next.turn
    session.autosave(next)
      .then((notice) => {
        if (notice !== null) showNotice(notice)
        refreshSlotInfo()
      })
      .catch((error: unknown) => log.log("autosave-error", String(error)))
  }
}

// ── 이벤트 처리 / 명령 실행 ─────────────────────────────
function handleEvents(events: readonly GameEvent[]): void {
  for (const e of events) {
    switch (e.type) {
      case "said":
        dialogueLog.push({ textKey: e.textKey, lie: e.lie })
        break
      case "moved":
        playSfx("step")
        break
      case "bumped":
        playSfx("bump")
        break
      case "factLearned":
        playSfx("learn")
        break
      case "deductionConfirmed":
        playSfx("confirm")
        break
      case "sfx":
        playSfx(e.name)
        break
      case "music": {
        const score = content.music[e.track]
        if (score !== undefined) player.play(score)
        break
      }
      case "combatEnded":
        dialogueLog = []
        break
      case "timePassed":
      case "dayPassed":
      case "ringTraveled":
      case "ringUnlocked":
      case "companionJoinRejected":
        // M2 진행 이벤트: UI/세이브는 apply에서 처리, 여기선 디버그 기록만.
        log.log("event-m2", e)
        break
      case "codexWritten":
      case "codexFinalChosen":
        // M5 빈 경전: 8쪽·마지막 장 UI는 panels.render가 state에서 직접 그린다. 여기선 디버그 기록만.
        log.log("event-codex", e)
        break
      case "epilogue":
        // M5 에필로그: 선택한 단어에 따른 마을 메시지는 패널/에필로그 화면 몫. 여기선 디버그 기록만.
        log.log("event-epilogue", e)
        break
      default:
        break
    }
  }
}

/** 핵심 실행: step → 상태 교체 → 이벤트 처리 → 그리기 예약. return 이벤트 목록(터치 반복 판정용). */
function apply(cmd: Command): readonly GameEvent[] {
  const s = state
  if (s === null) return []
  log.log("cmd", cmd.type)
  const { state: next, events } = step(s, cmd, content)
  state = next
  for (const e of events) log.log("event", e.type)
  if (cmd.type === "endTalk") dialogueLog = []
  handleEvents(events)
  maybeAutoSave(next, events)
  scheduleFrame()
  return events
}

// ── 터치 이동: moveTo 탭을 120ms마다 반복 ────────────────
let touchTimer: ReturnType<typeof setInterval> | null = null
let touchTarget: Pos | null = null
function stopTouchRepeat(): void {
  if (touchTimer !== null) {
    clearInterval(touchTimer)
    touchTimer = null
  }
  touchTarget = null
}
function startTouchRepeat(target: Pos): void {
  stopTouchRepeat()
  touchTarget = target
  touchTimer = setInterval(() => {
    if (touchTarget === null) return
    const s = state
    if (s === null) return
    if (modeOf(s) !== "explore") {
      stopTouchRepeat()
      return
    }
    if (s.player.pos.x === touchTarget.x && s.player.pos.y === touchTarget.y) {
      stopTouchRepeat()
      return
    }
    const events = apply({ type: "moveTo", target: touchTarget })
    if (events.length === 0) stopTouchRepeat()
    else if (events.some((e) => e.type === "mapChanged" || e.type === "combatStarted")) stopTouchRepeat()
  }, 120)
}

// ── 첫 터치 안내 (Task 47) ──────────────────────────────
let touchHintShown = false
/** 첫 터치에만 "터치로 이동" 안내를 잠깐 띄운다. 이후 터치에는 뜨지 않는다. */
function showTouchHintOnce(): void {
  if (touchHintShown) return
  touchHintShown = true
  const hint = document.createElement("div")
  hint.className = "touch-hint"
  hint.textContent = t(state?.language ?? "ko", content.strings, "ui.touch-hint")
  document.body.appendChild(hint)
  window.setTimeout(() => hint.remove(), 1600)
}

/** 입력 진입점. 다른 입력이 터치 반복을 끊는다. */
function dispatch(cmd: Command | UiAction): void {
  stopTouchRepeat()
  if ("ui" in cmd) {
    panels?.toggle(cmd.ui)
    return
  }
  const events = apply(cmd)
  const s = state
  if (cmd.type === "moveTo" && s !== null && modeOf(s) === "explore" && events.length > 0) {
    startTouchRepeat(cmd.target)
  }
}

// ── 메뉴: 저장 / 불러오기 / 새 시작 ─────────────────────
function refreshSlotInfo(): void {
  session.slots()
    .then((info) => panels?.setSlotInfo(info))
    .catch((error: unknown) => log.log("slots-error", String(error)))
}

/** 불러오기·새 시작 뒤 상태를 통째로 바꾼다. 대화 로그·자동 저장 기준·터치 반복·음악을 새 상태에 맞춘다. */
function replaceState(next: GameState): void {
  stopTouchRepeat()
  state = next
  dialogueLog = []
  lastAutoTurn = next.turn
  const track = next.combat !== null
    ? content.encounters[next.combat.encounterId]?.music
    : content.maps[next.mapId]?.music
  const score = track === undefined ? undefined : content.music[track]
  if (score !== undefined) player.play(score)
  panels?.closeOverlays()
  scheduleFrame()
}

async function handleMenu(action: "save" | "load" | "new", slotId: string): Promise<void> {
  const s = state
  if (s === null) return
  if (action === "save") {
    showNotice(await session.save(slotId, s))
    refreshSlotInfo()
    return
  }
  if (action === "load") {
    const result = await session.load(slotId)
    if (result.state !== null) replaceState(result.state)
    showNotice(result.notice)
    return
  }
  if (!window.confirm(t(s.language, content.strings, "ui.confirm-new"))) return
  replaceState(session.newGame())
}

// ── 부팅 ────────────────────────────────────────────────
async function main(): Promise<void> {
  const boot = await session.boot()
  const s = boot.state
  log.log("boot-state", { map: s.mapId, turn: s.turn, notices: boot.notices })
  state = s
  lastAutoTurn = s.turn
  canvas.setAttribute("aria-label", t(s.language, content.strings, "ui.aria.canvas"))
  ;(window as unknown as { __hollowCodex__?: { state(): GameState | null } }).__hollowCodex__ = {
    state: () => state
  }

  panels = mountPanels(document.getElementById("ui")!, content, dispatch, credits)
  panels.onMenu((action, slotId) => {
    log.log("menu", { action, slotId })
    handleMenu(action, slotId).catch((error: unknown) => log.log("menu-error", String(error)))
  })
  refreshSlotInfo()

  window.addEventListener("keydown", (event) => {
    const st = state
    if (st === null) return
    const cmd = keyToCommand(event.key, modeOf(st))
    if (cmd === null) return
    event.preventDefault()
    dispatch(cmd)
  })

  canvas.addEventListener("pointerdown", (event) => {
    const st = state
    if (st === null) return
    showTouchHintOnce()
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const map = content.maps[st.mapId]
    if (map === undefined) return
    const mapSize = { w: map.rows[0]?.length ?? 0, h: map.rows.length }
    const vp = computeViewport({ w: canvas.width, h: canvas.height }, 1, mapSize, st.player.pos)
    const px = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    }
    const cmd = pointerToCommand(screenToTile(px, vp), st, content)
    if (cmd === null) return
    dispatch(cmd)
  })

  const bootMusic = content.maps[s.mapId]?.music
  if (bootMusic !== undefined) {
    const score = content.music[bootMusic]
    if (score !== undefined) player.play(score)
  }

  document.getElementById("boot-title")?.remove()
  resize()
  scheduleFrame()
  for (const notice of boot.notices) showNotice(notice)
  log.log("ready", { map: s.mapId, turn: s.turn })
}

main().catch((error: unknown) => {
  log.log("boot-failed", String(error))
})