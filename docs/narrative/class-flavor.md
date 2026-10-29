# 병과·연습장 적 이름 제안 (C-3c class flavor)

> 작성: 2026-10-30 · 상태: **문자열 제안안** (아직 `content/strings/*.yaml`에 반영하지 않음)  
> 근거: `docs/superpowers/plans/2026-10-29-combat-c3c-classes.md` 병과 값 표, `content/creatures.yaml` 이름 키 규칙

---

## 1. 병과 표

| 키 | ko | en | 근거(계획/값 표) |
|---|---|---|---|
| `class.fighter` | 전사 | Fighter | C-3c 기준안: 기본(변화 없음) |
| `class.fighter.desc` | 앞을 막아 선다 | Holds the front line. | 성격 — 앞장서서 맞선다 |
| `class.runner` | 척후 | Runner | C-3c 기준안: 빠르게 옆·등으로 돌아 들어간다 |
| `class.runner.desc` | 가볍게 돌아 들어간다 | Flanks from the sides. | 성격 — 옆·등으로 돌아 들어간다 |
| `class.archer` | 궁수 | Archer | C-3c 기준안: 직선으로 떨어진 먼 적을 겨눈다. 바로 옆은 못 친다 |
| `class.archer.desc` | 먼 곳을 겨눈다 | Aims at distant targets. | 성격 — 먼 적을 겨눈다(사거리 수치 제외) |
| `class.guardian` | 방패병 | Guardian | C-3c 기준안: 받는 피해 −1(최소 1) |
| `class.guardian.desc` | 덜 다친다 | Takes less damage. | 성격 — 방패로 받는 피해를 줄인다(수치 제외) |

---

## 2. 연습장 적 이름 후보

`creatures.yaml`의 기존 항목(`creature.wolf` → `creature.wolf.name`)과 같은 키 규칙으로, 문자열 키는 `creature.arena-archer.name`, `creature.arena-guard.name`이 된다.

| 키 | 후보 | ko | en | 비고 |
|---|---|---|---|---|
| `creature.arena-archer.name` | 1안 | 활손 | Bowhand | ★ 추천. 연습장에서 활을 든 상대를 짧게 부르기에 어색하지 않다. |
| `creature.arena-archer.name` | 2안 | 궁손 | Bowman | — |
| `creature.arena-archer.name` | 3안 | 사수 | Shooter | — |
| `creature.arena-guard.name` | 1안 | 방패손 | Shieldhand | ★ 추천. 방패로 맞서는 연습 상대이며, 활손과 명명 규칙이 맞춘다. |
| `creature.arena-guard.name` | 2안 | 방패꾼 | Shield-bearer | — |
| `creature.arena-guard.name` | 3안 | 수호수 | Warden | — |

---

## 3. 반영 방법

- 위 `class.*` 키 8개와 `creature.arena-archer.name`, `creature.arena-guard.name`은 `content/strings/ko.yaml`과 `content/strings/en.yaml`에 각각 추가하면 된다.
- 본 문서는 제안안일 뿐이며, 아직 `content/`나 `src/`에는 반영하지 않았다.
- 실제 반영 후에는 `npm run test:unit`의 `real-content-labels.test.ts`가 모든 키가 존재하는지 검사하게 된다. 지금 단계에서는 화면 배치나 문자열 길이가 실제 UI에 맞는지 확인하지 않았다.

## 4. 확인하지 못한 것

- **영어 자연스러움**: `Bowhand`, `Shieldhand` 등 조어는 사용자 확인이 필요하다.
- **화면 배치**: 병과 설명(`class.*.desc`)이 HUD 한 줄에 들어가는지, 한글 20자 안팎이 실제 폰트에서 잘리지 않는지 확인하지 않았다.
- **실제 조우 등장**: 연습장 적 이름은 `content/creatures.yaml`과 `content/towns/kalas/encounters.yaml`에 실제로 등록되기 전까지 게임에 나타나지 않는다.

## 5. 사용법 제안

- **HUD/유닛 정보 줄**: `class.<id>`를 병과 이름으로, `class.<id>.desc`는 툴팁이나 짧은 도움말 한 줄로 넣는다.
- **연습장 조우 카드**: `creature.arena-archer.name` / `creature.arena-guard.name`을 적 진영 이름으로 표시한다.
- **도움말/튜토리얼**: "궁수는 바로 옆은 공격할 수 없습니다" 같은 안내는 `class.archer.desc` 한 줄과 사거리 오버레이 블록을 함께 쓴다.
