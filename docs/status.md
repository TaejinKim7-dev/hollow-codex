# 현재 상태 (status.md)

> 규칙: 이 파일은 **짧게, 항상 최신으로** 유지한다(60줄 이내). 작업을 시작할 때 "진행 중"에 이름을 올리고, 끝날 때 결과를 반영해 덮어쓴다. 자세한 기록은 `docs/handoff.md` 끝에 추가한다.

최종 갱신: 2026-10-18 · 버전 0.1.0 (배포 중, 사용자 판정: 그래픽·소리 "방향 수정")

## 지금 단계
`docs/plan.md` §3 결정(2026-10-18): 그래픽은 **생성 MCP(PixelLab)로 자체 제작**. R-0 아트 방향 제안이 사용자 의견을 기다린다.

## 다음 할 일 (위에서부터)
| ID | 할 일 | 산출물 | 상태 |
|---|---|---|---|
| 🧑 | 사용자: R-0 아트 방향 의견(`docs/research/art-direction.md` §5 체크) | 문서 의견란 또는 채팅 | 대기 |
| 🧑 | PixelLab 연결 | `claude mcp list` ✔ | 완료(2026-10-18) |
| 🧑 | 사용자: 생성 그림 라이선스 표기(추천 CC-BY-SA-4.0 + AI 생성 표기) → 결정 뒤 `assets/sprites/` 커밋 | 장부 | 대기 |
| R-1 | 생성 시범: 이방인 B 확정·걷기 완료, 타일셋 재생성, 칼라스 나머지 | `assets/sprites/`(로컬) + `docs/screenshots/2026-10-18-R1-*` | 진행 중 |
| R-2 | 실제 악기 녹음 공개 라이선스 음원·효과음 조사 | `docs/research/audio-assets.md` | 대기(음원도 생성할지 사용자 확인 필요) |
| A-1 | 시나리오 근거 그림 인벤토리(R-0 부록) | `docs/research/pixel-art-plan.md` | 완료 |
| R-0 | 아트 방향 제안(규격·화풍·목록) | `docs/research/art-direction.md` | 완료(f348935) |
| R-1旧 | 공개 라이선스 픽셀 아트 조사 | `docs/research/art-assets.md` | 완료(6bdbf18) — 생성 방향으로 대체, 화풍 참고용 |
| S | 그래픽·소리 재설계 문서 | `docs/superpowers/specs/` | 사용자 확정 뒤 |

## 진행 중
(없음)

- 형식: `- <ID> · <에이전트 이름> · <브랜치> · <시작 시각> · <한 줄 상태>`
- 끝나면 이 줄을 지우고 위 표의 상태를 "완료(<커밋>)"로 바꾼다.
- 중간에 끊긴 작업: 줄을 남기고 `⚠ 중단: <어디까지 했는지>`를 붙인다.

## MCP 연결 (사용자가 한 번만)
- PixelLab: `claude mcp add --transport http pixellab https://api.pixellab.ai/mcp --header "Authorization: Bearer <토큰>"` (토큰: https://www.pixellab.ai/vibe-coding). 다른 에이전트는 각자의 MCP 설정 방법으로 같은 주소·헤더를 넣는다.
- 토큰이 든 설정은 사용자 설정에만 둔다. 저장소의 `.mcp.json`에 토큰을 넣지 않는다.
- 연결 확인: 에이전트가 PixelLab 도구 목록(`create_character` 등)을 볼 수 있으면 됨.

## 막힌 것 / 사용자 확인 필요
- 사용자가 직접 보고 들은 판정 없이는 그래픽·소리 작업을 완료로 적지 않는다.
- 이전 조사 시도 2회는 에이전트 사용량 한도(HTTP 429)로 결과 없이 끝났으나, 세 번째 시도(Codex)에서 R-1 완료(6bdbf18). R-2는 미착수.

## 알려진 한계 (0.1.0, 자세한 내용은 README "알려진 한계")
- 그래픽: 검은 사각형(땅 층 없음), 추정 타일 번호, 16×16 단순 화풍 → 0.2.0에서 교체.
- 소리: 단음 칩 합성 → 0.2.0에서 녹음 음원으로 교체.
- 열석 순간이동이 실제 플레이에서 열리지 않음. 동료 8명 중 1명, 능력 7개 중 1개만 효과. 에필로그가 위기 풀이를 반영하지 않음.

## 마지막 게이트
main `b17ee6d`: npm ci 0 · test:unit 0 (384 passed, 66 files) · typecheck 0 · check:content 0 · build 0 · audit:dist 0 · git diff --check 0.
