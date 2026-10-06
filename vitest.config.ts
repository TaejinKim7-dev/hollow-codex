import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/scenario/**/*.test.ts"],
    globals: true,
    environment: "node"
  }
})
