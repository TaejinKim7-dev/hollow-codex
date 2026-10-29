# 전투 병과(C-3c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유닛마다 병과(이동력·공격 사거리·받는 피해)가 달라, 배치와 편성이 전투의 선택이 되게 한다.

**Architecture:** 병과는 `content/classes.yaml`의 수치표이고, `CombatUnit.class?`(없으면 `fighter`)로 전투 상태에 실린다. 이동 한도(`MAX_STEPS` 상수)와 "바로 옆만 공격"이라는 가정을 `unitMove`·`shotTargets` 두 함수로 바꿔 이동·공격·미리보기·적 AI가 모두 같은 함수를 쓴다. 밀기·설득·책략은 그대로 인접만.

**Tech Stack:** TypeScript, Vitest, YAML 콘텐츠, canvas 오버레이.

**Spec:** `docs/superpowers/specs/2026-10-28-combat-fun-design.md`(C-3 병과), 앞 계획 `2026-10-29-combat-c2-terrain-chain.md`, `2026-10-29-combat-c5-ai-encounters.md`(AI·자동 대전).

## Global Constraints
- 저장 호환: `CombatUnit.class`는 optional. 없으면 `fighter`(이동 3, 사거리 1, 방어 0) = 지금 동작과 같다. 기존 시나리오 계획(`tests/scenario/plans.ts`)과 이야기 조우는 바뀌면 안 된다(병과를 배정하지 않는다).
- `src/core/**`는 순수(`purity.test.ts`). `exactOptionalPropertyTypes` 켜짐 — 선택 필드에 `undefined`를 넣지 말 것.
- 문자열은 ko·en 둘 다(`content/strings/{ko,en}.yaml`), 화면에 `⟦키⟧`가 없어야 한다(`real-content-labels.test.ts`).
- 원작 이름·문장·데이터 금지. 수치는 `content/classes.yaml`에만 둔다(코드에 숫자 하드코딩 금지).
- 완료 게이트: `npm run test:unit`, `npm run typecheck`, `npm run check:content`, `npm run build`, `npm run audit:dist`. 화면 변경은 캡처를 열어 확인.

## 병과 값 (기준안)
| id | 이름 | move | range(min–max) | takenDefense | 성격 |
|---|---|---|---|---|---|
| fighter | 전사 | 3 | 1–1 | 0 | 기본(변화 없음) |
| runner | 척후 | 4 | 1–1 | 0 | 빠르게 옆·등으로 돌아 들어간다 |
| archer | 궁수 | 2 | 2–3 | 0 | 직선(상하좌우) 위 거리 2~3의 첫 유닛만 맞힌다. 바로 옆은 못 친다 |
| guardian | 방패병 | 2 | 1–1 | 1 | 받는 피해 −1(최소 1) |

사거리 규칙: 공격 방향 `dir`로 한 줄을 훑어 **처음 만나는 살아 있는 유닛**이 사거리 안의 적이면 대상, 아군이거나 사거리 밖이면 대상 없음(오사 없음, 장애물 타일은 막지 않는다).

## Review Focus
- 궁수가 바로 옆 적을 못 치는데 아무 안내가 없어 막히는 상황 → 오버레이·HUD에 사거리 칸을 보인다(Task 5).
- 줄 중간에 아군이 서 있으면 쏘지 못한다(오사 금지) → Task 3 테스트.
- 격자 가장자리·줄 끝에서 범위 밖 좌표를 조회해도 던지지 않는다 → Task 3.
- 병과 없는 옛 저장(`class` 없음)이 `fighter`로 불러와진다 → Task 1.
- 적 궁수가 사거리 안에 아무도 없을 때 제자리에서 굳지 않고 접근한다 → Task 4.
- 호위 대상이 아닌 적이 아군 시야 밖에서 쏘는 칸을 예고(intent)와 실제 공격이 다르게 계산하지 않는다 → Task 4.

---

### Task 1: 병과 표와 유닛 필드
**Files:**
- Create: `content/classes.yaml`
- Modify: `src/content/types.ts`, `src/content/compile.ts`, `src/core/types.ts`, `src/core/combat/rules.ts`
- Test: `tests/unit/content/combat-yaml.test.ts`(병과 표 읽기), `tests/unit/core/combat-rules.test.ts`

**Interfaces:**
- Produces: `UnitClass = { move: number; rangeMin: number; rangeMax: number; takenDefense: number }`, `GameContent.classes: Record<Id, UnitClass>`(항상 `fighter` 포함), `DEFAULT_UNIT_CLASS`(fighter 값), `CombatUnit.class?: Id`, `CreatureDef.class?: Id`, `CompanionDef.class?: Id`, `classOf(content, unit): UnitClass`와 `unitMove(content, unit): number`(rules.ts).

- [ ] **Step 1: 실패하는 테스트** — `combat-yaml.test.ts`: 실제 콘텐츠의 `classes.archer`가 `{move:2, rangeMin:2, rangeMax:3, takenDefense:0}`. `combat-rules.test.ts`: `classOf(content, {…class 없음})`이 fighter 값, 모르는 class id도 fighter, `unitMove(content, {class:"runner"})===4`.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/unit/content/combat-yaml.test.ts tests/unit/core/combat-rules.test.ts` → FAIL
- [ ] **Step 3: 구현** — `content/classes.yaml`에 위 표(키 `move/range:[min,max]/takenDefense`), `compile.ts`에 `readClasses`(범위 `1≤min≤max≤4`, `move 1..6`이 아니면 오류 `classes: <id> ...`), 콘텐츠에 `fighter`가 없으면 기본값 삽입. `CombatUnit`·`CreatureDef`·`CompanionDef`에 optional `class`. `check:content`가 creature/companion의 `class`가 모르는 id이면 실패하게 한다.
- [ ] **Step 4: 통과 확인** — 위 명령 → PASS, `npm run check:content` → 0
- [ ] **Step 5: 커밋** — `feat(combat): class table (move/range/defense) and unit class field`

### Task 2: 병과별 이동력
**Files:**
- Modify: `src/core/combat/intents.ts`(`MAX_STEPS` 사용처), `src/core/combat/grid.ts`(`startCombat`가 `class` 복사, `move` 케이스), `src/core/combat/preview.ts`(`reachableCells`)
- Test: `tests/unit/core/combat.test.ts`, `tests/unit/core/combat-preview.test.ts`

**Interfaces:**
- Consumes: `unitMove(content, unit)`(Task 1)
- Produces: `startCombat`가 동료·적의 `class`(동료 `companion.class`, 적 `creature.class`)를 `CombatUnit.class`에 넣는다(없으면 필드 생략). `MAX_STEPS`는 `DEFAULT_MOVE` 이름으로 남겨 fighter 기준값으로만 쓴다.

- [ ] **Step 1: 실패하는 테스트** — runner 아군은 4칸 거리 칸으로 `move`가 되고 fighter는 4칸이면 `ignored`(상태 동일); `reachableCells(runner)`에 거리 4 칸이 있고 fighter에는 없다; guardian은 3칸 거리가 안 된다.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/unit/core/combat.test.ts tests/unit/core/combat-preview.test.ts` → FAIL
- [ ] **Step 3: 구현** — `move`의 `path.length > MAX_STEPS`와 `reachableCells`·`stepCells`의 상한을 `unitMove(content, unit)`로. `startCombat`가 `class`를 옮긴다(`allyStats`에 `class?` 추가).
- [ ] **Step 4: 통과 확인** — 위 명령 + `npm run test:unit` → 전부 PASS(기존 계획·균형 테스트 무변화)
- [ ] **Step 5: 커밋** — `feat(combat): per-class movement allowance`

### Task 3: 사거리 공격(대상 찾기·미리보기·입력)
**Files:**
- Modify: `src/core/combat/preview.ts`(`attackTargets`), `src/core/combat/grid.ts`(`attack`·`special` 대상 찾기), `src/input/commands.ts`(타일 눌러 공격)
- Test: `tests/unit/core/combat-preview.test.ts`, `tests/unit/core/combat.test.ts`, `tests/unit/input/commands.test.ts`

**Interfaces:**
- Consumes: `classOf`(Task 1)
- Produces: `shotTarget(combat, content, unit, dir): { target: CombatUnit; dist: number } | null` (`rules.ts`) — 위 "사거리 규칙". `attackTargets(combat, content, unitId)`(시그니처에 `content` 추가)가 `{id,pos,dir,dist}[]`를 돌려준다. `GameEvent.combatHit.at`은 그대로(공격자 칸).

- [ ] **Step 1: 실패하는 테스트**
  - `shotTarget`: 궁수(2–3)가 거리 2·3 적은 대상, 거리 1 적은 `null`, 거리 4는 `null`, 거리 2 칸에 아군이 서 있고 그 뒤 거리 3에 적이 있으면 `null`, 줄이 격자 밖으로 나가도 `null`(예외 없음).
  - `combatStep attack`: 궁수가 거리 2 적에게 `attack{dir}` → `combatHit` 이벤트 1개, 피해 = `attackDamage`와 같다, 공격자 위치 불변. 거리 1 적에게는 `ignored`.
  - `attackTargets`가 궁수에게 거리 2 대상을 `dist:2`로 돌려주고 fighter에는 전과 같은 결과.
  - 입력: 궁수가 거리 2 적의 타일을 누르면 `{kind:"attack", dir}`.
- [ ] **Step 2: 실패 확인** — 해당 파일 vitest → FAIL
- [ ] **Step 3: 구현** — `shotTarget`을 `rules.ts`에, `grid.ts`의 `enemyAt(offset(actor.pos, dir))`(attack·special 두 곳)를 `shotTarget`으로 교체(push·persuade·skill은 그대로 인접). 처치 연계 계산은 대상 기준이라 변경 없음.
- [ ] **Step 4: 통과 확인** — `npm run test:unit` → PASS
- [ ] **Step 5: 커밋** — `feat(combat): ranged attack along a line, no friendly fire`

### Task 4: 병과 방어와 적 병과 AI
**Files:**
- Modify: `src/core/combat/rules.ts`(`attackDamage`에 `takenDefense`), `src/core/combat/intents.ts`(`computeIntents`), `src/core/combat/grid.ts`(`enemyPhase` 공격 조건)
- Test: `tests/unit/core/combat-rules.test.ts`, `tests/unit/core/combat-ai.test.ts`

**Interfaces:**
- Consumes: `shotTarget`, `unitMove`, `classOf`
- Produces: `attackDamage`가 방패병 대상에서 `takenDefense`만큼 더 뺀다(최소 1, 지형 방어와 합산 뒤 최소 적용). 예고(`intents[id].attack`)는 "이동 뒤 `shotTarget`으로 맞힐 수 있는 아군"이면 채워지고, `enemyPhase`는 `manhattan===1` 대신 같은 판정(`shotTarget`)으로 쏜다.

- [ ] **Step 1: 실패하는 테스트**
  - 방패병이 맞는 피해 = 같은 조건 fighter가 맞는 피해 −1, 단 최소 1.
  - 적 궁수(class archer)는 아군과 한 줄 거리 2에 설 수 있는 칸으로 이동하는 예고를 낸다. 이미 사거리 안이면 제자리 + attack.
  - 사거리 안에 아무도 없고 줄을 만들 칸도 3칸(궁수 이동 2칸) 안에 없으면 가장 가까운 아군 쪽으로 걷는다(굳지 않음).
  - 아군이 그 줄에서 한 칸 비켜서면 `enemyPhase`가 쏘지 않는다(예고와 실제 판정 일치).
  - 적 runner는 move 4로 가는 경로를 고른다.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/unit/core/combat-rules.test.ts tests/unit/core/combat-ai.test.ts` → FAIL
- [ ] **Step 3: 구현** — 접근 칸 선택은 기존 `approach`를 일반화: 후보 도착 칸마다 "그 칸에서 `shotTarget`이 있는가"를 보고, 있으면 그중 아군에게서 가장 먼 칸(궁수) 또는 가장 짧은 경로(그 외)를 고른다. 성격(`ai`) 로직은 대상 선택에만 쓰이므로 그대로.
- [ ] **Step 4: 통과 확인** — `npm run test:unit` → PASS
- [ ] **Step 5: 커밋** — `feat(combat): guardian defense and class-aware enemy intents`

### Task 5: 화면(사거리 칸·병과 표시·화살 연출)과 문자열
**Files:**
- Modify: `src/render/combat-overlay.ts`, `src/render/canvas.ts`, `src/render/fx.ts`, `src/ui/view-model.ts`, `src/ui/panels.ts`, `content/strings/{ko,en}.yaml`
- Test: `tests/unit/render/fx.test.ts`, `tests/unit/ui/view-model.test.ts`, `tests/unit/ui/real-content-labels.test.ts`
- 캡처: `scripts/visual/arena-phone.mjs` 방식으로 `docs/screenshots/2026-10-29-C3c-*.png`

**Interfaces:**
- Consumes: `attackTargets(...)`의 `dist`, `classOf`
- Produces: 문자열 `class.fighter|runner|archer|guardian`(이름)과 `class.<id>.desc`(한 줄 설명) ko·en; HUD 유닛 줄에 병과 이름; 오버레이는 선택한 유닛의 사거리 칸을 이동 칸과 다른 색 블록으로 칠한다(노란 선 금지 — 블록); fx는 `dist>1`이면 공격자가 앞으로 나가지 않고 화살 한 개가 `410ms/speed` 동안 날아간다.

- [ ] **Step 1: 실패하는 테스트** — fx: `dist 2` 공격 타임라인에서 공격자의 이동량이 0이고 투사체 위치가 시작→끝으로 보간된다. view-model: 병과 있는 유닛의 HUD 줄에 병과 이름. `real-content-labels`가 모든 병과 문자열(ko·en)을 검사.
- [ ] **Step 2: 실패 확인** — 해당 vitest → FAIL
- [ ] **Step 3: 구현** — 위 Produces대로. 사거리 칸은 `attackTargets`가 아니라 "유닛이 쏠 수 있는 모든 칸"(`shotCells(combat, content, unitId): Pos[]`, preview.ts 신설)을 쓴다.
- [ ] **Step 4: 통과 확인 + 화면 확인** — `npm run test:unit`; 아래 Task 6 조우로 캡처해 열어서 확인(사거리 블록·화살·HUD 병과).
- [ ] **Step 5: 커밋** — `feat(combat): range blocks, class labels and arrow fx`

### Task 6: 병과 배정과 연습장 조우, 자동 대전 표
**Files:**
- Modify: `content/creatures.yaml`(새 적 `creature.arena-archer`·`creature.arena-guard`), `content/towns/kalas/npcs.yaml`(훈련 교관 `class: guardian`), `content/towns/kalas/encounters.yaml`(연습장 조우 2개: `class` 섞인 7×7·궁수 둘), `scripts/sim/combat-sim.ts`
- Test: `tests/unit/core/combat-balance.test.ts`, `tests/e2e/arena-classes.spec.ts`, `tests/scenario/companions.test.ts`

**Interfaces:**
- Consumes: Task 1~5 전부
- Produces: 연습장에서 병과 전투를 해 볼 수 있는 조우 2개, 자동 대전 표에 병과 열.

- [ ] **Step 1: 실패하는 테스트** — 균형 테스트에 "연습장 궁수 조우: 자동 대전 승률이 20%~80%"(기존 균형 테스트 형식), 동료 시나리오는 그대로 통과. E2E: 연습장에서 궁수 조우 시작 → 아군이 거리 2 적을 눌러 공격 → 적 hp 감소(화면 상태로 확인).
- [ ] **Step 2: 실패 확인** — 해당 테스트 → FAIL
- [ ] **Step 3: 구현** — 위 콘텐츠 추가(적 hp·attack은 기존 늑대·강도 수준, 병과는 `class:`로만 구분). 이야기 조우와 시나리오 계획은 건드리지 않는다.
- [ ] **Step 4: 통과 확인** — 전체 게이트 5개 → 0, E2E 5+1 PASS
- [ ] **Step 5: 화면 확인 후 커밋** — 캡처 열어 확인, `feat(content): arena class encounters and balance row`

### Task 7: 문서 마무리
**Files:** `docs/status.md`(60줄 유지), `docs/handoff.md`(절 추가), `docs/progress-2026-10-29.md`(전투 진행률·TODO 갱신), `README.md`(한계)
- [ ] 위 4개 갱신 → `git diff --check` 0 → 커밋 `docs: classes (C-3c) done` → `git push origin HEAD:main`, `git ls-remote`로 확인.

## Self-review
- 요구 포괄: 이동(T2)·사거리(T3)·방어(T4)·AI(T4)·화면(T5)·콘텐츠(T6) 모두 과제가 있다. 호위·증원 목표와 이야기 조우 재배치는 다음 계획(범위 밖).
- 이름 일치: `unitMove`, `classOf`, `shotTarget`, `shotCells`, `attackTargets(combat, content, unitId)` 모두 T1·T3·T5에서 같은 시그니처.
- 비율: 계획은 병과 하나의 변경 범위에 맞는 크기.
