import { nextRandom } from "../core/rng.ts"

export interface SfxParams {
  readonly wave: "square" | "noise"
  readonly startHz: number
  readonly endHz: number
  readonly ms: number
  readonly decay: number
}

export const SFX: Readonly<Record<"step" | "bump" | "learn" | "confirm" | "hit" | "push", SfxParams>> = {
  step: { wave: "square", startHz: 220, endHz: 180, ms: 40, decay: 8 },
  bump: { wave: "square", startHz: 110, endHz: 80, ms: 80, decay: 6 },
  learn: { wave: "square", startHz: 660, endHz: 990, ms: 150, decay: 3 },
  confirm: { wave: "square", startHz: 523, endHz: 1047, ms: 400, decay: 2 },
  hit: { wave: "noise", startHz: 0, endHz: 0, ms: 120, decay: 10 },
  push: { wave: "noise", startHz: 0, endHz: 0, ms: 200, decay: 5 }
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    const r = nextRandom(state)
    state = r.rng
    return r.value
  }
}

/**
 * 효과음 샘플. 순수 함수 — 같은 입력이면 같은 출력.
 * 진폭 = 0.5 * exp(-decay * i / n). 사각파는 start→end 선형 주파수 스윕,
 * 노이즈는 시드 1의 mulberry32로 ±1.
 */
export function renderSfx(p: SfxParams, sampleRate: number): Float32Array {
  const n = Math.round((p.ms * sampleRate) / 1000)
  const out = new Float32Array(n)

  if (p.wave === "noise") {
    const noise = mulberry32(1)
    for (let i = 0; i < n; i++) {
      const amp = 0.5 * Math.exp((-p.decay * i) / n)
      out[i] = amp * (noise() * 2 - 1)
    }
    return out
  }

  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const hz = p.startHz + (p.endHz - p.startHz) * t
    phase += (2 * Math.PI * hz) / sampleRate
    const amp = 0.5 * Math.exp((-p.decay * i) / n)
    out[i] = amp * Math.sign(Math.sin(phase))
  }
  return out
}