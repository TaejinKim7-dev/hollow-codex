# 테스트 정책

모든 새 동작은 TDD로 만든다. 실패하는 테스트(RED)를 먼저 실행해 출력을 기록하고, 최소 구현으로 통과(GREEN)시킨 뒤 정리한다. 테스트 수가 0이면 완료로 인정하지 않는다.

## 1. 단위

대상: core, content, audio, render의 순수 부분. 도구는 Vitest(`tests/unit`). 항상 RED가 먼저다.

## 2. 시나리오

`tests/scenario`. 실제 `content/`를 불러와 명령을 재생하고 상태와 이벤트를 검사한다.

## 3. e2e 최소

`tests/e2e/boot.spec.ts` 하나만 둔다(Chromium). 부팅과 첫 화면만 확인한다. 수정 뒤에는 돌리지 않는다.

## 4. 사용자 수동 확인

화면, 소리, 조작감은 사용자가 판정한다. 에이전트는 dev 서버 URL을 넘긴다.
