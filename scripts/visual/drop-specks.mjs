// 몸에서 떨어진 작은 픽셀 덩어리(생성 잡티)를 지운다. 8방향 연결 기준으로 가장 큰 덩어리는 항상 남기고, minSize 미만 덩어리만 지운다.
// 사용: node scripts/visual/drop-specks.mjs <minSize> <in.png> [...]   (제자리 덮어쓰기, 지운 픽셀 수를 출력)
import { chromium } from "playwright";
import fs from "node:fs";
const [min, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage();
for (const f of files) {
  const r = await p.evaluate(async ([d, min]) => {
    const i = new Image(); i.src = d; await i.decode(); const W = i.width, H = i.height, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); x.drawImage(i, 0, 0); const im = x.getImageData(0, 0, W, H), a = im.data, lab = new Int32Array(W * H).fill(-1), comps = [];
    for (let s = 0; s < W * H; s++) { if (!a[s * 4 + 3] || lab[s] >= 0) continue; const st = [s], px = []; lab[s] = comps.length;
      while (st.length) { const q = st.pop(); px.push(q); const qx = q % W, qy = (q / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (a[n * 4 + 3] && lab[n] < 0) { lab[n] = comps.length; st.push(n); } } }
      comps.push(px); }
    const big = Math.max(...comps.map(c => c.length)); let removed = 0;
    for (const cp of comps) if (cp.length < min && cp.length < big) for (const q of cp) { a[q * 4 + 3] = 0; removed++; }
    x.putImageData(im, 0, 0); return { removed, png: c.toDataURL("image/png").split(",")[1] };
  }, ["data:image/png;base64," + fs.readFileSync(f).toString("base64"), +min]);
  if (r.removed) { fs.writeFileSync(f, Buffer.from(r.png, "base64")); console.log(f.split("/").slice(-2).join("/"), "removed", r.removed); }
}
await b.close();
