// Pure rules for auditing the built dist/ folder. No file-system access here.

export interface DistFile {
  path: string
  text: string | null
  size: number
}

const MIB = 1024 * 1024
/**
 * 범주별 용량 예산. firstLoad = 배경 음악을 뺀 전체(음악은 지도에 들어갈 때 불러오는 지연 로딩이라 첫 접속에 들지 않는다).
 * 빌드 파일 이름에는 해시가 붙으므로(`field-AbCd1234.ogg`) 배경 음악은 `bgmKeys`(assets/audio/bgm/의 파일 이름)로 알아본다.
 */
export const BUDGETS = { code: 3 * MIB, art: 6 * MIB, audio: 16 * MIB, firstLoad: 5 * MIB } as const

const AUDIO_EXT = [".ogg", ".mp3", ".wav", ".m4a"]
const ART_EXT = [".png", ".webp", ".jpg", ".jpeg", ".gif", ".ico", ".svg"]
const HASH_SUFFIX = /-[A-Za-z0-9_-]{8}(\.[^.]+)$/

type Category = "code" | "art" | "audio"
const categoryOf = (path: string): Category => {
  const lower = path.toLowerCase()
  if (AUDIO_EXT.some((e) => lower.endsWith(e))) return "audio"
  if (ART_EXT.some((e) => lower.endsWith(e))) return "art"
  return "code"
}
const isBgm = (path: string, bgmKeys: ReadonlySet<string>): boolean => {
  const base = (path.split("/").pop() ?? path).replace(HASH_SUFFIX, "$1")
  return categoryOf(path) === "audio" && bgmKeys.has(base.replace(/\.[^.]+$/, ""))
}

// Workbox's precache runtime embeds this documentation link in an unconditional
// `console.warn` string. It is never fetched, so it is inert and allowed.
export const WORKBOX_WARNING_URL = "https://bit.ly/wb-precache"
export const ALLOWED_ORIGINS: readonly string[] = [WORKBOX_WARNING_URL]

const SVG_NS_PREFIX = "http://www.w3.org/"
const BANNED_NAMES: readonly string[] = ["u4-alt-manual.pdf", "origin.txt"]

export function auditFiles(files: readonly DistFile[], opts: { readonly bgmKeys?: ReadonlySet<string> } = {}): string[] {
  const out: string[] = []
  const bgmKeys = opts.bgmKeys ?? new Set<string>()
  const sums: Record<Category, number> = { code: 0, art: 0, audio: 0 }
  let firstLoad = 0
  for (const f of files) {
    sums[categoryOf(f.path)] += f.size
    if (!isBgm(f.path, bgmKeys)) firstLoad += f.size
    if (f.path.includes("assets-private")) out.push(`${f.path}: assets-private file shipped`)
    if (f.path.startsWith("lab/") || f.path.includes("/lab/")) out.push(`${f.path}: dev-only lab file shipped`)
    if (f.text !== null) {
      for (const url of f.text.match(/https?:\/\/[^\s"'`)<>]+/g) ?? []) {
        if (url.startsWith(SVG_NS_PREFIX)) continue
        if (ALLOWED_ORIGINS.some((o) => url.startsWith(o))) continue
        out.push(`${f.path}: external origin ${url}`)
      }
    }
    if (f.path.endsWith(".map")) out.push(`${f.path}: source map shipped`)
    const base = f.path.split("/").pop() ?? f.path
    if (BANNED_NAMES.includes(base) || base.toLowerCase().endsWith(".pdf")) {
      out.push(`${f.path}: banned reference file`)
    }
  }
  for (const c of ["code", "art", "audio"] as const) {
    if (sums[c] > BUDGETS[c]) out.push(`dist: ${c} ${sums[c]} bytes over budget ${BUDGETS[c]}`)
  }
  if (firstLoad > BUDGETS.firstLoad) out.push(`dist: first load ${firstLoad} bytes over budget ${BUDGETS.firstLoad}`)
  return out
}
