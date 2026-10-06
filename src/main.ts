import "./ui/fonts.css"
import content from "virtual:content"
import credits from "virtual:credits"
import { createChipPlayer } from "./audio/synth.ts"
import { renderSfx, SFX } from "./audio/sfx.ts"
import type { SfxParams } from "./audio/sfx.ts"
import { createInitialState } from "./core/state.ts"
import { step } from "./core/step.ts"
import type { Command, GameEvent, GameState, Id, Pos, TimeState } from "./core/types.ts"
import { keyToCommand, modeOf, pointerToCommand } from "./input/commands.ts"
import type { UiAction } from "./input/commands.ts"
import { drawFrame } from "./render/canvas.ts"
import { computeViewport, screenToTile } from "./render/viewport.ts"
import { createIndexedDbSlotStore } from "./save/slot-store.ts"
import { AUTO_SLOT, loadSlot, saveToSlot } from "./save/slots.ts"
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
canvas.setAttribute("aria-label", t(content.strings, "ui.aria.canvas"))
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
const store = createIndexedDbSlotStore(indexedDB)
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
/** 로드 결과에 time/rings가 없으면(예: 구형 세이브) 메모리에서 기본값을 채운다. 로드 실패로 만들지 않는다. */
function ensureM2State(s: GameState): GameState {
  const raw = s as unknown as {
    readonly time?: TimeState
    readonly rings?: { readonly visited?: readonly Id[]; readonly knownFacts?: readonly Id[] }
  }
  const time = raw.time
  const rings = raw.rings
  const okTime = time !== undefined && typeof time.hour === "number" && typeof time.day === "number"
  const okRings = rings !== undefined && Array.isArray(rings.visited) && Array.isArray(rings.knownFacts)
  if (okTime && okRings) return s
  log.log("m2-defaults", { time: okTime, rings: okRings })
  const safeTime: TimeState =
    time !== undefined && typeof time.hour === "number" && typeof time.day === "number"
      ? time
      : { hour: 8, day: 1 }
  const safeRings =
    rings !== undefined && Array.isArray(rings.visited) && Array.isArray(rings.knownFacts)
      ? { visited: rings.visited, knownFacts: rings.knownFacts }
      : { visited: [] as readonly Id[], knownFacts: [] as readonly Id[] }
  return { ...s, time: safeTime, rings: safeRings }
}

function maybeAutoSave(next: GameState, events: readonly GameEvent[]): void {
  const triggered =
    next.turn - lastAutoTurn >= 50 ||
    events.some((e) =>
      e.type === "mapChanged" || e.type === "crisisResolved" || e.type === "combatEnded" || e.type === "dayPassed"
    )
  if (triggered) {
    lastAutoTurn = next.turn
    void saveToSlot(store, AUTO_SLOT, "auto", next, Date.now())
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
  hint.textContent = t(content.strings, "ui.touch-hint")
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

// ── 부팅 ────────────────────────────────────────────────
async function main(): Promise<void> {
  let s: GameState
  const loaded = await loadSlot(store, AUTO_SLOT)
  if (loaded === null) {
    s = createInitialState(content, Date.now() >>> 0)
    log.log("new-game", { map: s.mapId })
  } else if (loaded.ok) {
    s = loaded.state
    log.log("load-auto", { map: s.mapId, turn: s.turn })
  } else {
    log.log("load-failed", loaded.reason)
    s = createInitialState(content, Date.now() >>> 0)
  }
  s = ensureM2State(s)
  state = s
  lastAutoTurn = s.turn
  ;(window as unknown as { __hollowCodex__?: { state(): GameState | null } }).__hollowCodex__ = {
    state: () => state
  }

  panels = mountPanels(document.getElementById("ui")!, content, dispatch, credits)
  panels.onMenu((action) => {
    log.log("menu", action)
  })

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
  log.log("ready", { map: s.mapId, turn: s.turn })
}

void main()