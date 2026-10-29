#!/usr/bin/env python3
"""옛 임시 그림(`[시트, 번호]` 형식, 예: 박스 [town, 84])으로 남은 NPC에게 역할에 맞는 캐릭터 그림을 배정한다.
같은 마을 안에서는 가능하면 겹치지 않게 한다(역할별 선호 순서 중 안 쓴 것 → 다 쓰였으면 첫 선호를 다시 쓴다).
사용: python3 scripts/assets/assign-npc-sprites.py [--dry]"""
import glob, re, sys, collections
BASES = ["child-kalas", "tobi-kalas", "innkeeper-kalas", "mira-weaver", "nia-scribe", "confessor-kalas", "warden-kalas",
         "gatekeeper-field", "hunter-field", "librarian-kalas", "elder-woman", "robed-priest", "guard-soldier", "craftsman", "young-villager", "widow"]
# (id에 이 낱말이 들어 있으면) 선호 순서. 위에서부터 먼저 맞는 규칙을 쓴다.
RULES = [
    (("widow",), ["widow", "elder-woman"]),
    (("child",), ["child-kalas", "tobi-kalas"]),
    (("grandmother", "oldwoman", "old-neighbor", "neighbor", "nurse", "keener", "mourner", "midwife"), ["elder-woman", "mira-weaver"]),
    (("priest", "acolyte", "monk", "novice", "hermit", "almoner", "incense", "licensee"), ["robed-priest", "librarian-kalas", "gatekeeper-field"]),
    (("silent-elder", "elder", "judge"), ["warden-kalas", "gatekeeper-field", "librarian-kalas"]),
    (("librarian", "listener", "clock"), ["librarian-kalas", "confessor-kalas"]),
    (("scribe", "clerk", "herald", "matchmaker", "bookie", "proxy", "scale-keeper"), ["confessor-kalas", "nia-scribe", "young-villager"]),
    (("healer", "seamstress", "laundress", "cook", "mother", "baker", "linesitter"), ["mira-weaver", "nia-scribe", "elder-woman"]),
    (("sergeant", "recruit", "scout", "standard", "patrol", "lash-bearer", "champion", "swordmaster", "jailer", "gatekeeper"), ["guard-soldier", "hunter-field"]),
    (("brewer", "innkeeper", "bandage-seller", "peddler", "herbalist", "watercarrier"), ["innkeeper-kalas", "craftsman", "young-villager"]),
    (("mason", "smith", "painter", "carver", "plasterer", "stonecutter", "gravedigger", "silversmith", "miller", "porter", "tagcarver", "sweeper",
      "gardener", "wellkeeper", "drummer", "lampkeeper", "bellringer", "surgeon", "cord-keeper"), ["craftsman", "young-villager", "innkeeper-kalas"]),
    (("heir", "prisoner", "witness", "wanderer", "beggar", "aspirant", "pilgrim", "veteran", "old-kneeler", "patrol-a"), ["young-villager", "hunter-field", "tobi-kalas", "gatekeeper-field"]),
]
dry = "--dry" in sys.argv
total = 0
report = collections.defaultdict(list)
for f in sorted(glob.glob("content/towns/*/npcs.yaml")):
    town = f.split("/")[2]
    text = open(f, encoding="utf8").read()
    parts = re.split(r"(?m)^(?=- id: )", text)
    used = set(re.findall(r"sprite: char\.([\w-]+)", text))
    out = [parts[0]]
    for blk in parts[1:]:
        m = re.search(r"- id: npc\.\w[\w-]*\.([\w-]+)", blk)
        role = m.group(1) if m else ""
        if re.search(r"sprite: \[[^\]]+\]", blk):
            prefs = next((p for words, p in RULES if any(w in role for w in words)), ["young-villager", "craftsman"])
            pick = next((b for b in prefs if b not in used), prefs[0])   # 역할에 맞는 그림이 다 쓰였으면 첫 선호를 다시 쓴다(엉뚱한 역할 그림보다 낫다)
            used.add(pick)
            blk = re.sub(r"sprite: \[[^\]]+\]", f"sprite: char.{pick}", blk, count=1)
            report[town].append(f"{role}→{pick}")
            total += 1
        out.append(blk)
    if not dry: open(f, "w", encoding="utf8").write("".join(out))
for t, l in report.items(): print(t, len(l), ", ".join(l))
print("assigned", total, "(dry)" if dry else "")
