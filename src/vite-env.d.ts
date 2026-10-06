/// <reference types="vite/client" />

declare module "virtual:content" {
  const content: import("./content/types.ts").GameContent
  export default content
}

declare module "virtual:credits" {
  const credits: readonly import("./content/ledger.ts").LedgerRow[]
  export default credits
}
