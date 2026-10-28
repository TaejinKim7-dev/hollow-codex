import type { Ground } from "../content/ground.ts"
import type { AudioMap } from "../content/types.ts"
import type { Id } from "../core/types.ts"

/** 코어가 내는 효과음 이름 → 효과음 파일 키. 매핑에 없으면 null(무음, 오류 아님). */
export function resolveSfx(audio: AudioMap, name: string): string | null {
  return audio.sfx[name] ?? null
}

/** 밟은 땅의 발걸음 소리 키. 땅이 없거나(옛 그림 지도) 목록에 없으면 풀, 그것도 없으면 `step` 효과음. */
export function footstepKey(audio: AudioMap, ground: Ground | null): string | null {
  return (ground === null ? undefined : audio.footsteps[ground]) ?? audio.footsteps["grass"] ?? audio.sfx["step"] ?? null
}

/** 음악 id(music.kalas 등) → 배경 음악 파일 키. 없으면 null. */
export function resolveTrack(audio: AudioMap, track: Id): string | null {
  return audio.music[track] ?? null
}

/** 매핑이 가리키는 파일이 실제로 없는 것 — "sfx <키>" / "music <키>" 목록. 파일 존재 확인은 호출자가 집합으로 준다. */
export function missingAudioKeys(audio: AudioMap, sfxFiles: ReadonlySet<string>, bgmFiles: ReadonlySet<string>): string[] {
  const out = new Set<string>()
  for (const key of [...Object.values(audio.sfx), ...Object.values(audio.footsteps)]) if (!sfxFiles.has(key)) out.add(`sfx ${key}`)
  for (const key of Object.values(audio.music)) if (!bgmFiles.has(key)) out.add(`music ${key}`)
  return [...out]
}
