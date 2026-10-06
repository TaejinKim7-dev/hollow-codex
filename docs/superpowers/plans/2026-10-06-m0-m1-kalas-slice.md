# 빈 경전 M0 골격 + M1 칼라스 수직 슬라이스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빈 저장소에서 출발해, 정직의 마을 칼라스 하나를 PC·모바일 웹에서 처음부터 끝까지(약 45분) 플레이할 수 있는 수직 슬라이스를 GitHub Pages에 배포한다.

**Architecture:** 순수 TypeScript 규칙 코어(`src/core`, DOM 금지)가 `step(state, command, content) → { state, events }`로 상태를 바꾸고, Canvas2D 렌더러·DOM UI·Web Audio 칩 합성기가 그 결과를 그린다. 콘텐츠는 `content/` YAML(지도는 ASCII 격자)로 쓰고, Vite 플러그인이 빌드 때 검사·컴파일해 가상 모듈 `virtual:content`로 넘긴다.

**Tech Stack:** Node 22.23(TS 타입 제거 실행), TypeScript 5.8, Vite 6.3, Vitest 3.1, Playwright 1.52(e2e 최소), `yaml` 2.x(ISC, 빌드 때만), Canvas2D, Web Audio, IndexedDB.

**Spec:** `docs/superpowers/specs/2026-10-06-hollow-codex-design.md`

## Global Constraints

- 원작 금지 목록(spec §2.2)의 어떤 이름·문장도 `content/`, `src/`, 문자열 표에 넣지 않는다. 검사기가 빌드를 실패시킨다(spec §2.3).
- `u4-alt-manual.pdf`, `origin.txt`, 원본 Ultima IV 데이터, `ultima` 저장소의 번역문은 이 저장소에 절대 들어오지 않는다.
- 외부 자산은 CC0 / CC-BY / CC-BY-SA / OFL만. NC·ND·출처 불명 금지. 모든 파일은 `assets/LEDGER.md`에 기록(spec §5, §6, §9).
- 코드 MIT(`LICENSE`), 콘텐츠·자체 자산 CC BY-SA 4.0(`LICENSE-CONTENT`).
- `src/core/**`는 `document`, `window`, `HTMLElement`, `CanvasRenderingContext2D`, `AudioContext`를 참조하지 않는다. 난수는 `state.rng`의 시드로만(spec §7.2).
- Pages base 경로: `/hollow-codex/`. 배포 URL: `https://taejinkim7-dev.github.io/hollow-codex/`.
- 한국어 우선: 화면 문자열은 전부 `content/strings/ko.yaml`의 키로 꺼낸다. 코드에 한국어 화면 문구를 하드코딩하지 않는다(테스트·주석 제외).
- 타일 16×16, 정수 배율. 화면 시야 15×11 타일.
- 작업 규칙(`AGENTS.md`): TDD(RED 먼저), 테스트·게이트는 Haiku 서브에이전트가 실행, 단계마다 진행→저장(커밋)→기록→확인. 수정 뒤 e2e는 돌리지 않고 사용자가 직접 화면 확인.
- merge 게이트(모두 exit 0): `npm ci`, `npm run test:unit`, `npm run typecheck`, `npm run check:content`, `npm run build`, `npm run audit:dist`, `git diff --check`.

## 스펙과 다르게 정한 점 (사용자 확인 필요)

1. **지도 형식**: spec §7.1은 Tiled JSON이지만, M1은 **YAML 안의 ASCII 격자**로 쓴다. 에이전트가 직접 쓰고 diff로 검토할 수 있기 때문이다. Tiled 가져오기는 M2에서 대륙 지도를 만들 때 필요하면 추가한다.
2. **음악 형식**: spec §6.2는 MIDI이지만, M1의 두 곡은 우리가 직접 편곡하므로 **텍스트 악보(YAML)**로 쓴다. 외부 CC0 MIDI를 쓰게 되는 시점에 MIDI → 같은 내부 형식 변환기를 추가한다. 합성기·음색 통일이라는 목적은 그대로다.
3. **Google Drive 동기화 이식**: spec §10은 M0에 `src/cloud/*`를 가져온다고 했지만, M1 완료 기준에 Drive가 없고 새 OAuth 클라이언트 ID도 필요하므로 **M2 이후로 미룬다**. M1은 로컬 슬롯만.
4. **낮·밤 일과**: spec §4.7은 M2 범위다. M1의 NPC는 고정 위치.

## Review Focus

1. 추론 칸에 같은 단어를 여러 칸에 넣는 경우 — 정답과 다르면 확정되지 않아야 하고, 정답 단어가 같은 칸에 중복 지정되어도 오류 없이 처리(Task 6 테스트 `same word in two slots never confirms unless the answer says so`).
2. 저장 파일이 손상되었거나 미래 버전인 경우 — 불러오기가 예외로 죽지 않고 `{ ok: false, reason }`을 돌려주며 현재 게임은 유지(Task 11 테스트 `corrupt and future saves are rejected without throwing`).
3. 전투 중 저장·새로고침 — 전투 상태도 직렬화되어 같은 차례로 돌아와야 함(Task 11 테스트 `round-trips a state in the middle of combat`).
4. 대화 중 이동 키·지도 터치 — 대화가 열려 있으면 이동 명령은 무시되고 이벤트도 없어야 함(Task 7 테스트 `movement is ignored while a dialogue is open`).
5. 동료가 떠난 뒤 다시 합류할 때 중복 등록 — `party`에 같은 id가 두 번 들어가지 않아야 함(Task 8 테스트 `rejoining never duplicates a companion`).

---

## 파일 구조

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, playwright.config.ts
index.html
LICENSE (MIT), LICENSE-CONTENT (CC BY-SA 4.0), README.md, AGENTS.md, CLAUDE.md
docs/TESTING_POLICY.md, docs/handoff.md
.github/workflows/pages.yml
scripts/check-content.ts        콘텐츠 검사 CLI (node 타입 제거 실행)
scripts/audit-dist.ts           dist 검사 CLI
src/main.ts                     부팅: 콘텐츠·저장 불러오기, 루프 연결
src/debug-log.ts                ultima에서 복사
src/content/types.ts            RawContent / GameContent 타입
src/content/load-node.ts        content/ 디렉터리 → RawContent (node 전용)
src/content/compile.ts          RawContent → { content, errors } (순수)
src/content/denylist.ts         금지어 검사 (순수)
src/content/ledger.ts           LEDGER.md 파싱·검사·크레딧 (순수)
src/content/vite-plugin.ts      virtual:content, virtual:credits
src/core/types.ts               GameState, Command, GameEvent, ids
src/core/rng.ts                 시드 난수 (mulberry32)
src/core/state.ts               createInitialState
src/core/step.ts                step() 진입점 — 명령을 하위 모듈로 분배
src/core/world/move.ts          이동·충돌·출구·지형 비용
src/core/world/path.ts          BFS 길찾기 (터치 이동)
src/core/knowledge/notebook.ts  단서 획득, 추론 칸, 확정 규칙, 소문 힌트
src/core/dialogue/talk.ts       대화 열기·묻기·선택지·닫기
src/core/virtue/conduct.ts      행실 기록, 동료 합류·이탈·복귀
src/core/crisis/crisis.ts       위기 선택지 조건·해결
src/core/combat/grid.ts         전투 상태·예고·행동·종료
src/core/save/serialize.ts      직렬화·검증·마이그레이션
src/save/slot-store.ts          ultima에서 복사 (IndexedDB)
src/save/slots.ts               게임용 슬롯 (state.json 한 파일)
src/render/viewport.ts          시야·배율 계산 (순수)
src/render/canvas.ts            타일·스프라이트·전투 격자 그리기
src/input/commands.ts           키·포인터 → Command (순수)
src/ui/strings.ts               t(key) 문자열 조회
src/ui/view-model.ts            상태 → 패널 표시 데이터 (순수)
src/ui/panels.ts                대화·수첩·전투 HUD·메뉴 DOM
src/audio/score.ts              텍스트 악보 파싱 → 음 이벤트 (순수)
src/audio/synth.ts              Web Audio 칩 합성기·스케줄러
src/audio/sfx.ts                8비트 효과음 생성 (순수 → Float32Array)
content/ip-denylist.yaml, content/tiles.yaml, content/strings/ko.yaml
content/towns/kalas/*.yaml, content/creatures.yaml, content/music/*.yaml
assets/LEDGER.md, assets/fonts/neodgm.woff2, assets/fonts/LICENSE-neodgm.txt, assets/tiles/*.png
tests/unit/**, tests/scenario/**, tests/e2e/boot.spec.ts
```

## 핵심 타입 (Task 5에서 정의, 이후 모든 Task가 사용)

```ts
// src/core/types.ts
export type Id = string                       // "fact.kalas.ledger", "word.lantern", "npc.kalas.mira"
export type Dir = "n" | "e" | "s" | "w"
export type Virtue = "honesty" | "compassion" | "valor" | "justice" | "sacrifice" | "honor" | "spirituality" | "humility"
export interface Pos { readonly x: number; readonly y: number }

export type Command =
  | { type: "move"; dir: Dir }
  | { type: "moveTo"; target: Pos }
  | { type: "interact"; at?: Pos }                         // 바라보는 칸(또는 인접한 at 칸)의 NPC와 대화, at이면 그쪽을 바라봄
  | { type: "ask"; topic: string }
  | { type: "choose"; optionId: Id }
  | { type: "endTalk" }
  | { type: "fillSlot"; deductionId: Id; slot: number; word: Id | null }
  | { type: "resolveCrisis"; crisisId: Id; optionId: Id }
  | { type: "recruit"; npcId: Id }
  | { type: "combat"; action: CombatAction }

export type GameEvent =
  | { type: "moved"; pos: Pos } | { type: "bumped" } | { type: "mapChanged"; mapId: Id }
  | { type: "said"; npcId: Id; textKey: string; lie: boolean }
  | { type: "factLearned"; id: Id }
  | { type: "deductionConfirmed"; id: Id } | { type: "abilityUnlocked"; id: Id }
  | { type: "deed"; virtue: Virtue; deed: Id }
  | { type: "companionJoined"; npcId: Id } | { type: "companionLeft"; npcId: Id }
  | { type: "crisisResolved"; crisisId: Id; optionId: Id }
  | { type: "combatStarted"; encounterId: Id } | { type: "combatEnded"; outcome: "victory" | "defeat" | "fled" }
  | { type: "sfx"; name: string } | { type: "music"; track: Id }

export interface GameState {
  readonly version: 1
  readonly rng: number
  readonly turn: number
  readonly mapId: Id
  readonly player: { readonly pos: Pos; readonly facing: Dir; readonly hp: number; readonly maxHp: number }
  readonly facts: readonly Id[]                                  // 정렬·중복 없음
  readonly deductions: Readonly<Record<Id, { readonly slots: readonly (Id | null)[]; readonly confirmed: boolean }>>
  readonly abilities: readonly Id[]
  readonly deeds: readonly { readonly virtue: Virtue; readonly deed: Id; readonly turn: number }[]
  readonly party: readonly Id[]
  readonly departed: readonly Id[]
  readonly crises: Readonly<Record<Id, Id>>                      // crisisId → 고른 optionId
  readonly flags: readonly Id[]
  readonly dialogue: { readonly npcId: Id; readonly pendingChoice: Id | null } | null
  readonly combat: CombatState | null
  readonly clearedEncounters: readonly Id[]
}

export interface StepResult { readonly state: GameState; readonly events: readonly GameEvent[] }
```

`CombatState`, `CombatAction`은 Task 10에서 정의한다. `GameContent`는 Task 3에서 정의한다.

---

## M0 — 골격

### Task 1: 저장소 골격과 작업 규칙

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `.gitignore`, `LICENSE`, `LICENSE-CONTENT`, `README.md`, `AGENTS.md`, `docs/TESTING_POLICY.md`, `docs/handoff.md`
- Modify: `CLAUDE.md` (이미 있음 — "AGENTS.md를 따른다" 한 줄로 갱신)
- Copy: `/home/taejin/ultima/src/debug-log.ts` → `src/debug-log.ts`, `/home/taejin/ultima/tests/unit/debug-log.test.ts` → `tests/unit/debug-log.test.ts`

**Interfaces:**
- Produces: `npm run dev | build | preview | test:unit | typecheck`; `createDebugLog`, `debugEnabledFromUrl` (ultima와 동일 시그니처)

- [ ] **Step 1:** `package.json` — `"name": "hollow-codex"`, `"type": "module"`, `"engines": { "node": ">=22.18.0" }`, devDependencies는 ultima와 같은 고정 버전(`@playwright/test 1.52.0`, `@types/node 22.15.3`, `typescript 5.8.3`, `vite 6.3.4`, `vitest 3.1.3`) + `yaml` 최신 2.x 고정 버전. scripts: `dev`, `build`(`vite build`), `preview`, `test:unit`(`vitest run --passWithNoTests=false`), `test:e2e`, `typecheck`(`tsc --noEmit`), `check:content`(`node scripts/check-content.ts`), `audit:dist`(`node scripts/audit-dist.ts`).
- [ ] **Step 2:** `tsconfig.json` — ultima의 compilerOptions 그대로, `include`에 `scripts/**/*.ts` 추가. `vite.config.ts` — `base: "/hollow-codex/"`만. `vitest.config.ts` — `include: ["tests/unit/**/*.test.ts", "tests/scenario/**/*.test.ts"]`, `globals: true`.
- [ ] **Step 3:** debug-log 두 파일 복사 후 `npm ci && npx vitest run tests/unit/debug-log.test.ts` → PASS.
- [ ] **Step 4:** `index.html` + `src/main.ts`: `<canvas id="screen">`와 `<div id="ui">`, 제목 "빈 경전" 표시(이 한 줄만 예외로 index.html에 둔다 — 콘텐츠 로딩 전 화면).
- [ ] **Step 5:** 라이선스: `LICENSE` MIT(저작권자 TaejinKim7-dev, 2026), `LICENSE-CONTENT` CC BY-SA 4.0 전문 + 적용 범위(`content/`, 자체 `assets/`).
- [ ] **Step 6:** `AGENTS.md` — ultima `AGENTS.md`에서 일반 규칙만 옮긴다: 절대 금지(원작 데이터·참고 문서·번역문·secret 커밋 금지 + spec §2.2 금지 목록 참조), TDD, Haiku 게이트, 진행→저장→기록→확인, `todo-<n>-<topic>` 브랜치 → main 직접 merge, 위 merge 게이트 목록, 실패 숨기지 않기. xu4·wasm·native 관련 문장은 옮기지 않는다. `CLAUDE.md`는 `AGENTS.md`, spec, 이 plan, `docs/handoff.md`를 읽으라는 안내만. `docs/TESTING_POLICY.md` — 단위(core·content), 시나리오, e2e 최소, 사용자 수동 확인 원칙.
- [ ] **Step 7:** `.gitignore`: `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `*.pdf`, `origin.txt`, `client_secret_*.json*`.
- [ ] **Step 8:** Haiku로 `npm run test:unit && npm run typecheck && npm run build` → 모두 exit 0.
- [ ] **Step 9:** 커밋 `chore: project skeleton, licenses and working rules`.

### Task 2: Pages 배포와 dist 검사

**Files:**
- Create: `.github/workflows/pages.yml`, `scripts/audit-dist.ts`, `src/audit/dist-rules.ts`, `tests/unit/dist-rules.test.ts`

**Interfaces:**
- Produces: `auditFiles(files: readonly { path: string; text: string | null; size: number }[]): string[]` (위반 메시지 목록, 빈 배열이면 통과)

- [ ] **Step 1: 실패 테스트** — `tests/unit/dist-rules.test.ts`:
  - `flags an external origin in shipped JS`: `{ path: "assets/a.js", text: 'fetch("https://example.com/x")' }` → 결과에 `"assets/a.js"` 포함.
  - `flags source maps`: `path: "assets/a.js.map"` → 위반.
  - `flags banned reference files`: `path: "u4-alt-manual.pdf"`, `"origin.txt"` → 위반.
  - `flags a bundle over the budget`: 전체 크기 합 > 5 MB → 위반.
  - `passes a clean dist`: 빈 배열.
- [ ] **Step 2:** 실행 → FAIL(`auditFiles` 없음).
- [ ] **Step 3:** `src/audit/dist-rules.ts`에 구현. 외부 origin 판정은 `https?://` 정규식, 허용 목록은 빈 배열 상수 `ALLOWED_ORIGINS`(SVG 네임스페이스 `http://www.w3.org/`만 예외). `scripts/audit-dist.ts`는 `dist/`를 읽어 `auditFiles`를 부르고 위반이 있으면 exit 1.
- [ ] **Step 4:** 테스트 PASS.
- [ ] **Step 5:** `pages.yml` — ultima 워크플로의 고정 SHA 액션(checkout v7.0.1, setup-node v7.0.0 node `22.23.3`, upload-pages-artifact v5.0.0, configure-pages v6.0.0, deploy-pages v5.0.1)을 그대로 쓰고, build job 단계는 `npm ci` → `npm run typecheck` → `npm run test:unit` → `npm run check:content` → `npm run build` → `npm run audit:dist` → `touch dist/.nojekyll` → upload. emsdk·apt·wasm 단계는 넣지 않는다. deploy job은 ultima와 동일.
- [ ] **Step 6:** Pages 소스를 Actions로 설정: `gh api -X POST repos/TaejinKim7-dev/hollow-codex/pages -f build_type=workflow` (이미 있으면 `-X PUT`). 결과 JSON의 `build_type`이 `workflow`인지 확인.
- [ ] **Step 7:** 커밋·push 후 `gh run watch`로 build·deploy success, `curl -s -o /dev/null -w "%{http_code}" https://taejinkim7-dev.github.io/hollow-codex/` → `200`. (check:content는 Task 3 전까지 `exit 0`하는 자리표시 스크립트로 둔다.)

### Task 3: 콘텐츠 파이프라인 (참조 검사 + 금지어 검사)

**Files:**
- Create: `src/content/types.ts`, `src/content/load-node.ts`, `src/content/compile.ts`, `src/content/denylist.ts`, `src/content/vite-plugin.ts`, `scripts/check-content.ts`, `content/ip-denylist.yaml`, `tests/unit/content-compile.test.ts`, `tests/unit/denylist.test.ts`, `tests/fixtures/content-min/**`
- Modify: `vite.config.ts` (플러그인 등록), `src/vite-env.d.ts`(가상 모듈 선언)

**Interfaces:**
- Produces:
  - `loadContentDir(dir: string): RawContent` — `content/**/*.yaml`을 읽어 파일 경로별로 모은다(node 전용).
  - `compileContent(raw: RawContent): { content: GameContent | null; errors: string[] }` — 순수.
  - `findDenied(texts: Iterable<{ where: string; text: string }>, deny: readonly string[]): string[]`
  - `GameContent`:
    ```ts
    interface GameContent {
      tiles: Record<string, { atlas: number; walk: number | null }>   // ASCII 문자 → 타일 (walk null = 막힘, 숫자 = 이동 비용 턴)
      maps: Record<Id, { rows: string[]; exits: { at: Pos; to: Id; arrive: Pos }[]; start?: Pos; music: Id; encounters: { at: Pos; id: Id }[] }>
      npcs: Record<Id, { map: Id; pos: Pos; nameKey: string; sprite: number; topics: Record<string, Topic>; companion?: CompanionDef }>
      facts: Record<Id, { kind: "person" | "place" | "word" | "song" | "meaning" | "creature"; labelKey: string; hintKey: string }>
      deductions: Record<Id, { sentenceKey: string; answer: Id[]; unlocks: Id[] }>
      crises: Record<Id, { options: Record<Id, { requires: Id[]; requiresDeductions: Id[]; setsFlags: Id[]; textKey: string }> }>
      creatures: Record<Id, { nameKey: string; evil: boolean; hp: number; attack: number; sprite: number; lore: Id }>
      encounters: Record<Id, { map: Id; grid: string[]; enemies: { creature: Id; at: Pos }[]; music: Id }>
      abilities: Record<Id, { nameKey: string }>
      music: Record<Id, Score>          // Task 14의 Score
      strings: Record<string, string>   // ko
      start: { map: Id; pos: Pos; hp: number }
    }
    interface Topic { textKey: string; requires?: Id[]; grants?: Id[]; lie?: boolean; choice?: { optionId: Id; labelKey: string; textKey: string; deed?: { virtue: Virtue; deed: Id }; grants?: Id[] }[]; requiresFlags?: Id[]; setsFlags?: Id[] }
    interface CompanionDef { virtue: Virtue; joinRequires: Id[]; leaveAfterDeeds: number; rejoinRequires: Id[] }
    ```
  - `virtual:content` 기본 내보내기 = `GameContent`.

- [ ] **Step 1: 실패 테스트** — `content-compile.test.ts` (fixture `tests/fixtures/content-min`: 3×3 지도 1장, NPC 1명, 단서 2개, 추론 1개, 문자열):
  - `compiles the minimal fixture without errors`
  - `reports a topic that grants an unknown fact` — 오류 메시지에 파일 경로와 `fact.missing` 포함.
  - `reports a missing string key` — `nameKey: "npc.nobody.name"`이 strings에 없으면 오류.
  - `reports a map exit to an unknown map` 과 `reports rows of unequal width`
  - `reports a deduction answer word nobody can grant` — 정답 단어가 어떤 topic/choice의 `grants`에도 없으면 오류(spec §7.4 "획득 경로 존재").
  - `reports a tile character missing from tiles.yaml`
- [ ] **Step 2:** `denylist.test.ts`:
  - `catches a denied word regardless of case`: deny `["britannia"]`, text `"Welcome to BRITANNIA"` → 1건, `where` 포함.
  - `catches a Hangul transliteration`: deny `["브리타니아"]`, text `"브리타니아의 땅"` → 1건.
  - `ignores clean text` → 0건.
- [ ] **Step 3:** 실행 → FAIL.
- [ ] **Step 4:** 구현. `compileContent`는 모든 오류를 모아 한 번에 돌려준다(첫 오류에서 멈추지 않음). 금지어 검사는 `compileContent` 안에서 모든 strings 값·id·파일 경로를 대상으로 실행하고, 목록은 `content/ip-denylist.yaml`(spec §2.2의 영문·한글 목록 전부)에서 읽는다. 금지 목록 파일 자체는 검사 대상에서 뺀다.
- [ ] **Step 5:** `vite-plugin.ts`: `resolveId("virtual:content")` → `load`에서 `loadContentDir` + `compileContent`, 오류가 있으면 `this.error(errors.join("\n"))`. `content/**` 변경 시 HMR 전체 새로고침. `scripts/check-content.ts`: 같은 두 함수를 부르고 오류를 출력, 있으면 exit 1.
- [ ] **Step 6:** 테스트 PASS, `npm run check:content` exit 0 (실제 `content/`는 아직 최소 내용: tiles·strings·start용 지도 1장).
- [ ] **Step 7:** 커밋 `feat(content): YAML content compiler with reference and denylist checks`.

### Task 4: 자산 장부, 글꼴, 크레딧

**Files:**
- Create: `src/content/ledger.ts`, `tests/unit/ledger.test.ts`, `assets/LEDGER.md`
- Copy: `/home/taejin/ultima/public/fonts/neodgm.woff2` → `assets/fonts/neodgm.woff2`, `/home/taejin/ultima/public/fonts/LICENSE.txt` → `assets/fonts/LICENSE-neodgm.txt`
- Modify: `src/content/vite-plugin.ts` (`virtual:credits`), `scripts/check-content.ts`, `src/main.ts`(글꼴 적용)

**Interfaces:**
- Produces:
  - `parseLedger(markdown: string): LedgerRow[]` — `LedgerRow = { path: string; source: string; author: string; license: string }`. 표 형식 `| path | source | author | license |`.
  - `checkLedger(rows: LedgerRow[], files: readonly string[]): string[]`
  - `ALLOWED_LICENSES = ["CC0-1.0", "CC-BY-3.0", "CC-BY-4.0", "CC-BY-SA-3.0", "CC-BY-SA-4.0", "OFL-1.1"]`
  - `virtual:credits` 기본 내보내기 = `LedgerRow[]`

- [ ] **Step 1: 실패 테스트**:
  - `flags an asset file missing from the ledger`
  - `flags a ledger row whose file does not exist`
  - `rejects NC and ND licenses`: `"CC-BY-NC-4.0"`, `"CC-BY-ND-4.0"` → 위반.
  - `accepts every allowed license`
  - `ignores LEDGER.md and license text files themselves` (`assets/LEDGER.md`, `assets/**/LICENSE*`)
- [ ] **Step 2:** FAIL 확인 → 구현 → PASS.
- [ ] **Step 3:** 글꼴 복사 전 `sha256sum`을 ultima `public/fonts/SHA256`와 비교해 같아야 한다. 장부 첫 행: `| assets/fonts/neodgm.woff2 | https://github.com/neodgm/neodgm | <LICENSE.txt의 Copyright 줄 그대로> | OFL-1.1 |`.
- [ ] **Step 4:** `check-content.ts`가 장부 검사도 실행. `npm run check:content` exit 0.
- [ ] **Step 5:** 커밋 `feat(assets): asset ledger check, Neo둥근모 font and credits`. push → Pages에서 Neo둥근모로 제목이 보이는지 사용자 확인(M0 완료 기준 = spec §8 M0).

---

## M1 — 칼라스 수직 슬라이스

### Task 5: 코어 상태와 이동

**Files:**
- Create: `src/core/types.ts`(위 "핵심 타입"), `src/core/rng.ts`, `src/core/state.ts`, `src/core/step.ts`, `src/core/world/move.ts`, `src/core/world/path.ts`, `tests/unit/core/move.test.ts`, `tests/unit/core/path.test.ts`, `tests/unit/core/purity.test.ts`, `tests/unit/core/fixture.ts`

**Interfaces:**
- Consumes: `GameContent` (Task 3)
- Produces: `createInitialState(content: GameContent, seed: number): GameState`; `step(state: GameState, command: Command, content: GameContent): StepResult`; `findPath(content: GameContent, mapId: Id, from: Pos, to: Pos, blocked: (p: Pos) => boolean): Dir[] | null`; `nextRandom(rng: number): { value: number; rng: number }`; `tests/unit/core/fixture.ts`의 `testContent()` (작은 지도 2장·NPC 2명·추론 1개·위기 1개·조우 1개를 코드로 만든 GameContent — Task 6~11 공용)

- [ ] **Step 1: 실패 테스트** `move.test.ts`:
  - `moves one tile and advances the turn by the terrain cost` (풀 1, 덤불 2)
  - `bumps into a blocking tile without moving or spending a turn` → 이벤트 `bumped`
  - `bumps into an NPC`
  - `changes map at an exit and arrives at the exit's arrive position` → `mapChanged` + `music`
  - `starts the encounter placed on the tile` → `combatStarted`, `state.combat` 설정. `clearedEncounters`에 있으면 시작하지 않음.
  - `moveTo walks the BFS path one step per command until the target`
- [ ] **Step 2:** `path.test.ts`: `finds the shortest path around walls`, `returns null when unreachable`, `returns [] when already there`.
- [ ] **Step 3:** `purity.test.ts`: `src/core/**/*.ts` 소스를 읽어 `/\b(document|window|HTMLElement|CanvasRenderingContext2D|AudioContext|Math\.random)\b/`가 없어야 함.
- [ ] **Step 4:** FAIL 확인 → 구현 → PASS. `step`은 `state.dialogue`/`state.combat`이 열려 있으면 해당 모듈로만 분배한다(Task 7·10이 채움). 상태는 항상 새 객체(입력 상태를 변경하지 않음 — `move.test.ts`에 `Object.freeze` 깊은 동결 상태로 실행해 검증).
- [ ] **Step 5:** 커밋 `feat(core): state, deterministic step, movement and pathfinding`.

### Task 6: 수첩 — 단서, 추론 페이지, 소문 힌트

**Files:**
- Create: `src/core/knowledge/notebook.ts`, `tests/unit/core/notebook.test.ts`
- Modify: `src/core/step.ts` (`fillSlot`)

**Interfaces:**
- Produces: `learn(state: GameState, ids: readonly Id[]): StepResult` (이미 아는 단서는 이벤트 없음); `fillSlot`(step 경유); `openHints(state: GameState, content: GameContent): { targetId: Id; missing: Id[] }[]` — 아직 못 연 topic·위기 선택지·추론의 부족한 단서 목록(소문 지도용).

- [ ] **Step 1: 실패 테스트**:
  - `learning a fact twice emits one factLearned`
  - `a deduction confirms only when all three slots match the answer` → 3칸 정답 시 `deductionConfirmed` + `unlocks`의 능력 `abilityUnlocked`.
  - `two correct slots give no confirmation and no signal`: 이벤트 배열에 `deductionConfirmed`가 없고, 상태에 "맞은 개수"를 담는 필드가 없음(`Object.keys(state.deductions[id])`가 `["slots","confirmed"]`).
  - `same word in two slots never confirms unless the answer says so`
  - `filling a slot with an unknown word is ignored`
  - `a confirmed deduction cannot be changed`
  - `openHints lists the missing facts for a locked crisis option`
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(core): notebook facts, three-slot deductions and open hints`.

### Task 7: 대화

**Files:**
- Create: `src/core/dialogue/talk.ts`, `tests/unit/core/talk.test.ts`
- Modify: `src/core/step.ts` (`interact`, `ask`, `choose`, `endTalk`)

**Interfaces:**
- Produces: `availableTopics(state: GameState, content: GameContent, npcId: Id): string[]` — NPC의 기본 topic(`이름`, `일`) + 플레이어가 아는 `word` 단서의 라벨 중 그 NPC가 `topics`로 가진 것, `requires`/`requiresFlags` 충족분만.

- [ ] **Step 1: 실패 테스트**:
  - `interact opens a dialogue with the NPC the player faces`
  - `asking a topic says its text and grants its facts`
  - `a topic with unmet requires answers with the NPC's default "모른다" key` (`npc.default.unknown`)
  - `a lie topic marks the said event lie: true` (표시 여부는 UI가 `ability.see-lies` 보유로 결정)
  - `a choice topic waits for choose, then records the option's deed`
  - `movement is ignored while a dialogue is open` (이벤트 0개, 위치 그대로)
  - `endTalk closes the dialogue`
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(core): keyword dialogue with requirements, lies and choices`.

### Task 8: 행실과 동료

**Files:**
- Create: `src/core/virtue/conduct.ts`, `tests/unit/core/conduct.test.ts`
- Modify: `src/core/step.ts` (`recruit`), `src/core/dialogue/talk.ts`·`src/core/combat/grid.ts`가 `recordDeed`를 호출

**Interfaces:**
- Produces: `recordDeed(state: GameState, content: GameContent, virtue: Virtue, deed: Id): StepResult` — 기록 후 이탈 판정까지 수행; `canRecruit(state, content, npcId): boolean`

- [ ] **Step 1: 실패 테스트**:
  - `recruit succeeds only when joinRequires facts are known` → `companionJoined`
  - `a companion leaves after leaveAfterDeeds deeds against their virtue since joining` (가입 전 행실은 세지 않음) → `companionLeft`, `departed`에 추가
  - `a departed companion rejoins once rejoinRequires facts are known`
  - `rejoining never duplicates a companion`
  - `party holds at most three companions`
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(core): conduct deeds and companion join, leave, rejoin`.

### Task 9: 마을 위기

**Files:**
- Create: `src/core/crisis/crisis.ts`, `tests/unit/core/crisis.test.ts`
- Modify: `src/core/step.ts` (`resolveCrisis`)

**Interfaces:**
- Produces: `crisisOptions(state, content, crisisId): { optionId: Id; available: boolean; missing: Id[] }[]`

- [ ] **Step 1: 실패 테스트**:
  - `an option is available only when its facts and deductions are met`
  - `resolving sets the option's flags and emits crisisResolved`
  - `a crisis resolves once` (두 번째 시도 무시)
  - `an unavailable option cannot be resolved`
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(core): town crisis options and resolution`.

### Task 10: 격자 턴제 전투

**Files:**
- Create: `src/core/combat/grid.ts`, `tests/unit/core/combat.test.ts`
- Modify: `src/core/step.ts` (`combat`)

**Interfaces:**
- Produces:
  ```ts
  interface CombatUnit { id: Id; side: "ally" | "enemy"; creature: Id | null; pos: Pos; hp: number; attack: number; defending: boolean; moved: boolean; acted: boolean; gone: null | "dead" | "retreated" | "fled" }
  interface CombatState { encounterId: Id; grid: readonly string[]; units: readonly CombatUnit[]; active: Id; round: number; intents: Readonly<Record<Id, { moveTo: Pos; attack: Id | null }>> }
  type CombatAction =
    | { kind: "move"; to: Pos }              // 최대 3칸, BFS 거리
    | { kind: "attack"; dir: Dir } | { kind: "defend" } | { kind: "push"; dir: Dir }
    | { kind: "persuade"; dir: Dir } | { kind: "flee" } | { kind: "endTurn" }
  ```
- 규칙(테스트가 고정): 피해 = 공격력, 방어 중이면 `Math.ceil(공격력 / 2)`. 밀기는 1칸, 밀려난 칸이 격자 밖이면 `retreated`(죽지 않음), 막힌 칸이면 제자리 + 피해 1. 설득은 플레이어가 그 생물의 `lore` 단서를 알고 `evil: false`일 때만 성공(`retreated`). 도주는 격자 가장자리 칸에서만. 아군 차례가 모두 끝나면 적이 예고(`intents`)대로 행동하고, 새 예고를 계산한다(가장 가까운 아군 쪽으로 이동, 인접하면 공격). 무작위 없음.

- [ ] **Step 1: 실패 테스트**:
  - `intents are shown before the enemy acts and enemies follow them`
  - `defending halves damage rounding up`
  - `pushing an enemy off the grid makes it retreat, not die`
  - `killing a non-evil creature records a compassion deed` (`deed.kill-innocent`); 악한 생물은 기록 없음
  - `persuade works only on a non-evil creature whose lore fact is known`
  - `flee works only from an edge tile`
  - `combat ends in victory when no enemy remains, adds the encounter to clearedEncounters`
  - `combat ends in defeat when every ally is gone` → 플레이어 hp 1로 `content.start` 위치 복귀, 조우는 `clearedEncounters`에 넣지 않음(게임 오버 없음)
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(core): telegraphed grid combat with push, persuade and flee`.

### Task 11: 저장

**Files:**
- Create: `src/core/save/serialize.ts`, `tests/unit/core/serialize.test.ts`, `src/save/slots.ts`, `tests/unit/save/slots.test.ts`
- Copy: `/home/taejin/ultima/src/saves/slot-store.ts` → `src/save/slot-store.ts` (변경 없음; 머리 주석의 "Todo 51"만 "Hollow Codex save slots"로)

**Interfaces:**
- Produces:
  - `serialize(state: GameState): string` — `{"format":"hollow-codex-save","version":1,"state":…}`
  - `deserialize(text: string): { ok: true; state: GameState } | { ok: false; reason: "corrupt" | "format" | "future-version" }`
  - `MIGRATIONS: Record<number, (s: unknown) => unknown>` (지금은 빈 객체)
  - `saveToSlot(store: SlotStore, slotId: Id, name: string, state: GameState, now: number): Promise<void>`, `loadSlot(store, slotId): Promise<ReturnType<typeof deserialize> | null>`, `AUTO_SLOT = "auto"`

- [ ] **Step 1: 실패 테스트**:
  - `round-trips a state` (`deserialize(serialize(s)).state`가 `s`와 `toEqual`)
  - `round-trips a state in the middle of combat`
  - `corrupt and future saves are rejected without throwing` (`"{"`, `format` 다름, `version: 2`)
  - slots: `saves and loads through the memory store`, `the auto slot is overwritten in place`
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(save): versioned save format and local slots`.

### Task 12: 렌더러와 입력

**Files:**
- Create: `src/render/viewport.ts`, `src/render/canvas.ts`, `src/input/commands.ts`, `tests/unit/render/viewport.test.ts`, `tests/unit/input/commands.test.ts`

**Interfaces:**
- Produces:
  - `computeViewport(canvasCss: { w: number; h: number }, dpr: number, mapSize: { w: number; h: number }, center: Pos): { scale: number; originTile: Pos; offsetPx: Pos }` — 시야 15×11, `scale = max(1, floor(min(w*dpr/(15*16), h*dpr/(11*16))))`, 지도 가장자리에서 시야가 지도 밖으로 나가지 않게 clamp.
  - `keyToCommand(key: string, mode: "explore" | "dialogue" | "combat"): Command | UiAction | null` — 화살표·WASD → `move`, Enter/Space → `interact`, Esc → `endTalk`(dialogue) 또는 `{ ui: "menu" }`, Tab → `{ ui: "notebook" }`. `type UiAction = { ui: "notebook" | "menu" }`.
  - `pointerToCommand(tile: Pos, state: GameState, content: GameContent): Command | null` — 인접 NPC면 `{ type: "interact", at: tile }`, 아니면 `moveTo`.
  - `drawFrame(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, state: GameState, content: GameContent, vp: Viewport): void` — 순수 아님, 테스트 없음(사용자 확인).

- [ ] **Step 1: 실패 테스트**: viewport — `integer scale for a 1280×720 canvas at dpr 1 is 4`, `clamps at the map's top-left corner`, `clamps at the bottom-right corner`, `never goes below scale 1`; commands — 키 매핑 표 전체, `arrow keys do nothing in dialogue mode`, `tapping an adjacent NPC interacts`, `tapping a far tile walks there`.
- [ ] **Step 2:** FAIL → 구현 → PASS. `canvas.ts`는 `ctx.imageSmoothingEnabled = false`, 전투 중이면 격자와 예고 화살표(적 → `intents[...].moveTo`, 공격 대상엔 빨간 테두리)를 그린다.
- [ ] **Step 3:** 커밋 `feat(render,input): integer-scaled tile viewport and unified input commands`.

### Task 13: UI 패널

**Files:**
- Create: `src/ui/strings.ts`, `src/ui/view-model.ts`, `src/ui/panels.ts`, `tests/unit/ui/view-model.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:
  - `t(strings: Record<string, string>, key: string, vars?: Record<string, string>): string` — 없는 키는 `⟦key⟧`(검사기가 막지만 개발 중 보이게).
  - `dialogueView(state, content): { npcName: string; lines: { text: string; lieMark: boolean }[]; chips: string[]; choices: { optionId: Id; label: string }[] } | null` — `lieMark`는 `ability.see-lies` 보유 시에만 true.
  - `notebookView(state, content): { facts: Record<FactKind, { id: Id; label: string }[]>; deductions: { id: Id; sentence: string; slots: (string | null)[]; confirmed: boolean; words: { id: Id; label: string }[] }[]; hints: string[] }`
  - `combatView(state, content): { active: string; actions: CombatAction["kind"][]; units: { id: Id; name: string; hp: number; evilKnown: boolean | null }[] } | null` — `evilKnown`은 도감 단서(`lore`)를 알 때만 true/false, 모르면 null.
  - `mountPanels(root: HTMLElement, dispatch: (c: Command | UiAction) => void): { render(state: GameState): void }`

- [ ] **Step 1: 실패 테스트**: `lie marks appear only with the see-lies ability`, `chips list only topics available for this NPC`, `the deduction page shows chosen words, never a correctness count`, `hints show hint text of missing facts`, `unknown creature nature shows as null`.
- [ ] **Step 2:** FAIL → 구현 → PASS. 패널: 대화(오른쪽, 칩 + 선택지 버튼), 수첩(Tab 또는 화면 버튼, 탭: 단서/추론/소문), 전투 HUD(행동 버튼), 메뉴(저장·불러오기·크레딧). 모든 버튼 높이 ≥ 44px(터치). 글꼴 Neo둥근모.
- [ ] **Step 3:** 커밋 `feat(ui): dialogue chips, notebook, combat HUD and menu`.

### Task 14: 칩 음악과 효과음

**Files:**
- Create: `src/audio/score.ts`, `src/audio/synth.ts`, `src/audio/sfx.ts`, `tests/unit/audio/score.test.ts`, `tests/unit/audio/sfx.test.ts`

**Interfaces:**
- Produces:
  - 악보 YAML 형식: `{ tempo: number; loop: boolean; channels: { wave: "square50" | "square25" | "triangle" | "noise"; volume: number; notes: string }[] }`. `notes`는 공백 구분 `음이름옥타브/길이`(예 `E4/4 G4/8 r/8 A4/2.`) — 길이는 온음표 분모, `.`은 1.5배, `r`은 쉼표, 노이즈 채널은 `x/8`.
  - `type Score`(위 형식), `parseScore(score: Score): { events: { channel: number; time: number; duration: number; freq: number | null }[]; length: number }` — 시간 단위 초.
  - `createChipPlayer(ctx: AudioContext): { play(score: Score): void; stop(): void; setVolume(v: number): void }` — 100ms 앞서 스케줄, `loop`이면 `length`마다 반복. 첫 사용자 입력 전에는 `ctx.resume()`을 기다린다(브라우저 자동재생 정책).
  - `renderSfx(params: { wave: "square" | "noise"; startHz: number; endHz: number; ms: number; decay: number }, sampleRate: number): Float32Array`; `SFX`: `step`, `bump`, `learn`, `confirm`, `hit`, `push` 매개변수 표.
- [ ] **Step 1: 실패 테스트**: `parses A4/4 at 120 bpm to 440 Hz lasting 0.5 s`, `dotted notes last 1.5x`, `rests have freq null`, `rejects an unknown note name with the token in the error`, `length is the longest channel`; sfx — `length is ms × sampleRate / 1000`, `peak amplitude ≤ 1`, `same params give identical samples`.
- [ ] **Step 2:** FAIL → 구현 → PASS → 커밋 `feat(audio): text scores, chip synth player and generated sfx`.

### Task 15: 칼라스 콘텐츠

**Files:**
- Create: `content/tiles.yaml`, `content/strings/ko.yaml`(확장), `content/creatures.yaml`, `content/towns/kalas/{maps,npcs,facts,deduction,crisis,encounters,companion}.yaml`, `content/music/{field,kalas}.yaml`, `assets/tiles/*.png`
- Modify: `assets/LEDGER.md`

**이야기 고정값 (spec §3, §8.1에서 확정):**
- 지도 3장: `map.field`(들판 24×16, 열석 시작점), `map.kalas`(마을 32×24), `map.archive`(옛 서고 12×10, 마을 지하).
- 칼라스의 굳은 형태: 해 질 녘 모두 고백석에서 고백해야 하고, 이웃 고발이 "고발 장부"에 기록된다.
- 위기 `crisis.kalas.trial`: 필경사 **니아**가 "거짓 고백" 혐의로 재판을 앞둔다(동생을 감싸려고 고백석 등불을 깼다고 거짓 고백).
  - 선택지 `option.truth`(진실 규명): `requires: [fact.kalas.brother-witness, fact.kalas.lantern-shard]` → 니아 무죄, 장부 제도는 유지(`flag.kalas.ledger-kept`).
  - 선택지 `option.lantern`(제도 변화): `requiresDeductions: [deduction.honesty]`, `requires: [fact.kalas.pilgrim-letter]` → 순례자의 원래 편지를 재판정에서 읽고 마을이 장부를 태움(`flag.kalas.ledger-burned`).
- 추론 `deduction.honesty`: 문장 "정직은 {1}을 {2}가 아니라 {3}(으)로 쓰는 것이다", 정답 `[word.truth, word.weapon, word.lantern]`, 함정 단어 `word.duty`, `word.ledger`, `word.silence`를 대화로 얻을 수 있게 둔다. `unlocks: [ability.see-lies]`.
- 거짓말 NPC: 고발관장 `npc.kalas.warden`의 `등불` topic은 `lie: true`(등불이 사고로 깨졌다고 말함).
- 동료 `npc.kalas.elin`(고발관 견습, 장부 관리): `virtue: honesty`, `joinRequires: [fact.kalas.ledger-doubt]`, `leaveAfterDeeds: 2`, `rejoinRequires: [fact.kalas.elin-forgiven]`.
- 거짓말 기회: 성문 고백관 `npc.kalas.confessor`의 choice — 서고에 다녀온 뒤(`requiresFlags: [flag.visited-archive]`) "금지 구역에 들어갔는가?"에 `아니오` → `deed: { virtue: honesty, deed: deed.lie }`.
- 전투 `enc.field.wolves`: 굶주린 늑대 3마리(`creature.wolf`, `evil: false`, `lore: fact.creature.wolf-hungry` — 들판 사냥꾼에게서 획득). `enc.archive.robbers`: 도굴꾼 2명(`creature.robber`, `evil: true`).
- NPC 약 10명: 문지기(열석), 사냥꾼(들판), 고백관, 고발관장, 엘린, 니아, 니아의 동생 토비, 직조공 미라, 늙은 사서, 아이(노래로 `word.lantern` 단서), 여관 주인.
- 음악: `music.field` = 작자 미상 「Greensleeves」(16세기, 공유 저작물) 칩 편곡, `music.kalas` = Tielman Susato 「Danserye」(1551) 중 「La Mourisque」 칩 편곡. 두 편곡 모두 우리 작업(CC BY-SA 4.0)으로 장부에 원곡과 함께 기록.
- 타일·스프라이트: Kenney "Tiny Town"과 "Tiny Dungeon"(16×16, CC0). 받은 zip 안의 License 파일에서 CC0임을 확인하고 장부에 출처 URL과 함께 기록. 하나의 atlas PNG로 합쳐 `assets/tiles/atlas.png`.

- [ ] **Step 1:** 자산을 받아 라이선스 파일 확인 → atlas 작성 → 장부 기록 → `npm run check:content` 장부 검사 통과.
- [ ] **Step 2:** 지도·NPC·단서·추론·위기·조우·동료 YAML 작성. 모든 대사는 새로 쓴다(원작 문장·번역 사용 금지).
- [ ] **Step 3:** 악보 2곡 작성(3~4채널, 각 20~40초 루프).
- [ ] **Step 4:** `npm run check:content` exit 0(참조·획득 경로·금지어·장부 전부).
- [ ] **Step 5:** 커밋 `content(kalas): town of honesty — maps, people, deduction, trial, encounters, music`.

### Task 16: 시나리오 테스트, 연결, 플레이 확인

**Files:**
- Create: `tests/scenario/play.ts`(헬퍼), `tests/scenario/kalas-truth.test.ts`, `tests/scenario/kalas-lantern.test.ts`, `tests/scenario/kalas-rules.test.ts`, `tests/e2e/boot.spec.ts`, `playwright.config.ts`
- Modify: `src/main.ts` (루프: 입력 → step → 자동 저장 → render/panels/audio)

**Interfaces:**
- Consumes: 모든 이전 Task
- Produces: `play(content: GameContent, commands: readonly Command[], seed?: number): { state: GameState; events: GameEvent[] }` (실제 `content/`를 `loadContentDir` + `compileContent`로 읽음)

- [ ] **Step 1: 시나리오 테스트 작성 → RED → (콘텐츠·코드 보정) → GREEN**:
  - `kalas-truth`: 시작부터 명령 목록으로 두 단서를 모아 `option.truth` 해결 → `crises["crisis.kalas.trial"] === "option.truth"`, `flag.kalas.ledger-kept`.
  - `kalas-lantern`: 서고 전투 승리 → 편지 획득 → 추론 3칸 확정 → `option.lantern` 해결 → `flag.kalas.ledger-burned`, `abilities`에 `ability.see-lies`.
  - `kalas-rules`: 실제 콘텐츠에서 (a) 추론에 정답 2칸 + 함정 1칸이면 미확정, (b) 늑대를 죽이면 `deed.kill-innocent`, 밀어내면 기록 없음, (c) 엘린 합류 후 거짓말 2번이면 이탈, (d) 저장 → 불러오기 후 같은 명령을 이어서 실행한 결과가 저장 없이 실행한 결과와 같음.
- [ ] **Step 2:** `main.ts` 연결: 명령마다 `step` → 이벤트를 패널·오디오에 전달 → 이동 50턴마다와 맵 변경·위기 해결 때 `AUTO_SLOT` 자동 저장. 디버그 로그(`?debug=1`)에 명령·이벤트 기록.
- [ ] **Step 3:** `boot.spec.ts` 하나만(Chromium): 페이지가 뜨고 캔버스가 보이며 콘솔 오류가 없음. Haiku로 1회 실행.
- [ ] **Step 4:** merge 게이트 전부(Haiku) → `docs/handoff.md`에 명령·exit code 기록 → main merge·push → Pages 200 확인.
- [ ] **Step 5:** 사용자 플레이 확인 요청: PC와 휴대폰으로 칼라스를 두 갈래 모두 끝까지. spec §8.1 체크리스트를 `docs/handoff.md`에 옮겨 사용자 판정(계속 / 방향 수정 / 중단)을 기록한다. **이 판정 전에는 M2 계획을 쓰지 않는다.**
