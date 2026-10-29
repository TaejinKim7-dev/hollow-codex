#!/usr/bin/env python3
"""Migrate town interior maps from legacy sprite tiles to new ground tiles.

Preserves YAML comments and formatting by editing row strings line-by-line.
Converts only the map whose id starts with "map.town." in each file.
Idempotent: running twice produces identical output.
"""

from __future__ import annotations

import re
import sys
from collections import deque
from pathlib import Path

TOWNS = [
    "compassion",
    "honor",
    "humility",
    "justice",
    "sacrifice",
    "spirituality",
    "valor",
]

# Legacy chars that form the continuous outdoor walkable region.
TRAVERSABLE = set(".,:T")

# Outdoor legacy char -> new ground/object glyph.
OUTDOOR_MAP = {".": "g", ",": "p", "T": "t", ":": "c"}

# Reverse mapping so already-converted maps can be re-processed safely.
REVERSE_MAP = {"g": ".", "p": ",", "t": "T", "c": ":"}

EXIT_AT_RE = re.compile(r"at:\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]")


def parse_exit_coords(text: str) -> list[tuple[int, int]]:
    """Collect every `at: [x, y]` inside an `exits:` block."""
    coords: list[tuple[int, int]] = []
    in_exits = False
    for raw in text.splitlines():
        line = raw.lstrip()
        if line.startswith("exits:"):
            in_exits = True
            continue
        if not in_exits:
            continue
        if line.startswith("- "):
            m = EXIT_AT_RE.search(line)
            if m:
                coords.append((int(m.group(1)), int(m.group(2))))
        elif line and not line.startswith("#"):
            in_exits = False
    return coords


def convert_rows(rows: list[str], exit_coords: list[tuple[int, int]]) -> list[str]:
    """Return converted row strings for one town interior map."""
    h = len(rows)
    w = len(rows[0]) if rows else 0

    # Normalise already-converted glyphs back to legacy for region detection.
    effective: list[list[str]] = []
    for row in rows:
        eff = []
        for ch in row:
            eff.append(REVERSE_MAP.get(ch, ch))
        effective.append(eff)

    # BFS from every exit tile to find the outdoor region.
    outdoor = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for y in range(h):
        for x in range(w):
            if effective[y][x] in "+<":

                outdoor[y][x] = True
                q.append((x, y))

    for x, y in exit_coords:
        if 0 <= x < w and 0 <= y < h and not outdoor[y][x]:
            outdoor[y][x] = True
            q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if (
                0 <= nx < w
                and 0 <= ny < h
                and not outdoor[ny][nx]
                and effective[ny][nx] in TRAVERSABLE
            ):
                outdoor[ny][nx] = True
                q.append((nx, ny))

    # Apply outdoor mapping.
    result: list[list[str]] = [list(row) for row in rows]
    for y in range(h):
        for x in range(w):
            if outdoor[y][x]:
                ch = effective[y][x]
                if ch in OUTDOOR_MAP:
                    result[y][x] = OUTDOOR_MAP[ch]

    # Ground adjacency fix: c next to p becomes g (8-neighbour, deterministic).
    while True:
        changed = False
        for y in range(h):
            for x in range(w):
                if result[y][x] != "c":
                    continue
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        if dx == 0 and dy == 0:
                            continue
                        nx, ny = x + dx, y + dy
                        if (
                            0 <= nx < w
                            and 0 <= ny < h
                            and result[ny][nx] == "p"
                        ):
                            result[y][x] = "g"
                            changed = True
                            break
                    if changed:
                        break
        if not changed:
            break

    return ["".join(row) for row in result]


def summarize(original: list[str], converted: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {
        "g": 0,
        "p": 0,
        "t": 0,
        "c": 0,
        "unchanged": 0,
        "c_to_g_fix": 0,
    }
    for orow, crow in zip(original, converted):
        for och, cch in zip(orow, crow):
            if och == cch:
                counts["unchanged"] += 1
                continue
            if och == ":" and cch == "c":
                counts["c"] += 1
            elif och == "." and cch == "g":
                counts["g"] += 1
            elif och == "," and cch == "p":
                counts["p"] += 1
            elif och == "T" and cch == "t":
                counts["t"] += 1
            elif och == "c" and cch == "g":
                counts["c_to_g_fix"] += 1
    return counts


def process_file(path: Path) -> tuple[str, list[str], list[str], dict[str, int]] | None:
    """Edit a maps.yaml file in place. Returns (map_id, original, converted, counts)."""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    exit_coords = parse_exit_coords(text)

    current_map_id: str | None = None
    in_rows = False
    rows_info: list[tuple[int, str]] = []  # (line_index, row_content)

    for i, raw in enumerate(lines):
        line = raw.lstrip()
        if line.startswith("- id:"):
            current_map_id = line.split(":", 1)[1].strip()
            in_rows = False
            continue
        if line.startswith("rows:"):
            in_rows = True
            continue
        if not in_rows:
            continue
        if line.startswith("- ") and '"' in line:
            if current_map_id is not None and current_map_id.startswith("map.town."):
                content = line.strip("- ").strip().strip('"')
                rows_info.append((i, content))
        elif line and not line.startswith("#"):
            in_rows = False

    if not rows_info:
        return None

    original = [content for _, content in rows_info]
    converted = convert_rows(original, exit_coords)

    for (i, _), new_content in zip(rows_info, converted):
        raw = lines[i]
        first = raw.find('"')
        last = raw.rfind('"')
        if first == -1 or last == -1 or first == last:
            raise ValueError(f"Could not find quotes in {path}:{i + 1}")
        lines[i] = raw[: first + 1] + new_content + raw[last:]

    path.write_text("".join(lines), encoding="utf-8")
    return current_map_id or "unknown", original, converted, summarize(original, converted)


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    towns = sys.argv[1:] if len(sys.argv) > 1 else TOWNS

    summaries: list[tuple[str, dict[str, int]]] = []
    for town in towns:
        path = root / "content" / "towns" / town / "maps.yaml"
        if not path.exists():
            print(f"SKIP {town}: {path} not found", file=sys.stderr)
            continue
        result = process_file(path)
        if result is None:
            print(f"SKIP {town}: no map.town.* map in {path}", file=sys.stderr)
            continue
        map_id, _original, _converted, counts = result
        summaries.append((map_id, counts))
        print(
            f"{town} ({map_id}): g={counts['g']} p={counts['p']} t={counts['t']} "
            f"c={counts['c']} unchanged={counts['unchanged']} c->g_fix={counts['c_to_g_fix']}"
        )

    if summaries:
        total = {k: sum(c[k] for _, c in summaries) for k in summaries[0][1]}
        print(
            f"TOTAL: g={total['g']} p={total['p']} t={total['t']} "
            f"c={total['c']} unchanged={total['unchanged']} c->g_fix={total['c_to_g_fix']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
