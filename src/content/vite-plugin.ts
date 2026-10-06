import { readFileSync } from "node:fs"
import { resolve, sep } from "node:path"
import type { Plugin } from "vite"
import { compileContent } from "./compile.ts"
import { parseLedger, toCredits } from "./ledger.ts"
import { loadContentDir } from "./load-node.ts"

const VIRTUAL_ID = "virtual:content"
const RESOLVED_ID = "\0virtual:content"
const CREDITS_ID = "virtual:credits"
const RESOLVED_CREDITS_ID = "\0virtual:credits"

/**
 * Serves `virtual:content` (default export: compiled GameContent) from `contentDir`,
 * and `virtual:credits` (default export: ledger rows, URL scheme stripped) from `assets/LEDGER.md` beside it.
 */
export function hollowContent(contentDir: string): Plugin {
  const dir = resolve(contentDir)
  const ledger = resolve(dir, "..", "assets", "LEDGER.md")
  const inContent = (file: string): boolean => {
    const f = resolve(file)
    return f === dir || f.startsWith(dir + sep)
  }
  return {
    name: "hollow-content",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      if (id === CREDITS_ID) return RESOLVED_CREDITS_ID
      return null
    },
    load(id) {
      if (id === RESOLVED_CREDITS_ID) {
        this.addWatchFile(ledger)
        return `export default ${JSON.stringify(toCredits(parseLedger(readFileSync(ledger, "utf8"))))}`
      }
      if (id !== RESOLVED_ID) return null
      const { content, errors } = compileContent(loadContentDir(dir))
      if (content === null || errors.length > 0) this.error(errors.join("\n") || "content compile failed")
      return `export default ${JSON.stringify(content)}`
    },
    configureServer(server) {
      server.watcher.add([dir, ledger])
      const onChange = (file: string): void => {
        const isLedger = resolve(file) === ledger
        if (!isLedger && !inContent(file)) return
        const mod = server.moduleGraph.getModuleById(isLedger ? RESOLVED_CREDITS_ID : RESOLVED_ID)
        if (mod !== undefined) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: "full-reload" })
      }
      server.watcher.on("change", onChange)
      server.watcher.on("add", onChange)
      server.watcher.on("unlink", onChange)
    }
  }
}
