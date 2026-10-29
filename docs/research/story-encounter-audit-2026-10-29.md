# 이야기 조우 난이도 감사 (2026-10-29)

**목적**: 8개 마을의 이야기 조우 9개에 대해 현재 자동 대전 난이도를 측정하고, 의존하는 시나리오 수순을 정리한 뒤, C-5 계획의 재배치 기준에 맞는 제안을 남긴다.  
**범위**: 읽기 전용 조사. 코드·콘텐츠는 고치지 않는다. 제안은 `docs/research/story-encounter-audit-2026-10-29.md`에만 기술한다.  
**도구**: `node scripts/sim/combat-sim.ts enc.` — 난수 없는 결정적 탐욕 정책. 플레이어 hp 12, 공격 3. 동료 열은 훈련 교관(hp 8, 공격 3)을 데려간 경우.

## 자동 대전의 결정적 승률에 대한 참고

`scripts/sim/combat-sim.ts`는 난수를 쓰지 않고 동일한 탐욕 정책을 1회만 실행한다. 따라서 한 조우의 결과는 `victory`/`defeat`/`stalled` 중 하나이며, **이 정책상 승률은 100% 또는 0%**다. 표 A의 "승률" 열은 이 사실을 명시한다.  
C-5 계획에서 말하는 "동료 없이 자동 대전 승률 55~75%"는 본 문서에서 **예상 안정도(잔여 hp 비율이나 합리적인 플레이어의 성공 가능성)**로 해석한다. 탐욕 정책은 0% 또는 100%만 나오므로, 표 C의 "예상 결과"는 규칙·수치를 바탕으로 한 논리 추정이다. 실제 수치는 콘텐츠를 반영한 뒤 `combat-sim.ts`로 다시 재측정해야 한다.

## 표 A: 현재 난이도

`node scripts/sim/combat-sim.ts enc.` 실행 결과에서 8개 마을의 이야기 조우 9개만 추렸다. 칼라스 연습장 조우(`enc.arena.*`)는 이야기 조우가 아니므로 제외한다.

| 조우 id | 마을 | 크리처 구성(수/종) | 동료 없음 결과 | 라운드 | 플레이어 hp | 동료(교관) 있음 결과 | 라운드 | 플레이어 hp | 결정적 승률 |
|---|---|---|---|---|---|---|---|---|---|
| enc.compassion.robbers | 연민 | 2 / 도적 | victory | 3 | 12 | victory | 3 | 12 | 100% |
| enc.honor.duelist | 명예 | 1 / 자랑꾼 | victory | 2 | 9 | victory | 1 | 12 | 100% |
| enc.humility.silencer | 겸손 | 1 / 침묵자 | victory | 2 | 11 | victory | 1 | 12 | 100% |
| enc.justice.mourner | 정의 | 1 / 조문객 | victory | 2 | 11 | victory | 1 | 12 | 100% |
| enc.sacrifice.martyr | 희생 | 1 / 고행자 | victory | 2 | 11 | victory | 1 | 12 | 100% |
| enc.spirituality.fake-monk | 영성 | 1 / 가짜 스님 | victory | 1 | 10 | victory | 1 | 12 | 100% |
| enc.valor.duelist | 용맹 | 1 / 결투자 | victory | 2 | 9 | victory | 2 | 9 | 100% |
| enc.field.wolves | 칼라스 들판 | 3 / 늑대 | victory | 5 | 12 | victory | 5 | 12 | 100% |
| enc.archive.robbers | 칼라스 서고 | 2 / 도적 | victory | 3 | 9 | victory | 2 | 12 | 100% |

*"플레이어 hp"는 전투 종료 시 플레이어 잔여 체력(최대 12)이다. 동료 열의 hp 역시 플레이어 잔여 체력이다.*  
*평균을 낼 만한 분포가 아니므로(결정적 1회), 평균 라운드·평균 잔여 hp는 계산하지 않는다.*

### 요약

- 7개 미덕 마을 조우는 대부분 1~2라운드에 끝나고 플레이어 hp가 9~12로 거의 손해가 없다. **너무 쉽다.**
- 칼라스 들판(`enc.field.wolves`)은 5라운드 걸리지만 플레이어가 피해를 거의 입지 않는다(hp 12).
- 칼라스 서고(`enc.archive.robbers`)는 혼자서 hp 9로 조금 더 긴장감이 있다.
- 연습장 조우(`enc.arena.*`)는 더 넓은 난이도 곡선을 보이지만, 본 표에서는 제외했다.

## 표 B: 의존 목록

`tests/scenario/plans.ts`와 `tests/scenario/*.test.ts`를 `grep -rn "enc\." tests/scenario/`로 확인했다. 조우 id별 의존은 다음과 같다.

| 조우 id | 테스트 파일·테스트 이름 | plans.ts 항목 | 전투 명령열 | 기대 결과 |
|---|---|---|---|---|
| enc.compassion.robbers | 의존 없음 | — | — | — |
| enc.honor.duelist | 의존 없음 | — | — | — |
| enc.humility.silencer | 의존 없음 | — | — | — |
| enc.justice.mourner | 의존 없음 | — | — | — |
| enc.sacrifice.martyr | 의존 없음 | — | — | — |
| enc.spirituality.fake-monk | 의존 없음 | — | — | — |
| enc.valor.duelist | 의존 없음 | — | — | — |
| enc.field.wolves | `kalas-truth.test.ts` — "resolveCrisis option.truth, ledger-kept, no deeds" | `WOLF_PUSH_WIN` | `endTurn`, `endTurn`, `move(3,5)`, `push(e)`, `push(w)`, `move(4,6)`, `push(n)`, `move(1,6)`, `push(n)`, `move(3,5)`, `push(s)`, `move(2,5)`, `push(w)`, `move(1,5)`, `push(s)`, `push(w)` | 승리, 행실 없음, `clearedEncounters`에 포함 |
| enc.field.wolves | `kalas-rules.test.ts` — "(b) pushing wolves off the bridge wins without any deed" | `WOLF_PUSH_WIN` | 위와 동일 | 승리, `deeds` 빈 배열, `clearedEncounters`에 포함 |
| enc.field.wolves | `kalas-rules.test.ts` — "(b) killing a wolf records a compassion deed" | `WOLF_KILL` | `endTurn`, `endTurn`, `move(3,5)`, `attack(e)`, `attack(w)`, `attack(e)` | 승리, `deed.kill-innocent` 기록 |
| enc.field.wolves | `m2-traversal.test.ts` — "walks the Kalas round trip and a virtue-town round trip, ending on the overworld" | `WOLF_PUSH_WIN` | 위와 동일 | 승리, 행실 없음, 대륙 왕복 진행 |
| enc.archive.robbers | `kalas-lantern.test.ts` — "resolveCrisis option.lantern, ledger-burned, see-lies, robbers cleared" | `ROBBER_WIN` | `endTurn`, `move(3,3)`, `attack(n)`, `move(4,3)`, `attack(s)` | 승리, `clearedEncounters`에 포함 |

*참고: `tests/scenario/companions.test.ts`는 `enc.arena.wolves`를 쓰지만, 이는 연습장 조우이므로 위 이야기 조우 목록에는 넣지 않았다.*

## 표 C: 재배치 제안

**허용 변경**: 적 수, 적 배치(격자 위치), `creature.ai`(aggressive·cautious·skirmisher·pack·coward), `morale` 값. **새 병과나 새 크리처 종류는 금지**한다.  
**목표**: 동료 없이 플레이어 혼자서 합리적인 수순으로 약 55~75% 안정도(잔여 hp 6~9, 라운드 3~6)를 얻도록 조정.

| 조우 id | 변경 내용(정확한 값) | 예상 결과 | 깨뜨리는 의존 수순 | 수순 재풀이 필요 여부 |
|---|---|---|---|---|
| enc.compassion.robbers | 도적 1명 추가, 위치 `[3,1]`. 최종: `creature.robber`×3 — hp 4 / attack 3 / ai skirmisher / morale 4 / evil, 위치 `[1,0]`, `[3,1]`, `[5,0]`. | 추정: victory, 4~5라운드, 잔여 hp 3~6(25~50%). 인접한 3명에게 둘러싸이면 패배할 수 있어 합리적 플레이어의 예상 승률은 약 60~70%. | 없음 | 없음 |
| enc.honor.duelist | 자랑꾼 1명 추가, 위치 `[4,1]`. 최종: `creature.honor-braggart`×2 — hp 5 / attack 3 / ai skirmisher / morale 5 / evil, 위치 `[3,1]`, `[4,1]`. | 추정: victory, 3~4라운드, 잔여 hp 5~7(42~58%). 양쪽에서 동시에 맞으면 위험. 예상 승률 약 65%. | 없음 | 없음 |
| enc.humility.silencer | 침묵자 2명 추가, 위치 `[2,1]`, `[4,1]`. 최종: `creature.humility-silencer`×3 — hp 4 / attack 1 / ai cautious / morale 4 / not evil, 위치 `[2,1]`, `[3,1]`, `[4,1]`. | 추정: victory, 3~4라운드, 잔여 hp 7~9(58~75%). 공격력이 낮아 위협은 제한적. 예상 승률 약 75%. | 없음 | 없음 |
| enc.justice.mourner | 조문객 2명 추가, 위치 `[2,1]`, `[4,1]`. 최종: `creature.justice-mourner`×3 — hp 4 / attack 1 / ai cautious / morale 4 / not evil, 위치 `[2,1]`, `[3,1]`, `[4,1]`. | 추정: victory, 3~4라운드, 잔여 hp 8~10(67~83%). 공격력이 낮아 여전히 쉬울 수 있음. 예상 승률 약 80%. | 없음 | 없음 |
| enc.sacrifice.martyr | 고행자 2명 추가, 위치 `[2,1]`, `[4,1]`. 최종: `creature.sacrifice-penitent`×3 — hp 4 / attack 1 / ai cautious / morale 4 / not evil, 위치 `[2,1]`, `[3,1]`, `[4,1]`. | 추정: victory, 3~4라운드, 잔여 hp 8~10(67~83%). 예상 승률 약 80%. | 없음 | 없음 |
| enc.spirituality.fake-monk | 가짜 스님 1명 추가, 위치 `[4,1]`. 최종: `creature.spirituality-fake-monk`×2 — hp 4 / attack 2 / ai coward / morale 4 / evil, 위치 `[3,1]`, `[4,1]`. | 추정: victory, 2~3라운드, 잔여 hp 5~8(42~67%). coward로 피해를 입으면 물러나 전투가 길어질 수 있음. 예상 승률 약 70%. | 없음 | 없음 |
| enc.valor.duelist | 결투자 1명 추가, 위치 `[2,1]`. 최종: `creature.valor-duelist`×2 — hp 5 / attack 3 / ai aggressive / morale 5 / not evil, 위치 `[2,1]`, `[3,1]`. | 추정: victory, 3라운드, 잔여 hp 5~7(42~58%). 양쪽 동시 공격 시 위험. 예상 승률 약 65%. | 없음 | 없음 |
| enc.field.wolves | **변경 없음 — 의존 수순 보호**. 현재 3마리 구성(`creature.wolf`×3, hp 3 / attack 2 / ai pack / morale 3 / not evil)을 유지. | 현재: victory, 5라운드, 잔여 hp 12. 변경 시 `WOLF_PUSH_WIN`/`WOLF_KILL`이 깨짐. | `WOLF_PUSH_WIN`(`kalas-truth`, `kalas-rules`, `m2-traversal`), `WOLF_KILL`(`kalas-rules`) | 유지 권장. 만약 변경하면 `plans.ts`의 해당 항목을 새 배치에서 다시 풀고 `combat-sim.ts` 및 시나리오 테스트로 검증해야 함. |
| enc.archive.robbers | **변경 없음 — 의존 수순 보호**. 현재 2명 구성(`creature.robber`×2, hp 4 / attack 3 / ai skirmisher / morale 4 / evil)을 유지. | 현재: victory, 3라운드, 잔여 hp 9. 변경 시 `ROBBER_WIN`이 깨짐. | `ROBBER_WIN`(`kalas-lantern`) | 유지 권장. 만약 변경하면 `plans.ts`의 해당 항목을 새 배치에서 다시 풀고 `combat-sim.ts` 및 시나리오 테스트로 검증해야 함. |

### 추가 제안(검토용)

- **연민 마을**: `creature.compassion-beggar`를 추가하면 비악 생물이라 `deed.kill-innocent`가 자동으로 기록된다. 탐욕 정책은 밀어내기를 쓰지 않으므로, 이야기상 "죽이지 않을 선택"을 시험하려면 추가 생물로 `creature.robber`(악)를 쓰거나, 지형(큰 풀/나무)을 추가해 접근 경로를 조정하는 편이 낫다.
- **겸손·정의·희생 마을**: 공격력 1인 생물을 늘리는 것만으로는 탐욕 정책에겐 여전히 쉽다. 지형으로 플레이어의 이동을 제한하거나, 적의 `ai`를 `pack`으로 바꿔 한 대상에게 몰리도록 해야 난이도가 오른다.
- **칼라스 들판/서고**: C-5 계획에서도 "기존 시나리오 수순이 깨지지 않게 건드리지 않고, 마을 조우부터 바꾼다"고 한 만큼, 이 두 조우는 마을 조우 재배치가 끝난 뒤 의존 수순을 다시 풀 때 함께 조정하는 것이 좋다.

## 확인하지 못한 것

- **실제 플레이 감각**: 제안의 예상 승률·잔여 hp는 규칙 논리 추정이며, 사람이 직접 플레이했을 때의 체감 난이도는 검증하지 않았다.
- **콘텐츠 반영 후 재측정**: 본 문서는 콘텐츠를 고치지 않았으므로, 제안 배치를 `content/towns/*/encounters.yaml`에 반영한 뒤 반드시 `node scripts/sim/combat-sim.ts`와 `tests/scenario/*.test.ts`를 다시 돌려야 한다.
- **새 병과 도입 시 재평가**: 현재 제안은 기존 병과(fighter) 기준이다. 병과(archer·guardian 등)가 플레이어/동료에게 추가되면 사거리·방어 보정으로 전투 곡선이 달라진다.
- **사용자 플레이 판정**: "죽이지 않고 이기기" 보상 차등, 이야기 장면으로서의 전투 길이, 비악 생물 추가의 적절성은 기획/사용자 결정이 필요하다.
- **지형 변경 효과**: 격자 지형(큰 풀 `h`, 나무 `T` 등)을 바꾸는 제안은 시뮬레이션 없이는 예측이 어려워 본 문서에서는 다루지 않았다.

## 검증 기록

```bash
cd /home/taejin/hollow-codex-oc-encounter-audit
npm run test:unit     # 91 files, 619 tests passed, exit 0
npm run typecheck     # exit 0
npm run check:content # ok, exit 0
git branch --show-current  # oc/encounter-audit
git diff --stat 6c7609f..HEAD  # (빈 출력 — HEAD가 base 커밋이며 아직 변경 없음)
git diff --stat main           # main(5cc934f) 대비 전투·콘텐츠 작업 전체가 잡힘
git status --short             # ?? node_modules (untracked)
```

`git diff --stat 6c7609f..HEAD`가 비어 있는 이유는, 이 worktree가 이미 base 커밋 `6c7609f`를 가리키고 있기 때문이다. `git diff --stat main`에는 `main` 브랜치(tip `5cc934f`)보다 앞선 전투·콘텐츠 작업 전체가 포함된다. 본 문서 작성 후 커밋하면 base 대비 diff에 문서 1개만 나타날 것이다.
