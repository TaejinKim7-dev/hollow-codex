// 캔버스 가운데를 잘라 크기를 맞춘다(예: skeleton-v3 걷기 프레임 64×64 → 48×48, 캐릭터 픽셀 크기는 그대로).
// 사용: node scripts/visual/crop-canvas.mjs <size> <in.png> [<in.png> ...]   (제자리 덮어쓰기)
// 잘리는 테두리에 불투명 픽셀이 있으면 그 파일은 건드리지 않고 실패한다.
import { chromium } from "playwright";
import fs from "node:fs";
const [size, ...files] = process.argv.slice(2); const N = +size; let bad = 0;
const b = await chromium.launch(); const p = await b.newPage();
for (const f of files) {
  const r = await p.evaluate(async ([d, N]) => {
    const i = new Image(); i.src = d; await i.decode(); const o = (i.width - N) / 2; if (o < 0 || o % 1) return { err: "size" };
    const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const x = c.getContext("2d"); x.drawImage(i, 0, 0);
    const a = x.getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) { const inside = xx >= o && xx < o + N && y >= o && y < o + N; if (!inside && a[(y * c.width + xx) * 4 + 3]) return { err: "opaque pixel outside crop" }; }
    const c2 = document.createElement("canvas"); c2.width = N; c2.height = N; c2.getContext("2d").drawImage(i, -o, -o); return { png: c2.toDataURL("image/png").split(",")[1] };
  }, ["data:image/png;base64," + fs.readFileSync(f).toString("base64"), N]);
  if (r.err) { console.error(f, r.err); bad++; continue; } fs.writeFileSync(f, Buffer.from(r.png, "base64"));
}
await b.close(); console.log(`crop: ${files.length - bad}/${files.length} ok`); if (bad) process.exit(1);
