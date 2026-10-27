#!/usr/bin/env python3
"""content/strings/ko.yaml의 문자열을 맞춤법 MCP 서버(@winterjung/mcp-korean-spell, 네이버 맞춤법 검사기)로 검사해 바뀐 곳을 보여 준다.
사용: python3 scripts/narrative/spellcheck.py <키 접두어> [<키 접두어> ...]   예: npc.kalas. npc.field. fact.kalas.
- 한 번에 300자 이하 문장 덩어리로 보낸다(서버 제한 회피). 문자열은 외부 서비스(네이버)로 전송된다 → 비밀 정보 금지(대사는 공개 저장소 내용이라 OK).
- 서버는 한정된 규칙만 고친다(띄어쓰기·흔한 오타 위주). 어색한 어휘·어체 혼용은 못 잡으므로 사람이/모델이 따로 읽는다.
- 출력: 키 | 원문 | 수정안 (바뀐 것만). 종료 코드는 항상 0."""
import json, subprocess, sys, difflib, yaml
# 검사기가 모르는 이 게임의 조어는 비슷한 실제 단어로 바꿔 보낸다(오탐 방지). 새 조어를 만들면 여기에 추가.
TERMS = {"고발관장": "경찰서장", "고발청": "경찰청", "고발관": "경찰관", "필경사": "서기관", "열석": "돌기둥", "연실": "연줄", "순례자": "여행자"}
def mask(t):
    for a, b in TERMS.items(): t = t.replace(a, b)
    return t
prefixes = sys.argv[1:]
if not prefixes: print(__doc__); sys.exit(2)
d = yaml.safe_load(open("content/strings/ko.yaml"))
items = [(k, str(v)) for k, v in d.items() if k.startswith(tuple(prefixes))]
p = subprocess.Popen(["npx", "-y", "@winterjung/mcp-korean-spell"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
def send(o): p.stdin.write(json.dumps(o, ensure_ascii=False) + "\n"); p.stdin.flush()
send({"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"lint","version":"1"}}}); p.stdout.readline()
send({"jsonrpc":"2.0","method":"notifications/initialized"})
changed = 0
for n, (k, v) in enumerate(items, 1):
    if "{" in v and "}" in v: v2 = v  # 자리표시자는 그대로 보냄
    send({"jsonrpc":"2.0","id":n,"method":"tools/call","params":{"name":"fix_korean_spell","arguments":{"text":mask(v)}}})
    r = json.loads(p.stdout.readline())
    try: fixed = r["result"]["content"][0]["text"].strip()
    except Exception: print(f"ERR {k}: {str(r)[:120]}"); continue
    if fixed.replace(" ", "") != v.strip().replace(" ", "") or fixed != v.strip():
        src = mask(v.strip()); sm = difflib.SequenceMatcher(None, src, fixed); diffs = [(src[max(0,a-6):b+6], fixed[max(0,c-6):e+6]) for t, a, b, c, e in sm.get_opcodes() if t != "equal" and (src[a:b].strip() or fixed[c:e].strip() or True)]
        if diffs: changed += 1; print(f"{k}\n   " + " | ".join(f"「{x}」→「{y}」" for x, y in diffs))
p.terminate(); print(f"\n{len(items)}개 검사, {changed}개 수정 제안")
