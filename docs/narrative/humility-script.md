# humility 대사 전문 (자동 생성: scripts/narrative/dump-dialogue.py)

표기: **[주제]** = 플레이어가 수첩에서 고르는 단어/단서. ⚠거짓 = `lie: true`(거짓을 보는 눈으로 보이는 말). →단서 = 이 말로 얻는 단서.

## 침묵하는 장로  `npc.humility.silent-elder`  (map.town.humility)
- 인사: ……침묵.
- **[이름]** →단서 fact.heron.real-name
  헤론에서는 이름을 묻지 않는다. ……내 이름은 오래전 이 예배당에 두고 왔다. 그대는 어떠한가, 제 이름을 마지막으로 소리 내어 말한 것이 언제였는가.
- **[하는 일]** →단서 fact.heron.silent-elder, fact.heron.silence-rule
  이 예배당과 침묵의 법을 지킨다. 헤론에서는 누구도 제 이름을 입에 올리지 않는다.
- **[침묵]**
  침묵은 소리가 아닌 자리다.
- **[word.name]**
  이름은 말하는 것이 아니라 지키는 것이다. ……그렇게 가르쳐 왔다.
- **[fact.heron.chapel-of-silence]**
  예배당이다. 말없이 세워진.
- **[fact.heron.hermit]**
  같은 해에 이 예배당 문을 들어섰다. 그는 나갔고, 나는 남았다.
- **[word.listening]**
  듣는 법을 가르친 적은 없다. ……가르쳤어야 했다.

## 듣는 이  `npc.humility.listener`  (map.town.humility)
- 인사: ……듣겠다.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 word.listening, 침묵, fact.heron.listener
  듣는 일을 한다. 침묵 없이는 아무것도 들리지 않는다.
- **[word.listening]**
  듣는 것은 채우는 것이 아니라 비우는 것이다.
- **[word.three]**
  비우면 셋이 들린다.
- **[침묵]**
  조용히.
- **[fact.heron.silent-elder]**
  장로도 온다. 아무 말 없이 앉았다 간다.
- **[word.name]**
  이름은 아무도 들려주지 않는다.

## 우물지기  `npc.humility.wellkeeper`  (map.town.humility)
- 인사: 우물은 말이 없다.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.well
  우물을 지킨다.
- **[word.name]**
  물에는 이름이 없다.
- **[fact.heron.silence-rule]**
  이름을 대지 못하는 규칙이다. 물이 이름을 몰라도 차오르듯.
- **[word.listening]**
  두레박이 물에 닿는 소리. 그것만은 법도 막지 못했다.
- **[침묵]**
  우물 바닥은 늘 고요하다. 위에서 무슨 일이 있어도.

## 마을 아이  `npc.humility.child`  (map.town.humility)
- 인사: ……나도 조용히 하래요.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.breathing-rhythm
  노래를 외워요. 소리는 안 내고 숨으로만요. 들이쉬고, 참고, 내쉬고.
- **[word.listening]**
  귀를 기울이면 들려요.
- **[fact.heron.silent-chant]** →단서 fact.heron.silent-chant
  숨으로 부르는 노래요. 들리지 않아도 불려요.
- **[word.name]**
  내 이름이요? 엄마가 귀에 대고 숨으로만 말해 줬어요. 그래서 잘 안 들렸어요.
- **[fact.heron.hermit]**
  은자 할아버지는 숨을 세다가 가끔 졸아요. 그러면 처음부터 다시 세요.

## 서고지기  `npc.humility.librarian`  (map.town.humility)
- 인사: 책은 말이 없네. ……들어오게.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.library, word.three
  빈 페이지를 모으네. 글자가 남은 건 단 한 장, 그것도 셋이라는 한 낱말뿐일세.
- **[word.three]**
  무엇이 셋인지는 적혀 있지 않네. ……다른 마을들은 진실, 사랑, 용기라 읽는다더군. 이 마을은 그 셋을 비워 두는 쪽을 택했고.
- **[word.listening]**
  읽기보다 듣기일세. 빈 종이는 귀로 읽는 것이니.
- **[fact.heron.silent-elder]**
  장로도 가끔 와서 그 한 장을 보고 가네. 오래, 아무 말 없이.
- **[word.name]**
  이 서고에는 이름 적힌 책이 한 권도 없네. 지은이도, 빌려 간 이도.

## 숲지기  `npc.humility.gardener`  (map.town.humility)
- 인사: 나무는 이름을 부르지 않는다.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.grove
  이름 없는 숲을 가꾼다.
- **[word.listening]**
  숲의 말은 소리가 아니라 숨이다.
- **[word.name]**
  이름을 붙이면 잎이 진다.
- **[침묵]**
  숲은 조용하지 않다. 사람이 조용할 뿐이다.
- **[fact.heron.grove]**
  나무마다 심은 이가 있었다. 아무도 그 이름을 모른다.

## 밥하는 이  `npc.humility.cook`  (map.town.humility)
- 인사: ……앉아라. 밥은 조용히 먹는 거다.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.silence-rule, word.name
  밥을 짓는다. 이름을 부를 수 없으니, 그릇은 늘 앉던 자리에 놓아 둔다.
- **[침묵]**
  솥이 끓기 전에 뚜껑을 연다. 여기서는 솥도 소리를 내면 안 되니까.
- **[word.name]**
  그릇 하나가 겨울부터 비어 있다. 그 자리는 아직 치우지 않았다.
- **[fact.heron.novice]**
  수련하는 애가 제일 늦게, 제일 조용히 먹는다. 배가 고파도.

## 수련 중인 이  `npc.humility.novice`  (map.town.humility)
- 인사: ……아직 수련 중이라.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.novice, fact.heron.chapel-of-silence
  예배당에서 침묵을 배운다. 바닥 닦는 소리까지 내지 않는 것이 첫 수련이다.
- **[침묵]**
  입을 다물면 귀가 열린다.
- **[word.name]**
  이름을 잊어야 한다고 배웠다.
- **[fact.heron.hermit]**
  은자님도 예전에는 이 예배당에 계셨다고 들었다. 왜 나가셨는지는 아무도 말하지 않는다.
- **[word.listening]**
  아직은 듣는 것보다 참는 것이 더 많다.

## 은자  `npc.humility.hermit`  (map.town.humility)
- 인사: ……조용히. 그 소리, 들리지 않는가.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 fact.heron.hermit, fact.heron.silent-chant
  숨어서 숨을 센다. 셀 때마다 소리 없는 노래가 한 소절씩 지나간다.
- **[침묵]**
  침묵은 공허가 아니라 자리다.
- **[word.three]**
  셋이 다 비워진 것이 겸손이다.
- **[word.listening]** →단서 fact.creature.humility-silencer
  숲 너머 남쪽 담 끝에 고요한 파수꾼이 있다. 악하지 않으나 소리를 막는다.
- **[fact.heron.silent-elder]**
  그 사람도 예전엔 웃음소리가 컸다. 자리가 사람을 조용하게 만든다.
- **[fact.heron.chapel-of-silence]**
  나도 그 안에 있었다. 침묵은 안에서보다 밖에서 더 잘 들린다.

## 과부  `npc.humility.widow`  (map.town.humility)
- 인사: ……남편 이름이 자꾸 흐려진다.
- **[이름]**
  …글쎄, 그건 잘 모르겠네.
- **[하는 일]** →단서 word.name, fact.heron.silence-rule
  잊어 가는 이름을 지킨다. 그 사람은 평생 제 이름을 입에 올리지 않았고, 나도 끝내 소리 내어 부르지 못했다.
- **[word.name]**
  이름은 무덤에 같이 묻었다. 비석은 비워 두는 법이라.
- **[word.listening]**
  들어 줄 이가 있다면, 한 번쯤은 소리 내어 불러 볼 텐데.
- **[fact.heron.chapel-of-silence]**
  예배당 벽돌은 그 사람이 쌓았다. 한 장씩, 아무 말 없이.
- **[fact.heron.silent-elder]**
  장로께 그 이름을 물었다. 그분도 모르셨다.

## 비석장이  `npc.humility.stonecutter`  (map.town.humility)
- 인사: 돌 깎는 소리는 괜찮대. 말이 아니니까.
- **[이름]**
  이름? 내가 깎는 돌에도 없는 걸 나한테 묻네.
- **[하는 일]**
  비석을 깎아. 반들반들하게, 아무것도 새기지 않고. 그게 여기 법이야.
- **[word.name]**
  겨울에 과부가 와서 한 글자만 새겨 달라더라. 못 해 줬어. 지금도 그 돌을 보면 손이 근질거려.
- **[fact.heron.silent-elder]**
  봄밤에 장로가 그 무덤 앞에 오래 서 있더라. 지팡이로 비석을 한 번 짚고 갔어. 뭘 찾는 사람처럼.

## 등잔지기  `npc.humility.lampkeeper`  (map.town.humility)
- 인사: 예배당 등잔이 꺼지지 않게 지키고 있습니다. 불은 소리 없이 타니, 이곳에 어울립니다.
- **[이름]**
  이름은 받은 적이 없습니다. 등잔지기라고 하시면 됩니다.
- **[하는 일]**
  밤새 심지를 자르고 기름을 붓습니다. 예배당이 어두워진 적은 한 번도 없습니다.
- **[fact.heron.silent-elder]**
  겨울부터 장로님이 밤마다 제단 앞에 앉아 계십니다. 입술이 움직이는데, 기도문의 모양은 아닙니다.
- **[fact.heron.chapel-of-silence]**
  이 예배당에는 말이 없지만, 저는 등잔 하나하나를 놓인 자리로 압니다. 이곳 사람들도 서로를 그렇게 압니다.

## 자리패 깎는 이  `npc.humility.tagcarver`  (map.town.humility)
- 인사: 자리패 하나 들이게. 여기선 이름 대신 이걸 목에 걸지.
- **[이름]**
  이름은 팔리지 않네. 자리는 팔리지.
- **[하는 일]**
  자리패를 깎네. 우물지기, 서고지기, 수련 중인 이…… 자리가 새로 날 때마다 일감이 늘지.
- **[word.name]**
  이름이 돌아오면 내 장사도 끝이겠지. ……그래도 그날이 오면, 제일 먼저 내 이름부터 패에 새길 걸세.
- **[침묵]**
  조용한 마을이 장사하기는 좋네. 흥정이 없으니까. 다들 손가락으로 값을 치르니 말일세.

## 아이 어머니  `npc.humility.mother`  (map.town.humility)
- 인사: ……해 질 녘이면 손뼉을 두 번 쳐요. 우리 애 부르는 소리예요.
- **[이름]**
  제 이름은 아이도 몰라요. 저도 우리 엄마 이름을 몰랐고요.
- **[하는 일]**
  아이를 키워요. 이름을 불러 줄 수 없는 아이를요.
- **[word.name]**
  아이가 태어난 밤에, 귀에 대고 숨으로만 이름을 말해 줬어요. 그 애가 기억하는지는 몰라요.
- **[word.listening]**
  다른 집 손뼉 소리랑 섞이면 애들이 엉뚱한 집으로 가요. 그래서 제 손뼉은 조금 느려요.

## 비질하는 이  `npc.humility.sweeper`  (map.town.humility)
- 인사: 발소리로 알았소. 처음 듣는 걸음이구려.
- **[이름]**
  이름은 모르오. 대신 이 마을 사람들 발소리는 다 아오.
- **[하는 일]**
  광장을 쓰오. 비질 소리는 말이 아니라서 아무도 막지 않소.
- **[fact.heron.silent-elder]**
  장로 걸음이 겨울부터 느려졌소. 지팡이 소리가 걸음보다 먼저 온다오.
- **[fact.heron.listener]**
  듣는 이 앞에 다녀온 사람은 걸음이 가벼워지오. 무엇을 내려놓고 오는지는 모르겠소.
