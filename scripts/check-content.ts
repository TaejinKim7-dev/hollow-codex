import { readdirSync, readFileSync, statSync } from "node:fs"
import { compileContent } from "../src/content/compile.ts"
import { checkLedger, parseLedger } from "../src/content/ledger.ts"
import { loadContentDir } from "../src/content/load-node.ts"

/** Repo-relative files under `dir` (recursive); empty when `dir` does not exist. */
function walk(dir: string): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  const out: string[] = []
  for (const name of names) {
    const p = `${dir}/${name}`
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const { content, errors } = compileContent(loadContentDir("content"))
if (content === null || errors.length > 0) {
  for (const e of errors) console.error(e)
  if (errors.length === 0) console.error("check:content: compile produced no content")
  process.exit(1)
}

// D20: ledger targets are assets/** plus content/music/*.yaml.
const files = [...walk("assets"), ...walk("content/music").filter((f) => f.endsWith(".yaml") && f.split("/").length === 3)].sort()
const ledgerErrors = checkLedger(parseLedger(readFileSync("assets/LEDGER.md", "utf8")), files)
if (ledgerErrors.length > 0) {
  for (const e of ledgerErrors) console.error(e)
  process.exit(1)
}
const ledgerFiles = files.filter((f) => f !== "assets/LEDGER.md" && !(f.split("/").pop() ?? "").startsWith("LICENSE")).length

const count = (o: object): number => Object.keys(o).length
console.log(`check:content: ok (${count(content.maps)} maps, ${count(content.npcs)} npcs, ${count(content.facts)} facts, ${ledgerFiles} ledger files)`)
