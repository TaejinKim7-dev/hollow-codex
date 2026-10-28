// PixelLab 타일셋 metadata.json → 같은 폴더의 autotile.json.
// 사용: node scripts/assets/make-autotile.mjs grass-path-v3 [grass-water ...]
// 키는 "NW NE SW SE" 순의 4비트 문자열(1 = 'lower' 땅, 곧 풀 위에 덮어 그릴 쪽), 값은 sheet.png 안 32px 칸 {col,row}.
// 칸 위치는 bounding_box에서 읽는다(original_position은 생성 당시 격자라 시트 위치가 아니다).
import { readFileSync, writeFileSync } from "node:fs"

for (const id of process.argv.slice(2)) {
  const dir = `assets/sprites/tilesets/${id}`
  const meta = JSON.parse(readFileSync(`${dir}/metadata.json`, "utf8"))
  const size = meta.tile_size.width
  const table = {}
  for (const t of meta.tileset_data.tiles) {
    const bit = (c) => (t.corners[c] === "lower" ? "1" : "0")
    const key = bit("NW") + bit("NE") + bit("SW") + bit("SE")
    const bb = t.bounding_box
    table[key] = { col: bb.x / size, row: bb.y / size }
  }
  const sorted = Object.fromEntries(Object.entries(table).sort(([a], [b]) => (a < b ? -1 : 1)))
  writeFileSync(`${dir}/autotile.json`, JSON.stringify(sorted, null, 1) + "\n")
  console.log(`${id}: ${Object.keys(sorted).length} patterns`)
}
