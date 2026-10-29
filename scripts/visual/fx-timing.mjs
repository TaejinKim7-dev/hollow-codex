// 연출 길이 측정: 연습장 늑대 전투에서 인접한 적을 공격하고, 캔버스가 마지막으로 바뀐 시각까지를 잰다(개발 서버 필요).
// 사용: node scripts/visual/fx-timing.mjs [반복 횟수 기본 3]
import { chromium } from "playwright";
const runs = Number(process.argv[2] ?? 3);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto("http://localhost:5173/hollow-codex/"); await p.waitForTimeout(1500);
const key = async (k, n) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(230); } };
await key("ArrowRight", 2); await key("ArrowUp", 2); await key("ArrowRight", 4); await p.waitForTimeout(600);
const st = () => p.evaluate(() => { const s = window.__hollowCodex__.state(); return s.combat === null ? null : s.combat.units.map(u => ({ id: u.id, side: u.side, x: u.pos.x, y: u.pos.y, gone: u.gone })); });
const dispatch = (c) => p.evaluate((x) => window.__hollowCodex__.dispatch(x), c);
const results = [];
for (let guard = 0; guard < 12 && results.length < runs; guard++) {
  const units = await st(); if (units === null) break;
  const me = units.find(u => u.id === "player");
  const adj = units.find(u => u.side === "enemy" && !u.gone && Math.abs(u.x - me.x) + Math.abs(u.y - me.y) === 1);
  if (!adj) { await dispatch({ type: "combat", action: { kind: "endTurn" } }); await p.waitForTimeout(2500); continue; }
  await p.waitForTimeout(1200);
  const dir = adj.x > me.x ? "e" : adj.x < me.x ? "w" : adj.y > me.y ? "s" : "n";
  const r = await p.evaluate((d) => new Promise((resolve) => {
    const cv = document.querySelector("#screen canvas") ?? document.querySelector("canvas");
    const s = document.createElement("canvas"); s.width = 96; s.height = 54; const x = s.getContext("2d", { willReadFrequently: true });
    const snap = () => { x.drawImage(cv, 0, 0, s.width, s.height); return x.getImageData(0, 0, s.width, s.height).data; };
    let prev = snap(); const t0 = performance.now(); let first = null, last = null;
    window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "attack", dir: d } });
    const tick = () => {
      const now = performance.now() - t0, cur = snap(); let diff = 0;
      for (let i = 0; i < cur.length; i += 4) diff += Math.abs(cur[i] - prev[i]) + Math.abs(cur[i + 1] - prev[i + 1]);
      if (diff > 400) { if (first === null) first = now; last = now }
      prev = cur;
      if (now > 2500) resolve({ first, last }); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), dir);
  results.push(r); console.log(`attack ${results.length}: first change ${r.first?.toFixed(0)}ms, last change ${r.last?.toFixed(0)}ms`);
}
await b.close();
if (results.length === 0) { console.log("no attack measured"); process.exit(1); }
