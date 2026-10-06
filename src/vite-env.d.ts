/// <reference types="vite/client" />

declare module "virtual:content" {
  import type { GameContent } from "./content/types.ts"
  const content: GameContent
  export default content
}
