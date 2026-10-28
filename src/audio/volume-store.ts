type Kind = "sfx" | "music"
const keyOf = (kind: Kind): string => `hollow-codex.volume.${kind}`

/** 저장한 음량(0~1). 없거나 숫자가 아니거나 저장소가 막혔으면 그 항목은 null. */
export function loadVolumes(storage: Pick<Storage, "getItem"> | null): Record<Kind, number | null> {
  const read = (kind: Kind): number | null => {
    try {
      const raw = storage?.getItem(keyOf(kind)) ?? null
      if (raw === null) return null
      const v = Number(raw)
      return Number.isFinite(v) && v >= 0 && v <= 1 ? v : null
    } catch {
      return null
    }
  }
  return { music: read("music"), sfx: read("sfx") }
}

/** 음량을 저장한다. 저장소가 없거나 가득 찼어도 조용히 넘어간다(게임은 계속된다). */
export function saveVolume(storage: Pick<Storage, "setItem"> | null, kind: Kind, v: number): void {
  try {
    storage?.setItem(keyOf(kind), String(v))
  } catch {
    // 저장은 편의 기능이다.
  }
}
