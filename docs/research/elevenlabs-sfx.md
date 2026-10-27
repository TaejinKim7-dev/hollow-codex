# ElevenLabs 효과음 (비상업 개인 개발용)

작성: 2026-10-27 · 사용자 결정: "비상업용으로 만들자, 그 기준으로 만들 수 있는 거 다 만들어" (2026-10-27)
도구: ElevenLabs CLI `text-to-sound-effects` (model `eleven_text_to_sound_v2`, prompt_influence 0.6), 무료 요금제, 월 10,000 크레딧.
**라이선스**: 약관 https://elevenlabs.io/terms-of-use §4(c)(ii) "you retain all rights in and to your Output" 이지만 §1(c)(i) 무료 사용자는 "non-commercial purposes"만. → **파일은 저장소에 커밋하지 않는다.** `assets-private/elevenlabs/sfx/`(git 제외)에만 두고, 이 문서와 `scripts/audio/gen-elevenlabs-sfx.py`(프롬프트 전문)만 커밋한다. 상용으로 가거나 배포본에 넣을 때는 유료 요금제로 같은 프롬프트를 다시 만들거나 CC0 소리로 교체한다.
**음악은 불가**: `music compose`가 무료 요금제에서 `paid_plan_required`("Music API is not available for free users"). 배경음악은 CC0/CC-BY/CC-BY-SA 출처 조사(R-2b)로 간다.

## 만든 35개 (크레딧 약 1,450 사용; 재생성 4개 포함 시 약 1,600)
| 묶음 | id (프롬프트는 스크립트 참조) |
|---|---|
| 크리처 | wolf_howl, wolf_growl, wolf_whimper, wolf_pant, robber_grunt, pilgrim_fade |
| 열석·세계 | stone_ring_hum, ring_unlock, ring_travel, lantern_shatter, ledger_stamp, quill_scratch, scroll_unroll, codex_glow, bell_far |
| 전투 | combat_start, defend, persuade, flee, victory, defeat, hit_soft |
| 이벤트 | companion_join, companion_leave, ability_unlock, crisis_resolved, clue_found, epilogue |
| 분위기 루프(⟲) | amb_field, amb_village, amb_river, amb_archive, amb_night, amb_fire, amb_silence |

## 확인한 것 (들을 수는 없어서 기계 검사만)
`node scripts/visual/audio-decode-check.mjs assets-private/elevenlabs/sfx/manifest.json` — 35개 모두 브라우저에서 디코딩됨, 길이는 요청과 일치(±), 최대 진폭 0.02 미만인 파일 없음. 처음 만든 amb_archive·amb_silence·ledger_stamp·pilgrim_fade는 너무 작아 프롬프트를 고쳐 다시 만들었다. 소리의 느낌(늑대 울음이 늑대 같은지 등)은 **사람이 들어 판정**해야 한다 → 실험실의 "ElevenLabs 효과음" 칸.
## 다음
- 🧑 실험실(http://localhost:5173/hollow-codex/lab/)에서 청취 후 마음에 안 드는 것은 id를 알려 주면 프롬프트를 고쳐 다시 만든다(약 40 크레딧/개).
- 게임에 연결하는 방법(비상업 파일을 어떻게 불러올지, 배포본에서는 어떻게 뺄지)은 S 설계에서 정한다. `audit:dist`가 `assets-private` 파일이 배포본에 있으면 실패하게 한다.
