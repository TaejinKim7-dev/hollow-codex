import type { Command, GameEvent } from "../core/types.ts"

/**
 * 게임 이벤트(와 방금 낸 명령)에서 효과음 이름을 정한다. 이름은 audio.yaml의 sfx 키.
 * 걸음·부딪힘·단서·타격·밀치기는 handleEvents가 따로 처리하므로 여기에 없다.
 */
export function eventSounds(events: readonly GameEvent[], cmd: Command): string[] {
  const out: string[] = []
  const ringTrip = events.some((e) => e.type === "ringTraveled")
  for (const e of events) {
    switch (e.type) {
      case "mapChanged": if (!ringTrip) out.push("map_change"); break
      case "combatStarted": out.push("combat_start"); break
      case "combatEnded": out.push(e.outcome === "victory" ? "victory" : e.outcome === "defeat" ? "defeat" : "flee"); break
      case "combatYield": if (e.how === "persuaded") out.push("persuade"); break
      case "companionJoined": out.push("companion_join"); break
      case "companionLeft": out.push("companion_leave"); break
      case "ringUnlocked": out.push("ring_unlock"); break
      case "abilityUnlocked": out.push("ability"); break
      case "crisisResolved": out.push("crisis"); break
      case "codexWritten": out.push("codex_write"); break
      case "epilogue": out.push("epilogue"); break
      default: break
    }
  }
  if (cmd.type === "combat" && cmd.action.kind === "defend") out.push("defend")
  return out
}
