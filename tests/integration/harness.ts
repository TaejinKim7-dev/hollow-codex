// B-1 화면 연결 통합 테스트 지원. jsdom에서 src/main.ts를 부팅하되 실제 캔버스·오디오 장치는 쓰지 않는다.
// 여기에는 게임 로직이 없다 — 테스트용 스텁과 헬퍼만 둔다.
import { vi } from "vitest"
import type { GameContent, MapDef } from "../../src/content/types.ts"
import type { GameState } from "../../src/core/types.ts"
import { testContent } from "../unit/core/fixture.ts"

/** 2D 컨텍스트 대역. 그리기 호출은 모두 무시하고 canvas 참조만 돌려준다. */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = { canvas }
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop]
      return (): void => {}
    },
    set(t, prop, value) {
      t[prop] = value
      return true
    }
  }) as unknown as CanvasRenderingContext2D
}

class FakeGain {
  readonly gain = { value: 0, setValueAtTime: (): void => {}, linearRampToValueAtTime: (): void => {} }
  connect(): void {}
  disconnect(): void {}
}

class FakeSource {
  buffer: unknown = null
  loop = false
  readonly playbackRate = { setValueAtTime: (): void => {} }
  start(): void {}
  stop(): void {}
  connect(): void {}
  disconnect(): void {}
}

class FakeOscillator extends FakeSource {
  type = "square"
  readonly frequency = { setValueAtTime: (): void => {} }
  setPeriodicWave(): void {}
}

/** Web Audio 대역. 부팅은 master gain 하나만 만들고, 침묵 콘텐츠라 재생은 일어나지 않는다. */
class FakeAudioContext {
  readonly sampleRate = 44100
  currentTime = 0
  state = "running"
  readonly destination = new FakeGain()
  createGain(): FakeGain {
    return new FakeGain()
  }
  createBuffer(_channels: number, length: number): unknown {
    const data = new Float32Array(length)
    return { length, sampleRate: this.sampleRate, getChannelData: () => data, copyToChannel: (): void => {} }
  }
  createBufferSource(): FakeSource {
    return new FakeSource()
  }
  createOscillator(): FakeOscillator {
    return new FakeOscillator()
  }
  createPeriodicWave(): object {
    return {}
  }
  resume(): Promise<void> {
    return Promise.resolve()
  }
}

/** main.ts가 import 시점에 요구하는 DOM·전역을 채운다. 각 테스트의 beforeEach에서 부른다. */
export function installBrowserStubs(): void {
  document.body.innerHTML = '<div id="ui"></div><div id="boot-title"></div><canvas id="screen"></canvas>'
  const canvas = document.getElementById("screen") as HTMLCanvasElement
  Object.defineProperty(canvas, "getContext", {
    configurable: true,
    value: (): CanvasRenderingContext2D => noopContext(canvas)
  })
  Object.defineProperty(canvas, "getBoundingClientRect", {
    configurable: true,
    value: (): DOMRect =>
      ({ x: 0, y: 0, left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720, toJSON: () => ({}) }) as DOMRect
  })
  vi.stubGlobal("devicePixelRatio", 1)
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback): number => {
    cb(0)
    return 1
  })
  vi.stubGlobal("ResizeObserver", class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  })
  vi.stubGlobal("AudioContext", FakeAudioContext)
}

export function uninstallBrowserStubs(): void {
  vi.unstubAllGlobals()
}

/** testContent에서 모든 음악 id를 없는 곡으로 바꾼다. 재생 타이머가 테스트를 붙잡지 않게 한다. */
export function silentContent(): GameContent {
  const base = testContent()
  const silentMap = (m: MapDef): MapDef => ({ ...m, music: "music.none" })
  return {
    ...base,
    maps: Object.fromEntries(Object.entries(base.maps).map(([id, m]) => [id, silentMap(m)])),
    encounters: Object.fromEntries(
      Object.entries(base.encounters).map(([id, e]) => [id, { ...e, music: "music.none" }])
    ),
    music: {}
  }
}

/** 부팅된 앱의 현재 상태. main.ts가 window에 심는 훅을 쓴다. */
export function stateOf(): GameState | null {
  const hook = (window as unknown as { __hollowCodex__?: { state(): GameState | null } }).__hollowCodex__
  return hook?.state() ?? null
}

/** 모듈을 새로 읽어 main.ts를 부팅한다. 브라우저 자동 부팅은 main.ts가 테스트에서 끈다. */
export async function bootTestApp(): Promise<typeof import("../../src/main.ts")> {
  vi.resetModules()
  const mod = await import("../../src/main.ts")
  await mod.boot()
  return mod
}
