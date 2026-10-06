# AI Coding Agent Rules

이 저장소의 작업 규칙 정식 문서다.

## 1. 읽는 순서

1. `AGENTS.md`
2. `docs/handoff.md` 마지막 절
3. `docs/superpowers/specs/2026-10-06-hollow-codex-design.md` (게임 설계)
4. `docs/superpowers/plans/`의 진행 중 계획

## 2. 절대 금지

- 원작의 데이터와 참고 문서(`u4-alt-manual.pdf`, `origin.txt`)를 저장소에 넣지 않는다.
- `/home/taejin/ultima`의 번역문을 가져오지 않는다.
- secret(OAuth 클라이언트 비밀, 토큰 등)을 커밋하지 않는다.
- spec §2.2 금지 목록(`content/ip-denylist.yaml`)의 이름·문장을 `content/`, `src/`, `scripts/`, `tests/`에 쓰지 않는다. 주석도 포함한다.
- 실패 테스트를 삭제하거나 약화해서 green으로 만들지 않는다.

## 3. 개발 방식

- TDD: 실패하는 테스트를 먼저 쓰고 RED 출력을 기록한다. 최소 구현으로 GREEN을 만든 뒤 리팩터링한다. 테스트 수가 0이면 완료가 아니다.
- core 순수성: `src/core/**`는 `document`, `window`, `HTMLElement`, `CanvasRenderingContext2D`, `AudioContext`, `Math.random`을 참조하지 않는다. 난수는 `state.rng`의 시드로만 쓴다. core 함수는 입력 `GameState`를 바꾸지 않고 새 객체를 돌려준다(바뀐 게 없으면 같은 객체도 된다).
- 노드 타입 제거 호환: `scripts/*.ts`를 `node`로 직접 실행하므로, `src/`·`scripts/`·`tests/`의 모든 상대 import는 `.ts` 확장자를 붙이고(`import { x } from "./a.ts"`), 타입만 쓰는 import는 `import type`을 쓴다. `enum`, `namespace`, 생성자 매개변수 프로퍼티, `import x = require()`는 쓰지 않는다.
- 화면 문자열은 `content/strings/ko.yaml`의 키로 꺼낸다. 코드에 한국어 화면 문구를 하드코딩하지 않는다.
- 외부 자산은 CC0 / CC-BY / CC-BY-SA / OFL만 쓰고 `assets/LEDGER.md`에 기록한다.

## 4. 테스트 실행

- merge 게이트와 긴 실행은 Haiku 서브에이전트(`model: "haiku"`)에게 시키고, 메인은 보고(exit code, 실패 출력)를 읽는다.
- 수정 뒤에는 e2e를 돌리지 않는다. 단위 테스트와 `tsc`만 돌리고 dev 서버를 띄워 URL을 사용자에게 넘긴다. 화면 확인은 사용자가 한다.
- 정책 상세는 `docs/TESTING_POLICY.md`.

## 5. 진행 관리

진행 → 저장(커밋) → 기록(`docs/handoff.md`) → 확인. 넷 중 하나라도 빠지면 그 단계는 끝난 게 아니다. 실제로 실행하거나 관찰한 것만 완료로 적고, 불확실하면 "확인 필요"로 남긴다.

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
