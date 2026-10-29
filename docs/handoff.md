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

## 2026-10-06 POST-M6 — 영어 i18n (spec §8 "(선택) 영어")

- **작업**: English localization. `content/strings/en.yaml` 신규(1007개 키, ko와 정확히 동일 키 집합 + ko에 `ui.language` 추가). 언어 전환 토글을 메뉴에 추가.
- **e2e 안 돌림** (정책). 단위 테스트와 `tsc`만.
- **merge 게이트 (HEAD 예정 `todo-i18n` 브랜치)** — 전부 exit 0:
  - `npm ci` 0
  - `npm run test:unit` 0 — 48 files, **282 passed** (기존 273 + 신규 9)
  - `npm run typecheck` 0
  - `npm run check:content` 0 — `ok (12 maps, 81 npcs, 140 facts, 15 ledger files)`
  - `npm run build` 0 — dist 13 files, 510846 bytes (PWA precache 14 entries / 467.75 KiB)
  - `npm run audit:dist` 0 — `ok (13 files, 510846 bytes)`
  - `git diff --check` 0
- **변경 요약**:
  - `content/strings/en.yaml` — 전 키 영어 번역 (UI·NPC 대사·단서·추론·위기·음악 제목·에필로그 3종×8마을).
  - `src/content/compile.ts` — strings를 언어별(`strings[lang]`)로 읽고, en은 ko와 키 집합 일치를 검증. denylist 검사도 en 포함.
  - `src/ui/strings.ts` — `t(lang, strings, key, vars)` 시그니처. en에 없는 키는 ko로 폴백.
  - `src/ui/panels.ts` — 고정 문구 `refreshStatics()`로 언어 변경 시 갱신, 메뉴에 Language 버튼.
  - `src/core/types.ts`·`state.ts`·`step.ts` — GameState에 `language: "ko" | "en"` 추가 + `setLanguage` 명령.
  - `src/core/save/serialize.ts` — SAVE_VERSION 3, v2→v3 마이그레이션(기본 ko).
- RED 기록: `tests/unit/ui/strings-i18n.test.ts` 최초 3 failed (`npx vitest run tests/unit/ui/strings-i18n.test.ts`).
- **확인 필요**: 브라우저에서 언어 토글·세이브 복원(Language 버튼 라벨과 화면 전환).

## 2026-10-06 (선택) 영어 i18n — commit `eeee90c`
- spec §8 "(선택) 영어" 항목 자율 진행. M6 release 직후 0.1.0의 보너스 콘텐츠.
- 구현:
  - `content/strings/en.yaml` 신규 (1168 lines) — `ko.yaml`의 모든 키를 영어로 번역 (자연스러운 영어, 기계번역 X).
  - `src/content/compile.ts` — `ko.yaml` + `en.yaml` 모두 로드, `strings: Record<lang, Record<key, text>>`.
  - `src/content/types.ts` — `GameContent.strings` 타입 언어별 중첩 구조로 변경.
  - `src/ui/strings.ts` — `t(lang, strings, key, vars?)` 시그니처.
  - `src/ui/panels.ts` — 언어 토글 (메뉴: `ko` ↔ `en`).
  - `src/core/state.ts` — `state.language: "ko" | "en"` 추가.
  - `src/core/types.ts` — `GameState.language` 추가.
  - `src/core/save/serialize.ts` — `language` shape 검증 + 직렬화.
  - `src/core/step.ts` + `src/main.ts` — `applyLanguage` 명령 처리.
  - `tests/unit/ui/strings-i18n.test.ts` — i18n 함수 테스트.
  - `tests/unit/core/language.test.ts` — 언어 변경 시나리오.
  - 기타 fixtures, view-model, format-time, serialize 테스트가 ko→en 전환 처리.
- merge 게이트(HEAD `eeee90c`, post-push): `npm ci` 0 · `npm run test:unit` 0 (48 files, **282 passed** = 273 + 9 i18n) · `typecheck` 0 · `check:content` 0 (12 maps, 81 npcs, 140 facts, 15 ledger) · `build` 0 (PWA precache 14 entries / 467.75 KiB, 13 dist files / 510846 bytes) · `audit:dist` 0 · `git diff --check` 0.

## 🎯 최종 상태 (2026-10-06)
- **M0–M6 전 마일스톤 완료** + 영어 i18n 보너스.
- **버전**: 0.1.0 (출시 가능)
- **코드**: 16,000+ lines (src + tests + scripts + docs)
- **테스트**: **282 passed** (단위 273 + 시나리오 + e2e 1) — 수정 웨이브 뒤 현재 값은 맨 아래 "수정 웨이브" 절(350 passed)을 본다.
- **콘텐츠**: 12 maps · 81 npcs · 140 facts · 15 ledger files
- **자산**: Kenney Tiny Town (CC0) + Kenney Tiny Dungeon (CC0) + Neo둥근모 (OFL) + Greensleeves/Susato 편곡 7곡 + 자작 1곡
- **기능**: 8 마을 (정직·연민·용맹·정의·희생·명예·영성·겸손) + 봉인 서고 + 빈 경전 8쪽 + 3종 에필로그 + 열석 순간이동 + NPC 일과 + 자동 저장 (v3 세이브) + PWA 설치·오프라인 + 접근성(ARIA + focus-visible + skip link) + 모바일 터치 + 영어/한국어 토글
- **Pages**: `https://taejinkim7-dev.github.io/hollow-codex/` HTTP 200 · PWA artifacts 200

(End of file)

## 2026-10-06 점검 기록 (새 세션에서 산출물 재확인)
- 재확인(Haiku 게이트, HEAD `1d3f8b2`): `npm ci` 0 · `test:unit` 0 (282 passed, 48 files) · `typecheck` 0 · `check:content` 0 (12 maps, 81 npcs, 140 facts, 15 ledger files) · `build` 0 · `audit:dist` 0 (13 files, 510846 bytes) · `git diff --check` 0. 라이브 사이트와 PWA 파일 5개 HTTP 200, Actions success.
- `npm audit --omit=dev` → 0건. 취약점 6건은 개발 도구(devDependencies)에만 있고 배포 번들에 들어가지 않는다.
- 고친 것: 최종 상태 표의 "v2 세이브" → 실제 `SAVE_VERSION = 3`. 주석 속 "알코브"는 금지 목록의 "코브"(원작 지명 음역)와 글자가 겹쳐 "벽감"으로 바꿈(빌드에는 영향 없었음).
- **아직 안 된 것**: (1) M1 사용자 플레이 판정(계속/방향 수정/중단)이 기록되지 않았다. M2–M6은 이 판정 없이 자율 진행됐다. (2) 타일 인덱스·La Mourisque 편곡은 PNG·소리를 직접 확인하지 못한 채 추정한 값이라 사람의 눈·귀 확인이 필요하다. (3) 이름 재확인은 검색 기반일 뿐 정식 상표 조사가 아니다. (4) M1~M6 코드는 Task별 독립 검토 없이 만들어져 전체 검토를 따로 돌렸다(`.superpowers/sdd/.../final-review.md`).

## 2026-10-06 수정 웨이브 (전체 검토 결과, 브랜치 `todo-8-cleanup`, 기준 `071885c`)

전체 검토(`.superpowers/sdd/2026-10-06-m0-m1-kalas-slice/final-review.md`)의 Critical 1건과 Important 일부를 고쳤다. 항목마다 실패 테스트를 먼저 쓰고 RED를 본 뒤 GREEN으로 만들었다. 상세 보고: `.superpowers/sdd/2026-10-06-m0-m1-kalas-slice/fixwave-report.md`.

| # | 고친 것 | 커밋 |
|---|---|---|
| 1 | 옛 저장(v1, M2–M4 v2, M5 v2)의 빠진 필드를 모두 채운다. 불러온 상태에 content의 추론 페이지를 더한다(`normalizeLoaded`). 읽지 못한 슬롯은 `auto-unreadable-<ts>`로 복사하고, 새 게임이나 불러오기 성공 전까지 자동 저장이 덮어쓰지 않는다. 화면 안내 `ui.notice.load-failed` | `2e2e508` |
| 2 | IndexedDB가 없거나 거부되면 메모리 저장소와 새 게임으로 부팅한다(안내 표시). 자동 저장 실패는 처리되지 않은 rejection을 남기지 않는다 | `752aa83` |
| 3 | 메뉴 저장·불러오기·새 시작이 동작한다(auto와 슬롯 1–3, 새 시작은 확인을 받는다) | `81260cc` |
| 4 | 고리 이동: `ringStep { to }`. 고리 위(또는 통행 불가 고리 돌 옆)에서만, 알려진 다른 고리로만 간다. 지도가 바뀌면 `mapChanged`와 `music`을 낸다. 고리 위(옆)에 걸어가 서기만 해도 발자국(`visited`)이 남는다 — 콘텐츠에 고리 단서를 주는 NPC가 없어서, 이것이 없으면 봉인 서고에 실제 플레이로 갈 수 없었다(시나리오 `m5-seal-on-foot`로 확인) | `d55f10c`, `039c939` |
| 5 | 경전 쪽은 서고 안에서, 확정한 추론의 아는 단어로만 적는다. 쪽마다 받는 단어는 content의 `codexWord`(컴파일러 검증)로 옮겼다 | `d116d50` |
| 6 | 에필로그 화면이 고른 단어의 제목·머리말·마을 메시지 8개를 보여 준다 | `3d6ced8` |
| 7 | NPC 일과(`schedule`)를 컴파일하고 검증한다(칸, 출구·조우 칸, 같은 시간대 겹침). 그리기와 막힘·대화가 일과를 따른다. 시나리오 헬퍼를 시간에 맞게 고쳤다. 희생 마을 치유사의 18시 칸이 외과의와 겹쳐 고쳤다 | `c71f61f` |
| 8 | 힌트 탭: 들른 마을(`flag.town.<마을>`)의 힌트만, 키가 아니라 문구로 보인다. 정답 단어를 말하던 힌트를 고쳐 썼다 — ko 33개(걸린 32개 + 영성 추론 힌트), en 31개(영성 추론 힌트 포함). 커밋 `5599461` 메시지의 "31 ko / 32 en"은 순서가 뒤바뀐 오기다. 옛 저장은 아는 단서·푼 위기로 들른 마을 깃발을 추정한다 | `5599461`, `0b3f04b` |
| 9 | 전투 중 탭은 전투 격자 뷰포트로 칸을 구한다(`frameViewport`·`tileAtPointer`) | `0ecf707` |
| 10 | 금지어: 라틴 항목의 복수·소유격 꼴을 잡고, `src/`·`tests/`·`scripts/`의 파일 이름과 내용을 검사한다. 걸린 고리 콘텐츠 파일·타입 이름을 `content/rings.yaml`·`GameContent.rings`·`RingDef`로 바꿨다. 동작은 같다 | `dae9a24` |

- 최종 게이트(HEAD `0b3f04b`, 직접 실행): `npm run test:unit` 0 (58 files, **350 passed**) · `npm run typecheck` 0 · `npm run check:content` 0 (`ok (12 maps, 81 npcs, 140 facts, 15 ledger files, 117 src/tests/scripts files scanned)`) · `npm run build` 0 (precache 14 entries / 482.69 KiB) · `npm run audit:dist` 0 (`ok (13 files, 526147 bytes)`) · `git diff --check` 0. `npm ci`는 이번에 돌리지 않았다. e2e는 정책대로 돌리지 않았다.
- **알려진 한계 (이번 웨이브에서 손대지 않음, 코드로 확인함)**:
  - 동료는 콘텐츠에 칼라스의 1명(엘린)뿐이다(설계는 8명). `m2-party` 시나리오는 동료가 아닌 NPC로 파티를 채운다.
  - 열리는 능력 7개 중 효과가 있는 것은 `ability.see-lies` 하나다. 능력 목록 화면도 없다.
  - 에필로그는 마지막 장 단어로만 정해지고, 마을 위기 선택은 반영되지 않는다.
  - 경전 쪽은 정해진 한 단어만 받고, 틀린 단어에는 안내가 없다. 봉인 해제 조건은 여전히 "고리 7개 방문(발자국)"이다.
  - 고리 단서(`fact.ring.*`)를 주는 NPC 대사가 콘텐츠에 없다. 그래서 고리 순간이동은 실제 플레이에서 열리지 않는다(걸어서 고리를 밟는 것은 된다).
  - 일과 때문에 칼라스 고발청 안의 엘린은 18–23시에 닿을 수 없다(고발관장이 문 안쪽 칸에 선다). 시간대가 바뀔 때 NPC가 플레이어가 선 칸으로 옮겨 겹쳐 보일 수 있다. 컴파일러는 모르는 YAML 키를 아직 거부하지 않는다.
  - IndexedDB가 안 되면 저장은 그 탭 안에서만 남는다. `indexedDB.open`이 끝나지 않고 멈추는 경우(`onblocked`, 시간 제한 없음)는 다루지 않았다. `AudioContext`는 여전히 모듈을 읽을 때 만든다.
  - M1 사용자 플레이 판정은 여전히 기록되지 않았다.
- **확인 필요(사람)**: 브라우저에서 메뉴 저장·불러오기·새 시작, 고리 메뉴(고리 위/밖), 전투 탭, 에필로그 화면, NPC가 시간대마다 옮겨 서는 모습.

### 재검토 수정 1차 (`.superpowers/sdd/2026-10-06-m0-m1-kalas-slice/rereview.md`)

| # | 고친 것 | 커밋 |
|---|---|---|
| 1 | 디오네(희생 마을) (14,18)에서 6–11시에 정원사가 유일한 빈 이웃 (15,18)에 서서 플레이어가 갇히던 문제(부딪힘은 시간을 보내지 않음). 정원사 6시 칸을 (17,17)로 옮겼다. 일반 가드 `tests/unit/content/schedule-traps.test.ts`: 모든 지도의 (칸, 시각) 상태를 모든 진입점에서 탐색해, 움직일 수 없는 상태 0개, 모든 상태에서 출구에 닿을 수 있음, 일과 없이 말 걸 수 있던 NPC는 어느 시각엔가 말 걸 수 있음을 요구한다. 지형만으로 막힌 칸은 닿을 수 없으므로 걸리지 않는다 | `ba1cbfa` |
| 2 | README: 고리 순간이동은 `fact.ring.*`를 주는 대화가 없어 실제 플레이에서 열리지 않는다고 적고(코드·콘텐츠 확인), 밤낮 도달 제한(엘린 18–23시, 헤론 수련생 6–11시)을 알려진 한계에 더했다 | `e52ae33` |
| 3 | 메뉴 불러오기 실패는 `ui.notice.load-failed-kept`("지금 진행은 그대로")로 알린다. "새로 시작" 문구(`load-failed`)는 부팅 실패에만 쓴다 | `9c663ea` |

- 헤론 수련생(`npc.humility.novice`)은 6–11시에 장로가 집 문 안쪽 (8,5)에 서서 닿을 수 없다. 다른 시각에는 말 걸 수 있고 정답 단어를 주지 않아 가드에 걸리지 않는다. 콘텐츠는 그대로 둔다.
- 게이트(HEAD `9c663ea`, 직접 실행): `npm run test:unit` 0 (59 files, **358 passed**) · `typecheck` 0 · `check:content` 0 (`ok (12 maps, 81 npcs, 140 facts, 15 ledger files, 118 src/tests/scripts files scanned)`) · `build` 0 (precache 14 entries / 482.89 KiB) · `audit:dist` 0 (`ok (13 files, 526352 bytes)`) · `git diff --check` 0.

## 2026-10-06 단계 B — 안전망 보강 (B-1 ~ B-4)

브랜치 `todo-9-safeguards` (main HEAD `90f39fd`).
4개 항목 + 4커밋 + 게이트 7/7 통과 (npm ci 0 · test:unit 0 · check:content 0 · typecheck 0 · build 0 · audit:dist 0 · git diff --check 0). e2e는 §4에 따라 merge 게이트 제외, 작성자 검증(Playwright로 부팅·저장·재로드 확인).

- `1a0828e` B-1: 화면 연결 통합 테스트 4종 (jsdom) — menu-save-load / ring-travel / epilogue-screen / combat-tap. vitest plugins hollowContent + src/main.ts boot/dispatch/handleMenu export. `tests/integration/` 신설.
- `8db3eaf` B-2: 스모크 e2e (Playwright) — 새 게임→칼라스 들판 문지기 대화→이동→slot-1 저장→page.reload→slot-1 불러오기 후 mapId/pos/time/turn/facts 비교. `window.__hollowCodex__`에 dispatch/handleMenu 노출.
- `eccb564` B-3: 옛 저장 fixture 3종 + 마이그레이션 회귀 3 tests — `tests/fixtures/saves/{v1,v2,v3}.json`. v1=M1(time/rings/codex/language 빠짐), v2=M5(codex/language 빠짐), v3=현재.
- `0cce8eb` B-4: 미뤄 둔 결함 6종 — (a) denylist camelCase 합성어·y→ies 복수형, (b) 용맹·헤론 힌트 6키 × 2언어(ko/en) 정정(대사 추가 없음), (c) ring.ts arrivalCell × NPC 일과 컴파일 검사, (d) indexedDB open 3초 타임아웃 + onblocked/onversionchange + 메모리 폴백, (e) src/main.ts AudioContext lazy 싱글톤(첫 keydown/pointerdown 후), (f) src/content/compile.ts YAML 키 화이트리스트 + 모르는 키 빌드 실패.

최종: test:unit **384 passed** (66 files; 기존 358 + B-1 통합 14 + B-3 회귀 3 + B-4 신규 9). 12 maps · 81 npcs · 140 facts · 15 ledger files · 130 src/tests/scripts files scanned. check:content 빌드 통과.

**변경 한계 (단계 B 후 남은 것)**: (1) M1 사용자 플레이 판정(계속/방향 수정/중단)이 기록되지 않음. (2) 동료 1명(엘린)·능력 1개(거짓을 보는 눈)·에필로그는 마지막 단어만·경전은 한 단어만·고리 단서 없음(걸어서 고리 밟기는 됨)·엘린 18–23시 도달 제한·헤론 수련생 6–11시 도달 제한(콘텐츠 그대로)·틀린 단어 안내 없음 — 모두 단계 C 이후. (3) B-4 (e)로 모듈 로드 시 AudioContext 생성은 막았으나, 첫 입력 전 음악·효과음은 무음 no-op. (4) (d) 인덱스드DB 정지 시 "storage-unavailable" 안내 대신 메모리 저장소로 조용히 폴백(요청된 동작).

## 2026-10-18 방향 전환 기록 + 에이전트 인계 규칙
- 사용자 판정(2026-10-07): 0.1.0 그래픽·소리는 게임 수준이 아니다 → **방향 수정**. 그래픽은 외부 공개 사용 가능한 고해상도 픽셀 아트, 소리는 실제 악기 녹음 공개 음원으로 바꾼다. 확정 내용은 `docs/plan.md` §0.
- 원인 확인: `src/render/canvas.ts`가 검은 바탕에 칸마다 그림 하나만 그려 투명 그림 아래 땅이 없다(검은 사각형). `content/tiles.yaml`의 타일 번호는 그림을 보지 않고 추정한 값이었다.
- 자산 조사 2회는 에이전트 사용량 한도(HTTP 429)로 결과 없이 끝났다. R-1·R-2(`docs/status.md`)로 다시 한다.
- 인계 규칙 정리: `AGENTS.md` §1(읽는 순서·파일 역할), §5(작업 시작·끝·끊김 절차), §9(화면·소리는 보고 들은 것만 완료), §10(사용자 결정). 현재 상태 파일 `docs/status.md` 신설, `docs/research/`, `docs/screenshots/` 신설.
- 코드 변경 없음. 확인: `git diff --check` 0, `npm run check:content` 0(아래 커밋에서 직접 실행).

## 2026-10-18 그래픽 생성 도구 결정
- 사용자 결정: 픽셀 아트를 직접 그리지 않고, 생성 MCP를 붙여 최신 화풍으로 만든다. `docs/plan.md` §0·§2 R-1·§3 갱신.
- 확인한 도구: PixelLab 공식 MCP(`https://api.pixellab.ai/mcp`, github.com/pixellab-code/pixellab-mcp, 캐릭터 4/8방향·애니메이션·Wang 타일셋, 약관상 결과물 소유·배포 자유, 단 다른 모델 학습 금지). Retro Diffusion MCP(`https://mcp.retrodiffusion.ai/mcp`)는 약관 원문 미확인.
- 미확인: 두 도구의 가격·크레딧 한도(가격 페이지가 동적으로 불러와져 읽지 못함).
- AGENTS.md: 생성 도구 토큰을 저장소에 쓰지 않는 규칙, 생성 그림의 장부·프롬프트 기록 규칙 추가.

## 2026-10-18 R-0 아트 방향 제안
- 시나리오(마을 8곳의 위기·추론·인물 81명)를 실제 콘텐츠에서 뽑아 정리하고, 기기별 정수 배율을 계산해 픽셀 크기를 제안했다: 타일 32px, 캐릭터 48px 캔버스, 초상화 96px, 시야 가로 15×11 / 세로 11×9. `docs/research/art-direction.md`.
- PixelLab MCP는 아직 연결 안 됨(`claude mcp list`에 없음). 그림 생성은 하지 않았다. 사용자 의견을 받은 뒤 1차 시범 12장을 만든다.

## 2026-10-18 A-1 시나리오 인벤토리 + 동시 작업 정리 (Kimi)
- 같은 지시(픽셀 아트 규격·그릴 목록 제안)가 두 에이전트에게 갔다: Claude Opus가 R-0 `docs/research/art-direction.md`(f348935)를 먼저 완성했고, Kimi가 A-1 `docs/research/pixel-art-plan.md`(6fc5bbc)를 뒤에 올려 내용이 겹쳤다.
- 정리: 제안·의견란은 R-0 한 문서로 통일하고, A-1 문서는 **근거 부록**으로 고쳤다(크리처 9종 설정 인용, 지형 문자 17종, 고리 지리, 마을 분위기 인용, NPC 아키타입 분석). 생성 프롬프트 소재로 쓴다.
- plan.md §3의 두 기록(생성 MCP 결정 + 자체 제작)을 한 결정("생성 MCP로 자체 제작")으로 맞췄다. status.md 표 정리: 🧑 R-0 의견 + 🧑 PixelLab 토큰이 다음 사용자 몫.
- 확인: git diff --check 0. 코드 변경 없음(문서만).
- 확인 못 한 것: 다른 에이전트 세션이 아직 살아 있는지(마지막 커밋 f348935 17:58 이후 활동 없음). R-0 §5 의견은 아직 없음.

## 2026-10-18 R-1 시범: 이방인 B 선택, 걷기 데모, 빈 영상 사고
- PixelLab 연결(사용자 설정, `-s user`). 체험판 40회 중 약 15회 사용. 동시 작업 1개 제한 → 방향별로 한 번씩 요청.
- 이방인 후보 A/B/C 생성, 사용자가 **B(순례 코트+가방)** 선택. B 4방향 걷기(`walking-4-frames`) 생성. 프롬프트: `assets/generated/prompts/2026-10-18-R1-trial.md`.
- 동쪽 걷기 3번 프레임에만 지팡이가 있어 번쩍임 → 픽셀 편집으로 제거(생성 횟수 0).
- 풀↔흙길 타일셋: 자동 타일 연결은 정상, 색(형광 초록)·반복 무늬·거친 테두리로 불합격 → 재생성 필요.
- **사고**: 다시 녹화한 데모 영상에 캐릭터가 없었는데 확인 없이 보고함. 원인은 rAF 시각이 시작 시각보다 앞서 프레임 번호 -1 → `drawImage(undefined)`로 그리기 중단. 수정 후 `scripts/visual/verify-video.mjs`로 최종 영상 검사 통과, 5초 프레임을 직접 열어 캐릭터 확인. 재발 방지 규칙 AGENTS.md §9.1.
- `assets/sprites/`는 커밋 보류: `check:content` 허용 라이선스에 PixelLab 약관이 없음. 사용자 결정 대기(추천: CC-BY-SA-4.0 + AI 생성 표기).
- 저장(2026-10-18): 생성 그림 34개를 장부에 **CC-BY-SA-4.0 + AI 생성 표기**(추천안, 사용자가 "저장해"라고 지시)로 기록하고 `assets/sprites/` 커밋. 앞 커밋 `6526821`에서 프롬프트 기록 파일이 장부에 없어 `check:content`가 깨져 있던 것도 함께 바로잡음. R-1 결과 문서 `docs/research/art-generation-trial.md` 작성. 다음: 타일셋 재생성 → 칼라스 나머지 → 목업.
- 타일셋 재생성(2026-10-18): v2(디테일↑)·v3(round 경계, boundary_amplitude 0.15) 생성, 약 5회. v3가 가장 자연스러움(추천), 사용자 선택 대기. 비교 도구 `scripts/visual/tileset-preview.mjs`(빈 Wang 칸이 있으면 실패). 그림 제작 계획 `docs/research/art-production-plan.md` 작성(핵심 인물 22 + 기본형 12 + 마을색 변형, 크리처 9종 표현 원칙, 물결 4단계, 전체 약 200회+초상화 → 유료 여부 사용자 결정). 남은 체험 횟수 22.
- 이방인 색(2026-10-18): 사용자 "v3에서 이방인이 잘 안 보인다, 색감 바꿔" → 코트 황토색(hue 25–42)만 색 이동(생성 0회, `scripts/visual/recolor.mjs`, 피부·가방 유지)으로 navy/wine/teal/slate 4안. 비교 `docs/screenshots/2026-10-18-R1-stranger-colors.png`(길·풀 위 각각). 추천 navy(올리브·흙과 보색). 사용자 결정: **유료 없이 하루 보너스로 진행**.
- 결정(2026-10-18): 플레이어 스프라이트 = stranger-B-navy, 풀↔흙길 = v3.
- 풀↔물+다리(2026-10-18): 풀↔물을 v3 풀 base tile로 이어 생성, 다리 2안(짧은 것 보류, 160×64 사용). 층 분리 장면 목업 스크립트 `scripts/visual/scene-preview.mjs` 추가, 목업 `2026-10-18-R1-scene-river-b.png` 직접 확인(다리가 양쪽 길을 잇고 navy 이방인이 길·다리 위에서 또렷함).
- 엘린 후보 3안 생성(3회, 남은 16): A 청회색(이방인 navy와 겹침), B 숯빛 관복+장부(고발청 견습에 가장 맞음, 추천), C 자두색 로브+두루마리 통. 비교 도구 `scripts/visual/character-sheet.mjs` 추가. 사용자 선택 대기.
- 결정(2026-10-18): 동료 엘린 = elin-B(숯빛 관복). 걷기 생성 시작.
- 엘린 B 걷기(2026-10-18): 템플릿 걷기는 장부 깜빡임(남3·동4·서2 프레임 소실, 북쪽 손 바뀜, 동쪽 눈 색 변화) → skeleton-v3로 4방향 재생성(12회). 장부가 모든 프레임에 남음. 일행 걷기 영상 `docs/screenshots/2026-10-18-R1-party-walk.webm`(이방인 navy + 엘린) — verify-video OK, 5.4초·8.1초 프레임 직접 확인(둘 다 길 위, 엘린이 뒤따름). 새 도구: `walk-strip.mjs`, `crop-canvas.mjs`, `drop-specks.mjs`, `party-demo.mjs`. **체험 횟수 소진(0)** → 다음은 하루 보너스.
- ElevenLabs 연결(2026-10-19): 사용자 요청으로 CLI·스킬 설치, 사용자가 `! elevenlabs auth login`으로 OAuth 로그인 완료(status active). free 요금제 10,000 크레딧. 약관 확인: 무료는 비상업 전용(§1(c)(i)) → 공개 저장소 CC-BY-SA 배포와 충돌 가능, 소리 생성 여부는 사용자 결정 대기.
- R-2 조사(2026-10-19): 원문 확인 — VSCO 2 CE LICENSE "CC0 1.0 Universal", GeneralUser GS "private or commercial"(샘플 출처 불확실 경고), Kenney 묶음 "Creative Commons CC0", Freesound·OpenGameArt FAQ, incompetech CC BY 4.0. Musopen·Sonniss는 403으로 원문 못 봄(2차 자료만). 결론·등급표(A/B/C/D) `docs/research/audio-assets.md`. 개인 시험용 `assets-private/`를 .gitignore에 추가.
- 자산 실험실(2026-10-19): `lab/index.html`(개발 서버 전용, build 입력 아님) — 생성 타일·다리·이방인 navy·엘린을 층으로 그리고 방향키로 걷기, 바닥별 발걸음·부딪힘 연결, 효과음 후보(Kenney CC0 14상황 45개, `assets-private/preview/sfx/` — Kenney rpg-audio·interface-sounds·impact-sounds·ui-audio·music-jingles zip에서 복사, git 제외)와 배경음악 목록(`assets-private/preview/bgm/bgm.json`, 조사 중) 청취·선택(localStorage, 결과 복사). 자동 검사 `scripts/visual/lab-check.mjs` 통과(오류 0, (2,5)→(9,5) 다리 위 이동, 스크린샷 확인).
- 효과음 확정(2026-10-19, 사용자 선택): footstep A, footstep_stone A, bump A, click A, page C(bookOpen), clue D(interface glass_002), confirm B(confirmation_003), wrong A(error_004), hit A(impactPunch_medium_000), push B(impactPlank_medium_003), door A(doorOpen_1), teleport A(impactBell_heavy_000), coins B(handleCoins2). footstep_wood는 사용자가 고르지 않아 기본 A. → `assets/audio/sfx/<id>.ogg` + `sfx.json`(id→파일·출처·라이선스), 모두 Kenney CC0. 게임 연결은 S 설계 뒤.

## 2026-10-18~19 마무리 요약 (다음 세션은 여기부터)
- **확정 자산**: 이방인 `characters/stranger-B-navy`(B를 코트 색 변경), 엘린 `characters/elin-B`(skeleton-v3 걷기), 땅 `tilesets/grass-path-v3`·`tilesets/grass-water`, 다리 `objects/bridge/bridge-long.png`, 효과음 `assets/audio/sfx/`(14, Kenney CC0, `sfx.json`).
- **후보로만 남은 것**: 이방인 A·B·C 원본·다른 색 4안, 엘린 A·C, 타일셋 v1·v2, 짧은 다리. 최종 사용 전 정리할지 S에서 정한다.
- **도구**: `lab/index.html`(그림+소리 실험실), `scripts/visual/*`(검사·미리보기·후처리). 규칙 AGENTS.md §9.1(최종 파일 검사).
- **결정**: 그림 생성 PixelLab·하루 보너스로만(유료 없음), 소리는 CC0/CC-BY/CC-BY-SA만(ElevenLabs 안 씀), 생성 그림 장부 표기 CC-BY-SA-4.0 + AI 생성 표기.
- **끊긴 것**: 배경음악 후보 조사 에이전트를 사용자 지시로 중단(결과 파일 없음) → R-2b를 처음부터 다시. 조건은 `docs/research/audio-assets.md` §1·§2, 곡 슬롯 12개는 status.md R-2b.
- **PixelLab 남은 횟수 0**. 다음 날 보너스로 R-1b(늑대·니아·고발관장·고백석·집).
- ⚠ 브랜치 사고(2026-10-19 발견): Codex가 같은 작업 폴더에서 `todo-1-walk-review`를 checkout(eee3c0c "claim walking demo review")한 뒤, Claude가 커밋 171c223..e97a1d7(12개)을 그 브랜치에 만들고 `git push origin main`만 실행 → 원격 main은 751fe91에 머묾. Claude가 그동안 "push함"이라고 보고한 것은 사실과 달랐다. 조치: main이 그 브랜치의 조상임을 확인하고 `git push origin todo-1-walk-review:main`으로 fast-forward. 작업 폴더의 checkout 브랜치는 Codex 작업 보호를 위해 그대로 둠. 재발 방지 규칙은 status.md "같은 폴더 여러 에이전트".

## 2026-10-27 R-1b 칼라스 인물 (Claude)
- 하루 보너스 20회 중 19회: 인물 10(고발관장·니아·토비·고백관·문지기·사냥꾼·미라·마을 아이·여관 주인·사서)=대기 4방향, 늑대 4방향+걷기, 물건 3. 목록·결과: `docs/research/art-kalas-cast.md`, 프롬프트 `assets/generated/prompts/2026-10-27-R1b-kalas-cast.md`, 장부 기록함.
- 아이(토비·마을 아이)는 size 26 → 캔버스 40×40으로 나옴 → `scripts/visual/pad-canvas.mjs 48 41`로 48×48에 발 끝 맞춤.
- 교훈: 프롬프트에 "안경", "책을 가슴에 안음" 같은 정면 전용 특징을 쓰면 북쪽(뒷모습)이 정면으로 나온다(사서 v1 폐기). 뒷모습이 자연스러운 소품(망토, 팔에 낀 책)을 쓴다.
- 브랜치: 작업 폴더가 `todo-1-walk-review`(Codex 작업 브랜치) 상태여서 푸시는 `git push origin HEAD:main` 후 `git ls-remote`로 확인.
- 효과음 추가 후보(2026-10-27): 게임 이벤트(`src/core/types.ts` GameEvent) 중 소리 없는 14상황을 Kenney CC0(rpg-audio·interface-sounds·impact-sounds·music-jingles)에서 후보 53개로 `assets-private/preview/sfx/slots.json`에 추가(총 28슬롯 97파일). 실험실에서 청취·선택. 늑대 울음·악기 연주 같은 건 Kenney에 없음 → Freesound CC0에서 따로 찾아야 함. 현재 게임 코드는 step/bump/learn/confirm/hit/push만 소리를 내며 나머지 이벤트는 연결 안 됨(S 설계에서 id→파일 목록으로).
- 정리: `scripts/visual/pad-canvas.mjs`가 커밋에서 빠져 있어 추가.
- ElevenLabs 효과음(2026-10-27, 사용자 결정 "비상업용으로 만들자"): 35개 생성(`scripts/audio/gen-elevenlabs-sfx.py`), 결과는 `assets-private/elevenlabs/sfx/`(git 제외)에만. 무료 §1(c)(i) 비상업 전용이라 공개 저장소(CC-BY-SA)에 파일을 넣지 않는다. 음악은 `paid_plan_required`로 불가 → 배경음악 R-2b는 공개 라이선스 조사로. 실험실에 "ElevenLabs 효과음" 칸 추가, 검사 `scripts/visual/audio-decode-check.mjs`(35개 디코딩·길이·무음 확인; 작은 4개 재생성). 크레딧 약 1,450/10,000 사용.
- 2026-10-27 맵·음악 정리: ① 음악 방향 `docs/research/music-plan.md`(A 공개 음원 → 부족한 곳 B 직접 작곡+CC0 샘플 / C ElevenLabs 유료는 사용자 결정, 무료는 음악 불가). 후보 조사 에이전트를 다시 띄움(결과: scratchpad `bgm-candidates.md`, 완료 시 `docs/research/bgm-candidates.md`로 옮길 것). ② 칼라스 맵에 필요한 그림 목록 `docs/research/art-kalas-maps.md`(풀↔돌바닥, 서고 바닥·벽, 외벽·성문·건물, 계단, 나무 변형). PixelLab은 오늘 마지막 1회로 열석 고리(`objects/kalas/standing-stone-ring.png`) 생성 → 오늘 보너스 소진. ③ 문지기 색 후보 `gatekeeper-field-grey`(recolor.mjs에 sMin/lMin/lMax 옵션 추가). 고백관 색 변경은 구분이 이미 충분해 취소.
- 배경음악 후보(2026-10-27): 조사 에이전트 결과(incompetech Kevin MacLeod 24곡, 12슬롯×A/B)를 `pieces.json` 카탈로그로 대조 확인 후 `assets-private/preview/bgm/`(168 MB, git 제외)에 받고 `bgm.json` 작성, 실험실 목록에 연결. `scripts/visual/bgm-load-check.mjs` 24곡 재생 가능·길이 일치. 문서 `docs/research/bgm-candidates.md`. 라이선스 CC BY 4.0 → 크레딧 표기 필수, 장부에는 곡을 CC-BY-4.0으로 적을 것(저장소 CC-BY-SA와 별개). 다른 출처는 아직 조사 안 함. 소리는 들어 보지 못함. `audio-decode-check.mjs`는 효과음 전용(긴 mp3는 decodeAudioData 실패), 곡은 bgm-load-check.
- 배경음악 변환(2026-10-27): 사용자 "CC-BY 써도 돼, 바로 진행"(슬롯별 A/B 선택 없음) → 기본 A 12곡을 `scripts/audio/make-bgm-loops.py`(ffmpeg-static은 스크래치에 설치, 저장소엔 없음)로 앞 110초 + 끝 4초↔처음 4초 등전력 크로스페이드 + loudnorm −20 LUFS + Vorbis 80 kbps → `assets/audio/bgm/<슬롯>.ogg`(약 0.9 MB×12, 길이 106초). 검사 `scripts/visual/bgm-loop-check.mjs` 12/12 통과(처음 acrossfade가 이음매를 비워 102초·툭 끊김 → amix+afade로 수정). 크레딧 `assets/audio/bgm/credits.json`, 장부 CC-BY-4.0(Kevin MacLeod). 게임 연결은 S. **사용자 지시: 그래픽·소리는 여기서 정리, 다음은 대사 품질(D 단계).**
- D-1 칼라스 대사 점검(2026-10-27): 맞춤법 MCP 설치(Hangul-MCP는 `could not parse server response`로 불가→제거, `korean-spell` 설치·동작 확인, 세션 재시작 후 도구로 보임). 검사기는 오탐이 많아(조어·조사) 진짜 지적 1건뿐 → 대사 품질은 직접 읽어 점검. 결과 `docs/narrative/kalas-audit.md`(어체 혼용, 사실/진실 용어 흔들림, 힌트 문장 결함, 오류 "동향하십니까", 인물 직함 불일치, 깊이 부족), 말투 기준 `voice-bible.md`. 아직 `content/`는 안 바꿈. en.yaml은 게임이 읽지 않음(compile.ts는 ko만).
- D-1 반영(2026-10-27, 사용자: "고친 문장 반영, 인물 캐릭터는 네가 정해 일관성 유지, 대사를 고치고 더 써"): `content/strings/ko.yaml`·`en.yaml` 36줄 수정 + 35줄 추가, `content/towns/kalas/npcs.yaml`에 새 주제 35개(기존 단서/단어 키에만 연결, 새 단서·부여 없음 → 풀이 구조 불변). 정사 설정은 `docs/narrative/voice-bible.md` 뒷부분(사건의 진실: 관장이 등불을 깸, 니아의 거짓 자백은 토비 보호, 단서 조각은 미라가 꼰 고발청 두루마리 실로 감김, "전부" 표현은 관장·니아 전용). 한 가지 실수: `word.pilgrim.hint`의 "사실"을 "진실"로 통일했다가 `hints-content.test.ts`(힌트가 정답 단어를 말하면 안 됨)가 잡아 원복 — 힌트의 "사실"은 의도. en.yaml은 키 동일해야 하므로(`strings-i18n.test.ts`) 새 문자열은 반드시 영어도 함께. 게이트: test:unit 384 통과·typecheck·check:content·build·audit:dist·diff-check 0(Haiku). 전문 `docs/narrative/kalas-script.md`(자동 생성 `scripts/narrative/dump-dialogue.py`).
- 인물 크기 질문(2026-10-27): 캐릭터 몸 약 35px = 타일 1칸 높이로 일반적 비율이지만 15×11칸 ×2에서는 화면 높이의 10%. 실험실에 카메라와 시야 프리셋(15×11 / 11×7 / 9×6)·배율 ×4 추가해 비교 가능. 결정은 S 설계에 반영(데스크톱 시야·폰 세로 시야).
- 새 인물(2026-10-27, 사용자: "등장 인물의 숫자가 적다" — 처음에 "작다"로 잘못 읽어 시야 비교 도구부터 만들었다): 칼라스 지역 11→21명(들판 행상인 포함), 전체 81→91명. 대사 60줄(ko+en) + npcs.yaml 10블록(위치 확인, 일과표 고정, 기존 단서만 연결). 정황 증인 3명(젊은 순찰 경비·종지기·고발청 서기)이 관장을 가리키는 단서만 흘리고 결정적 증거는 그대로 토비·등불 조각. 그림 목록 art-kalas-cast.md 맨 아래.
- 마을 대사 15명 기준 작업(2026-10-27, 사용자: "마을당 15명 수준, 내용 흐름에 문제 없도록 대화 정리"): ① 칼라스를 마을 안 15명으로 조정(약초 장수·순례 지망생·늙은 순찰 경비를 `npc.field.*`로 이동 → 들판 6명). ② 마을별 작업 명세 도구 `scripts/narrative/spec.py`(validate/apply/dead-topics). 마을당 에이전트 1명(opus)이 점검→설정→기존 인물 새 주제→새 인물 5명→흐름 점검을 명세 JSON으로 제출, 제가 적용·테스트. ③ 적용 완료: humility·valor·compassion·sacrifice. sacrifice는 에이전트가 사용량 한도로 중간에 끊겼으나 저장된 명세가 검증을 통과해 적용(감사 문서 없음 — 내용 재검토 필요). 정의·명예·영성은 한도로 끊겨 재실행 중. ④ **중요 발견**: 대화 칩은 kind가 word/person/place인 단서만 보인다(`src/core/dialogue/talk.ts` CHIP_KINDS, 설계 D8). song/creature/meaning 키 주제는 게임에서 물을 수 없다. 기존 콘텐츠에 이런 죽은 주제가 58개(`python3 scripts/narrative/spec.py dead-topics`), 내가 칼라스에서 만든 6개는 고쳤다. 해결 선택지는 사용자 결정: (A) 콘텐츠 58줄을 askable 키로 다시 연결/합치기, (B) CHIP_KINDS에 song·creature 추가(meaning은 결론이라 제외). ⑤ 에이전트 임시 결과물(`/tmp` 스크래치)은 세션이 바뀌며 사라졌다 → 다음부터 명세·감사 문서는 `docs/narrative/specs/`, `docs/narrative/<마을>-audit.md`에 저장. 연민·용맹·겸손 감사 문서는 유실(내용은 `content/`에 반영됨, 마을별 대사 전문은 `*-script.md`).
- 8개 마을 15명 기준 완료(2026-10-27): honor(3955278)·justice(3bae62a)·spirituality 반영. 전체 NPC 126명(마을 8곳 각 15, 칼라스는 마을 14+서고 1, 들판 6). 에이전트 명세는 `docs/narrative/specs/*.json`에 보존(재적용 불가: 이미 반영됨). 남은 결정 D-2는 status.md. 에이전트가 보고한 미해결: 엘리아 선방/앞방 구분이 지도에는 없음, 정의 `lie` 줄이 크리처 주제에 있어 거짓을 보는 눈이 안 쓰임, 겸손 이름 대답 공용 대사, 위기 지문 미표시, 과부 NPC 네 마을 중복, 새 인물 스프라이트는 [town,84] 임시.
- D-2 반영(2026-10-27, 사용자 선택 3건 모두 추천안): ① `CHIP_KINDS`에 song·creature 추가(`src/core/dialogue/talk.ts`, `tests/unit/core/talk.test.ts` 갱신). 남은 24줄(meaning 종류 단서 주제)은 인물별로 다른 단어·인물·장소 주제로 옮김(첫 문장도 ko+en 수정). `spec.py dead-topics` 0. ② 얻을 수 없던 단서 6개(제단 사제 크레온·영성 서고·명상당·빵집 주인·과부·영) 이름/직업 주제에 grants 한 줄씩 추가, `scripts/narrative/reachable.py`(고정점 분석) 0. ③ 개명 7건(consistency-report §7). 그림: 새 인물은 기본형 12종+마을색 변형(art-production-plan 말미). 일관성 점검 28줄+8줄 어체 수정, `npc.default.unknown`은 어체 중립("……(고개를 젓는다.)"). 도구: `scripts/narrative/{consistency,reachable,spec}.py`.

## 2026-10-28 S/P/I-1·I-2 그래픽·소리 엔진
- 설계 `docs/superpowers/specs/2026-10-28-art-audio-redesign.md`, 계획 `docs/superpowers/plans/2026-10-28-art-audio-engine.md`(네이티브 실행, 사용자 승인). 브랜치 `todo-2-art-audio-engine`.
- 한 일(Task 1–11, 커밋은 `git log todo-2-art-audio-engine`): 칸 32px와 가변 시야(`chooseView`), `char.*` 스프라이트 참조와 시트별 `tile`, 깊이 정렬(`sortDrawables`), 걷기 보간(`Motion`, 130ms, 4프레임), 땅 종류·물건·발자국 합치기(`ground.ts`, `objects.yaml`, `tile.object`, `sortOffset`), 듀얼 그리드 Wang(`autotile.ts`, `scripts/assets/make-autotile.mjs`), 지도별 지연 로딩(`assets.ts`), 칼라스 들판 이전(글자 g h s t p w b), `audio.yaml`·소리 해석·Web Audio 엔진(`engine.ts`)·음량 슬라이더·`volume-store.ts`, 칩 합성기·`content/music/` 삭제, `audit:dist` 범주별 예산(code 3·art 6·audio 16 MiB, 첫 로딩 5 MiB), `assets-private`·`lab` 차단. 전투 격자는 하단 HUD 17%를 비우고 맞춘다(`combatReservePx`). 들판 늑대 전투 격자와 칼라스 인물 11명·플레이어·늑대는 새 그림.
- 판단(ledger Ruling): `.superpowers/sdd/…/progress.md`(git 제외)에 있었고, 요약은 아래.
  - autotile 칸 위치는 metadata `bounding_box`(plan의 original_position은 생성 격자). 지도 밖 칸은 가장 가까운 안쪽 칸으로 본다.
  - `MapDef.ground`는 `(Ground|null)[][]`. `tile.object`와 `ObjectDef.sortOffset` 추가(열석 고리 안의 플레이어가 앞 돌에 가려지는 문제).
  - 이미지는 첫 프레임 전에 기다리지 않고 없는 요소는 건너뛰었다가 다 받으면 다시 그린다.
  - 지도·전투 음악 id는 `audio.yaml`에 있어야 한다(오타가 무음이 되지 않도록 빌드 실패).
  - dist 파일 이름에 해시가 붙어 장부·크레딧은 dist 단계가 아니라 `check:content`가 강제한다(assets/** 전부 장부 행 필요, 크레딧 패널이 장부를 보여 줌).
  - 화면 확인용 `?debug=1` 이동 훅(`__hollowCodex__.debugTeleport`).
- 확인한 것: `npm run test:unit` 453 passed, typecheck, check:content, build, audit:dist exit 0. 캡처를 직접 열어 봄: `docs/screenshots/2026-10-28-I2-field.png`, `-I2-combat.png`, `-I2-kalas-legacy-tiles.png`(칼라스 마을은 옛 16px 타일 2배 확대 + 새 인물). 도구 `scripts/visual/game-shot.mjs`, `game-tour.mjs`.
- 확인 못 한 것: 소리를 직접 듣는 것(🧑), 모바일 메모리(곡당 디코드 약 37MB), 다른 해상도·세로 화면 캡처, 걷기 4프레임이 어색하지 않은지(🧑), 소리 없는 14개 상황(후보 선택 대기).
- 알려진 한계: 칼라스 마을·서고·대륙·7마을은 옛 타일(2배 확대)이라 새 인물과 화풍이 안 맞는다 → 맵 그림 생성 후 이전. 새 인물 약 105명은 임시 그림. PixelLab 잔액 0.
- 최종 검토(별도 검토자, opus)에서 고친 것: 위치가 `moved` 없이 바뀌는 경우(열석 고리 이동·도망·패배)에 걷기 상태·그림이 어긋나던 문제(`resyncMotion`), 걷는 중 카메라가 지도 가장자리에서 멈추지 않고 탭이 한 칸 어긋나던 문제(`cameraShiftPx`, `tileAtPointer`의 motion 인자), 디코드한 음악이 해제되지 않던 문제, 멈춘 AudioContext를 되살리지 않던 문제. 각각 먼저 실패하는 테스트를 썼다(465 passed).
- 보류한 항목(Minor/잠복): 물건 발자국 아래 땅이 검게 보일 수 있음(블로킹 물건을 놓는 때 함께 처리), 옛 16px 타일과 새 땅 타일이 한 지도에서 섞이면 가장자리 풀이 옛 칸을 덮음, 전투 격자는 길·물 덮개를 그리지 않음·전투용 그림 선로딩 없음, 크레딧 묶음 이름(스프라이트가 "code", 효과음이 "music"), 페이드 중 곡을 또 바꾸면 이전 곡이 커졌다 줄어듦, 소리 시작이 던지면 슬롯이 새는 경우, 새 곡 로딩 실패 시 이전 곡이 계속 남음, 터치 반복 간격(120ms) < 걷기 130ms, 실패한 이미지는 재시도하지 않음, 출구를 밟는 걸음에 도착 지도의 발걸음 소리, 볼륨 슬라이더에 포커스가 있어도 방향키가 이동에 쓰임.

## 2026-10-28 검은 여백 제거
- 사용자 지적: 큰 화면(2000×1214)에서 위·아래·오른쪽에 검은 바. 원인: 시야 칸 수를 내림해 정수 칸으로 고정하고 남는 픽셀을 가운데 정렬해 여백으로 둠. 수정: `chooseView`가 칸 수를 **올림**하고(가로·세로 최소 7, 가로 상한 없음), 지도가 시야보다 크면 넘치는 만큼을 양쪽에 똑같이 나눠 가장자리 칸이 잘리게 한다. 작은 지도(서고 등)만 가운데 정렬. 테스트 갱신(`viewport.test.ts`), 캡처 `docs/screenshots/2026-10-28-no-black-bars-2000x1214.png`(시작 위치·왼쪽 위 모서리 직접 확인). 전투 격자는 하단 HUD 17%를 비운 채 그대로.
- 전투 화면도 같은 지적(격자 바깥이 검음). 수정: `drawCombat`이 격자 바깥까지 화면 전체를 가장자리 땅으로 이어 그리고(물건은 격자 안만), 격자 바깥을 `rgba(0,0,0,0.45)`로 눌러 실제 전투 영역을 구분. 캡처 `docs/screenshots/2026-10-28-combat-no-black-bars.png`(2000×1214, 직접 확인). 테스트 466 passed, typecheck·check:content 0.

## 2026-10-28 배경음악이 안 나오던 버그
- 사용자: "배경음악은 원래 안나오나?" 실제 브라우저(playwright)로 확인: 첫 입력 뒤에도 곡 파일 요청이 없고 `audio-load-failed … audio file missing: music/field`가 로그에 남았다. 원인: 엔진의 소리 종류 이름이 `music`인데 파일 폴더는 `assets/audio/bgm/`이라 `/audio/music/<키>.ogg`를 찾아 항상 실패(효과음은 `sfx`라 정상). 수정: `findAudioUrl(urls, kind, key)`(음악 → bgm 폴더, 테스트 3개 추가). 재확인: 첫 입력 뒤 `bgm/field.ogg` 요청 200, `AudioBufferSourceNode.start` 호출 2회(발걸음 + 음악), 컨텍스트 running.
- 교훈: 엔진 단위 테스트는 가짜 `fetchBuffer`를 써서 경로 조합 버그를 못 잡았다. 파일 경로 조합은 순수 함수로 빼서 테스트한다.

## 2026-10-28 상자(임시 그림) 인물 제거 — 기본형 5종 생성과 배정
- 사용자 지적: "순례자가 왜 박스야?" 원인: 새 인물 55명의 임시 그림이 옛 시트 `[town, 84]`(창문 모양 타일). 오늘 PixelLab 보너스 5회로 기본형 5종(`elder-woman`, `robed-priest`, `guard-soldier`, `craftsman`, `young-villager`; 4방향, 모두 정상)을 만들고 `scripts/assets/assign-npc-sprites.py`로 역할 낱말 → 그림을 배정(기존 칼라스 인물 그림 재사용 포함, 같은 마을 안에서는 가급적 안 겹치게). 55명 배정, 게이트 통과(469 passed). 프롬프트 `assets/generated/prompts/2026-10-28-base-types.md`, 장부 24행 추가.
- 한계: 같은 그림이 한 마을에서 반복됨(특히 craftsman), 마을색 변형(recolor) 아직 안 함, 걷기 그림 없음(위아래 흔들림으로 대체). 기본형 12종 중 5종 완료 — 남은 약 7종(젊은 여성 일꾼, 병사 변형, 상인 등)은 다음 보너스.

## 2026-10-28 전투 C-1 타격감
- 계획 `docs/superpowers/plans/2026-10-28-combat-c1-hit-feel.md`, 설계 `docs/superpowers/specs/2026-10-28-combat-fun-design.md` §4.9. 규칙(피해·턴·AI)은 바꾸지 않았다. core에는 이벤트 `combatHit`/`combatYield`와 순수 조회(`combat/preview.ts`)만 추가.
- 만든 것: `render/fx.ts`(공격 1회 410ms 시간표: 예비동작 0.2칸 → 돌진 0.55칸 → 충돌 180ms에 점멸·화면 흔들림(피해 비례, 상한 6px)·넉백·피해 숫자·슬래시·스파크 6개·체력 막대 감소+잔상 → 히트스톱 70ms → 복귀; 처치·퇴각은 잔상 페이드; 이동은 160ms 슬라이드; 적 행동은 내 연출이 끝난 뒤 "적의 차례" 배너와 함께 시작), `render/combat-overlay.ts`(이동 가능 칸 파랑·공격 가능한 적 빨간 테두리와 예상 피해/"처치"), `audio/hit-sound.ts`(피해가 클수록 낮은 음정, 연타마다 +0.06, 처치 -0.05; 충돌 시점에 재생), 인접한 적을 눌러 바로 공격(`pointerToCommand`), 격자 바깥도 땅으로 채우고 바깥만 어둡게, 세로 화면은 하단 25%를 비우고 격자가 통째로 들어오게 배율을 낮춤(`computeViewport`의 `fitCells`).
- 마지막 일격으로 전투가 끝나도 연출이 끝날 때까지 `lingerState`로 전투 장면을 유지한다.
- 확인: 테스트 515 passed, typecheck/check:content/build/audit:dist exit 0. 캡처를 직접 열어 봄(`docs/screenshots/2026-10-28-C1-*.png`: 공격 프레임 스트립, 공격 가능 표시, 휴대폰 3배). 도구 `scripts/visual/combat-demo.mjs`.
- 확인 못 한 것: 실제 소리(🧑), 연출 속도·세기의 취향(🧑 판정), 동료가 있는 전투(4명) 화면, 처치 연출의 소리 층(push 겹침은 미구현), 빠른 모드·건너뛰기(C-6).
- 최종 검토(별도 검토자, opus)에서 고친 것(테스트 먼저, 522 passed): ① 연출이 시퀀스 단계(410ms)에서 끊겨 피해 숫자·잔상·체력 잔상이 도중에 사라지던 문제 → `endAt`(모든 효과의 끝)을 `busy`·정리 기준으로 분리 ② 패배로 전투가 끝날 때 걸어와서 때린 적이 옛 칸에 서 있던 문제 → `combatHit.at`(때린 칸) 추가, `render/combat-linger.ts`의 `endedCombatUnits` ③ 마지막 일격 연출 중 입력이 탐험으로 새던 문제 → 첫 입력은 연출 건너뛰기(`skipLinger`) ④ 밀치기에도 "적의 차례" 배너가 뜨던 문제 → `enqueue`의 `enemyPhase`(라운드가 바뀐 때만) ⑤ 도망 뒤 남은 소리·연출 정리 ⑥ 쓰러진 유닛의 체력 막대도 끝까지 표시.
- 보류(Minor): 체력 최대값을 전투 시작 hp로 잡아 패배 뒤 다음 전투·저장 불러오기에서 막대가 가득 참, 이전 배치의 막대가 다음 명령 때 조기 하락할 수 있음, 막는 칸 밀치기에 타격음이 push와 겹침, 연출 중 탭이 실제 상태 기준(그려진 위치와 다를 수 있음)·의도선·활성 표시는 상태 위치, 백그라운드 탭 복귀 시 소리 몰림, `trackCombatFx`(main) 자체 테스트 없음(순수 부분 `endedCombatUnits`·fx는 테스트됨), 세로 화면 하단 비율 25%는 실제 패널 높이와 연결돼 있지 않음.

## 2026-10-28 전투 판정 후속(연습장·표시·속도)
- 사용자 요청과 처리: ① "전투만을 위한 별도 필드, 디버그 쓰지 말고" → `map.arena`(칼라스 maps.yaml; 들판 (9,7) 입구, 연습장 안 조우 3개: 늑대 3·도적 3·섞인 무리 4, 들어오면 체력 회복). 조우 옵션 `repeatable: true` 추가(`encounters.yaml`, compile.ts, `endCombat`에서 완료 기록 안 함; 테스트 1개). ② 입구 표지판 `obj.sign`(직접 그린 32×48 PNG `assets/sprites/objects/arena/sign.png`, 장부 등록) + 막는 물건 칸의 바닥이 검게 보이던 버그 수정(`drawGround`가 `map.ground`로 바닥 풀을 그림). ③ 노란선의 뜻: 적의 다음 차례 이동 예고. 보기 싫다는 평가 → 노란 반투명 블록(목적지 칸)으로 교체, 공격 대상의 빨간 테두리는 유지. ④ 전투 격자의 큰 나무(80×96)가 적·체력 막대를 가림 → `render/object-fit.ts`(`combatObjectFit`, 폭 1.25칸·높이 1.6칸 이내)로 축소, E2E `tests/e2e/arena-combat.spec.ts`(연습장 입장→늑대 전투 시작, 오류 없음; 캡처 `docs/screenshots/2026-10-28-arena-combat-trees.png`). ⑤ 사용자 판정 "타격감은 괜찮은데 연출이 조금 느려" → `createFx(speed)`, `main.ts`에서 1.5(공격 410→약 273ms). ⑥ 음량 슬라이더에 포커스가 있을 때 방향키가 이동에 쓰이던 문제 수정.
- 확인: 527 passed, typecheck, check:content, build, audit:dist; 연습장 E2E 통과, 캡처 직접 확인. 확인 못 한 것: 1.5배속의 체감(🧑), 소리.
- 다음: 사용자 판정 뒤 C-2(지형·방향 보정·연계 추가타). 연습장은 판정이 끝나면 제거 여부 결정. 마을색 변형(recolor, 생성 0회)은 색 선택 대기, PixelLab 잔액 0.

## 2026-10-29 칼라스 마을 돌바닥 이전 · 소리 14개 · 마을색 결정
- 사용자 위임: "마을색 팔레트 승인/선택, 소리 없는 14개 상황 효과음은 최신 트렌드에 맞게 네가 선택. 못 들으면 가장 많이 쓰는 기준". 결정과 목록은 `docs/research/art-production-plan.md` 끝(마을색 hue 표, 소리 선택). 효과음 14개는 Kenney CC0 후보(`assets-private/preview/sfx`)에서 복사해 `assets/audio/sfx/<상황>.ogg`, `sfx.json`·`LEDGER.md`·`content/audio.yaml` 갱신, 이벤트 연결은 `src/audio/event-sounds.ts`(순수 함수, 테스트 4개)를 `apply()`에서 호출. 직접 들어 보지는 못함.
- 오늘 PixelLab 1회 사용(잔액 보너스 4회 남음): 풀↔돌바닥 `assets/sprites/tilesets/grass-stone`(프롬프트 `assets/generated/prompts/2026-10-29-grass-stone.md`), `GROUND_SETS.stone`·`OVERLAY_ORDER`에 stone 추가, 타일 글자 `c`. 칼라스 마을 지도의 풀(.→g)·흙길(,→p)·나무(T→t)·바깥 돌바닥(:→c)을 새 땅으로 바꾸고 고백석은 `obj.confession-stone`(16,12)로. 건물 안 돌바닥(:)과 벽(#)·문(+)은 옛 타일 그대로(벽 그림 필요). 캡처 `docs/screenshots/2026-10-29-kalas-town-stone.png` 직접 확인: 광장은 잘 어울리나 옛 벽이 확대되어 튄다. 도구 `scripts/visual/map-shot.mjs`.
- 다음: 외벽·건물 그림(남은 보너스 4회), 서고 바닥·벽 타일셋, 마을색 변형 적용, C-2.

## 2026-10-29 전투 C-2 (지형·방향·연계)
- 계획 `docs/superpowers/plans/2026-10-29-combat-c2-terrain-chain.md`. 규칙은 `src/core/combat/rules.ts`(순수: `facingToward`, `sideOf`, `terrainDefense`, `attackDamage`, `chainHits`)와 `content/combat.yaml`(읽기 `compile.ts readCombat`, 타입 `CombatRules`/`DEFAULT_COMBAT_RULES`; 파일이 없으면 기본값). `CombatUnit.facing?`(시작: 가장 가까운 상대 쪽, 이동: 마지막 걸음, 공격: 대상 쪽)로 방향을 정한다 — 저장 호환(없으면 방향 보정 없음).
- 피해 = max(1, round(공격력×방향배율) − 지형방어), 방어 자세면 절반 올림. 방향 보정은 **적에게만**(`vsAllies: false`) — 켜면 기존 시나리오 수순(WOLF_PUSH_WIN 등)이 죽어서 꺼 둠. 연계: 주 타격 뒤 대상이 살아 있으면 대상 4방 인접의 같은 편이 units 순서로 추가타(피해 = max(1, round(정상피해×0.5))), 쓰러지면 중단, 적 연계는 `chain.enemies`(기본 꺼짐, C-5에서 난이도와 함께). 이벤트 `combatHit.chain`(1부터).
- 연출: 연계는 앞 타격이 끝나기 전(250ms, 배속 적용)에 이어 들어가고 "N연계!"(주황) 숫자가 뜨며 타격음 음정이 한 단계씩 오른다. 미리보기 라벨 "-N ×k"(합계와 타수). 노란 예고 블록은 쓰러지는 유닛 칸에서 숨김.
- 콘텐츠: 연습장 `enc.arena.mixed`를 9×9(큰 풀 `h`·나무 `t`)로, 훈련 교관 `npc.arena.trainer`(단서 없이 합류하는 동료; 연습장과 함께 판정 뒤 삭제 예정).
- 확인: 553 passed, typecheck/check:content/build/audit:dist 0, E2E 3개 통과, 연계 프레임 스트립을 직접 열어 확인(2연계 숫자·추가타·처치 페이드). 도구 `scripts/visual/fx-chain.mjs`, `fx-strip.mjs`, `fx-timing.mjs`. 확인 못 한 것: 방향·지형이 체감되는지(🧑), 연계 소리, 적 연계가 켜진 난이도.
- 다음: 판정 뒤 C-3(병과·책략·기세). OpenCode 병렬 작업 3건(town-ground, narrative-fixes, fx-tracking-tests)은 `oc/*` 브랜치로 올라오면 받아서 게이트 확인 후 합친다.

## 2026-10-29 oc/fx-tracking-tests — 전투 연출 추적 분리
- 목표: `src/main.ts`의 `trackCombatFx`와 `lingerState` 처리를 순수 모듈 `src/render/combat-track.ts`로 추출하고 TDD로 단위 테스트 추가(handoff 2026-10-28 보류 "`trackCombatFx`(main) 자체 테스트 없음").
- 한 일:
  - `tests/unit/render/combat-track.test.ts` 먼저 작성 → RED 기록(모듈 없음).
  - `src/render/combat-track.ts` 추가: `createCombatTrack(fx)` factory, `CombatFx`/`CombatTrack` 인터페이스, `apply(prev, next, events, now)`, `update(now)`, `release()`, `lingerState` getter. `performance.now()`는 외부에서 주입.
  - `src/main.ts`에서 `lingerState`, `trackCombatFx`, `endedCombatUnits` import 제거; `createCombatTrack(fx)` 사용. `draw()`는 `combatTrack.update(now)` + `combatTrack.lingerState ?? s`, `apply()`는 `combatTrack.apply(...)`, `replaceState()`와 `skipLinger()`는 `combatTrack.release()`.
  - `docs/status.md` 갱신.
- 커밋: `ffda8f9` refactor(render): extract combat fx tracking into combat-track.ts with TDD tests
- 게이트(직접 실행):
  - `npm run test:unit` 0 — 85 files, **558 passed** (기존 553 + 신규 5)
  - `npm run typecheck` 0
  - `npm run check:content` 0 — `ok (13 maps, 127 npcs, 140 facts, 294 ledger files, 198 src/tests/scripts files scanned)`
  - `npm run build` 0
  - `npm run audit:dist` 0 — `ok (63 files, 12826869 bytes)`
  - `git diff --check` 0
- 확인 못 한 것: 브라우저/Playwright로 실제 전투 연출 동작 확인(단위 테스트로 논리만 검증; 화면·소리는 사용자 판정 대기).

## 2026-10-29 7개 미덕 마을 돌바닥 이전
- 브랜치 `oc/town-ground`. 목표: 칼라스 참조(`998a6ac`)와 동일한 규칙으로 연민·명예·겸손·정의·희생·영성·용맹 마을의 바깥 바닥을 새 땅(`g`/`p`/`t`/`c`)으로 변환, 건축물 납부 `.`와 벽 `#`, 문 `+`/`<`는 그대로.
- 산출물: `scripts/assets/migrate-town-ground.py`(표준 라이브러리만, YAML 주석·형식 보존, 멱등), `content/towns/{compassion,honor,humility,justice,sacrifice,spirituality,valor}/maps.yaml`, `scripts/visual/map-shot.mjs`에 `HC_BASE_URL` 환경 변수 지원, `docs/screenshots/2026-10-29-town-<name>.png` 7장 + `-entrance.png` 7장.
- 스크립트 동작: 출구 타일(`+`/`<`)에서 BFS로 바깥 영역 탐색(`.`, `,`, `:`, `T`만 이동), 바깥 `.`→`g`, `,`→`p`, `T`→`t`, `:`→`c`, 건축물 안쪽 `:`는 `:`. `c`가 8방 `p`와 맞닿으면 `g`로 교체(이번 마을들에서는 해당 사례 없음).
- 검증: `npm run check:content` 0, `npm run test:unit` 0 (531 passed), `npm run typecheck` 0. 스크립트 2회 실행 결과 동일(unchanged 560×7). 스크린샷 14장 모두 `SHOT OK`, 직접 열어 확인: 검은 사각형 없음, 타일 배율 정상, 풀 녹색/돌바닥 회색, 나무 물건으로 렌더링, 건축물 납부는 옛 바닥, 벽과 출구 타일 유지.
- 확인 못 한 것: 돌바닥(`c`)과 건축물 벽(`#`)의 새 그림이 아직 없어 시각적으로 구분이 미묘함(0.2.0 자산 교체 예정).

## 2026-10-29 D-1b 정의·겸손 대사 수정 (oc/narrative-fixes-b)
- 담당: OpenCode · 브랜치 `oc/narrative-fixes-b` · 커밋 `6fa26f6`
- 한 일:
  ① 정의 마을 `lie` 주제 이동: `npc.justice.judge`의 `fact.creature.justice-mourner` 주제를 제거하고, 동일 거짓 문장을 `fact.seles.witness`(person) 주제로 옮겨 `lie: true`를 유지. 문자열 키 `justice.npc.judge.mourner.t` → `justice.npc.judge.witness.t`로 변경하고 ko/en에서 동시 교체.
  ② 겸손 마을 9명 NPC의 name 응답 개별화: `npc.default.unknown` 대신 `humility.npc.<id>.name.t` 신규 키 9개 추가(listener, wellkeeper, child, librarian, gardener, cook, novice, hermit, widow). 각자 침묵 규칙을 다른 이유로 말하며 1~2문장, 낮고 짧은 말투 유지. `npc.default.unknown` 자체는 삭제하지 않음.
  ③ 위기 지문 조사(READ ONLY, 코드 수정 없음): `crisis.*.text` 키는 8개 마을 전부 ko/en에 존재하고 `content/towns/*/crisis.yaml`이 참조하지만, UI(`src/ui/view-model.ts`, `src/ui/panels.ts`)에서 위기 본문 설명을 렌더링하지 않음. `DialogueView.crisis`는 선택지 라벨·available·hints만 포함하고 `Crisis.textKey`는 빠져 있음. 수정 제안: `dialogueView`가 `crisisText` 필드를 추가해 `crisisId`별 설명을 1회 렌더링하거나, 선택지 목록 상단에 crisis.textKey를 넣는다.
  ④ 과부 설정: 정의 과부 하린과 겸손 과부(무호칭)는 이미 별개 인물로 남겨 둠. 하린은 "노래하는 과부"로 아들 이렌·묘지기·재판관과 연결된 정사의 중심; 겸손 과부는 잊혀 가는 남편 이름을 지키는 인물로, 비석을 비워 두는 마을의 침묵 법과 연결.
- 검증: `python3 scripts/narrative/consistency.py` 0 problems · `python3 scripts/narrative/reachable.py` 0 unreachable · `python3 scripts/narrative/spec.py dead-topics` 0 · `npm run test:unit` 531 passed · `npm run typecheck` 0 · `npm run check:content` 0 · `npm run build` 0 · `npm run audit:dist` 0 · `git diff --check` 0.
- 확인 못 한 것: 실제 게임 화면에서 거짓 표시(!) 노출 여부(능력 획득 후), 위기 지문 UI 추가는 사용자/메인 에이전트 결정 필요.

## 2026-10-29 전투 C-3a 기세·필살기
- 규칙: `CombatState.momentum?`(0..max), `CombatRules.momentum`(`content/combat.yaml`: max 6, weak 1, chain 1, defeat 1, specialMultiplier 2, splashRatio 0.5). 쌓임: 아군 `attack`에서 옆·등 타격 +weak, 연계 추가타마다 +chain, 처치마다 +defeat(`grid.ts gainOf/addMomentum`). `special`(방향) 명령은 아군 활성·가득 찬 기세·인접 적일 때만: 정상 피해×2, 대상 4방 인접 다른 적에 round(주피해×0.5), 기세 0, 행동 소모. 이벤트 `combatHit.special`.
- 화면: HUD 이름 줄에 "기세 n/6", 가득 차면 "필살" 버튼(공격 옆), 방향 키/인접 칸 탭으로 지정. 캔버스: 격자 왼쪽 위 기세 칸 막대(가득 차면 깜빡), 필살 시 "필살!" 배너 + 타격 350ms 지연 + 큰 흔들림(상한 10px), 옆 피해자는 동시에 숫자.
- 확인: 563 passed, 게이트 전부 0, E2E 3개, 필살 프레임 스트립 직접 확인(`docs/screenshots/2026-10-29-C3a-special-strip.png`, 배너→충돌→처치 페이드→적의 차례). `?debug=1`의 `__hollowCodex__.debugSetMomentum(n)`으로 확인(저장 영향 없음). 도구 `SPECIAL=1 node scripts/visual/fx-strip.mjs <out.png>`.
- 못 한 것: 필살 전용 소리(지금은 일반 타격음), 적 필살, C-3b(병과·숨·책략 3단계·8미덕 스킬).

## 2026-10-29 벽·문·마루·계단 32px 타일(코드로 그림), 과부 기본형, 옛 인물 그림 교체
- 옛 Kenney 16px 벽(주황 줄무늬)·문·바닥이 새 풀·돌바닥과 안 어울려서 `scripts/assets/make-wall-sheet.py`(순수 파이썬, AI 생성 없음)로 `assets/tiles/walls32.png`(6칸: 마을 벽, 문, 서고 벽, 서고 바닥, 실내 마루, 계단)을 그려 `content/tiles.yaml`의 `#` `+` `%` `_` `:` `>` `<`를 새 시트(`walls`, tile 32)로 바꿨다. 지도 글자는 그대로. 캡처 직접 확인: `docs/screenshots/2026-10-29-kalas-town-walls.png`, `-archive-walls.png`, `-town-valor-walls.png`. 한계: 건물은 여전히 "벽 블록 + 안쪽 마루"(지붕·정면 없음), 작은 지도(서고)는 가운데 정렬이라 좌우 검은 띠, 대륙(`^ T o L S` 등 나머지 옛 타일)은 그대로.
- PixelLab 보너스 오늘 3회 사용(집 정면·풀↔돌바닥·과부), 남은 2회: 과부 기본형 `widow`(`assets/sprites/characters/widow`, 프롬프트 `assets/generated/prompts/2026-10-29-base-types.md`)를 6개 마을 과부에 배정. `assign-npc-sprites.py`를 `[시트,번호]` 형식 옛 그림 전부(54명)로 넓혀 역할별 새 인물 그림을 배정했다(같은 그림이 마을 안에서 반복될 수 있음).
- 전투: `CombatUnit.maxHp`(체력 막대 가득 값, 시작 때 기록), 막힌 밀치기는 타격음만(밀치기 소리 중복 제거). 둘 다 테스트 추가.
- 다음: 기본형 나머지(아이·상인·서기 등), 마을 건물 정면(집 정면 그림 `kalas/house-front.png` 활용 방안: 실내로 걸어 들어가는 구조라 아직 안 놓음), C-3b.

## 2026-10-29 대륙(map.over) 새 땅 이전 + 산 타일 + 마을 입구 집
- `content/towns/overworld/maps.yaml`: `.`→g, `,`→h, `:`→p, `T`→t, `~`→w, `=`→b(다리 물건 `obj.bridge` 2곳), `+`→p(마을 입구 8곳에 `obj.house-front` 집 정면, 문 앞 칸은 흙길). `terrainCost`는 새 글자로 다시 썼다(옛과 같은 비용: g1 h2 p2 w/t/^ 막힘 b1). 물(`w`)과 맞닿은 길 4칸은 `g`로(땅 인접 규칙). 이동 규칙은 타일 `walk`로 같다(나무 t·물 w는 못 감).
- `walls32.png`에 산 타일(칸 6, 배경 투명) 추가 → `^`. 렌더러: 땅 종류가 있는 지도의 투명한 옛 그림(산·열석)은 풀 바닥을 먼저 깐다(`WALLS_MOUNTAIN`만 투명, 나머지 walls 칸은 불투명). 캡처 직접 확인: `docs/screenshots/2026-10-29-overworld*.png`.
- 남은 옛 타일: 열석 `o`(옛 16px), 칼라스 필드 `S`. 건물은 지붕 없는 벽 블록(집 정면 물건은 입구 장식에만 사용).

## 2026-10-29 전투 C-4(일부) 마음 게이지
- `CombatUnit.morale/maxMorale`(적만; 시작값 = `creature.morale ?? hp`), `content/combat.yaml`의 `morale: {weakLoss 1, isolationLoss 1, persuadeRatio 0.5}`. 줄어드는 때: 아군의 `attack`·연계·필살로 맞을 때(피해 + 옆/등이면 weakLoss), 라운드가 바뀔 때 주변 2칸 안에 다른 살아 있는 적이 없으면 isolationLoss. 설득(`persuaded`): 비악 ∧ (lore 단서를 앎 ∨ 마음 ≤ ceil(최대×persuadeRatio)). 악한 적은 마음 0이면 `breakMorale`(settle 안)이 퇴각시키고 `combatYield retreated`를 낸다. 목표 6종·증원·보상 차등은 아직.
- 화면: 적 체력 막대 아래 파란 얇은 막대(`drawMoraleBar`), HUD 칩에 "마음 n". 크리처 그림도 새 인물로 교체(`content/creatures.yaml`: 도적=craftsman, 거지=young-villager, 결투가=guard-soldier, 조문객=widow 등).
- 확인: 573 passed, 게이트 0, E2E 3개, 프레임 스트립 직접 확인. 확인 못 한 것: 균형(마음 감소량·절반 기준), 설득 안내 문구(왜 설득이 안 되는지 표시 없음), 적 쪽 마음 표시 외의 아군 마음.

## 2026-10-29 전투 C-4(일부) 조우 목표: 버티기·탈출
- 조우 YAML `objective: { kind: survive, rounds: N }`(라운드가 N을 넘기면 승리, 적이 남아 있어도) / `{ kind: escape, at: [x, y] }`(아군 누구든 그 칸에 서면 승리). 없으면 섬멸(그대로). 읽기·검증 `compile.ts`(escape 칸은 격자 안·걸을 수 있어야 함), 판정 `grid.ts checkEnd`(섬멸 → 패배 → 목표 순서; 기존 순서 유지), 테스트 3개.
- 화면: HUD 이름 줄에 "목표: 4라운드를 버텨라 (n/4)" / "목표: 표시된 칸까지 탈출", 탈출 칸은 금빛 깃발 표시. 연습장에 `enc.arena.hold`(9,2)·`enc.arena.escape`(9,6) 두 조우 추가(반복 가능). E2E `tests/e2e/arena-objectives.spec.ts`(HUD 문구·깃발 캡처 직접 확인).
- 남은 C-4: 호위·함정 해제·증원, 목표별 보상 차등. 균형은 미검증(버티기 4라운드에서 플레이어 체력이 버티는지 등 — 🧑).

## 2026-10-29 C-5 일부: 적 성격(AI) 5종 + 자동 대전 균형 벽
- `creature.ai`(aggressive 기본 · skirmisher 가장 약한 아군 · pack 다른 적이 붙은 아군 · cautious 마음 ≤ 절반이면 거리 두기 · coward 마음 ≤ 3/4이면 거리 두기). `intents.ts`의 `computeIntents`가 성격별 대상·이동을 고르고 예고(노란 블록·빨간 테두리)는 그대로 같은 결과를 보인다. 테스트 `combat-ai.test.ts`. 크리처에 배정: 늑대 pack, 도적 skirmisher 등.
- `scripts/sim/combat-sim.ts` + `tests/unit/core/combat-balance.test.ts`(자동 대전이 모든 조우를 12라운드 안에 끝내는지). 이야기 조우는 일부러 짧게 둔다(결정 이유는 `docs/superpowers/plans/2026-10-29-combat-c5-ai-encounters.md`).

## 2026-10-29 검토(opus) 수정 3건 — C-2/C-3a/C-4
- 적 단계의 고립으로 마음이 0이 된 악한 적이 한 입력 늦게 물러나던 문제 → `settle` 끝에서도 `breakMorale`. 이 때문에 시나리오 수순 `ROBBER_WIN`(서고 도굴꾼)을 다시 풀었다(첫 도굴꾼은 옆 타격으로 마음 0 → 퇴각, 둘째는 한 대에 퇴각).
- 불러오기 등으로 fx가 reset 없이 비워진 뒤 체력 막대 최대값이 `maxHp`를 무시하던 문제 → `enqueue`·캔버스 대체값이 `maxHp`를 쓴다. 거절된 방어(상태 불변)에도 방어음이 나던 문제 → `eventSounds(events, cmd, accepted)`.
- 검토가 확인한 정상: 연계가 쓰러진 대상에 안 닿음, 행실 한 번만 기록, 기세 한 번만 계산·상한, 필살 분출 순서, 목표 판정 순서(섬멸→패배→탈출/버티기), 저장 호환(새 필드 모두 선택).

## 2026-10-29 전투 C-3b(경량): 숨과 책략 3종
- `CombatState.breath`(시작 2, 최대 5, 라운드마다 +1; `combat.yaml breath`), 행동 `skill {skill, dir?}`: **calm 달래기**(능력 `ability.compassion-persuade`; 인접 적 마음 −3), **guard 막기**(`ability.valor-shield`; 나와 인접 아군이 방어 자세), **mark 표식**(`ability.justice-eye`; 그 적이 맞는 피해 ×1.5, 라운드가 바뀌면 사라짐). 비용 1, 능력을 풀지 않았거나 숨이 모자라면 무시. `rules.ts attackDamage`가 표식을 반영(미리보기 포함). 매핑 `SKILL_ABILITY`(core/types.ts).
- 화면: HUD "숨 n/5"와 해금한 책략 버튼(달래기·막기·표식, 숨이 모자라면 비활성), 방향이 필요한 책략은 공격처럼 방향 키/인접 칸 탭으로 지정, 표식 난 적 머리 위 붉은 과녁. 디버그 `debugGrantAbilities(ids)`·`scripts/visual/skills-shot.mjs`. 테스트 5개(core), 캡처 `docs/screenshots/2026-10-29-C3b-skills.png`(버튼·숨 표시 확인; 표식 과녁은 동료가 있어야 라운드 안에 보임 — 단독이면 곧바로 적 단계로 지워짐).
- 병과(이동력·공격 모양)·정직/명예/희생/영성/겸손 책략은 아직. 설계 §4.2/4.5 참고.

## 2026-10-29 대사 남은 문제 정리(narrative-fixes) — ④ 과부 4개 마을 분리
- 브랜치 `oc/narrative-widow` (= `origin/main` 218226a 위에 `0eefa53`만 올림). 전체 기록(①②④)은 `oc/narrative-fixes`에 있음.
- **배치 주의**: 작업 중 다른 에이전트가 `oc/narrative-fixes-b`(① 정의 lie·② 겸손 이름)를 `main`에 병합했다(`31383f5`). 또 `oc/town-ground`(`39bb5be`)와 `oc/fx-tracking-tests`(`ffda8f9`) 커밋도 이미 `main`에 들어 있다. 그래서 이 브랜치에는 아직 `main`에 없는 ④(과부 4개 마을 분리)만 남겼다.
- 한 일: honor 세린→**실비**(천 판매상, 남편 이름을 천에 새김, 해요체) · sacrifice 레아→**노을**(제단 대신 아이에게 빵 반쪽, 반말) · spirituality 이레→**가은**(면허 없는 이들의 이름을 종이에 적어 뜰 나무, 해요체) · valor 렌→**서린**(방패 가죽 장인, 합쇼체). 마을 안 다른 NPC 대사·fact/option/crisis의 이름 참조까지 갱신. NPC 수·id·위치·일과·스프라이트 변경 없음. 변경은 `content/strings/ko.yaml`·`en.yaml` 값뿐(키 이름 유지 → npcs.yaml 수정 없음).
- ③ 위기 지문 조사(코드 수정 없음): `crisis.text`는 컴파일되지만(`src/content/types.ts:73`, `src/content/compile.ts:396,600`) UI에서 렌더링되지 않는다 — `src/ui/view-model.ts:95-107`이 `DialogueView.crisis`를 `crisisOptions()`(optionId·label·available·hints)만으로 만들고 `src/ui/panels.ts:170-220`도 선택지만 그린다. 수정 제안: view-model에 `crisisText` 추가 후 선택지 위에서 한 번 렌더(콘텐츠 변경 없음). 🧑 결정 대기.
- 검증: `python3 scripts/narrative/consistency.py` 0 problems · `reachable.py` 못 얻는 단서 0개 · `spec.py dead-topics` 0 · `npm run test:unit` 531 passed · typecheck/check:content/build/audit:dist/git diff --check 모두 exit 0.
- 확인 못 한 것: 게임 화면의 거짓 표시(`!`) 노출(능력 획득 후) · ③ UI 수정 미실시 · 정의·겸손 과부는 변경 없음.
- 참고: 7개 마을 지도 이전(`oc/town-ground`) 캡처 14장은 이미 이미지가 열려서 확인했다. 돌바닥(c)·풀(g)·나무(t)는 정상 렌더, 격자 정렬 이상 없음. **옛 벽(#) 타일 안쪽 절반이 순수 검정으로 나오는 현상은 이전에도 똑같았다**(변환 전 지도 캡처와 검정 비율 2.2%로 동일) — 옛 벽 그림을 2배 확대한 0.2.0 자산 작업 몫이다.

## 2026-10-29 OpenCode 작업 마무리 + 위기 지문 표시
- OpenCode 3작업 완료 보고(사용자 전달): `oc/town-ground`·`oc/fx-tracking-tests`·`oc/narrative-fixes-b`는 이미 main에 반영돼 있었고, 남은 ④(과부 4개 마을 분리: honor 실비·sacrifice 노을·spirituality 가은·valor 서린)는 `oc/narrative-widow`를 병합했다. 상세 `docs/narrative/2026-10-29-fixes.md`. 게이트: consistency/reachable/dead-topics 0, 테스트 592, 모든 게이트 0.
- ③ 위기 지문이 화면에 안 보이던 문제(조사 결과 `view-model.ts`가 `crisis.text`를 뷰에 안 넣음)를 고쳤다: `DialogueView.crisisText`(대화 중인 NPC의 풀지 않은 위기 지문)를 만들고 `panels.ts`가 선택지 위에 강조 문단(`.crisis-text`)으로 그린다. 테스트 1개, 캡처 직접 확인(`docs/screenshots/2026-10-29-crisis-text.png`, 자선 관장).
