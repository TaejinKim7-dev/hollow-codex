#!/usr/bin/env python3
"""대사 일관성 점검(기계 가능한 부분): 인물별 어체 분포, 이름 중복·옛 이름 잔존, 조어/직함 변형, 수치 표현, 중복 문장, 영어 이름 표기.
사용: python3 scripts/narrative/consistency.py [--md]      (--md: 마크다운 보고서를 표준출력으로)
어체 분류는 문장 끝 형태로 추정한 것이라 오탐이 있다 — '의심 목록'은 사람이 읽고 판정한다."""
import os, re, sys, glob, collections
import yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
ko = yaml.safe_load(open("content/strings/ko.yaml", encoding="utf8"))
en = yaml.safe_load(open("content/strings/en.yaml", encoding="utf8"))
npcs = []
for f in sorted(glob.glob("content/towns/*/npcs.yaml")):
    town = f.split("/")[2]
    for n in yaml.safe_load(open(f, encoding="utf8")) or []:
        n["town"] = town; npcs.append(n)

REG = [  # (이름, 정규식) — 위에서부터 먼저 맞는 것. '지요/죠/지/다'는 어느 어체에서나 쓰이므로 중립으로 뺀다.
    ("중립", re.compile(r"(지요|죠|지)$")),
    ("합쇼체", re.compile(r"(습니다|ㅂ니다|십니까|습니까|ㅂ니까|십시오|입니다|입니까|합니다|됩니다|겠습니다|드립니다|옵니다)$")),
    ("해요체", re.compile(r"(요|네요|군요|어요|아요|예요|이에요|거든요|걸요|래요)$")),
    ("하오체", re.compile(r"(하오|이오|소|다오|라오|구려|리오|시오|겠소|았소|었소|있소|없소|구료)$")),
    ("하게체", re.compile(r"(네|세|게나|는가|은가|ㄴ가|일세|구먼|군|나|지 않은가|지 않나|라네|이라네)$")),
]


def sentences(t):
    t = re.sub(r"[…\.]{2,}", " ", t)
    parts = re.split(r"(?<=[\.\?\!])\s+|\n", t)
    return [p.strip().strip("\"'“”‘’()「」") for p in parts if p.strip()]


def classify(s):
    core = re.sub(r"[\.\?\!\s…~\"'“”‘’)」]+$", "", s)
    core = re.sub(r"[\.\?\!\s…]+$", "", core)
    for name, rx in REG:
        if rx.search(core): return name
    if re.search(r"(다)$", core): return "평서(다)"  # 해라체·서술
    if re.search(r"(야|어|아|까|니|자|라|구나|잖아|거든|걸|래)$", core): return "반말"
    return "기타"


def npc_texts(n):
    keys = [n["greet"]]
    for tk, variants in (n.get("topics") or {}).items():
        for v in variants:
            keys.append(v["text"])
            for c in v.get("choice", []) or []: keys.append(c["text"])
    return [k for k in keys if k in ko]


report = []
def out(s=""): report.append(s)

# 1. 어체
out("## 1. 인물별 어체 분포 (의심 = 주 어체가 아닌 문장이 20% 넘음)")
out("| 인물 | 마을 | 주 어체 | 분포 | 의심 문장 수 |")
out("|---|---|---|---|---|")
suspects = []
for n in npcs:
    cnt = collections.Counter(); per = []
    for k in npc_texts(n):
        for s in sentences(ko[k]):
            r = classify(s); cnt[r] += 1; per.append((k, s, r))
    tot = sum(v for r, v in cnt.items() if r not in ("기타",)) or 1
    main = cnt.most_common(1)[0][0] if cnt else "-"
    # '평서(다)'는 서술문이라 어체 판정에서 제외(대사 안 인용·서술)
    weight = {r: v for r, v in cnt.items() if r not in ("기타", "평서(다)", "중립")}
    if weight:
        main = max(weight, key=weight.get); total = sum(weight.values())
        odd = [(k, s, r) for k, s, r in per if r in weight and r != main]
        ratio = len(odd) / total
        if ratio > 0.2: suspects.append((n["id"], n["town"], main, ratio, odd))
        out(f"| {ko.get(n['name'], n['id'])} `{n['id']}` | {n['town']} | {main} | {dict(weight)} | {len(odd)} |")
out("")
out("### 의심 목록 (어체가 섞였을 수 있는 인물 — 사람이 판정; '지요/죠/지'는 중립이라 제외)")
for nid, town, main, ratio, odd in sorted(suspects, key=lambda x: -x[3]):
    out(f"- **{ko[next(n['name'] for n in npcs if n['id']==nid)]}** `{nid}` 주={main}, 다른 어체 {ratio:.0%}")
    for k, s, r in (odd if os.environ.get("ALL_ODD") else odd[:4]): out(f"  - [{r}] {s}  (`{k}`)")

# 2. 이름 중복·옛 이름
out("\n## 2. 인물 이름")
names = collections.defaultdict(list)
for n in npcs: names[ko[n["name"]]].append(f"{n['id']}")
dup = {k: v for k, v in names.items() if len(v) > 1}
out("### 같은 한국어 이름을 쓰는 서로 다른 인물")
for k, v in dup.items(): out(f"- 「{k}」: {', '.join(v)}")
if not dup: out("- 없음")
en_names = collections.defaultdict(list)
for n in npcs: en_names[en[n["name"]]].append(n["id"])
edup = {k: v for k, v in en_names.items() if len(v) > 1}
out("### 같은 영어 이름을 쓰는 서로 다른 인물")
for k, v in edup.items(): out(f"- 「{k}」: {', '.join(v)}")
if not edup: out("- 없음")
STALE = ["엘리 ", "엘리가", "엘리는", "엘리를", "토벤", "리네", "이온", "미르"]
out("### 옛 이름·바뀐 이름이 남아 있는지(문자열 전체에서 검색)")
hits = []
for k, v in ko.items():
    for s in STALE:
        if isinstance(v, str) and s in v: hits.append((s.strip(), k, v[:60]))
for s, k, v in hits[:30]: out(f"- 「{s}」 `{k}`: {v}")
if not hits: out("- 없음")

# 3. 용어 변형
out("\n## 3. 용어·직함 변형 (같은 개념이 여러 말로 쓰이는지)")
GROUPS = {
 "니아의 직함": ["필경사", "견습 필경사", "서기관", "기록사"],
 "고발청 책임자": ["고발관장", "관장", "고발관 우두머리"],
 "재판하는 사람(정의)": ["재판관", "판사", "판관"],
 "순례자": ["순례자", "순례객", "나그네"],
 "서고": ["옛 서고", "봉인 서고", "서고", "도서관"],
 "경전": ["빈 경전", "경전", "빈 책"],
}
for g, terms in GROUPS.items():
    c = {t: sum(1 for v in ko.values() if isinstance(v, str) and t in v) for t in terms}
    out(f"- {g}: " + ", ".join(f"「{t}」 {n}회" for t, n in c.items()))

# 4. 수치·기간 표현
out("\n## 4. 수치·기간 표현 (같은 사건의 숫자가 서로 다른지 사람이 확인)")
NUM = re.compile(r"(\d+|[한두세네다섯여섯일곱여덟아홉열스물서른마흔쉰예순일흔여든아흔백천])\s*(일|날|밤|년|해|달|번|명|사람|개|쪽|절|장|살|세)")
byt = collections.defaultdict(list)
for k, v in ko.items():
    if isinstance(v, str) and (k.startswith("npc.") or ".npc." in k):
        for m in re.finditer(r"(닷새|사흘|이레|삼백 년|[가-힣]+ ?년|열두 번|스무 번|하루 세 번)", v): byt[m.group(1)].append(k)
for t, ks in sorted(byt.items(), key=lambda x: -len(x[1]))[:25]: out(f"- 「{t}」 {len(ks)}곳: {', '.join(k.rsplit('.',1)[0].split('npc.')[-1] for k in ks[:6])}{'…' if len(ks)>6 else ''}")

# 5. 중복 문장·길이
out("\n## 5. 중복 문장과 길이")
seen = collections.defaultdict(list)
for n in npcs:
    for k in npc_texts(n): seen[ko[k]].append(k)
dups = {v: ks for v, ks in seen.items() if len(ks) > 1}
out(f"- 완전히 같은 문장이 여러 키에 있는 경우: {len(dups)}건")
for v, ks in list(dups.items())[:8]: out(f"  - 「{v[:50]}」 ← {', '.join(ks[:4])}")
longl = [(k, len(ko[k])) for n in npcs for k in npc_texts(n) if len(ko[k]) > 230]
out(f"- 230자 넘는 대사: {len(longl)}건")
for k, l in sorted(longl, key=lambda x: -x[1])[:8]: out(f"  - {k} ({l}자)")

# 6. ko/en 짝
out("\n## 6. 한국어·영어 짝")
miss = [n["id"] for n in npcs for k in [n["name"], n["greet"]] if k not in en]
out(f"- 영어 문자열이 빠진 인물: {len(miss)}")
ratio = []
for n in npcs:
    for k in npc_texts(n):
        a, b = len(ko[k]), len(en[k])
        if b and (a / b > 1.1 or a / b < 0.12): ratio.append((k, a, b))
out(f"- 한국어 대비 영어 길이가 이상한(너무 짧거나 김) 문장: {len(ratio)}건")
for k, a, b in ratio[:8]: out(f"  - {k} ko {a}자 / en {b}자")

print("\n".join(report))
