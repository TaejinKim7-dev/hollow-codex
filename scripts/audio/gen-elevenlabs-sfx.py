#!/usr/bin/env python3
"""ElevenLabs(text-to-sound-effects)로 게임 효과음을 만든다. 결과는 git 제외 폴더 assets-private/elevenlabs/sfx/ 에만 저장한다.
사용: python3 scripts/audio/gen-elevenlabs-sfx.py [id ...]   (id를 주면 그것만, 이미 있는 파일은 건너뜀; --force 로 덮어쓰기)
라이선스 주의: 무료 요금제 출력물은 약관 §1(c)(i)에 따라 비상업 목적만. 이 파일들은 저장소(CC-BY-SA 공개)에 커밋하지 않는다.
manifest(assets-private/elevenlabs/sfx/manifest.json)에 프롬프트·길이·날짜를 남긴다."""
import json, os, subprocess, sys, datetime
OUT = "assets-private/elevenlabs/sfx"
# id: (프롬프트, 길이(초), loop)
SFX = {
 # --- 크리처·늑대
 "wolf_howl":      ("A single lonely wolf howl in the distance at dusk, thin and mournful, no music", 3, False),
 "wolf_growl":     ("A weak, hungry wolf giving a low warning growl, wary and frightened rather than aggressive, no music", 1.5, False),
 "wolf_whimper":   ("A starving wolf whimpering softly, pitiful, short", 1.5, False),
 "wolf_pant":      ("A tired thin wolf panting quietly with a small whine", 2, False),
 "robber_grunt":   ("A greedy man grunting as he swings a crowbar, short effort sound, no speech", 1, False),
 "pilgrim_fade":   ("A shimmering airy glassy chime swell, like a memory fading, gentle and wistful, clearly audible", 2, False),
 # --- 열석·세계
 "stone_ring_hum": ("A deep low resonant hum from ancient standing stones, slowly swelling, mystical but calm", 4, False),
 "ring_unlock":    ("Ancient stone circle awakening: a soft deep stone rumble followed by a clear single bell tone, calm and wondrous", 3, False),
 "ring_travel":    ("A gentle whoosh of wind with a rising airy chime, like being carried between stones, soft", 2.5, False),
 "lantern_shatter":("A glass lantern shattering on stone, a few tinkling shards settling, dry and clear", 1.8, False),
 "ledger_stamp":   ("A heavy wooden stamp hitting a thick paper ledger on a desk, one firm loud thud with a short paper slap", 0.8, False),
 "quill_scratch":  ("A quill pen scratching on parchment, slow careful writing, quiet room", 2, False),
 "scroll_unroll":  ("A parchment scroll being unrolled and rustling, then flattened on a wooden table", 1.5, False),
 "codex_glow":     ("A soft magical chime as blank pages of an old book light up, warm shimmering, short", 2.5, False),
 "bell_far":       ("A single distant village bell tolling slowly across a field, soft, with gentle echo", 4, False),
 # --- 전투
 "combat_start":   ("Tense moment as a sword is half-drawn from a leather scabbard with a metallic scrape, low rumble of tension", 1.5, False),
 "defend":         ("A shield blocking a hit: wooden shield thud with a short metallic ring", 0.8, False),
 "persuade":       ("A gentle rising two-note chime with a soft breath, calm and reassuring", 1.2, False),
 "flee":           ("Hurried footsteps on dry grass running away with cloth rustling, short", 1.5, False),
 "victory":        ("A short quiet relief motif on a wooden flute and a soft harp, hopeful, five seconds, no drums", 4, False),
 "defeat":         ("A slow low sad bell toll with a faint exhale of wind, somber, short", 3, False),
 "hit_soft":       ("A dull thud of a fist against a cloth tunic, short and not violent", 0.6, False),
 # --- 이벤트 징글
 "companion_join": ("Two friendly soft plucked harp notes ascending, warm and welcoming", 1.5, False),
 "companion_leave":("Two soft plucked notes descending, wistful, fading away", 1.8, False),
 "ability_unlock": ("A bright short magical sparkle with a pure bell tone, small and elegant", 1.6, False),
 "crisis_resolved":("A long gentle exhale of relief with a warm bell chord blooming and fading, peaceful release", 4, False),
 "clue_found":     ("A single glass-like chime with a tiny sparkle, curious and light", 1.2, False),
 "epilogue":       ("A slow warm chord of strings and a soft bell, tender ending, fading to silence", 6, False),
 # --- 분위기 루프
 "amb_field":      ("Quiet open meadow ambience at dusk: soft wind in dry grass, a distant bird now and then, very calm", 12, True),
 "amb_village":    ("Quiet medieval village square ambience in the evening: faint distant murmur of people, soft wind, a lantern creaking", 12, True),
 "amb_river":      ("A gentle shallow river flowing over small stones, calm, steady", 12, True),
 "amb_archive":    ("Underground stone library ambience: a low steady air draft, soft dusty echo and a slow occasional drip, clearly audible but quiet", 12, True),
 "amb_night":      ("Night countryside ambience: soft crickets and a faint breeze, calm and sparse", 12, True),
 "amb_fire":       ("A small hearth fire crackling softly in a stone room, steady and warm", 10, True),
 "amb_silence":    ("Hollow empty chapel room tone: a soft low airy drone and gentle distant reverb, calm and clearly audible", 10, True),
}
args=[a for a in sys.argv[1:] if not a.startswith("--")]; force="--force" in sys.argv
os.makedirs(OUT,exist_ok=True)
mp=f"{OUT}/manifest.json"; man=json.load(open(mp)) if os.path.exists(mp) else {}
todo=[k for k in (args or SFX) if k in SFX]
fail=[]
for k in todo:
    path=f"{OUT}/{k}.mp3"
    if os.path.exists(path) and not force and k in man: print("skip",k); continue
    text,dur,loop=SFX[k]
    cmd=["elevenlabs","text-to-sound-effects","convert","--text",text,"--duration-seconds",str(dur),"--prompt-influence","0.6","--output",path]
    if loop: cmd+=["--loop","true"]
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode or not os.path.exists(path) or os.path.getsize(path)<2000:
        print("FAIL",k,(r.stdout+r.stderr)[-300:]); fail.append(k); continue
    man[k]={"file":f"{k}.mp3","prompt":text,"duration_s":dur,"loop":loop,"model":"eleven_text_to_sound_v2","tool":"ElevenLabs CLI text-to-sound-effects","plan":"free","license":"ElevenLabs free plan — non-commercial only (ToS §1(c)(i))","date":datetime.date.today().isoformat(),"bytes":os.path.getsize(path)}
    json.dump(man,open(mp,"w"),ensure_ascii=False,indent=1); print("ok",k,os.path.getsize(path))
print("done", len(man), "files; failed:", fail); sys.exit(1 if fail else 0)
