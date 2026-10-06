// Denied-term matching (plan D4). Latin terms: case-insensitive, whole word plus an optional
// English ending (s, es, 's), inner spaces match any run of spaces/underscores/hyphens.
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

function latinPattern(term: string): RegExp {
  const body = term.split(/[\s_-]+/).map(escape).join("[\\s_-]+")
  return new RegExp(`(?<![a-z0-9])${body}(?:s|es|'s)?(?![a-z0-9])`, "i")
}

export function findDenied(
  texts: Iterable<{ where: string; text: string }>,
  deny: Denylist
): string[] {
  const latin = deny.latin.map((term) => ({ term, re: latinPattern(term) }))
  const out: string[] = []
  for (const { where, text } of texts) {
    for (const { term, re } of latin) if (re.test(text)) out.push(`${where}: denied term "${term}"`)
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
