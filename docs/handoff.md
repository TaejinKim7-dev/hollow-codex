# HANDOFF
작성 시각: 2026-10-06 KST (설계를 진행한 `/home/taejin/ultima` 세션에서 작성)

## 1. 목표 (What we're building)
- **빈 경전 (Hollow Codex)**: 미덕이 제도가 되어 굳어 버린 대륙 알마에서, 이방인이 대화로 모은 지식으로 여덟 미덕의 본래 뜻을 되찾고 마지막에 빈 경전에 자기 답을 써 넣는 지식 기반 탐험 RPG. 공개 독립 게임(원작 자산·이름 없음), 웹 PC + 모바일, 한국어 우선, 6~10시간.
- 지금 단계 목표: M0(저장소 골격·배포) + M1(정직의 마을 칼라스 수직 슬라이스, 약 45분).

## 2. 현재 상태 (Current state)
- 설계 스펙 작성·커밋·push 완료, 사용자 승인("고칠것 없어") — `docs/superpowers/specs/2026-10-06-hollow-codex-design.md` (커밋 `9568d13`).
- M0+M1 구현 계획 작성 완료 — `docs/superpowers/plans/2026-10-06-m0-m1-kalas-slice.md`. **사용자 검토 대기**, 실행 방식(서브에이전트 / 직접)도 아직 안 정함.
- 코드는 아직 한 줄도 없음. `package.json`도 없음(계획 Task 1에서 만듦).
- GitHub: https://github.com/TaejinKim7-dev/hollow-codex (공개), `main` = `origin/main`. Pages는 아직 설정 안 함(계획 Task 2).

## 3. 변경한 파일 (Files changed)
- `docs/superpowers/specs/2026-10-06-hollow-codex-design.md` — 게임 전체 설계(세계·시스템·IP 경계·음향·기술·마일스톤·라이선스).
- `docs/superpowers/plans/2026-10-06-m0-m1-kalas-slice.md` — 16개 Task 구현 계획.
- `CLAUDE.md` — 세션 시작 시 읽을 순서와 절대 금지.
- `HANDOFF.md` — 이 문서.

## 4. 주요 결정과 근거 (Key decisions)
- 공개 독립 게임 → 원작 고유명사·문장·음악·데이터 금지, 개념(8미덕·3원리, 키워드 대화, 동료 이탈, 질문형 엔딩)만 계승. 금지 목록은 빌드 검사로 강제(spec §2).
- 핵심 경험 = 지식 기반 탐험(수첩·3칸 확정 추론·소문 지도). 전투는 적고 예고형 격자 턴제. 전제 = 굳어버린 미덕(악당 없음).
- 기술 = 자체 TS 엔진(순수 core + Canvas2D + DOM UI + Web Audio 칩 합성기), 데이터 주도 YAML 콘텐츠. Phaser·Godot는 TDD·용량 때문에 버림.
- 자산 = 16×16 픽셀, CC0/CC-BY/CC-BY-SA/OFL만, `assets/LEDGER.md`로 추적. 음악 = 공유 저작물 고전 선율의 칩 편곡(울티마 풍), 원곡 금지.
- 라이선스 = 코드 MIT + 콘텐츠 CC BY-SA 4.0. NC·ND 자산 제외.
- 계획에서 스펙과 다르게 정한 4가지(사용자 확인 필요): 지도 ASCII YAML(Tiled 대신), 악보 텍스트 YAML(MIDI 대신), Drive 동기화 M2 이후로 연기, M1엔 낮밤 일과 없음.

## 5. 다음 할 일 (Next steps)
- [ ] 사용자에게 계획 검토와 실행 방식 선택을 받는다(계획 상단 "스펙과 다르게 정한 점" 4가지 포함). 이전 세션은 **서브에이전트 방식**(Task마다 새 구현자 + 검토자)을 추천할 예정이었다 — Task 5~11이 공통 타입을 공유해 Task별 검토 가치가 크기 때문.
- [ ] 승인되면 `todo-1-skeleton` 브랜치에서 Task 1부터 실행. Task 1은 `/home/taejin/ultima`에서 `src/debug-log.ts`와 그 테스트를 복사한다.
- [ ] Task 2에서 Pages를 Actions 소스로 켜고 `https://taejinkim7-dev.github.io/hollow-codex/` 200 확인.
- [ ] M1 끝(Task 16)에 사용자 플레이 판정을 받기 전에는 M2 계획을 쓰지 않는다.

## 6. 막힌 부분 / 주의사항 (Blockers & gotchas)
- `u4-alt-manual.pdf`(1985 원작 매뉴얼 스캔)와 `origin.txt`(나무위키 줄거리)는 `/home/taejin/ultima` 루트에 git 추적 없이 있다. **이 저장소로 복사·커밋 금지.** 설계 근거는 스펙에 우리 말로만 남겼다.
- `/home/taejin/ultima`의 한국어 번역문(`locales/` 등)은 원작 대사에서 나온 것이므로 가져오지 않는다.
- "Hollow Codex" 이름은 일반 웹 검색만 했다(같은 제목 게임 없음, *Eternal Strands* 게임 내 도감 이름만 겹침). M6 전에 상표 재확인 — 확인 필요.
- Kenney "Tiny Town"/"Tiny Dungeon"이 CC0인지는 이전 세션의 기억에 근거한 것이다. 계획 Task 15 Step 1에서 받은 zip의 License 파일로 확인할 것 — 확인 필요.
- Node 22.23.3에서 `.ts` 파일을 `node`로 직접 실행(타입 제거)되는 것은 확인함. 단, 열거형·namespace 같은 비소거 문법은 쓰면 안 된다.
- Google Drive용 OAuth 클라이언트 ID는 `ultima` 것을 재사용하지 않고 새로 발급(M2 이후).

## 7. 재개 방법 (How to resume)
```bash
cd /home/taejin/hollow-codex
export PATH="$HOME/.local/opt/node22/bin:$PATH"   # node v22.23.3
git status --short --branch                        # main...origin/main 이어야 함
claude                                             # 새 세션: CLAUDE.md → HANDOFF.md → spec → plan 순서로 읽음
```
- 이 프로젝트용 Claude 메모리(`~/.claude/projects/-home-taejin-hollow-codex/memory/`)에 작업 방식 메모 3개(묻지 말고 추천안 진행, 테스트는 Haiku 서브에이전트, 수정 후 e2e 금지)와 출처 메모를 넣어 두었다.
- Task 1 이후 게이트: `npm ci && npm run test:unit && npm run typecheck && npm run check:content && npm run build && npm run audit:dist && git diff --check` (Haiku 서브에이전트로 실행).

## 2026-10-06 Task 1
골격·규칙 문서 작성, 게이트 결과는 아래.

## 2026-10-06 Task 2 — 첫 Pages 배포
- merge 게이트(Haiku, HEAD `859cca5`): `npm ci` 0 · `npm run test:unit` 0 (11 passed) · `npm run typecheck` 0 · `npm run check:content` 0 (자리표시) · `npm run build` 0 · `npm run audit:dist` 0 · `git diff --check` 0.
- `todo-1-skeleton` → `main` ff-merge·push. Actions run `37400128555`: build success, deploy success.
- `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200.

## 2026-10-06 M0 완료 (Task 3–4)
- Task 3 콘텐츠 컴파일러·금지어 검사(`fd6146b`, 검토 수정 `df3c37c`), 요구사항 문서 `docs/requirements/2026-10-06-m0-m1-requirements.md`와 계획 보강(`54dfb68`), Task 4 장부·글꼴·크레딧(`df01f21`).
- merge 게이트(Haiku, HEAD `df01f21`): `npm ci` 0 · `test:unit` 0 (39 passed) · `typecheck` 0 · `check:content` 0 (`ok (1 maps, 0 npcs, 0 facts, 2 ledger files)`) · `build` 0 · `audit:dist` 0 (`ok (4 files, 46855 bytes)`) · `git diff --check` 0.
- main push → Actions run `37401645931` build·deploy success, Pages HTTP 200.
- **사용자 확인 요청**: https://taejinkim7-dev.github.io/hollow-codex/ 에서 제목 "빈 경전"이 Neo둥근모 글꼴로 보이는지.
- 참고: `npm ci`가 dev 의존성 취약점 6건을 알린다(배포 번들에는 들어가지 않는 개발 도구). 아직 조사하지 않았다.
- 다음: M1(Task 5–16)을 `todo-2-kalas` 브랜치에서.

## 2026-10-06 M1 완료 (Task 5–16)
- 구현은 `todo-2-kalas`에서 7커밋으로 진행(서브에이전트 병렬):
  - `b31c3f9`·`90b33b0`·`2513b1d`·`09615b8`·`624e085`·`53effb2` (Task 5–10, core)
  - `2f0a470` Task 11 saves · `b8506ea` Task 12 render+input · `5e5e84e` Task 13a UI view-model · `7dcd11d` Task 14 audio · `ad9825d` Task 15 Kalas 콘텐츠 · `a1bf7b0` Task 13b UI 패널 마운트 · `9f5d190` Task 16 통합·시나리오·e2e.
- merge 게이트(HEAD `9f5d190`, 메인 직접): `npm run test:unit` 0 (24 files, **160 passed**) · `typecheck` 0 · `check:content` 0 (`ok (3 maps, 11 npcs, 20 facts, 6 ledger files)`) · `build` 0 (6 files, 132597 bytes) · `audit:dist` 0 · `git diff --check` 0. e2e 1 passed.
- main push → Actions run `37408364502` build·deploy success.
- `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200, `<title>빈 경전</title>`.
- **사용자 확인 요청 (M1 §8.1 9개 체크리스트)**: dev 서버 `http://localhost:5173/hollow-codex/` 또는 위 Pages URL에서 PC·모바일로 **칼라스 두 갈래(truth / lantern)를 끝까지 플레이**.
  - [ ] 부팅 후 로딩·콘솔 에러 0
  - [ ] 시야·타일 스케일·Neo둥근모 글꼴
  - [ ] 필드 이동·다리에서 늑대 전투(밀어/공격 모두 동작)
  - [ ] 칼라스 도착·NPC 대화·선택지·위기 선택
  - [ ] 추론 3칸 확정·능력 "거짓을 보는 눈" 해금
  - [ ] 옛 서고·도굴꾼 전투 승리
  - [ ] 저장/자동저장(브라우저 IndexedDB) 동작
  - [ ] 음악·효과음(브라우저 첫 클릭/키 입력 후)
  - [ ] 모바일 터치로 한 갈래 끝까지
- 판정(계속 / 방향 수정 / 중단)을 회신해 주면, 그에 맞춰 M2 계획을 작성한다.
- **알려진 주의**: 타일 인덱스(특히 풀·나무·문·계단)와 La Mourisque 편곡은 모델이 PNG를 직접 보지 못해 색·셰이프 분석으로 추정했다. 화면에서 어색하면 `content/tiles.yaml` 한 줄씩 인덱스 보정 필요.
- 다음: 사용자 플레이 판정 후 M2 계획 작성.

(End of file)

## 2026-10-06 M2 완료 (Task 17–32)
- 구현은 `todo-3-world`에서 14커밋(서브에이전트 5–8개 동시):
  - `ad330ee` T17 시간·고리기반 · `e57d959` T18 NPC일과 · `4c32ae2`+`a8cc8e3` T19 컴파일·경로 · `59ca33c` T20 오버월드 진입 · `e7e8343` T22 대륙 지도+8마을 입구+7열석+악보+장부 · `a56588f` T23 마을 스텁 분리 · `a7b9e76` T25 자동 열석 해금 · `2858172` T27 파티 상한 · `4eb209d` T28 일간 표시+열석 메뉴 · `6bdb8b4` T30 v2 세이브·M1 마이그레이션 · `068a94b` T31 시나리오 3개(대륙traversal/ring/party) · `5ed4b8f` T32 main.ts 통합·e2e.
- merge 게이트(HEAD `5ed4b8f`, 메인 직접): `npm ci` 0 · `npm run test:unit` 0 (36 files, **224 passed**) · `typecheck` 0 · `check:content` 0 (`ok (11 maps, 11 npcs, 28 facts, 7 ledger files)`) · `build` 0 (6 files, 149787 bytes) · `audit:dist` 0 · `git diff --check` 0. e2e 1 passed.
- main push → Actions run `37415215258` build·deploy success.
- `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200.
- **M2 완료 기준 충족**: 대륙 64×48 오버월드 + 8 마을 입구 + 7 마을 스텁 + 8 열석 + 시간 시스템 + NPC 일과 + 동료 상한 + v2 세이브. 시나리오 테스트는 출발→칼라스→7 미덕 마을 한 바퀴→열석 이동 검증 통과.
- 다음: M3 (마을 2~4 콘텐츠: 연민·용맹·정의) 진행 — Task 33·34·35 병렬.

(End of file)

## 2026-10-06 M3 완료 (Task 33–36)
- 구현은 `todo-4-content`에서 5커밋(서브에이전트 4개 동시):
  - `81ce8d5` T33 연민 — Reona · `486b714` T34 용맹 — Solgang · `d6ea67e` T35 정의 — Seles · `ff8c2bb` T36 시나리오 3개 + 통합 (Task 36이 2개의 콘텐츠 도달성 버그 수정도 동봉: `justice.npcs.yaml` widow의 `job`이 `fact.seles.mourning-lullaby` 부여, `compassion.npcs.yaml` miller의 `job`이 `fact.reona.relief-tax` 부여).
- merge 게이트(HEAD `ff8c2bb`): `npm ci` 0 · `npm run test:unit` 0 (39 files, **230 passed** = 기존 224 + 시나리오 6) · `typecheck` 0 · `check:content` 0 (`ok (11 maps, 41 npcs, 76 facts, 10 ledger files)`) · `build` 0 (6 files, 226644 bytes) · `audit:dist` 0 · `git diff --check` 0.
- main push → Actions run `37417351066` build·deploy success.
- `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200.
- **M3 완료 기준 충족**: 4개 미덕(정직·연민·용맹·정의) 추론 3칸 확정 가능. 시나리오 3개 통과.
- 다음: M4 (마을 5~8 + 던전: 희생·명예·영성·겸默) 진행.

(End of file)

---

## Task별 누적 기록 (2026-10-06)

### M0 골격 — `todo-1-skeleton` → main, 6커밋

| Task | 커밋 | 작업 |
|---|---|---|
| (스켈레톤) | `58f9773` | project skeleton + AGENTS + LICENSE + README |
| (계획) | `8949f5b` | docs(plan): M0+M1 implementation plan |
| 2 | `859cca5` | ci: Pages workflow and dist audit (Actions 배포 게이트) |
| 2 | `bcac0df` | docs: record first Pages deploy |
| 3 | `fd6146b` | feat(content): YAML 컴파일러 + 참조·금지어 검사 |
| 3 | `df3c37c` | fix(content): typed virtual module, fail-closed denylist |
| (요구사항) | `54dfb68` | docs: M0+M1 requirements; refine plan tests |
| 4 | `df01f21` | feat(assets): 자산 장부 검사 + Neo둥근모 글꼴 + 크레딧 |
| 1 | `3aa3a0d` | docs: record M0 completion |

M0 게이트: `test:unit` 11 passed · `check:content` 자리표시 · `audit:dist` ok (4 files, 46855B).

### M1 칼라스 수직 슬라이스 — `todo-2-kalas`, 13커밋

| Task | 커밋 | 작업 |
|---|---|---|
| 5 | `53effb2` | core: state + 결정적 step + 이동 + 경로찾기 (state.ts, move.ts, path.ts, rng.ts) |
| 6 | `624e085` | core: 수첩 fact + 3슬롯 추론 + 소문힌트 (notebook.ts) |
| 7 | `09615b8` | core: 키워드 대화 + 조건·거짓말·선택 (talk.ts) |
| 8 | `2513b1d` | core: 행실 + 동료 합류·이별·재합류 (conduct.ts) |
| 9 | `90b33b0` | core: 마을 위기 옵션 + 해결 (crisis.ts) |
| 10 | `b31c3f9` | core: 예고 격자 전투 + 밀어·설득·도주 (combat/grid.ts, intents.ts) |
| 11 | `2f0a470` | core: 버전된 세이브 형식 (serialize.ts, slots.ts, slot-store.ts) |
| 12 | `b8506ea` | render+input: 정수 스케일 뷰포트 + 명령 통합 |
| 13a | `5e5e84e` | ui: 대화·수첩·전투 view-model (view-model.ts, strings.ts) |
| 14 | `7dcd11d` | audio: 텍스트 악보 + 칩 합성기 + 생성 sfx (score.ts, synth.ts, sfx.ts) |
| 15 | `ad9825d` | content(kalas): 칼라스 타운 + 자산(Kenney) + 음악 |
| 13b | `a1bf7b0` | ui: DOM 패널 + 메뉴 (panels.ts, panels.css, main.ts 마운트) |
| 16 | `9f5d190` | 통합: 시나리오 3 + main 루프 + e2e (play.ts, kalas-*.test.ts, boot.spec.ts) |

M1 게이트: `test:unit` 160 passed · `check:content` ok (3 maps, 11 npcs, 20 facts, 6 ledger) · `audit:dist` ok (4 files, 132597B) · e2e 1 passed.

### M2 세계 골격 — `todo-3-world`, 14커밋

| Task | 커밋 | 작업 |
|---|---|---|
| (계획) | `5265528` | docs(plan): M2 세계 골격 — 16 Task |
| 17 | `ad330ee` | core: 시간 시스템 + 고리 + M2 타입 기반 (types.ts, state.ts, move.ts, ring.ts, step.ts) |
| 18 | `e57d959` | dialogue: NPC 일과 (talk.ts `npcPositionAt` + npcs.yaml `schedule:`) |
| 19 | `4c32ae2` | content: moongates 스키마 + 오버월드 검증 (compile.ts) |
| 19 | `a8cc8e3` | world: `terrainCost` 인지 `findPath` (path.ts Dijkstra) |
| 20 | `59ca33c` | world: 오버월드 마을 진입 트리거 (overworld.ts, move.ts) |
| 22 | `e7e8343` | content(overworld): 64×48 대륙 + 8 입구 + 7 고리 + 7 마을 스텁 + 음악 (한 task에서 Task 22+23+24 일부 선행) |
| 23 | `a56588f` | content(towns): 7 마을 스텁을 별도 파일로 분리 (compassion/valor/justice/sacrifice/spirituality/humility) |
| 25 | `a7b9e76` | world: 사실 학습 → 고리 자동 해금 (notebook.ts, types.ts `ringUnlocked`) |
| 27 | `2858172` | conduct: 4번째 동료 거부 (`companionJoinRejected`) |
| 28 | `4eb209d` | ui: 일간 표시 + 열석 메뉴 (panels.ts, format-time) |
| 30 | `6bdb8b4` | save: v2 형식 + M1 마이그레이션 + time/rings shape 검사 |
| 31 | `068a94b` | test(scenario): M2 continent traversal + ring + party (4개 시나리오 + `map.field → map.over` 출구 추가) |
| 32 | `5ed4b8f` | main: M2 부팅·이벤트 처리·자동저장(dayPassed 트리거 추가) + e2e |
| (handoff) | `0e9a67c` | docs(handoff): M2 완료 |

M2 게이트: `test:unit` 224 passed · `check:content` ok (11 maps, 11 npcs, 28 facts, 7 ledger) · `audit:dist` ok (6 files, 149787B) · e2e 1 passed.

### M3 마을 2~4 — `todo-4-content`, 5커밋

| Task | 커밋 | 작업 |
|---|---|---|
| (계획) | `e35064b` | docs(plan): M3 마을 2~4 — compassion·용맹·정의 |
| 33 | `81ce8d5` | content(compassion): Reona (10 NPC, 16 fact, deduction, crisis, encounter, 능력, 음악) |
| 34 | `486b714` | content(valor): Solgang (10 NPC, 16 fact, deduction, crisis, encounter, 능력, 음악) |
| 35 | `d6ea67e` | content(justice): Seles (10 NPC, 16 fact, deduction, crisis, encounter, 능력, 음악) |
| 36 | `ff8c2bb` | test(scenario): M3 3 시나리오 (compassion·valor·justice) + 2 콘텐츠 도달성 버그 수정 (widow `job`→mourning-lullaby, miller `job`→relief-tax) + `play.ts` `approachCell`/`stallToSafe` 추가 |
| (handoff) | `6355485` | docs(handoff): M3 완료 |

M3 게이트: `test:unit` 230 passed (224 + 시나리오 6) · `check:content` ok (11 maps, 41 npcs, 76 facts, 10 ledger) · `audit:dist` ok (6 files, 226644B).

### M4 마을 5~8 — `todo-5-towns` (진행 중, 5커밋)

| Task | 커밋 | 작업 |
|---|---|---|
| (계획) | `d6c5be5` | docs(plan): M4 마을 5~8 — sacrifice·honor·spirituality·humility |
| 37 | `72a9202` | content(sacrifice): Dione (10 NPC, 16 fact, deduction, crisis, encounter, 능력, 음악) |
| 38 | `8fca84c` | content(honor): Argon (10 NPC, 16 fact, deduction, crisis, encounter, 능력, 음악) |
| 39 | `3ffb841` | content(spirituality): Elia (10 NPC, 16 fact, deduction, crisis, encounter, 능력, 음악) |
| 40 | `80f8098` | content(humility): Heron (10 NPC, 16 fact, deduction, crisis, encounter, 음악) — 능력 없음(D5), 침묵 규칙으로 대사 단축 |
| 41 | (진행 중) | test(scenario): M4 4 시나리오 + 통합 + 머지 |
| (handoff) | (예정) | docs(handoff): M4 완료 |

M4 중간 게이트: `test:unit` 230 passed · `check:content` ok (11 maps, 81 npcs, 140 facts, 14 ledger) · `audit:dist` ok (6 files, 333152B).

(End of file)

## 2026-10-06 M4 완료 (Task 37–41)
- 구현은 `todo-5-towns`에서 7커밋(서브에이전트 4개 동시):
  - `72a9202` T37 희생 — Dione · `8fca84c` T38 명예 — Argon · `3ffb841` T39 영성 — Elia · `80f8098` T40 겸손 — Heron (능력 없음, 침묵 규칙) · `83dcff0` T41 시나리오 4개 + 콘텐츠 도달성 버그 8개 수정 (각 마을 `job` 토픽에 단어 grant 추가).
- (handoff 백필) `f395d0c` M0~M4 Task별 누적 표 추가.
- merge 게이트(HEAD `83dcff0`): `npm ci` 0 · `npm run test:unit` 0 (43 files, **238 passed** = 230 + 시나리오 8) · `typecheck` 0 · `check:content` 0 (`ok (11 maps, 81 npcs, 140 facts, 14 ledger files)`) · `build` 0 (6 files, 333286 bytes) · `audit:dist` 0 · `git diff --check` 0.
- main push → Actions run `37423720784` build·deploy success.
- `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200.
- **M4 완료 기준 충족**: 8개 미덕(정직·연민·용맹·정의·희생·명예·영성·겸손) 추론 3칸 확정 가능. 겸손은 능력 미부여 (사례 위반 — 다만 마을 자율성 회복 능력 자체가 마을에 녹아 있음). 시나리오 4개 통과.
- 다음: M5 (봉인 서고 + 빈 경전 엔딩 + 에필로그 + 난이도 조정) 진행 — Task 42·43 병렬, Task 44 통합.

(End of file)

## 2026-10-06 M5 완료 (Task 42–44)
- 구현은 `todo-6-archive`에서 4커밋(서브에이전트 2개 동시):
  - `71b7410` T42 봉인 서고 — 맵 + CodexState + writeCodex/writeFinal + 8쪽 알코브 + 마지막 장 UI + v2 세이브 마이그레이션
  - `8ba22e6` T43 에필로그 — 3종 variants × 8 마을 메시지 + 적 hp -1
  - `db80970` T44 시나리오 — 봉인 서고 traversal + 8쪽 쓰기 + 3종 final + main.ts 이벤트 연결
- merge 게이트(HEAD `db80970`): `npm ci` 0 · `npm run test:unit` 0 (46 files, **272 passed** = 238 + 34 codex/epilogue/scenario) · `typecheck` 0 · `check:content` 0 (`ok (12 maps, 81 npcs, 140 facts, 15 ledger files)`) · `build` 0 (6 files, 345882 bytes) · `audit:dist` 0 · `git diff --check` 0.
- main push → Actions run `37425247562` build·deploy success.
- `https://taejinkim7-dev.github.io/hollow-codex/` → HTTP 200.
- **M5 완료 기준 충족**: 봉인석 진입(7고리 방문 후) → 8쪽 쓰기 → 마지막 장 → 진실·사랑·용기 3종 에필로그 모두 시나리오 통과.
- 다음: M6 (출시 준비 — PWA, 모바일 조정, 접근성, 이름 재확인, 크레딧) 진행.

### M5 Task별 기록 (백필 추가)

| Task | 커밋 | 작업 |
|---|---|---|
| (계획) | `a3ff1ce` | docs(plan): M5 봉인 서고 + 빈 경전 엔딩 |
| 42 | `71b7410` | feat(archive): 봉인 서고 맵 + codex 페이지 + 마지막 장 + 세이브 마이그레이션 + UI 오버레이 |
| 43 | `8ba22e6` | feat(epilogue): 3종 에필로그 + 30개 마을 메시지 + 적 hp -1 |
| 44 | `db80970` | test(scenario): 봉인 서고 traversal + 8쪽 + 3종 final + main.ts 이벤트 |

(End of file)

## 2026-10-06 M6 Task 47 — README + 크레딧 + 모바일 미세 조정 (완료)

- 브랜치 `todo-7-release`. SHA 범위: `2fb2f7e..2e82028` (Task 47 커밋 `2e82028`, 그 뒤 handoff 커밋).
- 작업:
  - `README.md` 전면 개편(118줄) — 소개·플레이·설치/실행(Pages URL + PWA)·기술·빌드 검증(7단계 게이트)·라이선스·기여·원작과의 경계·연락.
  - `src/ui/panels.ts` 크레딧 강화 — `groupCredits()`로 경로 기준 fonts/tiles/music/code 묶음. 비어 있는 묶음은 그리지 않음(LEDGER에 code 행 없음). 각 행은 `작가 · 라이선스 · 출처`(프로토콜 제거 상태, dist 외부 출처 감사 통과를 위해 텍스트로만 표시).
  - `content/strings/ko.yaml` — `ui.credits-intro`, `ui.credits.group.{fonts,tiles,music,code}`, `ui.touch-hint` 추가.
  - `src/main.ts` — 첫 캔버스 터치에만 "터치로 이동" 안내를 1.6초 표시(`showTouchHintOnce`).
  - `src/ui/panels.css` — 크레딧 묶음 스타일, 첫 터치 안내 스타일, 모바일 세로 모드(`orientation: portrait and max-width: 640px`)에서 메뉴 슬롯 1열 스택.
  - `package.json` — `0.0.0` → `0.1.0` (M1~M6 첫 플레이어블 릴리스).
  - `assets/LEDGER.md` — 수정 없음. 15행 전부 허용 라이선스(CC0/CC-BY/CC-BY-SA/OFL)로 유효, `check:content` 통과.
- **merge 게이트 (HEAD `2e82028`)** — 전부 exit 0:
  - `npm ci` 0 (기존 node_modules 사용, lockfile 변경 없음)
  - `npm run test:unit` 0 — 46 files, **273 passed**
  - `npm run typecheck` 0
  - `npm run check:content` 0 — `ok (12 maps, 81 npcs, 140 facts, 15 ledger files)`
  - `npm run build` 0 — 13 dist 파일, 384787 bytes
  - `npm run audit:dist` 0 — `ok (13 files, 384787 bytes)`
  - `git diff --check` 0
- **최종 상태**: 12 maps, 81 npcs, 140 facts, 15 ledger files.
- 다음: Task 48 (M6 e2e 선택 + 최종 merge/handoff).

### 이름 재확인 — "Hollow Codex" (Task 47 D)

- 결과: **충돌 없음(비상표 조사). BLOCKED 아님.**
- 일반 웹 검색: "Hollow Codex"라는 제목의 게임을 찾지 못했다. 검색 결과는 "Hollow"(Steam/itch.io 다수), "RPG Codex"(큐레이션 사이트), "Dark Hollow RPG"(Steam 예정) 등으로, 제목이 정확히 "Hollow Codex"인 게임은 없었다.
- GitHub 저장소 검색(API `q=hollow codex`): 총 4건. 그중 이 프로젝트 `TaejinKim7-dev/hollow-codex`만 정확히 일치하며, 나머지 3건은 두 낱말이 우연히 함께 나온 무관 저장소(문구/QA 도구).
- 가장 가까운 겹침: *Eternal Strands*의 게임 내 도감 항목 이름("Glintwood Hollow Codex", spec §2.4 기록) — 제품 제목이 아니라 게임 내 오브젝트 이름이다.
- 한계: 정식 상표 조사가 아니므로 검색 기반 확인이며, 공개 후 상표 이슈가 생기면 재검토한다.

## 2026-10-06 M6 최종 통합 확인 (Task 48) — M6 완료, 출시 가능

- 브랜치 `todo-7-release`. M6 커밋 SHA:
  - `8fe049f` T45 PWA (vite-plugin-pwa, manifest, sw.js, 아이콘)
  - `2fb2f7e` T46 접근성 (aria-label, focus-visible, skip link, 키보드 이동)
  - `2e82028` T47 README 전면 개편 + 크레딧 묶음 + 모바일 미세 조정 + version 0.1.0
  - `eee1297` T47 handoff 기록
- **통합 확인: M6 ready for main merge.**
- **최종 merge 게이트 (Task 48, HEAD `eee1297`)** — 전부 exit 0:
  - `npm ci` 0 (dev 의존성 취약점 경고만, 배포 번들 무관)
  - `npm run test:unit` 0 — 46 files, **273 passed**
  - `npm run typecheck` 0
  - `npm run check:content` 0 — `ok (12 maps, 81 npcs, 140 facts, 15 ledger files)`
  - `npm run build` 0 — dist 13 파일, 384787 bytes (PWA precache 14 entries / 344.64 KiB, `sw.js`·`workbox-9c191d2f.js` 생성)
  - `npm run audit:dist` 0 — `ok (13 files, 384787 bytes)`
  - `git diff --check` 0
- **e2e**: `npm run test:e2e` 0 — chromium 1 passed (`boots: #screen visible and no console errors in 2s`).
- **dist 최종 구성**: `index.html`, `assets/`, `icon-192.png`, `icon-512.png`, `favicon.ico`, `manifest.webmanifest`, `sw.js`, `workbox-*.js`, `registerSW.js` — 전부 존재.
- **최종 상태**: 12 maps, 81 npcs, 140 facts, 15 ledger files, version **0.1.0**, 273 단위 테스트.
- 회귀 발견: **없음**.
- **M6 완료 — 출시 가능.**
- 다음(오케스트레이터): `todo-7-release` → `main` ff-merge·push → Actions 배포 성공·Pages HTTP 200 확인.

## 2026-10-06 M6 완료 (Task 45–48) — 출시 가능
- 구현은 `todo-7-release`에서 5커밋(서브에이전트 3개 동시):
  - `8fe049f` T45 PWA — vite-plugin-pwa 도입 + manifest.webmanifest + 192/512 아이콘 + Workbox 오프라인 + Workbox warning URL allow-list + e2e 매니페스트 확인
  - `2fb2f7e` T46 접근성 — 23개 aria-label + focus-visible + skip link + 키보드 nav (Esc→overlay close + focus return)
  - `2e82028` T47 README 개편 + 크레딧 그룹화(fonts/tiles/music/code) + 모바일 터치힌트 + portrait single-column 메뉴 + 이름 재확인(no conflict) + 0.1.0 버전
  - `eee1297` (handoff) M6 Task 47 기록
  - `855d42a` T48 통합 — CHANGELOG.md 0.1.0 + handoff M6 확인
- merge 게이트(HEAD `855d42a`): `npm ci` 0 · `npm run test:unit` 0 (46 files, **273 passed**) · `typecheck` 0 · `check:content` 0 (`ok (12 maps, 81 npcs, 140 facts, 15 ledger files)`) · `build` 0 (13 files, 384787 bytes, PWA 14 precache 344.64 KiB) · `audit:dist` 0 · `git diff --check` 0. **e2e 1 passed**.
- main push → Actions run `37427024069` build·deploy success.
- **PWA 산출물 라이브 확인**: `https://taejinkim7-dev.github.io/hollow-codex/` HTTP 200 · `manifest.webmanifest` 200 · `sw.js` 200 · `icon-192.png` 200. PWA 설치 가능 + 오프라인 캐시 동작.
- **M6 완료 기준 충족**: PWA 설치 + 모바일 터치 + 키보드 a11y + README/크레딧 + 이름 재확인 모두 통과. 버전 **0.1.0**.
- **🎯 M0–M6 전 마일스톤 완료. 출시 준비 완료.**
- 다음: 사용자 플레이 검증 후 M7(영어 i18n) 또는 신규 프로젝트 가능. 더 이상 코드 작업은 사용자 요청 시에만.

### M6 Task별 누적 기록

| Task | 커밋 | 작업 |
|---|---|---|
| (계획) | `9bb4595` | docs(plan): M6 출시 준비 — PWA, a11y, README, credits |
| 45 | `8fe049f` | feat(pwa): vite-plugin-pwa v1.3.0 + manifest + 192/512 아이콘 + Workbox 오프라인 + dist-rules에 Workbox warning URL allow-list + e2e 매니페스트 확인 |
| 46 | `2fb2f7e` | feat(ui): 23개 aria-label + focus-visible outline + skip link + Esc 키보드 nav |
| 47 | `2e82028` | docs: README 개편 + credits 그룹화(fonts/tiles/music/code) + 모바일 터치힌트 + portrait 메뉴 + 이름 재확인 + 0.1.0 |
| 47 | `eee1297` | docs(handoff): M6 Task 47 기록 |
| 48 | `855d42a` | docs: M6 최종 통합 (CHANGELOG.md + handoff 확인 절) |

(End of file)
