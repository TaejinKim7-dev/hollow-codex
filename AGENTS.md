# AI Coding Agent Rules

이 저장소의 작업 규칙 정식 문서다.

## 1. 읽는 순서

새 세션·새 에이전트는 코드를 고치기 전에 이 순서로 읽는다.

1. `AGENTS.md` — 규칙(이 파일)
2. `docs/status.md` — 지금 단계, 다음 할 일, 진행 중인 작업 (**가장 먼저 확인할 현재 상태**)
3. `docs/plan.md` — 방향과 로드맵, 사용자 결정
4. `docs/handoff.md` — 마지막 절만 (누적 기록, 필요할 때 더 위로)
5. 지금 할 일에 해당하는 설계(`docs/superpowers/specs/`)와 계획(`docs/superpowers/plans/`)
6. 조사 결과가 필요하면 `docs/research/`

| 파일 | 역할 | 쓰는 법 |
|---|---|---|
| `AGENTS.md` | 규칙 | 사용자가 규칙을 바꿀 때만 고친다 |
| `docs/status.md` | 현재 상태·다음 할 일·진행 중 | **덮어쓴다.** 60줄 이내로 짧게 |
| `docs/plan.md` | 방향·로드맵·사용자 결정 | 방향이 바뀌거나 사용자가 결정했을 때만 고친다 |
| `docs/handoff.md` | 작업 기록 | **끝에 추가만** 한다. 지난 절을 고치지 않는다(틀린 내용은 새 절에서 정정) |
| `docs/research/*.md` | 조사 결과 | 조사 하나 = 파일 하나 |
| `docs/superpowers/specs/`, `plans/` | 설계·구현 계획 | 승인된 뒤에는 정정 절을 덧붙여 고친다 |

## 2. 절대 금지

- 원작의 데이터와 참고 문서(`u4-alt-manual.pdf`, `origin.txt`)를 저장소에 넣지 않는다.
- `/home/taejin/ultima`의 번역문을 가져오지 않는다.
- secret(OAuth 클라이언트 비밀, API 토큰 등)을 커밋하지 않는다. 생성 도구(MCP) 토큰은 사용자 설정에만 두고 저장소 파일(`.mcp.json` 등)에 쓰지 않는다.
- spec §2.2 금지 목록(`content/ip-denylist.yaml`)의 이름·문장을 `content/`, `src/`, `scripts/`, `tests/`에 쓰지 않는다. 주석도 포함한다.
- 실패 테스트를 삭제하거나 약화해서 green으로 만들지 않는다.

## 3. 개발 방식

- TDD: 실패하는 테스트를 먼저 쓰고 RED 출력을 기록한다. 최소 구현으로 GREEN을 만든 뒤 리팩터링한다. 테스트 수가 0이면 완료가 아니다.
- core 순수성: `src/core/**`는 `document`, `window`, `HTMLElement`, `CanvasRenderingContext2D`, `AudioContext`, `Math.random`을 참조하지 않는다. 난수는 `state.rng`의 시드로만 쓴다. core 함수는 입력 `GameState`를 바꾸지 않고 새 객체를 돌려준다(바뀐 게 없으면 같은 객체도 된다).
- 노드 타입 제거 호환: `scripts/*.ts`를 `node`로 직접 실행하므로, `src/`·`scripts/`·`tests/`의 모든 상대 import는 `.ts` 확장자를 붙이고(`import { x } from "./a.ts"`), 타입만 쓰는 import는 `import type`을 쓴다. `enum`, `namespace`, 생성자 매개변수 프로퍼티, `import x = require()`는 쓰지 않는다.
- 화면 문자열은 `content/strings/ko.yaml`의 키로 꺼낸다. 코드에 한국어 화면 문구를 하드코딩하지 않는다.
- 외부 자산은 라이선스 원문을 직접 읽고 고르며 `assets/LEDGER.md`에 기록한다. 기본 허용은 CC0 / CC-BY / CC-BY-SA / OFL. 그 밖의 라이선스(유료 묶음, 공개 저장소 재배포 금지 등)는 `docs/plan.md` §3에 사용자 결정이 있을 때만 쓴다. 생성 도구로 만든 그림은 장부에 도구·약관 URL·생성 날짜를 적고, 다시 만들 수 있게 프롬프트·설정을 `assets/generated/prompts/`에 남긴다.

## 4. 테스트 실행

- merge 게이트와 긴 실행은 하위 에이전트가 있으면 가벼운 모델(Claude Code에서는 Haiku)에게 시키고, 메인은 보고(exit code, 실패 출력)를 읽는다. 하위 에이전트가 없으면 직접 실행한다.
- 수정 뒤에는 e2e를 돌리지 않는다. 단위 테스트와 `tsc`만 돌리고 dev 서버를 띄워 URL을 사용자에게 넘긴다. 화면 확인은 사용자가 한다.
- 정책 상세는 `docs/TESTING_POLICY.md`.

## 5. 진행 관리

진행 → 저장(커밋) → 기록 → 확인. 넷 중 하나라도 빠지면 그 단계는 끝난 게 아니다. 실제로 실행하거나 관찰한 것만 완료로 적고, 불확실하면 "확인 필요"로 남긴다.

### 작업 시작
1. `docs/status.md`의 "다음 할 일"에서 맨 위의 대기 항목을 고른다(사용자가 지정했으면 그것). 🧑 표시 항목은 사용자 몫이라 고르지 않는다.
2. `docs/status.md` "진행 중"에 `- <ID> · <에이전트 이름> · <브랜치> · <시작 시각> · 시작`을 적고 커밋한다(다른 에이전트가 같은 일을 잡지 않게).
3. "진행 중"에 이미 다른 줄이 있으면 그 작업을 이어받거나 사용자에게 묻는다. 겹쳐서 시작하지 않는다.

### 작업 중
- 의미 있는 단위마다 커밋한다. 길어질 작업은 중간 상태를 `docs/status.md` 한 줄로 갱신한다(사용량 한도로 끊겨도 다음 에이전트가 이어받게).

### 작업 끝
1. `docs/handoff.md` 끝에 절을 추가한다: `## <날짜> <ID> <제목>` 아래 한 일, 커밋, 실행한 명령과 exit code, 확인 못 한 것.
2. `docs/status.md`를 갱신한다: 진행 중 줄 삭제, 표 상태 "완료(<커밋>)", 다음 할 일 재정렬, 마지막 게이트 결과.
3. 사용자 결정이 나왔으면 `docs/plan.md` §3에 적는다.
4. 사용자에게 보고한다: 한 일, 증거(명령·결과), 확인 못 한 것, 다음 할 일.

### 끊겼을 때
작업이 중간에 끝나면(에러, 한도, 세션 종료) 다음 에이전트는 `git log`, `git status`, `docs/status.md`의 ⚠ 줄을 먼저 보고 이어서 한다. 커밋되지 않은 변경은 내용을 확인하기 전에 지우지 않는다.

## 6. Git

- 구현은 `todo-<n>-<topic>` 브랜치에서 한다.
- merge 게이트를 통과하면 PR 없이 `main`에 직접 merge하고 push한다.
- 배포는 `main` push에서만 일어난다.

## 7. merge 게이트

모두 exit 0이어야 한다.

```bash
npm ci
npm run test:unit
npm run typecheck
npm run check:content
npm run build
npm run audit:dist
git diff --check
```

## 8. 실패를 숨기지 않는다

게이트의 어떤 단계든 exit 0이 아니면 merge·push하지 않고, 실패한 명령과 exit code, 실패 출력을 그대로 `docs/handoff.md`에 남긴다. 인프라 실패도 통과로 적지 않는다.

## 9. 화면과 소리는 보고 들은 것만 완료다

- 그래픽·UI·소리를 바꾼 작업은 테스트 통과만으로 완료가 아니다.
- 그래픽: Playwright 등으로 바뀐 화면(최소 들판·마을·실내/던전·전투)의 스크린샷을 찍어 **에이전트가 직접 이미지를 열어 보고**, `docs/screenshots/<날짜>-<ID>-*.png`로 저장한다. 검은 사각형, 잘못 고른 타일, 어긋난 배율이 없는지 적는다.
- 소리: 파일 이름·길이·출처·라이선스를 기록하고, 사람이 들어 보기 전에는 `docs/status.md`에 "사용자 확인 필요"로 둔다.
- 사용자가 보고 듣고 판정하기 전에는 "출시 가능", "완성" 같은 말을 쓰지 않는다.

## 10. 사용자 결정은 사용자 몫이다

플레이 판정, 자산 선택, 유료 구매, 라이선스 예외, 범위 변경은 사용자가 정한다. 에이전트는 추천안을 근거와 함께 제시하고 멈춘다. 결정을 지어내서 기록하지 않는다.
