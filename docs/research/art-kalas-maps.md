# 칼라스 맵 그림 — 무엇이 더 필요한가

작성: 2026-10-27 · 근거: `content/towns/kalas/maps.yaml`(map.field 24×16, map.kalas 32×24, map.archive 12×10), `content/tiles.yaml`(지형 문자 17종)

## 지도에서 쓰는 지형과 그림 상태
| 문자 | 쓰임 | 어느 지도에 | 그림 | 상태 |
|---|---|---|---|---|
| `.` 풀 | 기본 땅 | field 261칸, kalas 462칸 | `tilesets/grass-path-v3` | ✅ |
| `,` 흙길 | 길 | 작은 흙 얼룩 | 〃 | ✅ |
| `~` 물 | 강 | field 세로 강 | `tilesets/grass-water` | ✅ |
| `=` 마루·다리 | field 강 위 1칸 | | `objects/bridge/bridge-long.png` | ✅ |
| `T` 나무 | 숲 테두리·곳곳 | field 79칸 | `objects/kalas/tree-oak.png` | ✅ 1종(변형 2~3종 있으면 좋음) |
| `o` 돌 | 열석 고리 | field (6,5)(8,5)… 둘레 | `objects/kalas/standing-stone-ring.png` | ✅ |
| `L` 카운터 | kalas 광장 고백석 | (16,12) | `objects/kalas/confession-stone.png` | ✅ |
| `:` 돌바닥 | 광장·건물 안 | kalas 75칸, field 길 | **풀↔돌바닥 타일셋** | ❌ 필요 (3~4회) |
| `#` 벽 | kalas 외벽·건물 | kalas 202칸 | 집 `objects/kalas/house.png`(시점 판정 대기) + **마을 외벽 타일** | △ 외벽 필요 |
| `+` 문 | 건물·출구 | kalas 7곳 | 집 그림에 문 있음. 출구용 **성문** | ❌ 1회 |
| `^` 산 | (칼라스에는 없음) | 대륙 지도 | — | 나중 |
| `_` 던전 바닥 | 서고·kalas 오른쪽 방 | archive 51칸 | **돌바닥↔어두운 벽 타일셋** | ❌ 필요 (3~4회) |
| `%` 던전 벽 | 서고 벽 | archive 68칸 | 〃 | ❌ |
| `>` `<` 계단 | 서고 입구 | archive/kalas | **계단 물건** | ❌ 1회 |
| `S` | field (7,7) 열석 중앙 | | 열석 중앙 석판(ring 그림에 있음) | ✅ |

## 만들 순서 (PixelLab 하루 +5회 기준)
1. **풀↔돌바닥 타일셋** (`create_topdown_tileset`, v3 풀을 `upper_base_tile_id`로 이어서) — 광장·마당·길. 약 4회.
2. **돌바닥↔어두운 벽 타일셋**(서고용, `create_topdown_tileset`) — 약 4회.
3. **마을 외벽 + 성문 + 건물 2~3종**(고발청·여관·도서관 — `create_map_object`, **정면 시점 문구** 포함) — 약 4~5회.
4. **계단**(서고 입구) 1회, **나무 변형** 2회.
합계 약 15회 → 하루 5회면 3일. (체험 횟수는 소진, 유료 안 씀 — 사용자 결정 2026-10-18.)

## 시점 문제 (🧑 판정 필요)
집(`house.png`)과 열석 고리(`standing-stone-ring.png`)는 둘 다 **모서리가 보이는 비스듬한(3/4) 시점**의 작은 모형처럼 나온다. 캐릭터·타일은 정면에 가까운 위에서 본 시점. 두 가지 길:
- **그대로 쓴다**: 많은 탑다운 RPG가 건물만 비스듬히 보여 준다. 빠르고 그림이 풍부하다.
- **정면으로 다시 만든다**: 프롬프트에 `front-facing facade, flat orthographic top-down game sprite`를 넣어 건물마다 다시(1~2회씩). 일관성은 좋아지지만 횟수가 든다.
추천: 먼저 그대로 쓰고, 목업(`docs/screenshots/2026-10-27-R1b-kalas-cast-scene.png`)에서 거슬리는지 판정한 뒤 정한다.
