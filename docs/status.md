# 현재 상태 (status.md)

> 규칙: 이 파일은 **짧게, 항상 최신으로** 유지한다(60줄 이내). 작업을 시작할 때 "진행 중"에 이름을 올리고, 끝날 때 결과를 반영해 덮어쓴다. 자세한 기록은 `docs/handoff.md` 끝에 추가한다.

최종 갱신: 2026-10-27 · 버전 0.1.0 (배포 중, 사용자 판정: 그래픽·소리 "방향 수정") · 0.2.0 자산 준비 중

## 지금 단계
R(자산 방향) 진행 중. 그림은 PixelLab 생성, 소리는 CC0/CC-BY/CC-BY-SA 공개 음원만(사용자 결정 2026-10-19, ElevenLabs 안 씀).
확정: 플레이어 **이방인 B-navy**, 동료 **엘린 B**(4방향 걷기), 땅 **풀↔흙길 v3**·**풀↔물**, **긴 다리**, **효과음 14종**(`assets/audio/sfx/`).
2026-10-27 추가: 칼라스 인물 10명+늑대(걷기)+고백석+집+나무(`docs/research/art-kalas-cast.md`).

## 다음 할 일 (위에서부터)
| ID | 할 일 | 산출물 | 상태 |
|---|---|---|---|
| R-2a2 | 효과음 추가 14상황(게임 이벤트 중 소리 없는 것: 맵 이동·전투 시작·방어·설득·도주·승리·패배·동료 합류/이탈·열석 열림·능력·위기·경전 쓰기·에필로그) 후보 53개를 실험실에 올림 → 🧑 청취·선택 → `assets/audio/sfx/` | 실험실 `/hollow-codex/lab/` | 후보 준비됨(2026-10-27), 선택 대기 |
| R-2a3 | ElevenLabs 효과음 35개(늑대·열석·전투·이벤트·분위기 루프) 생성 완료, 🧑 실험실에서 청취·판정 | `docs/research/elevenlabs-sfx.md` | 완료(청취 대기) |
| R-2b | 배경음악 후보 24곡(12슬롯×A/B, Kevin MacLeod CC BY 4.0) 받아서 실험실에 올림 → 🧑 청취·선택, CC BY 표기 허용 여부. 방법 정리 `docs/research/music-plan.md` | `docs/research/bgm-candidates.md` | 후보 준비됨(2026-10-27) |
| R-1b | 칼라스 인물 10명+늑대(걷기 포함)+고백석+집+나무 **완료**(2026-10-27). 남은: 🧑 집 시점 판정, 고백관·문지기 색 조정, NPC 걷기 | `docs/research/art-kalas-cast.md`, 목업 `docs/screenshots/2026-10-27-R1b-kalas-cast-scene.png` | 완료(판정 대기) |
| R-1d | 칼라스 **맵 그림**(풀↔돌바닥, 서고 바닥·벽, 외벽·성문·건물, 계단, 나무 변형 ≈15회, 하루 +5회로 3일) → `docs/research/art-kalas-maps.md`. 열석 고리 물건은 완성 | `assets/sprites/` | 다음(하루 보너스 대기) |
| R-1c | 칼라스 광장 목업 → 🧑 화풍 판정 | `docs/screenshots/2026-10-27-R1b-kalas-cast-scene.png` | 🧑 확인 대기 |
| 🧑 | 문지기 색: 원본(짙은 녹색) vs `gatekeeper-field-grey`(청회색, 풀 위에서 또렷) 선택. 집·열석 고리의 비스듬한 시점을 그대로 쓸지(`art-kalas-maps.md` 끝) 판정 | 채팅 | 대기 |
| 🧑 | 확인 대기: 그림 제작 계획 §6(`art-production-plan.md`), 아트 방향 §5(`art-direction.md`), 강·다리 목업, 엘린 걷기 영상 | 문서 의견란 | 대기 |
| S | 그래픽·소리 재설계(층 렌더링, Wang 자동 타일, 걷기, 소리 id→파일, 배포 용량) | `docs/superpowers/specs/` | R 끝난 뒤 |
| 완료 | R-0 아트 방향, A-1 인벤토리, R-1a 풀↔물·다리, 엘린 걷기, R-2 소리 방침(`audio-assets.md`), R-2a 효과음 | 각 문서·자산 | 완료 |

## 진행 중
- R-1 이동 검토 · Codex · todo-1-walk-review · 2026-10-18 · 시작: 최종 영상·16프레임 확인, 순간이동 경로 수정

- 형식: `- <ID> · <에이전트 이름> · <브랜치> · <시작 시각> · <한 줄 상태>`
- 끝나면 이 줄을 지우고 위 표의 상태를 "완료(<커밋>)"로 바꾼다.
- 중간에 끊긴 작업: 줄을 남기고 `⚠ 중단: <어디까지 했는지>`를 붙인다.

## 생성 도구 메모
- **PixelLab**: 사용자 설정 MCP. 체험 40회 소진 → 하루 보너스(+5, 최대 20). **동시 1작업**. `get_balance`·`wait_for_jobs` 무료. 화풍 고정값·프롬프트 `assets/generated/prompts/2026-10-18-R1-trial.md`. 손에 소품 든 인물은 `skeleton-v3` 걷기(3회/방향) → `scripts/visual/crop-canvas.mjs 48`.
- **ElevenLabs**: CLI 로그인됨(free). 사용자 결정(2026-10-27): **비상업 개인 개발용으로 효과음 생성 허용** → `assets-private/elevenlabs/sfx/`(git 제외, 배포·커밋 금지) 35개. 음악은 무료 요금제 불가(paid_plan_required). 상세 `docs/research/elevenlabs-sfx.md`.
- 토큰·로그인 정보는 저장소에 두지 않는다(`key.txt`는 `.gitignore`, 파일 삭제 권장).

## 자산 실험실
- `npm run dev` → http://localhost:5173/hollow-codex/lab/ (개발 전용). 방향키 걷기, 바닥별 발걸음, 효과음·배경음악 청취·선택("선택 결과 복사"). 후보 소리는 `assets-private/preview/`(git 제외). 검사 `node scripts/visual/lab-check.mjs <out-prefix>`.

## 화면 확인 (AGENTS.md §9.1)
- 이미지·영상은 **최종 파일 자체**를 검사하고 열어 본 뒤 보여 준다. 도구 `scripts/visual/`(verify-video, scene-preview, tileset-preview, character-sheet, walk-strip, party-demo, recolor, crop-canvas, drop-specks, lab-check).

## ⚠ 같은 폴더 여러 에이전트
- 2026-10-18 Codex가 이 작업 폴더에서 `todo-1-walk-review`로 checkout한 뒤, 다른 에이전트(Claude)가 그 사실을 모르고 커밋 12개를 그 브랜치에 쌓고 `git push origin main`만 해서 원격에 안 올라감 → 2026-10-19 fast-forward로 main에 반영(e97a1d7).
- **규칙**: 커밋 전 `git branch --show-current` 확인. 푸시는 `git push origin HEAD:<브랜치>`로 현재 브랜치를 명시. 다른 에이전트와 동시에 작업하면 각자 `git worktree`를 쓴다.

## 알려진 한계 (0.1.0)
- 그래픽: 검은 사각형, 추정 타일 번호, 16×16 → 0.2.0에서 교체. 소리: 단음 칩 합성 → 녹음 음원으로 교체.
- 열석 순간이동이 실제 플레이에서 열리지 않음. 동료 1/8, 능력 1/7만 효과. 에필로그가 위기 풀이를 반영하지 않음.

## 마지막 게이트
main `b17ee6d`: npm ci 0 · test:unit 0 (384 passed) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0.
main `d600c74` (2026-10-18): npm ci 0 · test:unit 0 (384 passed, 66 files) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0. 이후 커밋은 문서·자산·lab·scripts/visual만(매번 check:content 0).
