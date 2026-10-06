import type { GameContent } from "../content/types.ts"
import type { Command, GameState, StepResult } from "./types.ts"
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
      case "choose":
      case "endTalk":
      case "resolveCrisis":
      case "recruit":
      case "fillSlot":
        return ignored                                              // Task 6–9, 11
      default:
        return ignored
    }
  }

  switch (command.type) {
    case "move":
      return move(state, command.dir, content)
    case "moveTo":
      return moveTo(state, command.target, content)
    case "interact":
    case "fillSlot":
      return ignored                                                // Task 6, 8
    default:
      return ignored
  }
}
