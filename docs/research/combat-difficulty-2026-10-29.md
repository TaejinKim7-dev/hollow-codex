# 전투 난이도 곡선 (자동 대전, 2026-10-29)

도구: `node scripts/sim/combat-sim.ts [조우 id 접두어]` — 난수 없이 결정적. 정책: 플레이어·동료 모두 "인접한 가장 약한 적 공격, 없으면 가까운 적 쪽으로 이동, 기세가 가득 차면 필살". 플레이어 hp 12, 공격 3. 동료 열은 훈련 교관(hp 8, 공격 3)을 데려간 경우.

```
조우                         동료 결과       라운드 플레이어 hp
enc.compassion.robbers      없음 victory      3       12
enc.compassion.robbers      교관 victory      3       12
enc.honor.duelist           없음 victory      2        9
enc.honor.duelist           교관 victory      1       12
enc.humility.silencer       없음 victory      2       11
enc.humility.silencer       교관 victory      1       12
enc.justice.mourner         없음 victory      2       11
enc.justice.mourner         교관 victory      1       12
enc.field.wolves            없음 victory      5       12
enc.field.wolves            교관 victory      5       10
enc.archive.robbers         없음 victory      3        9
enc.archive.robbers         교관 victory      2       12
enc.arena.wolves            없음 victory      5       12
enc.arena.wolves            교관 victory      5       10
enc.arena.robbers           없음 defeat       5        1
enc.arena.robbers           교관 victory      3       12
enc.arena.mixed             없음 victory      5        7
enc.arena.mixed             교관 victory      4       12
enc.arena.hold              없음 victory      4        1
enc.arena.hold              교관 victory      4        5
enc.arena.escape            없음 victory      4        6
enc.arena.escape            교관 victory      3       10
enc.sacrifice.martyr        없음 victory      2       11
enc.sacrifice.martyr        교관 victory      1       12
enc.spirituality.fake-monk  없음 victory      2       10
enc.spirituality.fake-monk  교관 victory      1       12
enc.valor.duelist           없음 victory      2        9
enc.valor.duelist           교관 victory      2        9
```

## 읽은 것
- 이야기 속 조우(마을 일곱 곳의 단일 적)는 1~3라운드에 거의 손해 없이 끝난다(hp 9~12). **너무 쉽다.** 전투가 이야기의 "죽이지 않을 선택"을 시험하는 자리라면, 적이 둘 이상이거나 마음 규칙(설득·퇴각)을 써야 깨지도록 조우를 키워야 한다(C-5).
- 연습장 조우는 곡선이 괜찮다: 늑대 3(5라운드, hp 12→12), 도적 3(혼자 지고 동료와 이김), 섞인 무리(혼자 hp 7), 버티기(혼자 hp 1 — 아슬아슬), 탈출(혼자 hp 6).
- 이 정책은 방향·연계·지형을 거의 못 쓴다(탐욕). 사람이 위치를 쓰면 더 쉬워진다 → 마을 조우는 적 수·지형으로 긴장을 만들 것.
- 다음 후보: ① 마을 조우마다 보조 적 1~2명(크리처 추가는 `content/creatures.yaml`) ② 같은 조우에서 "죽이지 않고 이기기" 보상 차등(C-4 남은 항목) ③ 적 연계(`chain.enemies: true`)를 켜고 이 표로 다시 잰다.
