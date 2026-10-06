import type { GameContent } from "../content/types.ts"
import type { Command, GameState, StepResult } from "./types.ts"
import { combatStep } from "./combat/grid.ts"
import { resolveCrisis } from "./crisis/crisis.ts"
import { ask, choose, endTalk, interact } from "./dialogue/talk.ts"
import { fillSlot } from "./knowledge/notebook.ts"
import { recruit } from "./virtue/conduct.ts"
import { move, moveTo } from "./world/move.ts"
import { ringTravel } from "./world/ring.ts"
import { writeCodex, writeFinal } from "./codex/codex.ts"

/**
 * 결정적 한 걸음. 모드별로 유효한 명령만 처리하고, 나머지는 무시(같은 state, 이벤트 0).
 * 아직 구현되지 않은 명령(이후 Task 몫)도 무시한다.
 */
export function step(state: GameState, command: Command, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }

  // 언어 전환은 모드와 무관하게 항상 허용한다. 같으면 같은 state를 돌려준다.
  if (command.type === "setLanguage") {
    if (command.language === state.language) return ignored
    return { state: { ...state, language: command.language }, events: [] }
  }

  if (state.combat !== null) {
    switch (command.type) {
      case "combat":
        return combatStep(state, command.action, content)
      default:
        return ignored
    }
  }

  if (state.dialogue !== null) {
    switch (command.type) {
      case "ask":
        return ask(state, command.topic, content)
      case "choose":
        return choose(state, command.optionId, content)
      case "endTalk":
        return endTalk(state)
      case "resolveCrisis":
        return resolveCrisis(state, command.crisisId, command.optionId, content)
      case "recruit":
        return recruit(state, command.npcId, content)
      case "fillSlot":
        return fillSlot(state, command.deductionId, command.slot, command.word, content)
      default:
        return ignored
    }
  }

  switch (command.type) {
    case "move":
      return move(state, command.dir, content)
    case "moveTo":
      return moveTo(state, command.target, content)
    case "ringStep":
      return ringTravel(state, command.at, content)
    case "fillSlot":
      return fillSlot(state, command.deductionId, command.slot, command.word, content)
    case "writeCodex":
      return writeCodex(state, command.deductionId, command.word, content)
    case "writeFinal":
      return writeFinal(state, command.word, content)
    case "interact":
      return interact(state, command.at, content)
    default:
      return ignored
  }
}
