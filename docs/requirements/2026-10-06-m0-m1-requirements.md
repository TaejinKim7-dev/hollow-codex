# 빈 경전 (Hollow Codex) — M0+M1 개발 요구사항 명세

- 문서 버전: 1.0 (2026-10-06)
- 근거: 설계 스펙 `docs/superpowers/specs/2026-10-06-hollow-codex-design.md`(이하 **spec**), 구현 계획 상세판 `docs/superpowers/plans/2026-10-06-m0-m1-kalas-slice.md`(이하 **plan**, 이 문서와 같은 커밋의 판)
- 우선순위: 이 문서와 spec이 다르면 plan의 "확정 결정"(D1–D20)이 이긴다. 이 문서와 plan이 다르면 plan을 고치기 전까지 **plan이 이긴다** — 다른 점을 발견하면 이 문서의 10장에 적는다.
- 독자: 이 프로젝트의 이전 대화·AI 작업 방식을 모르는 개발자. 이 문서와 저장소만으로 M0+M1을 만들 수 있어야 한다.

### 읽는 순서
1. 1장(개요)·2장(환경·절차) — 무엇을, 어떤 규칙으로 만드는가.
2. 3장(아키텍처)·6장(데이터·인터페이스) — 코드의 뼈대와 타입.
3. 4장(기능)·5장(콘텐츠) — 각 시스템이 정확히 무엇을 해야 하는가.
4. 7장(비기능)·8장(검증) — 언제 "다 됐다"고 말할 수 있는가.
5. 구현 순서가 필요하면 plan의 Task 1–16을 따른다(9장 추적표가 요구사항 ↔ Task를 잇는다).

### 요구사항 표기
- ID 형식: `<영역>-<번호>` (예 `FR-NTB-03`). 영역 코드는 각 장 머리에 있다.
- 각 요구사항은 **설명 · 조건/입력 · 기대 동작 · 예외 · 수용 기준 · 출처**를 가진다. 짧은 요구사항은 표 한 줄로 쓴다.
- "수용 기준"의 `테스트명`은 그 요구사항을 고정하는 Vitest 테스트 이름이다. 이 이름 그대로 테스트를 만든다.
- 필수 정도: **반드시(MUST)** — 없으면 M1 미완성. **권장(SHOULD)** — 사용자 판정 전에 있어야 하지만 테스트로 막지는 않음.

---

## 1. 개요

### 1.1 제품
미덕이 제도가 되어 굳어 버린 대륙 알마에서, 이방인이 사람들과 대화하며 모은 지식으로 미덕의 본래 뜻을 되찾는 **지식 기반 탐험 RPG**. 웹(PC 키보드·마우스 + 모바일 터치), 한국어 우선. 레벨·경험치가 없고, 아는 것이 진행을 연다(spec §0, §1).

### 1.2 이번 범위 (M0 + M1)
| 단계 | 내용 | 완료 기준 |
|---|---|---|
| **M0 골격** | 저장소·도구·라이선스·작업 규칙, Pages 배포, dist 검사, 콘텐츠 컴파일러·금지어 검사, 자산 장부·글꼴·크레딧 | 빈 화면이 Pages에 배포되고 merge 게이트 7개가 모두 exit 0 (spec §8 M0) |
| **M1 칼라스 수직 슬라이스** | 정직의 마을 칼라스 하나를 약 45분 동안 처음부터 끝까지 플레이 | 8장의 완료 기준 9개 전부 + 사용자 플레이 판정 (spec §8.1) |

### 1.3 범위 밖 (이번에 만들지 않는다)
| 항목 | 이유 | 언제 |
|---|---|---|
| Google Drive 동기화 | M1 완료 기준에 없고 새 OAuth 클라이언트가 필요 | M2 이후 (spec과 다르게 정한 점 3, 사용자 승인) |
| 낮·밤과 NPC 일과 | spec §4.7은 M2 범위 | M2 (승인된 차이 4) |
| Tiled JSON 지도 | M1은 YAML 안의 ASCII 격자 | M2에서 필요하면 (승인된 차이 1) |
| MIDI 악보 | M1은 텍스트 악보 YAML | 외부 MIDI를 쓸 때 변환기 추가 (승인된 차이 2) |
| 다른 7개 마을, 열석 순간이동, 엔딩, PWA, 영어 | M2–M6 | spec §8 |

### 1.4 용어집
| 용어 | 뜻 |
|---|---|
| 단서 (fact) | 대화로 얻는 원자 단위 지식. 고유 id(`word.lantern`, `fact.kalas.nia`)와 종류(kind)를 가진다. 종류: `person` 사람, `place` 장소, `word` 단어, `song` 노래, `meaning` 뜻 조각, `creature` 생물 도감 |
| 단어 | kind가 `word`인 단서. 추론 칸에 넣을 수 있다 |
| 수첩 | 플레이어가 아는 단서·추론·소문 힌트를 보여 주는 화면 |
| 추론 페이지 (deduction) | "이 미덕의 본래 뜻" 문장의 빈칸 3개. 정답 단어 3개가 **순서대로 모두 맞을 때만** 확정된다 |
| 소문 힌트 | 아직 못 연 위기 선택지·대화 주제에 무엇이 부족한지 흐릿하게 알려 주는 목록. 추론의 정답은 절대 드러내지 않는다 |
| 능력 (ability) | 추론 확정으로 열리는 힘. M1에는 `ability.see-lies`(대화 속 거짓말 표시) 하나 |
| topic | NPC에게 묻는 주제. 키는 `name`, `job`, 또는 단서 id |
| 변형 (variant) | 같은 topic의 상황별 답. 조건을 처음 만족하는 변형이 답한다 |
| 선택지 (choice) | topic 답 뒤에 플레이어가 고르는 응답. 행실을 남길 수 있다 |
| 행실 (deed) | 숨은 행동 기록. "기록 1건 = 그 미덕을 어긴 일 1건". 예: 거짓말 → 정직, 악하지 않은 생물 살해 → 연민 |
| 동료 (companion) | 합류하는 NPC. 합류 뒤 자기 미덕을 어긴 행실이 일정 수에 이르면 떠나고, 조건을 채우면 돌아온다 |
| 위기 (crisis) | 마을의 문제. 아는 것에 따라 풀이 선택지가 열린다. 한 번만 풀린다 |
| 조우 (encounter) | 지도의 한 칸에 놓인 고정 전투 |
| 예고 (intent) | 적이 다음에 어디로 가서 누구를 칠지 미리 보여 주는 정보 |
| 턴 (turn) | 탐험 시간 단위. 이동할 때 그 칸의 지형 비용만큼 는다 |
| 라운드 (round) | 전투 안의 한 바퀴(아군 전원 차례 → 적 단계) |
| 이벤트 (event) | `step`이 상태와 함께 돌려주는 "무슨 일이 있었나" 목록. 화면·소리는 이벤트를 보고 반응한다 |

---

## 2. 개발 환경과 작업 절차 (영역 코드 `ENV`)

### 2.1 도구 (ENV-01, 반드시)
| 도구 | 버전 (고정) | 용도 |
|---|---|---|
| Node.js | 22.23.3 (`engines: ">=22.18.0"`) | `.ts` 파일을 타입 제거로 직접 실행 |
| TypeScript | 5.8.3 | 타입 검사만(`noEmit`) |
| Vite | 6.3.4 | 개발 서버·빌드, base `/hollow-codex/` |
| Vitest | 3.1.3 | 단위·시나리오 테스트(node 환경) |
| @playwright/test | 1.52.0 | e2e 1개 |
| @types/node | 22.15.3 | |
| yaml | 2.9.1 (ISC) | 콘텐츠 파싱(빌드·테스트 때만, 번들에 들어가지 않음) |

로컬 셸은 `export PATH="$HOME/.local/opt/node22/bin:$PATH"` 뒤 `node -v` → `v22.23.3`.

### 2.2 npm 스크립트 (ENV-02, 반드시)
| 스크립트 | 명령 | 성공 출력 |
|---|---|---|
| `dev` | `vite` | 로컬 URL |
| `build` | `vite build` | `dist/` |
| `preview` | `vite preview` | |
| `test:unit` | `vitest run --passWithNoTests=false` | 모든 테스트 passed |
| `test:e2e` | `playwright test` | `1 passed` |
| `typecheck` | `tsc --noEmit` | 출력 없음, exit 0 |
| `check:content` | `node scripts/check-content.ts` | `check:content: ok (<지도> maps, <NPC> npcs, <단서> facts, <n> ledger files)` |
| `audit:dist` | `node scripts/audit-dist.ts` | `audit:dist: ok (<파일 수> files, <바이트> bytes)` |

### 2.3 TypeScript·노드 실행 규칙 (ENV-03, 반드시)
- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `allowImportingTsExtensions`, `noEmit`, `moduleResolution: "bundler"`, `types: ["node", "vitest/globals"]`. `include`: `src`, `tests`, `scripts`, 설정 파일들.
- `scripts/*.ts`는 빌드 없이 `node`로 돈다(타입 제거). 그래서 `src/`·`scripts/`·`tests/`의 **모든 상대 import는 `.ts` 확장자**를 붙이고(`./a.ts`), 타입만 쓰는 import는 `import type`. `enum`, `namespace`, 생성자 매개변수 프로퍼티, `import x = require()`는 쓰지 않는다.

### 2.4 절대 금지 (ENV-04, 반드시)
- 원작 게임(spec §2.2 목록)의 고유명사·문장·음악·데이터를 `content/`, `src/`, `scripts/`, `tests/`, 문자열 표, 주석에 넣지 않는다. 목록은 `content/ip-denylist.yaml` 한 곳에만 있고, 그 파일만이 그 이름들을 담을 수 있다. 테스트에서 금지어 동작을 보여야 하면 **지어낸 단어**(예: `zorvania`, `조르바니아`)를 쓴다.
- 원작 매뉴얼 스캔(`u4-alt-manual.pdf`), 줄거리 메모(`origin.txt`), 이웃 저장소 `/home/taejin/ultima`의 번역문(`locales/` 등)은 이 저장소에 절대 들어오지 않는다. `/home/taejin/ultima`에서는 plan이 지목한 도구 코드(`debug-log.ts`, `slot-store.ts`, 글꼴, 워크플로 구조)만 가져온다.
- 외부 자산은 CC0 / CC-BY / CC-BY-SA / OFL만. 비상업(NC)·변경 금지(ND)·출처 불명 금지.
- secret(`client_secret_*.json` 등) 커밋 금지. 실패한 테스트를 지우거나 약하게 바꿔 통과시키지 않는다.

### 2.5 작업 절차 (ENV-05, 반드시)
1. **TDD**: 실패하는 테스트 먼저 → 실행해 실패(RED) 출력을 기록 → 최소 구현으로 통과(GREEN) → 정리.
2. 단계마다 진행 → 저장(커밋) → 기록(`docs/handoff.md`) → 확인.
3. **브랜치**: Task 1–4는 `todo-1-skeleton`, Task 5–16은 `main`에서 새로 딴 `todo-2-kalas`. PR 없이 `main`에 직접 merge 후 push.
4. **merge 지점** 3번: Task 2 끝(첫 배포 확인), Task 4 끝(M0 완료), Task 16 끝(M1 완료) (D16).
5. **merge 게이트** — merge 전에 7개 모두 exit 0:
   `npm ci` · `npm run test:unit` · `npm run typecheck` · `npm run check:content` · `npm run build` · `npm run audit:dist` · `git diff --check`
6. 화면·소리·조작감은 사람이 직접 확인한다. 고친 뒤 e2e를 돌리는 대신 `npm run dev` URL로 확인한다.
7. 실패를 숨기지 않는다: 명령, exit code, 실패 출력을 그대로 기록한다.

### 2.6 라이선스 (ENV-06, 반드시)
- 코드(`src/`, `scripts/`, 설정): MIT — `LICENSE`, `Copyright (c) 2026 TaejinKim7-dev`.
- 콘텐츠(`content/`)와 이 프로젝트가 직접 만든 자산: CC BY-SA 4.0 — `LICENSE-CONTENT`(적용 범위 문단 + 전문).
- 외부 자산: 각자의 원래 라이선스, `assets/LEDGER.md`에 기록.

---

## 3. 아키텍처 요구사항 (영역 코드 `AR`)

### AR-01 모듈 경계 (반드시)
| 디렉터리 | 책임 | 의존해도 되는 것 |
|---|---|---|
| `src/core/` | 순수 게임 규칙: 이동, 대화, 수첩, 행실, 위기, 전투, 직렬화 | `src/content/types.ts`(타입만), 자기 자신 |
| `src/content/` | 콘텐츠 타입, YAML → `GameContent` 컴파일, 금지어, 장부, Vite 플러그인 | `yaml`, `node:*`(load-node·플러그인만) |
| `src/render/` | 시야 계산(순수), Canvas2D 그리기 | core 타입 |
| `src/input/` | 키·포인터 → 명령(순수) | core |
| `src/ui/` | 문자열 조회, 표시 데이터(순수), DOM 패널 | core |
| `src/audio/` | 악보 파싱·효과음 생성(순수), Web Audio 재생 | content 타입, core `nextRandom` |
| `src/save/` | 저장 슬롯(IndexedDB/메모리) | core 직렬화 |
| `src/audit/` | dist 검사 규칙(순수) | 없음 |
| `src/main.ts` | 부팅과 루프 연결 | 전부 |
| `scripts/` | CLI: 콘텐츠 검사, dist 검사 | `src/content`, `src/audit` |

### AR-02 core 순수성 (반드시)
- `src/core/**`는 `document`, `window`, `HTMLElement`, `CanvasRenderingContext2D`, `AudioContext`, `Math.random`을 참조하지 않는다.
- 수용 기준: `tests/unit/core/purity.test.ts`가 `src/core` 아래 모든 `.ts`를 읽어(주석 제거 후) 위 이름이 없음을 확인하고, 검사한 파일이 1개 이상임도 확인한다.

### AR-03 데이터 흐름 (반드시)
```
키보드/마우스/터치 → input → Command
Command → core.step(state, command, content) → { state', events }
state' → render(캔버스) · ui(패널)        events → ui(대화 기록) · audio(음악·효과음) · 자동 저장
```
- 화면·소리는 상태를 바꾸지 않는다. 상태를 바꾸는 유일한 길은 `step`이다.

### AR-04 불변 상태와 결정성 (반드시)
- `step`과 모든 core 함수는 입력 `GameState`를 바꾸지 않고 새 객체를 돌려준다. 바뀐 게 없으면 같은 객체를 돌려줘도 된다.
- 같은 초기 상태 + 같은 명령 순서 → 항상 같은 상태와 이벤트. 난수가 필요하면 `state.rng`(mulberry32 시드)로만 만든다. M1의 규칙에는 무작위가 없다.
- 수용 기준: 이동 테스트가 깊게 동결된(`Object.freeze` 재귀) 상태로 실행된다(변경 시 TypeError로 실패). 시나리오 테스트 (d) "저장 → 불러오기 후 이어 실행 = 한 번에 실행".

### AR-05 모드별 명령 분배 (반드시)
| 상태 | 처리하는 명령 | 그 밖의 명령 |
|---|---|---|
| `combat !== null` (전투) | `combat` | 무시: 같은 state, 이벤트 0개 |
| `dialogue !== null` (대화) | `ask`, `choose`, `endTalk`, `resolveCrisis`, `recruit`, `fillSlot` | 무시 |
| 둘 다 null (탐험) | `move`, `moveTo`, `interact`, `fillSlot` | 무시 |

- 수용 기준: `commands other than combat are ignored during combat`, `movement is ignored while a dialogue is open`.

### AR-06 콘텐츠는 데이터 (반드시)
- 지도·NPC·대사·단서·추론·위기·생물·조우·음악은 전부 `content/` YAML에 있고, 코드에 마을 고유의 id나 대사를 하드코딩하지 않는다(예외: core가 아는 고정 id 몇 개 — `ability.see-lies`(UI의 거짓말 표시), `deed.kill-innocent`(전투), `npc.default.unknown`·`topic.name`·`topic.job`(문자열 키), `"player"`(전투 유닛 id)).
- 화면에 보이는 모든 글은 `content/strings/ko.yaml`의 키로 꺼낸다. 코드에 한국어 화면 문구를 쓰지 않는다(예외: `index.html`의 제목 "빈 경전" — 콘텐츠를 읽기 전 화면).

---
## 4. 기능 요구사항 (영역 코드 `FR`)

공통: 아래에서 "무시"는 **같은 state를 돌려주고 이벤트 0개**를 뜻한다. 좌표 `(x, y)`는 0부터, x는 오른쪽, y는 아래쪽. 방향 `n`(y−1) `e`(x+1) `s`(y+1) `w`(x−1). "인접"은 맨해튼 거리 1.

### 4.1 탐험·이동 (`FR-WLD`, plan Task 5)

| ID | 요구사항 | 수용 기준 (테스트명) | 출처 |
|---|---|---|---|
| FR-WLD-01 | **새 게임 상태**: `createInitialState(content, seed)` — `rng = seed >>> 0`, `turn 0`, 시작 지도·위치 = `content.start`, 바라보는 방향 `s`, `hp = maxHp = start.hp`, `attack = start.attack`, 모든 추론을 `{ slots: [null, null, null], confirmed: false }`, 나머지 목록·객체는 비움, 대화·전투 없음. | 이동 테스트들이 이 상태에서 출발 | Task 5 |
| FR-WLD-02 | **한 칸 이동**: `move(dir)`은 항상 `facing = dir`로 바꾼다. 목표 칸이 걸을 수 있으면 이동하고 `turn += 그 칸의 walk`(풀 1, 덤불 2), 이벤트 `moved(pos)`. | `moves one tile and advances the turn by the terrain cost` | spec §4.7, Task 5 |
| FR-WLD-03 | **충돌**: 목표 칸이 지도 밖, `walk: null`(벽·물·나무 등), 또는 NPC가 선 칸이면 이동하지 않고 턴도 쓰지 않는다. 이벤트 `bumped`. 바라보는 방향은 바뀐다. | `bumps into a blocking tile without moving or spending a turn`, `bumps into an NPC` | Task 5 |
| FR-WLD-04 | **출구**: 이동한 칸이 지도의 출구면 이어서 지도 전환 — `mapId = to`, `pos = arrive`, 새 지도의 `enterFlags`를 플래그에 추가(정렬·중복 없음), 이벤트 `moved` → `mapChanged(to)` → `music(새 지도 music)`. | `changes map at an exit and arrives at the exit's arrive position` | Task 5 |
| FR-WLD-05 | **회복 지도**: 새 지도가 `heals: true`면 들어갈 때 `hp = maxHp`. 칼라스 마을이 회복 지도다. | `entering a healing map restores hp` | D12 |
| FR-WLD-06 | **조우 진입**: 이동한 칸에 아직 `clearedEncounters`에 없는 조우가 있으면 전투를 시작한다(FR-CMB-01). 이벤트 `moved` → `combatStarted(encounterId)` → `music(조우 music)`. 이미 이긴 조우는 다시 시작하지 않는다. | `starts the encounter placed on the tile` | Task 5 |
| FR-WLD-07 | **터치 이동 한 걸음**: `moveTo(target)`은 BFS 최단 경로(NPC 칸은 막힘)의 첫 걸음을 `move`로 실행한다. 경로가 없거나 이미 도착했으면 무시. 상태에 목표를 저장하지 않는다(반복은 UI가, FR-UI-09). | `moveTo walks the BFS path one step per command until the target` | Task 5 |
| FR-WLD-08 | **길찾기**: `findPath(content, mapId, from, to, blocked)` — 4방향 BFS, 이웃을 `n, e, s, w` 순서로 살펴 결정적, 지형 비용은 무시하고 칸 수 최단. `from == to` → `[]`. `to`가 막힘·지도 밖·`blocked(to)` → `null`. | `finds the shortest path around walls`, `routes around a blocked tile`, `returns null when unreachable`, `returns [] when already there` | Task 5 |
| FR-WLD-09 | **동행 NPC 숨김**: `party`에 있는 NPC는 지도에서 빠진다 — 그리지 않고, 막지 않고, 대화 대상이 아니다. 떠나면(`departed`) 원래 자리에 다시 선다. `npcAt(state, content, p)`가 이 규칙을 담는다. | `a party member is hidden from the map and does not block` | D19 |
| FR-WLD-10 | **NPC는 고정 위치**(M1에 일과 없음). | — | 승인된 차이 4 |

### 4.2 대화 (`FR-DLG`, plan Task 7)

**topic 키와 칩(D8)**: NPC의 topic 키는 `"name"`, `"job"`, 또는 **단서 id**(어떤 kind든). 대화창의 질문 칩 = `name`, `job` + 플레이어가 아는 단서 중 kind가 `word`·`person`·`place`인 것 전부(id 정렬). 그 NPC가 그 topic을 가졌는지와 무관하다 — 없으면 "모른다"고 답한다(spec §4.1 "수첩의 단어는 누구에게나 물어볼 수 있다").

**변형(D9)**: topic 값은 변형 목록. 변형은 `requires`(아는 단서 전부), `requiresFlags`(플래그 전부), `excludeFlags`(하나도 없어야 함)를 가질 수 있고, 조건을 **처음** 만족하는 변형이 답한다.

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-DLG-01 | **말 걸기**: `interact`(인자 없음)는 바라보는 칸의 NPC와 대화를 연다 — `dialogue = { npcId, pendingChoice: null }`, 이벤트 `said(npcId, greetKey, lie false)`. NPC가 없으면 아무 일도 없다(이벤트 0). | `interact opens a dialogue with the NPC the player faces` | Task 7 |
| FR-DLG-02 | **탭으로 말 걸기**: `interact(at)`는 `at`이 플레이어와 인접할 때만 — 먼저 그쪽을 바라보고 대화를 연다. 인접하지 않으면 무시. | `interact at an adjacent tile turns the player toward it` | Task 7 |
| FR-DLG-03 | **묻기**: `ask(topic)` — 칩 목록에 없는 topic이면 무시. 고른 변형의 `textKey`로 `said`(그 변형의 `lie` 값), `setsFlags` 추가, `grants`를 배움(FR-NTB-01의 `factLearned` 이벤트가 이어짐). | `asking a topic says its text and grants its facts` | Task 7 |
| FR-DLG-04 | **모른다**: NPC가 그 topic이 없거나 만족하는 변형이 없으면 `said(npcId, "npc.default.unknown", false)`. | `a topic with unmet requires answers with the NPC's default "모른다" key` | Task 7 |
| FR-DLG-05 | **모르는 단어는 물을 수 없다**: 플레이어가 모르는 단서 id로 묻기 → 무시. | `asking about an unknown word is ignored` | Task 7 |
| FR-DLG-06 | **거짓말**: `lie: true`인 변형의 `said` 이벤트는 `lie: true`. 화면 표시는 플레이어가 `ability.see-lies`를 가질 때만(FR-UI-03). | `a lie topic marks the said event lie: true` | spec §4.3, Task 7 |
| FR-DLG-07 | **선택지**: 변형에 `choice`가 있으면 답한 뒤 `pendingChoice = topic`. 기다리는 동안 `ask`는 무시. `choose(optionId)`는 그 선택지에 있는 id만 받는다 — `said(option.textKey)`, option `setsFlags`, `grants` 배움, `deed`가 있으면 행실 기록(FR-CND-01), `pendingChoice = null`. 다음에 같은 topic을 물으면 `excludeFlags` 때문에 다음 변형이 답할 수 있다. | `a choice topic waits for choose, then records the option's deed` | Task 7, 8 |
| FR-DLG-08 | **대화 중 이동 금지**: 대화가 열려 있으면 `move`·`moveTo`·`interact`는 무시(위치 그대로, 이벤트 0). | `movement is ignored while a dialogue is open` | Review Focus 4 |
| FR-DLG-09 | **닫기**: `endTalk` → `dialogue = null`, 이벤트 0. | `endTalk closes the dialogue` | Task 7 |
| FR-DLG-10 | **칩 목록 함수**: `availableTopics(state, content, npcId)` = `["name", "job", ...아는 word/person/place 단서 id 정렬]`. | `availableTopics lists name, job and known word/person/place facts` | D8 |

### 4.3 수첩 — 단서, 추론, 소문 힌트 (`FR-NTB`, plan Task 6)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-NTB-01 | **단서 배우기**: `learn(state, ids)` — 모르는 것만 추가(정렬·중복 없음), 새로 배운 것마다 `factLearned`(입력 순서). 새 것이 없으면 같은 state, 이벤트 0. | `learning a fact twice emits one factLearned` | spec §4.1 |
| FR-NTB-02 | **칸 채우기**: `fillSlot(deductionId, slot, word)` — 탐험·대화 중 모두 가능. `word`는 아는 `word` 단서이거나 `null`(비우기). | 아래 | spec §4.1 |
| FR-NTB-03 | **확정 규칙**: 세 칸이 정답과 **순서대로 모두 같을 때만** `confirmed: true`, 이벤트 `deductionConfirmed` → 아직 없는 능력마다 `abilityUnlocked` → `sfx "confirm"`. | `a deduction confirms only when all three slots match the answer` | spec §4.1, §8.1-2 |
| FR-NTB-04 | **신호 없음**: 확정이 아니면 이벤트 0개. 상태의 추론 기록은 `slots`, `confirmed` 두 필드뿐 — "맞은 개수"는 어디에도 없다(찍기 방지). | `two correct slots give no confirmation and no signal` | spec §4.1 |
| FR-NTB-05 | **같은 단어 여러 칸**: 같은 단어를 세 칸에 넣어도 정답이 그렇지 않으면 확정되지 않는다. 정답이 실제로 같은 단어를 두 칸 이상 요구하면 확정된다. 오류가 나지 않는다. | `same word in two slots never confirms unless the answer says so` | Review Focus 1 |
| FR-NTB-06 | **무시 조건**: 없는 추론, 칸 번호가 0·1·2가 아님, 이미 확정됨, 모르는 단어, kind가 `word`가 아닌 단서. | `filling a slot with an unknown word is ignored`, `a non-word fact or a bad slot index is ignored`, `a confirmed deduction cannot be changed` | Task 6 |
| FR-NTB-07 | **소문 힌트** `openHints(state, content)` → `{ targetId, missing }[]`: (a) 안 풀린 위기의 못 고르는 선택지 — `targetId = optionId`, `missing = 모르는 requires + 미확정 requiresDeductions`; (b) 플레이어가 **아는** 단서 id를 키로 가진 NPC topic 중 모든 변형의 `requires`가 미충족인 것 — `targetId = "<npcId>:<topicKey>"`, `missing` = 첫 변형의 모르는 requires. `targetId` 정렬, `missing` 정렬. | `openHints lists the missing facts for a locked crisis option`, `openHints lists a locked topic only when its key is known, and never answer words` | spec §4.1, D17 |
| FR-NTB-08 | **정답 비공개**: 추론의 정답 단어는 힌트에 절대 나오지 않는다. 미확정 추론이 위기 조건이면 단어 대신 그 추론의 `hintKey`를 보여 준다. | 위 테스트의 `never answer words` 부분 | D17 |

### 4.4 행실과 동료 (`FR-CND`, plan Task 8)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-CND-01 | **행실 기록** `recordDeed(state, content, virtue, deed)`: `deeds`에 `{ virtue, deed, turn }` 추가, 이벤트 `deed`. 이어서 동료 이탈 판정(FR-CND-03). 대화 선택지·전투의 행실은 모두 이 함수를 거친다. | `a choice deed goes through recordDeed` | spec §4.2 |
| FR-CND-02 | **합류**: `recruit(npcId)`는 그 NPC와 대화 중일 때만. `canRecruit` 조건 — 동료 정의가 있음, 아직 동행 아님, 동행 수 < 3, (`departed`에 있으면 `rejoinRequires`, 아니면 `joinRequires`) 단서를 모두 앎. 성공 시 `party` 끝에 추가, `departed`에서 제거, `joinedAt[npcId] = 지금 deeds.length`, 이벤트 `companionJoined`. | `recruit succeeds only when joinRequires facts are known`, `recruit is ignored unless talking to that NPC` | spec §4.6 |
| FR-CND-03 | **이탈**: 동행 동료마다 `deeds[joinedAt[id]..]` 중 그 동료의 미덕(`virtue`)과 같은 기록 수 ≥ `leaveAfterDeeds`면 떠난다 — `party`에서 빼고 `departed`에 추가(중복 없이), `joinedAt`에서 삭제, 이벤트 `companionLeft`. **합류 전 행실은 세지 않는다.** 다른 미덕의 행실도 세지 않는다. | `a companion leaves after leaveAfterDeeds deeds against their virtue since joining` | spec §4.6, D11 |
| FR-CND-04 | **복귀**: 떠난 동료는 `rejoinRequires` 단서를 모두 알면 다시 영입할 수 있다. | `a departed companion rejoins once rejoinRequires facts are known` | spec §4.6 |
| FR-CND-05 | **중복 없음**: 어떤 순서로 영입·이탈·복귀해도 `party`에 같은 id가 두 번 들어가지 않는다. | `rejoining never duplicates a companion` | Review Focus 5 |
| FR-CND-06 | **최대 3명**: 플레이어 외 동행은 최대 3명(`MAX_PARTY = 3`). | `party holds at most three companions` | spec §4.5 |

### 4.5 마을 위기 (`FR-CRS`, plan Task 9)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-CRS-01 | **선택지 상태** `crisisOptions(state, content, crisisId)` → content 순서대로 `{ optionId, available, missing }`. `missing` = 모르는 `requires` + 미확정 `requiresDeductions`(정렬), `available = missing이 비었음`. | `an option is available only when its facts and deductions are met` | spec §4.4 |
| FR-CRS-02 | **어디서 푸는가**: `resolveCrisis(crisisId, optionId)`는 위기의 `npc`와 대화 중이고 선택지를 기다리는 중이 아닐 때만 유효. 대화창에 선택지 버튼이 뜬다(FR-UI-04). | `resolving needs a dialogue with the crisis NPC` | D10 |
| FR-CRS-03 | **해결**: `crises[crisisId] = optionId`, `setsFlags` 추가, 이벤트 `said(crisis.npc, option.textKey, false)` → `crisisResolved`. | `resolving sets the option's flags and emits crisisResolved` | Task 9 |
| FR-CRS-04 | **한 번만**: 이미 풀린 위기는 다시 풀리지 않는다(다른 선택지도 무시). 고른 선택지는 저장되어 이후 에필로그(M5)에 쓰인다. | `a crisis resolves once` | spec §4.4 |
| FR-CRS-05 | **못 고르는 선택지 거부**: `available`이 아닌 선택지는 무시. | `an unavailable option cannot be resolved` | Task 9 |

### 4.6 격자 턴제 전투 (`FR-CMB`, plan Task 5·10)

무작위는 없다. 모든 결과는 화면에 보이는 정보(hp, 공격력, 예고)로 예측할 수 있어야 한다(spec §4.5).

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-CMB-01 | **시작** `startCombat(state, content, encounterId, returnPos)`: 아군 = `"player"`(hp는 플레이어 현재 hp, 공격력 `player.attack`) + 동행 동료(정의의 `hp`, `attack`) 순서로 조우의 `allyStart[i]`에 배치(자리보다 많은 동료는 빠짐). 적 = 조우의 `enemies[i]`, id `"<creatureId>#<i>"`, 생물의 hp·공격력. 모든 유닛 `defending/moved/acted = false`, `gone = null`. `active = "player"`, `round = 1`, `grid = 조우 격자`, `returnPos` = 조우 칸에 들어오기 전 위치, `intents = computeIntents(...)`. | `starts the encounter placed on the tile`, `starting an encounter computes intents toward the nearest ally` | D6, D12, D13 |
| FR-CMB-02 | **차례**: `active`는 유닛 순서상 첫 번째 "아군 ∧ 살아 있음 ∧ 아직 행동 안 함" 유닛. 한 차례에 이동 1번(선택) + 행동 1번(공격·방어·밀기·설득·도주) 또는 `endTurn`. 행동이나 `endTurn`이 그 유닛의 차례를 끝낸다. 이동 뒤에도 차례는 그 유닛. | `a moved unit cannot move again but can still act` | Task 10 규칙 1 |
| FR-CMB-03 | **이동** `move(to)`: 아직 안 움직였고, `to`가 격자 안·걷는 칸·빈 칸이며, 다른 유닛을 피한 BFS 거리 1–3일 때만. 아니면 무시. | `a move farther than three tiles or onto a unit is ignored` | 규칙 2 |
| FR-CMB-04 | **방향 행동 대상**: 공격·밀기·설득은 활성 유닛 칸 + dir 칸의 살아 있는 적. 대상이 없으면 무시(차례를 쓰지 않음). | 각 행동 테스트 | 규칙 3 |
| FR-CMB-05 | **공격**: 피해 = 공격자의 공격력. 대상이 방어 중이면 `Math.ceil(공격력 / 2)`. hp ≤ 0이면 `gone = "dead"`. 죽은 적이 악하지 않은 생물(`evil: false`)이면 `recordDeed(compassion, "deed.kill-innocent")`. 이벤트 `sfx "hit"`. | `killing a non-evil creature records a compassion deed`(악한 생물은 기록 없음) | spec §4.5, 규칙 4 |
| FR-CMB-06 | **방어**: `defending = true`. 그 유닛의 **다음 차례가 시작될 때** 풀린다(적 단계 동안 유지). | `defending halves damage rounding up` | 규칙 5 |
| FR-CMB-07 | **밀기**: 대상을 dir로 1칸. 밀려날 칸이 격자 밖이면 `gone = "retreated"`(죽지 않음, 행실 없음). 막힌 타일이나 다른 유닛 칸이면 제자리에 피해 1. 그 외에는 이동. 이벤트 `sfx "push"`. | `pushing an enemy off the grid makes it retreat, not die`, `pushing into a wall or unit deals 1 damage and stays` | spec §4.5, 규칙 6 |
| FR-CMB-08 | **설득**: 대상 생물이 `evil: false`이고 플레이어가 그 생물의 `lore` 단서를 알면 `gone = "retreated"`. 아니면 효과 없이 차례만 쓴다. | `persuade works only on a non-evil creature whose lore fact is known` | spec §4.5, 규칙 7 |
| FR-CMB-09 | **도주**: 활성 유닛이 격자 가장자리 칸(x=0, y=0, x=폭−1, y=높이−1)에 있을 때만 → 전투 종료 `fled`. 아니면 무시. | `flee works only from an edge tile` | 규칙 8 |
| FR-CMB-10 | **적 단계**: 살아 있는 아군이 모두 행동했으면, 유닛 순서대로 살아 있는 적마다 자기 예고를 실행 — `moveTo` 칸이 지금 비어 있으면 그리로 이동, 그다음 `attack` 대상이 살아 있고 인접하면 공격(FR-CMB-05와 같은 피해, 아군 hp ≤ 0 → `dead`). 그 뒤 `round += 1`, 아군의 `moved/acted/defending` 초기화, 새 예고 계산, `active` 재계산. | `intents are shown before the enemy acts and enemies follow them` | 규칙 9 |
| FR-CMB-11 | **예고 계산** `computeIntents(combat, content)`: 살아 있는 적마다 BFS 거리가 가장 가까운 살아 있는 아군(동점이면 유닛 순서 앞)을 대상으로 — 이미 인접하면 `moveTo = 현재 위치`; 아니면 대상 옆 칸 중 경로가 가장 짧은 칸으로 가는 경로를 최대 3칸 간 칸(다른 유닛 칸과 앞선 적이 예약한 `moveTo`는 막힘). `attack = moveTo가 대상과 인접하면 대상 id, 아니면 null`. 경로가 없으면 제자리·`attack null`. | 같은 테스트(`slime (2,0)` → `moveTo (2,3)`, `attack "player"`) | spec §4.5, 규칙 10 |
| FR-CMB-12 | **승리**: 살아 있는 적이 없으면 — 조우를 `clearedEncounters`에 추가, 플레이어 hp = 플레이어 유닛 hp(최소 1), 조우 칸에 머묾. | `combat ends in victory when no enemy remains, adds the encounter to clearedEncounters` | 규칙 11 |
| FR-CMB-13 | **패배(게임 오버 없음)**: 살아 있는 아군이 없으면 — `content.start`의 지도·위치로, hp 1, 조우는 이긴 것으로 치지 않는다. | `combat ends in defeat when every ally is gone` | 규칙 11 |
| FR-CMB-14 | **도주 결과**: `returnPos`로 돌아가고 hp = 플레이어 유닛 hp. 조우는 남는다. | `flee works only from an edge tile` | D12 |
| FR-CMB-15 | **종료 공통**: `combat = null`, 이벤트 `combatEnded(outcome)` → `music(현재 지도 music)`. 종료 판정은 명령마다 처리 뒤에 한다. | 위 세 테스트 | 규칙 11 |

### 4.7 저장 (`FR-SAV`, plan Task 11)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-SAV-01 | **형식**: `serialize(state)` = `JSON.stringify({ format: "hollow-codex-save", version: 1, state })`. 상태 전체가 한 JSON(전투 중이면 전투 상태 포함). | `round-trips a state` | spec §7.5 |
| FR-SAV-02 | **왕복**: `deserialize(serialize(s))` → `{ ok: true, state: s }`와 깊게 같음. 전투 중 저장도 같은 차례로 돌아오고, 이어서 같은 명령을 실행하면 같은 결과. | `round-trips a state in the middle of combat` | spec §8.1-7, Review Focus 3 |
| FR-SAV-03 | **거부(예외 없음)**: JSON 아님 → `corrupt`; 객체 아님·`format` 다름 → `format`; `version > 1` → `future-version`; 상태 모양이 틀림(문자열 `mapId`, 숫자 `turn`·`rng`, 숫자 `player.pos.x/y`, 배열 `facts/deeds/party/departed/flags/abilities/clearedEncounters`, 객체 `deductions/crises/joinedAt`, `dialogue`·`combat`은 null 또는 객체) → `corrupt`. **절대 throw하지 않는다.** 실패해도 지금 하던 게임은 그대로. | `corrupt and future saves are rejected without throwing` | Review Focus 2 |
| FR-SAV-04 | **마이그레이션 틀**: `MIGRATIONS: Record<number, (s) => unknown>`(지금은 빈 객체). 옛 버전이면 차례로 적용, 없으면 `corrupt`. | — | spec §7.5 |
| FR-SAV-05 | **슬롯**: IndexedDB 데이터베이스 `hollow-codex-save-slots`(브라우저 안에만, localStorage·sessionStorage 쓰지 않음). 레코드 = `{ id, name, createdAt, updatedAt, files: [{ path: "state.json", data }] }`. `saveToSlot(store, slotId, name, state, now)` — 있던 레코드면 `createdAt` 유지. `loadSlot(store, slotId)` — 없으면 `null`, `state.json`이 없으면 `{ ok: false, reason: "corrupt" }`. 테스트는 메모리 저장소로. | `saves and loads through the memory store`, `the auto slot is overwritten in place` | D3, Task 11 |
| FR-SAV-06 | **자동 저장**(슬롯 `auto`): 마지막 자동 저장 이후 `turn`이 50 이상 늘었을 때, `mapChanged`, `crisisResolved`, `combatEnded` 때. | 사용자 확인 | Task 16 |
| FR-SAV-07 | **수동 저장**: 메뉴의 슬롯 3개 + 자동 슬롯 불러오기. | 사용자 확인 | spec §4.8 |
| FR-SAV-08 | **부팅 시 이어하기**: `auto` 슬롯이 정상이면 그 상태로, 아니면(없음·손상) 새 게임(`seed = Date.now() >>> 0`). 실패 사유는 디버그 로그에만. | 사용자 확인 | Task 16 |

### 4.8 렌더링 (`FR-RND`, plan Task 12)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-RND-01 | **시야·배율**: 시야 15×11 타일, 타일 16×16 px. `scale = max(1, floor(min(w·dpr / 240, h·dpr / 176)))`(장치 픽셀, 정수 배율만). | `integer scale for a 1280×720 canvas at dpr 1 is 4`, `uses device pixels`, `never goes below scale 1` | spec §5 |
| FR-RND-02 | **카메라 clamp**: 지도가 시야보다 크면 `originTile.x = clamp(center.x − 7, 0, 지도폭 − 15)`, `y = clamp(center.y − 5, 0, 지도높이 − 11)`. 시야가 지도 밖을 보여 주지 않는다. | `clamps at the map's top-left corner`, `clamps at the bottom-right corner` | Task 12 |
| FR-RND-03 | **작은 지도 가운데 정렬**: 지도가 시야보다 작으면 원점 0, `offsetPx = floor((w·dpr − min(지도폭,15)·16·scale) / 2)`(y도 같게). 예: 1280×720, 12×10 지도 → 원점 (0,0), 오프셋 (256, 40). | `centres a map smaller than the view` | Task 12 |
| FR-RND-04 | **화면 → 타일**: `screenToTile(px, vp) = floor((px − offset) / (16·scale)) + origin`. | `screenToTile inverts the viewport` | Task 12 |
| FR-RND-05 | **픽셀 아트 그리기**: `imageSmoothingEnabled = false`, 캔버스 크기 = CSS 크기 × dpr(ResizeObserver로 추적). 순서: 타일 → NPC(동행 제외) → 플레이어. 스프라이트 원본 좌표 = `(index % columns)·16, floor(index / columns)·16`, 시트는 `content.sheets`(D14). | 사용자 확인 | D14 |
| FR-RND-06 | **전투 화면**: 지도 대신 조우 격자를 그리고, 유닛, 각 적의 예고 화살표(적 칸 중심 → `moveTo` 칸 중심, 노란 선 2px×scale), 공격 대상 칸의 빨간 테두리, 활성 아군 칸의 흰 테두리. | 사용자 확인 | spec §4.5 |

### 4.9 입력 (`FR-INP`, plan Task 12)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-INP-01 | **모드**: `modeOf(state)` = 전투 중 `combat`, 대화 중 `dialogue`, 그 외 `explore`. | — | Task 12 |
| FR-INP-02 | **키 매핑** `keyToCommand(key, mode)` — 아래 표 그대로. 표에 없는 키는 `null`. | `%s moves %s in explore`, `Enter and Space interact; Escape opens the menu; Tab opens the notebook`, `arrow keys do nothing in dialogue mode`, `Escape ends the talk in dialogue mode` | Task 12 |
| FR-INP-03 | **포인터** `pointerToCommand(tile, state, content)`: 탐험 — 인접 NPC 칸 → `interact(at)`, 먼 NPC 칸 → `null`, 플레이어 칸 → `null`, 그 외 → `moveTo(tile)`. 전투 — `combat move(to = 격자 칸)`. 대화 — `null`. | `tapping an adjacent NPC interacts`, `tapping a far NPC does nothing`, `tapping a far tile walks there`, `combat mode turns a tap into a combat move` | spec §4.8 |
| FR-INP-04 | **UI 동작**: `UiAction = { ui: "notebook" \| "menu" }` — core로 가지 않고 패널을 연다/닫는다. | — | Task 12 |

| 키 | explore | dialogue | combat |
|---|---|---|---|
| `ArrowUp` `w` `W` | move n | null | null |
| `ArrowRight` `d` `D` | move e | null | null |
| `ArrowDown` `s` `S` | move s | null | null |
| `ArrowLeft` `a` `A` | move w | null | null |
| `Enter`, 스페이스 | interact | null | null |
| `Escape` | `{ ui: "menu" }` | `endTalk` | `{ ui: "menu" }` |
| `Tab` | `{ ui: "notebook" }` | `{ ui: "notebook" }` | `{ ui: "notebook" }` |

전투의 방향 행동은 HUD 버튼을 누른 뒤 방향 키 또는 인접 칸 탭으로 방향을 받는다(FR-UI-07).

### 4.10 UI 패널 (`FR-UI`, plan Task 13)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-UI-01 | **문자열 조회** `t(strings, key, vars?)`: 없는 키는 `⟦key⟧`로 보여 준다(검사기가 막지만 개발 중 눈에 띄게). `{name}` 자리를 `vars`로 치환. | `t marks a missing key` | Task 13 |
| FR-UI-02 | **대화 기록**: 상태에는 대화 기록이 없다. UI가 `said` 이벤트를 `{ textKey, lie }` 목록으로 모으고, 대화가 닫히거나 전투가 끝나면 비운다. | — | Task 13 |
| FR-UI-03 | **대화 패널 데이터** `dialogueView(state, content, log)` → NPC 이름, 줄 목록(`lieMark = lie ∧ ability.see-lies 보유`), 칩(`availableTopics` + 라벨), 선택지(기다릴 때만), 위기 선택지(이 NPC가 위기 npc이고 안 풀렸을 때: 라벨·`available`·부족한 단서의 힌트 글), `canRecruit`. | `lie marks appear only with the see-lies ability`, `chips list only topics available for this NPC`, `the crisis appears with availability and hints when talking to its NPC` | spec §4.1, §4.3 |
| FR-UI-04 | **대화 패널 화면**: 오른쪽 고정(폭 `min(420px, 100vw)`), 휴대폰 세로 화면에선 아래쪽 45vh. 칩 클릭 → `ask`, 선택지 → `choose`, 위기 버튼(가능할 때만 활성) → `resolveCrisis`, 영입 → `recruit`, 닫기 → `endTalk`. | 사용자 확인 | D10 |
| FR-UI-05 | **수첩 데이터** `notebookView(state, content)`: 단서를 kind 6개로 나눔(빈 kind도 키 존재, 각 목록 라벨 정렬), 추론마다 문장·칸(고른 단어의 라벨 또는 null)·확정 여부·고를 수 있는 단어(아는 word 전부) — **맞은 개수 같은 필드 없음**, 힌트(소문 힌트의 부족한 단서 → `hintKey` 글, 중복 제거). | `the deduction page shows chosen words, never a correctness count`, `hints show hint text of missing facts` | spec §4.1 |
| FR-UI-06 | **수첩 화면**: 전체 덮개, 탭 3개(단서 / 추론 / 소문). 추론 칸마다 선택 상자(빈 값 + 단어들) → `fillSlot`. 확정된 페이지는 선택 상자 비활성. `Tab` 키나 화면 버튼으로 연다. | 사용자 확인 | spec §4.1 |
| FR-UI-07 | **전투 HUD 데이터** `combatView(state, content)`: 활성 유닛 이름, 지금 가능한 행동(이동했으면 `move` 빠짐, 가장자리일 때만 `flee`, 항상 `endTurn`), 유닛 목록 — 적의 `evilKnown`은 도감 단서(lore)를 알면 `evil` 값, 모르면 `null`(아군 `null`). 화면: 아래 줄 행동 버튼. 공격·밀기·설득은 버튼 → 방향 입력 대기 → `combat` 명령. 방어·도주·차례 끝은 바로. | `unknown creature nature shows as null` | spec §4.5 |
| FR-UI-08 | **메뉴**: 저장 슬롯 3개 + 자동, 불러오기, 새 게임, 크레딧(장부의 `path · author · license · source`). 화면 오른쪽 위에 수첩·메뉴 버튼. | 사용자 확인 | spec §7.4 |
| FR-UI-09 | **터치 연속 이동**: `moveTo` 탭 뒤 목표를 기억하고 120ms마다 `moveTo`를 다시 보낸다. 도착, 이벤트 0개, 다른 입력, 대화·전투 시작 시 멈춘다. | 사용자 확인 | spec §4.8 |
| FR-UI-10 | **터치 크기·글꼴**: 모든 버튼 높이·너비 ≥ 44px. 글꼴 Neo둥근모(`NeoDunggeunmo`). | 사용자 확인 | spec §5 |
| FR-UI-11 | **UI 문자열 키**(값은 콘텐츠가 채움): `player.name`, `ui.notebook`, `ui.menu`, `ui.save`, `ui.load`, `ui.new`, `ui.credits`, `ui.close`, `ui.recruit`, `ui.end-talk`, `ui.tab.facts`, `ui.tab.deductions`, `ui.tab.hints`, `ui.kind.<kind>` 6개, `ui.combat.<행동>` 7개, `ui.evil`, `ui.not-evil`, `ui.unknown-nature`. | `check:content`(키 존재) | AR-06 |

### 4.11 음악과 효과음 (`FR-AUD`, plan Task 14)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-AUD-01 | **악보 형식**(YAML): `{ tempo: 4분음표 bpm, loop: bool, channels: [{ wave: "square50" \| "square25" \| "triangle" \| "noise", volume: 0–1, notes: 문자열 }] }`. | `check:content` | 승인된 차이 2 |
| FR-AUD-02 | **음표 문법**: 공백 구분 토큰. 음 `<이름><옥타브>/<길이>[.]` — 이름 `C C# Db D D# Eb E F F# Gb G G# Ab A A# Bb B`, 옥타브 0–8, 길이 ∈ {1, 2, 4, 8, 16}(온음표 분모), `.` = 1.5배. 쉼표 `r/<길이>[.]`. 노이즈 타격 `x/<길이>[.]`. | `parses A4/4 at 120 bpm to 440 Hz lasting 0.5 s`, `dotted notes last 1.5x`, `sharps and flats name the same pitch` | Task 14 |
| FR-AUD-03 | **파싱** `parseScore(score)` → `{ events: { channel, time, duration, freq }[], length }`(초). 길이 n 음 = `(4/n)·(60/tempo)`초. `freq = 440·2^((midi−69)/12)`, `midi = 12·(옥타브+1) + 반음`. 쉼표 `freq null`, 노이즈 타격 `freq 0`. `length` = 가장 긴 채널. 잘못된 토큰 → `bad note "<토큰>" in channel <i>` 오류. | `rests have freq null and advance time`, `noise hits have freq 0`, `rejects an unknown note name with the token in the error`, `length is the longest channel` | Task 14 |
| FR-AUD-04 | **칩 플레이어** `createChipPlayer(ctx)` → `play(score)`, `stop()`, `setVolume(v)`. 25ms마다 다음 100ms 안의 음을 예약(look-ahead), `loop`면 `length`마다 반복, `play`는 이전 곡을 멈춘다. 파형: `square50` = 사각파, `square25` = 25% 펄스(푸리에 계수 `bₙ = (2/(nπ))·sin(nπ·0.25)`, 32항 PeriodicWave), `triangle`, `noise` = 1초 백색 잡음 버퍼 반복. 음마다 attack 5ms / release 30ms. 채널 볼륨 × 마스터 볼륨. | 사용자 확인 | spec §6.1 |
| FR-AUD-05 | **자동재생 정책**: AudioContext가 `suspended`면 첫 `pointerdown`/`keydown`에서 `resume()` 후 재생. | 사용자 확인 | Task 14 |
| FR-AUD-06 | **효과음 생성** `renderSfx(params, sampleRate)` → `Float32Array`. 길이 `round(ms·sampleRate/1000)`, 진폭 `0.5·exp(−decay·t/길이)`, 사각파는 주파수 start→end 선형 변화(위상 누적), 노이즈는 시드 1의 mulberry32로 ±1. 결정적. | `length is ms × sampleRate / 1000`, `peak amplitude ≤ 1`, `same params give identical samples` | spec §6.3 |
| FR-AUD-07 | **효과음 표** — 아래. 이벤트 연결: `moved` → step, `bumped` → bump, `factLearned` → learn, `deductionConfirmed`/`sfx confirm` → confirm, `sfx hit` → hit, `sfx push` → push. 지도·조우의 `music` 이벤트 → 그 곡 재생. | 사용자 확인 | Task 14, 16 |

| 이름 | 파형 | 시작 Hz | 끝 Hz | ms | decay |
|---|---|---|---|---|---|
| step | square | 220 | 180 | 40 | 8 |
| bump | square | 110 | 80 | 80 | 6 |
| learn | square | 660 | 990 | 150 | 3 |
| confirm | square | 523 | 1047 | 400 | 2 |
| hit | noise | 0 | 0 | 120 | 10 |
| push | noise | 0 | 0 | 200 | 5 |

### 4.12 콘텐츠 파이프라인 (`FR-CNT`, plan Task 3)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-CNT-01 | **읽기** `loadContentDir(dir)`: `dir` 아래 `**/*.yaml`을 파싱해 상대 경로(`/` 구분, 정렬) → 값. node 전용. YAML 문법 오류는 `<상대 경로>: <메시지>`로. | fixture 테스트 | Task 3 |
| FR-CNT-02 | **컴파일** `compileContent(raw)` → `{ content, errors }`. 순수. **오류를 전부 모아** 한 번에 돌려주고, 하나라도 있으면 `content: null`. 오류 문장은 항상 `<content 기준 파일 경로>: …`로 시작하고 문제의 id·키를 담는다. | `compiles the minimal fixture without errors`, `reports every error at once` | spec §7.4 |
| FR-CNT-03 | **파일 배치와 모양**: 6.3절 YAML 스키마 표의 경로·모양만 받는다. 표에 없는 경로 → `unknown content file`. 필수 필드 누락·타입 틀림 → 오류. YAML 키 `name/greet/label/hint/sentence/text` → 결과의 `nameKey/greetKey/labelKey/hintKey/sentenceKey/textKey`. Pos `[x, y]` → `{x, y}`, 스프라이트 `[시트, 번호]` → `{ sheet, index }`. topic은 객체 하나 또는 목록 → 항상 목록. 생략 기본값: `encounters []`, `enterFlags []`, `heals false`. | 모양 오류 테스트 | D9, D18 |
| FR-CNT-04 | **검사 8종**: (1) 모양 (2) 같은 종류 안 id 중복 (3) 참조 — 출구 `to`·시작 지도·NPC 지도·조우 지도·지도의 조우 id·모든 단서 참조(`grants`, `requires`, `joinRequires`, `rejoinRequires`, 위기 `requires`, 추론 `answer`, 생물 `lore`)·`requiresDeductions`·`unlocks`(능력)·위기 `npc`·조우의 생물·`music`·스프라이트 시트·topic 키(`name`/`job`/단서 id)·`deed.virtue`(미덕 8개 중) (4) 문자열 키 존재 + 항상 필요한 `npc.default.unknown`, `topic.name`, `topic.job` (5) 지도 — 행 폭 동일, 모든 글자가 타일 표에 있음, 출구·조우·NPC·시작 위치·`allyStart`·적 위치가 지도/격자 안의 걷는 칸 (6) **획득 경로** — 추론 정답 단어마다 어떤 topic 변형이나 선택지의 `grants`에 있음 (7) 추론 정답 길이 3, 정답은 kind `word` (8) 금지어(FR-CNT-05). | `reports a topic that grants an unknown fact`, `reports a missing string key`, `reports a map exit to an unknown map`, `reports rows of unequal width`, `reports a deduction answer word nobody can grant`, `reports a tile character missing from tiles.yaml`, `reports a topic key that is not name, job or a fact id` | spec §7.4 |
| FR-CNT-05 | **금지어 검사**: 목록 `content/ip-denylist.yaml` `{ latin: [], hangul: [] }`. 라틴 항목은 대소문자 무시 + **단어 경계**(`(?<![a-z0-9])항목(?![a-z0-9])`, 항목 안 공백은 공백·`_`·`-` 하나 이상에 매칭). 한글 항목은 부분 문자열. 검사 대상: 모든 문자열 값, 모든 id, 모든 topic 키, 모든 콘텐츠 파일 경로. 목록 파일 자체는 대상이 아니다. 결과 형식 `<where>: denied term "<항목>"`, `where`에는 걸린 값(id·키·경로)을 넣는다. **실패 쪽으로 닫힌다**: 목록 파일이 없거나 `latin`·`hangul` 문자열 목록을 가진 매핑이 아니면 컴파일 오류. | `catches a denied word regardless of case`, `catches a Hangul transliteration`, `matches multi-word terms across spaces, underscores and hyphens`, `does not flag a denied term inside a longer word`, `ignores clean text`, `parseDenylist reads latin and hangul lists, lower-casing latin`, `parseDenylist treats a missing file as empty lists`, `reports a denied term in a string value`, `reports a denied term inside an id`, `reports a missing or malformed denylist` (테스트 단어는 지어낸 것) | spec §2.3, D4 |
| FR-CNT-06 | **금지어 목록 내용**: spec §2.2의 영문·한글 목록 전부. 단, 1음절 음역과 흔한 낱말이 되는 음역은 한글 목록에서 뺀다(오탐 방지). 원작 주문어(짧은 라틴 낱말)는 라틴만. spec이 적은 일반어 두 개(고유명으로서)도 넣고, 작가는 그 낱말을 피한다. | 목록 파일 검토 | D4 |
| FR-CNT-07 | **빌드 연결**: Vite 플러그인이 가상 모듈 `virtual:content`(기본 내보내기 = `GameContent`)를 만든다. 타입 선언은 `declare module "virtual:content" { const content: import("./content/types.ts").GameContent; export default content }` — ambient 모듈 안의 상대 `import type`은 `any`가 되므로 쓰지 않는다(`virtual:credits`도 같은 방식). 오류가 있으면 빌드 실패(오류 전부 출력). `content/` 파일이 바뀌면 개발 서버가 전체 새로고침. | `npm run build` | spec §7.4 |
| FR-CNT-08 | **CLI**: `npm run check:content` — 같은 컴파일 + 장부 검사(FR-AST-03). 오류는 한 줄씩 stderr, 있으면 exit 1. 성공 출력은 2.2절. | 게이트 | Task 3, 4 |

### 4.13 자산·라이선스·크레딧 (`FR-AST`, plan Task 4·15)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-AST-01 | **장부 형식** `assets/LEDGER.md`: 머리말 + 표 하나 `\| path \| source \| author \| license \|`. `parseLedger(md)`는 첫 표의 행을 읽고 칸의 공백·백틱을 없앤다. | `parses the ledger table` | spec §9 |
| FR-AST-02 | **허용 라이선스**(정확한 문자열): `CC0-1.0`, `CC-BY-3.0`, `CC-BY-4.0`, `CC-BY-SA-3.0`, `CC-BY-SA-4.0`, `OFL-1.1`. 그 밖(예 `CC-BY-NC-4.0`, `CC-BY-ND-4.0`)은 위반. | `rejects NC and ND licenses`, `accepts every allowed license` | spec §6.2, §9 |
| FR-AST-03 | **대상 파일**(D20): `assets/**`(단, 이름이 `LICENSE`로 시작하는 파일과 `assets/LEDGER.md` 제외) + `content/music/*.yaml`. `checkLedger(rows, files)` — 장부에 없는 파일 → `<path>: not in assets/LEDGER.md`, 장부에 있는데 없는 파일 → `<path>: listed in assets/LEDGER.md but missing`. | `flags an asset file missing from the ledger`, `flags a ledger row whose file does not exist`, `ignores LEDGER.md and license text files themselves` | spec §7.4, D20 |
| FR-AST-04 | **크레딧**: `virtual:credits` = 장부 행, 단 `source`에서 `https://`·`http://`를 뗀다(링크가 아닌 글자, dist 검사 통과). | `credits strip the URL scheme` | D15 |
| FR-AST-05 | **글꼴**: Neo둥근모 `assets/fonts/neodgm.woff2`(sha256 `0c0ca9cd73f692a5da5d7fb39737902aa9ea312537237779972a9d81ef0a33bf`) + 라이선스 전문 `assets/fonts/LICENSE-neodgm.txt`(sha256 `c1997f54b659ff8bbe2addf4e7f03fb823db7d1b81b043fb2633183b1fc0c2f0`). OFL-1.1, 장부 author = 라이선스 파일의 Copyright 줄 그대로. CSS `@font-face` 이름 `NeoDunggeunmo`, `font-display: swap`. | 해시 비교, `check:content` | spec §5, §9 |
| FR-AST-06 | **타일 시트**(D14): Kenney "Tiny Town"·"Tiny Dungeon" 묶음의 `Tilemap/tilemap_packed.png`를 **수정하지 않고** `assets/tiles/kenney-tiny-town.png`, `assets/tiles/kenney-tiny-dungeon.png`로. 받은 zip의 License 파일에 CC0가 적혀 있어야 하며, 아니면 작업을 멈춘다. 두 License 파일을 `assets/tiles/LICENSE-kenney.txt`로. `columns = PNG 폭 / 16`. | `check:content`, 라이선스 인용 기록 | spec §5, §6 |
| FR-AST-07 | **편곡 크레딧**: 음악 YAML 3개를 장부에 원곡 출처와 함께(6.5절의 표). | `check:content` | D20 |

### 4.14 배포와 dist 검사 (`FR-DEP`, plan Task 2)

| ID | 요구사항 | 수용 기준 | 출처 |
|---|---|---|---|
| FR-DEP-01 | **dist 규칙** `auditFiles(files)` → 위반 문장 목록(빈 배열 = 통과). 파일 = `{ path(dist 기준), text, size }`, `text`는 `.js .css .html .json .svg .txt .webmanifest`만 읽고 나머지는 `null`. 규칙: (a) 글 안의 `https?://…` 중 `http://www.w3.org/`로 시작하지 않고 허용 목록(빈 배열)에도 없는 것 → `<path>: external origin <url>`; (b) `.map` 파일 → `<path>: source map shipped`; (c) 이름이 `u4-alt-manual.pdf`·`origin.txt`이거나 확장자 `.pdf` → `<path>: banned reference file`; (d) 크기 합 > 5 MiB(5·1024·1024) → `dist: total <n> bytes over budget <예산>`. | `flags an external origin in shipped JS`, `allows the SVG namespace`, `flags source maps`, `flags banned reference files`, `flags a bundle over the budget`, `passes a clean dist` | spec §7.5 |
| FR-DEP-02 | **dist CLI** `npm run audit:dist`: `dist/`를 재귀로 읽어 검사, 위반은 한 줄씩 stderr + exit 1. `dist/`가 없으면 `audit:dist: dist/ not found — run npm run build` + exit 1. | 게이트 | Task 2 |
| FR-DEP-03 | **Pages 워크플로** `.github/workflows/pages.yml`: 트리거 main push·main 대상 PR·수동 실행. build job — `npm ci` → typecheck → test:unit → check:content → build → audit:dist → `touch dist/.nojekyll` → upload. deploy job — main push일 때만, `pages: write`·`id-token: write`, concurrency `pages`(취소 안 함), 환경 `github-pages`. 액션은 커밋 SHA로 고정: checkout `3d3c42e5…`(v7.0.1), setup-node `82076278…`(v7.0.0, node 22.23.3, npm 캐시), upload-pages-artifact `fc324d35…`(v5.0.0, 숨김 파일 포함), configure-pages `45bfe019…`(v6.0.0), deploy-pages `368f8252…`(v5.0.1). 전체 SHA는 plan Task 2 Step 5. | 배포 run success | spec §7.5 |
| FR-DEP-04 | **Pages 소스** = GitHub Actions(`build_type: workflow`). 배포 URL `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200. Vite base `/hollow-codex/`. | `curl` 200 | Task 2 |
| FR-DEP-05 | **부팅 화면**: `index.html` — `lang="ko"`, viewport(`width=device-width, initial-scale=1, viewport-fit=cover`), 제목 "빈 경전", `<canvas id="screen">`, `<div id="ui">`, 배경 `#111`, 글자 `#eee`, 캔버스 `image-rendering: pixelated`. | e2e `boot.spec.ts` | Task 1 |
| FR-DEP-06 | **디버그 로그**: `?debug=1`이면 각 항목을 `console.warn("[hc]", event, data)`로, 아니면 조용히. 최근 300개는 항상 메모리에. 로그 실패가 게임을 멈추지 않는다. 명령과 이벤트 type을 기록. | `tests/unit/debug-log.test.ts` 5개 | D2 |

---
## 5. 콘텐츠 요구사항 — 정직의 마을 칼라스 (영역 코드 `CR`, plan Task 15)

### 5.1 이야기 고정값 (CR-01, 반드시)
- 칼라스의 굳은 형태: 해 질 녘 모두 광장의 **고백석**에서 고백해야 하고, 이웃 고발이 **고발 장부**에 기록된다(spec §3.2 정직: 의무 고백과 상호 감시).
- 사건: 고백석의 등불이 깨졌다. 필경사 **니아**가 "내가 깼다"고 고백해 재판을 앞두고 있다. 실제로는 동생 **토비**가 연을 날리다 실수로 깼고, 니아는 동생을 감싸려고 거짓 고백을 했다. 고발관장은 그날 밤 토비를 봤지만, 고백한 범인이 있어야 장부 제도가 믿음을 얻으므로 모른 척한다.
- 순례자의 원래 편지(옛 서고에 잠듦)는 "진실을 무기가 아니라 등불로 들라"는 뜻을 담고 있다.
- 악당은 없다. 모두 선의로 서로를 옥죈다(spec §3.1).
- **모든 대사·이름·문장은 새로 쓴다.** 원작 문장·번역을 쓰지 않는다. 금지어 검사를 통과해야 한다.

### 5.2 지도 (CR-02, 반드시)
| id | 크기 | 음악 | 회복 | 필수 배치 |
|---|---|---|---|---|
| `map.field` 들판 | 24×16 | `music.field` | 아니오 | 가운데 왼쪽에 열석 고리(`o` 6개 원형), 시작 위치는 고리 안. x=15의 세로 강(`~`)을 **다리 한 칸**(`=`)으로만 건넘. 다리 칸에 조우 `enc.field.wolves`. 동쪽 가장자리 출구 → 칼라스 서문 안쪽. 문지기는 고리 옆, 사냥꾼은 강 서쪽. |
| `map.kalas` 칼라스 | 32×24 | `music.kalas` | 예 | 서문(출구 → 들판 다리 동쪽 칸), 가운데 광장(`:`)과 고백석 `L`, 북쪽 고발청, 동쪽 여관, 남쪽 집들, 북동쪽 옛 도서관 건물 안 내려가는 계단 `>`(출구 → 서고). |
| `map.archive` 옛 서고 | 12×10 | `music.kalas` | 아니오 | 들어오면 플래그 `flag.visited-archive`. 입구 계단 `<`(출구 → 칼라스 계단 옆 칸), 좁은 복도 한 칸에 조우 `enc.archive.robbers`, 그 너머 방에 늙은 사서. |

시작값 `content/start.yaml`: `{ map: map.field, pos: <고리 안>, hp: 12, attack: 3 }`.

### 5.3 타일 글자 (CR-03, 반드시)
| 글자 | 뜻 | walk | | 글자 | 뜻 | walk |
|---|---|---|---|---|---|---|
| `.` | 풀 | 1 | | `#` | 건물 벽 | null |
| `,` | 덤불 | 2 | | `+` | 문·출입구 | 1 |
| `:` | 흙길·광장 | 1 | | `o` | 열석 | null |
| `=` | 다리 | 1 | | `L` | 고백석(깨진 등불) | null |
| `~` | 물 | null | | `_` | 서고 바닥 | 1 |
| `T` | 나무·바위 | null | | `%` | 서고 벽 | null |
| `>` | 내려가는 계단 | 1 | | `<` | 올라가는 계단 | 1 |
스프라이트 번호는 시트를 보고 고르고, 사람이 화면에서 확인한다.

### 5.4 단서 20개 (CR-04, 반드시 — id 고정, 라벨·힌트 글은 새로 씀)
| id | kind | 라벨 예 | 비고 |
|---|---|---|---|
| `word.pilgrim` | word | 순례자 | |
| `word.truth` | word | 진실 | 추론 정답 1 |
| `word.weapon` | word | 무기 | 추론 정답 2 |
| `word.lantern` | word | 등불 | 추론 정답 3 |
| `word.duty` | word | 의무 | 함정 |
| `word.ledger` | word | 장부 | 함정 |
| `word.silence` | word | 침묵 | 함정 |
| `word.confession` | word | 고백 | |
| `word.trial` | word | 재판 | |
| `fact.kalas.nia` | person | 필경사 니아 | |
| `fact.kalas.tobi` | person | 니아의 동생 토비 | |
| `fact.kalas.archive` | place | 옛 서고 | |
| `fact.song.lantern-song` | song | 등불 노래 | |
| `fact.creature.wolf-hungry` | creature | 굶주린 늑대 | 늑대의 도감(lore) |
| `fact.creature.robber-greed` | creature | 도굴꾼 | 도굴꾼의 도감 |
| `fact.kalas.lantern-shard` | meaning | 연실이 감긴 등불 조각 | 진실 규명 조건 |
| `fact.kalas.brother-witness` | meaning | 토비의 고백 | 진실 규명 조건 |
| `fact.kalas.pilgrim-letter` | meaning | 순례자의 편지 | 장부 소각 조건 |
| `fact.kalas.ledger-doubt` | meaning | 장부에 대한 의심 | 엘린 합류 조건 |
| `fact.kalas.elin-forgiven` | meaning | 니아의 용서 | 엘린 복귀 조건 |

### 5.5 NPC 11명과 대화 그래프 (CR-05, 반드시 — topic·조건·획득 고정)
모든 NPC는 `name`, `job` topic을 가진다. 아래가 진행에 필요한 topic이다(대사는 새로 씀).

| NPC id | 위치 | topic → 획득 / 효과 |
|---|---|---|
| `npc.field.gatekeeper` 열석 문지기 | 들판 고리 옆 | `job` → `word.pilgrim` · `word.pilgrim` → `word.truth` · `fact.kalas.archive` → 힌트 대사 |
| `npc.field.hunter` 사냥꾼 | 들판 강 서쪽 | `job` → `fact.creature.wolf-hungry` ("늑대는 굶주렸을 뿐 악하지 않다") |
| `npc.kalas.confessor` 성문 고백관 | 칼라스 서문 안 | `job` 변형① `requiresFlags [flag.visited-archive]`, `excludeFlags [flag.kalas.archive-asked]`: 선택지 "금지 구역에 들어갔는가?" — `option.confess-yes`(플래그 `flag.kalas.archive-asked`) / `option.confess-no`(행실 정직 `deed.lie`, 같은 플래그) · 변형② → `word.confession`, `word.duty` |
| `npc.kalas.warden` 고발관장 — **위기 NPC** | 고발청 | `job` → `word.ledger`, `word.trial` · `word.lantern` → **거짓말**("그날 밤 광장엔 아무도 없었다") · `word.trial` 변형① `requires [fact.kalas.brother-witness]`, `excludeFlags [flag.kalas.warden-asked]`: 선택지 "그 아이에 대해 아는 게 있나?" — `option.tell-warden`(플래그 `flag.kalas.warden-asked`) / `option.deny-warden`(행실 정직 `deed.lie`, 같은 플래그) · 변형② → 재판 설명 |
| `npc.kalas.elin` 고발관 견습 — **동료** | 고발청 | `word.ledger` → `word.weapon` ("장부가 이웃을 찌르는 무기가 됐다") · 동료 정의 `{ virtue: honesty, joinRequires: [fact.kalas.ledger-doubt], leaveAfterDeeds: 2, rejoinRequires: [fact.kalas.elin-forgiven], hp: 8, attack: 2 }` |
| `npc.kalas.nia` 필경사 | 구금실 | `name` → `fact.kalas.nia` · `job` → `word.silence` · `word.lantern` → **거짓말**("내가 깼다") · `word.ledger` `requires [fact.kalas.brother-witness]` → `fact.kalas.elin-forgiven` |
| `npc.kalas.tobi` 니아의 동생 | 남쪽 집 | `name` → `fact.kalas.tobi` · `fact.kalas.nia` → 누나 걱정 · `word.lantern` `requires [fact.kalas.lantern-shard]` → `fact.kalas.brother-witness` |
| `npc.kalas.mira` 직조공 | 광장 옆 | `word.lantern` → `fact.kalas.lantern-shard` · `word.ledger` → `fact.kalas.ledger-doubt` |
| `npc.kalas.child` 아이 | 광장 | `job` → `fact.song.lantern-song`, `word.lantern` (등불 노래) |
| `npc.kalas.innkeeper` 여관 주인 | 여관 | `job` → `fact.kalas.nia`, `word.trial` · `word.trial` → `fact.kalas.archive` |
| `npc.kalas.librarian` 늙은 사서 | 서고 안쪽 방 | `word.pilgrim` → `fact.kalas.pilgrim-letter` · `job` → `fact.creature.robber-greed` |

### 5.6 추론 페이지 (CR-06, 반드시)
- `deduction.honesty`: 문장 "정직은 {1}을 {2}가 아니라 {3}(으)로 쓰는 것이다", 정답 `[word.truth, word.weapon, word.lantern]`, 확정 시 `ability.see-lies`.
- 함정 단어 `word.duty`(고백관), `word.ledger`(고발관장), `word.silence`(니아)도 대화로 얻는다 — 그럴듯한 오답이 있어야 3칸 규칙이 의미가 있다.

### 5.7 위기 `crisis.kalas.trial` (CR-07, 반드시)
| 선택지 | 조건 | 결과 플래그 | 뜻 |
|---|---|---|---|
| `option.truth` 진실 규명 | `fact.kalas.brother-witness`, `fact.kalas.lantern-shard` | `flag.kalas.ledger-kept` | 니아 무죄, 장부 제도는 유지 |
| `option.lantern` 제도 변화 | `fact.kalas.pilgrim-letter` + 추론 `deduction.honesty` 확정 | `flag.kalas.ledger-burned` | 재판정에서 순례자의 편지를 읽고 마을이 장부를 태움 |
위기 NPC = 고발관장. 그와 대화 중에 선택지 버튼이 뜬다.

### 5.8 생물과 조우 (CR-08, 반드시)
| 생물 | 악함 | hp | 공격 | 도감 단서 |
|---|---|---|---|---|
| `creature.wolf` 굶주린 늑대 | 아니오 | 4 | 2 | `fact.creature.wolf-hungry` |
| `creature.robber` 도굴꾼 | 예 | 5 | 3 | `fact.creature.robber-greed` |

| 조우 | 지도 | 격자 | 아군 자리 | 적 | 음악 |
|---|---|---|---|---|---|
| `enc.field.wolves` | 들판 다리 | 7×7 풀, 가운데 바위 `T` 2개 | (3,6) (2,6) (4,6) | 늑대 3마리 (1,0) (3,0) (5,0) | `music.battle` |
| `enc.archive.robbers` | 서고 복도 | 7×5 서고 바닥, 기둥 `%` 2개 | (3,4) (2,4) (4,4) | 도굴꾼 2명 (2,0) (4,0) | `music.battle` |
- 늑대는 밀어내거나(격자 밖으로 퇴각) 설득(사냥꾼에게 도감 단서를 들은 뒤)하는 것이 바람직하고, 죽이면 연민 행실이 남는다. 도굴꾼은 악하므로 죽여도 기록이 없다(spec §8.1-4).

### 5.9 음악 (CR-09, 반드시)
| 파일 | 곡 | 편성 | 길이 |
|---|---|---|---|
| `content/music/field.yaml` | 「Greensleeves」(작자 미상, 16세기 영국, 공유 저작물) 칩 편곡, tempo 96 | square50 선율 / triangle 베이스 / noise 박 | 20–40초 루프 |
| `content/music/kalas.yaml` | Tielman Susato 「Danserye」(1551) 중 「La Mourisque」 칩 편곡 | square50, square25, triangle, noise | 20–40초 루프 |
| `content/music/battle.yaml` | 자작 | 4채널, 8마디 | 루프 |
편곡은 이 프로젝트 작업(CC-BY-SA-4.0)으로 장부에 원곡과 함께 기록한다. 원작 게임의 곡과 그 편곡은 금지.

### 5.10 두 갈래 진행 경로 (CR-10, 반드시 — 시나리오 테스트가 이 경로로 끝까지 푼다)
**갈래 A — 진실 규명** (`kalas-truth`)
1. 들판 시작 → 다리의 늑대 조우를 **밀어내기**로 통과(행실 없음).
2. 칼라스: 아이에게 `job` → `word.lantern`.
3. 직조공에게 `word.lantern` → `fact.kalas.lantern-shard`.
4. 토비에게 `word.lantern`(조각을 알아야 답함) → `fact.kalas.brother-witness`.
5. 고발관장과 대화 → 위기 `option.truth`. 결과: `crises["crisis.kalas.trial"] = "option.truth"`, `flag.kalas.ledger-kept`, 행실 0건.

**갈래 B — 장부 소각** (`kalas-lantern`)
1. 문지기 `job` → `word.pilgrim`, `word.pilgrim` → `word.truth`.
2. 다리 통과 → 고발관장 `job` → `word.ledger` → 엘린 `word.ledger` → `word.weapon`.
3. 아이 `job` → `word.lantern`.
4. 옛 도서관 계단 → 서고(플래그) → 도굴꾼 전투 승리 → 사서 `word.pilgrim` → `fact.kalas.pilgrim-letter`.
5. 수첩: 추론 3칸 `[진실, 무기, 등불]` → 확정, `ability.see-lies`.
6. 고발관장 → 위기 `option.lantern`. 결과: `flag.kalas.ledger-burned`, `ability.see-lies` 보유, `enc.archive.robbers` 이김.

**동료 이탈·복귀** (`kalas-rules` (c))
1. 직조공 `word.ledger` → `fact.kalas.ledger-doubt` → 엘린 영입.
2. 서고에 다녀온 뒤 고백관 `option.confess-no` → 거짓말 1.
3. 토비 증언을 얻은 뒤 고발관장 `option.deny-warden` → 거짓말 2 → 엘린 떠남(`companionLeft`).
4. 니아 `word.ledger`(토비 증언 뒤) → `fact.kalas.elin-forgiven` → 엘린 다시 영입 → `party = ["npc.kalas.elin"]`.

### 5.11 문자열 (CR-11, 반드시)
- `content/strings/ko.yaml`에 콘텐츠가 쓰는 모든 키 + FR-UI-11의 UI 키 + 필수 3키: `npc.default.unknown`(예 "…글쎄, 그건 잘 모르겠네."), `topic.name`("이름"), `topic.job`("일").
- 키 이름 규칙은 자유지만 권장: `<npcId>.name`, `<npcId>.greet`, `<npcId>.<topic>[.<변형 번호>]`, `<factId>.label`, `<factId>.hint`.

---

## 6. 데이터·인터페이스 명세

### 6.1 콘텐츠 타입 `src/content/types.ts`
plan "핵심 타입"의 첫 코드 블록과 **글자 그대로** 같다. 요약:
- `FactKind = "person" | "place" | "word" | "song" | "meaning" | "creature"`, `SpriteRef { sheet, index }`, `Score { tempo, loop, channels[] }`
- `Topic { textKey, requires?, requiresFlags?, excludeFlags?, grants?, setsFlags?, lie?, choice?: ChoiceOption[] }`, `ChoiceOption { optionId, labelKey, textKey, deed?, grants?, setsFlags? }`
- `CompanionDef { virtue, joinRequires, leaveAfterDeeds, rejoinRequires, hp, attack }`
- `MapDef { rows, exits[{ at, to, arrive }], music, encounters[{ at, id }], enterFlags, heals }`
- `NpcDef { map, pos, nameKey, greetKey, sprite, topics: Record<키, Topic[]>, companion? }`
- `CrisisOptionDef { requires, requiresDeductions, setsFlags, labelKey, textKey }`
- `GameContent { sheets, tiles, playerSprite, maps, npcs, facts, deductions(answer: [Id, Id, Id]), crises({ npc, textKey, options }), creatures, encounters({ map, grid, allyStart, enemies, music }), abilities, music, strings, start({ map, pos, hp, attack }) }`
- `RawContent = Record<content 기준 상대 경로, 파싱된 YAML>`

### 6.2 게임 타입 `src/core/types.ts`
plan "핵심 타입"의 둘째 코드 블록과 글자 그대로 같다. 요약:
- `Id = string`, `Dir = "n"|"e"|"s"|"w"`, `Virtue` 8개(`honesty compassion valor justice sacrifice honor spirituality humility`), `Pos { x, y }`
- `Command` 10종: `move{dir}`, `moveTo{target}`, `interact{at?}`, `ask{topic}`, `choose{optionId}`, `endTalk`, `fillSlot{deductionId, slot, word|null}`, `resolveCrisis{crisisId, optionId}`, `recruit{npcId}`, `combat{action}`
- `CombatAction` 7종: `move{to}`, `attack{dir}`, `defend`, `push{dir}`, `persuade{dir}`, `flee`, `endTurn`
- `GameEvent` 15종: `moved`, `bumped`, `mapChanged`, `said{npcId, textKey, lie}`, `factLearned`, `deductionConfirmed`, `abilityUnlocked`, `deed{virtue, deed}`, `companionJoined`, `companionLeft`, `crisisResolved`, `combatStarted`, `combatEnded{outcome}`, `sfx{name}`, `music{track}`
- `CombatUnit { id, side, creature, pos, hp, attack, defending, moved, acted, gone }`, `CombatState { encounterId, grid, units, active, round, intents, returnPos }`
- `GameState { version: 1, rng, turn, mapId, player{pos, facing, hp, maxHp, attack}, facts, deductions, abilities, deeds, party, departed, joinedAt, crises, flags, dialogue{npcId, pendingChoice}|null, combat|null, clearedEncounters }` — `facts`, `abilities`, `flags`는 정렬·중복 없음.
- `StepResult { state, events }`

### 6.3 YAML 스키마 (`content/`)
| 파일 | 모양 |
|---|---|
| `ip-denylist.yaml` | `{ latin: string[], hangul: string[] }` |
| `tiles.yaml` | `{ sheets: { <id>: { file, columns } }, tiles: { "<1글자>": { sprite: [시트, 번호], walk: 숫자 \| null } }, player: [시트, 번호] }` |
| `start.yaml` | `{ map, pos: [x, y], hp, attack }` |
| `abilities.yaml` | `[{ id, name }]` |
| `strings/ko.yaml` | `{ <키>: 문자열 }` (평평한 맵) |
| `creatures.yaml` | `[{ id, name, evil, hp, attack, sprite, lore }]` |
| `music/<이름>.yaml` | Score 하나, id = `music.<이름>` |
| `towns/<마을>/maps.yaml` | `[{ id, rows: string[], exits: [{ at, to, arrive }], music, encounters?, enterFlags?, heals? }]` |
| `towns/<마을>/npcs.yaml` | `[{ id, map, pos, name, greet, sprite, topics: { <키>: Topic \| Topic[] }, companion? }]` — Topic: `text, requires, requiresFlags, excludeFlags, grants, setsFlags, lie, choice: [{ id, label, text, deed: { virtue, deed }, grants, setsFlags }]` |
| `towns/<마을>/facts.yaml` | `[{ id, kind, label, hint }]` |
| `towns/<마을>/deduction.yaml` | `[{ id, sentence, hint, answer: [a, b, c], unlocks }]` |
| `towns/<마을>/crisis.yaml` | `[{ id, npc, text, options: { <optionId>: { requires?, requiresDeductions?, setsFlags?, label, text } } }]` |
| `towns/<마을>/encounters.yaml` | `[{ id, map, grid: string[], allyStart: [[x,y]…], enemies: [{ creature, at }], music }]` |
`tiles.yaml`과 `start.yaml`은 반드시 있어야 한다(없거나 비면 오류). 다른 파일은 없으면 그 부분이 빈 것으로 본다.

예시(NPC 하나):
```yaml
- id: npc.kalas.tobi
  map: map.kalas
  pos: [6, 18]
  name: npc.kalas.tobi.name
  greet: npc.kalas.tobi.greet
  sprite: [town, 85]
  topics:
    name: { text: npc.kalas.tobi.name.t, grants: [fact.kalas.tobi] }
    job:  { text: npc.kalas.tobi.job.t }
    word.lantern:
      - { text: npc.kalas.tobi.lantern.1, requires: [fact.kalas.lantern-shard], grants: [fact.kalas.brother-witness] }
      - { text: npc.kalas.tobi.lantern.2 }
```

### 6.4 모듈 공개 함수
| 모듈 | 함수 | 시그니처 |
|---|---|---|
| `src/audit/dist-rules.ts` | `auditFiles` | `(files: readonly { path: string; text: string \| null; size: number }[]) => string[]`; 상수 `BUNDLE_BUDGET_BYTES = 5*1024*1024`, `ALLOWED_ORIGINS = []` |
| `src/content/load-node.ts` | `loadContentDir` | `(dir: string) => RawContent` |
| `src/content/compile.ts` | `compileContent` | `(raw: RawContent) => { content: GameContent \| null; errors: string[] }` |
| `src/content/denylist.ts` | `parseDenylist`, `findDenied` | `(value: unknown) => { latin: string[]; hangul: string[] }`; `(texts: Iterable<{ where: string; text: string }>, deny) => string[]` |
| `src/content/ledger.ts` | `parseLedger`, `checkLedger`, `toCredits`, `ALLOWED_LICENSES` | `(md: string) => LedgerRow[]`; `(rows, files: readonly string[]) => string[]`; `(rows) => LedgerRow[]` |
| `src/content/vite-plugin.ts` | `hollowContent` | `(contentDir: string) => Plugin` — `virtual:content`, `virtual:credits` |
| `src/core/rng.ts` | `nextRandom` | `(rng: number) => { value: number; rng: number }` (mulberry32, 0 ≤ value < 1) |
| `src/core/state.ts` | `createInitialState` | `(content: GameContent, seed: number) => GameState` |
| `src/core/step.ts` | `step` | `(state: GameState, command: Command, content: GameContent) => StepResult` |
| `src/core/world/move.ts` | `tileAt`, `npcAt` | `(content, mapId, p) => { walk: number \| null } \| null`; `(state, content, p) => Id \| null` |
| `src/core/world/path.ts` | `findPath`, `findPathOnGrid` | `(content, mapId, from, to, blocked: (p: Pos) => boolean) => Dir[] \| null`; 격자판(Task 10) |
| `src/core/knowledge/notebook.ts` | `learn`, `openHints` | `(state, ids: readonly Id[]) => StepResult`; `(state, content) => { targetId: Id; missing: Id[] }[]` |
| `src/core/dialogue/talk.ts` | `availableTopics`, `pickVariant` | `(state, content, npcId) => string[]`; `(state, variants: readonly Topic[]) => Topic \| null` |
| `src/core/virtue/conduct.ts` | `recordDeed`, `canRecruit`, `MAX_PARTY` | `(state, content, virtue, deed) => StepResult`; `(state, content, npcId) => boolean`; `3` |
| `src/core/crisis/crisis.ts` | `crisisOptions` | `(state, content, crisisId) => { optionId: Id; available: boolean; missing: Id[] }[]` |
| `src/core/combat/grid.ts` | `startCombat`, `computeIntents` | `(state, content, encounterId, returnPos) => GameState`; `(combat, content) => CombatState["intents"]` |
| `src/core/save/serialize.ts` | `serialize`, `deserialize`, `MIGRATIONS`, `SAVE_FORMAT`, `SAVE_VERSION` | `(state) => string`; `(text) => { ok: true; state } \| { ok: false; reason: "corrupt" \| "format" \| "future-version" }` |
| `src/save/slot-store.ts` | `createMemorySlotStore`, `createIndexedDbSlotStore` | `() => SlotStore`; `(factory: IDBFactory) => SlotStore` |
| `src/save/slots.ts` | `saveToSlot`, `loadSlot`, `AUTO_SLOT`, `STATE_FILE` | `(store, slotId, name, state, now: number) => Promise<void>`; `(store, slotId) => Promise<결과 \| null>`; `"auto"`; `"state.json"` |
| `src/render/viewport.ts` | `computeViewport`, `screenToTile`, `VIEW_W/H`, `TILE` | `(canvasCss: { w; h }, dpr, mapSize: { w; h }, center: Pos) => Viewport`; `(px: Pos, vp) => Pos`; 15, 11, 16 |
| `src/render/canvas.ts` | `drawFrame` | `(ctx, sheets: Record<string, HTMLImageElement>, state, content, vp) => void` |
| `src/input/commands.ts` | `keyToCommand`, `pointerToCommand`, `modeOf` | `(key, mode) => Command \| UiAction \| null`; `(tile, state, content) => Command \| null`; `(state) => InputMode` |
| `src/ui/strings.ts` | `t` | `(strings, key, vars?) => string` |
| `src/ui/view-model.ts` | `dialogueView`, `notebookView`, `combatView` | 4.10절의 모양 |
| `src/ui/panels.ts` | `mountPanels` | `(root, content, dispatch, credits) => { render(state, log); toggle(panel); onMenu(handler) }` |
| `src/audio/score.ts` | `parseScore` | `(score: Score) => { events; length }` |
| `src/audio/synth.ts` | `createChipPlayer` | `(ctx: AudioContext) => { play(score); stop(); setVolume(v) }` |
| `src/audio/sfx.ts` | `renderSfx`, `SFX` | `(params: SfxParams, sampleRate) => Float32Array`; 4.11절 표 |
| `src/debug-log.ts` | `createDebugLog`, `debugEnabledFromUrl` | `(options) => { log(event, data?); entries() }`; `(href) => boolean` |

### 6.5 저장 파일 예시
```json
{
  "format": "hollow-codex-save",
  "version": 1,
  "state": {
    "version": 1, "rng": 1, "turn": 37, "mapId": "map.kalas",
    "player": { "pos": { "x": 10, "y": 12 }, "facing": "n", "hp": 12, "maxHp": 12, "attack": 3 },
    "facts": ["fact.kalas.ledger-doubt", "word.ledger", "word.trial"],
    "deductions": { "deduction.honesty": { "slots": [null, null, null], "confirmed": false } },
    "abilities": [], "deeds": [], "party": ["npc.kalas.elin"], "departed": [],
    "joinedAt": { "npc.kalas.elin": 0 }, "crises": {}, "flags": [],
    "dialogue": null, "combat": null, "clearedEncounters": ["enc.field.wolves"]
  }
}
```

### 6.6 장부 예시 (`assets/LEDGER.md`)
```markdown
| path | source | author | license |
|---|---|---|---|
| assets/fonts/neodgm.woff2 | https://github.com/neodgm/neodgm | Copyright (c) 2017-2021, Eunbin Jeong (Dalgona.) <project-neodgm@dalgona.dev> | OFL-1.1 |
| assets/tiles/kenney-tiny-town.png | https://kenney.nl/assets/tiny-town | Kenney (www.kenney.nl) | CC0-1.0 |
| content/music/kalas.yaml | Tielman Susato, Danserye (1551), La Mourisque (public domain) — chip arrangement | TaejinKim7-dev | CC-BY-SA-4.0 |
```

---

## 7. 비기능 요구사항 (영역 코드 `NFR`)

| ID | 요구사항 | 확인 방법 |
|---|---|---|
| NFR-01 | **결정성**: 같은 시드·명령 → 같은 결과. 무작위는 `state.rng`로만, M1 규칙에는 무작위 없음. | 시나리오 (d), purity 테스트 |
| NFR-02 | **core 순수성**: AR-02. | `purity.test.ts` |
| NFR-03 | **번들 예산**: `dist/` 전체 ≤ 5 MiB. 소스맵을 내보내지 않는다. | `audit:dist` |
| NFR-04 | **외부 접속 없음**: 배포 파일에 외부 origin URL이 없다(SVG 네임스페이스 제외). 글꼴·그림·소리 모두 자체 포함. | `audit:dist` |
| NFR-05 | **오프라인 저장**: 저장은 브라우저 IndexedDB에만. 서버·외부 전송 없음. localStorage·sessionStorage를 쓰지 않는다. | 코드 검토 |
| NFR-06 | **견고함**: 손상·미래 버전 저장은 예외 없이 거부, 게임 유지. 디버그 로그 실패가 게임을 멈추지 않는다. 콘텐츠 오류는 빌드에서 잡는다(런타임에 깨진 콘텐츠가 실리지 않음). | FR-SAV-03, debug-log 테스트, `check:content` |
| NFR-07 | **터치**: 모든 버튼 ≥ 44×44px. 마우스 없이 터치만으로 끝까지 플레이 가능. | 사용자 확인 |
| NFR-08 | **화면**: 정수 배율 픽셀 아트, 흐림 없음. 1280×720 PC에서 배율 4. 휴대폰 세로·가로 모두 시야 15×11 유지. | viewport 테스트, 사용자 확인 |
| NFR-09 | **언어**: 화면 문구 전부 `ko.yaml` 키. 없는 키는 `⟦키⟧`로 드러나며 검사기가 빌드를 막는다. | `check:content`, `t` 테스트 |
| NFR-10 | **IP 경계**: 금지어 검사(FR-CNT-05) + 참고 문서·번역문 금지(ENV-04). | `check:content`, `audit:dist`, grep |
| NFR-11 | **브라우저**: 최신 Chromium 계열(PC·안드로이드)과 iOS Safari. e2e는 Chromium만. 첫 입력 전에는 소리가 나지 않을 수 있다(자동재생 정책). | e2e, 사용자 확인 |
| NFR-12 | **성능**: 턴제라 입력이 있을 때만 상태가 바뀐다. 그리기는 `requestAnimationFrame` 한 번에 한 프레임. 휴대폰에서 입력→화면 반응이 눈에 띄게 늦지 않을 것. | 사용자 확인 |
| NFR-13 | **분량**: M1 한 번 플레이 약 45분(두 갈래 중 하나). | 사용자 판정 |

---

## 8. 검증과 완료 기준

### 8.1 M1 완료 기준(spec §8.1) ↔ 요구사항 ↔ 확인
| # | 기준 | 요구사항 | 확인 |
|---|---|---|---|
| 1 | 칼라스 지도, NPC 약 10명, 키워드 대화로 단서 수집 | CR-02, CR-05, FR-DLG-* | `check:content`(3 maps, 11 npcs, 20 facts), 시나리오 A·B |
| 2 | 추론 3칸 모두 맞을 때만 확정, 일부만 맞으면 확정도 힌트도 없음 | FR-NTB-03~06, CR-06 | `notebook.test.ts`, `kalas-rules` (a) |
| 3 | 위기 풀이 2갈래 모두 끝까지 도달 | CR-07, CR-10 | `kalas-truth.test.ts`, `kalas-lantern.test.ts` |
| 4 | 전투 1~2회, 악하지 않은 상대 + 악한 상대, 악하지 않은 상대를 죽이면 행실 기록 | FR-CMB-*, CR-08 | `combat.test.ts`, `kalas-rules` (b) |
| 5 | 동료 1명 합류, 행실에 따라 떠남 | FR-CND-*, CR-05 | `conduct.test.ts`, `kalas-rules` (c) |
| 6 | 음악 2곡 + 효과음이 칩 합성기로 재생 | FR-AUD-*, CR-09 | `score.test.ts`, `sfx.test.ts`, 사용자 확인 |
| 7 | 저장 → 불러오기 왕복 후 상태 같음 | FR-SAV-01~03 | `serialize.test.ts`, `kalas-rules` (d) |
| 8 | PC 키보드·마우스와 모바일 터치로 끝까지 | FR-INP-*, FR-UI-*, NFR-07 | `commands.test.ts`, 사용자 확인 |
| 9 | 사용자가 플레이하고 계속 / 방향 수정 / 중단을 결정해 기록 | — | `docs/handoff.md`의 판정 칸 |

### 8.2 테스트 목록
| 파일 | 영역 | 비고 |
|---|---|---|
| `tests/unit/debug-log.test.ts` | FR-DEP-06 | 5개 |
| `tests/unit/dist-rules.test.ts` | FR-DEP-01 | 6개 |
| `tests/unit/content-compile.test.ts` | FR-CNT-02~04 | fixture `tests/fixtures/content-min/` |
| `tests/unit/denylist.test.ts` | FR-CNT-05 | 지어낸 단어로 |
| `tests/unit/ledger.test.ts` | FR-AST-01~04 | |
| `tests/unit/core/{move,path,purity,notebook,talk,conduct,crisis,combat,serialize}.test.ts` | FR-WLD/NTB/DLG/CND/CRS/CMB/SAV, AR-02 | 공용 fixture `tests/unit/core/fixture.ts` |
| `tests/unit/save/slots.test.ts` | FR-SAV-05 | 메모리 저장소 |
| `tests/unit/render/viewport.test.ts`, `tests/unit/input/commands.test.ts` | FR-RND, FR-INP | |
| `tests/unit/ui/view-model.test.ts` | FR-UI | |
| `tests/unit/audio/{score,sfx}.test.ts` | FR-AUD | |
| `tests/scenario/{kalas-truth,kalas-lantern,kalas-rules}.test.ts` | CR-10, 8.1 #2~5·7 | 실제 `content/`를 읽음 |
| `tests/e2e/boot.spec.ts` | FR-DEP-05 | 페이지가 뜨고 `#screen`이 보이며 2초 안에 콘솔 error 0개 |

### 8.3 공용 테스트 fixture (`tests/unit/core/fixture.ts`)
코드로 만든 작은 `GameContent`(컴파일러를 거치지 않음, 문자열은 키=값). 지도·좌표·id는 plan "공용 테스트 fixture"절에 고정되어 있고, 테스트 수치가 그 값에 기대므로 바꾸지 않는다. 헬퍼: `deepFreeze`, `stateWith(patch)`, `at(x, y)`, `run(state, commands)`.

### 8.4 사람이 확인할 것 (사용자 플레이 체크리스트)
- [ ] Pages에서 Neo둥근모로 제목이 보인다(M0).
- [ ] 들판·칼라스·서고 타일이 흐림 없이 정수 배율로 보이고, 타일 그림이 뜻(풀·물·벽…)과 맞다.
- [ ] 방향키·WASD로 걷고, Enter로 말을 걸고, Esc·Tab이 표대로 동작한다.
- [ ] 휴대폰에서 지도를 눌러 걸어가고, NPC를 눌러 말을 건다. 모든 버튼이 손가락으로 누르기 쉽다.
- [ ] 대화 칩·선택지·위기 버튼·영입 버튼이 동작한다. 능력을 얻은 뒤 거짓말에 표시가 보인다.
- [ ] 수첩의 단서·추론·소문 탭이 보이고, 추론을 틀리게 채워도 아무 신호가 없다.
- [ ] 전투에서 적의 예고 화살표가 보이고, 밀기·설득·도주·방어가 설명대로 된다.
- [ ] 들판·칼라스·전투 음악과 효과음이 들린다(첫 입력 뒤).
- [ ] 새로고침하면 자동 저장에서 이어진다. 메뉴의 슬롯 저장·불러오기·크레딧이 동작한다.
- [ ] 두 갈래 모두 끝까지 간다. 약 45분.
- [ ] 판정: 계속 / 방향 수정 / 중단 → `docs/handoff.md`에 기록.

---

## 9. 추적표 (요구사항 → spec → plan Task → 결정)

| 요구사항 영역 | spec | plan Task | 결정 |
|---|---|---|---|
| ENV-01~06 | §9, §10 | 1, 2 | D1, D2, D16 |
| AR-01~06 | §7.1, §7.2 | 5 (분배표) | D6 |
| FR-WLD-01~10 | §4.7 | 5 | D12, D19 |
| FR-DLG-01~10 | §4.1 | 7 | D8, D9 |
| FR-NTB-01~08 | §4.1, §4.3 | 6 | D17 |
| FR-CND-01~06 | §4.2, §4.6 | 7, 8 | D7, D11 |
| FR-CRS-01~05 | §4.4 | 9 | D10 |
| FR-CMB-01~15 | §4.5 | 5, 10 | D6, D7, D12, D13 |
| FR-SAV-01~08 | §4.8, §7.5 | 11, 16 | D3, D11 |
| FR-RND-01~06 | §5 | 12 | D14 |
| FR-INP-01~04 | §4.8 | 12 | — |
| FR-UI-01~11 | §4.1, §4.5, §4.8, §5 | 13, 16 | D8, D10, D17 |
| FR-AUD-01~07 | §6 | 14, 16 | D5, 승인된 차이 2 |
| FR-CNT-01~08 | §2.3, §7.3, §7.4 | 3 | D4, D8, D9, D18 |
| FR-AST-01~07 | §5, §6, §9 | 4, 15 | D14, D15, D20 |
| FR-DEP-01~06 | §7.5 | 1, 2 | D2, D16 |
| CR-01~11 | §3, §8.1 | 15, 16 | D8, D9, D14 |
| NFR-01~13 | §1, §4.8, §5, §7 | 전체 | — |

---

## 10. 미결 사항·위험·구현 중 확정된 것

### 10.1 미결 (결정 필요, 추천안 포함)
| # | 내용 | 추천안 | 결정 시점 |
|---|---|---|---|
| O1 | 게임 이름 "Hollow Codex" 정식 상표 검색 | 공개(M6) 전에 재확인 | M6 |
| O2 | Kenney 묶음이 실제로 CC0인지 | 받은 zip의 License 파일로 확인, 아니면 Task 15 중단 후 다른 CC0 타일셋 | Task 15 |
| O3 | 타일·스프라이트 번호가 그림과 맞는지 | 사람이 화면에서 확인 후 `tiles.yaml`만 고침 | Task 15 이후 |
| O4 | 난이도 수치(hp·공격력·늑대 수) | M1 수치로 시작, 플레이 판정에서 조정 | 사용자 판정 |
| O5 | 동료가 전투에서 쓰러져도 다음 전투에 정의 hp로 돌아오는가 | 예(M1은 동료 hp를 저장하지 않음) | 현재 규칙대로 |

### 10.2 구현 중 확정된 것 (plan과 같은 뜻, 세부만 보탬)
- Task 1: 인계 문서는 `docs/handoff.md` 하나(루트 `HANDOFF.md`를 옮김), 콘솔 태그 `[hc]`.
- Task 3: 금지어 테스트는 지어낸 단어(`zorvania`, `조르바니아` 등)를 쓴다 — `tests/`에도 원작 이름 금지. `tiles.yaml`·`start.yaml`이 없거나 비면 오류. `parseDenylist`와 "모르는 파일 경로" 테스트를 더 둔다. 검토에서 나온 수정: 가상 모듈 타입 선언을 `import()` 타입으로(그 전엔 `any`), 금지어 목록이 없거나 틀리면 오류(실패 쪽으로 닫힘), 금지어 오류에 걸린 값 표시, YAML 오류에 파일 경로.
- 다음 판으로 미룬 콘텐츠 검사(M1 판정 뒤 검토): 모르는 YAML 키 거부, 한 topic 안 선택지 id 중복, 변형이 0개인 topic, `.yml` 확장자 파일 보고.

### 10.3 위험
| 위험 | 대응 |
|---|---|
| 지식 퍼즐이 재미없거나 너무 어렵다 | 소문 힌트·함정 단어로 조정, M1 플레이 판정으로 검증 |
| 출처가 다른 타일의 화풍 불일치 | 같은 작가(Kenney) 두 묶음만 사용, 부족분은 M2에서 직접 제작 |
| 원작 IP와 겹침 | 금지어 빌드 검사, 참고 문서 반입 금지, 대사 전부 새로 씀 |
| 모바일 조작 | 탭 이동·칩 대화·44px, 사용자 휴대폰 확인 |
