# C-5 적 성격(AI)과 조우 재배치 계획

설계: `docs/superpowers/specs/2026-10-28-combat-fun-design.md` §4.8·§4.7, 데이터: `docs/research/combat-difficulty-2026-10-29.md`(자동 대전 표).

## 문제
마을 조우(적 1명)가 1~3라운드에 거의 손해 없이 끝난다. 적 AI는 "가장 가까운 아군에게 붙어서 친다" 하나뿐이라, 위치·방향·연계·마음을 써도 적이 달라지지 않는다.

## 범위
1. **성격 필드** `creature.ai`: `aggressive`(기본: 가장 가까운 아군) · `cautious`(마음이 절반 이하면 물러나 거리 유지) · `skirmisher`(공격 후 제자리 대신 가장 약한 아군을 노림) · `pack`(같은 편이 이미 인접한 아군을 우선 — 적 연계 유도) · `coward`(마음 0이면 퇴각이 아니라 도주, 이미 구현된 악한 적 퇴각과 구분). 구현은 `computeIntents`의 대상 선택·이동 선택에 한정(예고 화살표/블록과 같은 결과를 내므로 예측 가능한 퍼즐 유지).
2. **조우 재배치**: 이야기 조우 7곳에 보조 적 1~2명과 지형(큰 풀·나무)을 더한다. 기준: 자동 대전에서 동료 없이 플레이어가 이길 때 남는 hp가 40~70%, 라운드 3~6. 기존 시나리오 수순(`WOLF_PUSH_WIN` 등)이 깨지지 않게 칼라스 들판·서고는 건드리지 않고, 마을 조우부터 바꾼다.
3. **적 연계 켜기**: `combat.yaml chain.enemies: true`를 켜고 같은 표로 다시 잰다.
4. **검증**: `node scripts/sim/combat-sim.ts`를 `tests/unit/core/combat-balance.test.ts`로 감싸 "모든 조우는 (플레이어 단독이든 동료와든) 졸업 가능(무한 대치 없음)·라운드 상한 12 이하"를 막는다.

## Task
1. `creature.ai` 읽기·타입(+기본값) — 테스트: 읽기·잘못된 값.
2. `intents.ts` 성격별 대상·이동 선택 — 테스트: 같은 배치에서 성격마다 다른 예고.
3. 조우 재배치(`content/towns/*/encounters.yaml`) + 새 크리처 필요 시 `creatures.yaml` — 자동 대전 표로 곡선 조정.
4. 균형 테스트와 문서(`combat-difficulty-*.md` 갱신).
5. 화면 확인(연습장·마을 조우) 프레임 스트립, 게이트, push.

## 진행(2026-10-29)
- 완료: Task 1(`creature.ai` 읽기), Task 2(`intents.ts` 성격 5종: aggressive·skirmisher·pack·cautious·coward — `tests/unit/core/combat-ai.test.ts`), 크리처에 성격 배정(늑대 pack, 도적 skirmisher, 거지·조문객·고행자·침묵자 cautious, 자랑꾼 skirmisher, 가짜 스님 coward).
- 보류(결정): **이야기 조우(마을 7곳)는 일부러 짧게 둔다.** 시나리오 테스트가 고정 수순(`WOLF_PUSH_WIN`·미덕 마을 수순)에 묶여 있고, 이 전투의 목적은 "죽이지 않을 선택"을 하는 이야기 장면이다. 난이도는 연습장·후속 선택 콘텐츠(탑·시련)에서 올린다. 마을 조우를 키우려면 해당 시나리오 수순을 먼저 다시 풀어야 한다.
- 남음: 균형 테스트(Task 4)는 자동 대전 표를 벽으로 쓰는 단위 테스트로 아래에 추가.
