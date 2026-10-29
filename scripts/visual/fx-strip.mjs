// 공격 연출 프레임 스트립: 연습장 늑대 전투에서 인접한 적을 공격하는 동안 연속 캡처해 시각표와 함께 한 장으로 합친다(개발 서버 필요).
// 사용: node scripts/visual/fx-strip.mjs <out.png>
import { chromium } from "playwright";
const out = process.argv[2] ?? "fx-strip.png";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto("http://localhost:5173/hollow-codex/"); await p.waitForTimeout(1500);
const key = async (k, n) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(230); } };
await key("ArrowRight", 2); await key("ArrowUp", 2); await key("ArrowRight", 4); await p.waitForTimeout(600);
const st = () => p.evaluate(() => { const s = window.__hollowCodex__.state(); return s.combat === null ? null : s.combat.units.map(u => ({ id: u.id, side: u.side, x: u.pos.x, y: u.pos.y, gone: u.gone })); });
for (let g = 0; g < 12; g++) {
  const units = await st(); if (units === null) break;
  const me = units.find(u => u.id === "player");
  const adj = units.find(u => u.side === "enemy" && !u.gone && Math.abs(u.x - me.x) + Math.abs(u.y - me.y) === 1);
  if (!adj) { await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "endTurn" } })); await p.waitForTimeout(2500); continue; }
  await p.waitForTimeout(1200);
  const dir = adj.x > me.x ? "e" : adj.x < me.x ? "w" : adj.y > me.y ? "s" : "n";
  const clip = { x: 416, y: 150, width: 448, height: 400 };
  const frames = []; const t0 = Date.now();
  await p.evaluate((d) => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "attack", dir: d } }), dir);
  while (Date.now() - t0 < 640) frames.push({ t: Date.now() - t0, buf: await p.screenshot({ clip, type: "jpeg", quality: 70 }) });
  const pick = frames.filter((_, i) => i % Math.max(1, Math.floor(frames.length / 10)) === 0).slice(0, 10);
  const html = `<body style="margin:0;background:#111;color:#fff;font:14px sans-serif"><div style="display:flex;flex-wrap:wrap;width:2300px">` + pick.map(f => `<div style="width:440px;margin:4px"><img width=440 src="data:image/jpeg;base64,${f.buf.toString("base64")}"><div>t=${f.t}ms</div></div>`).join("") + `</div>`;
  const pg = await b.newPage({ viewport: { width: 2320, height: 1000 } }); await pg.setContent(html); await pg.screenshot({ path: out });
  console.log(`captured ${frames.length} frames in 640ms (${(frames.length / 0.64).toFixed(0)} fps), strip ${pick.length} → ${out}`); await b.close(); process.exit(0);
}
console.log("no adjacent enemy reached"); await b.close(); process.exit(1);
