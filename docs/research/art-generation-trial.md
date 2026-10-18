# R-1 픽셀 아트 생성 시범 (PixelLab MCP)

작성: 2026-10-18 · 상태: **진행 중** (이방인 확정, 타일셋 재생성 필요, 칼라스 나머지 미착수)
근거: `docs/plan.md` R-1, `docs/research/art-direction.md`(R-0). 프롬프트 원문: `assets/generated/prompts/2026-10-18-R1-trial.md`.

## 연결과 요금
- MCP: `pixellab` (HTTP, `https://api.pixellab.ai/mcp`, 사용자 설정 `-s user`; 토큰은 저장소에 없음). Claude Code 2.1.302.
- 요금제: 체험판 40회. 2026-10-18 기준 약 18회 사용, 22회 남음. 남은 횟수는 `get_balance`(무료)로 확인.
- 제약: **동시 작업 1개** → 걷기 애니메이션은 방향마다 따로 요청(`animation_group_id`로 묶음). 작업 대기는 `wait_for_jobs`(무료).
- 다운로드: 결과 URL은 인증 없이 받을 수 있음(UUID가 열쇠). 타일셋은 `/mcp/tilesets/{id}/image?inline=true`, `/metadata`.

## 확인된 규격
| 항목 | 결과 |
|---|---|
| 캐릭터 `create_character` standard, `size=32` | 몸 약 32px, **48×48 캔버스** RGBA 투명 PNG — R-0 제안(32px 타일 + 48px 캔버스)과 일치 |
| v3 모드 `size=48` | 48×48, 8방향, 2회 |
| 걷기 `animate_character` template `walking-4-frames` | 방향당 4프레임 48×48, 1회/방향 |
| 타일셋 `create_topdown_tileset` 32px, transition 0.25 | 128×128 시트(16타일), metadata에 타일별 corners(NW/NE/SW/SE)·bounding_box — 모서리 기반 자동 타일이 그대로 동작 |

## 결과
| 대상 | ID | 파일 | 판정 |
|---|---|---|---|
| 이방인 A (두건 망토) | 55556722… | `assets/sprites/characters/stranger/` | 후보(미선택) |
| **이방인 B (순례 코트+가방)** | e318585f… | `assets/sprites/characters/stranger-B/` (4방향 + 걷기 4×4) | **사용자 선택 2026-10-18** |
| 이방인 C (등불 망토, v3 8방향) | 7365832e… | `assets/sprites/characters/stranger-C/` (4방향만 저장) | 후보(미선택) |
| 풀↔흙길 타일셋 v1 | 5e6ffa24… | `assets/sprites/tilesets/grass-path/` | **불합격**: 형광 초록 단색, 흙 무늬 반복, 거친 검은 테두리. 연결은 정상 |
| 풀↔흙길 v2 | ae2d9e94… | `…/grass-path-v2/` | 풀색 개선, 길이 분홍 벽돌 격자 — 보류 |
| **풀↔흙길 v3** (round 경계) | 655f8b62… | `…/grass-path-v3/` | **확정(사용자 2026-10-18)**: 차분한 올리브 풀, 구불거리는 부드러운 경계. 비교: `docs/screenshots/2026-10-18-R1-tileset-candidates.png` |
| **이방인 B-navy** | (B 색 변경) | `assets/sprites/characters/stranger-B-navy/` | **플레이어 확정(사용자 2026-10-18)**: v3 위에서 가장 또렷함. 비교 `2026-10-18-R1-stranger-colors.png` |

| 풀↔물 | 2cddcbe0… | `…/grass-water/` | v3 풀과 연결됨. 물가 자갈 자줏빛·물속 주황 점 반복은 아쉬움 |
| 다리 | f0238faf… | `assets/sprites/objects/bridge/bridge-long.png` (160×64) | 사용. 짧은 96×48 판은 길과 안 닿아 보류 |

장면 목업: `scripts/visual/scene-preview.mjs`(땅 층 → 물건 층 → 캐릭터 층). 두 Wang 세트는 한 칸에 흙길과 물을 함께 둘 수 없어 사이에 풀 한 줄이 생긴다 → 다리를 5칸으로 길게 만들어 덮음. 장면 정의: `docs/screenshots/scenes/2026-10-18-R1-scene-river.json`.

후처리: B의 `walk-east/3.png`에만 지팡이(노란 머리)가 그려져 걸을 때 번쩍임 → 지팡이·손 픽셀을 지움(생성 0회). B는 프롬프트의 지팡이를 대부분 그리지 않았다.

화면 확인(AGENTS.md §9.1): `docs/screenshots/2026-10-18-R1-candidates.png`(후보 비교), `2026-10-18-R1-walk-demo.webm`(15×11칸 ×2 배율, 십자 길을 걷는 B) — `scripts/visual/verify-video.mjs` 통과, 5초 프레임 직접 확인: 캐릭터가 길 위를 걷고 타일이 이어짐.

## 배운 것
- 기본 모드는 스타일 지시(외곽선·음영)를 "느슨하게" 따른다. B처럼 `stylized` 비율 + `selective outline` + `detailed shading`이 더 요즘 느낌.
- 프롬프트의 소품(지팡이)은 빠지거나 일부 프레임에만 나올 수 있다 → 걷기 프레임을 확대해 검사하고, 필요하면 픽셀 편집.
- 타일셋은 색 지시가 약하다 → 다음 시도는 `mode=pro` + `palette`(R-0 팔레트) 또는 `max_colors`로 색을 묶는다(pro는 15회라 체험판에서는 1번이 한계).

## 다음
1. 풀↔흙길 v3 확정(🧑) → 같은 풀(`upper_base_tile_id`=v3 풀 42c76fdc…)로 풀↔물(+다리)을 이어 만든다.
   - 다음 그릴 목록과 스토리 기준 제작 계획: `docs/research/art-production-plan.md`.
2. 칼라스 시범 나머지(`art-direction.md` §4): 니아, 고발관장, 엘린, 토비, 늑대, 열석 고리, 고백석+깨진 등불, 집, 나무·덤불. 남은 약 25회로는 전부 어렵다 → 우선순위: 엘린·니아·늑대·고백석·집.
3. 목업 스크린샷(칼라스 광장) → 🧑 화풍 판정.
