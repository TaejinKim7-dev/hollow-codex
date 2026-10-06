// Pure rules for auditing the built dist/ folder. No file-system access here.

export interface DistFile {
  path: string
  text: string | null
  size: number
}

export const BUNDLE_BUDGET_BYTES = 5 * 1024 * 1024

// Workbox's precache runtime embeds this documentation link in an unconditional
// `console.warn` string. It is never fetched, so it is inert and allowed.
export const WORKBOX_WARNING_URL = "https://bit.ly/wb-precache"
export const ALLOWED_ORIGINS: readonly string[] = [WORKBOX_WARNING_URL]

const SVG_NS_PREFIX = "http://www.w3.org/"
const BANNED_NAMES: readonly string[] = ["u4-alt-manual.pdf", "origin.txt"]

export function auditFiles(files: readonly DistFile[]): string[] {
  const out: string[] = []
  let total = 0
  for (const f of files) {
    total += f.size
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
  if (total > BUNDLE_BUDGET_BYTES) {
    out.push(`dist: total ${total} bytes over budget ${BUNDLE_BUDGET_BYTES}`)
  }
  return out
}
