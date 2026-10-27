#!/usr/bin/env python3
"""마을의 대사를 사람이 읽기 좋은 문서로 뽑는다(인물별 인사·주제·거짓말 표시·얻는 단서).
사용: python3 scripts/narrative/dump-dialogue.py <town-dir 이름(예: kalas)> > docs/narrative/<town>-script.md"""
import sys, yaml
town = sys.argv[1]
ko = yaml.safe_load(open("content/strings/ko.yaml", encoding="utf8"))
npcs = yaml.safe_load(open(f"content/towns/{town}/npcs.yaml", encoding="utf8"))
def lab(k): return ko.get(k + ".label", ko.get(k, k))
print(f"# {town} 대사 전문 (자동 생성: scripts/narrative/dump-dialogue.py)\n")
print("표기: **[주제]** = 플레이어가 수첩에서 고르는 단어/단서. ⚠거짓 = `lie: true`(거짓을 보는 눈으로 보이는 말). →단서 = 이 말로 얻는 단서.\n")
for n in npcs:
    print(f"## {ko[n['name']]}  `{n['id']}`  ({n['map']})")
    print(f"- 인사: {ko[n['greet']]}")
    for key, entries in n.get("topics", {}).items():
        for e in entries:
            tag = ("⚠거짓 " if e.get("lie") else "") + (f"→단서 {', '.join(lab(g) for g in e['grants'])} " if e.get("grants") else "") + (f"(조건: {', '.join(lab(r) for r in e['requires'])}) " if e.get("requires") else "")
            print(f"- **[{lab(key) if key not in ('name','job') else {'name':'이름','job':'하는 일'}[key]}]** {tag}".rstrip() + f"\n  {ko[e['text']]}")
            for c in e.get("choice", []):
                print(f"  - 선택 「{ko[c['label']]}」 → {ko[c['text']]}")
    if n.get("companion"): print("- (동료로 합류할 수 있음)")
    print()
