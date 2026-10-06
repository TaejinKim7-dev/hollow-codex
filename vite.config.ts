import { resolve } from "node:path"
import { defineConfig } from "vite"
import { hollowContent } from "./src/content/vite-plugin.ts"

export default defineConfig({
  base: "/hollow-codex/",
  plugins: [hollowContent(resolve(import.meta.dirname, "content"))]
})
