import content from "virtual:content"
import { createDebugLog, debugEnabledFromUrl } from "./debug-log.ts"

const log = createDebugLog({ enabled: debugEnabledFromUrl(location.href) })
log.log("boot")
log.log("content", { maps: Object.keys(content.maps).length })
