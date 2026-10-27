#!/usr/bin/env python3
"""고른 배경음악 후보(원본 mp3)를 게임용 루프 OGG로 만든다.
사용: python3 scripts/audio/make-bgm-loops.py <ffmpeg 경로> [slot ...]
- 원본: assets-private/preview/bgm/<slot>-<A|B>.mp3 (git 제외), 선택: scripts/audio/bgm-selection.json
- 처리: 앞에서 MAXLEN초까지만 사용 → 끝 XF초를 처음 XF초와 크로스페이드해 이어 붙임(루프 이음매 제거) → 스테레오 Vorbis 약 80 kbps
- 출력: assets/audio/bgm/<slot>.ogg
루프 구조: 본체=[XF, D-XF] + 이음매=같은 길이의 꼬리[D-XF, D]를 페이드아웃·머리[0, XF]를 페이드인해 겹침(amix, 등전력 곡선); 파일 끝(머리 XF초 지점)에서 처음(본체 시작=XF초 지점)으로 이어진다."""
import json, os, subprocess, sys
ff=sys.argv[1]; only=sys.argv[2:]
MAXLEN=110; XF=4
sel=json.load(open("scripts/audio/bgm-selection.json"))
os.makedirs("assets/audio/bgm",exist_ok=True)
def dur(path):
    r=subprocess.run([ff,"-hide_banner","-i",path],capture_output=True,text=True).stderr
    import re; m=re.search(r"Duration: (\d+):(\d+):([\d.]+)",r); return int(m[1])*3600+int(m[2])*60+float(m[3])
for slot,key in sel.items():
    if only and slot not in only: continue
    src=f"assets-private/preview/bgm/{slot}-{key}.mp3"; out=f"assets/audio/bgm/{slot}.ogg"
    D=min(dur(src),MAXLEN)
    f=(f"[0:a]atrim=0:{D},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,asplit=3[a][b][c];"
       f"[a]atrim={XF}:{D-XF},asetpts=PTS-STARTPTS[body];"
       f"[b]atrim={D-XF}:{D},asetpts=PTS-STARTPTS[tail];"
       f"[c]atrim=0:{XF},asetpts=PTS-STARTPTS[head];"
       f"[tail]afade=t=out:st=0:d={XF}:curve=qsin[t];[head]afade=t=in:st=0:d={XF}:curve=qsin[h];"
       f"[t][h]amix=inputs=2:duration=longest:normalize=0[seam];"
       f"[body][seam]concat=n=2:v=0:a=1,loudnorm=I=-20:TP=-2:LRA=11,aresample=44100[o]")
    cmd=[ff,"-y","-hide_banner","-loglevel","error","-i",src,"-filter_complex",f,"-map","[o]","-c:a","libvorbis","-b:a","80k",out]
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode: print("FAIL",slot,r.stderr[-300:]); sys.exit(1)
    print(f"{slot}: {key} {D:.0f}s -> {os.path.getsize(out)/1e6:.2f} MB")
