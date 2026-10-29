import "./ui/fonts.css"
import content from "virtual:content"
import credits from "virtual:credits"
import { createEngine } from "./audio/engine.ts"
import { findAudioUrl, footstepKey, resolveSfx, resolveTrack } from "./audio/resolve.ts"
import { hitRate } from "./audio/hit-sound.ts"
import { loadVolumes, saveVolume } from "./audio/volume-store.ts"
import { step } from "./core/step.ts"
import type { Command, GameEvent, GameState, Id, Pos } from "./core/types.ts"
import { keyToCommand, modeOf, pointerToCommand } from "./input/commands.ts"
import type { UiAction } from "./input/commands.ts"
import { loadMapAssets, mapAssetPrefixes, spriteUrls } from "./render/assets.ts"
import { drawFrame } from "./render/canvas.ts"
import type { CombatFxView } from "./render/canvas.ts"
import { combatOverlay } from "./render/combat-overlay.ts"
import { createCombatTrack } from "./render/combat-track.ts"
import { createFx } from "./render/fx.ts"
import { eventSounds } from "./audio/event-sounds.ts"
import { createMotion, resyncMotion } from "./render/motion.ts"
import type { Motion } from "./render/motion.ts"
import { frameViewport, tileAtPointer } from "./render/viewport.ts"
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

// ── 새 그림(지도별 지연 로딩)과 걷기 보간 ───────────────
const images = new Map<string, HTMLImageElement>()
const requestedAssets = new Set<string>()
let motion: Motion = createMotion(content.start.pos, "s")
const fx = createFx(1.5)   // 연출 배속(판정: 기본 속도가 조금 느리다는 평가)
const combatTrack = createCombatTrack(fx)

/** 이 지도에 필요한 그림을 불러온다. 아직 못 불러온 요소는 그 칸만 건너뛰고, 다 불러오면 다시 그린다. */
function ensureMapAssets(mapId: Id): void {
  const fresh = mapAssetPrefixes(content, mapId).filter((p) => !requestedAssets.has(p))
  if (fresh.length === 0) return
  for (const p of fresh) requestedAssets.add(p)
  loadMapAssets(spriteUrls, fresh)
    .then((loaded) => {
      for (const [key, img] of loaded) images.set(key, img)
      scheduleFrame()
    })
    .catch((error: unknown) => log.log("assets-error", String(error)))
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
const audioUrls = import.meta.glob<string>("../assets/audio/**/*.ogg", { query: "?url", import: "default", eager: true })
const engine = createEngine({
  createContext: () => (typeof AudioContext === "undefined" ? null : new AudioContext()),
  fetchBuffer: async (key, kind) => {
    const url = findAudioUrl(audioUrls, kind, key)
    if (url === undefined) throw new Error(`audio file missing: ${kind}/${key}`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`audio fetch ${response.status}: ${kind}/${key}`)
    return response.arrayBuffer()
  },
  log: (event, data) => log.log(event, data)
})

function storageOrNull(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}
const savedVolumes = loadVolumes(storageOrNull())
if (savedVolumes.music !== null) engine.setVolume("music", savedVolumes.music)
if (savedVolumes.sfx !== null) engine.setVolume("sfx", savedVolumes.sfx)

/** 오디오 그래프는 첫 사용자 입력에서 만든다(브라우저는 제스처 뒤에만 소리를 허용한다). 그전엔 무음. */
function ensureAudio(): void {
  engine.unlock()
}

/** 지금 재생한다. 아직 오디오가 없으면 엔진이 마지막 요청을 기억했다가 첫 입력 때 시작한다. 매핑이 없는 곡은 무음. */
function playTrack(track: Id): void {
  engine.music(resolveTrack(content.audio, track))
}

let state: GameState | null = null
let panels: MountedPanels | null = null
let dialogueLog: SaidLine[] = []
let lastAutoTurn = 0

// ── 효과음 ──────────────────────────────────────────────
/** 코어가 내는 효과음 이름을 audio.yaml로 풀어 재생한다. 매핑이 없으면 무음. */
function playSfx(name: string): void {
  const key = resolveSfx(content.audio, name)
  if (key !== null) engine.sfx(key)
}

/** 발 아래 땅 종류(없으면 null)에 맞는 발걸음 소리. 속도를 조금씩 바꿔 단조로움을 줄인다(코어 난수는 쓰지 않는다). */
function playFootstep(s: GameState): void {
  const ground = content.maps[s.mapId]?.ground?.[s.player.pos.y]?.[s.player.pos.x] ?? null
  const key = footstepKey(content.audio, ground)
  if (key !== null) engine.sfx(key, 0.95 + (s.turn % 3) * 0.05)
}

// ── 그리기와 리사이즈 ───────────────────────────────────
let frameQueued = false
function draw(): void {
  const s = state
  const ui = panels
  if (s === null || ui === null) return
  if (content.maps[s.mapId] === undefined) {
    log.log("unknown-map", s.mapId)
    return
  }
  const now = performance.now()
  combatTrack.update(now)
  const shown = combatTrack.lingerState ?? s
  const vp = frameViewport(shown, content, { w: canvas.width, h: canvas.height })
  const frame = motion.sample(now)
  const combatView: CombatFxView | null = shown.combat === null
    ? null
    : { frame: fx.sample(now), overlay: fx.busy(now) ? null : combatOverlay(shown, content) }
  drawFrame(canvas2d, { sheets, images }, shown, content, vp, frame, combatView)
  for (const cue of fx.takeCues(now)) {
    const key = resolveSfx(content.audio, "hit")
    if (key !== null) engine.sfx(key, hitRate(cue.amount, cue.index, cue.defeated))
  }
  ui.render(s, dialogueLog)
  if (frame.moving || fx.busy(now)) scheduleFrame()
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
  canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio))
  canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio))
  scheduleFrame()
}
new ResizeObserver(resize).observe(canvas)

// ── 대화 로그와 자동 저장 ───────────────────────────────
/** 화면을 막지 않는 짧은 안내. 문구는 ui.notice.<name> 키다. */
function showNotice(name: SessionNotice | "tip-combat"): void {
  const node = document.createElement("div")
  node.className = "notice"
  node.setAttribute("role", "status")
  node.textContent = t(state?.language ?? "ko", content.strings, `ui.notice.${name}`)
  document.body.appendChild(node)
  window.setTimeout(() => node.remove(), 4000)
}

/** 처음 전투를 시작할 때 한 번만 짧은 요령을 보여 준다(브라우저 저장소에 표시를 남긴다; 쓸 수 없으면 매번 보이지 않게 생략). */
function showFirstCombatTip(): void {
  try {
    if (window.localStorage.getItem("hollow-codex.tip-combat") !== null) return
    window.localStorage.setItem("hollow-codex.tip-combat", "1")
  } catch { return }
  showNotice("tip-combat")
}

function maybeAutoSave(next: GameState, events: readonly GameEvent[]): void {
  const triggered =
    next.turn - lastAutoTurn >= 50 ||
    events.some((e) =>
      e.type === "mapChanged" || e.type === "ringTraveled" || e.type === "crisisResolved" || e.type === "combatEnded" || e.type === "dayPassed"
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
        motion = motion.onMoved(e.pos, state?.player.facing ?? "s", performance.now())
        if (state !== null) playFootstep(state)
        break
      case "mapChanged":
        if (state !== null) motion = motion.onTeleport(state.player.pos, state.player.facing)
        ensureMapAssets(e.mapId)
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
        if (e.name !== "hit") playSfx(e.name)   // "hit"은 연출의 충돌 시점에 fx 큐가 재생한다
        break
      case "music": {
        playTrack(e.track)
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
        // M5 에필로그: 선택한 단어에 따른 마을 메시지는 패널/에필로그 화면 몫. 여기선 끝 곡과 디버그 기록.
        playTrack("music.ending")
        log.log("event-epilogue", e)
        break
      default:
        break
    }
  }
}

/** 핵심 실행: step → 상태 교체 → 이벤트 처리 → 그리기 예약. return 이벤트 목록(터치 반복 판정용). */
export function apply(cmd: Command): readonly GameEvent[] {
  const s = state
  if (s === null) return []
  log.log("cmd", cmd.type)
  const { state: next, events } = step(s, cmd, content)
  combatTrack.apply(s, next, events, performance.now())
  state = next
  for (const e of events) log.log("event", e.type)
  if (cmd.type === "endTalk") dialogueLog = []
  handleEvents(events)
  for (const name of eventSounds(events, cmd, next !== s)) playSfx(name)
  if (events.some((e) => e.type === "combatStarted")) showFirstCombatTip()
  // `moved`·`mapChanged` 없이 위치나 지도가 바뀐 경우(열석 고리 이동, 도망, 패배)도 걷기 상태와 그림을 맞춘다.
  motion = resyncMotion(motion, next.player.pos, next.player.facing)
  if (next.mapId !== s.mapId) ensureMapAssets(next.mapId)
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
export function dispatch(cmd: Command | UiAction): void {
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
  motion = createMotion(next.player.pos, next.player.facing)
  combatTrack.release()
  ensureMapAssets(next.mapId)
  dialogueLog = []
  lastAutoTurn = next.turn
  const track = next.combat !== null
    ? content.encounters[next.combat.encounterId]?.music
    : content.maps[next.mapId]?.music
  if (track !== undefined) playTrack(track)
  panels?.closeOverlays()
  scheduleFrame()
}

export async function handleMenu(action: "save" | "load" | "new", slotId: string): Promise<void> {
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
/** 부팅 진입점. 브라우저에서는 모듈을 읽을 때 자동 실행되고, 테스트는 이 함수를 직접 부른다. */
export async function boot(): Promise<void> {
  const boot = await session.boot()
  const s = boot.state
  log.log("boot-state", { map: s.mapId, turn: s.turn, notices: boot.notices })
  state = s
  lastAutoTurn = s.turn
  canvas.setAttribute("aria-label", t(s.language, content.strings, "ui.aria.canvas"))
  ;(window as unknown as {
    __hollowCodex__?: {
      state(): GameState | null
      dispatch(cmd: Command | UiAction): void
      handleMenu(action: "save" | "load" | "new", slotId: string): Promise<void>
      debugTeleport?(mapId: Id, x: number, y: number): void
      debugSetMomentum?(value: number): void
      debugGrantAbilities?(ids: string[]): void
      debugGrantFacts?(ids: string[]): void
    }
  }).__hollowCodex__ = {
    state: () => state,
    dispatch,
    handleMenu,
    // 화면 확인용: ?debug=1 로 연 때만 있다. 지도·칸을 바로 정해 그림을 확인한다(저장 파일에는 영향이 없다).
    ...(debugEnabledFromUrl(location.href)
      ? {
          debugTeleport: (mapId: Id, x: number, y: number): void => {
            const cur = state
            if (cur === null) return
            replaceState({ ...cur, mapId, player: { ...cur.player, pos: { x, y } } })
          },
          debugGrantFacts: (ids: string[]): void => {
            const cur = state
            if (cur !== null) replaceState({ ...cur, facts: [...new Set([...cur.facts, ...(ids.includes("*") ? Object.keys(content.facts) : ids)])] })
          },
          debugGrantAbilities: (ids: string[]): void => {
            const cur = state
            if (cur !== null) replaceState({ ...cur, abilities: [...new Set([...cur.abilities, ...(ids.includes("*") ? Object.keys(content.abilities) : ids)])] })
          },
          debugSetMomentum: (value: number): void => {
            const cur = state
            if (cur === null || cur.combat === null) return
            replaceState({ ...cur, combat: { ...cur.combat, momentum: value } })
          }
        }
      : {})
  }

  panels = mountPanels(document.getElementById("ui")!, content, dispatch, credits)
  panels.setVolumes({ sfx: engine.volume("sfx"), music: engine.volume("music") })
  panels.onVolume((kind, v) => {
    engine.setVolume(kind, v)
    saveVolume(storageOrNull(), kind, v)
  })
  panels.onMenu((action, slotId) => {
    log.log("menu", { action, slotId })
    handleMenu(action, slotId).catch((error: unknown) => log.log("menu-error", String(error)))
  })
  refreshSlotInfo()

  /** 마지막 일격 연출이 남아 있는 동안의 첫 입력은 연출을 건너뛰는 데만 쓴다(탐험 화면으로 새지 않게). */
  const skipLinger = (): boolean => {
    if (combatTrack.lingerState === null) return false
    combatTrack.release()
    scheduleFrame()
    return true
  }

  window.addEventListener("keydown", (event) => {
    ensureAudio()
    if (skipLinger()) { event.preventDefault(); return }
    const t = event.target
    if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return   // 음량 슬라이더 등: 방향키는 그 입력 칸의 것
    const st = state
    if (st === null) return
    const cmd = keyToCommand(event.key, modeOf(st))
    if (cmd === null) return
    event.preventDefault()
    dispatch(cmd)
  })

  canvas.addEventListener("pointerdown", (event) => {
    ensureAudio()
    if (skipLinger()) return
    const st = state
    if (st === null) return
    showTouchHintOnce()
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    if (content.maps[st.mapId] === undefined) return
    const px = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    }
    // 전투 중에는 전투 격자 뷰포트로(그려진 칸과 같은 칸), 탐험 중에는 지도 뷰포트로 타일을 구한다.
    const cmd = pointerToCommand(tileAtPointer(st, content, { w: canvas.width, h: canvas.height }, px, motion.sample(performance.now())), st, content)
    if (cmd === null) return
    dispatch(cmd)
  })

  motion = createMotion(s.player.pos, s.player.facing)
  ensureMapAssets(s.mapId)
  const bootMusic = content.maps[s.mapId]?.music
  if (bootMusic !== undefined) playTrack(bootMusic)

  document.getElementById("boot-title")?.remove()
  resize()
  scheduleFrame()
  for (const notice of boot.notices) showNotice(notice)
  log.log("ready", { map: s.mapId, turn: s.turn })
}

// 통합 테스트(vitest)는 모듈을 import만 하고 boot()를 직접 부른다. 브라우저에서는 기존처럼 즉시 부팅한다.
const runningInTests = typeof process !== "undefined" && process.env["VITEST"] === "true"
if (!runningInTests) {
  boot().catch((error: unknown) => {
    log.log("boot-failed", String(error))
  })
}