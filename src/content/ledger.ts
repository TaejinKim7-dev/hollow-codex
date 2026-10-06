export interface LedgerRow {
  path: string
  source: string
  author: string
  license: string
}

export const ALLOWED_LICENSES = ["CC0-1.0", "CC-BY-3.0", "CC-BY-4.0", "CC-BY-SA-3.0", "CC-BY-SA-4.0", "OFL-1.1"] as const

const LEDGER_FILE = "assets/LEDGER.md"
const HEADER = ["path", "source", "author", "license"]

function cells(line: string): string[] {
  let s = line.trim()
  if (s.startsWith("|")) s = s.slice(1)
  if (s.endsWith("|")) s = s.slice(0, -1)
  return s.split("|").map((c) => c.trim().replace(/^`+|`+$/g, "").trim())
}

/** Reads the first `| path | source | author | license |` table: the rows after its separator line. */
export function parseLedger(markdown: string): LedgerRow[] {
  const lines = markdown.split(/\r?\n/)
  const head = lines.findIndex((l) => {
    const c = cells(l)
    return l.trim().startsWith("|") && c.length === HEADER.length && c.every((v, i) => v.toLowerCase() === HEADER[i])
  })
  if (head < 0) return []
  const rows: LedgerRow[] = []
  for (const line of lines.slice(head + 2)) {
    if (!line.trim().startsWith("|")) break
    const [path = "", source = "", author = "", license = ""] = cells(line)
    rows.push({ path, source, author, license })
  }
  return rows
}

function exempt(file: string): boolean {
  const base = file.slice(file.lastIndexOf("/") + 1)
  return file === LEDGER_FILE || base.startsWith("LICENSE")
}

/** `files` = repo-relative paths of ledger targets. Returns one message per problem. */
export function checkLedger(rows: readonly LedgerRow[], files: readonly string[]): string[] {
  const errors: string[] = []
  const listed = new Set(rows.map((r) => r.path))
  const present = new Set(files)
  for (const f of files) {
    if (!exempt(f) && !listed.has(f)) errors.push(`${f}: not in ${LEDGER_FILE}`)
  }
  for (const r of rows) {
    if (!present.has(r.path)) errors.push(`${r.path}: listed in ${LEDGER_FILE} but missing`)
    else if (!(ALLOWED_LICENSES as readonly string[]).includes(r.license)) {
      errors.push(`${r.path}: license "${r.license}" is not allowed (allowed: ${ALLOWED_LICENSES.join(", ")})`)
    }
  }
  return errors
}

/** Credits are shown as text, so the URL scheme is dropped (keeps the dist audit's external-origin rule strict). */
export function toCredits(rows: readonly LedgerRow[]): LedgerRow[] {
  return rows.map((r) => ({ ...r, source: r.source.replace(/https?:\/\//gi, "") }))
}
