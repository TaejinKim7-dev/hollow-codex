// Denied-term matching (plan D4). Latin terms: case-insensitive, whole word plus an optional
// English ending (s, es, 's), inner spaces match any run of spaces/underscores/hyphens.
// camelCase / PascalCase compounds are split at the case boundary first, so a term that is one
// part of a compound ("openZorvaniaGate") is still caught as a whole word.
// Hangul terms: substring.

export interface Denylist { readonly latin: readonly string[]; readonly hangul: readonly string[] }

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

export function parseDenylist(value: unknown): { latin: string[]; hangul: string[] } {
  if (typeof value !== "object" || value === null) return { latin: [], hangul: [] }
  const rec = value as Record<string, unknown>
  return {
    latin: stringList(rec["latin"]).map((t) => t.trim().toLowerCase()).filter((t) => t !== ""),
    hangul: stringList(rec["hangul"]).map((t) => t.trim()).filter((t) => t !== "")
  }
}

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Inserts a space at camelCase/PascalCase boundaries so the word-boundary pattern sees each part. */
export function splitCamelCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
}

function latinPattern(term: string): RegExp {
  const words = term.split(/[\s_-]+/)
  const last = words.length - 1
  let body = words.map(escape).join("[\\s_-]+")
  // A term ending in y also matches its -ies plural: "fazolmy" → "fazolmies".
  if (term.endsWith("y") && words[last] !== undefined) {
    const plural = [...words]
    plural[last] = `${plural[last]!.slice(0, -1)}ies`
    body = `(?:${body}|${plural.map(escape).join("[\\s_-]+")})`
  }
  return new RegExp(`(?<![a-z0-9])${body}(?:s|es|'s)?(?![a-z0-9])`, "i")
}

export function findDenied(
  texts: Iterable<{ where: string; text: string }>,
  deny: Denylist
): string[] {
  const latin = deny.latin.map((term) => ({ term, re: latinPattern(term) }))
  const out: string[] = []
  for (const { where, text } of texts) {
    const latinText = splitCamelCase(text)
    for (const { term, re } of latin) if (re.test(latinText)) out.push(`${where}: denied term "${term}"`)
    for (const term of deny.hangul) if (text.includes(term)) out.push(`${where}: denied term "${term}"`)
  }
  return out
}

/**
 * Scans repository files (src/, tests/, scripts/ — AGENTS §2) for denied terms: each file's path,
 * then each line, reported as "path: path: ..." or "path:<line>: ...".
 */
export function scanRepoText(files: Iterable<{ path: string; text: string }>, deny: Denylist): string[] {
  const texts: { where: string; text: string }[] = []
  for (const { path, text } of files) {
    texts.push({ where: `${path}: path`, text: path })
    text.split("\n").forEach((line, i) => texts.push({ where: `${path}:${i + 1}`, text: line }))
  }
  return findDenied(texts, deny)
}
