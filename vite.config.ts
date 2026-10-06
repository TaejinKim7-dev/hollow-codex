import { resolve } from "node:path"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { hollowContent } from "./src/content/vite-plugin.ts"

export default defineConfig({
  base: "/hollow-codex/",
  plugins: [
    hollowContent(resolve(import.meta.dirname, "content")),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "빈 경전 — Hollow Codex",
        short_name: "빈 경전",
        description: "미덕이 제도가 되어 굳어버린 대륙 알마의 지식 기반 탐험 RPG",
        start_url: "/hollow-codex/",
        scope: "/hollow-codex/",
        display: "standalone",
        background_color: "#111111",
        theme_color: "#111111",
        lang: "ko",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,woff2,webmanifest}"],
        navigateFallback: "/hollow-codex/index.html",
        cleanupOutdatedCaches: true
      }
    })
  ]
})
