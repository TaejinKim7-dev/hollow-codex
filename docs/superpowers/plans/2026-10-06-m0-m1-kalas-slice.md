# 빈 경전 M0 골격 + M1 칼라스 수직 슬라이스 Implementation Plan (상세판)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빈 저장소에서 출발해, 정직의 마을 칼라스 하나를 PC·모바일 웹에서 처음부터 끝까지(약 45분) 플레이할 수 있는 수직 슬라이스를 GitHub Pages에 배포한다.

**Architecture:** 순수 TypeScript 규칙 코어(`src/core`, DOM 금지)가 `step(state, command, content) → { state, events }`로 상태를 바꾸고, Canvas2D 렌더러·DOM UI·Web Audio 칩 합성기가 그 결과를 그린다. 콘텐츠는 `content/` YAML(지도는 ASCII 격자)로 쓰고, Vite 플러그인이 빌드 때 검사·컴파일해 가상 모듈 `virtual:content`로 넘긴다.

**Tech Stack:** Node 22.23.3(TS 타입 제거 실행), TypeScript 5.8.3, Vite 6.3.4, Vitest 3.1.3, Playwright 1.52.0(e2e 최소), `yaml` 2.9.1(ISC, 빌드·테스트 때만), Canvas2D, Web Audio, IndexedDB.

**Spec:** `docs/superpowers/specs/2026-10-06-hollow-codex-design.md`

**이전 판과의 차이:** 이 문서는 같은 경로의 첫 판(커밋 `462c78c`)을 대체한다. Task 구성(16개)과 목표는 같고, 각 Task에 정확한 시그니처·테스트 코드·YAML 스키마·명령과 기대 출력, Task 사이의 충돌 해소(아래 "확정 결정")를 넣었다.

## Global Constraints

- 원작 금지 목록(spec §2.2)의 어떤 이름·문장도 `content/`, `src/`, `scripts/`, 문자열 표에 넣지 않는다(주석 포함). 검사기가 빌드를 실패시킨다(spec §2.3).
- `u4-alt-manual.pdf`, `origin.txt`, 원본 Ultima IV 데이터, `/home/taejin/ultima` 저장소의 번역문(`locales/` 등)은 이 저장소에 절대 들어오지 않는다.
- 외부 자산은 CC0 / CC-BY / CC-BY-SA / OFL만. NC·ND·출처 불명 금지. `assets/` 아래 모든 파일은 `assets/LEDGER.md`에 기록(spec §5, §6, §9).
- 코드 MIT(`LICENSE`), 콘텐츠·자체 자산 CC BY-SA 4.0(`LICENSE-CONTENT`).
- `src/core/**`는 `document`, `window`, `HTMLElement`, `CanvasRenderingContext2D`, `AudioContext`, `Math.random`을 참조하지 않는다. 난수는 `state.rng`의 시드로만(spec §7.2).
- Pages base 경로: `/hollow-codex/`. 배포 URL: `https://taejinkim7-dev.github.io/hollow-codex/`.
- 한국어 우선: 화면 문자열은 전부 `content/strings/ko.yaml`의 키로 꺼낸다. 코드에 한국어 화면 문구를 하드코딩하지 않는다(테스트·주석, `index.html` 제목 한 줄 제외).
- 타일 16×16, 정수 배율. 화면 시야 15×11 타일.
- **노드 타입 제거 실행 호환**: `scripts/*.ts`가 `src/content/**`와 그 타입을 import하므로, `src/`·`scripts/`·`tests/`의 모든 상대 import는 `.ts` 확장자를 붙이고(`import { x } from "./a.ts"`), 타입만 쓰는 import는 `import type`. `enum`, `namespace`, 생성자 매개변수 프로퍼티, `import x = require()`는 쓰지 않는다.
- 상태 불변: core 함수는 입력 `GameState`를 바꾸지 않고 새 객체를 돌려준다. 바뀐 게 없으면 **같은 객체**를 돌려줘도 된다.
- 작업 규칙(`AGENTS.md`): TDD(RED 먼저, 실패 출력 기록), 단계마다 진행→저장(커밋)→기록→확인. merge 게이트는 컨트롤러가 Haiku 서브에이전트로 실행한다. 구현자는 자기 Task의 집중 테스트를 직접 돌린다(TDD의 일부). 수정 뒤 e2e는 돌리지 않고 사용자가 직접 화면 확인.
- merge 게이트(모두 exit 0): `npm ci`, `npm run test:unit`, `npm run typecheck`, `npm run check:content`, `npm run build`, `npm run audit:dist`, `git diff --check`.
- 셸: 모든 명령은 `export PATH="$HOME/.local/opt/node22/bin:$PATH"` 뒤에 `/home/taejin/hollow-codex`에서 실행한다(`node -v` → `v22.23.3`).

## 스펙과 다르게 정한 점 (2026-10-06 사용자 승인)

1. **지도 형식**: spec §7.1은 Tiled JSON이지만, M1은 **YAML 안의 ASCII 격자**로 쓴다. Tiled 가져오기는 M2에서 필요하면 추가한다.
2. **음악 형식**: spec §6.2는 MIDI이지만, M1의 두 곡은 **텍스트 악보(YAML)**로 쓴다. 외부 MIDI를 쓰게 되면 같은 내부 형식으로 바꾸는 변환기를 추가한다.
3. **Google Drive 동기화**: spec §10의 M0 이식을 **M2 이후로 미룬다**. M1은 로컬 슬롯만.
4. **낮·밤 일과**: spec §4.7은 M2 범위다. M1의 NPC는 고정 위치.

## 확정 결정 (첫 판의 빈칸·Task 간 충돌 해소)

| # | 결정 | 이유 | 틀렸을 때 비용 |
|---|---|---|---|
| D1 | 루트 `HANDOFF.md`를 `git mv`로 `docs/handoff.md`로 옮겨 인계 문서를 하나로 둔다(Task 1). | 첫 판은 `docs/handoff.md`를 새로 만들라 했지만 루트에 이미 있음. 두 개면 어긋난다. | 파일 위치 한 번 옮김 |
| D2 | debug-log의 콘솔 태그 `"[u4]"` → `"[hc]"`, 머리 주석의 원작 이름 제거, 전역 이름 `window.hollowDebugLog`. 테스트도 같은 태그로. | Global Constraints 1번(주석 포함 금지). | 없음 |
| D3 | `slot-store.ts`는 복사하되 `DB_NAME = "hollow-codex-save-slots"`, 머리 주석을 새로 쓴다(엔진·IDBFS 언급 제거). | 다른 게임과 DB 이름이 겹치면 안 됨. | 없음 |
| D4 | **금지어 매칭**: 라틴 문자 항목은 대소문자 무시 + 단어 경계(`(?<![a-z0-9])term(?![a-z0-9])`, 항목 안 공백은 `[\s_-]+`로 매칭), 한글 항목은 부분 문자열. 한글 목록에서 1음절 음역(유=Yew)과 흔한 낱말이 되는 음역(포스=Paws)은 뺀다. 만트라는 라틴만. `심연`·`아바타`는 spec이 적었으므로 그대로 넣는다(작가는 그 낱말을 피한다). | 부분 문자열이면 `cove`가 `discover`, `paws`가 일반 낱말에 걸린다. | 금지어 누락 또는 오탐 → 목록 수정 |
| D5 | `Score`(악보 타입)는 Task 3의 `src/content/types.ts`에 정의하고, Task 14가 import한다. | `GameContent.music`이 Task 14보다 먼저 필요. | 없음 |
| D6 | `CombatState`·`CombatUnit`·`CombatAction`은 Task 5의 `src/core/types.ts`에 정의한다. Task 5는 `src/core/combat/grid.ts`에 최소 `startCombat`(유닛 배치, `intents: {}`)를 만들고, Task 10이 예고 계산·행동을 채운다. | Task 5 테스트가 조우 시작 시 `state.combat`을 요구. | 없음 |
| D7 | Task 7의 선택지 행실은 `state.deeds`에 직접 추가하고 `deed` 이벤트를 낸다. Task 8이 이것을 `recordDeed` 호출로 바꾼다. 전투의 살해 행실(`recordDeed`)은 Task 10이 연결한다(첫 판의 "Task 8이 grid.ts 수정"은 Task 10으로 옮김). | Task 8 시점에 grid.ts의 전투 규칙이 없다. | 없음 |
| D8 | **topic 키** = `"name"`, `"job"`, 또는 **단서 id**(어떤 kind든). 대화 칩 = `name`, `job` + 플레이어가 아는 kind `word`·`person`·`place` 단서 전부(그 NPC가 topic을 가졌는지와 무관 — 없으면 "모른다"). 표시 라벨은 `topic.name`/`topic.job` 문자열 키와 단서 `labelKey`. | 첫 판은 한국어 라벨 문자열로 매칭(코드에 한국어, 깨지기 쉬움). spec §4.1 "수첩의 단어는 누구에게나 물어볼 수 있다". | YAML topic 키 이름 바꾸기 |
| D9 | topic 값은 **변형 목록**(`Topic[]`, YAML에선 하나만 써도 됨). 조건(`requires`, `requiresFlags`, `excludeFlags`)을 처음 만족하는 변형이 답한다. 하나도 없으면 `npc.default.unknown`. | 같은 질문에 상황별 다른 답(서고 다녀온 뒤 고백관의 질문 등)이 필요. | 없음 |
| D10 | 위기는 `npc`를 가진다. 그 NPC와 대화 중일 때만 `resolveCrisis`가 유효하고, 대화창에 선택지가 버튼으로 뜬다. `recruit`도 그 NPC와 대화 중일 때만 유효. | 위기·영입을 어디서 실행하는지 첫 판에 없음. | UI 위치만 바뀜 |
| D11 | 동료 이탈 계산용으로 `GameState.joinedAt: Record<Id, number>`(합류 순간의 `deeds.length`)를 추가. "행실 기록 1건 = 그 미덕을 어긴 일 1건"으로 정의. | 첫 판의 "가입 전 행실은 세지 않음"을 구현할 정보가 상태에 없음. | 저장 형식 v1 필드 하나 |
| D12 | 전투 시작 시 `CombatState.returnPos`(조우 칸에 들어오기 전 위치)를 저장. 도주 → `returnPos`로, 패배 → `content.start` 지도·위치, hp 1. 승리 → 조우 칸에 머묾, 아군 유닛 hp를 플레이어 hp로. `heals: true`인 지도(칼라스)에 들어오면 hp = maxHp. | 도주·회복 규칙이 첫 판에 없음. | 난이도 조정만 |
| D13 | 플레이어 공격력·동료 hp/공격력: `content/start.yaml`에 `attack`, `CompanionDef`에 `hp`, `attack`. 적 유닛 id는 `` `${creatureId}#${index}` ``, 플레이어 유닛 id는 `"player"`. 아군 배치는 조우의 `allyStart`(플레이어 → 동행 순). | 첫 판에 수치 출처가 없음. | 없음 |
| D14 | **자산 시트**: atlas를 합치지 않는다. Kenney 묶음의 `Tilemap/tilemap_packed.png`를 원본 그대로 `assets/tiles/kenney-tiny-town.png`, `assets/tiles/kenney-tiny-dungeon.png`로 둔다. 스프라이트는 `SpriteRef = { sheet: string; index: number }`(index = 행 우선, `columns` 기준). 시트 목록은 `content/tiles.yaml`의 `sheets`. | 이미지 라이브러리가 없다(PIL 없음, 의존성 추가 회피). 원본 그대로가 장부도 단순. | 그리기 호출에 시트 하나 더 |
| D15 | **크레딧 URL과 dist 검사**: `virtual:credits`는 `source`의 `https://`·`http://`를 떼고 내보낸다(링크가 아닌 글자로 표시). `audit:dist`의 외부 origin 규칙은 그대로 엄격. | 크레딧이 번들에 URL을 넣으면 Task 2 규칙에 걸림. | 크레딧이 링크가 아님 |
| D16 | 브랜치: Task 1–4는 `todo-1-skeleton`, Task 5–16은 `todo-2-kalas`. main merge·push 지점은 Task 2 끝(배포 확인), Task 4 끝(M0 완료), Task 16 끝(M1 완료) 세 번. 각 merge 전 merge 게이트(Haiku). | 배포 워크플로는 main push에서만 deploy. AGENTS 규칙 `todo-<n>-<topic>`. | 없음 |
| D17 | 소문 힌트는 추론의 **정답 단어를 절대 드러내지 않는다**. 위기 선택지와 "아는 단어로 연 topic"의 부족한 단서만 보여 준다. 부족한 추론은 그 추론의 `hintKey`로. | 정답 단어 목록을 보여 주면 3칸 규칙이 무의미(spec §4.1). | 없음 |
| D19 | 동행 중인(`party`에 있는) NPC는 지도에서 빠진다 — 그리지 않고, 막지 않고, 대화 대상이 아니다. 떠나면(`departed`) 원래 자리에 다시 선다. | 동료가 따라다니는데 원래 자리에도 서 있으면 어색하고 길을 막음. | 없음 |
| D20 | 음악 편곡 YAML(`content/music/*.yaml`)도 `assets/LEDGER.md`에 행으로 적는다. 장부 검사 대상 파일 = `assets/**`(LICENSE*·LEDGER.md 제외) + `content/music/*.yaml`. | 원곡 출처를 크레딧에 남겨야 하고, 표 하나로 충분. | 없음 |
| D18 | `companion.yaml`은 따로 두지 않고 NPC의 `companion:` 필드로 쓴다. 능력 정의는 `content/abilities.yaml`, 시작값은 `content/start.yaml`. | 첫 판의 `GameContent.abilities`·`start` 출처 파일이 없었음. | 없음 |

## Review Focus

1. 추론 칸에 같은 단어를 여러 칸에 넣는 경우 — 정답과 다르면 확정되지 않고, 정답이 같은 단어를 두 칸에 요구하면 확정(Task 6 `same word in two slots never confirms unless the answer says so`).
2. 저장 파일이 손상되었거나 미래 버전인 경우 — 예외 없이 `{ ok: false, reason }`, 현재 게임 유지(Task 11 `corrupt and future saves are rejected without throwing`).
3. 전투 중 저장·새로고침 — 전투 상태도 직렬화되어 같은 차례로 돌아옴(Task 11 `round-trips a state in the middle of combat`).
4. 대화 중 이동 키·지도 터치 — 이동 명령은 무시, 이벤트 없음(Task 7 `movement is ignored while a dialogue is open`).
5. 동료가 떠난 뒤 다시 합류할 때 중복 등록 — `party`에 같은 id 두 번 없음(Task 8 `rejoining never duplicates a companion`).

---

## 파일 구조

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, playwright.config.ts
index.html
LICENSE (MIT), LICENSE-CONTENT (CC BY-SA 4.0), README.md, AGENTS.md, CLAUDE.md
docs/TESTING_POLICY.md, docs/handoff.md (← 루트 HANDOFF.md를 옮김)
.github/workflows/pages.yml
scripts/check-content.ts        콘텐츠·장부 검사 CLI
scripts/audit-dist.ts           dist 검사 CLI
src/main.ts                     부팅·루프
src/vite-env.d.ts               vite/client 참조 + 가상 모듈 선언
src/debug-log.ts                ultima에서 복사(D2)
src/audit/dist-rules.ts         dist 규칙 (순수)
src/content/types.ts            RawContent, GameContent, Score, SpriteRef, FactKind …
src/content/load-node.ts        content/ → RawContent (node 전용)
src/content/compile.ts          RawContent → { content, errors } (순수)
src/content/denylist.ts         금지어 검사 (순수)
src/content/ledger.ts           LEDGER.md 파싱·검사·크레딧 (순수)
src/content/vite-plugin.ts      virtual:content, virtual:credits
src/core/types.ts               GameState, Command, GameEvent, CombatState …
src/core/rng.ts                 mulberry32
src/core/state.ts               createInitialState
src/core/step.ts                step() — 모드별 분배
src/core/world/move.ts          이동·충돌·출구·지형 비용·조우 진입
src/core/world/path.ts          BFS 길찾기
src/core/knowledge/notebook.ts  learn, fillSlot, openHints
src/core/dialogue/talk.ts       interact, ask, choose, endTalk, availableTopics
src/core/virtue/conduct.ts      recordDeed, canRecruit, recruit
src/core/crisis/crisis.ts       crisisOptions, resolveCrisis
src/core/combat/grid.ts         startCombat, 예고, 행동, 종료
src/core/save/serialize.ts      직렬화·검증·마이그레이션
src/save/slot-store.ts          ultima에서 복사(D3)
src/save/slots.ts               saveToSlot, loadSlot, AUTO_SLOT
src/render/viewport.ts          시야·배율 (순수)
src/render/canvas.ts            그리기
src/input/commands.ts           키·포인터 → Command | UiAction (순수)
src/ui/strings.ts               t()
src/ui/view-model.ts            상태 → 표시 데이터 (순수)
src/ui/panels.ts                DOM 패널
src/audio/score.ts              악보 파싱 (순수)
src/audio/synth.ts              칩 플레이어
src/audio/sfx.ts                효과음 생성 (순수)
content/ip-denylist.yaml, content/tiles.yaml, content/start.yaml, content/abilities.yaml
content/strings/ko.yaml, content/creatures.yaml
content/towns/kalas/{maps,npcs,facts,deduction,crisis,encounters}.yaml
content/music/{field,kalas}.yaml
assets/LEDGER.md, assets/fonts/neodgm.woff2, assets/fonts/LICENSE-neodgm.txt
assets/tiles/kenney-tiny-town.png, assets/tiles/kenney-tiny-dungeon.png, assets/tiles/LICENSE-kenney.txt
tests/unit/**, tests/scenario/**, tests/fixtures/content-min/**, tests/e2e/boot.spec.ts
```

## 핵심 타입

### `src/content/types.ts` (Task 3에서 정의)

```ts
import type { Id, Pos, Virtue } from "../core/types.ts"

export type FactKind = "person" | "place" | "word" | "song" | "meaning" | "creature"
export interface SpriteRef { readonly sheet: string; readonly index: number }

export interface Score {                        // D5. 형식은 Task 14
  readonly tempo: number                        // 4분음표 bpm
  readonly loop: boolean
  readonly channels: readonly { readonly wave: "square50" | "square25" | "triangle" | "noise"; readonly volume: number; readonly notes: string }[]
}

export interface ChoiceOption {
  readonly optionId: Id; readonly labelKey: string; readonly textKey: string
  readonly deed?: { readonly virtue: Virtue; readonly deed: Id }
  readonly grants?: readonly Id[]; readonly setsFlags?: readonly Id[]
}
export interface Topic {
  readonly textKey: string
  readonly requires?: readonly Id[]; readonly requiresFlags?: readonly Id[]; readonly excludeFlags?: readonly Id[]
  readonly grants?: readonly Id[]; readonly setsFlags?: readonly Id[]
  readonly lie?: boolean
  readonly choice?: readonly ChoiceOption[]
}
export interface CompanionDef {
  readonly virtue: Virtue; readonly joinRequires: readonly Id[]; readonly leaveAfterDeeds: number
  readonly rejoinRequires: readonly Id[]; readonly hp: number; readonly attack: number
}
export interface MapDef {
  readonly rows: readonly string[]
  readonly exits: readonly { readonly at: Pos; readonly to: Id; readonly arrive: Pos }[]
  readonly music: Id
  readonly encounters: readonly { readonly at: Pos; readonly id: Id }[]
  readonly enterFlags: readonly Id[]
  readonly heals: boolean
}
export interface NpcDef {
  readonly map: Id; readonly pos: Pos; readonly nameKey: string; readonly greetKey: string; readonly sprite: SpriteRef
  readonly topics: Readonly<Record<string, readonly Topic[]>>      // 키: "name" | "job" | 단서 id (D8, D9)
  readonly companion?: CompanionDef
}
export interface CrisisOptionDef {
  readonly requires: readonly Id[]; readonly requiresDeductions: readonly Id[]
  readonly setsFlags: readonly Id[]; readonly labelKey: string; readonly textKey: string
}
export interface GameContent {
  readonly sheets: Readonly<Record<string, { readonly file: string; readonly columns: number }>>
  readonly tiles: Readonly<Record<string, { readonly sprite: SpriteRef; readonly walk: number | null }>>   // ASCII 1글자 → 타일
  readonly playerSprite: SpriteRef
  readonly maps: Readonly<Record<Id, MapDef>>
  readonly npcs: Readonly<Record<Id, NpcDef>>
  readonly facts: Readonly<Record<Id, { readonly kind: FactKind; readonly labelKey: string; readonly hintKey: string }>>
  readonly deductions: Readonly<Record<Id, { readonly sentenceKey: string; readonly hintKey: string; readonly answer: readonly [Id, Id, Id]; readonly unlocks: readonly Id[] }>>
  readonly crises: Readonly<Record<Id, { readonly npc: Id; readonly textKey: string; readonly options: Readonly<Record<Id, CrisisOptionDef>> }>>
  readonly creatures: Readonly<Record<Id, { readonly nameKey: string; readonly evil: boolean; readonly hp: number; readonly attack: number; readonly sprite: SpriteRef; readonly lore: Id }>>
  readonly encounters: Readonly<Record<Id, { readonly map: Id; readonly grid: readonly string[]; readonly allyStart: readonly Pos[]; readonly enemies: readonly { readonly creature: Id; readonly at: Pos }[]; readonly music: Id }>>
  readonly abilities: Readonly<Record<Id, { readonly nameKey: string }>>
  readonly music: Readonly<Record<Id, Score>>
  readonly strings: Readonly<Record<string, string>>
  readonly start: { readonly map: Id; readonly pos: Pos; readonly hp: number; readonly attack: number }
}

/** content/ 아래 상대 경로("towns/kalas/npcs.yaml") → YAML 파싱 결과 */
export type RawContent = Readonly<Record<string, unknown>>
```

### `src/core/types.ts` (Task 5에서 정의)

```ts
export type Id = string
export type Dir = "n" | "e" | "s" | "w"
export type Virtue = "honesty" | "compassion" | "valor" | "justice" | "sacrifice" | "honor" | "spirituality" | "humility"
export interface Pos { readonly x: number; readonly y: number }

export interface CombatUnit {
  readonly id: Id; readonly side: "ally" | "enemy"; readonly creature: Id | null; readonly pos: Pos
  readonly hp: number; readonly attack: number; readonly defending: boolean
  readonly moved: boolean; readonly acted: boolean; readonly gone: null | "dead" | "retreated" | "fled"
}
export interface CombatState {
  readonly encounterId: Id; readonly grid: readonly string[]; readonly units: readonly CombatUnit[]
  readonly active: Id; readonly round: number
  readonly intents: Readonly<Record<Id, { readonly moveTo: Pos; readonly attack: Id | null }>>
  readonly returnPos: Pos                                         // D12
}
export type CombatAction =
  | { kind: "move"; to: Pos } | { kind: "attack"; dir: Dir } | { kind: "defend" } | { kind: "push"; dir: Dir }
  | { kind: "persuade"; dir: Dir } | { kind: "flee" } | { kind: "endTurn" }

export type Command =
  | { type: "move"; dir: Dir } | { type: "moveTo"; target: Pos } | { type: "interact"; at?: Pos }
  | { type: "ask"; topic: string } | { type: "choose"; optionId: Id } | { type: "endTalk" }
  | { type: "fillSlot"; deductionId: Id; slot: number; word: Id | null }
  | { type: "resolveCrisis"; crisisId: Id; optionId: Id } | { type: "recruit"; npcId: Id }
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
  readonly player: { readonly pos: Pos; readonly facing: Dir; readonly hp: number; readonly maxHp: number; readonly attack: number }
  readonly facts: readonly Id[]                                  // 정렬·중복 없음
  readonly deductions: Readonly<Record<Id, { readonly slots: readonly (Id | null)[]; readonly confirmed: boolean }>>
  readonly abilities: readonly Id[]                              // 정렬·중복 없음
  readonly deeds: readonly { readonly virtue: Virtue; readonly deed: Id; readonly turn: number }[]
  readonly party: readonly Id[]
  readonly departed: readonly Id[]
  readonly joinedAt: Readonly<Record<Id, number>>                // D11
  readonly crises: Readonly<Record<Id, Id>>
  readonly flags: readonly Id[]                                  // 정렬·중복 없음
  readonly dialogue: { readonly npcId: Id; readonly pendingChoice: string | null } | null   // pendingChoice = 선택을 기다리는 topic 키
  readonly combat: CombatState | null
  readonly clearedEncounters: readonly Id[]
}

export interface StepResult { readonly state: GameState; readonly events: readonly GameEvent[] }
```

### 모드별 명령 분배 (`step`, Task 5가 틀을 만들고 각 Task가 채움)

| 상태 | 유효한 명령 | 그 밖 |
|---|---|---|
| `combat !== null` | `combat` | 무시(같은 state, 이벤트 0) |
| `dialogue !== null` | `ask`, `choose`, `endTalk`, `resolveCrisis`, `recruit`, `fillSlot` | 무시 |
| 탐험 | `move`, `moveTo`, `interact`, `fillSlot` | 무시 |

아직 구현되지 않은 명령(이후 Task 몫)은 무시한다.

---
## M0 — 골격 (브랜치 `todo-1-skeleton`)

### Task 1: 저장소 골격과 작업 규칙

**Files:**
- Create: `package.json`, `package-lock.json`(npm install이 만듦), `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `src/vite-env.d.ts`, `.gitignore`, `LICENSE`, `LICENSE-CONTENT`, `README.md`, `AGENTS.md`, `docs/TESTING_POLICY.md`
- Move: `HANDOFF.md` → `docs/handoff.md` (`git mv`, D1)
- Modify: `CLAUDE.md`
- Copy+edit: `/home/taejin/ultima/src/debug-log.ts` → `src/debug-log.ts`, `/home/taejin/ultima/tests/unit/debug-log.test.ts` → `tests/unit/debug-log.test.ts` (D2)

**Interfaces:**
- Produces: npm scripts `dev | build | preview | test:unit | test:e2e | typecheck | check:content | audit:dist`; `createDebugLog(options: DebugLogOptions): DebugLog`, `debugEnabledFromUrl(href: string): boolean` (ultima와 같은 시그니처, 태그 `"[hc]"`)

- [ ] **Step 1: `package.json`**

```json
{
  "name": "hollow-codex",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test:unit": "vitest run --passWithNoTests=false",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "check:content": "node scripts/check-content.ts",
    "audit:dist": "node scripts/audit-dist.ts"
  },
  "devDependencies": {
    "@playwright/test": "1.52.0",
    "@types/node": "22.15.3",
    "typescript": "5.8.3",
    "vite": "6.3.4",
    "vitest": "3.1.3",
    "yaml": "2.9.1"
  }
}
```

Run: `npm install` → `package-lock.json` 생성, exit 0.

- [ ] **Step 2: 설정 파일**
  - `tsconfig.json`: `/home/taejin/ultima/tsconfig.json`의 `compilerOptions` 그대로(`allowImportingTsExtensions`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `types: ["node", "vitest/globals"]` 포함). `include`: `["src/**/*.ts", "tests/**/*.ts", "scripts/**/*.ts", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"]`.
  - `vite.config.ts`: `export default defineConfig({ base: "/hollow-codex/" })`.
  - `vitest.config.ts`: `defineConfig({ test: { include: ["tests/unit/**/*.test.ts", "tests/scenario/**/*.test.ts"], globals: true, environment: "node" } })` (`vitest/config`에서 import).
  - `src/vite-env.d.ts`: `/// <reference types="vite/client" />` 한 줄(가상 모듈 선언은 Task 3·4가 추가).

- [ ] **Step 3: debug-log 복사와 수정(D2)**
  - 두 파일을 복사한 뒤: 콘솔 태그 `"[u4]"` → `"[hc]"`(구현과 테스트 둘 다), 머리 주석을 "Key-point debug log so a reported issue can be traced. Quiet by default; `?debug=1` prints each entry as console.warn; the last entries stay in memory (`window.hollowDebugLog.entries()`)."로 바꾼다. 테스트의 URL `http://x/ultima/` → `http://x/hollow-codex/`. 테스트 이름 `"writes to console.warn with a [hc] tag when enabled"`.
  - Run: `grep -ri "u4\|ultima" src tests` → 출력 없음.
  - Run: `npx vitest run tests/unit/debug-log.test.ts` → `5 passed`.

- [ ] **Step 4: `index.html` + `src/main.ts`**
  - `index.html`: `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<title>빈 경전</title>`, body에 `<h1 id="boot-title">빈 경전</h1>`, `<canvas id="screen"></canvas>`, `<div id="ui"></div>`, `<script type="module" src="/src/main.ts"></script>`. 인라인 스타일: body 배경 `#111`, 글자 `#eee`, canvas `image-rendering: pixelated`.
  - `src/main.ts`: `createDebugLog({ enabled: debugEnabledFromUrl(location.href) })`를 만들고 `log.log("boot")`. 다른 일은 하지 않는다.

- [ ] **Step 5: 라이선스와 README**
  - `LICENSE`: MIT 전문, `Copyright (c) 2026 TaejinKim7-dev`.
  - `LICENSE-CONTENT`: 맨 위에 적용 범위 — "`content/` 아래의 모든 파일과 `assets/`에서 `assets/LEDGER.md`가 이 프로젝트 저작(author `TaejinKim7-dev`)으로 기록한 파일은 CC BY-SA 4.0. 외부 자산은 장부에 적힌 각자의 라이선스." 그 아래 `https://creativecommons.org/licenses/by-sa/4.0/legalcode.txt`를 `curl -fsSL`로 받은 전문.
  - `README.md`: 한 문단 소개(spec §0을 우리 말로), 실행(`npm ci`, `npm run dev`), 라이선스 두 줄, 원작과 무관하다는 한 줄은 쓰지 않는다(원작 이름을 쓰게 되므로) — 대신 "모든 이름과 글은 이 프로젝트에서 새로 지었다".

- [ ] **Step 6: 작업 규칙 문서**
  - `AGENTS.md` (한국어). 절:
    1. 읽는 순서: `AGENTS.md` → `docs/handoff.md` 마지막 절 → spec → 진행 중 plan.
    2. 절대 금지: 원작 데이터·참고 문서(`u4-alt-manual.pdf`, `origin.txt`)·`/home/taejin/ultima`의 번역문·secret 커밋 금지, spec §2.2 금지 목록(`content/ip-denylist.yaml`)의 이름·문장 금지(주석 포함), 실패 테스트 삭제·약화 금지.
    3. 개발 방식: TDD(RED 출력 기록 → 최소 구현 GREEN → 리팩터), core 순수성, 노드 타입 제거 호환 규칙(Global Constraints 그대로).
    4. 테스트 실행: merge 게이트와 긴 실행은 Haiku 서브에이전트, 수정 뒤 e2e 금지(사용자 확인).
    5. 진행→저장(커밋)→기록(`docs/handoff.md`)→확인.
    6. Git: `todo-<n>-<topic>` 브랜치 → 게이트 통과 후 `main`에 직접 merge(PR 없음) → push.
    7. merge 게이트 목록(Global Constraints의 7개 명령).
    8. 실패를 숨기지 않는다: exit code와 실패 출력을 그대로 보고.
    xu4·wasm·cmake·원본 zip 관련 문장은 옮기지 않는다.
  - `CLAUDE.md`를 다음으로 교체:
    ```markdown
    # CLAUDE.md

    작업 규칙의 정식 문서는 `AGENTS.md`다. 세션을 시작하면 `AGENTS.md` → `docs/handoff.md` → `docs/superpowers/specs/2026-10-06-hollow-codex-design.md` → `docs/superpowers/plans/`의 진행 중 계획 순서로 읽는다.

    절대 금지: 원작 이름·문장·음악·데이터, `u4-alt-manual.pdf`, `origin.txt`, `/home/taejin/ultima`의 번역문을 이 저장소에 넣지 않는다(spec §2).
    ```
  - `git mv HANDOFF.md docs/handoff.md` 후 그 문서 맨 아래에 절 `## 2026-10-06 Task 1` 추가(한 줄: "골격·규칙 문서 작성, 게이트 결과는 아래").
  - `docs/TESTING_POLICY.md`: 4절 — 단위(core·content·audio·render 순수부, Vitest, RED 먼저), 시나리오(`tests/scenario`, 실제 `content/`로 명령 재생), e2e 최소(`tests/e2e/boot.spec.ts` 하나, Chromium), 사용자 수동 확인(화면·소리·조작감은 사용자가 판정, 에이전트는 dev 서버 URL을 넘김).

- [ ] **Step 7: `.gitignore`**

```
node_modules/
dist/
test-results/
playwright-report/
.superpowers/
*.pdf
origin.txt
client_secret_*.json*
```

- [ ] **Step 8: 확인** — Run: `npm run test:unit && npm run typecheck && npm run build` → 세 명령 모두 exit 0, `dist/index.html` 존재.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "chore: project skeleton, licenses and working rules"
```

### Task 2: Pages 배포와 dist 검사

**Files:**
- Create: `.github/workflows/pages.yml`, `scripts/audit-dist.ts`, `scripts/check-content.ts`(자리표시), `src/audit/dist-rules.ts`, `tests/unit/dist-rules.test.ts`

**Interfaces:**
- Produces: `auditFiles(files: readonly DistFile[]): string[]`, `interface DistFile { path: string; text: string | null; size: number }` (`path`는 `dist/` 기준 상대 경로, `text`는 `.js .css .html .json .svg .txt .webmanifest`만 읽고 나머지는 `null`), `BUNDLE_BUDGET_BYTES = 5 * 1024 * 1024`, `ALLOWED_ORIGINS: readonly string[] = []`

- [ ] **Step 1: 실패 테스트** `tests/unit/dist-rules.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { auditFiles, BUNDLE_BUDGET_BYTES } from "../../src/audit/dist-rules.ts"

const js = (path: string, text: string) => ({ path, text, size: text.length })

describe("dist audit", () => {
  it("flags an external origin in shipped JS", () => {
    const out = auditFiles([js("assets/a.js", 'fetch("https://example.com/x")')])
    expect(out.some((m) => m.includes("assets/a.js") && m.includes("https://example.com"))).toBe(true)
  })
  it("allows the SVG namespace", () => {
    expect(auditFiles([js("assets/a.js", 'createElementNS("http://www.w3.org/2000/svg","svg")')])).toEqual([])
  })
  it("flags source maps", () => {
    expect(auditFiles([{ path: "assets/a.js.map", text: "{}", size: 2 }])).toHaveLength(1)
  })
  it("flags banned reference files", () => {
    const out = auditFiles([
      { path: "u4-alt-manual.pdf", text: null, size: 10 },
      { path: "docs/origin.txt", text: "", size: 0 }
    ])
    expect(out).toHaveLength(2)
  })
  it("flags a bundle over the budget", () => {
    const out = auditFiles([{ path: "assets/big.png", text: null, size: BUNDLE_BUDGET_BYTES + 1 }])
    expect(out.some((m) => m.includes("budget"))).toBe(true)
  })
  it("passes a clean dist", () => {
    expect(auditFiles([js("index.html", "<html></html>"), js("assets/a.js", "console.log(1)")])).toEqual([])
  })
})
```

- [ ] **Step 2: RED** — Run: `npx vitest run tests/unit/dist-rules.test.ts` → FAIL, `Failed to load url ../../src/audit/dist-rules.ts` 또는 `auditFiles is not a function`.

- [ ] **Step 3: 구현** `src/audit/dist-rules.ts`
  - 규칙: (a) `text`에서 `/https?:\/\/[^\s"'`)<>]+/g`로 찾은 URL 중 `http://www.w3.org/`로 시작하지 않고 `ALLOWED_ORIGINS`의 어느 origin으로도 시작하지 않는 것 → `` `${path}: external origin ${url}` ``. (b) `path`가 `.map`으로 끝나면 → `` `${path}: source map shipped` ``. (c) basename이 `u4-alt-manual.pdf` 또는 `origin.txt`, 또는 확장자 `.pdf` → `` `${path}: banned reference file` ``. (d) 크기 합 > `BUNDLE_BUDGET_BYTES` → `` `dist: total ${n} bytes over budget ${BUNDLE_BUDGET_BYTES}` ``.
  - `scripts/audit-dist.ts`: `dist/`를 재귀로 읽어 `DistFile[]`을 만들고 `auditFiles` 호출. 위반을 한 줄씩 `console.error`, 있으면 `process.exit(1)`, 없으면 `audit:dist: ok (<파일 수> files, <총 바이트> bytes)` 출력. `dist/`가 없으면 `audit:dist: dist/ not found — run npm run build` 후 exit 1.
  - `scripts/check-content.ts`(자리표시): `console.log("check:content: placeholder until Task 3")` 한 줄.

- [ ] **Step 4: GREEN** — Run: `npx vitest run tests/unit/dist-rules.test.ts` → `6 passed`. Run: `npm run build && npm run audit:dist` → `audit:dist: ok`.

- [ ] **Step 5: `pages.yml`** — ultima 워크플로의 구조(`on: push/pull_request [main] + workflow_dispatch`, `permissions: contents: read`, build/deploy 두 job, deploy의 `if`·`concurrency`·`environment`)를 그대로 쓰고, 머리 주석은 이 저장소용으로 새로 쓴다(원작 이름 없음). 고정 SHA:
  - `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`
  - `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0` (`node-version: "22.23.3"`, `cache: npm`)
  - `actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0` (`path: dist`, `include-hidden-files: "true"`)
  - `actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0`
  - `actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1`
  - build 단계 순서: `npm ci` → `npm run typecheck` → `npm run test:unit` → `npm run check:content` → `npm run build` → `npm run audit:dist` → `touch dist/.nojekyll` → upload.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "ci: Pages workflow and dist audit"
```

- [ ] **Step 7: Pages 소스 설정** — Run: `gh api -X POST repos/TaejinKim7-dev/hollow-codex/pages -f build_type=workflow` (422 "already exists"면 `gh api -X PUT repos/TaejinKim7-dev/hollow-codex/pages -f build_type=workflow`). 확인: `gh api repos/TaejinKim7-dev/hollow-codex/pages --jq .build_type` → `workflow`.

- [ ] **Step 8: merge·배포 (D16, 컨트롤러가 리뷰 통과 후 실행)** — merge 게이트(Haiku) 전부 exit 0 → `git checkout main && git merge --ff-only todo-1-skeleton && git push origin main && git checkout todo-1-skeleton` → `gh run watch $(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status` → exit 0 → `curl -s -o /dev/null -w "%{http_code}" https://taejinkim7-dev.github.io/hollow-codex/` → `200`. 결과를 `docs/handoff.md`에 기록하고 커밋 `docs: record first Pages deploy`.

### Task 3: 콘텐츠 파이프라인 (참조 검사 + 금지어 검사)

**Files:**
- Create: `src/content/types.ts`(위 "핵심 타입" 전부), `src/core/types.ts`(`Id`, `Pos`, `Virtue`, `Dir`만 — 나머지는 Task 5가 추가), `src/content/load-node.ts`, `src/content/compile.ts`, `src/content/denylist.ts`, `src/content/vite-plugin.ts`, `content/ip-denylist.yaml`, `content/tiles.yaml`, `content/start.yaml`, `content/abilities.yaml`, `content/strings/ko.yaml`, `content/towns/kalas/maps.yaml`(자리표시 지도 1장), `tests/unit/content-compile.test.ts`, `tests/unit/denylist.test.ts`, `tests/fixtures/content-min/**`
- Modify: `vite.config.ts`, `src/vite-env.d.ts`, `scripts/check-content.ts`(자리표시 → 실제)

**Interfaces:**
- Produces:
  - `loadContentDir(dir: string): RawContent` — `dir` 아래 `**/*.yaml`을 `yaml`의 `parse`로 읽어 상대 경로(구분자 `/`) → 값. 정렬된 경로 순서.
  - `compileContent(raw: RawContent): { content: GameContent | null; errors: string[] }` — 순수. 오류가 하나라도 있으면 `content: null`. 오류를 전부 모아 돌려준다.
  - `parseDenylist(value: unknown): { latin: string[]; hangul: string[] }`, `findDenied(texts: Iterable<{ where: string; text: string }>, deny: { latin: readonly string[]; hangul: readonly string[] }): string[]` — 결과 항목 형식 `` `${where}: denied term "${term}"` ``.
  - `hollowContent(contentDir: string): Plugin` (vite-plugin.ts) — `virtual:content` 기본 내보내기 = `GameContent`.

**YAML 스키마 (컴파일러가 이 모양만 받는다; Pos는 `[x, y]`, SpriteRef는 `[sheet, index]`):**

| 파일 | 모양 |
|---|---|
| `ip-denylist.yaml` | `{ latin: string[], hangul: string[] }` |
| `tiles.yaml` | `{ sheets: { <id>: { file, columns } }, tiles: { "<1글자>": { sprite: [sheet, i], walk: number \| null } }, player: [sheet, i] }` |
| `start.yaml` | `{ map, pos: [x,y], hp, attack }` |
| `abilities.yaml` | `[{ id, name }]` |
| `strings/ko.yaml` | `{ <key>: string }` (평평한 맵) |
| `creatures.yaml` | `[{ id, name, evil, hp, attack, sprite: [s,i], lore }]` |
| `music/<name>.yaml` | `Score` 하나, id = `music.<name>` |
| `towns/<t>/maps.yaml` | `[{ id, rows: string[], exits: [{ at, to, arrive }], music, encounters?: [{ at, id }], enterFlags?: [], heals?: bool }]` |
| `towns/<t>/npcs.yaml` | `[{ id, map, pos, name, greet, sprite, topics: { <key>: Topic \| Topic[] }, companion? }]` — Topic YAML 키: `text, requires, requiresFlags, excludeFlags, grants, setsFlags, lie, choice: [{ id, label, text, deed: { virtue, deed }, grants, setsFlags }]` |
| `towns/<t>/facts.yaml` | `[{ id, kind, label, hint }]` |
| `towns/<t>/deduction.yaml` | `[{ id, sentence, hint, answer: [a, b, c], unlocks: [] }]` |
| `towns/<t>/crisis.yaml` | `[{ id, npc, text, options: { <optionId>: { requires?, requiresDeductions?, setsFlags?, label, text } } }]` |
| `towns/<t>/encounters.yaml` | `[{ id, map, grid: string[], allyStart: [[x,y]…], enemies: [{ creature, at }], music }]` |

YAML 키 `name/greet/label/hint/sentence/text` → 컴파일 결과의 `nameKey/greetKey/labelKey/hintKey/sentenceKey/textKey`. 위 표에 없는 경로의 파일은 오류 `` `${file}: unknown content file` ``. 한 파일이 비어 있거나 없으면 그 부분은 빈 객체.

**컴파일러 검사 목록(오류 메시지는 항상 `파일 경로: …`와 문제의 id/키를 포함):**
1. 모양: 필수 필드 누락·타입 틀림.
2. id 중복(같은 종류 안).
3. 참조: 지도 출구 `to`·`start.map`·NPC `map`·조우 `map`·지도 `encounters[].id` → 존재하는 지도/조우; `grants`·`requires`·`joinRequires`·`rejoinRequires`·위기 `requires`·추론 `answer`·생물 `lore` → 존재하는 단서; `requiresDeductions` → 추론; `unlocks` → 능력; 위기 `npc` → NPC; 조우 `enemies[].creature` → 생물; `music` → 악보; `sprite.sheet` → `sheets`; topic 키 → `name`|`job`|단서 id(D8). `deed.virtue` → `Virtue` 8개 중 하나.
4. 문자열 키: 모든 `*Key`가 `strings`에 있음. 그리고 `npc.default.unknown`, `topic.name`, `topic.job`은 항상 있어야 한다.
5. 지도: 모든 행 길이가 같음(`` `rows of unequal width` ``), 모든 글자가 `tiles`에 있음(`` `tile "${ch}" missing from tiles.yaml` ``), 출구·조우·NPC·`start.pos`·`allyStart`·적 위치가 지도/격자 안이고 `walk !== null`인 칸.
6. 획득 경로: 추론의 정답 단어 각각이 어떤 topic 또는 choice의 `grants`에 있음(`` `answer word ${id} has no grant path` ``).
7. 추론 `answer` 길이 3, 정답 단어의 kind는 `word`.
8. 금지어: `findDenied`를 strings의 모든 값, 모든 id, 모든 topic 키, RawContent의 모든 파일 경로에 실행. `ip-denylist.yaml` 자체는 대상에서 뺀다.

- [ ] **Step 1: fixture** `tests/fixtures/content-min/`
  - `tiles.yaml`: `sheets: { test: { file: test.png, columns: 4 } }`, `tiles: { ".": { sprite: [test, 0], walk: 1 }, "#": { sprite: [test, 1], walk: null } }`, `player: [test, 2]`
  - `start.yaml`: `{ map: map.min, pos: [1, 1], hp: 10, attack: 3 }`
  - `abilities.yaml`: `[{ id: ability.min, name: ability.min.name }]`
  - `ip-denylist.yaml`: `{ latin: [forbiddenland], hangul: [금지된땅] }`
  - `music/min.yaml`: `{ tempo: 120, loop: true, channels: [{ wave: square50, volume: 0.5, notes: "A4/4" }] }`
  - `towns/min/maps.yaml`: 지도 `map.min`, rows `["####", "#..#", "####"]`(4×3), `exits: []`, `music: music.min`
  - `towns/min/facts.yaml`: `fact.min.person`(person), `word.min.answer`(word)
  - `towns/min/npcs.yaml`: `npc.min.sage`, map `map.min`, pos `[2,1]`, name `npc.min.sage.name`, greet `npc.min.sage.greet`, sprite `[test, 3]`, topics: `name: { text: npc.min.sage.name.t, grants: [fact.min.person] }`, `job: { text: npc.min.sage.job.t, grants: [word.min.answer] }`
  - `towns/min/deduction.yaml`: `deduction.min`, answer `[word.min.answer, word.min.answer, word.min.answer]`, unlocks `[ability.min]`
  - `strings/ko.yaml`: 위에서 쓴 모든 키 + `npc.default.unknown`, `topic.name`, `topic.job`.

- [ ] **Step 2: 실패 테스트** `tests/unit/content-compile.test.ts` — 헬퍼 `const raw = () => loadContentDir("tests/fixtures/content-min")`, `const withFile = (path: string, value: unknown) => ({ ...raw(), [path]: value })`.

```ts
it("compiles the minimal fixture without errors", () => {
  const { content, errors } = compileContent(raw())
  expect(errors).toEqual([])
  expect(content?.maps["map.min"]?.rows).toEqual(["####", "#..#", "####"])
  expect(content?.npcs["npc.min.sage"]?.topics["job"]?.[0]?.grants).toEqual(["word.min.answer"])
  expect(content?.tiles["."]).toEqual({ sprite: { sheet: "test", index: 0 }, walk: 1 })
  expect(content?.start).toEqual({ map: "map.min", pos: { x: 1, y: 1 }, hp: 10, attack: 3 })
})
it("reports a topic that grants an unknown fact", () => {
  // npcs.yaml을 복사해 job.grants에 fact.missing 추가
  const { content, errors } = compileContent(withFile("towns/min/npcs.yaml", /* … */))
  expect(content).toBeNull()
  expect(errors.some((e) => e.includes("towns/min/npcs.yaml") && e.includes("fact.missing"))).toBe(true)
})
it("reports a missing string key")              // name: npc.nobody.name → 오류에 "npc.nobody.name"
it("reports a map exit to an unknown map")      // exits: [{ at: [1,1], to: map.nowhere, arrive: [1,1] }] → "map.nowhere"
it("reports rows of unequal width")             // rows ["####", "#..", "####"] → "unequal width"
it("reports a deduction answer word nobody can grant") // job.grants 비움 → "word.min.answer has no grant path"
it("reports a tile character missing from tiles.yaml") // rows에 "~" → 'tile "~" missing'
it("reports a topic key that is not name, job or a fact id") // topics: { 아무거나: … } → "아무거나"
it("reports every error at once")               // 위 두 가지를 함께 넣으면 errors.length >= 2
it("reports a denied term in a string value")   // strings에 "x: 금지된땅의 노래" → 'denied term "금지된땅"'
```

  `tests/unit/denylist.test.ts`:

```ts
const deny = { latin: ["britannia", "cove", "lord british"], hangul: ["브리타니아"] }
it("catches a denied word regardless of case", () => {
  const out = findDenied([{ where: "strings:greet", text: "Welcome to BRITANNIA" }], deny)
  expect(out).toEqual(['strings:greet: denied term "britannia"'])
})
it("catches a Hangul transliteration", () => {
  expect(findDenied([{ where: "w", text: "브리타니아의 땅" }], deny)).toHaveLength(1)
})
it("matches multi-word terms across spaces, underscores and hyphens", () => {
  expect(findDenied([{ where: "w", text: "npc.lord_british" }, { where: "v", text: "Lord-British" }], deny)).toHaveLength(2)
})
it("does not flag a denied term inside a longer word", () => {
  expect(findDenied([{ where: "w", text: "they discovered the recovery" }], deny)).toEqual([])
})
it("ignores clean text", () => {
  expect(findDenied([{ where: "w", text: "칼라스의 등불" }], deny)).toEqual([])
})
```

- [ ] **Step 3: RED** — Run: `npx vitest run tests/unit/content-compile.test.ts tests/unit/denylist.test.ts` → FAIL(모듈 없음).

- [ ] **Step 4: 구현** — `load-node.ts`(`node:fs` `readdirSync` 재귀 + `yaml` `parse`), `denylist.ts`(D4의 매칭), `compile.ts`(위 검사 목록, 순서대로 오류 누적; 금지어 목록은 `raw["ip-denylist.yaml"]`). 단서 kind가 `FactKind`가 아니면 오류.

- [ ] **Step 5: `content/ip-denylist.yaml`** — D4 규칙으로 spec §2.2 전부:
  - `latin`: `ultima, britannia, sosaria, lord british, avatar, moongate, trammel, felucca, codex of ultimate wisdom, stygian abyss, hawkwind, mondain, minax, exodus, britain, yew, minoc, trinsic, jhelom, skara brae, moonglow, magincia, vesper, cove, paws, buccaneer's den, serpent's hold, empath abbey, lycaeum, ahm, mu, ra, beh, cah, summ, om, lum, rune of honesty, bell of courage, book of truth, candle of love, three part key`
  - `hangul`: `울티마, 브리타니아, 소사리아, 로드 브리티시, 로드브리티시, 아바타, 문게이트, 트래멀, 펠루카, 궁극적 지혜의 경전, 궁극의 지혜, 심연, 호크윈드, 몬데인, 미낙스, 엑소더스, 브리튼, 미녹, 트린식, 젤롬, 스카라 브레, 스카라브레, 문글로우, 마진시아, 베스퍼, 코브, 버커니어, 서펜트 홀드, 엠패스 애비, 라이시움`
  - 파일 맨 위 주석: "spec §2.2의 금지 목록. 이 파일 자체는 검사 대상이 아니다. 1음절·일반 낱말이 되는 한글 음역은 뺐다(D4)."

- [ ] **Step 6: 최소 실제 콘텐츠** (Task 15가 확장): `content/tiles.yaml`(시트 `town` 파일 `kenney-tiny-town.png` columns 12, 타일 `.` 풀 walk 1, `#` 벽 null, `player: [town, 84]` — 인덱스는 Task 15가 실제 그림에 맞춰 고친다), `content/start.yaml`(`map.field`, `[2,2]`, hp 12, attack 3), `content/abilities.yaml`(`ability.see-lies`), `content/strings/ko.yaml`(필수 3키 + `ability.see-lies.name: 거짓을 보는 눈`), `content/towns/kalas/maps.yaml`(`map.field` 5×5 벽 테두리, music `music.field`), `content/music/field.yaml`(Step 1 fixture와 같은 한 음 — Task 15가 교체).

- [ ] **Step 7: Vite 연결**
  - `vite-plugin.ts`: `resolveId(id)`가 `"virtual:content"`면 `"\0virtual:content"`; `load`에서 `loadContentDir` + `compileContent`, 오류가 있으면 `this.error(errors.join("\n"))`, 아니면 `` `export default ${JSON.stringify(content)}` ``. `configureServer`에서 `server.watcher.add(contentDir)`, `content/` 파일 변경 시 가상 모듈 무효화 + `server.ws.send({ type: "full-reload" })`.
  - `vite.config.ts`: `plugins: [hollowContent(resolve(import.meta.dirname, "content"))]`.
  - `src/vite-env.d.ts`에 추가: `declare module "virtual:content" { import type { GameContent } from "./content/types.ts"; const content: GameContent; export default content }`.
  - `scripts/check-content.ts`: 같은 두 함수, 오류를 `console.error`로 한 줄씩, 있으면 exit 1, 없으면 `check:content: ok (<지도 수> maps, <NPC 수> npcs, <단서 수> facts)`.
  - `src/main.ts`: `import content from "virtual:content"` 후 `log.log("content", { maps: Object.keys(content.maps).length })`.

- [ ] **Step 8: GREEN** — Run: `npx vitest run tests/unit/content-compile.test.ts tests/unit/denylist.test.ts` → 전부 passed. Run: `npm run check:content` → `check:content: ok (1 maps, 0 npcs, 0 facts)`. Run: `npm run typecheck && npm run build` → exit 0.

- [ ] **Step 9: 커밋** `feat(content): YAML content compiler with reference and denylist checks`

### Task 4: 자산 장부, 글꼴, 크레딧

**Files:**
- Create: `src/content/ledger.ts`, `tests/unit/ledger.test.ts`, `assets/LEDGER.md`, `src/ui/fonts.css`
- Copy: `/home/taejin/ultima/public/fonts/neodgm.woff2` → `assets/fonts/neodgm.woff2`, `/home/taejin/ultima/public/fonts/LICENSE.txt` → `assets/fonts/LICENSE-neodgm.txt`
- Modify: `src/content/vite-plugin.ts`, `scripts/check-content.ts`, `src/vite-env.d.ts`, `src/main.ts`

**Interfaces:**
- Produces:
  - `interface LedgerRow { path: string; source: string; author: string; license: string }`
  - `parseLedger(markdown: string): LedgerRow[]` — 첫 표의 머리글 `| path | source | author | license |`와 구분 줄 다음 행들. 칸 양끝 공백·백틱 제거.
  - `checkLedger(rows: readonly LedgerRow[], files: readonly string[]): string[]` — `files`는 저장소 기준 경로(D20의 장부 대상 파일 목록).
  - `ALLOWED_LICENSES = ["CC0-1.0", "CC-BY-3.0", "CC-BY-4.0", "CC-BY-SA-3.0", "CC-BY-SA-4.0", "OFL-1.1"] as const`
  - `toCredits(rows: readonly LedgerRow[]): LedgerRow[]` — `source`의 `https://`/`http://` 제거(D15).
  - `virtual:credits` 기본 내보내기 = `toCredits(parseLedger(LEDGER.md))`.

- [ ] **Step 1: 실패 테스트** `tests/unit/ledger.test.ts`

```ts
const md = [
  "# Asset ledger", "",
  "| path | source | author | license |",
  "|---|---|---|---|",
  "| `assets/fonts/neodgm.woff2` | https://github.com/neodgm/neodgm | Eunbin Jeong | OFL-1.1 |"
].join("\n")
const row = (license: string, path = "assets/x.png") => ({ path, source: "s", author: "a", license })

it("parses the ledger table", () => {
  expect(parseLedger(md)).toEqual([{ path: "assets/fonts/neodgm.woff2", source: "https://github.com/neodgm/neodgm", author: "Eunbin Jeong", license: "OFL-1.1" }])
})
it("flags an asset file missing from the ledger", () => {
  expect(checkLedger([], ["assets/tiles/a.png"])).toEqual(["assets/tiles/a.png: not in assets/LEDGER.md"])
})
it("flags a ledger row whose file does not exist", () => {
  expect(checkLedger([row("CC0-1.0")], [])).toEqual(["assets/x.png: listed in assets/LEDGER.md but missing"])
})
it("rejects NC and ND licenses", () => {
  expect(checkLedger([row("CC-BY-NC-4.0")], ["assets/x.png"])).toHaveLength(1)
  expect(checkLedger([row("CC-BY-ND-4.0")], ["assets/x.png"])).toHaveLength(1)
})
it("accepts every allowed license", () => {
  for (const l of ALLOWED_LICENSES) expect(checkLedger([row(l)], ["assets/x.png"])).toEqual([])
})
it("ignores LEDGER.md and license text files themselves", () => {
  expect(checkLedger([], ["assets/LEDGER.md", "assets/fonts/LICENSE-neodgm.txt", "assets/tiles/LICENSE-kenney.txt"])).toEqual([])
})
it("credits strip the URL scheme", () => {
  expect(toCredits(parseLedger(md))[0]?.source).toBe("github.com/neodgm/neodgm")
})
```

  (`ignores …`: basename이 `LICENSE`로 시작하는 파일과 `assets/LEDGER.md`는 제외.)

- [ ] **Step 2: RED** — Run: `npx vitest run tests/unit/ledger.test.ts` → FAIL(모듈 없음).
- [ ] **Step 3: 구현** → Run 같은 명령 → `7 passed`.
- [ ] **Step 4: 글꼴 복사와 해시 확인** — 복사 후 Run: `sha256sum assets/fonts/neodgm.woff2 assets/fonts/LICENSE-neodgm.txt` → 각각 `0c0ca9cd73f692a5da5d7fb39737902aa9ea312537237779972a9d81ef0a33bf`, `c1997f54b659ff8bbe2addf4e7f03fb823db7d1b81b043fb2633183b1fc0c2f0`.
- [ ] **Step 5: `assets/LEDGER.md`** — 머리말 한 문단("`assets/`의 모든 파일은 이 표에 있어야 한다. `npm run check:content`가 검사한다.") + 표 첫 행:
  `| assets/fonts/neodgm.woff2 | https://github.com/neodgm/neodgm | Copyright (c) 2017-2021, Eunbin Jeong (Dalgona.) <project-neodgm@dalgona.dev> | OFL-1.1 |`
  `| content/music/field.yaml | 자리표시 한 음(Task 15에서 편곡으로 교체) | TaejinKim7-dev | CC-BY-SA-4.0 |`
- [ ] **Step 6: 연결**
  - `check-content.ts`가 장부 대상 파일(D20: `assets/**` 재귀 + `content/music/*.yaml`)을 나열해 `checkLedger(parseLedger(readFileSync("assets/LEDGER.md", "utf8")), files)`도 실행. 출력 끝에 `, <n> ledger files` 추가(LICENSE*·LEDGER.md 제외한 수).
  - `vite-plugin.ts`에 `virtual:credits`(같은 방식) 추가, `src/vite-env.d.ts`에 선언.
  - `src/ui/fonts.css`: `@font-face { font-family: "NeoDunggeunmo"; src: url("../../assets/fonts/neodgm.woff2") format("woff2"); font-display: swap }` + `body { font-family: "NeoDunggeunmo", monospace }`. `src/main.ts`에서 `import "./ui/fonts.css"`.
- [ ] **Step 7: 확인** — Run: `npm run check:content` → `check:content: ok (1 maps, 0 npcs, 0 facts, 2 ledger files)`. Run: `npm run build && npm run audit:dist` → `audit:dist: ok`, `ls dist/assets | grep woff2` → 파일 하나.
- [ ] **Step 8: 커밋** `feat(assets): asset ledger check, NeoDunggeunmo font and credits`
- [ ] **Step 9: M0 merge·배포(D16, 컨트롤러)** — merge 게이트(Haiku) → main ff-merge·push → `gh run watch … --exit-status` → Pages `200`. `docs/handoff.md`에 "M0 완료: Pages에서 Neo둥근모 제목 확인 요청" 기록. 사용자에게 URL을 주고 글꼴 확인을 요청하되, 답을 기다리지 않고 Task 5로 간다(M0 완료 기준 = spec §8 M0, 게이트 exit 0과 배포 200은 자동 확인됨).

---
## M1 — 칼라스 수직 슬라이스 (브랜치 `todo-2-kalas`, main에서 새로 딴다)

### 공용 테스트 fixture `tests/unit/core/fixture.ts` (Task 5가 만들고 Task 6–13이 쓴다)

`testContent(): GameContent` — 코드로 만든 작은 콘텐츠. `compileContent`를 거치지 않는다. 문자열은 `strings`에 키 = 값(키 그대로)으로 넣는다. 값은 아래로 고정한다(테스트들이 이 좌표·id에 기대므로 바꾸지 말 것).

```
tiles:  "." 풀 walk 1 · "," 덤불 walk 2 · ">" 문 walk 1 · "#" 벽 null      sheets: { t: { file: "t.png", columns: 4 } }, playerSprite { t, 0 }

map.a (6×5)          map.b (4×3)
######               ####
#..,.#   y=1         #..#
#....>   y=2         ####
#....#   y=3
######
```

- `map.a`: exits `[{ at: (5,2), to: "map.b", arrive: (1,1) }]`, music `music.a`, encounters `[{ at: (1,3), id: "enc.a" }]`, enterFlags `[]`, heals `true`.
- `map.b`: exits `[]`, music `music.b`, encounters `[]`, enterFlags `["flag.visited-b"]`, heals `false`.
- `start`: `{ map: "map.a", pos: (1,1), hp: 10, attack: 3 }`.
- 단서: `word.alpha`, `word.beta`, `word.gamma`, `word.decoy`(word) · `fact.secret`(meaning) · `fact.person.sage`(person) · `fact.slime-lore`, `fact.bandit-lore`(creature). labelKey/hintKey = `` `${id}.label` ``/`` `${id}.hint` ``.
- NPC `npc.sage`: map.a (3,3), topics:
  - `name`: `[{ textKey: "sage.name", grants: ["fact.person.sage"] }]`
  - `job`: `[{ textKey: "sage.job", grants: ["word.alpha", "word.decoy"] }]`
  - `word.alpha`: `[{ textKey: "sage.alpha", grants: ["word.beta"] }]`
  - `word.beta`: `[{ textKey: "sage.beta", requires: ["fact.secret"], grants: ["word.gamma"] }]`
  - `fact.person.sage`: `[{ textKey: "sage.self", lie: true }]`
  - `word.decoy`: `[{ textKey: "sage.ask", excludeFlags: ["flag.asked"], choice: [ { optionId: "opt.honest", labelKey: "o.h", textKey: "o.h.t", grants: ["fact.secret"], setsFlags: ["flag.asked"] }, { optionId: "opt.lie", labelKey: "o.l", textKey: "o.l.t", deed: { virtue: "honesty", deed: "deed.lie" }, setsFlags: ["flag.asked"] } ] }, { textKey: "sage.asked" }]`
- NPC `npc.ally`: map.b (2,1), topics `name`, `job`(grants 없음), companion `{ virtue: "honesty", joinRequires: ["fact.secret"], leaveAfterDeeds: 2, rejoinRequires: ["word.gamma"], hp: 6, attack: 2 }`.
- 추론 `deduction.test`: answer `["word.alpha", "word.beta", "word.gamma"]`, unlocks `["ability.see-lies"]`, sentenceKey/hintKey `deduction.test.sentence`/`.hint`.
- 위기 `crisis.test`: npc `npc.sage`, options `opt.a: { requires: ["fact.secret"], requiresDeductions: [], setsFlags: ["flag.a"], labelKey: "opt.a.label", textKey: "opt.a.text" }`, `opt.b: { requires: [], requiresDeductions: ["deduction.test"], setsFlags: ["flag.b"], labelKey: "opt.b.label", textKey: "opt.b.text" }`, textKey `"crisis.test.text"`.
- 생물: `creature.slime { evil: false, hp: 4, attack: 2, lore: "fact.slime-lore" }`, `creature.bandit { evil: true, hp: 3, attack: 4, lore: "fact.bandit-lore" }`.
- 조우 `enc.a`: map.a, grid 5×5 전부 `"."`, allyStart `[(2,4), (1,4), (3,4)]`, enemies `[{ creature: "creature.slime", at: (2,0) }, { creature: "creature.bandit", at: (4,1) }]`, music `music.battle`.
- 능력 `ability.see-lies`. 악보 `music.a`, `music.b`, `music.battle`: 한 음짜리.

같은 파일의 헬퍼: `deepFreeze<T>(x: T): T`, `stateWith(patch: Partial<GameState>): GameState`(= `deepFreeze({ ...createInitialState(testContent(), 1), ...patch })`), `run(state, commands: Command[]): { state; events }`(차례로 `step`, 이벤트 이어 붙임).

### Task 5: 코어 상태와 이동

**Files:**
- Create: `src/core/types.ts`(전체로 확장), `src/core/rng.ts`, `src/core/state.ts`, `src/core/step.ts`, `src/core/world/move.ts`, `src/core/world/path.ts`, `src/core/combat/grid.ts`(최소 `startCombat`, D6), `tests/unit/core/fixture.ts`, `tests/unit/core/move.test.ts`, `tests/unit/core/path.test.ts`, `tests/unit/core/purity.test.ts`

**Interfaces:**
- Consumes: `GameContent`, `MapDef` (Task 3)
- Produces:
  - `nextRandom(rng: number): { value: number; rng: number }` — mulberry32, `value ∈ [0, 1)`.
  - `createInitialState(content: GameContent, seed: number): GameState` — `rng = seed >>> 0`, `turn 0`, `mapId/pos = content.start`, `facing "s"`, `hp = maxHp = start.hp`, `attack = start.attack`, 모든 추론을 `{ slots: [null, null, null], confirmed: false }`로, 나머지 배열·객체 비움, `dialogue/combat null`.
  - `step(state: GameState, command: Command, content: GameContent): StepResult` — "모드별 명령 분배" 표대로.
  - `tileAt(content: GameContent, mapId: Id, p: Pos): { walk: number | null } | null` (지도 밖 `null`), `npcAt(state: GameState, content: GameContent, p: Pos): Id | null` — `state.mapId` 지도에서 `p`에 선 NPC, 단 `state.party`에 있는 NPC는 제외(D19).
  - `findPath(content: GameContent, mapId: Id, from: Pos, to: Pos, blocked: (p: Pos) => boolean): Dir[] | null` — 4방향 BFS, 이웃 순서 `n, e, s, w`(결정적), 지형 비용 무시(칸 수 최단). `from == to` → `[]`. `to`가 막힘/지도 밖/`blocked(to)` → `null`.
  - `startCombat(state: GameState, content: GameContent, encounterId: Id, returnPos: Pos): GameState` — 아군: `"player"`(hp `player.hp`, attack `player.attack`) + `party` 순서의 동료(CompanionDef hp/attack), `allyStart[i]`에 배치(`allyStart`보다 동료가 많으면 남는 동료는 빠짐). 적: `` `${creature}#${i}` ``, 생물 hp/attack. 모든 유닛 `defending/moved/acted false`, `gone null`. `active "player"`, `round 1`, `intents {}`(Task 10이 채움), `grid = encounter.grid`, `returnPos`.
- 이동 규칙(`move`): `facing = dir`은 항상 바뀐다. 목표 칸이 지도 밖·`walk null`·NPC 칸 → `[{ type: "bumped" }]`, 위치·턴 그대로. 아니면 이동, `turn += walk`, `[{ type: "moved", pos }]`. 그 칸이 출구면 이어서 지도 전환: `mapId = to`, `pos = arrive`, `flags ∪= enterFlags`, 새 지도 `heals`면 `hp = maxHp`, 이벤트 `mapChanged`, `music(새 지도 music)` 추가. 그 칸에 `clearedEncounters`에 없는 조우가 있으면 `startCombat(…, returnPos = 이동 전 위치)`, 이벤트 `combatStarted`, `music(encounter.music)` 추가.
- `moveTo`: `findPath(…, blocked = npc 칸)`의 첫 걸음을 `move`로 실행. 경로가 `null`이거나 `[]`면 같은 state, 이벤트 0.

- [ ] **Step 1: 실패 테스트** `tests/unit/core/move.test.ts` — 모든 입력 상태는 `stateWith`(깊은 동결)로 만든다. `const c = testContent()`, `const at = (x: number, y: number) => stateWith({ player: { ...stateWith({}).player, pos: { x, y } } })`.

```ts
it("moves one tile and advances the turn by the terrain cost", () => {
  const grass = step(at(1, 1), { type: "move", dir: "e" }, c)           // (2,1) 풀
  expect(grass.state.player.pos).toEqual({ x: 2, y: 1 })
  expect(grass.state.turn).toBe(1)
  expect(grass.events).toEqual([{ type: "moved", pos: { x: 2, y: 1 } }])
  const bush = step(at(2, 1), { type: "move", dir: "e" }, c)            // (3,1) 덤불
  expect(bush.state.turn).toBe(2)
})
it("bumps into a blocking tile without moving or spending a turn", () => {
  const r = step(at(1, 1), { type: "move", dir: "n" }, c)
  expect(r.events).toEqual([{ type: "bumped" }])
  expect(r.state.player.pos).toEqual({ x: 1, y: 1 }); expect(r.state.turn).toBe(0)
  expect(r.state.player.facing).toBe("n")
})
it("bumps into an NPC", () => {
  expect(step(at(2, 3), { type: "move", dir: "e" }, c).events).toEqual([{ type: "bumped" }])   // (3,3) sage
})
it("changes map at an exit and arrives at the exit's arrive position", () => {
  const r = step(at(4, 2), { type: "move", dir: "e" }, c)
  expect(r.state.mapId).toBe("map.b"); expect(r.state.player.pos).toEqual({ x: 1, y: 1 })
  expect(r.events).toEqual([{ type: "moved", pos: { x: 5, y: 2 } }, { type: "mapChanged", mapId: "map.b" }, { type: "music", track: "music.b" }])
  expect(r.state.flags).toEqual(["flag.visited-b"])
})
it("entering a healing map restores hp", () => {
  const { "npc.ally": _ally, ...npcs } = c.npcs
  const healing = { ...c, npcs, maps: { ...c.maps, "map.b": { ...c.maps["map.b"]!, exits: [{ at: { x: 2, y: 1 }, to: "map.a", arrive: { x: 4, y: 2 } }] } } }
  const hurt = stateWith({ mapId: "map.b", player: { ...stateWith({}).player, pos: { x: 1, y: 1 }, hp: 2 } })
  const r = step(hurt, { type: "move", dir: "e" }, healing)
  expect(r.state.mapId).toBe("map.a"); expect(r.state.player.hp).toBe(10)
})
it("starts the encounter placed on the tile", () => {
  const r = step(at(1, 2), { type: "move", dir: "s" }, c)                // (1,3) enc.a
  expect(r.events.map((e) => e.type)).toEqual(["moved", "combatStarted", "music"])
  expect(r.state.combat?.encounterId).toBe("enc.a")
  expect(r.state.combat?.returnPos).toEqual({ x: 1, y: 2 })
  expect(r.state.combat?.units.map((u) => u.id)).toEqual(["player", "creature.slime#0", "creature.bandit#1"])
  const cleared = stateWith({ ...at(1, 2), clearedEncounters: ["enc.a"] })
  expect(step(cleared, { type: "move", dir: "s" }, c).state.combat).toBeNull()
})
it("moveTo walks the BFS path one step per command until the target", () => {
  const { state, events } = run(at(1, 1), Array(4).fill({ type: "moveTo", target: { x: 4, y: 2 } }))
  expect(state.player.pos).toEqual({ x: 4, y: 2 })
  expect(events.filter((e) => e.type === "moved")).toHaveLength(4)
  expect(step(state, { type: "moveTo", target: { x: 4, y: 2 } }, c).events).toEqual([])
})
it("commands other than combat are ignored during combat", () => {
  const inCombat = step(at(1, 2), { type: "move", dir: "s" }, c).state
  const r = step(deepFreeze(inCombat), { type: "move", dir: "n" }, c)
  expect(r.events).toEqual([]); expect(r.state).toBe(inCombat)
})
```

- [ ] **Step 2: 실패 테스트** `tests/unit/core/path.test.ts`

```ts
it("finds the shortest path around walls", () => {
  expect(findPath(c, "map.a", { x: 1, y: 1 }, { x: 4, y: 3 }, () => false)).toHaveLength(5)
})
it("routes around a blocked tile", () => {
  const path = findPath(c, "map.a", { x: 2, y: 3 }, { x: 4, y: 3 }, (p) => p.x === 3 && p.y === 3)
  expect(path).toEqual(["n", "e", "e", "s"])
})
it("returns null when unreachable", () => {
  expect(findPath(c, "map.a", { x: 1, y: 1 }, { x: 0, y: 0 }, () => false)).toBeNull()
})
it("returns [] when already there", () => {
  expect(findPath(c, "map.a", { x: 1, y: 1 }, { x: 1, y: 1 }, () => false)).toEqual([])
})
```

- [ ] **Step 3: 실패 테스트** `tests/unit/core/purity.test.ts` — `src/core` 아래 모든 `.ts`를 `readdirSync` 재귀로 읽어, 주석을 제거한 소스에 `/\b(document|window|HTMLElement|CanvasRenderingContext2D|AudioContext)\b|Math\.random/`가 없음. 파일이 하나 이상 검사되었는지도 `expect(files.length).toBeGreaterThan(0)`.

- [ ] **Step 4: RED** — Run: `npx vitest run tests/unit/core` → FAIL(모듈 없음). 출력 앞부분을 보고서에 기록.
- [ ] **Step 5: 구현** — Interfaces대로. `step.ts`는 `switch (command.type)`로 분배하고, 이후 Task의 명령은 지금은 `{ state, events: [] }`.
- [ ] **Step 6: GREEN** — Run: `npx vitest run tests/unit/core && npm run typecheck` → 전부 passed, exit 0.
- [ ] **Step 7: 커밋** `feat(core): state, deterministic step, movement and pathfinding`

### Task 6: 수첩 — 단서, 추론 페이지, 소문 힌트

**Files:**
- Create: `src/core/knowledge/notebook.ts`, `tests/unit/core/notebook.test.ts`
- Modify: `src/core/step.ts` (`fillSlot`)

**Interfaces:**
- Produces:
  - `learn(state: GameState, ids: readonly Id[]): StepResult` — 모르는 id만 추가(정렬 유지), 새로 배운 것마다 `factLearned`(입력 순서). 새 것이 없으면 같은 state, 이벤트 0.
  - `fillSlot` 규칙(step 경유, 탐험·대화 중 모두 유효): 무시 조건 — 추론 없음, `slot ∉ {0,1,2}`, 이미 `confirmed`, `word`가 null이 아닌데 아는 단서가 아니거나 kind가 `word`가 아님. 그 외에는 칸을 바꾸고, 세 칸이 `answer`와 **순서대로 모두 같으면** `confirmed: true`, 이벤트 `deductionConfirmed`, `unlocks`의 아직 없는 능력마다 `abilityUnlocked`(abilities 정렬 유지), `sfx "confirm"`. 확정이 아니면 이벤트 0(맞은 개수 신호 없음).
  - `openHints(state: GameState, content: GameContent): { targetId: Id; missing: Id[] }[]` (D17) — (a) 아직 안 풀린 위기의 선택지 중 못 고르는 것: `targetId = optionId`, `missing = 모르는 requires + 미확정 requiresDeductions`; (b) 플레이어가 **아는** 단서 id를 키로 가진 NPC topic 중 모든 변형이 `requires` 미충족인 것: `targetId = `${npcId}:${topicKey}``, `missing` = 첫 변형의 모르는 `requires`. 추론의 정답 단어는 절대 넣지 않는다. 결과는 `targetId` 정렬, `missing`은 정렬.

- [ ] **Step 1: 실패 테스트** `tests/unit/core/notebook.test.ts`

```ts
const words = ["word.alpha", "word.beta", "word.gamma", "word.decoy"]
const fill = (s: GameState, slot: number, word: Id | null) => step(s, { type: "fillSlot", deductionId: "deduction.test", slot, word }, c)
const knowing = stateWith({ facts: [...words].sort() })

it("learning a fact twice emits one factLearned", () => {
  const once = learn(stateWith({}), ["word.alpha"])
  expect(once.events).toEqual([{ type: "factLearned", id: "word.alpha" }])
  expect(learn(once.state, ["word.alpha"]).events).toEqual([])
})
it("a deduction confirms only when all three slots match the answer", () => {
  const r = run(knowing, [0, 1, 2].map((i) => ({ type: "fillSlot", deductionId: "deduction.test", slot: i, word: ["word.alpha", "word.beta", "word.gamma"][i]! })))
  expect(r.state.deductions["deduction.test"]?.confirmed).toBe(true)
  expect(r.events).toContainEqual({ type: "deductionConfirmed", id: "deduction.test" })
  expect(r.events).toContainEqual({ type: "abilityUnlocked", id: "ability.see-lies" })
  expect(r.state.abilities).toEqual(["ability.see-lies"])
})
it("two correct slots give no confirmation and no signal", () => {
  const r = run(knowing, [
    { type: "fillSlot", deductionId: "deduction.test", slot: 0, word: "word.alpha" },
    { type: "fillSlot", deductionId: "deduction.test", slot: 1, word: "word.beta" },
    { type: "fillSlot", deductionId: "deduction.test", slot: 2, word: "word.decoy" }
  ])
  expect(r.events).toEqual([])
  expect(Object.keys(r.state.deductions["deduction.test"]!)).toEqual(["slots", "confirmed"])
  expect(r.state.deductions["deduction.test"]).toEqual({ slots: ["word.alpha", "word.beta", "word.decoy"], confirmed: false })
})
it("same word in two slots never confirms unless the answer says so", () => {
  const r = run(knowing, [0, 1, 2].map((slot) => ({ type: "fillSlot", deductionId: "deduction.test", slot, word: "word.alpha" })))
  expect(r.state.deductions["deduction.test"]?.confirmed).toBe(false)
  const same = { ...c, deductions: { ...c.deductions, "deduction.test": { ...c.deductions["deduction.test"]!, answer: ["word.alpha", "word.alpha", "word.alpha"] as const } } }
  let s: GameState = knowing
  for (const slot of [0, 1, 2]) s = step(s, { type: "fillSlot", deductionId: "deduction.test", slot, word: "word.alpha" }, same).state
  expect(s.deductions["deduction.test"]?.confirmed).toBe(true)
})
it("filling a slot with an unknown word is ignored", () => {
  const r = fill(stateWith({}), 0, "word.alpha")
  expect(r.events).toEqual([]); expect(r.state.deductions["deduction.test"]?.slots).toEqual([null, null, null])
})
it("a non-word fact or a bad slot index is ignored", () => {
  const s = stateWith({ facts: ["fact.secret", "word.alpha"] })
  expect(fill(s, 0, "fact.secret").state.deductions["deduction.test"]?.slots[0]).toBeNull()
  expect(fill(s, 3, "word.alpha").state).toBe(s)
})
it("a confirmed deduction cannot be changed", () => {
  const done = stateWith({ facts: [...words].sort(), deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } })
  expect(fill(done, 0, null).state).toBe(done)
})
it("openHints lists the missing facts for a locked crisis option", () => {
  expect(openHints(stateWith({}), c)).toContainEqual({ targetId: "opt.a", missing: ["fact.secret"] })
  expect(openHints(stateWith({}), c)).toContainEqual({ targetId: "opt.b", missing: ["deduction.test"] })
  expect(openHints(stateWith({ facts: ["fact.secret"] }), c).some((h) => h.targetId === "opt.a")).toBe(false)
})
it("openHints lists a locked topic only when its key is known, and never answer words", () => {
  expect(openHints(stateWith({}), c).some((h) => h.targetId === "npc.sage:word.beta")).toBe(false)
  expect(openHints(stateWith({ facts: ["word.beta"] }), c)).toContainEqual({ targetId: "npc.sage:word.beta", missing: ["fact.secret"] })
  const all = openHints(stateWith({}), c).flatMap((h) => h.missing)
  expect(all).not.toContain("word.gamma")
})
```

- [ ] **Step 2: RED** — Run: `npx vitest run tests/unit/core/notebook.test.ts` → FAIL.
- [ ] **Step 3: 구현** → **Step 4: GREEN** — Run: `npx vitest run tests/unit/core` → 전부 passed.
- [ ] **Step 5: 커밋** `feat(core): notebook facts, three-slot deductions and open hints`

### Task 7: 대화

**Files:**
- Create: `src/core/dialogue/talk.ts`, `tests/unit/core/talk.test.ts`
- Modify: `src/core/step.ts` (`interact`, `ask`, `choose`, `endTalk`)

**Interfaces:**
- Consumes: `learn` (Task 6)
- Produces:
  - `availableTopics(state: GameState, content: GameContent, npcId: Id): string[]` (D8) — `["name", "job", ...아는 단서 중 kind ∈ {word, person, place}의 id 정렬]`. `npcId`는 시그니처 호환용(M1에선 결과에 영향 없음).
  - `pickVariant(state: GameState, variants: readonly Topic[]): Topic | null` — `requires` 전부 앎 ∧ `requiresFlags` 전부 있음 ∧ `excludeFlags` 하나도 없음을 만족하는 첫 변형.
- 규칙:
  - `interact`: `at`이 있으면 플레이어와 인접(맨해튼 1)해야 하고 `facing`을 그쪽으로 바꾼다. 없으면 `facing` 방향 칸. 그 칸의 NPC → `dialogue = { npcId, pendingChoice: null }`, 이벤트 `said(npcId, greetKey, lie false)`. NPC 없으면 `facing`만 바뀐 state, 이벤트 0.
  - `ask(topic)`: `pendingChoice !== null`이면 무시. `topic`이 `availableTopics`에 없으면 무시. NPC에 그 키가 없거나 `pickVariant`가 null → `said(npcId, "npc.default.unknown", false)`. 있으면 `said(npcId, textKey, lie ?? false)` → `setsFlags` 추가 → `learn(grants)` 이벤트를 이어 붙임 → `choice`가 있으면 `pendingChoice = topic`.
  - `choose(optionId)`: `pendingChoice`의 변형(`pickVariant` 재계산 — 이미 고정된 topic 키의 첫 충족 변형)의 `choice`에 없는 id면 무시. 있으면 `said(npcId, option.textKey, false)` → option `setsFlags` → `learn(option.grants)` → `deed`가 있으면 `deeds`에 `{ virtue, deed, turn }` 추가하고 `deed` 이벤트(D7) → `pendingChoice = null`.
  - `endTalk`: `dialogue = null`, 이벤트 0.

- [ ] **Step 1: 실패 테스트** `tests/unit/core/talk.test.ts` — `const facing = (x, y, f: Dir) => stateWith({ player: { ...stateWith({}).player, pos: { x, y }, facing: f } })`, `const talking = deepFreeze({ ...stateWith({}), player: { ...stateWith({}).player, pos: { x: 2, y: 3 }, facing: "e" }, dialogue: { npcId: "npc.sage", pendingChoice: null } })`.

```ts
it("interact opens a dialogue with the NPC the player faces", () => {
  const r = step(facing(2, 3, "e"), { type: "interact" }, c)
  expect(r.state.dialogue).toEqual({ npcId: "npc.sage", pendingChoice: null })
  expect(r.events).toEqual([{ type: "said", npcId: "npc.sage", textKey: "sage.greet", lie: false }])
})
it("interact at an adjacent tile turns the player toward it", () => {
  const r = step(facing(3, 2, "n"), { type: "interact", at: { x: 3, y: 3 } }, c)
  expect(r.state.player.facing).toBe("s"); expect(r.state.dialogue?.npcId).toBe("npc.sage")
  expect(step(facing(1, 1, "n"), { type: "interact", at: { x: 3, y: 3 } }, c).state.dialogue).toBeNull()
})
it("asking a topic says its text and grants its facts", () => {
  const r = step(talking, { type: "ask", topic: "job" }, c)
  expect(r.events).toEqual([
    { type: "said", npcId: "npc.sage", textKey: "sage.job", lie: false },
    { type: "factLearned", id: "word.alpha" }, { type: "factLearned", id: "word.decoy" }
  ])
})
it('a topic with unmet requires answers with the NPC\'s default "모른다" key', () => {
  const s = deepFreeze({ ...talking, facts: ["word.beta"] })
  expect(step(s, { type: "ask", topic: "word.beta" }, c).events).toEqual([{ type: "said", npcId: "npc.sage", textKey: "npc.default.unknown", lie: false }])
})
it("asking about an unknown word is ignored", () => {
  expect(step(talking, { type: "ask", topic: "word.beta" }, c).events).toEqual([])
})
it("a lie topic marks the said event lie: true", () => {
  const s = deepFreeze({ ...talking, facts: ["fact.person.sage"] })
  expect(step(s, { type: "ask", topic: "fact.person.sage" }, c).events[0]).toMatchObject({ textKey: "sage.self", lie: true })
})
it("a choice topic waits for choose, then records the option's deed", () => {
  const asked = step(deepFreeze({ ...talking, facts: ["word.decoy"] }), { type: "ask", topic: "word.decoy" }, c).state
  expect(asked.dialogue?.pendingChoice).toBe("word.decoy")
  expect(step(asked, { type: "ask", topic: "name" }, c).events).toEqual([])
  const r = step(asked, { type: "choose", optionId: "opt.lie" }, c)
  expect(r.events).toContainEqual({ type: "deed", virtue: "honesty", deed: "deed.lie" })
  expect(r.state.deeds).toEqual([{ virtue: "honesty", deed: "deed.lie", turn: 0 }])
  expect(r.state.flags).toContain("flag.asked"); expect(r.state.dialogue?.pendingChoice).toBeNull()
  expect(step(r.state, { type: "ask", topic: "word.decoy" }, c).events[0]).toMatchObject({ textKey: "sage.asked" })   // excludeFlags → 다음 변형
})
it("movement is ignored while a dialogue is open", () => {
  for (const cmd of [{ type: "move", dir: "n" }, { type: "moveTo", target: { x: 1, y: 1 } }, { type: "interact" }] as const) {
    const r = step(talking, cmd, c)
    expect(r.events).toEqual([]); expect(r.state.player.pos).toEqual({ x: 2, y: 3 })
  }
})
it("endTalk closes the dialogue", () => {
  expect(step(talking, { type: "endTalk" }, c).state.dialogue).toBeNull()
})
it("availableTopics lists name, job and known word/person/place facts", () => {
  const s = stateWith({ facts: ["fact.person.sage", "fact.secret", "word.alpha"] })
  expect(availableTopics(s, c, "npc.sage")).toEqual(["name", "job", "fact.person.sage", "word.alpha"])
})
```

- [ ] **Step 2: RED** → **Step 3: 구현** → **Step 4: GREEN** — Run: `npx vitest run tests/unit/core` → 전부 passed.
- [ ] **Step 5: 커밋** `feat(core): keyword dialogue with requirements, lies and choices`

### Task 8: 행실과 동료

**Files:**
- Create: `src/core/virtue/conduct.ts`, `tests/unit/core/conduct.test.ts`
- Modify: `src/core/step.ts` (`recruit`), `src/core/dialogue/talk.ts`(선택지 행실을 `recordDeed`로, D7)

**Interfaces:**
- Produces:
  - `recordDeed(state: GameState, content: GameContent, virtue: Virtue, deed: Id): StepResult` — `deeds`에 `{ virtue, deed, turn }` 추가, 이벤트 `deed`. 그다음 동행 동료마다 `deeds.slice(joinedAt[id]).filter(d => d.virtue === companion.virtue).length >= leaveAfterDeeds`면: `party`에서 빼고 `departed`에 추가(중복 없이), `joinedAt`에서 삭제, 이벤트 `companionLeft`. 대화 중이던 상대가 떠난 동료면 대화는 그대로 둔다.
  - `canRecruit(state: GameState, content: GameContent, npcId: Id): boolean` — companion 있음 ∧ `party`에 없음 ∧ `party.length < 3` ∧ (`departed`에 있으면 `rejoinRequires`, 없으면 `joinRequires`) 전부 앎.
  - `recruit` 명령: 그 NPC와 대화 중(`dialogue.npcId === npcId`)이고 `canRecruit`일 때만. `party` 끝에 추가, `departed`에서 제거, `joinedAt[npcId] = deeds.length`, 이벤트 `companionJoined`. 아니면 무시.
- `MAX_PARTY = 3` (플레이어 제외 동행 수).

- [ ] **Step 1: 실패 테스트** `tests/unit/core/conduct.test.ts` — `const withAlly = (patch) => deepFreeze({ ...stateWith(patch), dialogue: { npcId: "npc.ally", pendingChoice: null } })`. 3명 제한 테스트는 content를 복사해 companion NPC `npc.c1`, `npc.c2`, `npc.c3`를 map.b에 추가한 변형으로.

```ts
it("recruit succeeds only when joinRequires facts are known", () => {
  expect(step(withAlly({}), { type: "recruit", npcId: "npc.ally" }, c).events).toEqual([])
  const r = step(withAlly({ facts: ["fact.secret"] }), { type: "recruit", npcId: "npc.ally" }, c)
  expect(r.events).toEqual([{ type: "companionJoined", npcId: "npc.ally" }])
  expect(r.state.party).toEqual(["npc.ally"]); expect(r.state.joinedAt).toEqual({ "npc.ally": 0 })
})
it("recruit is ignored unless talking to that NPC", () => {
  expect(step(stateWith({ facts: ["fact.secret"] }), { type: "recruit", npcId: "npc.ally" }, c).events).toEqual([])
})
it("a companion leaves after leaveAfterDeeds deeds against their virtue since joining", () => {
  const before = [{ virtue: "honesty", deed: "deed.lie", turn: 0 }] as const
  let s = step(withAlly({ facts: ["fact.secret"], deeds: [...before] }), { type: "recruit", npcId: "npc.ally" }, c).state
  s = recordDeed(s, c, "compassion", "deed.kill-innocent").state            // 다른 미덕 → 세지 않음
  const one = recordDeed(s, c, "honesty", "deed.lie")
  expect(one.state.party).toEqual(["npc.ally"])                                 // 가입 전 1건은 세지 않음
  const two = recordDeed(one.state, c, "honesty", "deed.lie")
  expect(two.events).toContainEqual({ type: "companionLeft", npcId: "npc.ally" })
  expect(two.state.party).toEqual([]); expect(two.state.departed).toEqual(["npc.ally"])
})
it("a departed companion rejoins once rejoinRequires facts are known", () => {
  const gone = withAlly({ facts: ["fact.secret"], departed: ["npc.ally"] })
  expect(step(gone, { type: "recruit", npcId: "npc.ally" }, c).events).toEqual([])
  const back = step(withAlly({ facts: ["fact.secret", "word.gamma"], departed: ["npc.ally"] }), { type: "recruit", npcId: "npc.ally" }, c)
  expect(back.state.party).toEqual(["npc.ally"]); expect(back.state.departed).toEqual([])
})
it("rejoining never duplicates a companion", () => {
  const s = withAlly({ facts: ["fact.secret", "word.gamma"], departed: ["npc.ally"] })
  const once = step(s, { type: "recruit", npcId: "npc.ally" }, c).state
  const twice = step(once, { type: "recruit", npcId: "npc.ally" }, c)
  expect(twice.state.party).toEqual(["npc.ally"]); expect(twice.events).toEqual([])
})
it("party holds at most three companions", () => {
  // npc.c1..c3 동행 중, npc.ally 영입 시도 → 무시
})
it("a choice deed goes through recordDeed", () => {
  // Task 7의 opt.lie 흐름을 동료 동행 상태에서 두 번(excludeFlags를 비운 변형 content) → companionLeft
})
```

- [ ] **Step 2: RED** → **Step 3: 구현** → **Step 4: GREEN** — Run: `npx vitest run tests/unit/core` → 전부 passed(Task 7 테스트 포함).
- [ ] **Step 5: 커밋** `feat(core): conduct deeds and companion join, leave, rejoin`

### Task 9: 마을 위기

**Files:**
- Create: `src/core/crisis/crisis.ts`, `tests/unit/core/crisis.test.ts`
- Modify: `src/core/step.ts` (`resolveCrisis`)

**Interfaces:**
- Produces:
  - `crisisOptions(state: GameState, content: GameContent, crisisId: Id): { optionId: Id; available: boolean; missing: Id[] }[]` — content의 선택지 순서, `missing` = 모르는 `requires` + 미확정 `requiresDeductions`(정렬), `available = missing.length === 0`.
  - `resolveCrisis` 명령: 무시 조건 — 위기 없음, 이미 `crises[crisisId]` 있음, 대화 상대 ≠ `crisis.npc`, `pendingChoice !== null`, 선택지 없음, `available` 아님. 성공: `crises[crisisId] = optionId`, `flags ∪= setsFlags`, 이벤트 `said(crisis.npc, option.textKey, false)`, `crisisResolved`.

- [ ] **Step 1: 실패 테스트** `tests/unit/core/crisis.test.ts` — `const atSage = (patch) => deepFreeze({ ...stateWith(patch), dialogue: { npcId: "npc.sage", pendingChoice: null } })`, `const resolve = (s, optionId) => step(s, { type: "resolveCrisis", crisisId: "crisis.test", optionId }, c)`.

```ts
it("an option is available only when its facts and deductions are met", () => {
  expect(crisisOptions(stateWith({}), c, "crisis.test")).toEqual([
    { optionId: "opt.a", available: false, missing: ["fact.secret"] },
    { optionId: "opt.b", available: false, missing: ["deduction.test"] }
  ])
  const done = stateWith({ facts: ["fact.secret"], deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } })
  expect(crisisOptions(done, c, "crisis.test").every((o) => o.available)).toBe(true)
})
it("resolving sets the option's flags and emits crisisResolved", () => {
  const r = resolve(atSage({ facts: ["fact.secret"] }), "opt.a")
  expect(r.state.crises).toEqual({ "crisis.test": "opt.a" }); expect(r.state.flags).toContain("flag.a")
  expect(r.events.at(-1)).toEqual({ type: "crisisResolved", crisisId: "crisis.test", optionId: "opt.a" })
})
it("a crisis resolves once", () => {
  const once = resolve(atSage({ facts: ["fact.secret"], deductions: { "deduction.test": { slots: ["word.alpha", "word.beta", "word.gamma"], confirmed: true } } }), "opt.a").state
  const again = resolve(once, "opt.b")
  expect(again.events).toEqual([]); expect(again.state.crises["crisis.test"]).toBe("opt.a")
})
it("an unavailable option cannot be resolved", () => {
  expect(resolve(atSage({}), "opt.a").events).toEqual([])
})
it("resolving needs a dialogue with the crisis NPC", () => {
  expect(resolve(stateWith({ facts: ["fact.secret"] }), "opt.a").events).toEqual([])
})
```

- [ ] **Step 2: RED** → **Step 3: 구현** → **Step 4: GREEN** — Run: `npx vitest run tests/unit/core` → 전부 passed.
- [ ] **Step 5: 커밋** `feat(core): town crisis options and resolution`

### Task 10: 격자 턴제 전투

**Files:**
- Modify: `src/core/combat/grid.ts`(Task 5의 `startCombat`에 예고 계산 추가 + 행동·종료), `src/core/step.ts` (`combat`)
- Create: `tests/unit/core/combat.test.ts`

**Interfaces:**
- Consumes: `recordDeed`(Task 8), `CombatState` 등(Task 5), `findPath`(Task 5 — 격자용으로 쓸 수 있게 `findPathOnGrid(grid: readonly string[], tiles, from, to, blocked)`를 path.ts에 추가하고 `findPath`가 그것을 쓰게 리팩터)
- Produces: `step`의 `combat` 처리, `computeIntents(combat: CombatState, content: GameContent): CombatState["intents"]`.

**규칙(테스트가 고정, 무작위 없음):**
1. **차례**: `active`는 `units` 순서상 첫 번째 `side "ally"` ∧ `gone null` ∧ `acted false` 유닛. 아군 유닛은 차례에 `move` 한 번(선택) + 행동 한 번(`attack`/`defend`/`push`/`persuade`/`flee`) 또는 `endTurn`. 행동이나 `endTurn`이 그 유닛의 `acted = true`를 만든다. `move` 뒤에도 차례는 그 유닛.
2. **이동** `move(to)`: 아직 `moved false`, `to`가 격자 안·걷는 칸·빈 칸(살아 있는 유닛 없음), BFS 칸 수 1–3(다른 살아 있는 유닛 칸은 막힘). 아니면 무시.
3. **방향 행동** 대상 = 활성 유닛 칸 + dir 칸의 살아 있는 적. 대상이 없으면 무시(차례 소비 없음).
4. **공격**: 피해 = 공격자 `attack`, 대상이 `defending`이면 `Math.ceil(attack / 2)`. hp ≤ 0 → `gone "dead"`. 죽은 적이 `evil false`면 `recordDeed(compassion, "deed.kill-innocent")`. 이벤트 `sfx "hit"`.
5. **방어**: `defending = true` — 그 유닛의 **다음 차례 시작 때** false로(적 단계 동안 유지).
6. **밀기**: 대상을 dir로 1칸. 그 칸이 격자 밖 → `gone "retreated"`(행실 없음). 막힌 타일이나 다른 유닛 칸 → 제자리, 피해 1. 그 외 이동. `sfx "push"`.
7. **설득**: 대상 생물이 `evil false` ∧ 플레이어가 `lore` 단서를 알면 `gone "retreated"`. 아니면 효과 없이 차례 소비.
8. **도주**: 활성 유닛이 격자 가장자리(x=0, y=0, x=w-1, y=h-1)일 때만 → 전투 종료 `fled`. 아니면 무시.
9. **적 단계**: 모든 살아 있는 아군이 `acted`면, `units` 순서로 살아 있는 적마다 `intents[id]` 실행 — `moveTo`가 지금 비어 있으면 그 칸으로, 그 뒤 `attack` 대상이 살아 있고 맨해튼 1이면 공격(규칙 4와 같은 피해, 아군 hp ≤ 0 → `gone "dead"`). 그다음 `round += 1`, 아군 `moved/acted/defending` 초기화, 새 `intents = computeIntents`, `active` 재계산.
10. **예고 계산** `computeIntents`: 살아 있는 적마다, 살아 있는 아군 중 BFS 거리가 가장 짧은 대상(동점이면 `units` 순서 앞). 이미 인접이면 `moveTo = 현재 위치`. 아니면 그 대상까지 경로(다른 유닛 칸 막힘, 대상 칸은 목적지 인접 칸 중 경로가 가장 짧은 칸)를 따라 최대 3칸 간 칸. `attack = moveTo가 대상과 맨해튼 1이면 대상 id, 아니면 null`. 경로가 없으면 `moveTo = 현재 위치, attack null`. 앞의 적이 예약한 `moveTo`는 뒤 적에게 막힌 칸.
11. **종료**: 매 명령 처리 뒤 — 살아 있는 적 없음 → `victory`: `clearedEncounters`에 추가, `player.hp = 플레이어 유닛 hp`(≥1). 살아 있는 아군 없음 → `defeat`: `mapId/pos = content.start`, `hp = 1`, 조우는 cleared 아님. `fled` → `pos = returnPos`, `player.hp = 플레이어 유닛 hp`. 셋 다 `combat = null`, 이벤트 `combatEnded`, `music(현재 지도 music)`.

- [ ] **Step 1: 실패 테스트** `tests/unit/core/combat.test.ts` — 헬퍼 `combatState(units: Partial<CombatUnit>[] & { id; pos }[], patch?)`: `enc.a`의 5×5 격자로 `CombatState`를 직접 만든 `GameState`(기본 hp/attack은 생물·플레이어 값). `act = (s, action) => step(s, { type: "combat", action }, c)`.

```ts
it("starting an encounter computes intents toward the nearest ally", () => {
  const s = step(at(1, 2), { type: "move", dir: "s" }, c).state           // Task 5 경로로 실제 시작
  expect(s.combat?.intents["creature.slime#0"]).toEqual({ moveTo: { x: 2, y: 3 }, attack: "player" })
})
it("intents are shown before the enemy acts and enemies follow them", () => {
  // player (2,4), slime (2,0): slime 예고 moveTo (2,3)? 거리 4 → 3칸 이동 → (2,3), 인접 → attack "player"
  // player endTurn → slime이 (2,3)으로 가서 player hp 10 → 8
})
it("defending halves damage rounding up", () => {
  // bandit(attack 4) 인접, player defend → hp 10 → 8 (ceil(4/2)=2); 다음 라운드 시작 때 defending false
})
it("pushing an enemy off the grid makes it retreat, not die", () => {
  // player (2,1), slime (2,0) → push "n" → slime gone "retreated", deeds 없음
})
it("pushing into a wall or unit deals 1 damage and stays", () => {})
it("killing a non-evil creature records a compassion deed", () => {
  // slime hp 3, player attack 3 → dead → deeds [{ compassion, deed.kill-innocent }]; bandit 처치는 기록 없음
})
it("persuade works only on a non-evil creature whose lore fact is known", () => {
  // 모름 → 효과 없음 + acted true; fact.slime-lore 앎 → retreated; bandit은 lore 알아도 실패
})
it("flee works only from an edge tile", () => {
  // player (2,2) flee → 무시(acted false); (0,2) flee → combatEnded fled, pos = returnPos
})
it("combat ends in victory when no enemy remains, adds the encounter to clearedEncounters", () => {})
it("combat ends in defeat when every ally is gone", () => {
  // player hp 1, bandit 인접, endTurn → defeat, mapId start.map, pos start.pos, hp 1, cleared에 없음
})
it("a moved unit cannot move again but can still act", () => {})
```

  각 테스트는 주석의 좌표·수치를 `expect`로 그대로 고정한다(첫 테스트처럼 `toEqual`). `combatState` 헬퍼는 유닛을 놓은 뒤 `intents = computeIntents(…)`로 채우고 `active`를 규칙 1로 계산한다(직접 만든 상태도 실제 시작과 같은 불변식을 가진다). 위 수치의 근거: slime (2,0) → player (2,4)까지 인접 칸 (2,3)이 3칸이므로 한 라운드에 도착해 공격 2, bandit 공격 4 → 방어 시 2.

- [ ] **Step 2: RED** → **Step 3: 구현** → **Step 4: GREEN** — Run: `npx vitest run tests/unit/core` → 전부 passed.
- [ ] **Step 5: 커밋** `feat(core): telegraphed grid combat with push, persuade and flee`

### Task 11: 저장

**Files:**
- Create: `src/core/save/serialize.ts`, `tests/unit/core/serialize.test.ts`, `src/save/slots.ts`, `tests/unit/save/slots.test.ts`
- Copy+edit: `/home/taejin/ultima/src/saves/slot-store.ts` → `src/save/slot-store.ts` (D3: `DB_NAME = "hollow-codex-save-slots"`, 머리 주석 "Save slots live in one IndexedDB database in the player's browser only. A memory store backs the unit tests.")

**Interfaces:**
- Consumes: `SlotStore`, `SlotRecord`, `createMemorySlotStore()` (slot-store.ts, ultima와 같은 시그니처)
- Produces:
  - `SAVE_FORMAT = "hollow-codex-save"`, `SAVE_VERSION = 1`
  - `serialize(state: GameState): string` — `JSON.stringify({ format, version, state })`
  - `deserialize(text: string): { ok: true; state: GameState } | { ok: false; reason: "corrupt" | "format" | "future-version" }` — JSON 오류 → `corrupt`; 객체 아님/`format` 다름 → `format`; `version > 1` → `future-version`; `version < 1`이면 `MIGRATIONS[v]`를 차례로 적용(없으면 `corrupt`); `state`가 최소 모양(문자열 `mapId`, 숫자 `turn`/`rng`, `player.pos.x/y` 숫자, 배열 `facts/deeds/party/departed/flags/abilities/clearedEncounters`, 객체 `deductions/crises/joinedAt`, `dialogue`·`combat`은 null 또는 객체)이 아니면 `corrupt`. 절대 throw하지 않는다.
  - `MIGRATIONS: Readonly<Record<number, (s: unknown) => unknown>> = {}`
  - `AUTO_SLOT = "auto"`, `STATE_FILE = "state.json"`
  - `saveToSlot(store: SlotStore, slotId: string, name: string, state: GameState, now: number): Promise<void>` — `files: [{ path: STATE_FILE, data: TextEncoder().encode(serialize(state)) }]`, 기존 레코드가 있으면 `createdAt` 유지, `updatedAt = now`.
  - `loadSlot(store: SlotStore, slotId: string): Promise<ReturnType<typeof deserialize> | null>` — 레코드 없음 → `null`, `STATE_FILE` 없음 → `{ ok: false, reason: "corrupt" }`.

- [ ] **Step 1: 실패 테스트**

```ts
// tests/unit/core/serialize.test.ts
it("round-trips a state", () => {
  const s = run(stateWith({}), [{ type: "move", dir: "e" }, { type: "move", dir: "e" }]).state
  expect(deserialize(serialize(s))).toEqual({ ok: true, state: s })
})
it("round-trips a state in the middle of combat", () => {
  const s = run(at(1, 2), [{ type: "move", dir: "s" }, { type: "combat", action: { kind: "defend" } }]).state
  const back = deserialize(serialize(s))
  expect(back).toEqual({ ok: true, state: s })
  if (back.ok) expect(step(back.state, { type: "combat", action: { kind: "endTurn" } }, c)).toEqual(step(s, { type: "combat", action: { kind: "endTurn" } }, c))
})
it("corrupt and future saves are rejected without throwing", () => {
  expect(deserialize("{")).toEqual({ ok: false, reason: "corrupt" })
  expect(deserialize(JSON.stringify({ format: "other", version: 1, state: {} }))).toEqual({ ok: false, reason: "format" })
  expect(deserialize(JSON.stringify({ format: "hollow-codex-save", version: 2, state: {} }))).toEqual({ ok: false, reason: "future-version" })
  expect(deserialize(JSON.stringify({ format: "hollow-codex-save", version: 1, state: { mapId: 3 } }))).toEqual({ ok: false, reason: "corrupt" })
  expect(deserialize("null")).toEqual({ ok: false, reason: "format" })
})
// tests/unit/save/slots.test.ts
it("saves and loads through the memory store", async () => {
  const store = createMemorySlotStore()
  await saveToSlot(store, "slot-1", "첫 저장", stateWith({}), 100)
  expect(await loadSlot(store, "slot-1")).toEqual({ ok: true, state: stateWith({}) })
  expect(await loadSlot(store, "missing")).toBeNull()
})
it("the auto slot is overwritten in place", async () => {
  const store = createMemorySlotStore()
  await saveToSlot(store, AUTO_SLOT, "auto", stateWith({}), 100)
  await saveToSlot(store, AUTO_SLOT, "auto", stateWith({ turn: 5 }), 200)
  const all = await store.list()
  expect(all).toHaveLength(1)
  expect(all[0]).toMatchObject({ id: "auto", createdAt: 100, updatedAt: 200 })
})
```

- [ ] **Step 2: RED** → **Step 3: 구현** → **Step 4: GREEN** — Run: `npx vitest run tests/unit/core tests/unit/save && npm run typecheck` → 전부 passed, exit 0.
- [ ] **Step 5: 커밋** `feat(save): versioned save format and local slots`

### Task 12: 렌더러와 입력

**Files:**
- Create: `src/render/viewport.ts`, `src/render/canvas.ts`, `src/input/commands.ts`, `tests/unit/render/viewport.test.ts`, `tests/unit/input/commands.test.ts`

**Interfaces:**
- Produces:
  - `VIEW_W = 15`, `VIEW_H = 11`, `TILE = 16`
  - `interface Viewport { scale: number; originTile: Pos; offsetPx: Pos }`
  - `computeViewport(canvasCss: { w: number; h: number }, dpr: number, mapSize: { w: number; h: number }, center: Pos): Viewport` — `scale = max(1, floor(min(w*dpr / (15*16), h*dpr / (11*16))))`. `originTile.x = mapW <= 15 ? 0 : clamp(center.x - 7, 0, mapW - 15)`, y도 같게(`- 5`, `11`). `offsetPx` = 장치 픽셀 기준으로 `(w*dpr - min(mapW,15)*16*scale) / 2`를 `floor`(y도 같게) — 지도가 시야보다 작으면 가운데 정렬.
  - `screenToTile(px: Pos, vp: Viewport): Pos` — 장치 픽셀 → 지도 타일(`floor((px - offset) / (16*scale)) + origin`).
  - `type UiAction = { ui: "notebook" | "menu" }`, `type InputMode = "explore" | "dialogue" | "combat"`, `modeOf(state: GameState): InputMode`
  - `keyToCommand(key: string, mode: InputMode): Command | UiAction | null` — 아래 표.
  - `pointerToCommand(tile: Pos, state: GameState, content: GameContent): Command | null` — 탐험: 그 칸에 NPC가 있고 플레이어와 맨해튼 1이면 `{ type: "interact", at: tile }`, NPC가 있지만 멀면 `null`, 플레이어 칸이면 `null`, 그 외 `{ type: "moveTo", target: tile }`. 전투: `{ type: "combat", action: { kind: "move", to: tile } }`(격자 좌표). 대화: `null`.
  - `drawFrame(ctx: CanvasRenderingContext2D, sheets: Readonly<Record<string, HTMLImageElement>>, state: GameState, content: GameContent, vp: Viewport): void` — 테스트 없음(사용자 확인).

| key | explore | dialogue | combat |
|---|---|---|---|
| `ArrowUp` `w` `W` | move n | null | null |
| `ArrowRight` `d` `D` | move e | null | null |
| `ArrowDown` `s` `S` | move s | null | null |
| `ArrowLeft` `a` `A` | move w | null | null |
| `Enter` `" "` | interact | null | null |
| `Escape` | `{ ui: "menu" }` | endTalk | `{ ui: "menu" }` |
| `Tab` | `{ ui: "notebook" }` | `{ ui: "notebook" }` | `{ ui: "notebook" }` |

- [ ] **Step 1: 실패 테스트**

```ts
// viewport.test.ts
it("integer scale for a 1280×720 canvas at dpr 1 is 4", () => {
  expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 16, y: 12 }).scale).toBe(4)
})
it("uses device pixels", () => { expect(computeViewport({ w: 640, h: 360 }, 2, { w: 32, h: 24 }, { x: 0, y: 0 }).scale).toBe(4) })
it("clamps at the map's top-left corner", () => {
  expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 0, y: 0 }).originTile).toEqual({ x: 0, y: 0 })
})
it("clamps at the bottom-right corner", () => {
  expect(computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 31, y: 23 }).originTile).toEqual({ x: 17, y: 13 })
})
it("never goes below scale 1", () => { expect(computeViewport({ w: 100, h: 80 }, 1, { w: 32, h: 24 }, { x: 0, y: 0 }).scale).toBe(1) })
it("centres a map smaller than the view", () => {
  const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 12, h: 10 }, { x: 5, y: 5 })
  expect(vp.originTile).toEqual({ x: 0, y: 0 }); expect(vp.offsetPx).toEqual({ x: 256, y: 40 })
})
it("screenToTile inverts the viewport", () => {
  const vp = computeViewport({ w: 1280, h: 720 }, 1, { w: 32, h: 24 }, { x: 16, y: 12 })
  expect(screenToTile({ x: vp.offsetPx.x + 64 * 2 + 1, y: vp.offsetPx.y + 1 }, vp)).toEqual({ x: vp.originTile.x + 2, y: vp.originTile.y })
})
// commands.test.ts
it.each([["ArrowUp", "n"], ["w", "n"], ["D", "e"], ["ArrowDown", "s"], ["a", "w"]])("%s moves %s in explore", (k, d) => {
  expect(keyToCommand(k, "explore")).toEqual({ type: "move", dir: d })
})
it("Enter and Space interact; Escape opens the menu; Tab opens the notebook", () => {})   // 표 그대로
it("arrow keys do nothing in dialogue mode", () => { expect(keyToCommand("ArrowUp", "dialogue")).toBeNull() })
it("Escape ends the talk in dialogue mode", () => { expect(keyToCommand("Escape", "dialogue")).toEqual({ type: "endTalk" }) })
it("tapping an adjacent NPC interacts", () => {
  const s = stateWith({ player: { ...stateWith({}).player, pos: { x: 2, y: 3 } } })
  expect(pointerToCommand({ x: 3, y: 3 }, s, c)).toEqual({ type: "interact", at: { x: 3, y: 3 } })
})
it("tapping a far NPC does nothing", () => { expect(pointerToCommand({ x: 3, y: 3 }, stateWith({}), c)).toBeNull() })
it("tapping a far tile walks there", () => {
  expect(pointerToCommand({ x: 4, y: 2 }, stateWith({}), c)).toEqual({ type: "moveTo", target: { x: 4, y: 2 } })
})
```

  (`centres a map…`: scale 4, `(1280 - 12*64)/2 = 256`, `(720 - 10*64)/2 = 40`.)

- [ ] **Step 2: RED** → **Step 3: 구현** — `canvas.ts`: `ctx.imageSmoothingEnabled = false`, 캔버스 크기 = CSS 크기 × dpr. 탐험: 시야 타일 → NPC → 플레이어. 전투: `combat.grid`를 지도 대신 그리고, 유닛, 각 적의 예고 화살표(적 칸 중심 → `intents[id].moveTo` 칸 중심, 노란 선 2px×scale), `attack` 대상 칸에 빨간 테두리, 활성 아군 칸에 흰 테두리. 스프라이트 원본 좌표 = `(index % columns) * 16, floor(index / columns) * 16`.
- [ ] **Step 4: GREEN** — Run: `npx vitest run tests/unit/render tests/unit/input` → 전부 passed.
- [ ] **Step 5: 커밋** `feat(render,input): integer-scaled tile viewport and unified input commands`

### Task 13: UI 패널

**Files:**
- Create: `src/ui/strings.ts`, `src/ui/view-model.ts`, `src/ui/panels.ts`, `src/ui/panels.css`, `tests/unit/ui/view-model.test.ts`
- Modify: `src/main.ts`(패널 마운트만; 루프 연결은 Task 16)

**Interfaces:**
- Consumes: `availableTopics`, `pickVariant`(Task 7), `openHints`(Task 6), `crisisOptions`(Task 9), `canRecruit`(Task 8), `UiAction`(Task 12)
- Produces:
  - `t(strings: Readonly<Record<string, string>>, key: string, vars?: Readonly<Record<string, string>>): string` — 없는 키 → `` `⟦${key}⟧` ``, `{name}` 자리 치환.
  - `interface SaidLine { textKey: string; lie: boolean }` — 대화 기록은 상태에 없으므로 UI가 `said` 이벤트를 모아 `log: SaidLine[]`로 가진다(대화가 닫히면 비움).
  - `dialogueView(state, content, log: readonly SaidLine[]): DialogueView | null`
    ```ts
    interface DialogueView {
      npcName: string
      lines: { text: string; lieMark: boolean }[]          // lieMark = lie && abilities에 "ability.see-lies"
      chips: { topic: string; label: string }[]            // availableTopics, 라벨 = t("topic.name"|"topic.job"|fact.labelKey)
      choices: { optionId: Id; label: string }[]           // pendingChoice가 있을 때만
      crisis: { optionId: Id; label: string; available: boolean; hints: string[] }[] | null   // 이 NPC가 위기 npc이고 미해결일 때
      canRecruit: boolean
    }
    ```
  - `notebookView(state, content): NotebookView`
    ```ts
    interface NotebookView {
      facts: Record<FactKind, { id: Id; label: string }[]>  // 6 kind 키 모두 존재(빈 배열 포함), 각 목록은 label 정렬
      deductions: { id: Id; sentence: string; slots: (string | null)[]; confirmed: boolean; words: { id: Id; label: string }[] }[]
      hints: string[]                                       // openHints의 missing → fact.hintKey / deduction.hintKey, 중복 제거
    }
    ```
    `slots`는 고른 단어의 라벨(또는 null). `words` = 아는 `word` 단서 전부. 맞은 개수 같은 필드는 없다.
  - `combatView(state, content): CombatView | null`
    ```ts
    interface CombatView {
      active: string                                        // 활성 유닛 이름(플레이어 = t("player.name"))
      actions: CombatAction["kind"][]                       // 지금 유효한 행동: moved면 "move" 빠짐, flee는 가장자리일 때만, 항상 "endTurn"
      units: { id: Id; name: string; hp: number; side: "ally" | "enemy"; evilKnown: boolean | null }[]   // 적: lore 앎 → evil, 모름 → null; 아군 null
    }
    ```
  - `mountPanels(root: HTMLElement, content: GameContent, dispatch: (c: Command | UiAction) => void, credits: readonly LedgerRow[]): { render(state: GameState, log: readonly SaidLine[]): void; toggle(panel: "notebook" | "menu"): void; onMenu(handler: (action: "save" | "load" | "new") => void): void }`
  - 새 문자열 키(Task 15가 값 채움): `player.name`, `ui.notebook`, `ui.menu`, `ui.save`, `ui.load`, `ui.new`, `ui.credits`, `ui.close`, `ui.recruit`, `ui.end-talk`, `ui.tab.facts`, `ui.tab.deductions`, `ui.tab.hints`, `ui.kind.<FactKind>` 6개, `ui.combat.<kind>` 7개, `ui.evil`, `ui.not-evil`, `ui.unknown-nature`.

- [ ] **Step 1: 실패 테스트** `tests/unit/ui/view-model.test.ts` (`testContent()`의 strings는 키 = 값)

```ts
const talking = (patch) => deepFreeze({ ...stateWith(patch), dialogue: { npcId: "npc.sage", pendingChoice: null } })
it("lie marks appear only with the see-lies ability", () => {
  const log = [{ textKey: "sage.self", lie: true }]
  expect(dialogueView(talking({}), c, log)?.lines[0]?.lieMark).toBe(false)
  expect(dialogueView(talking({ abilities: ["ability.see-lies"] }), c, log)?.lines[0]?.lieMark).toBe(true)
})
it("chips list only topics available for this NPC", () => {
  const v = dialogueView(talking({ facts: ["fact.secret", "word.alpha"] }), c, [])
  expect(v?.chips.map((x) => x.topic)).toEqual(["name", "job", "word.alpha"])
  expect(v?.chips[2]?.label).toBe("word.alpha.label")
})
it("the crisis appears with availability and hints when talking to its NPC", () => {
  expect(dialogueView(talking({}), c, [])?.crisis).toEqual([
    { optionId: "opt.a", label: "opt.a.label", available: false, hints: ["fact.secret.hint"] },
    { optionId: "opt.b", label: "opt.b.label", available: false, hints: ["deduction.test.hint"] }
  ])
})
it("the deduction page shows chosen words, never a correctness count", () => {
  const s = stateWith({ facts: ["word.alpha", "word.decoy"], deductions: { "deduction.test": { slots: ["word.alpha", null, "word.decoy"], confirmed: false } } })
  const d = notebookView(s, c).deductions[0]!
  expect(d.slots).toEqual(["word.alpha.label", null, "word.decoy.label"])
  expect(Object.keys(d).sort()).toEqual(["confirmed", "id", "sentence", "slots", "words"])
})
it("hints show hint text of missing facts", () => {
  expect(notebookView(stateWith({}), c).hints).toEqual(["deduction.test.hint", "fact.secret.hint"])
})
it("unknown creature nature shows as null", () => {
  const s = step(at(1, 2), { type: "move", dir: "s" }, c).state
  expect(combatView(s, c)?.units.find((u) => u.id === "creature.slime#0")?.evilKnown).toBeNull()
  const known = deepFreeze({ ...s, facts: ["fact.slime-lore"] })
  expect(combatView(known, c)?.units.find((u) => u.id === "creature.slime#0")?.evilKnown).toBe(false)
})
it("t marks a missing key", () => { expect(t({}, "x.y")).toBe("⟦x.y⟧"); expect(t({ a: "안녕 {n}" }, "a", { n: "엘린" })).toBe("안녕 엘린") })
```


- [ ] **Step 2: RED** → **Step 3: 구현**
  - `panels.ts` DOM 구성: `#ui` 아래 `section.dialogue`(오른쪽 고정, 폭 min(420px, 100vw); 휴대폰 세로에선 아래쪽 45vh), `section.notebook`(전체 덮개, 탭 3개), `section.combat-hud`(아래 줄, 행동 버튼), `section.menu`(저장 슬롯 3개 + 자동, 불러오기, 새 게임, 크레딧 목록 = `credits`의 `path · author · license · source`), 화면 버튼 `button.open-notebook`, `button.open-menu`(오른쪽 위).
  - 모든 버튼 `min-height: 44px; min-width: 44px`, 글꼴은 Task 4의 NeoDunggeunmo.
  - 대화 칩 클릭 → `dispatch({ type: "ask", topic })`, 선택지 → `choose`, 위기 버튼(`available`일 때만 활성) → `resolveCrisis`, 영입 → `recruit`, 닫기 → `endTalk`.
  - 수첩 추론 탭: 칸마다 `<select>`(빈 값 + `words`) → `fillSlot`. 확정된 페이지는 select 비활성.
  - 전투 HUD: `move` 외 방향 행동(attack/push/persuade)은 버튼을 누른 뒤 방향 키 또는 인접 칸 탭으로 방향을 받아 `combat` 명령(이 "방향 대기" 상태는 panels 안의 지역 상태). `defend`/`flee`/`endTurn`은 바로.
  - 패널에 표시하는 모든 글은 `t()`로.
- [ ] **Step 4: GREEN** — Run: `npx vitest run tests/unit/ui && npm run typecheck` → 전부 passed, exit 0.
- [ ] **Step 5: 커밋** `feat(ui): dialogue chips, notebook, combat HUD and menu`

### Task 14: 칩 음악과 효과음

**Files:**
- Create: `src/audio/score.ts`, `src/audio/synth.ts`, `src/audio/sfx.ts`, `tests/unit/audio/score.test.ts`, `tests/unit/audio/sfx.test.ts`

**Interfaces:**
- Consumes: `Score` (Task 3, D5)
- Produces:
  - 악보 `notes` 문법: 공백으로 구분된 토큰. `<음이름><옥타브>/<길이>[.]` — 음이름 `C C# Db D D# Eb E F F# Gb G G# Ab A A# Bb B`, 옥타브 0–8, 길이 ∈ {1, 2, 4, 8, 16}(온음표 분모), `.` = 1.5배. 쉼표 `r/<길이>[.]`. 노이즈 타격 `x/<길이>[.]`(노이즈 채널 전용).
  - `parseScore(score: Score): { events: { channel: number; time: number; duration: number; freq: number | null }[]; length: number }` — 4분음표 = `60 / tempo`초, 길이 `n` = `(4 / n) * (60 / tempo)`. `freq = 440 * 2 ** ((midi - 69) / 12)`, `midi = 12 * (octave + 1) + 반음`. 쉼표 `freq: null`, 노이즈 타격 `freq: 0`. `length` = 채널 길이 중 최댓값. 잘못된 토큰 → `throw new Error(`bad note "${token}" in channel ${i}`)`.
  - `createChipPlayer(ctx: AudioContext): { play(score: Score): void; stop(): void; setVolume(v: number): void }` — 25ms마다 다음 100ms 안의 음을 스케줄(look-ahead), `loop`이면 `length`마다 반복, `play` 시 이전 곡 정지. 파형: `square50` = `OscillatorNode type "square"`, `square25` = 25% 펄스 `PeriodicWave`(푸리에 계수 `b_n = (2/(nπ)) sin(nπ·0.25)`, 32항), `triangle`, `noise` = 1초 백색 잡음 `AudioBuffer` 반복. 음마다 gain 엔벨로프(attack 5ms, release 30ms). 채널 `volume` × 마스터 볼륨. `ctx.state === "suspended"`면 첫 `pointerdown`/`keydown`에서 `ctx.resume()` 후 재생.
  - `interface SfxParams { wave: "square" | "noise"; startHz: number; endHz: number; ms: number; decay: number }`
  - `renderSfx(p: SfxParams, sampleRate: number): Float32Array` — 길이 `round(ms * sampleRate / 1000)`, 진폭 `0.5 * exp(-decay * t / dur)`, 사각파는 주파수를 start→end 선형 변화(위상 누적), 노이즈는 시드 1의 mulberry32(core `nextRandom` 재사용)로 `±1`. 결정적.
  - `SFX: Readonly<Record<"step" | "bump" | "learn" | "confirm" | "hit" | "push", SfxParams>>`:

| name | wave | startHz | endHz | ms | decay |
|---|---|---|---|---|---|
| step | square | 220 | 180 | 40 | 8 |
| bump | square | 110 | 80 | 80 | 6 |
| learn | square | 660 | 990 | 150 | 3 |
| confirm | square | 523 | 1047 | 400 | 2 |
| hit | noise | 0 | 0 | 120 | 10 |
| push | noise | 0 | 0 | 200 | 5 |

- [ ] **Step 1: 실패 테스트**

```ts
// score.test.ts
const one = (notes: string, tempo = 120) => parseScore({ tempo, loop: false, channels: [{ wave: "square50", volume: 1, notes }] })
it("parses A4/4 at 120 bpm to 440 Hz lasting 0.5 s", () => {
  expect(one("A4/4").events).toEqual([{ channel: 0, time: 0, duration: 0.5, freq: 440 }])
})
it("dotted notes last 1.5x", () => { expect(one("A4/4.").events[0]?.duration).toBeCloseTo(0.75) })
it("rests have freq null and advance time", () => {
  expect(one("r/8 C4/8").events).toEqual([
    { channel: 0, time: 0, duration: 0.25, freq: null },
    { channel: 0, time: 0.25, duration: 0.25, freq: expect.closeTo(261.63, 1) }
  ])
})
it("sharps and flats name the same pitch", () => { expect(one("C#5/4").events[0]?.freq).toBeCloseTo(one("Db5/4").events[0]!.freq!) })
it("noise hits have freq 0", () => {
  expect(parseScore({ tempo: 120, loop: false, channels: [{ wave: "noise", volume: 1, notes: "x/8" }] }).events[0]?.freq).toBe(0)
})
it("rejects an unknown note name with the token in the error", () => { expect(() => one("H4/4")).toThrow('bad note "H4/4"') })
it("length is the longest channel", () => {
  const s = parseScore({ tempo: 120, loop: true, channels: [
    { wave: "square50", volume: 1, notes: "A4/4" }, { wave: "triangle", volume: 1, notes: "A3/2 A3/4" }] })
  expect(s.length).toBeCloseTo(1.5)
})
// sfx.test.ts
it("length is ms × sampleRate / 1000", () => { expect(renderSfx(SFX.step, 44100)).toHaveLength(1764) })
it("peak amplitude ≤ 1", () => { for (const p of Object.values(SFX)) expect(Math.max(...renderSfx(p, 22050).map(Math.abs))).toBeLessThanOrEqual(1) })
it("same params give identical samples", () => { expect(renderSfx(SFX.hit, 22050)).toEqual(renderSfx(SFX.hit, 22050)) })
```

- [ ] **Step 2: RED** → **Step 3: 구현**(`synth.ts`는 테스트 없음, 사용자 확인) → **Step 4: GREEN** — Run: `npx vitest run tests/unit/audio && npm run typecheck` → 전부 passed.
- [ ] **Step 5: 커밋** `feat(audio): text scores, chip synth player and generated sfx`

### Task 15: 칼라스 콘텐츠

**Files:**
- Create/Replace: `content/tiles.yaml`, `content/start.yaml`, `content/abilities.yaml`, `content/strings/ko.yaml`, `content/creatures.yaml`, `content/towns/kalas/{maps,npcs,facts,deduction,crisis,encounters}.yaml`, `content/music/{field,kalas,battle}.yaml`, `assets/tiles/kenney-tiny-town.png`, `assets/tiles/kenney-tiny-dungeon.png`, `assets/tiles/LICENSE-kenney.txt`
- Modify: `assets/LEDGER.md`

- [ ] **Step 1: 자산** — `https://kenney.nl/assets/tiny-town`, `https://kenney.nl/assets/tiny-dungeon` 페이지에서 zip 링크를 찾아 scratchpad의 **빈 새 디렉터리**에 받아 푼다(신뢰하지 않는 파일: 그 안에서 아무것도 실행하지 않는다). 각 zip의 `License.txt`에 `Creative Commons Zero, CC0`가 있는지 확인하고 보고서에 그 줄을 인용한다. **CC0가 아니면 멈추고 BLOCKED 보고.** `Tilemap/tilemap_packed.png`(16×16 타일, 여백 없음)를 위 이름으로 복사, 두 License.txt를 이어 붙여 `assets/tiles/LICENSE-kenney.txt`. 장부 행 2개: `| assets/tiles/kenney-tiny-town.png | https://kenney.nl/assets/tiny-town | Kenney (www.kenney.nl) | CC0-1.0 |`, 던전도 같게. `file`로 PNG 크기를 확인해 `columns = 폭 / 16`을 `tiles.yaml` `sheets`에 적는다.
- [ ] **Step 2: 타일** — `content/tiles.yaml`: 시트 `town`, `dungeon`. 글자 표(인덱스는 시트를 보고 고른다; 사용자가 화면에서 확인):

| 글자 | 뜻 | walk |
|---|---|---|
| `.` | 풀 | 1 |
| `,` | 덤불 | 2 |
| `:` | 흙길·광장 | 1 |
| `=` | 다리 | 1 |
| `~` | 물 | null |
| `T` | 나무 | null |
| `#` | 벽(마을 건물) | null |
| `+` | 문·출입구 | 1 |
| `o` | 열석 | null |
| `L` | 고백석(깨진 등불) | null |
| `_` | 서고 바닥 | 1 |
| `%` | 서고 벽 | null |
| `>` | 계단(내려감) | 1 |
| `<` | 계단(올라감) | 1 |

- [ ] **Step 3: 지도** (`maps.yaml`) — 크기·핵심 칸 고정, 나머지 배치는 작가 재량:
  - `map.field` 24×16, music `music.field`, heals false. 가운데 왼쪽에 열석 고리(`o` 6개 원형), 시작 `start.pos`는 고리 안쪽 칸. 세로 강(`~`)이 x=15에서 지도를 가르고 **다리 `=` 한 칸**(x=15)만 건널 수 있다. 다리 칸에 조우 `enc.field.wolves`. 동쪽 가장자리 출구 → `map.kalas` 서문 안쪽 칸.
  - `map.kalas` 32×24, music `music.kalas`, heals true. 서문(출구 → `map.field` 다리 동쪽 칸), 가운데 광장(`:`)에 고백석 `L`, 북쪽 고발청, 동쪽 여관, 남쪽 집들, 북동쪽 옛 도서관 건물 안의 계단 `>`(출구 → `map.archive`의 `<` 옆 칸).
  - `map.archive` 12×10, music `music.kalas`, enterFlags `[flag.visited-archive]`, heals false. 입구 계단 `<`(출구 → `map.kalas` 계단 옆 칸), 좁은 복도 한 칸에 조우 `enc.archive.robbers`, 복도 너머 방에 늙은 사서.
  - `start.yaml`: `{ map: map.field, pos: <고리 안>, hp: 12, attack: 3 }`.
- [ ] **Step 4: 단서** (`facts.yaml`) — id 고정, 라벨·힌트 글은 새로 쓴다:

| id | kind | 라벨(예) |
|---|---|---|
| `word.pilgrim` | word | 순례자 |
| `word.truth` | word | 진실 (정답 1) |
| `word.weapon` | word | 무기 (정답 2) |
| `word.lantern` | word | 등불 (정답 3) |
| `word.duty` | word | 의무 (함정) |
| `word.ledger` | word | 장부 (함정) |
| `word.silence` | word | 침묵 (함정) |
| `word.confession` | word | 고백 |
| `word.trial` | word | 재판 |
| `fact.kalas.nia` | person | 필경사 니아 |
| `fact.kalas.tobi` | person | 니아의 동생 토비 |
| `fact.kalas.archive` | place | 옛 서고 |
| `fact.song.lantern-song` | song | 등불 노래 |
| `fact.creature.wolf-hungry` | creature | 굶주린 늑대 |
| `fact.creature.robber-greed` | creature | 도굴꾼 |
| `fact.kalas.lantern-shard` | meaning | 연실이 감긴 등불 조각 |
| `fact.kalas.brother-witness` | meaning | 토비의 고백 |
| `fact.kalas.pilgrim-letter` | meaning | 순례자의 편지 |
| `fact.kalas.ledger-doubt` | meaning | 장부에 대한 의심 |
| `fact.kalas.elin-forgiven` | meaning | 니아의 용서 |

- [ ] **Step 5: NPC와 대화 그래프** (`npcs.yaml`) — 모든 NPC에 `name`, `job` topic. 아래 표의 topic·조건·획득은 **고정**(시나리오 테스트가 이 그래프로 두 갈래를 푼다). 대사는 전부 새로 쓴다.

| NPC id | 지도 | 핵심 topic → 획득 |
|---|---|---|
| `npc.field.gatekeeper` 열석 문지기 | field(고리 옆) | `job` → `word.pilgrim` · `word.pilgrim` → `word.truth` ("순례자는 진실을 가르쳤다") · `fact.kalas.archive` → (힌트 대사) |
| `npc.field.hunter` 사냥꾼 | field(강 서쪽) | `job` → `fact.creature.wolf-hungry` ("늑대는 굶주렸을 뿐 악하지 않다") |
| `npc.kalas.confessor` 성문 고백관 | kalas(서문 안) | `job` 변형 ① `requiresFlags [flag.visited-archive]`, `excludeFlags [flag.kalas.archive-asked]`: choice "금지 구역에 들어갔는가?" — `option.confess-yes`(setsFlags `[flag.kalas.archive-asked]`) / `option.confess-no`(deed `{ honesty, deed.lie }`, setsFlags 같음) · 변형 ② → `word.confession`, `word.duty` |
| `npc.kalas.warden` 고발관장 (위기 npc) | kalas(고발청) | `job` → `word.ledger`, `word.trial` · `word.lantern` → `lie: true` ("그날 밤 광장엔 아무도 없었다") · `word.trial` 변형 ① `requires [fact.kalas.brother-witness]`, `excludeFlags [flag.kalas.warden-asked]`: choice "그 아이에 대해 아는 게 있나?" — `option.tell-warden`(setsFlags `[flag.kalas.warden-asked]`) / `option.deny-warden`(deed `{ honesty, deed.lie }`, setsFlags 같음) · 변형 ② → 재판 설명 |
| `npc.kalas.elin` 고발관 견습 (동료) | kalas(고발청) | `word.ledger` → `word.weapon` ("장부가 이웃을 찌르는 무기가 됐다") · companion `{ virtue: honesty, joinRequires: [fact.kalas.ledger-doubt], leaveAfterDeeds: 2, rejoinRequires: [fact.kalas.elin-forgiven], hp: 8, attack: 2 }` |
| `npc.kalas.nia` 필경사 | kalas(구금실) | `name` → `fact.kalas.nia` · `job` → `word.silence` · `word.lantern` → `lie: true` ("내가 깼다") · `word.ledger` `requires [fact.kalas.brother-witness]` → `fact.kalas.elin-forgiven` |
| `npc.kalas.tobi` 니아의 동생 | kalas(남쪽 집) | `name` → `fact.kalas.tobi` · `fact.kalas.nia` → (누나 걱정) · `word.lantern` `requires [fact.kalas.lantern-shard]` → `fact.kalas.brother-witness` |
| `npc.kalas.mira` 직조공 | kalas(광장 옆) | `word.lantern` → `fact.kalas.lantern-shard` · `word.ledger` → `fact.kalas.ledger-doubt` |
| `npc.kalas.child` 아이 | kalas(광장) | `job` → `fact.song.lantern-song`, `word.lantern` (노래) |
| `npc.kalas.innkeeper` 여관 주인 | kalas(여관) | `job` → `fact.kalas.nia`, `word.trial` · `word.trial` → `fact.kalas.archive` |
| `npc.kalas.librarian` 늙은 사서 | archive(안쪽 방) | `word.pilgrim` → `fact.kalas.pilgrim-letter` · `job` → `fact.creature.robber-greed` |

- [ ] **Step 6: 추론·위기·생물·조우·능력**
  - `deduction.yaml`: `deduction.honesty`, sentence "정직은 {1}을 {2}가 아니라 {3}(으)로 쓰는 것이다"(문자열 값), answer `[word.truth, word.weapon, word.lantern]`, unlocks `[ability.see-lies]`.
  - `crisis.yaml`: `crisis.kalas.trial`, npc `npc.kalas.warden`, options `option.truth: { requires: [fact.kalas.brother-witness, fact.kalas.lantern-shard], setsFlags: [flag.kalas.ledger-kept] }`, `option.lantern: { requires: [fact.kalas.pilgrim-letter], requiresDeductions: [deduction.honesty], setsFlags: [flag.kalas.ledger-burned] }`.
  - `creatures.yaml`: `creature.wolf { evil: false, hp: 4, attack: 2, lore: fact.creature.wolf-hungry }`, `creature.robber { evil: true, hp: 5, attack: 3, lore: fact.creature.robber-greed }`.
  - `encounters.yaml`: `enc.field.wolves` — 7×7 풀 격자(가운데 바위 `T` 2개), allyStart `[(3,6), (2,6), (4,6)]`, 늑대 3마리 `(1,0) (3,0) (5,0)`, music `music.battle`. `enc.archive.robbers` — 7×5 서고 바닥(`_`, 기둥 `%` 2개), allyStart `[(3,4), (2,4), (4,4)]`, 도굴꾼 2명 `(2,0) (4,0)`.
  - `abilities.yaml`: `ability.see-lies`.
- [ ] **Step 7: 문자열** — `content/strings/ko.yaml`에 위 모든 키 + Task 13의 UI 키 + `npc.default.unknown`("…글쎄, 그건 잘 모르겠네."), `topic.name`("이름"), `topic.job`("일"). **모든 대사는 새로 쓴다**(원작 문장·번역 금지, 금지어 검사 통과).
- [ ] **Step 8: 악보** — `content/music/field.yaml`: 「Greensleeves」(작자 미상, 16세기 영국, 공유 저작물) 칩 편곡, tempo 96, 3채널(square50 선율 / triangle 베이스 / noise 박), 20–40초 루프. `kalas.yaml`: Tielman Susato 「Danserye」(1551) 중 「La Mourisque」 편곡, 4채널(square50, square25, triangle, noise). `battle.yaml`: 자작 짧은 루프(8마디, 4채널). 장부(D20)에 3행: `| content/music/field.yaml | Greensleeves (traditional, England, 16th c., public domain) — chip arrangement | TaejinKim7-dev | CC-BY-SA-4.0 |`, `| content/music/kalas.yaml | Tielman Susato, Danserye (1551), La Mourisque (public domain) — chip arrangement | TaejinKim7-dev | CC-BY-SA-4.0 |`, `| content/music/battle.yaml | original | TaejinKim7-dev | CC-BY-SA-4.0 |` (Task 4의 자리표시 행은 교체).
- [ ] **Step 9: 확인** — Run: `npm run check:content` → `check:content: ok (3 maps, 11 npcs, 20 facts, 6 ledger files)`. Run: `npx vitest run tests/unit/content-compile.test.ts tests/unit/ledger.test.ts` → passed.
- [ ] **Step 10: 커밋** `content(kalas): town of honesty — maps, people, deduction, trial, encounters, music`

### Task 16: 시나리오 테스트, 연결, 플레이 확인

**Files:**
- Create: `tests/scenario/play.ts`, `tests/scenario/kalas-truth.test.ts`, `tests/scenario/kalas-lantern.test.ts`, `tests/scenario/kalas-rules.test.ts`, `tests/e2e/boot.spec.ts`, `playwright.config.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: 모든 이전 Task
- Produces:
  - `loadRealContent(): GameContent` — `compileContent(loadContentDir("content"))`, 오류면 throw.
  - `play(content: GameContent, commands: readonly Command[], seed = 1): { state: GameState; events: GameEvent[] }`
  - `walkTo(content, state, mapId, target: Pos): Command[]` — `findPath`로 `move` 명령 목록(출구를 지나 지도 전환도 따라감: 목표 지도가 다르면 출구를 거쳐 이어 붙임), 경로 없으면 throw(시나리오가 콘텐츠 배치 오류를 바로 드러냄).
  - `talk(npcId: Id, topics: readonly string[]): Command[]` — NPC 인접 칸까지 걷는 건 `walkTo`가, 이 헬퍼는 `interact(at)` + `ask`들 + `endTalk`.

- [ ] **Step 1: 시나리오 테스트 작성 → RED → (콘텐츠·코드 보정) → GREEN**
  - `kalas-truth`: 늑대 다리 → **밀어내기**로 통과(전투 명령을 직접 나열) → 아이(`job`) → 직조공(`word.lantern`) → 토비(`word.lantern`) → 고발관장 `resolveCrisis option.truth`. 기대: `crises["crisis.kalas.trial"] === "option.truth"`, `flags`에 `flag.kalas.ledger-kept`, `deeds` 비어 있음.
  - `kalas-lantern`: 문지기(`job`, `word.pilgrim`) → 다리 → 고발관장(`job`) → 엘린(`word.ledger`) → 아이(`job`) → 서고 → 도굴꾼 전투 승리 → 사서(`word.pilgrim`) → 추론 3칸 `fillSlot` → 고발관장 `option.lantern`. 기대: `flag.kalas.ledger-burned`, `abilities`에 `ability.see-lies`, `clearedEncounters`에 `enc.archive.robbers`.
  - `kalas-rules`(실제 콘텐츠):
    - (a) `[word.truth, word.weapon, word.duty]`로 채우면 `confirmed false`, 이벤트에 `deductionConfirmed` 없음.
    - (b) 늑대 하나를 공격으로 죽이면 `deeds`에 `{ virtue: "compassion", deed: "deed.kill-innocent" }`, 밀어내 격자 밖으로 보내면 기록 없음.
    - (c) 직조공 `word.ledger` → 엘린 영입 → 서고 다녀오기 → 고백관 `option.confess-no` → (토비 증언 후) 고발관장 `option.deny-warden` → `companionLeft npc.kalas.elin`. 니아 `word.ledger`(토비 증언 뒤) → 엘린 다시 영입 → `party` = `["npc.kalas.elin"]`.
    - (d) 명령 목록 앞 절반 실행 → `serialize` → `deserialize` → 뒤 절반 실행한 결과가 한 번에 실행한 결과와 `toEqual`.
- [ ] **Step 2: `main.ts` 연결**
  - 부팅: `virtual:content`, `virtual:credits`, 시트 이미지(`import.meta.glob("../assets/tiles/*.png", { query: "?url", import: "default", eager: true })`), `createIndexedDbSlotStore(indexedDB)`, `loadSlot(store, AUTO_SLOT)`가 `ok`면 그 상태, 아니면 `createInitialState(content, Date.now() >>> 0)`. 실패한 불러오기는 `log.log("load-failed", reason)`만 하고 새 게임.
  - 루프: `dispatch(cmd)` → `UiAction`이면 `panels.toggle`, `Command`면 `step` → 상태 교체 → 이벤트 처리(`said` → 대화 로그, `sfx`/`moved`/`bumped`/`factLearned`/`deductionConfirmed` → `SFX` 재생, `music` → `player.play(content.music[track])`, `combatEnded`·`endTalk` 후 로그 비움) → `requestAnimationFrame`으로 `drawFrame` + `panels.render`.
  - 터치 이동: `moveTo` 탭 → 목표를 기억하고 120ms마다 `moveTo`를 다시 보냄. 도착·이벤트 0개·다른 입력·대화/전투 시작 시 멈춤.
  - 자동 저장: 마지막 자동 저장 이후 `turn` 50 이상 증가, `mapChanged`, `crisisResolved`, `combatEnded` 때 `saveToSlot(store, AUTO_SLOT, "auto", state, Date.now())`.
  - 디버그 로그(`?debug=1`): 명령과 이벤트 type 목록.
  - 캔버스 크기: `ResizeObserver`로 CSS 크기 × `devicePixelRatio`.
- [ ] **Step 3: e2e 1개** — `playwright.config.ts`: `webServer: { command: "npm run build && npx vite preview --port 4173 --strictPort", url: "http://localhost:4173/hollow-codex/" }`, Chromium 하나. `boot.spec.ts`: 페이지 열기 → `#screen` 보임 → 2초 안에 콘솔 `error` 0개. 컨트롤러가 Haiku로 `npx playwright install chromium && npm run test:e2e` 1회 실행 → `1 passed`.
- [ ] **Step 4: merge 게이트(Haiku)** — 7개 명령 모두 exit 0 → `docs/handoff.md`에 명령·exit code 기록 → `todo-2-kalas`를 main에 merge·push → `gh run watch … --exit-status` → Pages `200`.
- [ ] **Step 5: 사용자 플레이 확인 요청** — `npm run dev` URL과 Pages URL을 주고, PC와 휴대폰으로 칼라스를 두 갈래 모두 끝까지 해 달라고 요청. spec §8.1 체크리스트 9개를 `docs/handoff.md`에 옮기고, 사용자 판정(계속 / 방향 수정 / 중단)을 기록할 칸을 둔다. **이 판정 전에는 M2 계획을 쓰지 않는다.**
