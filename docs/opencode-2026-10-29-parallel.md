# OpenCode에 시킬 일 (2026-10-29, 병과 구현과 병렬)

공통 규칙(세 작업 모두):
- 브랜치는 `oc/<이름>`으로 새로 만들어 거기서만 커밋한다. `main`에 병합·푸시하지 않는다(내가 합친다). 푸시는 `git push origin HEAD:oc/<이름>`.
- **건드리지 않는 곳**: `src/core/combat/`, `src/render/`, `src/ui/`, `content/strings/*.yaml`(내가 병과 문구를 추가 중이라 충돌한다), `content/classes.yaml`, `docs/status.md`.
- 원작 이름·문장·음악·데이터 금지(`content/ip-denylist.yaml`), 토큰·비밀 커밋 금지. 커밋 끝에 `Co-Authored-By: OpenCode <noreply@opencode.ai>`.
- 끝나면 `npm run test:unit`·`typecheck`·`check:content` 결과를 숫자와 함께 보고하고, 만든 파일 목록과 확인 못 한 것을 적는다.

---

## OC-1. 동료 8명의 합류·이탈·재합류 대사 (서사)
브랜치 `oc/companion-lines`

배경: 동료는 8명(`npc.field.elin`(칼라스 엘린)·`npc.compassion.wanderer`·`npc.valor.sergeant`·`npc.justice.mason`·`npc.sacrifice.surgeon`·`npc.honor.swordmaster`·`npc.spirituality.novice`·`npc.humility.novice`, 정확한 id는 `grep -n "companion:" content/towns/*/npcs.yaml`로 확인). 지금은 "함께 가기" 버튼 한 줄뿐이고 합류·이탈 순간 대사가 없다.

할 일:
1. 동료마다 대사 3줄을 쓴다: **합류**(왜 따라가는가), **이탈**(행실 2건 뒤 떠날 때 — 어떤 행실이 마음에 걸렸는지 그 미덕에 맞게), **재합류**(다시 돌아올 때 한 줄). 말투는 `docs/narrative/voice-bible.md`와 그 사람의 기존 대사(`content/strings/ko.yaml`의 `npc.<id>.*`)에 맞춘다. 각 줄 1~2문장.
2. 한국어 원문과 영어 번역을 쓴다. 키는 `companion.<npcId>.join` / `.leave` / `.rejoin`.
3. **`content/strings`는 건드리지 말고** `docs/narrative/companion-lines.md`에 표로 넣는다(키 · ko · en · 근거가 된 기존 대사). 내가 병과 작업 뒤에 코드에 연결한다.
4. 재합류 조건 제안: 지금은 `rejoinRequires: []`(바로 재합류). 동료마다 "어떤 단서/행실이면 돌아오는가"를 한 줄 제안(존재하는 fact id나 virtue 행실만 사용, `grep`으로 실제 id 확인).
5. `python3 scripts/narrative/spellcheck.py companion` 같은 맞춤법 도구가 있으면 돌려 결과를 첨부.

완료 기준: 표에 8명 × 3줄 × 2언어, 재합류 제안 8개, 금지어 검사 통과(`npm run check:content`는 변경 없음이라 그대로 0).

## OC-2. 병과 이름·설명·조우 이름 문구 초안 (서사)
브랜치 `oc/class-flavor`

배경: 곧 병과 4종이 생긴다: 전사(fighter, 이동3·사거리1), 척후(runner, 이동4), 궁수(archer, 이동2·거리 2~3 직선), 방패병(guardian, 받는 피해 −1). 문구를 미리 써 둔다.

할 일:
1. 각 병과의 **이름**(2~3글자)과 **한 줄 설명**(전투 HUD에 들어가므로 20자 안팎) ko·en. 키 `class.<id>` · `class.<id>.desc`.
2. 연습장 새 적 2종 이름: `creature.arena-archer`(활 든 연습 상대), `creature.arena-guard`(방패 든 연습 상대) — 연습장 분위기에 맞는 이름 ko·en 3안씩.
3. 병과 설명 문구가 **사거리·이동력 숫자를 직접 쓰지 않게**(숫자는 `content/classes.yaml`이 바뀔 수 있음) 쓴다.
4. 결과는 `docs/narrative/class-flavor.md`에 표로. `content/strings`는 건드리지 않는다.

완료 기준: 4병과 × 2줄 × 2언어 + 적 이름 안 + 금지어 검사 통과.

## OC-3. 마을 이야기 전투 재배치 조사 (읽기 전용 분석, 코드 변경 없음)
브랜치 `oc/encounter-audit`

배경: 7개 마을의 이야기 전투는 매우 쉬워서(`docs/research/combat-difficulty-2026-10-29.md`) 다시 배치하고 싶지만, 시나리오 테스트의 고정 수순(`tests/scenario/plans.ts`)이 그 조우의 결과에 의존해 바꾸면 깨진다.

할 일:
1. `grep`·`scripts/sim/combat-sim.ts`(`npx tsx scripts/sim/combat-sim.ts`)로 모든 이야기 조우(8마을)의 현재 자동 대전 승률·평균 라운드·평균 잔여 hp를 표로 만든다.
2. `tests/scenario/*.test.ts`·`plans.ts` 중 **어떤 조우의 어떤 수순에 의존하는지** 조우별로 목록화한다(조우 id → 의존하는 테스트와 plans 항목, 그 수순에서 전투 부분의 정확한 명령열).
3. 조우마다 "격자·적 수·적 성격(ai) 변경 제안 1안"(목표 승률 55~75%)과, 그 제안이 의존 수순을 어떻게 깨뜨리는지, 수순을 다시 풀 때 필요한 일을 적는다. 제안은 **적 배치·ai·morale 값만**(새 병과 없이 지금 규칙으로).
4. 코드·콘텐츠 변경 금지. 결과는 `docs/research/story-encounter-audit-2026-10-29.md` 한 파일.

완료 기준: 표 3개(현재 난이도 · 의존 목록 · 제안), 파일 외 변경 0(`git diff --stat main`으로 확인해 보고).
