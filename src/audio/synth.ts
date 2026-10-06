import type { Score } from "../content/types.ts"
import { nextRandom } from "../core/rng.ts"
import type { ScoreEvent } from "./score.ts"
import { parseScore } from "./score.ts"

export interface ChipPlayer {
  play(score: Score): void
  stop(): void
  setVolume(v: number): void
}

interface ActiveScore {
  readonly score: Score
  readonly events: readonly ScoreEvent[]
  readonly length: number
  eventIndex: number
  loopBase: number
}

const TICK_MS = 25
const LOOKAHEAD_S = 0.1
const ATTACK_S = 0.005
const RELEASE_S = 0.03

/** 25% 펄스파. 푸리에 계수 b_n = (2/(nπ)) sin(nπ·0.25), 32항. */
function square25Wave(ctx: AudioContext): PeriodicWave {
  const n = 32
  const real = new Float32Array(n + 1)
  const imag = new Float32Array(n + 1)
  for (let k = 1; k <= n; k++) {
    imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25)
  }
  return ctx.createPeriodicWave(real, imag)
}

export function createChipPlayer(ctx: AudioContext): ChipPlayer {
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(ctx.destination)

  const channelGains = new Map<number, GainNode>()
  const channelVolumes = new Map<number, number>()
  const activeSources = new Set<AudioScheduledSourceNode>()
  let square25: PeriodicWave | null = null
  let noiseBuffer: AudioBuffer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let current: ActiveScore | null = null

  function resume(): void {
    if (ctx.state === "suspended") void ctx.resume()
  }
  window.addEventListener("pointerdown", resume)
  window.addEventListener("keydown", resume)

  function getChannelGain(channel: number): GainNode {
    let g = channelGains.get(channel)
    if (!g) {
      g = ctx.createGain()
      g.gain.value = channelVolumes.get(channel) ?? 1
      g.connect(master)
      channelGains.set(channel, g)
    }
    return g
  }

  function makeNoiseBuffer(): AudioBuffer {
    if (!noiseBuffer) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = buf.getChannelData(0)
      let state = 42
      for (let i = 0; i < data.length; i++) {
        const r = nextRandom(state)
        state = r.rng
        data[i] = r.value * 2 - 1
      }
      noiseBuffer = buf
    }
    return noiseBuffer
  }

  function scheduleEvent(ev: ScoreEvent, start: number, active: ActiveScore): void {
    if (ev.freq === null) return // 쉼표는 시간만 진행

    const out = ctx.createGain()
    out.connect(getChannelGain(ev.channel))

    const end = start + ev.duration
    out.gain.setValueAtTime(0, start)
    out.gain.linearRampToValueAtTime(1, start + Math.min(ATTACK_S, ev.duration))
    out.gain.setValueAtTime(1, end)
    out.gain.linearRampToValueAtTime(0, end + RELEASE_S)
    out.gain.setValueAtTime(0, end + RELEASE_S)

    const src = active.score.channels[ev.channel]?.wave === "noise"
      ? makeNoiseSource(ev, out, start, end)
      : makeToneSource(active, ev, out, start, end)
    activeSources.add(src)
  }

  function makeNoiseSource(
    ev: ScoreEvent,
    out: GainNode,
    start: number,
    end: number
  ): AudioScheduledSourceNode {
    const src = ctx.createBufferSource()
    src.buffer = makeNoiseBuffer()
    src.loop = true
    const hz = ev.freq === null || ev.freq === 0 ? 1 : ev.freq
    src.playbackRate.setValueAtTime(hz, start)
    src.connect(out)
    src.start(start)
    src.stop(end + RELEASE_S + 0.01)
    return src
  }

  function makeToneSource(
    active: ActiveScore,
    ev: ScoreEvent,
    out: GainNode,
    start: number,
    end: number
  ): OscillatorNode {
    const osc = ctx.createOscillator()
    const wave = active.score.channels[ev.channel]?.wave
    if (wave === "square50") osc.type = "square"
    else if (wave === "square25") {
      if (!square25) square25 = square25Wave(ctx)
      osc.setPeriodicWave(square25)
    } else osc.type = wave === "noise" ? "square" : "triangle"
    osc.frequency.setValueAtTime(Math.max(ev.freq ?? 0, 0.01), start)
    osc.connect(out)
    osc.start(start)
    osc.stop(end + RELEASE_S + 0.01)
    return osc
  }

  function tick(): void {
    const active = current
    if (!active) return
    const horizon = ctx.currentTime + LOOKAHEAD_S
    const events = active.events
    let guard = 0
    while (active.eventIndex < events.length) {
      const ev = events[active.eventIndex]
      if (!ev) break
      const start = active.loopBase + ev.time
      if (start >= horizon) break
      scheduleEvent(ev, start, active)
      active.eventIndex++
      if (active.eventIndex >= events.length) {
        if (active.score.loop && active.length > 0) {
          active.loopBase += active.length
          active.eventIndex = 0
        }
      }
      if (++guard > events.length * 4 + 8) break // 루프 안전장치
    }
    if (active.eventIndex >= events.length && !active.score.loop) {
      current = null
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }

  function play(score: Score): void {
    stop()
    const parsed = parseScore(score)
    score.channels.forEach((ch, i) => channelVolumes.set(i, ch.volume))
    current = {
      score,
      events: parsed.events,
      length: parsed.length,
      eventIndex: 0,
      loopBase: 0
    }
    resume()
    if (!timer) timer = setInterval(tick, TICK_MS)
    tick()
  }

  function stop(): void {
    current = null
    for (const s of activeSources) {
      try {
        s.stop()
      } catch {
        // 이미 정지됨
      }
      s.disconnect()
    }
    activeSources.clear()
    for (const g of channelGains.values()) g.disconnect()
    channelGains.clear()
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function setVolume(v: number): void {
    master.gain.value = v
  }

  return { play, stop, setVolume }
}