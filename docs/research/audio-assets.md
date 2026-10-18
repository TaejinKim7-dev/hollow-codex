# R-2 소리(음악·효과음) — 개인 개발과 나중 상용까지 문제없는 방안

작성: 2026-10-19 · 상태: **사용자 확인 대기** · 근거: 아래 각 항목의 원문 확인(날짜 2026-10-19)

## 0. 결론

- **처음부터 "상용 안전" 소리만 저장소에 넣는다.** 이 저장소는 공개이고 자산을 CC-BY-SA-4.0으로 배포한다(`assets/LEDGER.md`). 공개 저장소에 올리는 순간 재배포이고, CC-BY-SA는 남의 상업적 재사용까지 허락한다. 그래서 "개인 개발 동안만 괜찮은 소리"를 저장소에 넣으면 나중에 상용으로 갈 때뿐 아니라 **지금도** 문제가 된다.
- 개인 개발에서만 쓸 소리(시험 청취용)는 **저장소 밖 로컬 폴더 `assets-private/`**(git 제외)에만 둔다.
- 음악 추천: **저작권이 끝난 옛 곡을 편곡하거나 새로 작곡해 MIDI로 쓰고, 실제 악기를 녹음한 CC0 샘플(VSCO 2 CE)로 연주해 OGG로 만든다.** "실제 악기 녹음" 방향(plan.md §0)을 지키면서 결과물이 우리 저작물이 된다.
- 효과음 추천: **Kenney(CC0) + Freesound의 CC0 파일**, 모자라면 **직접 녹음**.

## 1. 등급표 — 어디까지 써도 되나

| 등급 | 뜻 | 저장소에 | 상용 | 해당 |
|---|---|---|---|---|
| **A** | 조건 없음 | 넣어도 됨 | 됨 | CC0 소리, 직접 녹음, 직접 작곡·편곡 + CC0 샘플로 만든 음원 |
| **B** | 출처 표기 조건 | 넣어도 됨 | 됨(표기 필수) | CC-BY 3.0/4.0 소리 |
| **C** | 게임 안에 넣는 건 되지만 원본 파일 재배포 금지 | **넣지 않음** | 됨 | Sonniss GDC 묶음, 유료 로열티 프리 묶음 대부분 |
| **D** | 비상업 또는 불확실 | **넣지 않음**(`assets-private/`만) | 안 됨 | ElevenLabs 무료 출력물, CC-BY-NC, 라이선스 표시 없는 파일 |

C등급 주의: GitHub Pages로 배포한 게임도 파일을 그대로 내려받을 수 있다. "프로젝트 안에 넣어 배포" 조건과 공개 저장소가 맞는지 애매하므로, 이 프로젝트는 **A·B만 쓴다**.

## 2. 출처별 원문 확인

| 출처 | 원문 (확인한 곳) | 등급 | 메모 |
|---|---|---|---|
| **VSCO 2 Community Edition** (오케스트라 샘플: 현악·목관·금관·건반·타악) | 저장소 LICENSE 첫 줄 "CC0 1.0 Universal" (https://github.com/sgossner/VSCO-2-CE , raw LICENSE) | **A** | 실제 악기 녹음 샘플. SFZ 판 있음. 샘플 원본까지 재배포 가능 |
| **GeneralUser GS** v2.0.3 (GM 사운드폰트) | "You may use GeneralUser GS without restriction for your own music creation, private or commercial." / 단 "I cannot be 100% sure where all of the samples originated" (https://github.com/mrbumpy409/GeneralUser-GS documentation/LICENSE.txt) | A−(출처 불확실 경고) | 류트·리코더 등 중세 악기가 VSCO에 없을 때 보조. 상용 제품이면 위험 경고를 저자 스스로 적음 → 핵심 곡에는 VSCO 우선 |
| **Kenney 오디오** (RPG Audio, Interface Sounds, Impact Sounds, UI Audio, Music Jingles 등) | 각 묶음 페이지 "License: Creative Commons CC0" (https://kenney.nl/assets/rpg-audio) | **A** | 발걸음·문·책·금속·클릭 등 RPG 효과음 |
| **Freesound** | FAQ: "for the 'zero' license you can do pretty much what you want with the sound… 'Noncommercial' … you can't earn any money" (https://freesound.org/help/faq/) | 파일마다 A/B/D | **검색 필터를 CC0로 한정**. 파일마다 라이선스 기록 |
| **OpenGameArt** | FAQ: "Works released under this license [CC0] may be copied, modified, distributed, performed or otherwise used in anyway without asking, crediting or notifying" (https://opengameart.org/content/faq) | 파일마다 | CC0·CC-BY만, GPL·NC 제외 |
| **incompetech (Kevin MacLeod)** | "Licensed under Creative Commons: By Attribution 4.0" (https://incompetech.com/music/royalty-free/licenses/) | **B** | 표기 필수. 유명해서 다른 게임·영상과 곡이 겹침 |
| Musopen | 사이트 원문 403으로 직접 확인 못 함. 2차 자료: 녹음마다 라이선스가 다르고, 일부는 표기 요구·상업 제한 | 파일마다(확인 전 D) | 쓰려면 녹음마다 원문 아이콘 확인 |
| Sonniss GDC 묶음 | 원문 403. 2차 자료: 상용 가능·표기 불필요, **원본 파일 단독 재배포 금지**, 2024판부터 AI 학습 금지 | C | 이 프로젝트에선 쓰지 않음 |
| ElevenLabs 무료 | 약관 §1(c)(i) "if you access or use our Services free of charge … may only use the Services for non-commercial purposes" (https://elevenlabs.io/terms-of-use) | **D** | 시험 청취용만 |
| ElevenLabs 유료(Starter 이상) | 공식 원문 미확인. 2차 자료: 유료 요금제부터 상업 사용, 음악은 별도 Music 약관 | 확인 전 보류 | 순수 AI 생성물은 나라에 따라 저작권 보호를 못 받을 수 있음 |

## 3. 음악 만드는 법 (A등급 파이프라인)

1. **곡**: 작곡가 사후 70년이 지난 옛 곡(중세·르네상스 무곡, 민요)을 편곡하거나 새로 작곡. **원작 게임 곡과 그 흉내는 금지**(spec §2).
2. **악보**: MIDI를 저장소에 둔다(예: `content/music-src/<곡>.mid`). 다시 만들 수 있고, 직접 만들었다는 기록이 된다.
3. **연주**: CC0 샘플(VSCO 2 CE의 SFZ)로 렌더링. 후보 도구 sfizz(SFZ 렌더러), FluidSynth(SF2) — 도구 라이선스는 쓰기 전에 확인(도구는 결과물 저작권에 영향 없음).
4. **출력**: OGG 96–128 kbps 루프. 용량: 1분 루프 약 1 MB × 약 12곡 → 배포 예산(지금 5 MiB) 상향 또는 지역별 지연 로딩이 필요(S 설계에서 정함).
5. **장부**: 곡 파일마다 `원곡(퍼블릭 도메인 근거) · 편곡자 · 샘플(VSCO 2 CE, CC0) · 라이선스 CC-BY-SA-4.0`.

## 4. 효과음 만드는 법
- 필요 목록(plan.md R-2): 발걸음, 부딪힘, 클릭, 책장, 단서 발견, 확정, 타격, 밀기, 문, 순간이동.
- 1순위 Kenney(CC0) → 2순위 Freesound CC0 → 3순위 직접 녹음(휴대폰, 조용한 방, WAV로 녹음 후 OGG 변환).
- 편집(자르기·음량·잔향)은 해도 등급이 바뀌지 않는다(CC0는 수정 자유, CC-BY는 수정 표기).

## 5. 개인 개발용 소리 다루기
- `assets-private/`(이 커밋에서 `.gitignore`에 추가)에만 둔다. 게임 코드가 이 폴더를 읽지 않게 하고, 배포본(dist)에 들어가지 않게 `audit:dist`에서 막는 것을 S 설계에 넣는다.
- ElevenLabs 무료로 "이런 느낌" 시안을 만들어 들어 보는 것은 이 폴더 안에서만 한다.

## 6. 정해 주실 것
- [ ] 저장소에는 A·B등급만, 개인 시험은 `assets-private/` — 좋음 / 다르게:
- [ ] 음악은 "옛 곡 편곡·새 작곡 MIDI + VSCO 2 CE(CC0) 연주" — 좋음 / 다르게:
- [ ] 효과음은 Kenney·Freesound CC0 + 직접 녹음 — 좋음 / 다르게:
- [ ] CC-BY 곡(incompetech 등)도 허용 — 예 / 아니오:
- [ ] ElevenLabs는 시안 청취용(무료)만 — 좋음 / 유료로 실제 사용:

의견:
