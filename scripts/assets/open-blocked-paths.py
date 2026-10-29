#!/usr/bin/env python3
"""마을 지도에서 NPC 일과 자리 옆으로 걸어갈 수 없는 곳(나무가 길을 막은 곳)을 찾아, 나무를 풀(g)로 바꿔 길을 연다.
사용: python3 scripts/assets/open-blocked-paths.py [--dry]   (content/towns/<마을>/maps.yaml, npcs.yaml을 읽는다. 지도 글자 t만 g로 바꾼다.)"""
import re, sys, glob, collections, yaml
dry = "--dry" in sys.argv
WALK = set("gphcb+:=.,<>_S")
def rows_of(text, map_id):
    m = re.search(rf'- id: {re.escape(map_id)}\n(?:.*\n)*?\s+rows:\n((?:\s+- "[^"]*"\n)+)', text)
    return m
total = 0
for mp in sorted(glob.glob("content/towns/*/maps.yaml")):
    town = mp.split("/")[2]
    if town in ("overworld",): continue
    text = open(mp, encoding="utf8").read()
    import os
    nf = mp.replace("maps", "npcs")
    if not os.path.exists(nf): continue
    npcs = yaml.safe_load(open(nf, encoding="utf8")) or []
    maps = yaml.safe_load(text)
    for md in maps:
        mid = md["id"]
        m = rows_of(text, mid)
        if not m: continue
        rows = [list(l.strip()[3:-1]) for l in m.group(1).splitlines()]
        H, W = len(rows), len(rows[0])
        starts = [tuple(e["arrive"]) for other in yaml.safe_load(open(mp, encoding="utf8")) for e in other.get("exits", []) if e["to"] == mid]
        for other_file in glob.glob("content/towns/*/maps.yaml"):
            for other in yaml.safe_load(open(other_file, encoding="utf8")):
                for e in other.get("exits", []):
                    if e["to"] == mid and tuple(e["arrive"]) not in starts: starts.append(tuple(e["arrive"]))
        targets = []
        for n in npcs:
            if n["map"] != mid: continue
            slots = list(n.get("schedule", {"0": n["pos"]}).values())
            targets += [tuple(p) for p in slots]
        def passable(x, y, trees): c = rows[y][x]; return c in WALK or (trees and c == "t")
        changed = 0
        for tgt in targets:
            # 0-1 BFS: 나무 칸은 비용 1, 걷는 칸은 0. 목표 칸의 이웃 중 하나에 닿으면 된다.
            dist = {s: 0 for s in starts if passable(*s, False)}
            prev = {}
            dq = collections.deque((0, s) for s in dist)
            goal = None
            while dq:
                d, (x, y) = dq.popleft()
                if dist.get((x, y), 1e9) < d: continue
                if abs(x - tgt[0]) + abs(y - tgt[1]) == 1: goal = (x, y); break
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < W and 0 <= ny < H) or not passable(nx, ny, True): continue
                    nd = d + (1 if rows[ny][nx] == "t" else 0)
                    if nd < dist.get((nx, ny), 1e9):
                        dist[(nx, ny)] = nd; prev[(nx, ny)] = (x, y)
                        (dq.appendleft if nd == d else dq.append)((nd, (nx, ny)))
            if goal is None: print(f"  {town} {mid}: {tgt} 도달 불가(벽에 막힘)"); continue
            cur = goal
            while cur in prev:
                if rows[cur[1]][cur[0]] == "t": rows[cur[1]][cur[0]] = "g"; changed += 1
                cur = prev[cur]
            if rows[goal[1]][goal[0]] == "t": rows[goal[1]][goal[0]] = "g"; changed += 1
        if changed:
            total += changed
            print(f"{town} {mid}: 나무 {changed}그루를 풀로")
            if not dry:
                new = "".join('    - "' + "".join(r) + '"\n' for r in rows)
                text = text.replace(m.group(1), new, 1)
    if not dry: open(mp, "w", encoding="utf8").write(text)
print("total", total, "(dry)" if dry else "")
