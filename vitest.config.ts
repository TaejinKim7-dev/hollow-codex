import { defineConfig } from "vitest/config"
import { resolve } from "node:path"
import { hollowContent } from "./src/content/vite-plugin.ts"

export default defineConfig({
  plugins: [hollowContent(resolve(import.meta.dirname, "content"))],
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/scenario/**/*.test.ts", "tests/integration/**/*.spec.ts"],
    globals: true,
    environment: "node"
  }
})
