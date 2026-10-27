#!/usr/bin/env python3
"""마을 대사 작업 명세(spec JSON)를 검증하고 content/에 반영한다.
사용:
  python3 scripts/narrative/spec.py validate <spec.json>     # 저장소를 바꾸지 않고 검사만(여러 번 실행해도 안전)
  python3 scripts/narrative/spec.py apply <spec.json>        # 검증 통과 시 ko.yaml / en.yaml / <마을>/npcs.yaml에 반영(원자적: 하나라도 실패하면 아무것도 안 씀)

spec 형식(JSON):
{
 "town": "compassion",                                  # content/towns/<town>/
 "edits":      [{"key": "기존.문자열.키", "ko": "...", "en": "..."}],        # 기존 문자열 고쳐 쓰기(ko·en 모두)
 "add_topics": [{"npc": "npc.x.y", "topic": "word.abc|fact.abc", "key": "새.문자열.키", "ko": "...", "en": "..."}],   # 기존 인물에 새 주제 대사(부여 없음)
 "new_npcs": [{"id": "npc.x.new", "map": "map.town.x", "pos": [x, y], "schedule": {"0":[x,y],"6":[x,y],"12":[x,y],"18":[x,y]},   # schedule 생략 시 고정
               "key_prefix": "x.npc.new",               # 문자열 키 접두어: <prefix>.name / .greet / .name.t / .job.t / .<suffix>
               "name": {"ko": "", "en": ""}, "greet": {...}, "name_t": {...}, "job_t": {...},
               "topics": [{"topic": "word.abc", "suffix": "abc.t", "ko": "...", "en": "..."}]}],
 "audit_md": "...", "canon_md": "..."                    # 문서용(저장은 apply가 아니라 사람이)
}
규칙(검증이 강제): 모든 문자열 YAML 안전(": ", " #", 줄바꿈, 맨 앞 따옴표·기호 금지), 한국어는 한글 포함·영어는 비어 있지 않음,
 새 키는 기존과 안 겹침, 주제 키는 name/job 또는 실제 단서·단어 id, 같은 NPC에 같은 주제 중복 금지, 새 인물 위치는 지도 안·걸을 수 있는 칸·출구/문 아님·다른 인물과 겹치지 않음,
 단서·추론 힌트(.hint)는 추론 정답 단어(모든 마을의 deduction answer 라벨, ko·en)를 말하면 안 됨(tests/unit/ui/hints-content.test.ts).
"""
import json, re, sys, os
import yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(ROOT)
ASKABLE = {"word", "person", "place"}  # src/core/dialogue/talk.ts CHIP_KINDS — 이 종류의 단서만 대화 주제로 고를 수 있다
SAFE_BAD_START = ("'", '"', "[", "{", "-", "&", "*", "!", "|", ">", "%", "@", "`", "?", ":", "#", ",")
HANGUL = re.compile(r"[가-힣]")


def load(path):
    return yaml.safe_load(open(path, encoding="utf8")) if os.path.exists(path) else None


def town_dirs():
    return sorted(d for d in os.listdir("content/towns") if os.path.isdir(f"content/towns/{d}"))


def rows_of(m):
    r = m.get("rows") or m.get("tiles") or m.get("grid")
    return r.split("\n") if isinstance(r, str) else r


def safe_err(v, label):
    errs = []
    if not isinstance(v, str) or not v.strip():
        return [f"{label}: 비었거나 문자열 아님"]
    if "\n" in v: errs.append(f"{label}: 줄바꿈 포함")
    if ": " in v: errs.append(f"{label}: '콜론+공백' 포함(YAML 깨짐) → 줄표(—)나 쉼표로 바꿀 것")
    if " #" in v: errs.append(f"{label}: ' #' 포함")
    if v.startswith(SAFE_BAD_START): errs.append(f"{label}: 맨 앞 글자 '{v[0]}' 금지")
    if v != v.strip(): errs.append(f"{label}: 앞뒤 공백")
    return errs


def context():
    c = {}
    c["ko"] = load("content/strings/ko.yaml")
    c["en"] = load("content/strings/en.yaml")
    c["tiles"] = load("content/tiles.yaml")["tiles"]
    c["maps"], c["npcs"], c["facts"], c["deductions"] = {}, {}, set(), []
    c["npcfile"] = {}
    for t in town_dirs():
        for m in load(f"content/towns/{t}/maps.yaml") or []: c["maps"][m["id"]] = m
        for n in load(f"content/towns/{t}/npcs.yaml") or []:
            c["npcs"][n["id"]] = n; c["npcfile"][n["id"]] = t
        for f in load(f"content/towns/{t}/facts.yaml") or []:
            c["facts"].add(f["id"]); c.setdefault("factdefs", {})[f["id"]] = f
        for d in load(f"content/towns/{t}/deduction.yaml") or []: c["deductions"].append(d)
    for ex in ["content/abilities.yaml"]:
        pass
    # 모든 마을의 정답 단어 라벨(ko/en)
    ans = {w for d in c["deductions"] for w in d["answer"]}
    c["answer_labels"] = {"ko": [], "en": []}
    for w in ans:
        lk = (c.get("factdefs", {}).get(w) or {}).get("label", w + ".label")
        for lang in ("ko", "en"):
            lab = c[lang].get(lk)
            if lab: c["answer_labels"][lang].append(lab)
        if not any(c[lang].get(lk) for lang in ("ko", "en")): print(f"(경고) 정답 단어 {w}의 라벨 키 {lk}를 못 찾음", file=sys.stderr)
    return c


def mentions(lang, text, label):
    if lang == "ko": return label in text
    return re.search(r"\b" + re.escape(label), text, re.I) is not None


def positions_taken(c, extra_new):
    taken = {}
    for n in list(c["npcs"].values()) + extra_new:
        sched = n.get("schedule") or {"0": n["pos"]}
        for p in list(sched.values()) + [n["pos"]]:
            taken.setdefault((n["map"], p[0], p[1]), n["id"])
    return taken


def validate(spec, c=None):
    c = c or context()
    errs = []
    town = spec.get("town")
    if town not in town_dirs(): return [f"town '{town}' 없음"]
    ko, en = c["ko"], c["en"]
    new_keys = set()

    def need_pair(obj, label, key_check=None):
        for lang in ("ko", "en"):
            v = obj.get(lang)
            errs.extend(safe_err(v, f"{label}.{lang}"))
        if isinstance(obj.get("ko"), str) and not HANGUL.search(obj["ko"]): errs.append(f"{label}.ko: 한글 없음")

    def hint_check(key, kv, ev):
        if key.endswith(".hint"):
            for lang, v in (("ko", kv), ("en", ev)):
                for lab in c["answer_labels"][lang]:
                    if mentions(lang, v, lab): errs.append(f"{key}.{lang}: 힌트가 정답 단어 '{lab}'를 말함(테스트 규칙)")

    for e in spec.get("edits", []):
        k = e.get("key")
        if k not in ko or k not in en: errs.append(f"edits: 기존 키 없음 {k}"); continue
        need_pair(e, f"edits[{k}]"); hint_check(k, e.get("ko", ""), e.get("en", ""))
    seen_topic = {}
    for a in spec.get("add_topics", []):
        k = a.get("key")
        if k in ko or k in en or k in new_keys: errs.append(f"add_topics: 키가 이미 있음 {k}")
        new_keys.add(k); need_pair(a, f"add_topics[{k}]")
        npc = c["npcs"].get(a.get("npc"))
        if not npc: errs.append(f"add_topics: 인물 없음 {a.get('npc')}"); continue
        if a.get("topic") not in (c["facts"] | {"name", "job"}): errs.append(f"add_topics[{k}]: 주제 '{a.get('topic')}'는 실제 단서/단어 id가 아님")
        elif a.get("topic") in c["facts"] and c["factdefs"][a["topic"]]["kind"] not in ASKABLE: errs.append(f"add_topics[{k}]: 주제 '{a['topic']}'는 종류가 '{c['factdefs'][a['topic']]['kind']}'라 대화 주제로 고를 수 없음(word/person/place만 가능)")
        if a.get("topic") in (npc.get("topics") or {}): errs.append(f"add_topics[{k}]: {a['npc']}에 주제 '{a['topic']}'가 이미 있음")
        if (a.get("npc"), a.get("topic")) in seen_topic: errs.append(f"add_topics[{k}]: spec 안에서 같은 인물·주제 중복")
        seen_topic[(a.get("npc"), a.get("topic"))] = 1
    new_npc_defs = []
    for n in spec.get("new_npcs", []):
        nid = n.get("id"); mp = c["maps"].get(n.get("map"))
        if nid in c["npcs"] or any(nid == x["id"] for x in new_npc_defs): errs.append(f"new_npcs: id 중복 {nid}")
        if not mp: errs.append(f"new_npcs[{nid}]: 지도 없음 {n.get('map')}"); continue
        pref = n.get("key_prefix")
        for suf, f in (("name", "name"), ("greet", "greet"), ("name.t", "name_t"), ("job.t", "job_t")):
            key = f"{pref}.{suf}"
            if key in ko or key in en or key in new_keys: errs.append(f"new_npcs[{nid}]: 키가 이미 있음 {key}")
            new_keys.add(key); need_pair(n.get(f, {}) or {}, f"new_npcs[{nid}].{f}")
        tops = set()
        for t in n.get("topics", []):
            key = f"{pref}.{t.get('suffix')}"
            if key in ko or key in en or key in new_keys: errs.append(f"new_npcs[{nid}]: 키가 이미 있음 {key}")
            new_keys.add(key); need_pair(t, f"new_npcs[{nid}].topics[{t.get('suffix')}]")
            if t.get("topic") not in c["facts"]: errs.append(f"new_npcs[{nid}]: 주제 '{t.get('topic')}'는 실제 단서/단어 id가 아님(name/job은 자동)")
            elif c["factdefs"][t["topic"]]["kind"] not in ASKABLE: errs.append(f"new_npcs[{nid}]: 주제 '{t['topic']}'는 종류가 '{c['factdefs'][t['topic']]['kind']}'라 대화 주제로 고를 수 없음(word/person/place만 가능)")
            if t.get("topic") in tops: errs.append(f"new_npcs[{nid}]: 주제 중복 {t.get('topic')}")
            tops.add(t.get("topic"))
        sched = n.get("schedule") or {"0": n["pos"]}
        rows = rows_of(mp); H, W = len(rows), len(rows[0])
        exits = {tuple(e["at"]) for e in mp.get("exits", [])}
        for p in list(sched.values()) + [n["pos"]]:
            x, y = p
            if not (0 <= x < W and 0 <= y < H): errs.append(f"new_npcs[{nid}]: 지도 밖 {p}"); continue
            ch = rows[y][x]; walk = c["tiles"].get(ch, {}).get("walk")
            if walk is None: errs.append(f"new_npcs[{nid}]: {p}({ch!r})는 걸을 수 없는 칸")
            if ch in "+<>": errs.append(f"new_npcs[{nid}]: {p}는 문/출구/계단 칸({ch!r})")
            if (x, y) in exits or any(abs(x - ex) + abs(y - ey) <= 1 for ex, ey in exits): errs.append(f"new_npcs[{nid}]: {p}는 출구 또는 그 옆 칸")
            # 막다른 길 방지: 이웃 4칸 중 걸을 수 있는 칸이 3개 미만이면 좁은 통로
            free = sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and c["tiles"].get(rows[y + dy][x + dx], {}).get("walk") is not None)
            if free < 3: errs.append(f"new_npcs[{nid}]: {p}는 통로가 좁아 길을 막을 수 있음(이웃 걸을 칸 {free}개)")
        new_npc_defs.append({"id": nid, "map": n["map"], "pos": n["pos"], "schedule": sched})
    taken = positions_taken(c, [])
    for n in new_npc_defs:
        for p in list(n["schedule"].values()) + [n["pos"]]:
            owner = taken.get((n["map"], p[0], p[1]))
            if owner: errs.append(f"new_npcs[{n['id']}]: {p}는 {owner}가 이미 있는 칸")
    for i, a in enumerate(new_npc_defs):
        for b in new_npc_defs[i + 1:]:
            if a["map"] == b["map"] and set(map(tuple, list(a["schedule"].values()) + [a["pos"]])) & set(map(tuple, list(b["schedule"].values()) + [b["pos"]])): errs.append(f"new_npcs: {a['id']}와 {b['id']}가 같은 칸을 씀")
    # 마을당 인원
    existing = [n for n in c["npcs"].values() if c["npcfile"][n["id"]] == town and n["map"] != "map.field"]
    errs.append(f"(정보) {town}: 기존 {len(existing)}명 + 새 {len(spec.get('new_npcs', []))}명 = {len(existing) + len(spec.get('new_npcs', []))}명") if False else None
    return errs


def apply(spec):
    c = context(); errs = validate(spec, c)
    if errs: print("검증 실패:\n" + "\n".join(errs)); sys.exit(1)
    town = spec["town"]
    new_strings = []  # (key, ko, en, anchor_prefix)
    for e in spec.get("edits", []): pass
    texts = {"ko": open("content/strings/ko.yaml", encoding="utf8").read().split("\n"), "en": open("content/strings/en.yaml", encoding="utf8").read().split("\n")}
    for lang in ("ko", "en"):
        lines = texts[lang]
        pos = {}
        for i, l in enumerate(lines):
            m = re.match(r"^([A-Za-z0-9_.\-]+): ", l)
            if m: pos[m.group(1)] = i
        for e in spec.get("edits", []): lines[pos[e["key"]]] = f"{e['key']}: {e[lang]}"
        def insert(key, val, anchor):
            cand = [i for k, i in pos.items() if k.startswith(anchor)]
            at = (max(cand) + 1) if cand else len(lines)
            if not cand:  # 끝(빈 줄 앞)
                while at > 0 and lines[at - 1].strip() == "": at -= 1
            lines.insert(at, f"{key}: {val}")
            for k in list(pos):
                if pos[k] >= at: pos[k] += 1
            pos[key] = at
        for a in spec.get("add_topics", []): insert(a["key"], a[lang], a["key"].rsplit(".", 2)[0] + ".")
        for n in spec.get("new_npcs", []):
            anchor = n["key_prefix"].rsplit(".", 1)[0] + "."
            items = [(f"{n['key_prefix']}.name", n["name"][lang]), (f"{n['key_prefix']}.greet", n["greet"][lang]), (f"{n['key_prefix']}.name.t", n["name_t"][lang]), (f"{n['key_prefix']}.job.t", n["job_t"][lang])]
            items += [(f"{n['key_prefix']}.{t['suffix']}", t[lang]) for t in n.get("topics", [])]
            for k, v in items: insert(k, v, anchor)
        texts[lang] = lines
    # npcs.yaml
    p = f"content/towns/{town}/npcs.yaml"; L = open(p, encoding="utf8").read().rstrip("\n").split("\n")
    by_npc = {}
    for a in spec.get("add_topics", []): by_npc.setdefault(a["npc"], []).append((a["topic"], a["key"]))
    for npc, tops in by_npc.items():
        s = next(i for i, l in enumerate(L) if l == f"- id: {npc}")
        e = next((i for i in range(s + 1, len(L)) if L[i].startswith("- id:")), len(L))
        t = next(i for i in range(s, e) if L[i] == "  topics:")
        j = t + 1
        while j < e and (L[j].startswith("    ") or L[j].strip() == ""): j += 1
        while L[j - 1].strip() == "": j -= 1
        add = []
        for tk, sk in tops: add += [f"    {tk}:", f"      - text: {sk}"]
        L[j:j] = add
    for n in spec.get("new_npcs", []):
        x, y = n["pos"]; sched = n.get("schedule") or {k: [x, y] for k in ("0", "6", "12", "18")}
        L += [f"- id: {n['id']}", f"  map: {n['map']}", f"  pos: [{x}, {y}]", "  schedule:"] + [f"    \"{k}\": [{v[0]}, {v[1]}]" for k, v in sched.items()]
        L += [f"  name: {n['key_prefix']}.name", f"  greet: {n['key_prefix']}.greet", "  sprite: [town, 84]", "  topics:", "    name:", f"      - text: {n['key_prefix']}.name.t", "    job:", f"      - text: {n['key_prefix']}.job.t"]
        for t in n.get("topics", []): L += [f"    {t['topic']}:", f"      - text: {n['key_prefix']}.{t['suffix']}"]
    # 검증 후 기록
    for lang in ("ko", "en"):
        yaml.safe_load("\n".join(texts[lang]))
    yaml.safe_load("\n".join(L))
    for lang in ("ko", "en"): open(f"content/strings/{lang}.yaml", "w", encoding="utf8").write("\n".join(texts[lang]))
    open(p, "w", encoding="utf8").write("\n".join(L) + "\n")
    print(f"적용: 수정 {len(spec.get('edits', []))}줄, 새 주제 {len(spec.get('add_topics', []))}개, 새 인물 {len(spec.get('new_npcs', []))}명")


def dead_topics():
    c = context(); out = []
    for nid, n in c["npcs"].items():
        for tk in (n.get("topics") or {}):
            if tk in ("name", "job"): continue
            k = c["factdefs"].get(tk, {}).get("kind")
            if k not in ASKABLE: out.append((nid, tk, k))
    return out


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "dead-topics":
        d = dead_topics(); [print(f"{a} · {b} ({k})") for a, b, k in d]; print(f"{len(d)}개: 이 주제는 수첩 칩으로 나타나지 않아 게임에서 물을 수 없다"); sys.exit(0)
    if len(sys.argv) != 3 or sys.argv[1] not in ("validate", "apply"): print(__doc__); sys.exit(2)
    spec = json.load(open(sys.argv[2], encoding="utf8"))
    if sys.argv[1] == "validate":
        errs = validate(spec)
        print("\n".join(errs) if errs else "OK")
        sys.exit(1 if errs else 0)
    apply(spec)
