import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { auditFiles } from "../src/audit/dist-rules.ts"
import type { DistFile } from "../src/audit/dist-rules.ts"

const DIST = "dist"
const TEXT_EXT = [".js", ".css", ".html", ".json", ".svg", ".txt", ".webmanifest"]

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

if (!existsSync(DIST)) {
  console.error("audit:dist: dist/ not found — run npm run build")
  process.exit(1)
}

const files: DistFile[] = walk(DIST).map((p) => {
  const path = relative(DIST, p).split(sep).join("/")
  const size = statSync(p).size
  const text = TEXT_EXT.some((e) => path.endsWith(e)) ? readFileSync(p, "utf8") : null
  return { path, text, size }
})

const violations = auditFiles(files)
if (violations.length > 0) {
  for (const v of violations) console.error(v)
  process.exit(1)
}
console.log(`audit:dist: ok (${files.length} files, ${files.reduce((n, f) => n + f.size, 0)} bytes)`)
