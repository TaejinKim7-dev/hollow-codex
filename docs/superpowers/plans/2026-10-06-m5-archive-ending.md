# M5 — 봉인 서고 + 빈 경전 엔딩 구현 계획

작성 시각: 2026-10-06 (M4 완료 직후). 사용자 확인 없이 진행. 브랜치: `todo-6-archive`.

## 1. 목표 (M5 완료 기준)

> spec §8 — "처음부터 끝까지 완주" — 플레이어가 (a) 봉인된 서고에 들어가고 (b) 8개 미덕의 답을 빈 경전에 한 단어씩 적고 (c) 마지막 장 "세 원리를 아우르는 하나"에 답을 적으면 (d) 선택한 답(진실·용기·사랑 중 하나 또는 그 변형)에 따라 마을 에필로그가 달라진다.

## 2. 스펙과 다르게 정한 점

| # | 결정 | 근거 |
|---|---|---|
| D1 | 봉인 서고 입구 = 오버월드 중앙 원형의 일부 (정확히는 spec §3.1의 "원래의 빈 경전은 봉인된 서고에 잠들어 있다" — 칼라스의 고리 안쪽에 일일이 등장) | M2에서 칼라스 고리 안쪽 중앙에 봉인석 1개를 미리 심음. 고리가 8개 모두 해금되면 봉인석이 깨어남. |
| D2 | 봉인 서고 내부 = 16×20, 중앙 제단 + 8쪽 알코브 | spec §3.3 step 5 "봉인된 서고에서 빈 경전을 펼친다" 시각화. |
| D3 | 8쪽 슬롯 각각은 "이 미덕이 진짜로 무엇인지"에 대한 한 단어 — 정답은 이미 추론 3칸에서 확정된 그 미덕의 첫 단어 (예: 정직=`word.truth`). | 추론과 결속. |
| D4 | 마지막 장의 답 = 플레이어가 가진 `word.truth`/`word.love`/`word.courage` 중 하나를 선택. | spec §3.3 step 5 "세 원리를 아우르는 하나" = 진실·사랑·용기 중 하나. |
| D5 | 에필로그 = 3종 (진실 우선 / 사랑 우선 / 용기 우선) — 선택한 단어에 따라 마을 NPC들의 설명 메시지가 달라짐. | spec §3.3 "에필로그가 달라진다". |
| D6 | 봉인 서고 진입에는 flag 조건 — `state.rings.visited.length >= 7` (또는 모든 고리가 영구히 잠금 해제). | 8개 고리 모두 발자국을 남긴 후 봉인이 풀림. |
| D7 | 봉인 서고는 전투 없음 — 순수 내러티브 공간. | spec §4.5 "전투는 적고 예고형" — 엔딩에 전투는 어울리지 않음. |
| D8 | 난이도 조정: 적 hp -1 (M1이 너무 시니어 7로 잡힘); 도주 확률 표기; 스쳐가기 시 명시 — 별도 코드 변경은 적음. | spec §4.5 "무작위성은 최소화" — 그냥 적 hp만 낮춤. |
| D9 | 봉인석은 M2에서 이미 칼라스 고리 안에 1개 심어놓음 — Task 42가 그것을 깨어남 트리거로 사용. | M2 대륙 지도 작업 시 고리 내부에 `o` 외에 봉인석을 어떻게 표시했는지 검증. |

## 3. 교차 규칙

| # | 내용 |
|---|---|
| D10 | 봉인 서고 맵은 단일 진입점 + 알코브 8개 + 중앙 제단 + 출구 1개. |
| D11 | 각 알코브에는 플레이어가 미덕 정답 단어 (이미 추론 확정한 것)를 적음 — 적으면 `state.codexAnswers[deductionId] = wordId`. |
| D12 | 8쪽 모두 적히면 마지막 장이 열림 — `state.codexFinalOpen = true`. |
| D13 | 마지막 장의 답 = `word.truth`/`word.love`/`word.courage` 중 하나 선택. 선택 시 `state.codexFinal = chosenWordId` 설정 + `crisis.epilogue` 결정. |
| D14 | `state.codexAnswers`, `state.codexFinal`, `state.codexFinalOpen` 모두 GameState에 추가 (M2 type 기반). |
| D15 | `Command`에 추가: `{ type: "writeCodex"; deductionId; word }`, `{ type: "writeFinal"; word }`. |
| D16 | `GameEvent`에 추가: `codexWritten { deductionId; word }`, `codexFinalChosen { word }`, `epilogue { kind }`. |
| D17 | 봉인석 깨어남은 M2 시대 진입 시(overworld mapChanged 이벤트에서 rings.visited ≥ 7 이면) 자동 — 별도 명령 불필요. |
| D18 | `serialize.ts` (Task 30 v2): 새 필드(time, rings, codexAnswers, codexFinal, codexFinalOpen) 검사 추가. |

## 4. 핵심 매트릭스

| 미덕 | 빈 경전 1쪽 답 |
|---|---|
| 정직 | `word.truth` |
| 연민 | `word.love` |
| 용맹 | `word.courage` |
| 정의 | `word.truth` (또는 미덕 고유 단어; M3 정의의 answer=truth/fairness/love, 첫=truth) |
| 희생 | `word.devotion` (또는 첫 단어) |
| 명예 | `word.honor` |
| 영성 | `word.truth` (첫 단어) |
| 겸손 | `word.silence` (첫 단어) |

| 마지막 장 답 | 에필로그 종류 | 마을 NPC 메시지 톤 |
|---|---|---|
| `word.truth` | 에필로그 진실 | 마을들이 서로의 진실을 마주 봄 — 경전은 비어 있지만 말은 사실 |
| `word.love` | 에필로그 사랑 | 마을들이 서로의 연민을 나눔 — 함께하는 삶이 미덕의 뿌리 |
| `word.courage` | 에필로그 용기 | 마을들이 두려움을 넘어섬 — 다시 걸을 힘 |

## 5. Task 목록 (Task 42 ~ Task 44)

**Phase 1 (2개 병렬)**
- **Task 42** — 봉인 서고 + 빈 경전 인터페이스 — 맵 + 진입 + 8쪽 슬롯 + 마지막 장 UI
- **Task 43** — 에필로그 + 난이도 조정 — 3종 에필로그 + 적 hp 조정

각 task의 작업:
1. **Task 42**:
   - `content/towns/sealed-archive/maps.yaml` (NEW) — 16×20 봉인 서고.
   - `src/core/codex/codex.ts` (NEW) — 봉인석 깨어남 + 8쪽 쓰기 + 마지막 장.
   - `src/core/types.ts` 수정 — `codexAnswers`, `codexFinal`, `codexFinalOpen` 추가 (M5 type 기반 — GameState v2 그대로 확장). `Command.writeCodex`, `Command.writeFinal`, `GameEvent.codexWritten`, `codexFinalChosen`, `epilogue` 추가.
   - `src/core/state.ts` 수정 — 초기값 `codexAnswers: {}, codexFinal: null, codexFinalOpen: false`.
   - `src/core/step.ts` 수정 — 봉인석 깨어남 자동 트리거 + `writeCodex`/`writeFinal` 라우팅.
   - `src/core/world/ring.ts` 또는 `src/core/world/overworld.ts` 수정 — 봉인석 깨어남 (M2 overworld entry trigger에 추가).
   - `src/core/save/serialize.ts` 수정 — `codexAnswers`, `codexFinal`, `codexFinalOpen` shape 검사.
   - `src/ui/panels.ts` 수정 — 빈 경전 인터페이스 (8쪽 슬롯 + 마지막 장 선택 + 닫힌 에필로그 화면).
   - `tests/unit/core/codex.test.ts` (NEW) — 8쪽 쓰기 / 마지막 장 / 깨어남 트리거.
   - `content/strings/ko.yaml` — `archive.*` 키 추가 (맵 이름·NPC명·깨어남 메시지·페이지마다·마지막·에필로그·UI 키).

2. **Task 43**:
   - `src/core/epilogue/epilogue.ts` (NEW) — `selectEpilogue(finalWord): EpilogueKind`, 3종 에필로그 정의 (각종 마을 NPC의 마지막 메시지 변형).
   - `src/core/combat/grid.ts` 또는 `src/content/creatures.yaml` 수정 — 모든 creature hp -1 (M5 난이도 완화).
   - `content/strings/ko.yaml` — `epilogue.*` 키 추가 (3종 에필로그 텍스트 — 마을별로 어떤 말이 나오는지).
   - `tests/unit/core/epilogue.test.ts` (NEW) — `selectEpilogue(word.truth) === "truth"`, `word.love` → `"love"`, `word.courage` → `"courage"`.

**Phase 2 (Task 44, 1 에이전트)**
- **Task 44** — M5 시나리오 + 통합 + 머지
  1. `tests/scenario/m5-archive.test.ts` (NEW) — 봉인 서고까지 traversal + 8쪽 쓰기 + 마지막 장 + 각 에필로그.
  2. merge 게이트 (7개 명령) exit 0.
  3. `docs/handoff.md`에 M5 완료 절 추가.
  4. main ff-merge·push → Pages 200 확인.

총 **3 Task** (42~44). Phase 1에서 2개 동시 실행.

## 6. 머지 게이트

```bash
npm ci
npm run test:unit
npm run typecheck
npm run check:content
npm run build
npm run audit:dist
git diff --check
```

전부 exit 0.

## 7. 사용자 확인 없이 진행

본 계획은 사용자 명시적 확인("앞으로 내 확인부터 받지 말고 계속 진행해")을 받아 진행. M5 Task별 결과는 handoff와 커밋으로만 확인.