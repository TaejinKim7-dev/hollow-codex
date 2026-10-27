#!/usr/bin/env python3
"""얻을 수 있는 단서 계산(고정점): 시작 단서 + 고리 단서 + 크리처 전승에서 출발해, 인물 주제(name/job/아는 askable 단서)와 그 변형의 requires를 만족하는 것의 grants를 반복해서 더한다.
플래그 조건(requiresFlags/excludeFlags)은 만족할 수 있다고 가정한다(낙관적). 결과에 없는 단서 = 게임에서 절대 얻을 수 없다.
사용: python3 scripts/narrative/reachable.py"""
import glob, yaml, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")); os.chdir(ROOT)
ASK = {"word", "person", "place", "song", "creature"}
facts = {}
for f in glob.glob("content/towns/*/facts.yaml"):
    for x in yaml.safe_load(open(f, encoding="utf8")) or []: facts[x["id"]] = x
npcs = []
for f in sorted(glob.glob("content/towns/*/npcs.yaml")): npcs += yaml.safe_load(open(f, encoding="utf8")) or []
known = set()
start = yaml.safe_load(open("content/start.yaml", encoding="utf8"))
for k in ("facts",): known |= set(start.get(k, []) or [])
rings = yaml.safe_load(open("content/rings.yaml", encoding="utf8")) or []
for r in (rings if isinstance(rings, list) else rings.get("rings", [])):
    if isinstance(r, dict) and r.get("fact"): known.add(r["fact"])
for c in yaml.safe_load(open("content/creatures.yaml", encoding="utf8")) or []:
    if c.get("lore"): known.add(c["lore"])
changed = True
while changed:
    changed = False
    for n in npcs:
        for tk, variants in (n.get("topics") or {}).items():
            if tk not in ("name", "job") and not (tk in known and facts.get(tk, {}).get("kind") in ASK): continue
            for v in variants:
                if set(v.get("requires", []) or []) <= known:
                    for g in v.get("grants", []) or []:
                        if g not in known: known.add(g); changed = True
                for ch in v.get("choice", []) or []: pass
missing = sorted(set(facts) - known)
ko = yaml.safe_load(open("content/strings/ko.yaml", encoding="utf8"))
for m in missing: print(f"{m} [{facts[m]['kind']}] {ko.get(facts[m]['label'], '')}")
print(f"\n전체 {len(facts)}개 중 얻을 수 없는 단서 {len(missing)}개")
sys.exit(1 if missing else 0)
