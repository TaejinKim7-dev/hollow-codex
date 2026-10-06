import type { GameContent } from "../content/types.ts"
import type { Command, GameState, StepResult } from "./types.ts"
import { ask, choose, endTalk, interact } from "./dialogue/talk.ts"
import { fillSlot } from "./knowledge/notebook.ts"
import { recruit } from "./virtue/conduct.ts"
import { move, moveTo } from "./world/move.ts"

/**
 * 결정적 한 걸음. 모드별로 유효한 명령만 처리하고, 나머지는 무시(같은 state, 이벤트 0).
 * 아직 구현되지 않은 명령(이후 Task 몫)도 무시한다.
 */
export function step(state: GameState, command: Command, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }

  if (state.combat !== null) {
    switch (command.type) {
      case "combat":
        return ignored                                              // Task 10
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
        return ignored                                              // Task 9
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
    case "fillSlot":
      return fillSlot(state, command.deductionId, command.slot, command.word, content)
    case "interact":
      return interact(state, command.at, content)
    default:
      return ignored
  }
}
