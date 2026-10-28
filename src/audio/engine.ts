/** 소리 엔진: 효과음 버퍼 재생과 배경 음악 루프·교차 페이드. DOM을 모르고 AudioContext·파일 읽기는 deps로 받는다. */
export interface AudioEngine {
  /** 첫 사용자 입력에서 부른다. 이전에는 모든 호출이 무음이고 음악은 마지막 요청만 기억한다. */
  unlock(): void
  sfx(key: string, rate?: number): void
  /** null이면 지금 곡을 페이드 아웃한다. 같은 곡을 다시 요청하면 무시한다. */
  music(key: string | null): void
  setVolume(kind: "sfx" | "music", v: number): void
  volume(kind: "sfx" | "music"): number
}

export interface EngineDeps {
  createContext(): AudioContext | null
  fetchBuffer(key: string, kind: "sfx" | "music"): Promise<ArrayBuffer>
  log?(event: string, data?: unknown): void
}

const FADE_SECONDS = 1.5
const MAX_SAME_SFX = 3
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

interface Track { readonly key: string; readonly src: AudioBufferSourceNode; readonly gain: GainNode }

export function createEngine(deps: EngineDeps): AudioEngine {
  let ctx: AudioContext | null = null
  let sfxMaster: GainNode | null = null
  let musicMaster: GainNode | null = null
  const volumes = { sfx: 0.8, music: 0.5 }
  const sfxBuffers = new Map<string, Promise<AudioBuffer>>()
  const musicBuffers = new Map<string, Promise<AudioBuffer>>()
  const active = new Map<string, number>()
  let wanted: string | null = null   // 지금 있어야 할 곡(null = 없음)
  let current: Track | null = null

  const decode = (c: AudioContext, cache: Map<string, Promise<AudioBuffer>>, key: string, kind: "sfx" | "music"): Promise<AudioBuffer> => {
    let p = cache.get(key)
    if (p === undefined) {
      p = deps.fetchBuffer(key, kind).then((data) => c.decodeAudioData(data))
      cache.set(key, p)
      p.catch((error: unknown) => {
        cache.delete(key)   // 실패는 기억하지 않는다: 다음 호출이 다시 시도한다
        deps.log?.("audio-load-failed", { kind, key, error: String(error) })
      })
    }
    return p
  }

  const fadeOut = (t: Track, c: AudioContext): void => {
    const end = c.currentTime + FADE_SECONDS
    t.gain.gain.setValueAtTime(t.gain.gain.value, c.currentTime)
    t.gain.gain.linearRampToValueAtTime(0, end)
    t.src.stop(end)
    t.src.onended = (): void => { t.src.disconnect(); t.gain.disconnect() }
  }

  const startMusic = (c: AudioContext, key: string): void => {
    decode(c, musicBuffers, key, "music").then((buffer) => {
      if (wanted !== key || (current !== null && current.key === key) || musicMaster === null) return
      const src = c.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const gain = c.createGain()
      gain.gain.setValueAtTime(0, c.currentTime)
      gain.gain.linearRampToValueAtTime(1, c.currentTime + FADE_SECONDS)
      src.connect(gain)
      gain.connect(musicMaster)
      if (current !== null) fadeOut(current, c)
      current = { key, src, gain }
      src.start()
    }, () => {})
  }

  return {
    unlock() {
      if (ctx !== null) return
      try {
        ctx = deps.createContext()
      } catch (error) {
        deps.log?.("audio-context-failed", String(error))
        ctx = null
      }
      if (ctx === null) return
      sfxMaster = ctx.createGain()
      sfxMaster.gain.value = volumes.sfx
      sfxMaster.connect(ctx.destination)
      musicMaster = ctx.createGain()
      musicMaster.gain.value = volumes.music
      musicMaster.connect(ctx.destination)
      if (wanted !== null) startMusic(ctx, wanted)
    },
    sfx(key, rate = 1) {
      const c = ctx
      if (c === null || sfxMaster === null) return
      if ((active.get(key) ?? 0) >= MAX_SAME_SFX) return
      active.set(key, (active.get(key) ?? 0) + 1)
      const release = (): void => { active.set(key, Math.max(0, (active.get(key) ?? 1) - 1)) }
      decode(c, sfxBuffers, key, "sfx").then((buffer) => {
        if (sfxMaster === null) return release()
        const src = c.createBufferSource()
        src.buffer = buffer
        src.playbackRate.value = rate
        src.connect(sfxMaster)
        src.onended = (): void => { src.disconnect(); release() }
        src.start()
      }, release)
    },
    music(key) {
      wanted = key
      const c = ctx
      if (c === null) return
      if (key === null) {
        if (current !== null) { fadeOut(current, c); current = null }
        return
      }
      if (current !== null && current.key === key) return
      startMusic(c, key)
    },
    setVolume(kind, v) {
      volumes[kind] = clamp01(v)
      const node = kind === "sfx" ? sfxMaster : musicMaster
      if (node !== null) node.gain.value = volumes[kind]
    },
    volume: (kind) => volumes[kind]
  }
}
