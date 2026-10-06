import { compileContent } from "../src/content/compile.ts"
import { loadContentDir } from "../src/content/load-node.ts"

const { content, errors } = compileContent(loadContentDir("content"))
if (content === null || errors.length > 0) {
  for (const e of errors) console.error(e)
  if (errors.length === 0) console.error("check:content: compile produced no content")
  process.exit(1)
}
const count = (o: object): number => Object.keys(o).length
console.log(`check:content: ok (${count(content.maps)} maps, ${count(content.npcs)} npcs, ${count(content.facts)} facts)`)
