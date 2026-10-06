// Task 16 시나리오 테스트에서 재사용하는 실제 콘텐츠 전투 수순.
// 모두 결정적(난수 미사용)이며, 게임 규칙에 따라 정확히 이 명령으로 성립함을 probe로 검증했다.
import type { Command } from "../../src/core/types.ts"

/** 다리 늑대 3마리를 밀어내 전멸 — 행실 0. 전투 후 플레이어 hp 2. */
export const WOLF_PUSH_WIN: readonly Command[] = [
  { type: "combat", action: { kind: "endTurn" } },
  { type: "combat", action: { kind: "endTurn" } },
  { type: "combat", action: { kind: "move", to: { x: 3, y: 5 } } },
  { type: "combat", action: { kind: "push", dir: "e" } },
  { type: "combat", action: { kind: "push", dir: "w" } },
  { type: "combat", action: { kind: "move", to: { x: 4, y: 6 } } },
  { type: "combat", action: { kind: "push", dir: "n" } },
  { type: "combat", action: { kind: "move", to: { x: 1, y: 6 } } },
  { type: "combat", action: { kind: "push", dir: "n" } },
  { type: "combat", action: { kind: "move", to: { x: 3, y: 5 } } },
  { type: "combat", action: { kind: "push", dir: "s" } },
  { type: "combat", action: { kind: "move", to: { x: 2, y: 5 } } },
  { type: "combat", action: { kind: "push", dir: "w" } },
  { type: "combat", action: { kind: "move", to: { x: 1, y: 5 } } },
  { type: "combat", action: { kind: "push", dir: "s" } },
  { type: "combat", action: { kind: "push", dir: "w" } }
]

/** 늑대 한 마리를 공격으로 죽일 때까지의 최소 수순 — deed.kill-innocent 기록. */
export const WOLF_KILL: readonly Command[] = [
  { type: "combat", action: { kind: "endTurn" } },
  { type: "combat", action: { kind: "endTurn" } },
  { type: "combat", action: { kind: "move", to: { x: 3, y: 5 } } },
  { type: "combat", action: { kind: "attack", dir: "e" } },
  { type: "combat", action: { kind: "attack", dir: "w" } },
  { type: "combat", action: { kind: "attack", dir: "e" } }
]

/** 서고 도굴꾼 2명 공격으로 격파 — evil이라 행실 없음. 전투 후 hp 3. */
export const ROBBER_WIN: readonly Command[] = [
  { type: "combat", action: { kind: "endTurn" } },
  { type: "combat", action: { kind: "move", to: { x: 3, y: 3 } } },
  { type: "combat", action: { kind: "attack", dir: "n" } },
  { type: "combat", action: { kind: "attack", dir: "n" } },
  { type: "combat", action: { kind: "attack", dir: "e" } },
  { type: "combat", action: { kind: "attack", dir: "e" } }
]