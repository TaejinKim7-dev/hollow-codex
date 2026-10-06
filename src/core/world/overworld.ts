import type { GameContent } from "../../content/types.ts"
import type { GameState, Id, Pos } from "../types.ts"
import { samePos } from "../state.ts"

/** 오버월드 마을 입구 타일(MapDef.exits[i].at)에 서 있으면 도착지 맵과 도착 셀을 돌려준다 (D8).
 *  오버월드가 아닌 지도, 입구가 아닌 셀, 자기 자신으로 돌아가는 출구(소용돌이)는 null이다. */
export function enterOverworldTarget(
  _state: GameState, content: GameContent, playerPos: Pos, currentMapId: Id
): { mapId: Id; pos: Pos } | null {
  const map = content.maps[currentMapId]
  if (!map || map.isOverworld !== true) return null
  for (const exit of map.exits) {
    if (exit.to === currentMapId) continue    // 자가 루프 출구는 허용하지 않는다
    if (samePos(exit.at, playerPos)) return { mapId: exit.to, pos: exit.arrive }
  }
  return null
}