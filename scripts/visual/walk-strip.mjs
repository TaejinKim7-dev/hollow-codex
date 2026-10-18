// 걷기 프레임 검사표: 4방향 × (대기 + 걷기 4프레임)을 6배로 확대한다. 소품이 한 프레임에만 나타나는 깜빡임 등을 눈으로 찾는다.
// 사용: node scripts/visual/walk-strip.mjs <char-dir> <out.png>
import { chromium } from "playwright";
import fs from "node:fs";
const [d, out] = process.argv.slice(2);
const u = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
let h = `<body style="background:#5f7048;margin:8px;font:12px sans-serif;color:#fff"><style>img{image-rendering:pixelated;width:192px;height:192px;margin:2px;background:#0002}</style>`;
for (const x of ["south", "east", "north", "west"]) { h += `<div>${x}</div><div style="display:flex"><img src="${u(`${d}/rot-${x}.png`)}">`; for (let i = 0; i < 4; i++) h += `<img src="${u(`${d}/walk-${x}/${i}.png`)}">`; h += "</div>"; }
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1010, height: 400 } }); await p.setContent(h);
await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log("STRIP OK", out);
