/// <reference types="vite/client" />

declare module "virtual:content" {
  const content: import("./content/types.ts").GameContent
  export default content
}
