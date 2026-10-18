// 캐릭터 후보 비교표: 폴더마다 4방향(rot-south/east/north/west.png)을 6배로 확대해 한 줄씩 그린다.
// 사용: node scripts/visual/character-sheet.mjs <out.png> <char-dir> [<char-dir> ...]
// 그림 파일이 없거나 페이지 오류가 있으면 실패한다 (AGENTS.md §9.1). 결과 PNG는 반드시 열어 본다.
import { chromium } from "playwright";
import fs from "node:fs";
const [out, ...dirs] = process.argv.slice(2);
if (!out || !dirs.length) { console.error("usage: character-sheet.mjs <out.png> <dir>..."); process.exit(2); }
const u = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
let h = `<body style="background:#5f7048;margin:10px;font:14px sans-serif;color:#fff"><style>img{image-rendering:pixelated;width:192px;height:192px;background:#0002;margin:2px}</style>`;
for (const d of dirs) { h += `<div>${d.replace(/\/$/, "").split("/").pop()}</div><div style="display:flex">`; for (const x of ["south", "east", "north", "west"]) h += `<img src="${u(`${d}/rot-${x}.png`)}">`; h += "</div>"; }
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 300 } }); const errs = [];
p.on("pageerror", e => errs.push(e.message)); await p.setContent(h);
const broken = await p.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); return [...document.images].filter(i => !i.naturalWidth).length; });
if (broken) errs.push(broken + " images failed to load");
await p.screenshot({ path: out, fullPage: true }); await b.close();
if (errs.length) { console.error("SHEET FAIL:", errs.join("; ")); process.exit(1); }
console.log("SHEET OK", out);
