import "./ui/fonts.css"
import content from "virtual:content"
import credits from "virtual:credits"
import { createDebugLog, debugEnabledFromUrl } from "./debug-log.ts"

const log = createDebugLog({ enabled: debugEnabledFromUrl(location.href) })
log.log("boot")
log.log("content", { maps: Object.keys(content.maps).length })
log.log("credits", { files: credits.length })
