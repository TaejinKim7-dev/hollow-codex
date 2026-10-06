import { resolve, sep } from "node:path"
import type { Plugin } from "vite"
import { compileContent } from "./compile.ts"
import { loadContentDir } from "./load-node.ts"

const VIRTUAL_ID = "virtual:content"
const RESOLVED_ID = "\0virtual:content"

/** Serves `virtual:content` (default export: compiled GameContent) from `contentDir`. */
export function hollowContent(contentDir: string): Plugin {
  const dir = resolve(contentDir)
  const inContent = (file: string): boolean => {
    const f = resolve(file)
    return f === dir || f.startsWith(dir + sep)
  }
  return {
    name: "hollow-content",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      const { content, errors } = compileContent(loadContentDir(dir))
      if (content === null || errors.length > 0) this.error(errors.join("\n") || "content compile failed")
      return `export default ${JSON.stringify(content)}`
    },
    configureServer(server) {
      server.watcher.add(dir)
      const onChange = (file: string): void => {
        if (!inContent(file)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod !== undefined) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: "full-reload" })
      }
      server.watcher.on("change", onChange)
      server.watcher.on("add", onChange)
      server.watcher.on("unlink", onChange)
    }
  }
}
