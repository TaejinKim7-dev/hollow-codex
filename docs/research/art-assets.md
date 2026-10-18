# R-1 그래픽 자산 조사

확인일: 2026-10-18 · 조사: Codex · 상태: 조사 완료, 사용자 선택 전.
기준: `docs/plan.md` §0·§2. 원본 파일을 공개 저장소에 넣을 수 있고, 32×32 이상 또는 그만큼 다듬어진 픽셀 아트로 지형·마을·실내·던전·사람·몬스터·4방향 걷기를 구성할 것.

## 1. 추천

**LPC Base Assets + Universal LPC 캐릭터 생성기의 허용 라이선스 부품 + LPC 계열 보완 타일**을 추천한다. 기본 타일은 32×32, 사람의 표준 프레임은 64×64다. 같은 LPC 계열에서 필요한 모든 범주의 기반을 구할 수 있고, CC-BY/CC-BY-SA 조건을 지키면 원본과 수정본을 공개 저장소에 둘 수 있다. 구매비는 $0이다. [기본 묶음][lpc] [생성기][generator]

이것은 **채택 결정이나 게임 화면 완성 판정이 아니다**. 모든 고유 소품까지 갖춘 완제품은 찾지 못했다. 여덟 마을의 차별화, 고백석·열석·빈 경전, 필요한 개별 몬스터의 방향별 움직임은 아래 빈 곳에 남긴다. 캐릭터 생성기는 원래 LPC와 Revised/Expanded 계열을 함께 제공하므로 한 규격·팔레트를 선택해야 한다. 이름에 LPC가 붙었다는 사실만으로 자동으로 어울리는 것은 아니다. [생성기][generator]

## 2. 후보 비교

가격은 확인일의 USD 표시가이며 세금·환율은 포함하지 않는다. 화풍은 작가 설명에 기초한 분류다. 직접 이미지를 연 범위는 §4에 따로 적었다. `미확인`은 지원한다고 계산하지 않았다.

| 후보·작가 / 출처 | 타일·화풍 | 제공 범위와 애니메이션 | 가격 | 공개 저장소 원본 재배포 / 판단 |
|---|---|---|---|---|
| LPC Base Assets · Sharm, Redshrike, CharlesGabriel, MrBeast, HughSpectrum [원문][lpc] | 32×32 환경, 고전 판타지 LPC | 풀·물·나무·집·실내·성·던전·사람·몬스터. 사람 4방향 보행 시트 직접 확인 | 무료 | CC-BY-SA 3.0 선택 가능. 조건부 가능, 추천 기반 |
| Universal LPC · 다수 작가, 부품별 CREDITS.csv [원문][generator] | 표준 사람 64×64 프레임, LPC 파생 규격 공존 | 플레이어·NPC의 몸·옷·머리 조합과 보행 등. 부품마다 지원 동작 차이 | 무료 | 개별 CC0/CC-BY/CC-BY-SA 부품만 선택. 생성기 코드와 그림 라이선스를 혼동하지 않음 |
| Ninja Adventure · Pixel-Boy + AAA [원문][ninja] | 16×16, 닌자 테마 | 50+ 캐릭터, 30+ 몬스터, 9 보스, 외부·내부·바닥 타일, 애니메이션. 가구는 제한적, 던전 확장은 작가가 향후 작업으로 언급 | 무료·자율 후원 | CC0, 가능. 범위는 넓지만 해상도와 세계 분위기에서 후순위 |
| Mana Seed · Seliel the Shaper [숲][mana-forest] [집][mana-home] [약관][mana-license] | 16×16, 세밀한 SNES풍 | 숲, 집 외부·내부는 별도 묶음. 캐릭터·몬스터는 별도 상품이며 이번 조사에서 완결 세트·4방향 조합 미검증 | 숲 완전판 $19.99, 집 $17.99; 전체 비용 미산정 | 독자 약관, 팀 밖 재배포 금지. 기본 정책 밖. 추천에서 제외 |
| Pixel Art Top Down – Basic · Cainos [원문][cainos] | 32×32, 중세 유적·자연 | 풀·나무·돌바닥·벽·소품, Unity 데모. 마을·실내·던전·NPC·몬스터 전체 세트 아님. 4방향 보행 미확인 | 무료·자율 후원 | 독자 약관, 재배포 금지. 기본 정책 밖 |
| Tiny Swords · Pixel Frog [원문][tiny] | 64×64 격자, 만화풍 전략게임 | 지형·건물·전사 등 유닛·적과 애니메이션. 생활형 실내·NPC 및 4방향 보행 충족 미확인 | 현 무료판, Enemy Pack $15 | 현재판은 재배포 금지. 별도 `TS_old version_CC0 Licensed` 다운로드가 있으나 구판 내용·동봉 약관은 미검증. 두 판을 섞지 않음 |
| Serene Village revamped · LimeZu [원문][serene] | 16×16, 아늑한 마을 | 지형·자연·24종 집·움직이는 소품. 미리보기 사람은 별도 Modern Interiors 출처. 던전·몬스터 없음 | 무료·자율 후원 | 이 묶음은 CC-BY 4.0, 가능. 별도 상품까지 같은 라이선스라고 추정하지 않음 |
| Sprout Lands · Cup Nooble [원문][sprout] | 파스텔 농장, 페이지의 격자 수치 미확인 | 풀·물·농장·동물. 유료판 캐릭터 4방향 걷기 등 6동작. 던전은 계획 항목 | 기본 무료, 유료 $3.99 | 무료는 비상업 한정, 양쪽 모두 수정본까지 재배포 금지. 제외 |
| Mystic Woods · Game Endeavor [원문][mystic] | 16×16, 소박한 숲 판타지 | 환경·주인공·슬라임, 개발 기록에 실내·해골·앞뒤 애니메이션. 충분한 NPC·던전 세트 미확인 | 기본 무료, 유료 $3.99 | 무료는 비상업 한정, 양쪽 모두 재배포 금지. 제외 |
| Time Fantasy · finalbossblues [타일][tf] [작가 설명][tf-license] | 16×16, SNES풍 | 자연·마을·성 내외부·동굴·광산·유적·사원. 사람·몬스터는 별도 상품 | 타일 $15, 페이지의 22개 번들 $180 | 직접 재배포 금지라는 작가 설명. 공개 원본 저장소용 추천에서 제외 |
| Tile Fantasy: Overworld & Caves · ArMM1998 [원문][armm] | 16×16, GBA풍 | 지형·중세 마을 외부·동굴·움직이는 간판/용암. 사람·몬스터·4방향 걷기 없음 | $5 | 페이지 표기 CC-BY 4.0, 조건부 가능. 구매는 사용자 결정. 던전·늪·사막은 예정 목록이라 제공 범위에서 제외 |

## 3. 라이선스 원문과 재배포 근거

아래 인용은 각 페이지에서 직접 확인했다. 공개 저장소에 넣는 것은 원본 복제·공개 배포이므로, 게임에 쓸 수 있다는 문구만으로 허용 판정을 내리지 않았다.

### 공개 라이선스

- **LPC 기본 묶음**: 페이지의 `License(s): CC-BY-SA 3.0` 표기와 압축 안 `CREDITS.TXT`의 파일별 작가를 확인했다. GPL도 제시되지만 추천안은 CC 쪽을 사용한다. [출처][lpc]
- **CC-BY-SA 3.0 §3(c)**: “to Distribute and Publicly Perform the Work including as incorporated in Collections”. 공개 저장소 배포 가능 근거다. §4에 따라 저작자·라이선스·고지를 보존하고, 수정 내용을 표시하며, 수정 자산에는 허용되는 동일조건변경허락 라이선스를 적용해야 한다. 외부 원본을 저장소의 일괄 CC-BY-SA 4.0 고지로 덮어쓰지 않는다. [법문][sa3]
- **생성기**: “This file lists the authors, license(s), and links to the original URL(s), for every image inside `spritesheets`.” 해당 CREDITS.csv 또는 내보낸 선택 부품 크레딧으로 확인한다. OGA-BY/GPL만 있는 항목은 현 기본 허용 목록 밖이므로 자동 채택하지 않는다. [원문][generator]
- **Ninja Adventure**: “They are released under the Creative Commons Zero (CC0) license.” [원문][ninja] CC0 §1은 복제·수정·배포 권리를 열거하고 §2에서 권리를 포기한다. 핵심 표현은 “waives, abandons, and surrenders all of Affirmer's Copyright and Related Rights”. 원본 공개 재배포가 가능하다. [법문][cc0]
- **Serene Village / ArMM1998 Tile Fantasy**: 두 판매 페이지의 라이선스 표기가 `Creative Commons Attribution v4.0 International`이다. CC-BY 4.0 §2(a)(1)(A): “reproduce and Share the Licensed Material, in whole or in part”. §3의 저작자·출처·라이선스·수정 표시를 유지하면 공개 저장소 배포가 가능하다. [Serene][serene] [Tile Fantasy][armm] [법문][by4]

### 제한 약관

| 후보 | 원문 핵심 인용 | 적용 결과 |
|---|---|---|
| Cainos | “You may not redistribute it or resell it.” [출처][cainos] | 공개 저장소 원본 배포 불가 |
| Mana Seed | “resell or redistribute my art outside your team” [출처][mana-license] | 금지 목록의 문장. 팀 내 공유와 공개 배포를 구별해야 함. 단일 제품 제한과 GenAI 프로젝트 제한도 있어 별도 검토 없이 도입하지 않음 |
| Tiny Swords 현재판 | “You may not redistribute, resell, or repackage the assets, even if the files are modified.” [출처][tiny] | 구판 CC0 표시를 현재판에 적용할 수 없음 |
| Sprout Lands | “This asset pack can't be resold or redistributed even if modified” [출처][sprout] | 유료판도 원본 공개 불가, 무료판 비상업 제한 추가 |
| Mystic Woods | “You can not redistribute or resale, even if modified.” [출처][mystic] | 무료·유료 모두 같은 재배포 제한 |
| Time Fantasy | “you can do pretty much anything other than redistribute the assets directly.” [작가 설명][tf-license] | 작가가 연결한 [GameDev Market 약관][gdm]도 조회. 구매 경로별 적용 약관을 확정하지 않았으므로 공개 재배포 허용으로 해석하지 않음 |

유료 구매나 저장소 밖 보관은 사용자 승인 없이 진행하지 않는다. 제한 약관을 수용하는 경우에도 웹 빌드의 PNG 배포 조건은 별도로 해결해야 한다. 단순히 Git에 넣지 않는 것만으로 조건을 만족한다고 단정할 수 없다.

## 4. 추천 조합의 실제 범위와 남는 빈 곳

| 요구 | 추천 자산 / 확인 근거 | 남는 작업 |
|---|---|---|
| 들판·숲·물 | Base의 grass, dirt, water, treetop, trunk. 풀·나무 이미지를 직접 열어 확인 | 땅·물건 레이어 분리, 지형 모서리와 충돌 검증 |
| 마을 | Base의 house, country, castle 계열. house 이미지 직접 확인 | 8마을의 건축·색·소품 구성 구분 |
| 실내·서고 | Base의 inside, cabinets, kitchen. inside·cabinets를 열어 벽·책장·가구 확인 | 봉인 서고와 빈 경전의 고유 표현 |
| 던전 | Base의 dungeon, stairs, hole. dungeon 이미지를 열어 벽·철창·통로 확인 | 현재 맵과 연결 규격 검증 |
| 플레이어·마을 사람 | Base의 male_walkcycle은 4방향 × 9프레임을 직접 확인. 생성기로 옷·머리 변형 가능 | 최종 인물 선택, 선택한 모든 레이어가 4방향 보행을 갖는지 확인 |
| 몬스터·전투 | Base의 몬스터, 선택 보완 [LPC Monsters][monsters] | 슬라임 시트는 직접 확인. 모든 적의 4방향 보행·공격을 확인한 것은 아님. 기존 조우와 종별 대응 필요 |
| 고유 소품 | 기본 책장·돌·건축 자산을 바탕으로 LPC 화풍에 맞춘 별도 제작 제안 | 열석, 고백석, 미덕별 표식 등은 기성 완제품 없음. 제작 범위는 사용자 선택 뒤 설계에서 확정 |

보완 후보도 같은 화풍에서 찾았다. [LPC terrain extension][terrain]은 32×32 지형 접합 확장(CC-BY-SA 3.0 선택), [Interior Castle Tiles][castle]는 Sharm의 실내(CC-BY 4.0 등 복수 허용), [LPC Monsters][monsters]는 기존 몬스터 공격 확장이다. 마지막 묶음은 박쥐만 OGA-BY 3.0이라고 명시하므로, **현 추천의 박쥐는 Base 쪽을 사용하고 확장 묶음의 박쥐는 제외**한다. 보완 묶음의 이미지는 이번에 직접 열지 않았으며 최종 파일 목록은 사용자 선택 뒤 확정한다.

직접 확인한 자료: [lpc_base_assets.zip][zip]의 CREDITS.TXT 및 위 PNG 8개. 임시 경로 `/tmp/hollow-r1-lpc/`에만 풀었고 저장소 자산으로 추가하지 않았다. ZIP SHA-256: `69efec8a26ef20b26cfd7a8de370e87d0e667136eba2d00392dde13d2ac52465`.

관찰: 집·실내·던전은 세부 묘사가 있는 공통 픽셀 화풍이며 캐릭터는 타일보다 큰 프레임을 쓴다. 투명 영역이 있으므로 기존 렌더러에 그대로 넣어서는 검은 배경 문제가 해결되지 않는다. 화면 배율과 발 위치 기준은 S 단계에서 정해야 한다. 이 확인은 원본 시트 정지 이미지 검토이며, 게임 장면 합성이나 실행 중 애니메이션 검증은 아니다.

## 5. 크레딧 문구 초안

아직 선택·도입하지 않았으므로 아래는 추천안의 초안이다. 최종 화면에는 실제 사용한 파일의 작가만 정확히 대응시킨 장부와 상세 크레딧 링크를 제공한다.

> 환경·인물·생물의 기본 그림: Liberated Pixel Cup Base Assets. Lanea Zimmerman (Sharm), Stephen Challener (Redshrike), Charles Sanchez (CharlesGabriel), Manuel Riecke (MrBeast), Daniel Armstrong (HughSpectrum). 출처: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles · CC-BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/ · 사용 파일별 수정 내용과 저작자는 상세 자산 장부에 표시.

생성기 출력은 **PNG와 함께 선택 부품의 크레딧 CSV/텍스트 및 재현용 JSON을 보존**해야 한다. 위 다섯 사람만으로 생성기 전체를 크레딧 처리하면 안 된다. 보완 타일도 각 출처의 작가와 라이선스를 추가한다. 외부 파일을 실제 도입할 때 `assets/LEDGER.md`와 동봉 라이선스에 반영한다.

## 6. 사용자에게 제안할 선택

추천은 **구매·재배포 제한 예외 없이 LPC 계열로 통일하고, 고유 소품은 같은 화풍으로 보완**하는 것이다. 기본 환경·인물 규격과 공개 저장소 조건을 함께 충족하기 때문이다. 전체 화풍이 마음에 드는지, 보완 제작 범위를 받아들일지는 사용자가 정한다. R-2 음원 조사가 끝나면 그래픽·음원 조합을 함께 선택하고 S 설계로 넘어간다. 이번 문서는 `docs/plan.md` §3의 사용자 결정으로 기록하지 않는다.

## 출처

모든 링크 확인일: 2026-10-18. 작가 페이지·원 배포처·라이선스 발행처를 근거로 사용했다. 일반 검색 결과의 제3자 라이선스 요약은 판정 근거에서 제외했다. Time Fantasy의 추정 `terms-of-use/`, `terms/` URL과 ArMM1998의 옛 묶음 URL은 조회 실패하여 근거로 쓰지 않았다.

[lpc]: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
[zip]: https://opengameart.org/sites/default/files/lpc_base_assets.zip
[generator]: https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
[ninja]: https://pixel-boy.itch.io/ninja-adventure-asset-pack
[mana-forest]: https://seliel-the-shaper.itch.io/summer-forest
[mana-home]: https://seliel-the-shaper.itch.io/half-timber-home
[mana-license]: https://selieltheshaper.weebly.com/user-license.html
[cainos]: https://cainos.itch.io/pixel-art-top-down-basic
[tiny]: https://pixelfrog-assets.itch.io/tiny-swords
[serene]: https://limezu.itch.io/serenevillagerevamped
[sprout]: https://cupnooble.itch.io/sprout-lands-asset-pack
[mystic]: https://game-endeavor.itch.io/mystic-woods
[tf]: https://finalbossblues.itch.io/fantasy-rpg-tileset-pack
[tf-license]: https://finalbossblues.itch.io/fantasy-rpg-tileset-pack/comments?before=62
[gdm]: https://www.gamedevmarket.net/terms-conditions
[armm]: https://armm1998.itch.io/tilefantasy
[sa3]: https://creativecommons.org/licenses/by-sa/3.0/legalcode.en
[cc0]: https://creativecommons.org/publicdomain/zero/1.0/legalcode.en
[by4]: https://creativecommons.org/licenses/by/4.0/legalcode.en
[terrain]: https://lpc.opengameart.org/content/lpc-terrain-extension
[castle]: https://opengameart.org/content/lpc-interior-castle-tiles
[monsters]: https://opengameart.org/content/lpc-monsters
