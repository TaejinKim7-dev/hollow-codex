# 현재 상태 (status.md)

> 규칙: 이 파일은 **짧게, 항상 최신으로** 유지한다(60줄 이내). 작업을 시작할 때 "진행 중"에 이름을 올리고, 끝날 때 결과를 반영해 덮어쓴다. 자세한 기록은 `docs/handoff.md` 끝에 추가한다.

최종 갱신: 2026-10-29 · 버전 0.1.0 (배포 중, 사용자 판정: 그래픽·소리 "방향 수정") · 0.2.0 자산 준비 중

## 지금 단계
**진행률 약 70%(추정)·TODO·방향: `docs/progress-2026-10-29.md`.**
**2026-10-27 사용자 지시: 그래픽·소리 작업은 여기서 일단 정리하고, 다음은 대사(실제 내용) 품질 작업(D 단계).** D-1 칼라스 점검 완료 → `docs/narrative/kalas-audit.md`(제안), `docs/narrative/voice-bible.md`(말투 기준). 🧑 확인 뒤 `content/strings/ko.yaml` 반영. 남은 그림·소리(맵 그림 15회, 문지기 색, 집 시점 판정, NPC 걷기)는 `art-kalas-maps.md`·`art-kalas-cast.md`에 목록으로 보존.
R(자산 방향) 진행 중. 그림은 PixelLab 생성, 소리는 CC0/CC-BY/CC-BY-SA 공개 음원만(사용자 결정 2026-10-19, ElevenLabs 안 씀).
확정: 플레이어 **이방인 B-navy**, 동료 **엘린 B**(4방향 걷기), 땅 **풀↔흙길 v3**·**풀↔물**, **긴 다리**, **효과음 14종**(`assets/audio/sfx/`).
2026-10-27 추가: 칼라스 인물 10명+늑대(걷기)+고백석+집+나무(`docs/research/art-kalas-cast.md`).

## 다음 할 일 (위에서부터)
| ID | 할 일 | 산출물 | 상태 |
|---|---|---|---|
| D-1 | 마을 대사 점검·고쳐 쓰기·인물 추가 **8개 마을 모두 15명 기준으로 반영 완료**(2026-10-27, 전체 NPC 126명). 마을당 대사 30~70줄 수정, 새 주제 20개 안팎, 새 인물 5명(ko+en). 인물 그림은 임시 스프라이트. 🧑 대사 읽기·판정, 아래 결정 3건 | `docs/narrative/<마을>-script.md`(전문), `<마을>-audit.md`(점검·설정·흐름), `voice-bible.md`(칼라스 설정) | 반영 완료, 판정 대기 |
| ✅ | **D-2 결정 반영(2026-10-27)**: ① 규칙 변경(song·creature 칩 허용) + 나머지 24줄 재연결 → 물을 수 없는 주제 0 ② 얻을 수 없던 단서 6개 최소 수정 → 0 ③ 헷갈리는 인물 이름 7개 개명(마을 이름 유지). 게이트 전부 통과 | `docs/narrative/consistency-report.md` | 완료 |
| ✅ | **인물 그림 방식 결정(2026-10-27)**: 새 인물 약 45명은 **기본형 12종 + 마을색 변형**(처음 계획, `art-production-plan.md` §1)으로. 생성 약 12종×(대기 1 + 걷기) + `scripts/visual/recolor.mjs`로 8마을 색 | `art-production-plan.md` | 결정됨(그림은 PixelLab 하루 5회로 진행) |
| ✅ | R-2a2 **(2026-10-29 사용자 위임으로 Claude가 선택·연결)** 효과음 추가 14상황(게임 이벤트 중 소리 없는 것: 맵 이동·전투 시작·방어·설득·도주·승리·패배·동료 합류/이탈·열석 열림·능력·위기·경전 쓰기·에필로그) 후보 53개를 실험실에 올림 → 선택 완료, `src/audio/event-sounds.ts`로 이벤트에 연결 | 실험실 `/hollow-codex/lab/` | 완료(🧑 청취 판정 대기) |
| R-2a3 | ElevenLabs 효과음 35개(늑대·열석·전투·이벤트·분위기 루프) 생성 완료, 🧑 실험실에서 청취·판정 | `docs/research/elevenlabs-sfx.md` | 완료(청취 대기) |
| R-2b | 배경음악 12곡 **기본 A로 변환 완료**(사용자: CC-BY 허용·바로 진행, 슬롯별 선택은 안 함) → `assets/audio/bgm/<슬롯>.ogg`(110초→106초 루프, 합계 11 MB) + `credits.json`. 마음에 안 드는 슬롯은 `scripts/audio/bgm-selection.json`에서 B로 바꾸고 `make-bgm-loops.py` 재실행 | `docs/research/bgm-candidates.md` | 완료(사용자 청취 대기) |
| R-1b | 칼라스 인물 10명+늑대(걷기 포함)+고백석+집+나무 **완료**(2026-10-27). 남은: 🧑 집 시점 판정, 고백관·문지기 색 조정, NPC 걷기 | `docs/research/art-kalas-cast.md`, 목업 `docs/screenshots/2026-10-27-R1b-kalas-cast-scene.png` | 완료(판정 대기) |
| R-1d | 칼라스 **맵 그림**(풀↔돌바닥, 서고 바닥·벽, 외벽·성문·건물, 계단, 나무 변형 ≈15회, 하루 +5회로 3일) → `docs/research/art-kalas-maps.md`. 열석 고리 물건은 완성 | `assets/sprites/` | 다음(하루 보너스 대기) |
| 🧑 | 인물 크기: 지금 캐릭터는 몸 약 35px(타일 1칸 높이)라 15×11칸 ×2에서는 화면 높이의 10%뿐. 해결 후보 ① 시야를 11×7칸 ×3으로 좁힘(16%, 추천·비용 0) ② 9×6칸 ×4(18%) ③ 캐릭터를 더 크게 재생성(횟수 소모). 실험실에서 시야 버튼으로 비교 후 선택 | 채팅 | 대기 |
| ✅ | **S 설계 + P 계획 + I-1/I-2 구현(2026-10-28, 브랜치 `todo-2-art-audio-engine`)**: 32px 칸·가변 시야(11~15×7)·층 렌더링·듀얼 그리드 자동 타일·걷기 보간·소리 엔진(`audio.yaml`)·칩 합성기 제거·배포 예산. 칼라스 들판·전투(들판 늑대)·칼라스 인물 11명이 새 그림. 나머지 7마을·서고·대륙은 옛 16px 그림을 2배로 호환 표시 | 설계 `docs/superpowers/specs/2026-10-28-art-audio-redesign.md`, 계획 `docs/superpowers/plans/2026-10-28-art-audio-engine.md`, 화면 `docs/screenshots/2026-10-28-I2-*.png` | 🧑 화면·소리 판정 대기 |
| ✅ | **전투 C-1 타격감 구현(2026-10-28)**: 공격 연출 시간표·범위/미리보기·체력 막대·숫자·배너·타일 눌러 공격·타격 소리 음정. 사용자 판정: 타격감 OK, 연출 약간 느림 → 1.5배속 반영. 적 예고는 노란 블록, 전투 격자의 나무는 자기 칸 크기로 축소. **전투 연습장** `map.arena`(들판 (9,7) 입구, 표지판, 반복 조우 3개 — 판정 뒤 삭제 검토) | `docs/superpowers/plans/2026-10-28-combat-c1-hit-feel.md`, `docs/screenshots/2026-10-28-C1-*.png` | 판정 대기 |
| ✅ | **전투 C-2 구현(2026-10-29)**: 방향 보정(정면 1/옆 1.25/등 1.5, 적만)·지형 방어(`content/combat.yaml`, `h` +1)·**연계 추가타**(아군이 적 옆에 서면 추가타, 적 연계는 꺼짐)·미리보기 "-N ×k"·"N연계!" 연출·9×9 연습장 조우·훈련 교관 동료. 🧑 "연계가 재미있나" 판정 대기 | `docs/superpowers/plans/2026-10-29-combat-c2-terrain-chain.md`, `docs/screenshots/2026-10-29-C2-chain-strip.png` | 판정 대기 |
| ✅ | **전투 C-3b·C-4·C-5 일부(2026-10-29)**: 숨과 책략 3종(달래기·막기·표식, 능력 해금), 적 마음 게이지(설득 가능·악한 적 퇴각), 조우 목표(버티기·탈출), 적 성격 5종, 자동 대전 표(`scripts/sim/combat-sim.ts`)·균형 벽 테스트. **병과 4종(전사·척후·궁수·방패병, `combat.yaml classes`, 계획 `2026-10-29-combat-c3c-classes.md`) 구현·연습장 궁수·방패수 조우**. 호위/증원·마을 조우 재배치는 남음 | `docs/research/combat-difficulty-2026-10-29.md`, `docs/screenshots/2026-10-29-C3b-skills.png` | 🧑 판정 대기 |
| ✅ | **전투 C-3a 기세·필살기(2026-10-29)**: 약점(옆·등) 타격·연계·처치로 기세가 쌓이고(최대 6) 가득 차면 `필살`(정상 피해×2 + 옆 적 절반, 컷인 배너 "필살!"·큰 흔들림). 병과·책략·숨은 C-3b로 남김 | `docs/screenshots/2026-10-29-C3a-special-strip.png` | 🧑 판정 대기 |
| 🧑 | **전투 재설계 계획 승인(2026-10-28 사용자 요청: "영걸전급으로 재미있게")**: ~~C-2~~ → C-3 병과·책략 → C-4 마음·설득·목표 → C-5 AI·조우 → C-6 다듬기. 결정 5건(추천 포함) | `docs/superpowers/specs/2026-10-28-combat-fun-design.md` | 승인 대기 |
| ✅ | **D-3 대사 남은 문제 정리(2026-10-29)**: ④ honor·sacrifice·spirituality·valor 과부 4인 분리(세린→실비·레아→노을·이레→가은·렌→서린, 마을별 말투·사연 다름) `oc/narrative-widow` / ① 정의 `lie` 주제 사람(증인)으로 이동 + ② 겸손 9인 이름 대답 개별화 `main` 반영(`31383f5`) / ③ 위기 지문 미표시 원인 조사만(코드 미수정, 수정안 기록) | `docs/narrative/2026-10-29-fixes.md` | ④는 브랜치 대기 병합, ③ UI 수정은 🧑 결정 대기 |
| ✅ | **7개 미덕 마을 지도 새 땅으로 이전(2026-10-29, 브랜치 `oc/town-ground`)**: 연민·명예·겸손·정의·희생·영성·용맹 마을 낮은 땅(`g/p/t/c`)로 변환, 건축물 납부 `.` 유지, `check:content`·`test:unit`·`typecheck` 통과, 스크린샷 검증 | `scripts/assets/migrate-town-ground.py`, `content/towns/*/maps.yaml`, `docs/screenshots/2026-10-29-town-*.png` | 완료 |

## 진행 중
- (없음) 형식: `- <ID> · <에이전트 이름> · <브랜치> · <시작 시각> · <한 줄 상태>`
- 끝나면 이 줄을 지우고 위 표의 상태를 "완료(<커밋>)"로 바꾼다.
- 중간에 끊긴 작업: 줄을 남기고 `⚠ 중단: <어디까지 했는지>`를 붙인다.

## 생성 도구 메모
- **PixelLab**: 사용자 설정 MCP. 체험 40회 소진 → 하루 보너스(+5, 최대 20). **동시 1작업**. `get_balance`·`wait_for_jobs` 무료. 화풍 고정값·프롬프트 `assets/generated/prompts/2026-10-18-R1-trial.md`. 손에 소품 든 인물은 `skeleton-v3` 걷기(3회/방향) → `scripts/visual/crop-canvas.mjs 48`.
- **맞춤법 MCP**: `korean-spell`(npx @winterjung/mcp-korean-spell, 네이버 검사기) 사용자 설정에 설치. 노이즈 많음(띄어쓰기·흔한 오타 보조용). 일괄 검사 `scripts/narrative/spellcheck.py <키 접두어>`. Hangul-MCP는 서버 응답 변경으로 동작 안 해 제거.
- **ElevenLabs**: CLI 로그인됨(free). 사용자 결정(2026-10-27): **비상업 개인 개발용으로 효과음 생성 허용** → `assets-private/elevenlabs/sfx/`(git 제외, 배포·커밋 금지) 35개. 음악은 무료 요금제 불가(paid_plan_required). 상세 `docs/research/elevenlabs-sfx.md`.
- 토큰·로그인 정보는 저장소에 두지 않는다(`key.txt`는 `.gitignore`, 파일 삭제 권장).

## 자산 실험실
- `npm run dev` → http://localhost:5173/hollow-codex/lab/ (개발 전용). **시야 15×11/11×7/9×6칸 + 배율 ×2~×4 버튼**(플레이어를 따라가는 카메라). 방향키 걷기, 바닥별 발걸음, 효과음·배경음악 청취·선택("선택 결과 복사"). 후보 소리는 `assets-private/preview/`(git 제외). 검사 `node scripts/visual/lab-check.mjs <out-prefix>`.

## ⚠ 같은 폴더 여러 에이전트
- 2026-10-18 Codex가 이 작업 폴더에서 `todo-1-walk-review`로 checkout한 뒤, 다른 에이전트(Claude)가 그 사실을 모르고 커밋 12개를 그 브랜치에 쌓고 `git push origin main`만 해서 원격에 안 올라감 → 2026-10-19 fast-forward로 main에 반영(e97a1d7).
- **규칙**: 커밋 전 `git branch --show-current` 확인. 푸시는 `git push origin HEAD:<브랜치>`로 현재 브랜치를 명시. 다른 에이전트와 동시에 작업하면 각자 `git worktree`를 쓴다.

## 알려진 한계 (2026-10-29)
- 그림: 건물은 지붕 없는 벽 블록, 기본형 인물 7종·걷기 그림·마을색 변형·애니메이션 NPC 없음(PixelLab 잔액 0). 소리: 직접 듣지 못함(🧑).
- 호위(escort)·증원 목표 구현(2026-10-30, 연습장 `enc.arena.escort`·`ambush`, 이야기 조우엔 아직 안 씀). 7개 미덕 마을 전투는 적 2~3명으로 재배치(2026-10-30, 들판 늑대·서고 도적은 시나리오 수순 때문에 그대로). 상세 `README.md` 알려진 한계, `docs/handoff.md` 끝.

## 마지막 게이트
oc/fx-tracking-tests (2026-10-29): npm run test:unit 0 (558 passed) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0.
todo-2-art-audio-engine (2026-10-29): npm run test:unit 0 (613 passed) · typecheck 0 · check:content 0 · build 0 · audit:dist 0.
main `d600c74` (2026-10-18): npm ci 0 · test:unit 0 (384 passed, 66 files) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0. 이후 커밋은 문서·자산·lab·scripts/visual만(매번 check:content 0).
