# 그래픽·소리 엔진 구현 계획 (I-1 + I-2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 월드를 32px 칸 + 층 렌더링 + 듀얼 그리드 자동 타일 + 걷기 보간으로 바꾸고, 칩 합성기를 녹음 음원 엔진으로 교체한다. 옛 16px 그림도 그대로 돌아가고, 칼라스 들판 한 장이 새 그림으로 끝까지 보인다.

**Architecture:** core(순수 규칙)는 바꾸지 않는다. 콘텐츠 컴파일러가 물건 발자국을 막힌 칸으로 합쳐 기존 `rows`를 만들고, `ground` 격자를 렌더에 따로 넘긴다. 렌더는 순수 함수(시야 계산, Wang 선택, 정렬, 보간)와 캔버스 그리기로 나눈다. 소리는 `content/audio.yaml` 매핑 + Web Audio 엔진이다.

**Tech Stack:** TypeScript, Vite 6, Vitest 3, Canvas 2D, Web Audio, YAML 콘텐츠, Node 스크립트(`node x.ts`, 타입 제거 호환 규칙 — AGENTS.md §3).

**Spec:** `docs/superpowers/specs/2026-10-28-art-audio-redesign.md` (이하 "스펙")

범위 밖(별도 계획): 칼라스 외 7개 마을·서고·대륙의 새 그림 이전, 새 인물 약 105명의 기본형 그림과 마을색 변형, 맵 그림 약 15회 생성, 소리 없는 14개 상황의 효과음 선택(🧑).

## Global Constraints

- core(`src/core/**`) 파일은 한 줄도 바꾸지 않는다. core 단위 테스트 384개가 그대로 통과한다.
- 모든 상대 import는 `.ts` 확장자, 타입만 쓰면 `import type`. `enum`·`namespace`·생성자 매개변수 프로퍼티 금지.
- 화면 문자열은 `content/strings/ko.yaml` 키로(en 키 집합도 동일). 코드에 한국어 하드코딩 금지.
- 원작 이름·문장 금지(`content/ip-denylist.yaml`), 주석 포함.
- 배포에 들어가는 그림·소리는 `assets/LEDGER.md`에 행이 있고 CC0/CC-BY/CC-BY-SA/OFL만. `assets-private/`·`lab/`는 dist 금지.
- 칸 32px, 캐릭터 캔버스 48×48(발 중앙·아래, 머리 위로 16px). 시야 세로 7칸, `scale = clamp(floor(canvasH/(7×32)), 2, 4)`, 가로 칸 수 = `floor(canvasW/(32×scale))`를 7..15로 clamp.
- 걷기 보간 130ms. 같은 소리 동시 재생 최대 3개. 음악 교차 페이드 1.5초. 배포 예산: 코드+콘텐츠 3MiB · 그림 6MiB · 소리 16MiB, 첫 로딩 5MiB.
- 수정 뒤 e2e를 돌리지 않는다. 게이트: `npm ci`, `npm run test:unit`, `npm run typecheck`, `npm run check:content`, `npm run build`, `npm run audit:dist`, `git diff --cached --check`(새 파일 포함). 긴 실행은 Haiku 하위 에이전트에게.
- 브랜치: `main`에서 `todo-2-art-audio-engine`을 새로 만들어 작업한다. 커밋 전 `git branch --show-current`, 푸시는 `git push origin HEAD:main` 뒤 `git ls-remote origin refs/heads/main`으로 확인. 커밋 끝에 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- 화면·소리는 최종 파일을 직접 열어 확인한 뒤에만 "됐다"고 쓴다(AGENTS.md §9.1). 단위 테스트가 있는 순수 함수는 TDD.

## Review Focus

- 지도가 시야보다 작거나 캔버스가 아주 작을 때(가로 칸 수 7 미만, 배율 2 미만)도 그려지고 터치 좌표가 맞는다 → Task 1.
- 옛 `[sheet,index]` 스프라이트와 새 `char.*`가 한 지도에 섞여도 오류 없이 그려진다. 없는 파일은 그 칸만 건너뛴다 → Task 2·6.
- 풀 아닌 두 땅(길·물)이 맞닿는 지도는 빌드에서 막힌다. 시트가 없는 땅 조합도 → Task 7.
- 이동 중 새 입력이 오면 보간이 즉시 끝점으로 가고 칸이 어긋나지 않는다 → Task 4.
- 오디오가 막힌 환경(첫 입력 전, 디코드 실패, `AudioContext` 없음)에서 게임이 멈추지 않는다. 매핑에 없는 소리는 무음 → Task 8·9.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/render/viewport.ts` (수정) | 칸 32, `chooseView`, `computeViewport`(가변 시야), `screenToTile` |
| `src/render/sprites.ts` (새) | 스프라이트 참조 해석: 옛 시트 칸 / 새 `char.*` 이미지, 그리기 크기 |
| `src/render/layers.ts` (새) | `sortDrawables` — 발 y 정렬 키 (순수) |
| `src/render/motion.ts` (새) | `RenderMotion` — 이동 보간·걷기 프레임·방향 (순수, 시간 주입) |
| `src/render/autotile.ts` (새) | `pickWang`, `wangCorners`, 땅 격자에서 그릴 타일 목록 (순수) |
| `src/render/assets.ts` (새) | 지도별 PNG 지연 로딩 (`import.meta.glob`) |
| `src/render/canvas.ts` (수정) | 땅 층 → 물건·캐릭터 층 → 전투 겹침 |
| `src/content/types.ts`, `compile.ts`, `shape.ts` (수정) | `ground`·`object`·`objects:`·`char.*`·`tile:`·`audio.yaml` |
| `content/objects.yaml`, `content/audio.yaml` (새) | 물건 정의, 소리 매핑 |
| `scripts/assets/make-autotile.mjs` (새) | `metadata.json` → `assets/sprites/tilesets/<id>/autotile.json` |
| `src/audio/resolve.ts` (새) | `resolveSfx`, `footstepKey`, 매핑 해석 (순수) |
| `src/audio/engine.ts` (새) | Web Audio: 효과음 버퍼, 음악 루프·교차 페이드, 음량 |
| `src/audio/{synth,score,sfx}.ts`, `content/music/*.yaml` (삭제) | 칩 합성기 |
| `src/audit/dist-rules.ts` (수정) | 범주별 예산, 금지 경로, 장부·크레딧 검사 |

---

### Task 1: 가변 시야와 32px 칸

**Files:**
- Modify: `src/render/viewport.ts`, `tests/unit/render/viewport.test.ts`, `tests/unit/render/pointer.test.ts`
- Modify: `src/render/canvas.ts`(상수 사용처), `src/main.ts`(`frameViewport` 호출은 그대로)

**Interfaces:**
- Produces: `export const TILE = 32`; `export interface Viewport { scale; originTile; offsetPx; viewW; viewH }`; `export function chooseView(canvasPx: {w:number;h:number}): { scale: number; viewW: number; viewH: number }`; `computeViewport(canvasCss, dpr, mapSize, center): Viewport`(시그니처 유지, 결과에 `viewW/viewH` 추가); `screenToTile`·`frameViewport`·`tileAtPointer` 시그니처 유지. `VIEW_W/VIEW_H` 상수는 삭제하고 사용처는 `vp.viewW/viewH`로.

- [ ] **Step 1: 실패하는 테스트.** `viewport.test.ts`를 새 규칙으로 고친다(칸 규칙이 스펙으로 바뀐 것이라 기대값 변경은 약화가 아님 — handoff에 이유를 적는다). 추가 테스트: `chooseView({w:1280,h:720})`은 `{scale:3, viewW:13, viewH:7}`; `chooseView({w:1280,h:560})`은 scale 2, viewH 7; `chooseView({w:300,h:200})`은 scale 2·viewW 7(최소 clamp); `chooseView({w:2560,h:1440})`은 scale 4, viewW 15(최대 clamp). `computeViewport`: 지도 32×24, 중심이 모서리면 `originTile`이 `[0, mapW-viewW]`로 clamp; 지도 8×5는 `originTile 0,0`이고 `offsetPx`가 남는 공간의 절반(정수).
- [ ] **Step 2: 실패 확인.** `npx vitest run tests/unit/render` → FAIL(`chooseView` 없음).
- [ ] **Step 3: `viewport.ts` 구현.** `TILE=32`, `chooseView`, 가변 시야로 `computeViewport`/`screenToTile` 수정. `pointer.test.ts`의 좌표 기대값도 32px 기준으로 고친다.
- [ ] **Step 4: 통과 확인.** `npx vitest run tests/unit/render` → PASS. `npm run typecheck` → exit 0(`canvas.ts`가 `VIEW_W/H`를 쓰던 곳을 `vp.viewW/viewH`로 바꿨는지 확인).
- [ ] **Step 5: 커밋.** `feat(render): 32px tile and adaptive view (chooseView)`.

### Task 2: 스프라이트 참조 확장과 옛 그림 2배 호환

**Files:**
- Modify: `src/content/types.ts`, `src/content/shape.ts`, `src/content/compile.ts`, `content/tiles.yaml`
- Create: `src/render/sprites.ts`; Test: `tests/unit/render/sprites.test.ts`, `tests/unit/content/compile-sprites.test.ts`

**Interfaces:**
- Produces: `SpriteRef = { sheet: string; index: number } | { char: string }`; `sheets.<id>.tile?: number`(기본 16); `export function legacyDraw(sheetColumns: number, tilePx: number, index: number): { sx: number; sy: number; sw: number; sh: number }`; `export function charDrawRect(cellX: number, cellY: number, size: number): { x: number; y: number; w: number; h: number }`(48×48 캔버스를 칸 아래 중앙에 놓은 사각형, `size`=칸 화면 크기).
- YAML: `sprite: [town, 84]`(옛) 또는 `sprite: char.warden-kalas`(새). `char.*`는 `assets/sprites/characters/<이름>/`이 있어야 하며 없으면 컴파일 오류 `unknown character sprite`.

- [ ] **Step 1: 실패하는 테스트.** `legacyDraw(12,16,13)` → `{sx:16,sy:16,sw:16,sh:16}`; `charDrawRect(2,3,96)` → `{x:2*96-24, y:3*96-48, w:144, h:144}`(좌우 0.25칸, 위 0.5칸 겹침 — 48/32=1.5칸 폭). 컴파일: `char.nobody`가 오류, `char.warden-kalas`는 통과, 옛 `[town,84]`는 변함없이 통과.
- [ ] **Step 2: 실패 확인.** `npx vitest run tests/unit/render/sprites.test.ts tests/unit/content/compile-sprites.test.ts` → FAIL.
- [ ] **Step 3: 구현.** `shape.sprite`가 두 형태를 받게 하고, `compile.ts`의 시트 참조 검사(`sheet(...)`)는 `char` 형태를 건너뛰되 캐릭터 폴더 존재를 검사한다(폴더 목록은 `load-node.ts`가 읽는다). `legacyDraw`·`charDrawRect` 순수 함수를 `sprites.ts`에.
- [ ] **Step 4: 통과 확인.** 위 테스트 PASS, `npm run check:content` exit 0, `npm run test:unit` 전체 PASS.
- [ ] **Step 5: 커밋.** `feat(content): char.* sprite refs and per-sheet tile size`.

### Task 3: 층 정렬

**Files:** Create `src/render/layers.ts`, Test `tests/unit/render/layers.test.ts`

**Interfaces:**
- Produces: `export interface Drawable { readonly kind: "object" | "npc" | "player"; readonly footY: number; readonly footX: number; readonly id: string }`; `export function sortDrawables(items: readonly Drawable[]): Drawable[]`(원본 불변).

- [ ] **Step 1: 실패하는 테스트.** footY가 큰 것이 나중. 같은 footY면 `object < npc < player`. 같은 kind·footY면 footX 오름차순, 그다음 id. 입력 배열은 바뀌지 않는다.
- [ ] **Step 2: 실패 확인.** `npx vitest run tests/unit/render/layers.test.ts` → FAIL.
- [ ] **Step 3: `sortDrawables` 구현.** 안정 정렬, 키 순서 `footY, kindRank, footX, id`.
- [ ] **Step 4: PASS 확인.**
- [ ] **Step 5: 커밋.** `feat(render): drawable depth sort`.

### Task 4: 걷기 보간(RenderMotion)

**Files:** Create `src/render/motion.ts`, Test `tests/unit/render/motion.test.ts`

**Interfaces:**
- Produces: `export const WALK_MS = 130`; `export interface MotionFrame { readonly x: number; readonly y: number; readonly moving: boolean; readonly frame: number; readonly dir: Dir }`(x,y는 칸 단위 실수); `export function createMotion(start: Pos, dir: Dir): Motion`; `Motion = { onMoved(to: Pos, dir: Dir, nowMs: number): Motion; onTeleport(to: Pos, dir: Dir): Motion; sample(nowMs: number): MotionFrame }`(불변, 새 객체 반환). `Dir`는 core 타입 재사용.

- [ ] **Step 1: 실패하는 테스트.** 시작 `(5,5)` → `onMoved((6,5),"east",1000)`: `sample(1000)`은 `x=5`, `sample(1065)`는 `x=5.5, moving`, `sample(1130)`은 `x=6, moving=false`. **이동 중 새 입력**: `(5→6)` 보간 중 t=1060에 `onMoved((7,5),…)` → 이전 이동은 즉시 끝점 6에서 시작해 7로(x가 5.x에서 되돌지 않음, 6 미만으로 안 감). `onTeleport`는 보간 없이 즉시 끝점. `dir`은 마지막 이동 방향. `frame`은 이동 중에 0,1이 번갈아(65ms마다).
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현.** 상태는 `{from,to,startMs,dir}`; 선형 보간.
- [ ] **Step 4: PASS 확인.**
- [ ] **Step 5: 커밋.** `feat(render): walk motion interpolation`.

### Task 5: 땅·물건 콘텐츠 데이터와 검사

**Files:**
- Modify: `src/content/types.ts`, `compile.ts`, `shape.ts`; Create `content/objects.yaml`, `src/content/ground.ts`
- Test: `tests/unit/content/ground.test.ts`

**Interfaces:**
- Produces: `TileDef = { sprite?: SpriteRef; ground?: Ground; walk: number|null }`(둘 중 하나 필수); `export type Ground = "grass" | "path" | "water" | "stone" | "floor"`; `GameContent.objects: Record<Id,{image:string; footprint:[number,number]; blocks:boolean}>`; `MapDef.objects?: {id:Id; at:Pos}[]`; `MapDef.ground?: readonly string[]`(각 칸 땅 종류의 한 글자 코드 격자); `export function mergeObjectFootprints(rows: readonly string[], objects: ..., defs: ...): string[]`(발자국 칸을 막힘 글리프로 치환); `export const BLOCKER = ""`(tiles에 `walk:null`로 자동 등록); `export function checkGroundAdjacency(ground: readonly string[], allowedPairs: ...): string[]`(오류 문자열 목록).
- 규칙: 풀이 아닌 두 땅이 상하좌우·대각으로 맞닿으면 오류 `ground adjacency: path next to water at (x,y)`. 허용 예외: 두 칸 모두 `objects`의 `blocks:false` 물건(다리) 아래.

- [ ] **Step 1: 실패하는 테스트.** (a) 2×2 집 발자국이 `rows`에서 4칸 `BLOCKER`가 되고 그 외 칸은 그대로. (b) 지도 밖으로 나가는 물건 → 오류. (c) 길과 물이 인접한 `ground` → 오류, 다리 물건이 사이에 있으면 통과. (d) 알 수 없는 물건 id → 오류. (e) 옛 `sprite` 타일만 쓰는 지도는 `ground` 없이 통과(호환).
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현.** `compile.ts`가 `objects.yaml`·`maps.objects`를 읽고, 컴파일된 `MapDef.rows`는 합쳐진 격자, `MapDef.ground`는 `tiles`의 `ground`에서 만든 격자(타일이 `ground`를 가진 칸만, 나머지는 `.`=풀로 간주하지 않고 `null` 표시). 검사 오류는 기존 `check:content` 보고 형식에 맞춘다.
- [ ] **Step 4: PASS + `npm run check:content` exit 0 + 전체 `test:unit` PASS.**
- [ ] **Step 5: 커밋.** `feat(content): ground classes, objects and footprint merge`.

### Task 6: 듀얼 그리드 자동 타일

**Files:**
- Create: `src/render/autotile.ts`, `scripts/assets/make-autotile.mjs`, `assets/sprites/tilesets/grass-path-v3/autotile.json`, `assets/sprites/tilesets/grass-water/autotile.json`
- Test: `tests/unit/render/autotile.test.ts`

**Interfaces:**
- Produces: `export type Corners = readonly [boolean, boolean, boolean, boolean]`(NW,NE,SW,SE; true = 위 땅이 아닌 쪽, 곧 덮어 그릴 땅); `export function pickWang(table: WangTable, corners: Corners): { col: number; row: number } | null`(모두 false면 `null` = 그릴 것 없음); `export function overlayTiles(ground: readonly string[], kind: Ground, table: WangTable): { vx: number; vy: number; col: number; row: number }[]`(꼭짓점 `(vx,vy)` = 칸 `(vx-1,vy-1)..(vx,vy)`의 모서리, 화면에서는 반 칸 엇갈려 그린다); `WangTable = Record<string, {col:number;row:number}>`(키는 4비트 문자열 `"0110"` 등).
- `autotile.json` 형식: PixelLab `metadata.json`의 `tileset_data.tiles[].corners`(`upper`/`lower`)와 `original_position`을 읽어 `{ "<NW><NE><SW><SE>": {col,row} }`로 변환(`lower`를 덮어 그릴 땅 = 1).

- [ ] **Step 1: 실패하는 테스트.** (a) `pickWang`: 네 모서리 모두 false → null; 모두 true → 시트의 전부 덮는 칸; 임의 모서리 하나 true → 표의 해당 칸. (b) `overlayTiles`: 3×3 지도에서 가운데 한 칸만 길이면 꼭짓점 4개(그 칸 모서리 4곳)에 타일이 생기고 각 타일이 서로 다른 모서리 패턴. 지도 가장자리 밖은 풀로 취급. (c) 실제 `grass-path-v3/autotile.json`을 읽어 16개 조합이 모두 채워졌는지(null 모서리 조합 제외 15개 + 전체).
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: `make-autotile.mjs` 작성·실행**(`node scripts/assets/make-autotile.mjs grass-path-v3`), 두 `autotile.json`을 만들어 커밋. 이어 `autotile.ts` 구현.
- [ ] **Step 4: PASS 확인.**
- [ ] **Step 5: 커밋.** `feat(render): dual-grid wang autotile + tables for path and water`.

### Task 7: 땅·물건 그리기 + 지연 로딩 (칼라스 들판 수직 슬라이스)

**Files:**
- Create: `src/render/assets.ts`; Modify: `src/render/canvas.ts`, `src/main.ts`, `content/tiles.yaml`, `content/objects.yaml`, `content/towns/kalas/maps.yaml`(들판 지도만), `content/towns/kalas/npcs.yaml`(칼라스 인물 11명을 `char.*`로)
- Test: `tests/unit/render/assets.test.ts`

**Interfaces:**
- Produces: `export async function loadMapAssets(urls: ReadonlyMap<string,string>, ids: readonly string[]): Promise<Map<string, HTMLImageElement>>`(실패한 파일은 맵에 없음, 예외 안 던짐); `export function mapAssetIds(content: GameContent, mapId: Id): string[]`(그 지도가 쓰는 땅 시트·물건·캐릭터 id 목록, 순수); `drawFrame` 시그니처에 `motion: MotionFrame`·`images: ReadonlyMap<string,HTMLImageElement>` 추가.
- 그리는 순서: 풀 바닥 → 땅 종류별 `overlayTiles`(길 → 물 → 돌) → `sortDrawables`한 물건·NPC·플레이어 → 전투 겹침. 없는 이미지는 그 요소만 건너뛴다.

- [ ] **Step 1: 실패하는 테스트.** `mapAssetIds`가 들판 지도에서 `grass-path-v3`, `grass-water`, `object:tree-oak`, `char:stranger-B-navy`를 중복 없이 돌려준다. `loadMapAssets`는 `Image` 로딩이 실패하는 URL을 섞어도 resolve하고 성공한 것만 담는다(`Image`는 jsdom 대체 stub으로 주입).
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현.** `assets.ts`는 `import.meta.glob("../../assets/sprites/**/*.png", { eager: false, query: "?url", import: "default" })`로 URL 표를 만들고 지도 진입(`mapChanged`·시작) 때 `loadMapAssets`를 await. `canvas.ts`는 위 순서로 그리고 `main.ts`는 `Motion`을 `moved/mapChanged` 이벤트로 갱신하며 `requestAnimationFrame`을 보간 중에만 이어서 돌린다. 들판 지도를 `ground`·`objects`로 이전(나무·열석 고리·다리는 기존 `objects/kalas`, `bridge` 사용). 이 Task의 마지막에 `npm run dev`로 들판을 띄워 `scripts/visual/lab-check.mjs` 방식으로 캡처하고 **직접 열어 확인**한다(길이 풀에 자연스럽게 이어지는지, 물이 이어지는지, 나무 뒤로 걸을 때 가려지는지).
- [ ] **Step 4: PASS 확인.** `npm run test:unit`, `typecheck`, `check:content`, `build` 모두 exit 0. 캡처를 `docs/screenshots/2026-10-28-I2-field.png`로 저장하고 열어 본 소견을 handoff에 적는다.
- [ ] **Step 5: 커밋.** `feat(render): layered ground/object drawing, lazy sprite loading, kalas field on new art`.

### Task 8: 소리 해석 (순수)

**Files:** Create `src/audio/resolve.ts`, `content/audio.yaml`, Modify `src/content/{types,compile}.ts`, Test `tests/unit/audio/resolve.test.ts`

**Interfaces:**
- Produces: `GameContent.audio: { sfx: Record<string,string>; music: Record<Id,string>; footsteps: Record<Ground,string> }`(값은 `assets/audio/...`의 키); `export function resolveSfx(audio: GameContent["audio"], name: string): string | null`(없으면 `null`); `export function footstepKey(audio, ground: Ground | null): string`(`null`=옛 그림 지도는 `footsteps.grass`); `export function resolveTrack(audio, track: Id): string | null`.
- `content/audio.yaml`: `sfx`: `step→footstep, bump, learn→clue, confirm, hit, push, click, page, wrong, door, teleport, coins`; `footsteps`: `grass/path/floor→footstep, stone→footstep_stone, water→footstep_wood`(다리 칸은 물건이므로 Task 7에서 `water` 칸 위 다리 = wood로 취급); `music`: `music.kalas→kalas, music.field→field, music.overworld→field, music.archive→archive, music.battle→battle, music.<마을>→<마을>`; 에필로그 이벤트용 `music.ending→ending`. 키가 `assets/audio/sfx/sfx.json`·`bgm/credits.json`에 실제로 있어야 한다(컴파일 검사).

- [ ] **Step 1: 실패하는 테스트.** `resolveSfx(audio,"step")` → `"footstep"`, 모르는 이름 → `null`(예외 아님). `footstepKey(audio,"stone")` → `"footstep_stone"`, `null` → `"footstep"`. `resolveTrack(audio,"music.overworld")` → `"field"`. 컴파일: `audio.yaml`이 없는 키 `nonexistent`를 가리키면 `check:content` 오류.
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현.** 컴파일러가 `audio.yaml`을 읽고 파일 존재를 검사.
- [ ] **Step 4: PASS 확인** + `check:content` exit 0.
- [ ] **Step 5: 커밋.** `feat(audio): audio.yaml mapping and pure resolvers`.

### Task 9: Web Audio 엔진과 연결, 칩 합성기 제거

**Files:**
- Create: `src/audio/engine.ts`; Modify: `src/main.ts`, `src/ui/panels.ts`(음량 슬라이더·크레딧), `content/strings/{ko,en}.yaml`; Delete: `src/audio/{synth,score,sfx}.ts`, `content/music/*.yaml`, `tests/unit/audio/{score,sfx}.test.ts`와 합성기 전용 테스트
- Test: `tests/unit/audio/engine.test.ts`(가짜 `AudioContext`)

**Interfaces:**
- Produces: `export interface AudioEngine { unlock(): void; sfx(key: string, rate?: number): void; music(key: string | null): void; setVolume(kind: "sfx" | "music", v: number): void }`; `export function createEngine(deps: { ctx: () => AudioContext | null; fetchBuffer: (key: string, kind: "sfx" | "music") => Promise<ArrayBuffer> }): AudioEngine`.
- 동작: `unlock()` 전에는 모든 호출이 무음이고 `music(key)`는 마지막 키만 기억. 효과음 버퍼는 첫 사용 때 디코드·캐시, 같은 키 동시 재생 3개 초과면 버린다. `music(key)`는 현재 곡과 같으면 무시, 다르면 1.5초 동안 새 곡 페이드 인·이전 곡 페이드 아웃 뒤 정지·버퍼 해제, `loop=true`. 디코드·fetch 실패는 `console` 대신 `debug-log`로 기록하고 무음. 음량 기본 음악 0.5·효과음 0.8, `localStorage` 저장은 try/catch.
- 크레딧: 크레딧 패널이 `bgm/credits.json`의 `credit` 문구를 곡 사용 순서대로 보여 준다(CC-BY 표기). 문구는 JSON에서 읽고 패널 라벨만 문자열 키로.

- [ ] **Step 1: 실패하는 테스트.** (a) `unlock()` 전에 `sfx("click")` 호출 → 소스가 만들어지지 않는다. (b) 같은 키를 4번 연속 호출 → 소스 3개만 시작. (c) `music("a")`, `music("a")` → 한 번만 시작. (d) `music("a")`→`music("b")` → a의 gain이 1.5초 램프로 0, b가 0→목표 음량. (e) `fetchBuffer`가 reject → 예외 없이 무음. (f) `unlock()` 전 `music("a")` 후 `unlock()` → a가 시작.
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현.** `main.ts`의 `playSfx`·`ensureAudio`·`playTrack`을 엔진 호출로 교체: `moved` → `engine.sfx(footstepKey(audio, groundAt(state)), 0.95 + (state.turn % 3) * 0.05)`(core의 rng를 쓰지 않고 `turn`으로 결정적 변화), `bumped`, `factLearned`, `deductionConfirmed`, `sfx`, `music` 이벤트를 `audio.yaml` 해석 → 엔진. 에필로그 이벤트는 `music("ending")`. 합성기·악보 파일과 `content/music/*.yaml`, 컴파일러의 `readMusic`, `Score` 타입, `GameContent.music`, `tests`의 악보 검사를 제거하고 `music.<id>` 참조는 `audio.yaml`의 `music` 키를 가리키도록 `ref()` 대상을 바꾼다.
- [ ] **Step 4: 통과 확인.** `npm run test:unit`(삭제한 합성기 테스트는 목록에서 사라지고 나머지는 PASS — 개수 변화를 handoff에 기록), `typecheck`, `check:content`, `build` exit 0.
- [ ] **Step 5: 커밋.** `feat(audio): web audio engine, audio.yaml wiring; remove chip synth`.

### Task 10: 배포 예산과 라이선스 검사

**Files:** Modify `src/audit/dist-rules.ts`, `scripts/audit-dist.ts`, `vite.config.ts`(필요 시), Test `tests/unit/audit/dist-rules.test.ts`

**Interfaces:**
- Produces: `export const BUDGETS = { code: 3 * 1024 * 1024, art: 6 * 1024 * 1024, audio: 16 * 1024 * 1024, firstLoad: 5 * 1024 * 1024 }`; `auditDist(files: readonly {path:string; bytes:number}[], ledgerPaths: ReadonlySet<string>, creditKeys: ReadonlySet<string>, bgmFiles: ReadonlySet<string>): string[]`(오류 목록, 빈 배열이면 통과). 첫 로딩 = 코드 + `assets/audio/sfx/**` + 기본 지도 그림은 계산 불가이므로 **음악 제외 합계**로 근사.

- [ ] **Step 1: 실패하는 테스트.** 각 범주 한도 초과 → 오류. 경로에 `assets-private/` 또는 `lab/` 포함 → 오류. `assets/audio/**`·`assets/sprites/**` 파일이 장부 경로 집합에 없으면 오류. `bgmFiles`에 있는 파일이 `creditKeys`에 없으면 오류. 모두 정상이면 `[]`.
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현.** `scripts/audit-dist.ts`가 `assets/LEDGER.md`에서 경로를 파싱해 집합을 만든다(파서 실패 시 명확한 오류).
- [ ] **Step 4: PASS + 실제 `npm run build && npm run audit:dist` exit 0**(`lab/`이 dist에 없는지 포함).
- [ ] **Step 5: 커밋.** `feat(audit): per-category budgets, private-path and ledger/credit checks`.

### Task 11: 칼라스 인물·걷기 그림 연결과 문서·확인

**Files:** Modify `content/towns/kalas/npcs.yaml`(Task 7에서 하지 않은 인물), `content/start.yaml`(플레이어 `char.stranger-B-navy`), `src/render/canvas.ts`(걷기 프레임: `elin-B`·`wolf-hungry`는 걷기, 나머지는 대기 4방향 + 2px 흔들림), `docs/status.md`, `docs/handoff.md`, `docs/superpowers/specs/2026-10-28-art-audio-redesign.md`(구현 중 바뀐 점은 끝에 정정 절)

**Interfaces:** Consumes Task 2 `charDrawRect`, Task 4 `MotionFrame`, Task 7 `images`.

- [ ] **Step 1: 실패하는 테스트.** `tests/unit/render/sprites.test.ts`에 `walkFrameFile(char: string, dir: Dir, frame: number, hasWalk: boolean): string` — `hasWalk=false`면 `rot-<dir>.png`, `true`면 `walk-<dir>/frame_<frame>.png`(실제 폴더 이름은 `assets/sprites/characters/elin-B/walk-east/`로 확인해 테스트 기대값을 맞춘다)와 흔들림 `idleBobPx(frame): 0 | -2`.
- [ ] **Step 2: 실패 확인.** → FAIL.
- [ ] **Step 3: 구현·콘텐츠 이전.** 칼라스 NPC 11명과 플레이어를 `char.*`로 바꾼다. 나머지 7개 마을과 서고·대륙은 **옛 `[sheet,index]`를 그대로 둔다**(호환 경로로 돌아가는지 확인용).
- [ ] **Step 4: 전체 게이트 + 눈으로 확인.** 게이트 7종 exit 0. `npm run dev`로 들판→칼라스→서고→전투까지 한 바퀴 돌며 `lab-check.mjs`/`verify-video.mjs`로 캡처·영상을 만들고 **열어 본다**. 옛 마을(예: 정의 마을) 한 장도 확인(2배 확대 그림이 칸에 맞는지). 소리는 🧑 사용자가 듣는다.
- [ ] **Step 5: 기록과 커밋.** handoff 끝에 절 추가(한 일·커밋·명령·exit code·확인 못 한 것), status 갱신, `docs/plan.md` §3에 승인 기록. 커밋 `feat: kalas cast on new sprites; docs and status`, `git push origin HEAD:main` 후 `git ls-remote`로 확인.

---

## Self-Review

- **스펙 커버리지:** §2 화면 → T1; §3.1 데이터 → T2·T5; §3.2 Wang → T6; §3.3 정렬·보간 → T3·T4; §3.4 로딩 → T7; §4.1~4.3 소리 → T8·T9; §5 예산·검사 → T10; §6 순서의 I-1/I-2 → T1–T11. 스펙 §8의 결정 4(시점 판정)는 🧑라 코드 작업 없음, 대륙 음악(결정 5)은 T8의 `audio.yaml`. 크레딧 표시는 T9. **의도적 제외:** 모노 변환(확인 필요 항목), 다른 마을 이전.
- **타입 일관성:** `Viewport.viewW/viewH`(T1) → 사용처 T7; `MotionFrame`(T4) → T7·T11; `Ground`(T5) → T6·T8; `SpriteRef`(T2) → T5·T7·T11.
- **위험:** T9에서 `GameContent.music`·`Score` 제거는 컴파일러·검사·테스트 여러 곳에 닿는다. 실패하면 합성기 제거만 별도 커밋으로 나눈다. 칼라스 들판 외 지도의 `rows` 글자가 새 `tiles.yaml` 정의와 충돌하지 않도록 옛 글자는 건드리지 않고 새 글자는 새 문자(`A`–`Z`·`0`–`9` 일부)에서 추가한다.
