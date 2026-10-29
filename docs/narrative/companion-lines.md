# 동료 합류/이탈/재합류 대사 제안

이 문서는 `content/strings/{ko,en}.yaml`에 추가할 **제안 키**만 정리한다. 아직 코드나 문자열 파일에 반영하지 않았다.

**키 규칙**

- 합류: `companion.<npcId>.join`
- 이탈: `companion.<npcId>.leave`
- 재합류: `companion.<npcId>.rejoin`

`<npcId>`는 `npcs.yaml`에 기록된 전체 id를 그대로 쓴다(예: `companion.npc.kalas.elin.join`).

**작성 기준**

- 한 인물은 voice-bible의 어체를 하나만 쓴다(마음이 흔들릴 때만 "……").
- 1~2문장. 설명하지 않고 행동·사물(노래·칼·돌·장부·실 등)로 말한다.
- 모든 인물이 선의로 말한다.
- 원작의 이름·문장·데이터는 사용하지 않는다.

---

## 대상 동료 8명 (id ↔ 게임에 표시되는 이름)

`npcs.yaml`의 id와 `content/strings/ko.yaml`의 표시 이름이 다르다. 설계 문서의 "리오나·아르곤·헤론·셀레스·디오네·엘리아·솔강"은 **fact id 기준 이름**이고, 실제 인게임 이름은 아래와 같다.

| id | 표시 이름 (ko) | 표시 이름 (en) | 마을 | virtue | 사실 키 이름 |
|---|---|---|---|---|---|
| npc.compassion.wanderer | 떠돌이 노래꾼 셀 | Sel the Wandering Singer | 연민 | compassion | reona |
| npc.honor.swordmaster | 검술 사범 바르칸 | Barkan the Swordmaster | 명예 | honor | argon |
| npc.humility.novice | 수련 중인 이 | The Novice | 겸손 | humility | heron |
| npc.justice.mason | 석공 두만 | Duman the Mason | 정의 | justice | seles |
| npc.kalas.elin | 고발관 견습 엘린 | Elin, Apprentice Denouncer | 칼라스 | honesty | elin |
| npc.sacrifice.surgeon | 외과의 세인 | Sein the Surgeon | 희생 | sacrifice | dione |
| npc.spirituality.novice | 견습 스님 이안 | Ian the Novice | 영성 | spirituality | elia |
| npc.valor.sergeant | 훈련관 하르 | Harr the Drillmaster | 용맹 | valor | solgang |

`npc.arena.trainer`(연습장 교관, `leaveAfterDeeds: 99`)는 동료 8인에 포함하지 않는다. 연습장 전용 조연이고, 합류·이탈 대사가 필요한 대상이 아니다.

---

## 표 1. 대사 표

| 동료(id) | 구분 | 키 | ko | en | 근거가 된 기존 대사 키 |
|---|---|---|---|---|---|
| npc.compassion.wanderer | 합류 | `companion.npc.compassion.wanderer.join` | 당신의 길에서 노래가 새어 나옵니다. 그 소리를 따라가면, 반쪽짜리 노래도 다시 완성될 것 같습니다. | Your road lets a song leak through. If I follow that sound, even a half-remembered song might finish itself. | `compassion.npc.wanderer.job.t` — 길에서 배운 노래를 다음 마을에 전함. `compassion.npc.wanderer.song.t` — 나눔과 사랑의 노래. |
| npc.compassion.wanderer | 이탈 | `companion.npc.compassion.wanderer.leave` | 제 노래는 나눔을 노래하는데…… 제가 본 것은 받는 손을 밀어내는 일이었습니다. 잠시 이 길을 걸을 수 없겠습니다. | My song speaks of sharing… yet what I saw was a hand pushing the taker away. I cannot walk this road a little longer. | `compassion.npc.wanderer.sharing.t` — 나눔만 남으면 주는 손과 받는 손이 위아래로 갈림. |
| npc.compassion.wanderer | 재합류 | `companion.npc.compassion.wanderer.rejoin` | 곳간 문이 다시 열리었다고 들었습니다. 그 소식이 노래 한 줄이 되어 돌아왔습니다. | I heard the storehouse door stands open again. That news returned to me as one line of a song. | `compassion.npc.wanderer.charity.t` — 반듯한 자선의 이면. |
| npc.honor.swordmaster | 합류 | `companion.npc.honor.swordmaster.join` | 칼을 지키려는 자라면 따라가 보게. 다만 내 칼은 이기는 법이 아니라 무엇을 지킬지 묻는 칼이네. | If you mean to guard something with that blade, I'll walk with you. But my sword asks what to keep, not how to win. | `honor.npc.swordmaster.greet` — 무엇을 지키려는지 먼저 물음. `honor.npc.swordmaster.job.t` — 꿇을 줄 모르는 자는 검객이 아님. |
| npc.honor.swordmaster | 이탈 | `companion.npc.honor.swordmaster.leave` | 거짓을 듣고도 넘어가는 건, 칼날을 피하는 것과 같지 않네. 내가 가르치는 꿈은 이런 게 아니었어. | Letting a lie pass is no different from dodging a blade. The kneeling I taught was never for this. | `honor.npc.swordmaster.honor.t` — 참된 명예는 지킬 것과 낼 것을 아는 데 있음. |
| npc.honor.swordmaster | 재합류 | `companion.npc.honor.swordmaster.rejoin` | 시조의 노래 뒷절을 다시 들었네. 꿇는 것이 부끄러운 일이 아니라는 걸, 이제야 가르칠 수 있겠어. | I heard the second verse of the founder's song again. Now I can teach that kneeling is no shame. | `honor.npc.swordmaster.song.t` — 가문 노래의 앞절과 뒷절. |
| npc.humility.novice | 합류 | `companion.npc.humility.novice.join` | 아직 이름도 잊지 못했지만, 침묵 속에서 들을 수 있는 길이라면 따라가겠다. | I haven't forgotten my name yet. But if this is a road heard in silence, I'll follow. | `humility.npc.novice.silence.t` — 입을 다물면 귀가 열린다. `humility.npc.novice.job.t` — 예배당에서 침묵을 배움. |
| npc.humility.novice | 이탈 | `companion.npc.humility.novice.leave` | 입을 다물었다고 생각했는데, 사실은 내 목소리만 커지고 있었다. 잠시 혼자 서야겠다. | I thought I kept my mouth closed. But my own voice only grew louder. I must stand alone a while. | `humility.npc.novice.listening.t` — 듣는 것보다 참는 것이 더 많다. |
| npc.humility.novice | 재합류 | `companion.npc.humility.novice.rejoin` | 내 이름을 다시 물었다. 잊는 게 아니라 받아들이는 거라면, 같이 가도 되겠다. | Someone asked my name again. If forgetting means acceptance, I can walk with you. | `humility.npc.novice.wordname.t` — 이름을 잊어야 한다고 배웠다. |
| npc.justice.mason | 합류 | `companion.npc.justice.mason.join` | 돌은 거짓을 새기지 않으니, 당신 길의 돌을 함께 세우러 가지. | Stone won't hold a lie. Let me raise the stones along your road. | `justice.npc.mason.greet` — 돌에는 거짓을 새길 수 없음. `justice.npc.mason.job.t` — 죽은 이의 이름을 새기는 일. |
| npc.justice.mason | 이탈 | `companion.npc.justice.mason.leave` | 저울은 기울어졌는데, 나는 돌만 깎고 있었네. 벌보다 먼저 위로가 서지 않는 길이라면, 석공의 끌이 무거워. | The scale tipped, and I only kept carving stones. If comfort cannot stand before punishment, my chisel grows heavy. | `justice.npc.mason.harsh.t` — 산 사람의 잘못을 죽은 이의 돌에 새기는 법. |
| npc.justice.mason | 재합류 | `companion.npc.justice.mason.rejoin` | 묘지 앞에 노래가 섰다고 들었네. 돌 위에 새길 수 있는 것이 벌만은 아니라는 걸, 다시 믿고 싶구먼. | I heard a song stood by the grave. I want to believe again that a stone can hold more than punishment. | `justice.npc.mason.comfort-widow.t` — 과부의 비석에 벌 대신 위로를 남김. |
| npc.kalas.elin | 합류 | `companion.npc.kalas.elin.join` | 장부가 아닌 진실을 찾는 길이라면, 제 글씨도 따라가요. | If this road looks for truth outside the ledger, my hand will come too. | `npc.kalas.elin.job.t` — 글자를 또박또박 옮기는 건 좋아함. `npc.kalas.elin.ledger.t` — 장부가 이웃을 찌르는 무기가 된 것을 봄. |
| npc.kalas.elin | 이탈 | `companion.npc.kalas.elin.leave` | 거짓말을 들었는데 기록만 했어요. 그 장부가 사람을 덮는 걸 다시 보고 싶지 않아요. | I heard a lie and only wrote it down. I don't want to see another ledger cover a person. | `npc.kalas.elin.nia.t` — 니아 선배를 믿음. `npc.kalas.elin.trial.t` — 기록하는 사람은 아무것도 말릴 수 없음. |
| npc.kalas.elin | 재합류 | `companion.npc.kalas.elin.rejoin` | 니아 선배가 용서해 주셨어요. 저도 제 글씨를 다시 믿어도 되겠어요. | Senior Nia forgave me. I can trust my own handwriting again. | `npc.kalas.elin.archive.t` — 장부에 없는 이야기가 있을지도 모른다고 생각함. |
| npc.sacrifice.surgeon | 합류 | `companion.npc.sacrifice.surgeon.join` | 내 칼은 벌어진 살을 잇는 칼이네. 당신 길에서도 상처를 꿰매 줄 수 있다면 따라가겠네. | My blade closes what is torn. If I can sew a wound on your road, I'll go. | `sacrifice.npc.surgeon.name.t` — 칼은 살을 가르는 데가 아니라 잇는 데 씀. `sacrifice.npc.surgeon.job.t` — 상처를 꿰매는 일. |
| npc.sacrifice.surgeon | 이탈 | `companion.npc.sacrifice.surgeon.leave` | 내가 꿰맨 상처보다, 내가 내린 상처가 더 많아졌네. 제단 앞에서가 아니라 사람 곁으로 돌아가야겠어. | I dealt more wounds than I closed. I must return to people, not to the altar. | `sacrifice.npc.surgeon.witness.t` — 제단 돌에서 난 상처를 손끝이 먼저 앎. |
| npc.sacrifice.surgeon | 재합류 | `companion.npc.sacrifice.surgeon.rejoin` | 아궁이 불이 꺼지지 않았다고 들었네. 매일 채워 주는 사랑이라면, 내 실도 다시 쓸 수 있겠어. | I heard the hearth fire did not go out. If love fills itself every day, my thread can serve again. | `sacrifice.npc.surgeon.altar.t` — 실을 끓여 두고 제단 날을 기다림. |
| npc.spirituality.novice | 합류 | `companion.npc.spirituality.novice.join` | 아직 면허는 없지만, 진짜 기도를 찾는 길이라면 바닥 닦는 손도 따라갈게요. | I have no license yet. But if this road searches for real prayer, my scrubbing hands will follow. | `spirituality.npc.novice.job.t` — 선방 문 앞 바닥을 닦으며 수행. `spirituality.npc.novice.prayer.t` — 은자의 노래가 면허 없는 기도처럼 느껴짐. |
| npc.spirituality.novice | 이탈 | `companion.npc.spirituality.novice.leave` | 면허 있는 기도만 믿으려다 보니, 숨소리를 놓쳤어요. 선방 문 앞에서 다시 서 있어야겠어요. | I tried to trust only licensed prayer, and lost the sound of breath. I must stand outside the meditation door again. | `spirituality.npc.novice.silent-chant.t` — 면허 없는 노래가 듣고 나면 마음이 비워짐. |
| npc.spirituality.novice | 재합류 | `companion.npc.spirituality.novice.rejoin` | 새벽에 숨 노래를 들었어요. 면허 없는 소리도 기도가 될 수 있다면, 저도 돌아가요. | I heard the dawn breath song. If an unlicensed sound can also be prayer, I'm coming back. | `spirituality.npc.novice.meditation-hall.t` — 면허를 보여야 안쪽 선방에 들어감. |
| npc.valor.sergeant | 합류 | `companion.npc.valor.sergeant.join` | 허리에 칼은 찼군. 다친 전우를 데리고 돌아올 각오만 있다면 따라주지. | You wear a blade. If you're ready to bring a wounded comrade back alive, I'll come. | `valor.npc.sergeant.greet` — 발이 뒤로 빠져 있음을 지적. `valor.npc.sergeant.brother.t` — 전우는 같은 줄에 서서 버티는 사이. |
| npc.valor.sergeant | 이탈 | `companion.npc.valor.sergeant.leave` | 물러서야 할 자리에서 앞으로 나갔어. 그런 건 용기가 아니라 멍청이 짓이지. 나는 병영으로 돌아간다. | You stepped forward where you should have held. That's not courage, it's folly. I'm returning to the barracks. | `valor.npc.sergeant.retreat.t` — 병영 안과 밖에서 다른 말을 함. |
| npc.valor.sergeant | 재합류 | `companion.npc.valor.sergeant.rejoin` | 후퇴 법을 다시 봤다. 살아서 돌아오는 것도 용기라면, 이 칼을 다시 맡겠군. | I saw the retreat law again. If coming back alive is also courage, I'll take up this blade once more. | `valor.npc.sergeant.retreat-law.t` — 사라진 후퇴 법. |

---

## 표 2. 재합류 조건 제안

현재 8인 중 엘린을 제외한 7명은 `rejoinRequires: []`다. 이탈 후 즉시 복귀할 수 있으므로, 동료의 미덕과 연결된 **실제 존재하는 fact id**를 재합류 조건으로 제안한다.

| 동료 | 제안 rejoinRequires | 근거 fact / 행실 id | 그 조건이 뜻하는 것(1줄) |
|---|---|---|---|
| npc.compassion.wanderer | `[fact.reona.open-pantry]` | `fact.reona.open-pantry` (연민 마을 위기 `crisis.compassion.hoard`의 `option.open-pantry` 해결 시 획득) | 마을의 나눔이 회복되었다는 사실을 알면, 연민의 동료가 다시 길을 함께 걷는다. |
| npc.honor.swordmaster | `[fact.argon.kneeling-lord]` | `fact.argon.kneeling-lord` (`honor.npc.swordmaster`의 `word.courage`·`word.honor`·`honor.npc.elder`·`honor.npc.mason` 대화로 획득) | 진정한 명예가 청면이 아니라 지킬 것을 아는 것임을 깨달으면, 명예의 동료가 칼을 다시 맡긴다. |
| npc.humility.novice | `[fact.heron.real-name]` | `fact.heron.real-name` (`humility.npc.silent-elder`의 `name` 대화로 획득) | 이름을 잊는 것이 아니라 진짜 자신을 받아들이는 것이 겸손임을 알면, 겸손의 동료가 돌아온다. |
| npc.justice.mason | `[fact.seles.comfort-widow]` | `fact.seles.comfort-widow` (`justice.npc.mason`의 `fact.seles.widow` 대화, `justice.npc.widow` 대화로 획득) | 벌보다 먼저 위로가 서는 정의를 확인하면, 정의의 동료가 다시 끌을 든다. |
| npc.kalas.elin | `[fact.kalas.elin-forgiven]` (기존 그대로) | `fact.kalas.elin-forgiven` (`npc.kalas.nia` 대화로 획득), `deed.lie` | 니아의 용서가 이루어진 후에야 솔직함을 다시 믿을 수 있다. |
| npc.sacrifice.surgeon | `[fact.dione.living-love]` | `fact.dione.living-love` (`sacrifice.npc.widow`·`sacrifice.npc.pilgrim`·`sacrifice.npc.altar-priest` 대화로 획득) | 희생이 상처를 내는 것이 아니라 매일 채워 주는 사랑임을 깨달으면, 희생의 동료가 실을 다시 쓴다. |
| npc.spirituality.novice | `[fact.elia.breath-song]` | `fact.elia.breath-song` (`spirituality.npc.novice`의 `fact.elia.silent-chant` 대화, `spirituality.npc.hermit` 대화로 획득) | 면허 없는 진짜 기도(숨 노래)를 들으면, 영성의 동료가 다시 따라온다. |
| npc.valor.sergeant | `[fact.solgang.retreat-law]` | `fact.solgang.retreat-law` (`valor.npc.veteran` 대화로 획득) | 후퇴를 겁쟁이짓이 아닌 용기로 인정하는 옛 법을 확인하면, 용맹의 동료가 다시 칼을 든다. |

---

## 검증 기록

```bash
cd /home/taejin/hollow-codex-oc-companion-lines
npm run check:content
# exit code: 0

git diff --check
# exit code: 0

git status --short
# ?? docs/narrative/companion-lines.md
# ?? node_modules   (기존 untracked, .gitignore 대상)

python3 scripts/narrative/spellcheck.py --help
# 출력: 0개 검사, 0개 수정 제안
# --help는 키 접두어로 처리되어 content/strings/ko.yaml에서 매칭되는 키가 없었음.
```

`spellcheck.py`의 사용법은 파일 상단 주석에서 확인했다: `python3 scripts/narrative/spellcheck.py <키 접두어>`. 이 스크립트는 `content/strings/ko.yaml`만 읽으므로, 아직 yaml에 반영되지 않은 이 문서의 제안 문자열은 그대로 검사할 대상이 없다.

그래서 **저장소 밖 임시 샌드박스**(`/tmp/opencode/spell`, 저장소 파일은 건드리지 않음)에 `content/strings/ko.yaml` 사본 + 이 문서의 `companion.*` 24줄을 넣어 같은 스크립트로 실제로 검사했다.

```
24개 검사, 3개 수정 제안
companion.npc.honor.swordmaster.rejoin   「조의 노래 뒷절을 다시」→「조의 노래 뒤 절을 다시」 | 「이 아니라는 걸, 이제야」→「이 아니라는걸, 이제야」
companion.npc.justice.mason.rejoin       「는 것이 벌만은 아니라」→「는 것이 벌 만은 아니라」 | 「은 아니라는 걸, 다시」→「은 아니라는걸, 다시」
companion.npc.valor.sergeant.leave       「니라 멍청이짓이지. 나」→「니라 멍청이 짓이지. 나」
```

- **실제 수정 1건**: `멍청이짓이지` → `멍청이 짓이지` (띄어쓰기). 반영했다.
- **오탐 2건**: `뒷절`→`뒤 절`, `벌만`→`벌 만`, `이 아니라는 걸`→`이 아니라는걸` 은 검사기 규칙이 표준 띄어쓰기와 어긋나는 제안이다. 원문이 표준이라 그대로 둔다.

이 검사기는 띄어쓰기·흔한 오타만 잡는다. 어체 혼용·어색한 어휘는 못 잡으므로 영어 자연스러움과 어조는 사람이 따로 읽어야 한다.

---

## 확인하지 못한 것

- 이 문서는 제안 문서이므로, `content/strings/{ko,en}.yaml`에 실제로 반영하지 않았다. 게임 화면에서 아직 볼 수 없다.
- 영어 대사의 자연스러움은 사용자 확인이 필요하다.
- `rejoinRequires` 제안이 실제로 `npcs.yaml`에 적용되지 않았으므로, 동료 이탈 후 복귀 플로우는 여전히 `rejoinRequires: []` 상태로 작동한다.

---

## 사용법

이 문서는 `content/strings/{ko,en}.yaml`에 `companion.*` 키로 반영하기 위한 제안이며, 아직 반영하지 않았다. 반영 후 `npm run check:content`를 다시 실행해야 한다.
