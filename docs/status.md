# 현재 상태 (status.md)

> 규칙: 이 파일은 **짧게, 항상 최신으로** 유지한다(60줄 이내). 작업을 시작할 때 "진행 중"에 이름을 올리고, 끝날 때 결과를 반영해 덮어쓴다. 자세한 기록은 `docs/handoff.md` 끝에 추가한다.

최종 갱신: 2026-10-18 · 버전 0.1.0 (배포 중, 사용자 판정: 그래픽·소리 "방향 수정")

## 지금 단계
R-1 생성 시범 진행 중(PixelLab MCP 연결됨). 플레이어 **이방인 B(순례 코트+가방)** 사용자 선택, 4방향 걷기 완료. 결과·배운 것: `docs/research/art-generation-trial.md`.

## 다음 할 일 (위에서부터)
| ID | 할 일 | 산출물 | 상태 |
|---|---|---|---|
| 🧑 | 풀↔흙길 타일셋 선택(추천 v3) — `docs/screenshots/2026-10-18-R1-tileset-candidates.png` | 채팅 | 대기 |
| 🧑 | 그림 제작 계획 확인(`docs/research/art-production-plan.md` §6: 사람 나누기, 크리처 표현, 순서, **유료 요금제**, 초상화) | 문서 의견란 | 대기 |
| R-1a | 풀↔물+다리(같은 풀로 연결) | `assets/sprites/tilesets/` | 타일셋 선택 뒤 |
| R-1b | 칼라스 시범 나머지(계획 §5: 엘린+걷기·늑대·니아·고발관장·고백석·집 ≈10회, 남은 22회) | `assets/sprites/` | 대기 |
| R-1c | 칼라스 광장 목업 스크린샷 → 🧑 화풍 판정 | `docs/screenshots/` | R-1a·b 뒤 |
| 🧑 | R-0 아트 방향 의견(`docs/research/art-direction.md` §5) — 규격 48px 캔버스는 시범으로 확인됨 | 문서 의견란 | 대기 |
| 🧑 | 생성 그림 라이선스: 추천안 **CC-BY-SA-4.0 + AI 생성 표기**로 장부 기록함. 다르게 하려면 알려 주기 | `assets/LEDGER.md` | 추천안 적용 |
| R-2 | 실제 악기 녹음 공개 라이선스 음원·효과음 조사 | `docs/research/audio-assets.md` | 대기 |
| S | 그래픽·소리 재설계 문서 | `docs/superpowers/specs/` | R 끝난 뒤 |
| R-0 / A-1 | 아트 방향 제안 / 그림 인벤토리 | `art-direction.md` / `pixel-art-plan.md` | 완료 |

## 진행 중
- R-1 이동 검토 · Codex · todo-1-walk-review · 2026-10-18 · 시작: 최종 영상·16프레임 확인, 순간이동 경로 수정

- 형식: `- <ID> · <에이전트 이름> · <브랜치> · <시작 시각> · <한 줄 상태>`
- 끝나면 이 줄을 지우고 위 표의 상태를 "완료(<커밋>)"로 바꾼다.
- 중간에 끊긴 작업: 줄을 남기고 `⚠ 중단: <어디까지 했는지>`를 붙인다.

## PixelLab 사용 메모
- 연결: 사용자 설정(`claude mcp get pixellab` → User config). 새 세션에서 도구가 안 보이면 `/mcp`에서 다시 연결.
- 체험판: **동시 1작업** → 방향마다 따로 요청. `get_balance`·`wait_for_jobs`는 무료. 생성 전 남은 횟수 확인.
- 토큰은 저장소에 두지 않는다(`key.txt`는 `.gitignore`; 파일 삭제 권장).
- 생성물은 저장 → 장부(`assets/LEDGER.md`) → 프롬프트(`assets/generated/prompts/`) 순으로 기록.

## 화면 확인 (AGENTS.md §9.1)
- 이미지·영상은 **최종 파일 자체**를 검사하고 열어 본 뒤 보여 준다. 영상: `node scripts/visual/verify-video.mjs <영상> --out <폴더>`. 데모 녹화: `scripts/visual/walk-demo.mjs`.

## 알려진 한계 (0.1.0)
- 그래픽: 검은 사각형, 추정 타일 번호, 16×16 → 0.2.0에서 교체. 소리: 단음 칩 합성 → 녹음 음원으로 교체.
- 열석 순간이동이 실제 플레이에서 열리지 않음. 동료 1/8, 능력 1/7만 효과. 에필로그가 위기 풀이를 반영하지 않음.

## 마지막 게이트
main `b17ee6d`: npm ci 0 · test:unit 0 (384 passed) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0.
main `d600c74` (2026-10-18): npm ci 0 · test:unit 0 (384 passed, 66 files) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0.
