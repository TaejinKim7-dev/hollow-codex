import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { parse } from "yaml"
import type { RawContent } from "./types.ts"

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (name.endsWith(".yaml")) out.push(p)
  }
  return out
}

/** Reads every `**\/*.yaml` under `dir` into { "relative/path.yaml": parsed value }, sorted by path. */
export function loadContentDir(dir: string): RawContent {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error(`content directory not found: ${dir}`)
  const entries = walk(dir)
    .map((p) => [relative(dir, p).split(sep).join("/"), p] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const out: Record<string, unknown> = {}
  for (const [rel, p] of entries) out[rel] = parse(readFileSync(p, "utf8")) as unknown
  return out
}
