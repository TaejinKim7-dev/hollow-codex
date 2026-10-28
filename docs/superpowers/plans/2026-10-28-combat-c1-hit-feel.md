# 전투 C-1 타격감 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) 또는 subagent-driven-development. 체크박스(`- [ ]`)로 진행을 추적한다.

**Goal:** 규칙은 바꾸지 않고, 공격이 맞는 순간의 손맛(연출·소리)과 조작(범위 표시, 피해 미리보기, 타일 눌러 공격)을 만든다.

**Architecture:** core는 결과만 계산하고 `combatHit`·`combatYield` 이벤트를 **추가로** 내보낸다(상태 규칙 불변). 연출은 렌더 쪽 순수 모듈 `fx.ts`(주입 시계, 단위 테스트 가능)가 이벤트를 시간표로 바꾸고, `canvas.ts`가 그 프레임을 그린다. 소리는 `fx`가 내는 큐(cue)를 `main.ts`가 엔진으로 재생한다.

**Tech Stack:** TypeScript, Vitest, Canvas 2D, 기존 Web Audio 엔진(`audio/engine.ts`).

**Spec:** `docs/superpowers/specs/2026-10-28-combat-fun-design.md` §4.9 (이 계획은 §5의 C-1만 다룬다).

## Global Constraints
- `src/core/**` 변경은 **이벤트 추가와 순수 조회 함수 추가**만. 기존 상태 전이·피해 계산·테스트 기대값은 바꾸지 않는다(기존 테스트는 그대로 통과).
- 난수 금지(파티클 방향도 인덱스에서 결정적으로 계산). 렌더 모듈도 `Math.random` 금지.
- 연출 길이: 공격 1회 ≈ 410 ms(예비 100 → 돌진 80 → 히트스톱 70 → 복귀·여운 160). 빠른 모드는 이번 범위 밖(C-6). 연출 중 입력은 대기하지 않고 **상태는 즉시 갱신**, 화면만 따라가며, 연출이 끝나기 전에 다음 명령이 오면 시간표에 이어 붙는다.
- 모든 상대 import는 `.ts`, 타입 import는 `import type`. 한국어 문자열은 `ko.yaml`/`en.yaml` 키(두 파일 키 집합 동일).
- 게이트: `npm run test:unit`, `npm run typecheck`, `npm run check:content`, `npm run build`, `npm run audit:dist`, `git diff --cached --check`. e2e 금지. 화면은 캡처를 **직접 열어** 확인.
- 브랜치 확인 후 `git push origin HEAD:main`, `git ls-remote`로 확인. 커밋 끝에 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus
- 연출 중 같은 전투가 끝나거나(승리·패배·도주) 지도로 돌아가도 화면이 멈추거나 이전 유닛 잔상이 남지 않는다 → Task 4·5.
- 연출 시간표가 길어져도(적 3마리 연속) 입력이 막히거나 시간이 뒤로 가지 않는다 → Task 4.
- 죽은 유닛의 스프라이트 잔상(ghost)이 전투 종료 뒤 남지 않는다 → Task 4.
- 터치·키보드 조작: 인접한 적을 눌러 공격할 수 있고, 조준(aim) 중에는 기존 조준 동작이 우선한다 → Task 3.
- 소리가 연출보다 먼저/늦게 나오지 않는다(충돌 시점에 맞는다) → Task 4·6.

## 파일 구조
| 파일 | 책임 |
|---|---|
| `src/core/types.ts` (수정) | `GameEvent`에 `combatHit`, `combatYield` 추가 |
| `src/core/combat/grid.ts` (수정) | 피해·퇴각·굴복 지점에서 이벤트 추가 |
| `src/core/combat/preview.ts` (새) | `reachableCells`, `attackTargets`, `previewHit` (순수 조회) |
| `src/input/commands.ts` (수정) | 전투 탭: 인접 적이면 공격 |
| `src/render/fx.ts` (새) | 이벤트 → 연출 시간표, `sample(now)`, `takeCues(now)` |
| `src/render/canvas.ts` (수정) | 오프셋·점멸·흔들림·체력 막대·숫자·슬래시·잔상·범위 표시·미리보기 그리기 |
| `src/main.ts` (수정) | 이벤트→fx, 매 프레임 sample·cue 재생, 호버 미리보기 |
| `src/audio/hit-sound.ts` (새) | `hitRate(amount, index)`: 피해·연타에 따른 음정 |
| `scripts/visual/combat-demo.mjs` (새) | 공격 연출 프레임 캡처 |

---

### Task 1: 전투 이벤트 `combatHit` / `combatYield`
**Files:** Modify `src/core/types.ts`, `src/core/combat/grid.ts`; Test `tests/unit/core/combat-events.test.ts`
**Interfaces — Produces:**
`{ type: "combatHit"; attacker: Id; target: Id; amount: number; defeated: boolean; hp: number }`(피해 후 남은 hp),
`{ type: "combatYield"; target: Id; how: "persuaded" | "retreated" }`.
- [ ] Step 1 실패 테스트: 플레이어가 인접 슬라임을 공격하면 `combatHit{attacker:"player", target:"creature.slime#0", amount:3, defeated:false, hp:1}`가 이벤트에 있고(기존 `sfx hit`도 그대로), 처치하면 `defeated:true`. 적 단계에서 적이 아군을 치면 `attacker`=적 id로 `combatHit`이 순서대로. 방어 중인 대상은 `amount`가 절반(올림). 밀치기로 격자 밖으로 나가면 `combatYield{how:"retreated"}`, 성공한 설득은 `{how:"persuaded"}`. 밀어서 막힌 곳에 부딪혀 피해 1이면 `combatHit{amount:1}`.
- [ ] Step 2 `npx vitest run tests/unit/core/combat-events.test.ts` → FAIL.
- [ ] Step 3 구현: `harm()`와 `enemyPhase()`의 피해 지점에서 이벤트를 추가(attacker id를 `harm`에 인자로 전달), `push`의 퇴각, `persuade` 성공 지점. 기존 이벤트 순서는 유지하고 `combatHit`을 `sfx` 앞에 둔다.
- [ ] Step 4 PASS + `npm run test:unit`(기존 combat 테스트 전부 통과) + typecheck.
- [ ] Step 5 커밋 `feat(core): combatHit/combatYield events`.

### Task 2: 범위·미리보기 (순수 조회)
**Files:** Create `src/core/combat/preview.ts`; Modify `src/core/combat/grid.ts`(`damage` export); Test `tests/unit/core/combat-preview.test.ts`
**Interfaces — Produces:**
`reachableCells(combat: CombatState, content: GameContent, unitId: Id): Pos[]`(이동 ≤ `MAX_STEPS`, 막힌 칸·유닛 제외, 이미 이동했으면 `[]`);
`attackTargets(combat: CombatState, unitId: Id): { id: Id; pos: Pos; dir: Dir }[]`(인접한 살아 있는 적);
`previewHit(combat: CombatState, attackerId: Id, targetId: Id): { amount: number; defeated: boolean }`.
- [ ] Step 1 실패 테스트(기존 `combat.test.ts` 헬퍼와 같은 격자): 이동 가능 칸이 3칸 이내 경로만 포함하고 점유·벽을 제외, `moved:true`면 빈 배열. 인접 적만 `attackTargets`에 방향과 함께. `previewHit`가 방어 중이면 절반(올림), 남은 hp ≤ 0이면 `defeated:true`.
- [ ] Step 2 FAIL → Step 3 구현(`findPathOnGrid` 재사용) → Step 4 PASS → Step 5 커밋 `feat(core): combat range and hit preview queries`.

### Task 3: 타일을 눌러 공격
**Files:** Modify `src/input/commands.ts`; Test `tests/unit/input/commands.test.ts`
- [ ] Step 1 실패 테스트: 전투 중 활성 아군 바로 옆 칸의 적을 누르면 `{type:"combat", action:{kind:"attack", dir}}`, 인접하지 않은 적이나 빈 칸은 기존대로 `move`, 활성 유닛이 이미 행동했으면 `null`.
- [ ] Step 2 FAIL → Step 3 구현(`attackTargets` 사용) → Step 4 PASS(기존 `combat-tap` 통합 테스트 포함 전체) → Step 5 커밋.

### Task 4: 연출 시간표 `fx.ts` (순수, 주입 시계)
**Files:** Create `src/render/fx.ts`; Test `tests/unit/render/fx.test.ts`
**Interfaces — Produces:**
```ts
export interface UnitFx { dx: number; dy: number; flash: number; alpha: number }   // dx,dy: 칸 단위
export interface FxFrame {
  shake: { x: number; y: number }                        // 원본 픽셀(32px 칸 기준) 단위
  units: Readonly<Record<Id, UnitFx>>
  hp: Readonly<Record<Id, { shown: number; trail: number; max: number }>>
  floats: readonly { x: number; y: number; text: string; kind: "normal" | "defeat" | "heal"; age: number }[]   // x,y 칸 좌표, age 0..1
  slashes: readonly { x: number; y: number; dir: Dir; age: number }[]
  sparks: readonly { x: number; y: number; age: number }[]
  ghosts: readonly { unit: CombatUnit; alpha: number }[]  // 이미 사라진 유닛의 페이드 아웃
  banner: { text: "ally" | "enemy"; alpha: number } | null
}
export interface HitCue { at: number; amount: number; index: number; defeated: boolean }
export interface Fx {
  reset(units: readonly CombatUnit[]): void
  enqueue(events: readonly GameEvent[], before: readonly CombatUnit[], after: readonly CombatUnit[], now: number): void
  sample(now: number): FxFrame
  takeCues(now: number): HitCue[]          // 충돌 시각이 지난 큐만, 한 번씩
  busy(now: number): boolean
  clear(): void                            // 전투 종료·지도 이동 때
}
export function createFx(): Fx
```
시간표(공격 1회, 시작 s): 예비 [s, s+100) 공격자가 대상 반대로 0.12칸 → 돌진 [s+100, s+180) 대상 쪽으로 0.42칸 → **충돌 s+180**: 대상 flash 1→0(120ms), 넉백 0.22칸(공격 방향)이 150ms에 0으로, shake 진폭 `min(6, 2 + amount*1.5)`가 180ms에 0으로, 숫자·슬래시·스파크 6개(방향은 인덱스로 결정) 생성, hp.shown이 250ms에 걸쳐 감소(trail은 400ms) → 히트스톱 [s+180, s+250) 공격자 위치 고정 → 복귀 [s+250, s+330) → 다음 공격 시작은 s+410. 처치는 충돌 +100ms부터 300ms 동안 ghost alpha 1→0. 이동(위치가 바뀐 유닛)은 160ms 트윈이 공격보다 먼저, 동시에 시작.
- [ ] Step 1 실패 테스트(시계 주입): ① 이벤트 없으면 `sample`이 전부 0/빈 값이고 `busy`는 false. ② 공격 1회 enqueue(now=1000) 후 `sample(1190)`에서 대상 `flash≈1`, `shake.x²+shake.y²>0`; `sample(1000+180)`에서 attacker `dx`가 대상 방향으로 +, `sample(1600)`은 전부 0이고 `busy` false. ③ 연속 2회 enqueue는 두 번째 충돌이 첫 충돌보다 410ms 뒤. ④ `takeCues(1000)`은 []이고 `takeCues(1181)`이 첫 큐를 한 번만 돌려주며(두 번째 호출은 []), `index`가 0,1,… 순서. ⑤ 처치: `sample(1000+180+100+150)`에서 `ghosts`에 해당 유닛 alpha 0.4~0.6, `sample(2000)`에서 ghosts 빈 배열. ⑥ `hp.shown`이 충돌 후 250ms에 걸쳐 before→after로 줄고 `trail`은 더 늦게 따라온다. ⑦ 이동 트윈: before/after 위치가 다르면 `units[id].dx/dy`가 시작 시 (before−after)이고 160ms 뒤 0. ⑧ `clear()` 후엔 모든 값이 비고 `takeCues`도 []. ⑨ 같은 입력이면 같은 출력(난수 없음).
- [ ] Step 2 FAIL → Step 3 구현(이벤트 목록 큐 + 구간 함수들, `Math.random` 금지) → Step 4 PASS → Step 5 커밋.

### Task 5: 그리기·조작 연결
**Files:** Modify `src/render/canvas.ts`, `src/main.ts`, `src/ui/panels.ts`(필요 시), `content/strings/{ko,en}.yaml`; Test(순수 부분만) `tests/unit/render/combat-overlay.test.ts`
- 순수 함수 `overlayFor(state, content, hover: Pos | null): { reachable: Pos[]; targets: {pos:Pos; amount:number; defeated:boolean}[] }`(활성 아군이 행동 가능할 때만; 호버한 적에게 `previewHit`)를 `src/render/combat-overlay.ts`에 만들고 테스트(행동 불가·적 차례엔 빈 값, 호버한 인접 적 미리보기 값).
- [ ] Step 1 `combat-overlay` 실패 테스트 → Step 2 FAIL → Step 3 구현 → PASS.
- [ ] Step 4 `drawCombat` 변경: 유닛 그리기 위치에 `fx.units[id].dx/dy`, 점멸(흰색 합성), 체력 막대(`fx.hp` shown/trail, 초록→노랑→빨강, 칸 위 4px), 피해 숫자(`floats`, 위로 떠오르며 투명해짐, 처치는 큰 글씨), 슬래시 호·스파크, ghost 유닛, 라운드 배너, 화면 흔들림(`ctx.translate(shake*scale)`), 이동 가능 칸 하이라이트(옅은 파랑)와 공격 가능한 적 테두리(빨강)와 미리보기 말풍선("-3" / "처치"). 진행 중 `fx.busy`면 매 프레임 다시 그림.
- [ ] Step 5 `main.ts`: 전투 시작 시 `fx.reset`, 명령 처리 전후 유닛 스냅샷으로 `fx.enqueue`, 매 프레임 `fx.takeCues`로 소리, `pointermove`로 호버 칸 갱신(전투 중만), 전투 종료·`mapChanged` 때 `fx.clear()`. 기존 `sfx hit` 즉시 재생은 전투 중 무시(충돌 시점 큐가 대신 재생).
- [ ] Step 6 게이트(test/typecheck/check:content/build) → 커밋.

### Task 6: 타격 소리 층
**Files:** Create `src/audio/hit-sound.ts`; Modify `src/main.ts`; Test `tests/unit/audio/hit-sound.test.ts`
**Interfaces — Produces:** `hitRate(amount: number, index: number, defeated: boolean): number`(피해가 클수록 낮은 음정 0.85–1.0, 같은 연속 안에서 index마다 +0.06, 처치는 -0.05, 0.7–1.4로 clamp).
- [ ] Step 1 실패 테스트(값 3개 이상 + clamp) → FAIL → 구현 → PASS → `main.ts`가 큐마다 `engine.sfx(resolveSfx(audio,"hit"), hitRate(...))` 재생, 처치면 `push` 소리를 낮게 겹침 → 커밋.

### Task 7: 화면 확인과 마무리
- [ ] Step 1 `scripts/visual/combat-demo.mjs`: 들판 늑대 전투를 열고(`?debug=1`) 아군이 늑대를 치는 순간을 40ms 간격 프레임으로 캡처해 한 장의 스트립 PNG로 합친다. **직접 열어** 예비동작·돌진·충돌 점멸·숫자·체력 막대가 보이는지 확인하고 어색하면 수치를 조정한다.
- [ ] Step 2 큰 화면(2000×1214)과 작은 화면(390×844)에서 전투 캡처(하이라이트·막대가 겹치지 않는지).
- [ ] Step 3 문서: `docs/handoff.md` 끝에 절, `docs/status.md` 갱신(C-1 완료/판정 대기), 스펙에 구현 중 바뀐 점 정정.
- [ ] Step 4 전체 게이트 + 푸시.

## Self-Review
- 스펙 §4.9의 1~8번: 예비·돌진·충돌(히트스톱·점멸·흔들림·넉백·숫자·스파크)·처치 연출·소리 층·하이라이트·미리보기·턴 배너를 Task 4·5·6이 덮는다. 연계 콤보 표시와 필살기는 C-2·C-3. 빠른 모드·건너뛰기는 C-6(이번엔 연출이 410ms로 짧아 생략).
- 타입 일관성: `combatHit.hp`(Task 1) → `fx` 체력 막대(Task 4), `HitCue.index`(Task 4) → `hitRate`(Task 6), `attackTargets`(Task 2) → 탭 공격(Task 3)·오버레이(Task 5).
