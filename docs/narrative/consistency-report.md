# 대사 일관성 점검 보고 (2026-10-27)

생성: `python3 scripts/narrative/consistency.py > docs/narrative/consistency-report.md` — 기계로 볼 수 있는 부분(어체 분포, 이름 중복, 옛 이름 잔존, 직함·용어 변형, 수치 표현, 중복 문장, 한·영 짝)만 본다. 어체 분류는 문장 끝 형태로 추정한 것이라 오탐이 있고, 아래 "의심 목록"은 사람이 판정한 뒤 남은 것이다.

## 이번 점검에서 고친 것 (모두 반영됨)
1. **모든 인물이 같이 쓰는 "모른다" 대사** `npc.default.unknown`이 "…글쎄, 그건 잘 모르겠네."(하게체 한 가지)였다. 해요체·합쇼체·반말 인물이 모르는 단어를 물으면 모두 이 말을 했다. → 어체 없는 "……(고개를 젓는다.)"로 교체(영어 "…(Shakes their head.)"). 근본 해결(인물별 모른다 대사)은 엔진 변경이 필요해 보류.
2. **합쇼체 인물이 해요체 끝맺음을 섞어 쓰던 28줄**(바느질꾼 유나, 구금실 간수, 자선 관장, 거지 할브, 기록사 미르, 떠돌이 노래꾼 셀, 빵집 주인, 기수 다인, 고발청 서기): "~거든요/~니까요/~이요?" → 합쇼체로.
3. **하게체·반말 인물의 어체 이탈 8줄**(현판 칠장이, 성문 고백관, 늙은 순찰 경비).
4. **니아의 직함** 단서 힌트 `word.trial.hint`가 "견습 필경사"였던 것을 "필경사"로(영어도).

5. **(2026-10-27 사용자 결정 반영) 대화 주제**: 규칙 변경으로 노래·크리처 단서도 주제 버튼에 나온다(`src/core/dialogue/talk.ts` CHIP_KINDS, 테스트 갱신). 그래도 남은 24줄(결론 단서에 걸린 것)은 각 인물의 다른 단어·인물·장소 주제로 옮기고 첫 문장도 맞췄다. 결과: 물을 수 없는 주제 0개(`python3 scripts/narrative/spec.py dead-topics`).
6. **얻을 수 없던 단서 6개**를 최소 수정으로 얻게 함(`python3 scripts/narrative/reachable.py` → 0개): 제단 사제 크레온←아이 리오(노아) 이름, 영성 서고←서기 세온 이름, 명상당←주지 다루 이름, 빵집 주인←빵집 주인 이름, 과부←과부 이름, 영(word.spirit)←서기 세온 job.
7. **헷갈리던 인물 이름 7개 개명**(마을 이름은 그대로): 카이온→바르칸(Kaion→Barkan), 레온→카셀(Leon→Kasel), 고르노→오스탄(Gorno→Ostan), 하르파→다멘(Harpa→Damen), 리오→노아(Rio→Noah), 셀레→하린(Cele→Harin), 아르벤→할덴(Arben→Halden). 이유: 순례자 이온/크레온/세르노·고르노/하르·하르파/리오나/셀레스/아르곤과 겹침. 엘린(칼라스)과 엘리아(마을)는 의도적으로 그대로 둠.

## 사람이 보고 문제 없다고 판정한 것
- 훈련관 하르의 "~한다/묻지 마라"는 해라체로 일관(엄한 교관), 제단 사제 크레온의 "~다/~구나"도 해라체로 일관.
- 면허 수행자 미온·곡비 실라의 하오체 뒤 "~니/~거요"는 하오체 연결형이라 정상.
- "지요/죠/지"는 어느 어체에서나 쓰이는 끝맺음이라 어체 판정에서 제외.
- 이름: 「마을 아이」 두 곳(칼라스·겸손)은 직책 이름이라 허용. 옛 이름(엘리/토벤/리네/이온/미르) 검색의 나머지 적중은 글자가 겹친 것이거나(카이온, 거리네) 마을마다 의도한 이름.
- 수치: 닷새(재판)·삼 년(영성 면허)·삼백 년(순례자)은 모든 곳에서 같다.

## 기계 점검 결과 원문
## 1. 인물별 어체 분포 (의심 = 주 어체가 아닌 문장이 20% 넘음)
| 인물 | 마을 | 주 어체 | 분포 | 의심 문장 수 |
|---|---|---|---|---|
| 자선 관장 `npc.compassion.almoner` | compassion | 합쇼체 | {'합쇼체': 20} | 0 |
| 빵집 주인 `npc.compassion.baker` | compassion | 합쇼체 | {'합쇼체': 9} | 0 |
| 골목 아이 피리 `npc.compassion.child` | compassion | 반말 | {'반말': 5} | 0 |
| 거지 할브 `npc.compassion.beggar` | compassion | 합쇼체 | {'합쇼체': 12, '해요체': 1} | 1 |
| 예배당 사제 리엔 `npc.compassion.priest` | compassion | 합쇼체 | {'합쇼체': 10, '해요체': 2} | 2 |
| 떠돌이 노래꾼 셀 `npc.compassion.wanderer` | compassion | 합쇼체 | {'합쇼체': 10} | 0 |
| 방앗간 주인 마레 `npc.compassion.miller` | compassion | 합쇼체 | {'합쇼체': 12, '반말': 1, '해요체': 1} | 2 |
| 바느질꾼 유나 `npc.compassion.seamstress` | compassion | 합쇼체 | {'합쇼체': 10} | 0 |
| 기록관 테오 `npc.compassion.scribe` | compassion | 합쇼체 | {'합쇼체': 12, '해요체': 1} | 1 |
| 늙은 어머니 한나 `npc.compassion.grandmother` | compassion | 반말 | {'반말': 11} | 0 |
| 곳간 짐꾼 브람 `npc.compassion.porter` | compassion | 반말 | {'반말': 10, '하게체': 2} | 2 |
| 현판 칠장이 오센 `npc.compassion.painter` | compassion | 하게체 | {'하게체': 9} | 0 |
| 줄꾼 다라 `npc.compassion.linesitter` | compassion | 해요체 | {'해요체': 12} | 0 |
| 빨래꾼 노라 `npc.compassion.laundress` | compassion | 해요체 | {'해요체': 14} | 0 |
| 물지기 투르 `npc.compassion.watercarrier` | compassion | 하오체 | {'하오체': 7, '해요체': 1} | 1 |
| 원로 베론 `npc.honor.elder` | honor | 반말 | {'반말': 2} | 0 |
| 후계자 시온 `npc.honor.heir` | honor | 하게체 | {'하게체': 4} | 0 |
| 가문 기록관 마델 `npc.honor.scribe` | honor | 하게체 | {'하게체': 1} | 0 |
| 검술 사범 바르칸 `npc.honor.swordmaster` | honor | 하게체 | {'하게체': 19} | 0 |
| 술 빚는 무르 `npc.honor.brewer` | honor | 하게체 | {'하게체': 10, '반말': 2} | 2 |
| 마을 아이 아린 `npc.honor.child` | honor | 반말 | {'반말': 18} | 0 |
| 과부 세린 `npc.honor.widow` | honor | 해요체 | {'해요체': 22, '합쇼체': 1, '반말': 1} | 2 |
| 석공 바스틴 `npc.honor.mason` | honor | 하게체 | {'하게체': 15} | 0 |
| 바느질꾼 리안 `npc.honor.seamstress` | honor | 해요체 | {'해요체': 14} | 0 |
| 늙은 유모 넬다 `npc.honor.nurse` | honor | 해요체 | {'해요체': 12} | 0 |
| 북잡이 게일 `npc.honor.drummer` | honor | 반말 | {'반말': 2, '하게체': 1} | 1 |
| 중매쟁이 미샤 `npc.honor.matchmaker` | honor | 해요체 | {'해요체': 11} | 0 |
| 대리 결투꾼 로크 `npc.honor.proxy` | honor | 반말 | {'반말': 4, '하게체': 1} | 1 |
| 곡비 실라 `npc.honor.mourner` | honor | 하오체 | {'하오체': 8, '반말': 3} | 3 |
| 침묵하는 장로 `npc.humility.silent-elder` | humility | 하게체 | {'하게체': 1} | 0 |
| 마을 아이 `npc.humility.child` | humility | 해요체 | {'해요체': 11} | 0 |
| 서고지기 `npc.humility.librarian` | humility | 하게체 | {'하게체': 8, '반말': 1} | 1 |
| 밥하는 이 `npc.humility.cook` | humility | 반말 | {'반말': 2} | 0 |
| 수련 중인 이 `npc.humility.novice` | humility | 반말 | {'반말': 1} | 0 |
| 은자 `npc.humility.hermit` | humility | 하게체 | {'하게체': 1} | 0 |
| 과부 `npc.humility.widow` | humility | 반말 | {'반말': 1} | 0 |
| 비석장이 `npc.humility.stonecutter` | humility | 반말 | {'반말': 7, '하게체': 1} | 1 |
| 등잔지기 `npc.humility.lampkeeper` | humility | 합쇼체 | {'합쇼체': 5} | 0 |
| 자리패 깎는 이 `npc.humility.tagcarver` | humility | 하게체 | {'하게체': 5, '반말': 1} | 1 |
| 아이 어머니 `npc.humility.mother` | humility | 해요체 | {'해요체': 10} | 0 |
| 비질하는 이 `npc.humility.sweeper` | humility | 하오체 | {'하오체': 6} | 0 |
| 재판관 할덴 `npc.justice.judge` | justice | 반말 | {'반말': 3} | 0 |
| 법정 서기 카셀 `npc.justice.clerk` | justice | 하게체 | {'하게체': 18, '반말': 2} | 2 |
| 과부 하린 `npc.justice.widow` | justice | 해요체 | {'해요체': 31} | 0 |
| 갇힌 청년 이렌 `npc.justice.prisoner` | justice | 해요체 | {'해요체': 26} | 0 |
| 목격자 카인 `npc.justice.witness` | justice | 반말 | {'반말': 14, '하게체': 1} | 1 |
| 광장 아이 리네 `npc.justice.child` | justice | 반말 | {'반말': 11} | 0 |
| 사제 세르노 `npc.justice.priest` | justice | 하게체 | {'하게체': 18, '반말': 1} | 1 |
| 석공 두만 `npc.justice.mason` | justice | 하게체 | {'하게체': 14, '반말': 1} | 1 |
| 필경사 벨라 `npc.justice.scribe` | justice | 합쇼체 | {'합쇼체': 13, '반말': 1} | 1 |
| 묘지기 오스탄 `npc.justice.gravedigger` | justice | 반말 | {'반말': 12} | 0 |
| 은세공인 니엘 `npc.justice.silversmith` | justice | 해요체 | {'해요체': 13} | 0 |
| 묘지 옆 노파 오르마 `npc.justice.old-neighbor` | justice | 하오체 | {'하오체': 10} | 0 |
| 저울 검사관 하임 `npc.justice.scale-keeper` | justice | 합쇼체 | {'합쇼체': 7, '해요체': 1} | 1 |
| 곡꾼 에다 `npc.justice.keener` | justice | 해요체 | {'해요체': 13, '반말': 1} | 1 |
| 매 집행인 보르 `npc.justice.lash-bearer` | justice | 반말 | {'반말': 6, '하게체': 1} | 1 |
| 열석 문지기 `npc.field.gatekeeper` | kalas | 하오체 | {'반말': 1, '하오체': 18} | 1 |
| 사냥꾼 `npc.field.hunter` | kalas | 반말 | {'반말': 6} | 0 |
| 성문 고백관 `npc.kalas.confessor` | kalas | 하게체 | {'하게체': 18} | 0 |
| 고발관장 `npc.kalas.warden` | kalas | 하게체 | {'하게체': 27, '반말': 2} | 2 |
| 고발관 견습 엘린 `npc.kalas.elin` | kalas | 해요체 | {'합쇼체': 3, '해요체': 16} | 3 |
| 필경사 니아 `npc.kalas.nia` | kalas | 해요체 | {'해요체': 25, '반말': 1} | 1 |
| 니아의 동생 토비 `npc.kalas.tobi` | kalas | 해요체 | {'해요체': 25} | 0 |
| 직조공 미라 `npc.kalas.mira` | kalas | 반말 | {'반말': 19, '하게체': 2} | 2 |
| 마을 아이 `npc.kalas.child` | kalas | 반말 | {'반말': 10, '하게체': 1} | 1 |
| 여관 주인 `npc.kalas.innkeeper` | kalas | 하게체 | {'하게체': 11, '반말': 2} | 2 |
| 늙은 사서 `npc.kalas.librarian` | kalas | 하게체 | {'하게체': 12, '반말': 1} | 1 |
| 구금실 간수 `npc.kalas.jailer` | kalas | 합쇼체 | {'합쇼체': 10} | 0 |
| 제빵사 `npc.kalas.baker` | kalas | 반말 | {'반말': 6} | 0 |
| 젊은 순찰 경비 `npc.kalas.patrol-a` | kalas | 합쇼체 | {'합쇼체': 11, '해요체': 1} | 1 |
| 늙은 순찰 경비 `npc.field.patrol` | kalas | 반말 | {'반말': 9} | 0 |
| 약초 장수 `npc.field.herbalist` | kalas | 반말 | {'반말': 5} | 0 |
| 종지기 `npc.kalas.bellringer` | kalas | 해요체 | {'해요체': 13} | 0 |
| 순례 지망생 `npc.field.aspirant` | kalas | 해요체 | {'해요체': 12} | 0 |
| 니아네 이웃 할머니 `npc.kalas.neighbor` | kalas | 해요체 | {'하게체': 1, '해요체': 8, '반말': 1} | 2 |
| 고발청 서기 `npc.kalas.clerk` | kalas | 합쇼체 | {'합쇼체': 13} | 0 |
| 들판 행상인 `npc.field.peddler` | kalas | 반말 | {'반말': 10} | 0 |
| 제단 사제 크레온 `npc.sacrifice.altar-priest` | sacrifice | 반말 | {'반말': 3, '하게체': 1} | 1 |
| 과부 레아 `npc.sacrifice.widow` | sacrifice | 해요체 | {'해요체': 22} | 0 |
| 아이 노아 `npc.sacrifice.child` | sacrifice | 반말 | {'반말': 11, '하게체': 1} | 1 |
| 순례자 이온 `npc.sacrifice.pilgrim` | sacrifice | 하오체 | {'해요체': 2, '하오체': 17} | 2 |
| 외과의 세인 `npc.sacrifice.surgeon` | sacrifice | 하게체 | {'하게체': 17, '반말': 2} | 2 |
| 기록사 미르 `npc.sacrifice.scribe` | sacrifice | 합쇼체 | {'합쇼체': 19} | 0 |
| 석공 다멘 `npc.sacrifice.mason` | sacrifice | 하게체 | {'하게체': 14} | 0 |
| 빵 굽는 세라 `npc.sacrifice.baker` | sacrifice | 반말 | {'반말': 11} | 0 |
| 치유사 노라 `npc.sacrifice.healer` | sacrifice | 하게체 | {'하게체': 8, '반말': 2} | 2 |
| 텃밭지기 마노 `npc.sacrifice.gardener` | sacrifice | 반말 | {'반말': 10} | 0 |
| 성소 시종 테사 `npc.sacrifice.acolyte` | sacrifice | 합쇼체 | {'합쇼체': 10, '해요체': 1} | 1 |
| 줄잡이 키로 `npc.sacrifice.cord-keeper` | sacrifice | 해요체 | {'해요체': 14} | 0 |
| 붕대 장수 니코 `npc.sacrifice.bandage-seller` | sacrifice | 반말 | {'반말': 7, '하게체': 1} | 1 |
| 무릎 바친 노인 페로 `npc.sacrifice.old-kneeler` | sacrifice | 하오체 | {'하오체': 10} | 0 |
| 산파 할라 `npc.sacrifice.midwife` | sacrifice | 반말 | {'반말': 8, '하게체': 2} | 2 |
| 주지 스님 다루 `npc.spirituality.monk` | spirituality | 반말 | {'반말': 3} | 0 |
| 견습 스님 이안 `npc.spirituality.novice` | spirituality | 해요체 | {'해요체': 21} | 0 |
| 치유사 루아 `npc.spirituality.healer` | spirituality | 반말 | {'반말': 13} | 0 |
| 은자 펠라 `npc.spirituality.hermit` | spirituality | 반말 | {'반말': 16, '하게체': 1} | 1 |
| 정원지기 호레 `npc.spirituality.gardener` | spirituality | 하게체 | {'하게체': 15, '반말': 1} | 1 |
| 아이 소미 `npc.spirituality.child` | spirituality | 반말 | {'반말': 13} | 0 |
| 찻집 주인 도란 `npc.spirituality.brewer` | spirituality | 하게체 | {'하게체': 13, '반말': 1} | 1 |
| 수문장 구르 `npc.spirituality.gatekeeper` | spirituality | 하게체 | {'하게체': 13, '반말': 1} | 1 |
| 과부 이레 `npc.spirituality.widow` | spirituality | 해요체 | {'해요체': 21} | 0 |
| 공양주 오미 `npc.spirituality.cook` | spirituality | 해요체 | {'해요체': 12, '반말': 1} | 1 |
| 향 빚는 이 누리 `npc.spirituality.incense` | spirituality | 해요체 | {'해요체': 13} | 0 |
| 물시계지기 타오 `npc.spirituality.clock` | spirituality | 합쇼체 | {'합쇼체': 12} | 0 |
| 목탁 깎는 이 케아 `npc.spirituality.carver` | spirituality | 반말 | {'하게체': 1, '반말': 7} | 1 |
| 면허 수행자 미온 `npc.spirituality.licensee` | spirituality | 하오체 | {'하오체': 7, '해요체': 2, '반말': 1, '하게체': 1} | 4 |
| 무패의 투사 `npc.valor.champion` | valor | 반말 | {'반말': 1} | 0 |
| 훈련관 하르 `npc.valor.sergeant` | valor | 하게체 | {'하게체': 1, '반말': 1} | 1 |
| 대장장이 브란 `npc.valor.smith` | valor | 하게체 | {'하게체': 10} | 0 |
| 주막 주인 오렌 `npc.valor.brewer` | valor | 하게체 | {'반말': 1, '하게체': 9} | 1 |
| 광장 아이 루피 `npc.valor.child` | valor | 반말 | {'반말': 7} | 0 |
| 노병 켈 `npc.valor.veteran` | valor | 하게체 | {'하게체': 8} | 0 |
| 정찰병 사이 `npc.valor.scout` | valor | 반말 | {'반말': 7, '하게체': 1} | 1 |
| 치료사 아샤 `npc.valor.healer` | valor | 합쇼체 | {'합쇼체': 12, '해요체': 1} | 1 |
| 기수 다인 `npc.valor.standard` | valor | 합쇼체 | {'합쇼체': 9} | 0 |
| 과부 렌 `npc.valor.widow` | valor | 합쇼체 | {'합쇼체': 11, '해요체': 2} | 2 |
| 미장이 토반 `npc.valor.plasterer` | valor | 해요체 | {'해요체': 14} | 0 |
| 아랫마을 노파 우나 `npc.valor.oldwoman` | valor | 반말 | {'하게체': 1, '반말': 5} | 1 |
| 내기꾼 고스 `npc.valor.bookie` | valor | 해요체 | {'해요체': 15} | 0 |
| 신병 탄 `npc.valor.recruit` | valor | 합쇼체 | {'합쇼체': 11, '해요체': 1} | 1 |
| 석수 도윈 `npc.valor.carver` | valor | 하오체 | {'하오체': 11, '반말': 1} | 1 |

### 의심 목록 (어체가 섞였을 수 있는 인물 — 사람이 판정; '지요/죠/지'는 중립이라 제외)
- **훈련관 하르** `npc.valor.sergeant` 주=하게체, 다른 어체 50%
  - [반말] 둘 중 어느 쪽이 내 말인지는 묻지 마라.  (`valor.npc.sergeant.retreat.t`)
- **면허 수행자 미온** `npc.spirituality.licensee` 주=하오체, 다른 어체 36%
  - [해요체] 이번에도 도장은 받을 거요.  (`spirituality.npc.licensee.greet`)
  - [반말] 한 번도 절차를 어긴 적이 없으니.  (`spirituality.npc.licensee.greet`)
  - [하게체] 면허 번호 열하나.  (`spirituality.npc.licensee.name.t`)
  - [해요체] 엘리아에서 면허를 가장 먼저 받은 열두 사람 가운데 하나요.  (`spirituality.npc.licensee.name.t`)
- **북잡이 게일** `npc.honor.drummer` 주=반말, 다른 어체 33%
  - [하게체] 누구 이름 앞에서든 같은 소리가 나.  (`honor.npc.drummer.job.t`)
- **곡비 실라** `npc.honor.mourner` 주=하오체, 다른 어체 27%
  - [반말] 이 마을 높은 집 사람들은 제 손으로 울지 않으니.  (`honor.npc.mourner.greet`)
  - [반말] 상주는 꼿꼿이 서 있어야 체면이 서니.  (`honor.npc.mourner.job.t`)
  - [반말] 광장에서 꿇은 사람은 곡도 받지 못하니.  (`honor.npc.mourner.widow.t`)
- **제단 사제 크레온** `npc.sacrifice.altar-priest` 주=반말, 다른 어체 25%
  - [하게체] 그런데도 그 아내는 아직 빵 반쪽을 쥐고 놓지 못하는구나.  (`sacrifice.npc.altar-priest.widow.t`)

## 2. 인물 이름
### 같은 한국어 이름을 쓰는 서로 다른 인물
- 「마을 아이」: npc.humility.child, npc.kalas.child
### 같은 영어 이름을 쓰는 서로 다른 인물
- 「Village Child」: npc.humility.child, npc.kalas.child
### 옛 이름·바뀐 이름이 남아 있는지(문자열 전체에서 검색)
- 「리네」 `valor.npc.brewer.brother.t`: 전우나 형제나 다를 게 없네. 한 잔을 나눠 마신 사이지. 요즘 병영 젊은이들은 그 잔을 나눌 겨를도 없이
- 「리네」 `valor.npc.brewer.veteran.t`: 켈 영감은 저녁마다 저 구석에서 잔 하나를 앞에 두고 노래를 흥얼거리네. 늘 같은 데서 멈추지. 그러고는 잔
- 「리네」 `justice.npc.clerk.punishment.t`: 형벌은 세 가지일세. 매질, 추방, 그리고 무덤 앞에 무릎 꿇기. 무릎 꿇기가 가장 가볍지. ……아이들은 그
- 「리네」 `justice.npc.clerk.harsh.t`: 공정이라…… 이 기록을 보게. 지난달 조문을 어긴 사람이 여섯이네. 노래한 사람도, 무덤에 꽃을 두고 온 사
- 「리네」 `justice.npc.child.name`: 광장 아이 리네
- 「리네」 `justice.npc.child.name.t`: 나는 리네야. 이 마을에서 태어난 아이야. 내가 아는 노래가 셀레스에서 제일 많아.
- 「이온」 `sacrifice.npc.pilgrim.name`: 순례자 이온
- 「이온」 `sacrifice.npc.pilgrim.name.t`: 이온이라 하오. 지팡이 하나와 수첩 한 권이 내 전 재산이오. 가는 곳마다 듣고 본 참된 희생을 적어 왔소.
- 「미르」 `sacrifice.npc.scribe.name`: 기록사 미르
- 「미르」 `sacrifice.npc.scribe.name.t`: 미르입니다. 디오네의 기록사로, 제단에 바쳐진 것들의 목록을 옮겨 적는 사람이지요.
- 「이온」 `sacrifice.fact.dione.pilgrim.label`: 순례자 이온
- 「미르」 `sacrifice.fact.dione.scribe.label`: 기록사 미르
- 「이온」 `sacrifice.crisis.altar.text`: 제단 앞에 마을 사람들이 모였다. 사제 크레온이 어린 노아의 손을 들어 올리며 외친다. 사랑은 아낌없이 바치
- 「미르」 `sacrifice.crisis.altar.text`: 제단 앞에 마을 사람들이 모였다. 사제 크레온이 어린 노아의 손을 들어 올리며 외친다. 사랑은 아낌없이 바치

## 3. 용어·직함 변형 (같은 개념이 여러 말로 쓰이는지)
- 니아의 직함: 「필경사」 15회, 「견습 필경사」 0회, 「서기관」 5회, 「기록사」 8회
- 고발청 책임자: 「고발관장」 5회, 「관장」 32회, 「고발관 우두머리」 0회
- 재판하는 사람(정의): 「재판관」 17회, 「판사」 0회, 「판관」 17회
- 순례자: 「순례자」 29회, 「순례객」 0회, 「나그네」 1회
- 서고: 「옛 서고」 6회, 「봉인 서고」 1회, 「서고」 38회, 「도서관」 0회
- 경전: 「빈 경전」 7회, 「경전」 9회, 「빈 책」 0회

## 4. 수치·기간 표현 (같은 사건의 숫자가 서로 다른지 사람이 확인)
- 「삼 년」 12곳: pilgrim, monk.novice, novice.name, novice.meditation-hall, brewer.job, brewer.license-rule…
- 「작년」 8곳: kalas.mira.ledger, altar-priest.widow, pilgrim.martyr-contest, scribe.job, scribe.widow, healer.surgeon…
- 「삼백 년」 7곳: field.gatekeeper.job, field.gatekeeper.silence, kalas.librarian.pilgrim, field.aspirant.job, pilgrim.pilgrim, scribe.job…
- 「사흘」 6곳: grandmother.hunger, surgeon.widow, cord-keeper.widow, cord-keeper.widow, cook.novice, carver.job
- 「청년」 6곳: clerk.prisoner, prisoner, witness.mourner, scribe.truth, scribe.prisoner, gravedigger.prisoner
- 「삼십 년」 5곳: miller.name, brewer.name, judge.name, judge.graveyard, brewer.name
- 「이레」 5곳: novice.widow, healer.widow, healer.widow, widow, widow.name
- 「이십 년」 4곳: field.patrol.name, porter.job, clerk.prisoner, clerk.judge
- 「닷새」 3곳: kalas.warden.trial.witness, kalas.elin.trial, kalas.innkeeper.job
- 「사십 년」 3곳: smith.name, smith.forge, mourner.name
- 「십 년」 2곳: kalas.warden.nia, bookie.name
- 「열두 번」 2곳: field.patrol.ledger, field.patrol.ledger
- 「스무 번」 1곳: kalas.confessor.job
- 「팔 년」 1곳: kalas.mira.name
- 「하루 세 번」 1곳: kalas.bellringer.job
- 「백 년」 1곳: painter.almoner

## 5. 중복 문장과 길이
- 완전히 같은 문장이 여러 키에 있는 경우: 1건
  - 「……(고개를 젓는다.)」 ← npc.default.unknown, npc.default.unknown, npc.default.unknown, npc.default.unknown
- 230자 넘는 대사: 0건

## 6. 한국어·영어 짝
- 영어 문자열이 빠진 인물: 0
- 한국어 대비 영어 길이가 이상한(너무 짧거나 김) 문장: 0건
