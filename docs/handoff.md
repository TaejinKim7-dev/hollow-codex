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
