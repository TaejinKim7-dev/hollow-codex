/** mulberry32. `rng`는 32비트 부호 없는 정수 상태. value ∈ [0, 1). */
export function nextRandom(rng: number): { value: number; rng: number } {
  const next = (rng + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next }
}
