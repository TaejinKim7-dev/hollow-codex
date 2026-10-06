import { createDebugLog, debugEnabledFromUrl } from "./debug-log.ts"

const log = createDebugLog({ enabled: debugEnabledFromUrl(location.href) })
log.log("boot")
