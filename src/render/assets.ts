import type { GameContent, SpriteRef } from "../content/types.ts"
import type { Ground } from "../content/ground.ts"
import type { Id } from "../core/types.ts"
import type { WangTable } from "./autotile.ts"

/** 풀 위에 덮어 그리는 땅 → 그 땅을 잇는 Wang 타일셋 폴더. 시트가 아직 없는 땅(floor)은 없다. */
export const GROUND_SETS: Readonly<Partial<Record<Ground, string>>> = { path: "grass-path-v3", water: "grass-water", stone: "grass-stone" }
/** 바닥 풀 한 칸("0000" 패턴)을 가져오는 타일셋. */
export const BASE_SET = "grass-path-v3"

const spriteGlob = import.meta.glob<string>("../../assets/sprites/**/*.png", { query: "?url", import: "default", eager: true })
const tableGlob = import.meta.glob<WangTable>("../../assets/sprites/tilesets/*/autotile.json", { import: "default", eager: true })

/** 글롭 키("../../assets/sprites/objects/kalas/house.png") → "objects/kalas/house" */
export function normalizeGlobKeys(glob: Readonly<Record<string, string>>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, url] of Object.entries(glob)) {
    const m = /assets\/sprites\/(.+)\.png$/.exec(key)
    if (m?.[1] !== undefined) out.set(m[1], url)
  }
  return out
}

export const spriteUrls: ReadonlyMap<string, string> = normalizeGlobKeys(spriteGlob)

/** 타일셋 id → 모서리 표. */
export const wangTables: Readonly<Record<string, WangTable>> = Object.fromEntries(
  Object.entries(tableGlob).flatMap(([key, table]) => {
    const m = /tilesets\/([^/]+)\/autotile\.json$/.exec(key)
    return m?.[1] === undefined ? [] : [[m[1], table] as const]
  })
)

/** 이 지도를 그리는 데 필요한 그림 묶음(접두어). 땅 시트, 지도·타일의 물건, 플레이어·NPC·크리처 캐릭터. */
export function mapAssetPrefixes(content: GameContent, mapId: Id): string[] {
  const out = new Set<string>()
  const map = content.maps[mapId]
  if (map === undefined) return []
  const char = (ref: SpriteRef): void => { if ("char" in ref) out.add(`characters/${ref.char}/`) }
  if (map.ground !== undefined) {
    out.add(`tilesets/${BASE_SET}/`)
    for (const row of map.ground) for (const g of row) {
      const set = g === null ? undefined : GROUND_SETS[g]
      if (set !== undefined) out.add(`tilesets/${set}/`)
    }
  }
  const object = (id: Id): void => { const def = content.objects[id]; if (def !== undefined) out.add(`objects/${def.image}`) }
  for (const o of map.objects ?? []) object(o.id)
  const glyphs = new Set(map.rows.flatMap((r) => [...r]))
  for (const ch of glyphs) { const t = content.tiles[ch]; if (t?.object !== undefined) object(t.object) }
  char(content.playerSprite)
  for (const n of Object.values(content.npcs)) if (n.map === mapId || n.companion !== undefined) char(n.sprite)
  for (const c of Object.values(content.creatures)) char(c.sprite)
  return [...out].sort()
}

function matches(key: string, prefix: string): boolean {
  return prefix.endsWith("/") ? key.startsWith(prefix) : key === prefix
}

/** 접두어에 맞는 PNG를 모두 불러와 키(assets/sprites 아래 경로, 확장자 없음)로 돌려준다. 실패한 파일은 빠진다(예외 없음). */
export async function loadMapAssets(
  urls: ReadonlyMap<string, string>,
  prefixes: readonly string[],
  makeImage: () => HTMLImageElement = () => new Image()
): Promise<Map<string, HTMLImageElement>> {
  const wanted = [...urls].filter(([key]) => prefixes.some((p) => matches(key, p)))
  const loaded = await Promise.all(wanted.map(([key, url]) => new Promise<[string, HTMLImageElement] | null>((resolve) => {
    const img = makeImage()
    img.onload = () => resolve([key, img])
    img.onerror = () => resolve(null)
    img.src = url
  })))
  return new Map(loaded.filter((e): e is [string, HTMLImageElement] => e !== null))
}
