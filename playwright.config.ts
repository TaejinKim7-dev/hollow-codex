import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173/hollow-codex/"
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173/hollow-codex/",
    reuseExistingServer: !process.env["CI"],
    timeout: 90_000
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }]
})