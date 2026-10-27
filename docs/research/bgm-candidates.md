# 배경음악 후보 (Kevin MacLeod / incompetech, CC BY 4.0)

작성: 2026-10-27 · 상태: **사용자 청취·선택 대기**
조사: 백그라운드 에이전트(결과 원본 scratchpad) + 제가 확인: 카탈로그 `https://incompetech.com/music/royalty-free/pieces.json`(1443곡)에서 24곡 제목·길이·악기·분위기 대조 → 전부 존재. 모든 곡 라이선스는 incompetech 페이지의 "Licensed under Creative Commons: By Attribution 4.0" (https://incompetech.com/music/royalty-free/licenses/ 및 FAQ). **CC BY 4.0이라 크레딧 표기 필수.** BY-SA가 아니므로 장부에는 곡 파일을 CC-BY-4.0으로 따로 적는다(저장소 CC-BY-SA와 별개 저작물).
한계: 에이전트가 OpenGameArt·FMA·ccMixter·Wikimedia·Musopen은 조사하지 않았다(incompetech만으로 12슬롯이 채워짐). 소리는 **듣지 못함** — 악기는 카탈로그 설명 기준이며 MacLeod 곡은 샘플 라이브러리로 만든 것이 많아 "실제 녹음"이 아닐 수 있다. 루프: 대부분 곡 끝이 닫혀 있어 반복하려면 잘라 붙이기·크로스페이드 필요.

| 슬롯 | 후보 | 곡 | 길이 | 악기 | 분위기 |
|---|---|---|---|---|---|
| 들판 | A | Pippin the Hunchback | 03:13 | Guitar, Lute, Flute, Drums | Bouncy, Mysterious |
| 들판 | B | Teller of the Tales | 03:32 | Lute, Guitar | Calming, Mysterious, Relaxed, Somber |
| 칼라스 | A | Heavy Heart | 04:57 | Lute, Cellos, Basses, Pennywhistle | Dark, Somber, Mystical |
| 칼라스 | B | Intrepid | 03:11 | Basses, Cellos, Tuba, Trombones, Prepared Piano, Voice, Drums | Eerie, Mysterious, Somber, Dark |
| 연민 마을 | A | Decline | 03:27 | Harp, Pennywhistle, Cello, Violin, Bass | Relaxed, Somber |
| 연민 마을 | B | Ranz des Vaches | 01:25 | English Horn, Flute, Bassoons, Strings | Calming, Relaxed, Uplifting |
| 용맹 마을 | A | Long Road Ahead | 02:26 | Choir, Strings, Brass, Percussion | Epic, Mystical, Somber |
| 용맹 마을 | B | For the Fallen | 01:35 | Brass, Strings, Percussion | Epic, Intense, Somber |
| 정의 마을 | A | Night Vigil | 04:48 | Choir, Flute, Basses, Cellos | Mystical, Somber |
| 정의 마을 | B | Heart of Nowhere | 02:52 | Choir, Cellos, Basses | Calming, Mystical, Somber |
| 희생 마을 | A | Ancient Rite | 01:53 | Choir, Percussion, Bass | Calming, Mysterious, Somber |
| 희생 마을 | B | Agnus Dei X | 01:31 | Choir, Pipe Organ | Dark, Epic, Mystical |
| 명예 마을 | A | Court of the Queen | 03:20 | Strings, Brass, Percussion, Celesta | Bright, Relaxed |
| 명예 마을 | B | Procession of the King | 03:04 | Strings | Intense, Uplifting |
| 영성 마을 | A | Frozen Star | 03:41 | Harp, Choir, Helicons, Flutes | Calming, Mystical, Relaxed, Uplifting |
| 영성 마을 | B | Ascending the Vale | 04:08 | Harp, Choir, Flute, Percussion, Anyafil Horn | Relaxed, Calming, Mystical |
| 헤론 | A | Lamentation | 03:18 | Harp | Somber |
| 헤론 | B | Plaint | 03:17 | Bassoon, Harp | Calming, Dark, Somber |
| 봉인 서고 | A | Virtutes Instrumenti | 04:22 | Viol, Drone | Calming, Mystical, Somber, Uplifting |
| 봉인 서고 | B | Temple of the Manes | 02:36 | Harps, Flutes, Oboe, Percussion | Dark, Mystical |
| 전투 | A | Rynos Theme | 03:06 | Violins, Violas, Cellos, Basses, Flutes, French Horns, Trombones, Tuba, Percussion, Piano | Action, Epic, Intense, Suspenseful |
| 전투 | B | Hero Down | 03:34 | Strings, French Horn, Trombones, Percussion, Flute | Epic, Intense, Somber |
| 엔딩 | A | The Parting | 03:04 | Oboe, Flute, Strings, Trombones, Horn, Tuba | Calming, Relaxed, Somber, Uplifting |
| 엔딩 | B | Eternal Hope | 04:44 | Piano, Strings, Helicon, French Horn, Choir | Calming, Uplifting, Relaxed |

## 크레딧 문구 (쓰는 곡마다 그대로)
```
"<곡 제목>" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

## 청취·선택
- 파일: `assets-private/preview/bgm/<슬롯>-A|B.mp3`(원본 320kbps, 합계 168 MB, git 제외) + `bgm.json`.
- 실험실(http://localhost:5173/hollow-codex/lab/) 오른쪽 "배경음악"에서 슬롯별 A·B 버튼으로 재생(다시 누르면 정지). 고른 결과는 "선택 결과 복사".
- 검사: `node scripts/visual/bgm-load-check.mjs assets-private/preview/bgm/bgm.json` — 24곡 모두 재생 가능, 길이가 카탈로그와 일치(2026-10-27).
- 고른 곡만 OGG 96–128 kbps로 변환·루프 처리해 `assets/audio/bgm/`에 넣고 장부(URL·라이선스·날짜)와 크레딧 화면에 기록한다. 12곡 약 12 MB → 배포 예산 처리는 S 설계.

## 사용자가 정할 것
- [ ] 슬롯별 A/B 선택 (또는 "다시 찾기")
- [ ] CC BY(표기 필요) 곡 사용 허용 — 예 / 아니오(아니오면 CC0만, 후보가 크게 줄어듦)
