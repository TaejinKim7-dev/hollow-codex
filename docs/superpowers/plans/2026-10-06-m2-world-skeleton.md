# M2 — 세계 골격 구현 계획

작성 시각: 2026-10-06 (M1 완료 직후). 사용자 확인 없이 진행. 브랜치: `todo-3-world`.

## 1. 목표 (M2 완료 기준)

> spec §8 — "대륙 끝에서 끝까지 이동 가능" — 플레이어가 (a) 들판·산·강·다리를 걸어 (b) 8 마을 입구에 들어갔다 나오고 (c) 열석 고리를 통해 다른 고리로 순간이동 (e) NPC가 낮·밤에 다른 칸에 서 있고 (g) 동료 4명째를 거부한다 — 이 모든 게 동작하면 M2 통과.

M3·M4(타운 2–4, 5–8 콘텐츠)는 별 마일스톤.

## 2. 스펙과 다르게 정한 점

| # | 결정 | 스펙 원문/의도 | 근거 |
|---|---|---|---|
| D1 | 8 마을 이름은 작업자가 직접 짓는다 (한글, 원작 회피) | spec §3.2 "마을 이름은 금지 목록과 겹치지 않게 콘텐츠 작업에서 짓는다" | 동일. 영문 음역 금지어만 추가 — `david`, `iertizan`, `gargoyle`, `wisp` 등도 사용 금지. |
| D2 | 열석 고리 7개 + 칼라스 안쪽 1개 = 총 8개 | spec §3.3 "열석 고리들의 이름과 노래를 알아내면" | 마을당 1개씩 두면 8개. 칼라스는 M1에서 이미 고리(`o` 6개 원형)를 쓰니 그 고리가 1번 고리. |
| D3 | NPC 일과는 4-슬롯(`{ 0, 6, 12, 18 }` 시간 칸)으로 단순화 | spec §3.2·§4.7 | 시간당 분 단위는 M2에 과함. 6시간 단위면 아침/낮/저녁/밤 4칸. |
| D4 | 시간 진행 = `move` 명령 1회당 1시간, `moveTo` 경로의 `move` 횟수만큼 | spec §4.7·§4.8 | 수첩·대화·전투는 시간 정지(플레이어가 결정할 일). |
| D5 | 동행 최대 3명 초과 시 새 후보는 거부하고 `companionJoinRejected` 이벤트만 | spec §4.6 "동행 최대 3명" | 별도 큐 없이 거부. 떠나서 자리 나면 다시 시도 가능. |
| D6 | M1 세이브는 `version: 1` 그대로 둔다 — M2 신규 필드(`time`, `hour`, `rings`)는 deserialize 시 기본값 부여 | spec §7.5 | 기존 플레이어 진행이 깨지지 않게. |
| D7 | 8 마을 각각은 M2에서 8×6 스텁만(입구+출구+1칸 광장, NPC 0). 콘텐츠는 M3·M4 | spec §8 "8마을 배치" | "배치"는 위치·진입. 콘텐츠는 다음 마일스톤. |
| D8 | 마을 진입은 "마을 입구 타일" 셀에 발을 딛을 때. 출구는 마을 내부의 `<` 1셀 | spec §3.3 "각 마을의 위기를..." | 마을마다 1개의 입구 타일 = `exits[0].at` on overworld. |
| D9 | 열석 고리 모달 = `o` 글자 타일, 각각 별도 id. 한 고리에 들어가면 다른 고리에서 나옴. | spec §3.3 step 4 | 이동 = `{ type: "ringStep", at: ringId }`. 도착지 = `state.rings.knownRings`에서 `at`과 다른 항목. |
| D10 | 열석 사용 조건 = 도착지 고리 id의 fact(예: `fact.ring.honesty`)를 알고 있어야. | spec §3.3 "이름과 노래를 알아내면" | M2엔 잠금 해제 fact는 M3·M4 콘텐츠로 생성. M2에서는 8개 정지고를 모두 잠금 해제 상태로 둠 (스켈레톤만). |
| D11 | E2E는 M2에도 1개 — 페이지 부팅만 확인. 시나리오 테스트로 "대륙 traversal"을 검증. | spec §7.6 / AGENTS.md §4 | M1과 동일 정책. |

## 3. 교차 규칙 (Cross-task rulings)

| # | 내용 |
|---|---|
| D12 | `state.time: { hour: number (0–23); day: number }`. `hour`는 `move` 1회마다 1 증가, 24되면 `day += 1, hour = 0`. `dayChanged` 이벤트 발화. |
| D13 | `NpcDef.schedule?: Record<pos, Pos>` — 키는 시간(0,6,12,18 중 하나). 없으면 기존 `pos` 고정 (M1 호환). |
| D14 | `GameContent.moongates: Record<id, { at: Pos; nameKey: string; songKey: string; fact: string }>` — 8개. |
| D15 | `state.rings: { visited: Id[]; knownFacts: Id[] }`. `visited` = 정렬·중복 없는 배열. |
| D16 | `Command` 추가: `{ type: "ringStep"; at: Id }`. |
| D17 | `GameEvent` 추가: `timePassed` (hour 변화), `dayPassed` (day 변화), `mapChanged` (기존), `ringTraveled` (from, to). |
| D18 | `step` 분기: `ringStep` → `ringTravel(fromId, toId)`. `move`/`moveTo` 시 시간 1 진행. |
| D19 | `recruit` 분기: `party.length >= 3` → `{ ok: false, reason: "party-full" }` + `companionJoinRejected` 이벤트, 상태는 변하지 않음. |
| D20 | `MapDef.isOverworld?: boolean` (M2 신규). 참이면 `findPath` 비용 = terrain cost (`.=1, ,=2, :=2, ~=null, T=nil, ^=nil, ==`, `<>=1, o=null이면 입장만`). |
| D21 | `findPathOnGrid`는 이미 M1에서 추가됨. 오버월드는 같은 함수로 처리. 단, 셀에 NPC가 있으면 막힘. |
| D22 | Town stubs = 8개. 각 스텁은 `id: town.<virtue>`, `rows: ["######", "#+...#", "#..L.#", "######"]` 정도, `exits: [{ at: <출구>, to: <해당 마을 오버월드 셀>, arrive: <마을 입구 셀> }]`, `enterFlags: []`, `heals: true`, NPC 0. |
| D23 | `assets/LEDGER.md` M2 변경 없음 (타일 자산 그대로). |
| D24 | `src/main.ts`는 M2에서 도시 순서 표시(일간·오클락) + 열석 메뉴를 추가 (UI 패널). |
| D25 | `vite.config.ts` 변경 없음. |
| D26 | 브랜치: M2 모든 Task = `todo-3-world`. main 머지·push는 M2 마지막 Task 끝(시나리오 포함)에서 한 번. |

## 4. 엣지 케이스 (Edge cases)

1. **시간시킹**: `move`를 23시간에 보내면 0→다음 날. `dayPassed` 이벤트는 `timePassed`와 동시 발화하지 않고 순서대로 발화 (먼저 hour wrap, 그 다음 day).
2. **하루 끝의 NPC 재배치**: 플레이어가 17:55에 마을에 있고 다음 `move`로 18:00이 되면, NPC 위치는 18시 슬롯으로 이동. `entryFlags`와 다른 진입 조건은 영향 없음.
3. **정지 1세션**: 한 번 고리에 들어가면 다른 고리에서 나옴. 도착지가 잠겨 있으면(`fact` 미획득) → `{ ok: false, reason: "ring-locked" }`, 같은 맵, 이벤트 0.
4. **파티 만원 거부 후**: 떠난 동료가 자리를 내도 다시 영입 명령을 보내야 함. 자동 영입 X.
5. **M1 세이브 로드**: `state.time`, `state.rings` 없으면 기본값 `{ hour: 8, day: 1, rings: { visited: [], knownFacts: [] } }`. 정지 사용 안 됨 (모든 fact 없음).
7. **오버월드 셀 NPC**: 오버월드는 NPC 0. 스폰 정지.
9. **마을 입구 타일 = 오버월드 셀의 비어있는 셀** (예: `+`로 표시). 발이 닿는 즉시 마을 내부로 이동. 자동.
10. **마을 내부 → 오버월드**: 마을 내부 `<` 칸에서 `move` (남쪽 등) → 오버월드 입구 셀.

## 5. 핵심 타입 (M2 신규/변경)

### `src/core/types.ts` 추가
```ts
export interface TimeState { readonly hour: number; readonly day: number }   // D12
export interface RingTravel { readonly from: Id; readonly to: Id }            // 도착지/하이도
```

### `src/core/types.ts` 변경
```ts
export interface GameState {
  ...
  readonly time: TimeState                                                // 신규
  readonly rings: { visited: readonly Id[]; knownFacts: readonly Id[] }    // 신규
}

// Command에 추가
| { type: "ringStep"; at: Id }

// GameEvent에 추가
| { type: "timePassed"; hour: number; day: number }
| { type: "dayPassed"; day: number }
| { type: "ringTraveled"; from: Id; to: Id }
| { type: "companionJoinRejected"; npcId: Id }
```

### `src/content/types.ts` 변경
```ts
export interface NpcDef {
  ...
  readonly schedule?: Readonly<Record<string, Pos>>   // D13 — 키: "0"|"6"|"12"|"18"
}

export interface MapDef {
  ...
  readonly isOverworld?: boolean                              // D20
  readonly terrainCost?: Readonly<Record<string, number>>     // D20 — M2 신규 맵에서만
}

export interface MoongateDef {
  readonly at: Pos; readonly nameKey: string; readonly songKey: string
  readonly fact: Id; readonly onOverworld: Id
}

export interface GameContent {
  ...
  readonly moongates: Readonly<Record<Id, MoongateDef>>   // D14
}
```

### `src/core/state.ts` 변경
```ts
return {
  ...
  time: { hour: 8, day: 1 },                                              // 오전 8시 시작
  rings: { visited: [], knownFacts: [] }
}
```

## 6. Task 목록 (Task 17 ~ Task 32)

**Phase 1 (독립, 4 Task 병렬)**
- Task 17 — 시간 시스템 (state.time + move 시간 진행 + events)
- Task 18 — NPC 일과 (NpcDef.schedule + 배치)
- Task 19 — 대륙 오버월드 스키마 (MapDef.isOverworld, terrainCost, findPath 확장)
- Task 27 — 동료 파티 상한 (3명) + 거부 이벤트

**Phase 2 (Phase 1 후)**
- Task 20 — 오버월드 이동·경로 + 진입 트리거 (마을 입구 셀 → 맵로)
- Task 22 — 대륙 위 8 마을 입구 셀 배치 (오버월드 셀에 마을 id 좌표)
- Task 24 — 열석 고리 콘텐츠 (8개 moongates)
- Task 25 — 열석 고리 state (visited, knownFacts)

**Phase 3 (Phase 2 후)**
- Task 23 — 8 마을 스텁 (8×6 내부 맵 + 콘텐츠 출구)
- Task 26 — `ringStep` 명령 + `ringTravel` 핸들러 (잠금·배치·이벤트)
- Task 28 — 메인 패널: 일간 표시 + 열석 메뉴 UI
- Task 29 — 열석 메뉴 모달 (사용자가 목적지 고리 id 골라 dispatch)

**Phase 4 (Phase 3 후)**
- Task 30 — 세이브 마이그레이션 (M1 세이브 호환: 신규 필드 기본값)
- Task 31 — 시나리오 테스트 (대륙 traversal: 시작 → 정문 입장 → 나옴 → 다른 마을 → 정석 이동)
- Task 32 — 통합 + e2e 1회 + main 머지·push

총 **16 Task** (Task 17–32). 각 Task TDD(RED→GREEN) + `todo-3-world` 브랜치에 커밋.

## 7. 머지 게이트

```bash
npm ci
npm run test:unit
npm run typecheck
npm run check:content
npm run build
npm run audit:dist
git diff --check
```

전부 exit 0 + e2e 1 passed.

## 8. 사용자 확인 없이 진행

본 계획은 사용자 명시적 확인("앞으로 내 확인부터 받지 말고 계속 진행해")을 받아 진행. M2 Task별 결과는 handoff와 커밋으로만 확인. 사용자 요청 시에만 멈춤.