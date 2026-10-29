import type { GameContent } from "../content/types.ts"
import type { GameEvent, GameState } from "../core/types.ts"
import { t } from "./strings.ts"

/**
 * 동료가 합류·이탈·재합류하는 순간의 한 줄 대사(문자열 키 `companion.<npcId>.join|leave|rejoin`)를 이벤트 순서대로 돌려준다.
 * before는 그 명령을 처리하기 전 상태(재합류는 그때 departed에 들어 있던 동료). 문구가 없는 동료(연습장 교관 등)는 건너뛴다.
 */
export function companionLines(events: readonly GameEvent[], before: GameState, content: GameContent): string[] {
  const out: string[] = []
  for (const e of events) {
    if (e.type !== "companionJoined" && e.type !== "companionLeft") continue
    const kind = e.type === "companionLeft" ? "leave" : before.departed.includes(e.npcId) ? "rejoin" : "join"
    const key = `companion.${e.npcId}.${kind}`
    if (content.strings[before.language]?.[key] !== undefined) out.push(t(before.language, content.strings, key))
  }
  return out
}
