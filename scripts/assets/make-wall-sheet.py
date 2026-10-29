#!/usr/bin/env python3
"""마을 벽·문과 서고 벽·바닥 32px 타일 7장을 코드로 그려 assets/tiles/walls32.png(224×32)로 만든다(AI 생성 없음, 순수 파이썬).
칸 0 마을 벽(석조 담), 1 문(나무), 2 서고 벽(어두운 석조), 3 서고 바닥(어두운 돌), 4 실내 마루(나무판), 5 계단(어두운 돌 바닥에 내려가는 층계), 6 산(배경 투명 — 풀 위에 얹는다). 색은 풀↔돌바닥 타일셋의 차분한 팔레트에 맞춘다.
사용: python3 scripts/assets/make-wall-sheet.py"""
import struct, zlib
W, H, N = 32, 32, 7
img = [[(0, 0, 0, 0)] * (W * N) for _ in range(H)]
def put(t, x, y, c):
    if 0 <= x < W and 0 <= y < H: img[y][t * W + x] = c + (255,) if len(c) == 3 else c
def noise(x, y, s): return ((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) & 7
def shade(c, d): return tuple(max(0, min(255, v + d)) for v in c)

def wall(t, base, mortar, dark):
    # 벽돌: 높이 8 줄, 한 줄씩 반 칸 어긋남, 길이 16
    for y in range(H):
        row = y // 8
        off = 8 if row % 2 else 0
        for x in range(W):
            bx = (x + off) % 16
            c = shade(base, (noise(x // 2, y // 2, t) - 3) * 3)
            if y % 8 == 0 or bx == 0: c = mortar
            elif y % 8 == 1: c = shade(base, 14)       # 윗면 하이라이트
            elif y % 8 == 7: c = shade(base, -12)      # 아랫면 그늘
            put(t, x, y, c)
    for x in range(W):                                  # 맨 아래 그림자 띠
        for y in range(28, 32): put(t, x, y, shade(img[y][t * W + x][:3], -22))

wall(0, (128, 116, 104), (84, 74, 68), 0)
wall(2, (86, 84, 96), (52, 50, 62), 0)
# 문: 돌 담 위에 나무 문
wall(1, (128, 116, 104), (84, 74, 68), 0)
frame, wood, woodd = (52, 36, 26), (132, 92, 56), (100, 68, 40)
for y in range(5, 32):
    for x in range(7, 25):
        edge = x in (7, 24) or y == 5
        put(1, x, y, frame if edge else (woodd if (x - 8) % 4 == 3 else shade(wood, (noise(x, y, 9) - 3) * 2)))
for y in range(5, 10):
    for x in range(9, 23): put(1, x, y, shade(frame, 10)) if y == 5 else None
for dx, dy in ((19, 19), (20, 19), (19, 20), (20, 20)): put(1, dx, dy, (214, 176, 84))
# 서고 바닥: 어두운 큰 돌 + 금
for y in range(H):
    for x in range(W):
        c = shade((70, 68, 78), (noise(x // 2, y // 2, 5) - 3) * 3)
        if x % 16 == 0 or y % 16 == 0: c = (46, 44, 54)
        put(3, x, y, c)
# 실내 마루: 가로 판자, 판마다 결이 조금 다름
for y in range(H):
    plank = y // 8
    for x in range(W):
        c = shade((150, 112, 72), (noise(x // 3, y, 11 + plank) - 3) * 3 - plank % 2 * 8)
        if y % 8 == 0: c = (92, 64, 40)
        elif (x + plank * 11) % 28 == 0: c = (110, 78, 48)
        put(4, x, y, c)
# 계단: 서고 바닥 위에 아래로 내려가는 층계(위가 밝고 아래로 갈수록 어두운 단)
for y in range(H):
    for x in range(W):
        step = y // 6
        c = shade((88, 86, 98), -step * 11 + (noise(x // 2, y // 2, 21) - 3) * 2)
        if y % 6 == 0: c = shade((120, 118, 130), -step * 11)
        elif y % 6 == 5: c = (34, 32, 42)
        if x < 3 or x > 28: c = (46, 44, 54)
        put(5, x, y, c)
# 산: 가운데 봉우리가 있는 삼각 바위. 배경은 투명(풀 위에 얹는다). 왼쪽 면 밝게, 오른쪽 어둡게, 윤곽선, 꼭대기 눈.
OUTLINE, LIGHT, DARK, SNOW = (44, 36, 40), (150, 140, 130), (104, 96, 92), (226, 228, 232)
for x in range(W):
    d = abs(x - 15.5)
    top = int(6 + d * 1.55)                      # 봉우리에서 좌우로 내려가는 능선
    if top > 29: continue
    for y in range(top, 30):
        face = LIGHT if x < 16 else DARK
        c = shade(face, (noise(x, y, 31) - 3) * 3 - (y - top) // 3)
        if y == top or y == 29: c = OUTLINE
        elif y < top + 4 and d < 5: c = SNOW if x < 17 else shade(SNOW, -30)
        put(6, x, y, c)
    put(6, x, top, OUTLINE)
def png(path):
    raw = b"".join(b"\x00" + bytes(v for p in row for v in p) for row in img)
    def ch(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    open(path, "wb").write(b"\x89PNG\r\n\x1a\n" + ch(b"IHDR", struct.pack(">IIBBBBB", W * N, H, 8, 6, 0, 0, 0)) + ch(b"IDAT", zlib.compress(raw, 9)) + ch(b"IEND", b""))
png("assets/tiles/walls32.png")
print("wrote assets/tiles/walls32.png")
