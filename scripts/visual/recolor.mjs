// 스프라이트 색 바꾸기(생성 0회): 지정한 색상(hue) 범위의 픽셀만 새 색상으로 옮긴다. 마을색 변형(art-production-plan §1 C층)에도 쓴다.
// 사용: node scripts/visual/recolor.mjs <src-dir> <out-dir> <fromHueMin> <fromHueMax> <toHue> [satScale=1] [lightScale=1]
// 예: 이방인 B 코트(황토, hue 25–42) → 남색: node scripts/visual/recolor.mjs assets/sprites/characters/stranger-B /tmp/out 25 42 215 0.9 1.0
// 하위 폴더의 모든 PNG를 같은 구조로 출력한다. 피부(밝고 채도 낮음)는 밝기 0.62 초과라 제외된다.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const [src, out, hmin, hmax, toHue, satS = "1", litS = "1"] = process.argv.slice(2);
if (!toHue) { console.error("usage: recolor.mjs <src> <out> <hueMin> <hueMax> <toHue> [satScale] [lightScale]"); process.exit(2); }
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith(".png")) files.push(p); } })(src);
const b = await chromium.launch(); const pg = await b.newPage(); let changed = 0;
for (const f of files) {
  const r = await pg.evaluate(async ([d, hmin, hmax, to, ss, ls]) => {
    const i = new Image(); i.src = d; await i.decode(); const c = document.createElement("canvas"); c.width = i.width; c.height = i.height;
    const x = c.getContext("2d"); x.drawImage(i, 0, 0); const im = x.getImageData(0, 0, c.width, c.height), a = im.data; let n = 0;
    for (let k = 0; k < a.length; k += 4) {
      if (!a[k + 3]) continue; const R = a[k] / 255, G = a[k + 1] / 255, B = a[k + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, dd = mx - mn;
      if (!dd) continue; const s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      let h = mx === R ? ((G - B) / dd + (G < B ? 6 : 0)) : mx === G ? (B - R) / dd + 2 : (R - G) / dd + 4; h *= 60;
      if (h < hmin || h > hmax || s < .3 || l < .2 || l > .62) continue;
      const S2 = Math.min(1, s * ss), L2 = Math.min(1, l * ls), q = L2 < .5 ? L2 * (1 + S2) : L2 + S2 - L2 * S2, p = 2 * L2 - q, H = to / 360;
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
      a[k] = Math.round(f(H + 1 / 3) * 255); a[k + 1] = Math.round(f(H) * 255); a[k + 2] = Math.round(f(H - 1 / 3) * 255); n++;
    }
    x.putImageData(im, 0, 0); return { n, png: c.toDataURL("image/png").split(",")[1] };
  }, ["data:image/png;base64," + fs.readFileSync(f).toString("base64"), +hmin, +hmax, +toHue, +satS, +litS]);
  const o = path.join(out, path.relative(src, f)); fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, Buffer.from(r.png, "base64")); changed += r.n;
}
await b.close(); console.log(`recolor: ${files.length} files, ${changed} pixels changed → ${out}`);
if (!changed) process.exit(1);
