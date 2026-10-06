import "./ui/fonts.css"
import content from "virtual:content"
import credits from "virtual:credits"
import { createDebugLog, debugEnabledFromUrl } from "./debug-log.ts"
import { mountPanels } from "./ui/panels.ts"
import type { Command } from "./core/types.ts"
import type { UiAction } from "./input/commands.ts"

const log = createDebugLog({ enabled: debugEnabledFromUrl(location.href) })
log.log("boot")
log.log("content", { maps: Object.keys(content.maps).length })
log.log("credits", { files: credits.length })

// Task 16이 core.step에 연결한다. 지금은 no-op.
const dispatch = (_cmd: Command | UiAction): void => { /* Task 16 wires this */ }
mountPanels(document.getElementById("ui")!, content, dispatch, credits)