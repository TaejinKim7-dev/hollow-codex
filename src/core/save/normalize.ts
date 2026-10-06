// 불러온 state를 지금 content에 맞춘다. 저장 형식(버전)과 무관하게 content에만 기대므로 deserialize와 따로 둔다.
// core 순수성: 입력을 바꾸지 않고, 바뀐 게 없으면 같은 객체를 돌려준다.
import type { GameContent } from "../../content/types.ts"
import type { GameState } from "../types.ts"
import { addSorted } from "../state.ts"

/**
 * - 저장 이후 content에 더해진 추론 페이지(예: M1 저장에 없던 7개 마을)를 빈 페이지로 더한다.
 * - 칸 수가 3이 아닌 페이지는 3칸으로 맞춘다(모자라면 null, 넘치면 자른다).
 * - 지금 서 있는 지도의 enterFlags(예: flag.town.<마을>, 힌트 탭 범위)를 더한다. 그 지도에 들어와 있으니 사실이다.
 * - 마을 깃발(flag.town.*)이 생기기 전의 저장을 위해, 이미 들른 마을의 깃발을 추정해 더한다:
 *   그 마을 지도의 NPC만 주는 단서를 알거나, 그 마을 NPC의 위기를 풀었으면 들른 것이다.
 */
export function normalizeLoaded(state: GameState, content: GameContent): GameState {
  let changed = false
  const deductions: Record<string, GameState["deductions"][string]> = { ...state.deductions }
  for (const id of Object.keys(content.deductions)) {
    const page = deductions[id]
    if (page === undefined) {
      deductions[id] = { slots: [null, null, null], confirmed: false }
      changed = true
    } else if (!Array.isArray(page.slots) || page.slots.length !== 3) {
      const slots = Array.isArray(page.slots) ? page.slots : []
      deductions[id] = { slots: [0, 1, 2].map((i) => slots[i] ?? null), confirmed: page.confirmed === true }
      changed = true
    }
  }
  const flags = addSorted(state.flags, [...(content.maps[state.mapId]?.enterFlags ?? []), ...visitedTownFlags(state, content)])
  if (flags !== state.flags) changed = true
  return changed ? { ...state, deductions, flags } : state
}

/** 저장에 남은 단서·위기로 이미 들른 마을의 flag.town.* 를 추정한다. */
function visitedTownFlags(state: GameState, content: GameContent): string[] {
  const townFlagOf = (mapId: string): string | undefined =>
    content.maps[mapId]?.enterFlags.find((f) => f.startsWith("flag.town."))
  const grantedBy = new Map<string, Set<string>>()   // fact → town flags of the NPCs that grant it
  for (const npc of Object.values(content.npcs)) {
    const flag = townFlagOf(npc.map)
    for (const variants of Object.values(npc.topics)) {
      for (const topic of variants) {
        for (const id of [...(topic.grants ?? []), ...(topic.choice ?? []).flatMap((c) => c.grants ?? [])]) {
          const set = grantedBy.get(id) ?? new Set<string>()
          set.add(flag ?? "")
          grantedBy.set(id, set)
        }
      }
    }
  }
  const out: string[] = []
  for (const id of state.facts) {
    const towns = grantedBy.get(id)
    if (towns !== undefined && towns.size === 1) {
      const only = [...towns][0]!
      if (only !== "") out.push(only)
    }
  }
  for (const crisisId of Object.keys(state.crises)) {
    const npc = content.npcs[content.crises[crisisId]?.npc ?? ""]
    const flag = npc === undefined ? undefined : townFlagOf(npc.map)
    if (flag !== undefined) out.push(flag)
  }
  return out
}
