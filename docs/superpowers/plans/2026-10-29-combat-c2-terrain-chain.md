# C-2 지형·방향·연계 구현 계획

설계: `docs/superpowers/specs/2026-10-28-combat-fun-design.md` §4.1·4.3·4.9(6) · 단계 C-2. 규칙 변경 단계이므로 core는 TDD, 난수 없음(결정적).

## 범위(이번 단계) / 제외
- 한다: ① 방향 보정(정면 1.0 / 측면 1.25 / 배후 1.5) ② 지형 방어 보정(`content/combat.yaml`의 타일 글자별 방어 +N, 최소 피해 1) ③ **연계 추가타**(아군이 적을 치면 그 적의 4방 인접 칸에 있는 다른 아군이 즉시 약한 추가타; 적 쪽 연계는 `enemyChain` 설정, 기본 꺼짐 — 난이도는 C-5에서) ④ 미리보기에 방향·지형·연계 반영 ⑤ 연계 연출(연속 타격 + "N연계" 숫자·음정 상승) ⑥ 9×9 연습장 전투로 위치 차이 증명.
- 제외(뒤 단계): 병과·스킬·기세(C-3), 마음 게이지·목표(C-4), 적 AI 성격(C-5), 밀치기 확장.

## 규칙(정수, 난수 없음)
- 방향: 대상이 바라보는 방향 `facing`(없으면 정면 취급 = 보정 없음). 공격자가 대상의 정면 칸에서 치면 ×1.0, 옆 칸이면 ×1.25, 등 뒤 칸이면 ×1.5. 대각선 위치는 4방 인접이 아니므로 없다.
- 바라보는 방향 갱신: 시작 때 아군은 가장 가까운 적 쪽, 적은 가장 가까운 아군 쪽. 이동하면 마지막 걸음 방향, 공격하면 대상 쪽, 적 단계 이동·공격도 같다.
- 피해 = max(1, round(공격력 × 방향 배율) − 지형 방어(대상 칸)) → 방어 자세면 ceil(/2). (방향·지형이 없으면 기존 `damage`와 같다.)
- 연계: 주 타격으로 대상이 살아 있으면, units 순서로 (공격자가 아닌, 살아 있는, 같은 편, 대상과 4방 인접) 유닛마다 추가타 1회, 피해 = max(1, round(그 유닛의 정상 피해 × `chain.ratio`)). 대상이 쓰러지면 거기서 멈춘다. 각 추가타는 `combatHit`(chain 번호 포함)로 낸다.

## Task 목록
1. **content/combat.yaml + 타입·읽기·검증**: `GameContent.combat?: { direction:{front,side,back}, chain:{ratio,enemies}, terrain: Record<glyph,{defense}> }`(없으면 기본값). 컴파일러가 읽고, terrain 글자가 tiles에 없으면 오류. 테스트: 읽기·기본값·잘못된 글자.
2. **`core/combat/rules.ts`**(순수): `facingToward`, `relativeSide(target, attackerPos)`, `terrainDefense`, `attackDamage`, `chainTargets`. 테스트 먼저.
3. **`CombatUnit.facing?`**: 시작·이동·공격·적 단계에서 갱신(`grid.ts`). 저장 호환: 필드 없으면 undefined. 테스트.
4. **`grid.ts` 공격에 적용**: attack이 `attackDamage` + 연계 추가타(이벤트 순서: 주타 → 추가타…). 적 단계는 `attackDamage`(방향·지형 적용), 연계는 `enemies` 설정일 때만. 기존 테스트가 그대로 통과해야 한다(보정 없는 기본 조건).
5. **`preview.ts`**: `previewHit`이 방향·지형·연계를 반영해 `{amount, defeated, chain: number, chainAmount}`를 돌려 준다. 오버레이는 "-N"과 연계 수 표시.
6. **연출**: `combatHit.chain?`을 받아 fx가 "N연계" 글자를 띄우고 음정 인덱스를 이어 가며, 마지막 추가타는 흔들림을 조금 키운다. 단위 테스트(fx 시간표).
7. **콘텐츠**: `content/combat.yaml`(`h` 키 큰 풀 방어 +1, 방향 1/1.25/1.5, 연계 비율 0.5, enemies:false). 연습장 `enc.arena.mixed`를 9×9로 키우고 큰 풀·나무를 배치. 시나리오 테스트: 같은 조우에서 등 뒤를 치면 정면보다 피해가 크고, 연계로 한 번에 처치되는 경우가 나온다.
8. **게이트·E2E·캡처·문서**: 단위·typecheck·check:content·build·audit:dist, 연습장 E2E(연계 연출 프레임 스트립을 직접 확인), `docs/status.md`·`handoff.md`, push.

## 완료 기준
"같은 조우에서 위치에 따라 결과가 달라진다"를 시나리오 테스트가 증명하고, 연계 연출을 프레임 스트립으로 직접 확인한다. 🧑 판정: 연계가 쾌감을 주는가.
