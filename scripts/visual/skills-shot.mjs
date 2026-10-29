// 책략 확인: ?debug=1 로 능력 셋을 풀고 연습장 늑대 전투에서 표식(mark)을 건 모습과 HUD 버튼을 캡처한다(개발 서버 필요).
// 사용: node scripts/visual/skills-shot.mjs <out.png>
import { chromium } from "playwright";
const out = process.argv[2] ?? "skills.png";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
const key = async (k, n) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(230); } };
await key("ArrowRight", 2); await key("ArrowUp", 2); await key("ArrowRight", 4); await p.waitForTimeout(500);
await p.evaluate(() => window.__hollowCodex__.debugGrantAbilities(["*"]));
await p.waitForTimeout(500);
const st = () => p.evaluate(() => { const s = window.__hollowCodex__.state(); return s.combat === null ? null : s.combat.units.map(u => ({ id: u.id, side: u.side, x: u.pos.x, y: u.pos.y, gone: u.gone })); });
for (let g = 0; g < 8; g++) {
  const units = await st(); if (!units) break;
  const me = units.find(u => u.id === "player");
  const adj = units.find(u => u.side === "enemy" && !u.gone && Math.abs(u.x - me.x) + Math.abs(u.y - me.y) === 1);
  if (adj) {
    const dir = adj.x > me.x ? "e" : adj.x < me.x ? "w" : adj.y > me.y ? "s" : "n";
    await p.evaluate((d) => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "skill", skill: "mark", dir: d } }), dir);
    await p.waitForTimeout(2200);
    await p.screenshot({ path: out }); console.log(errs.length ? "ERRORS " + errs.join("|") : "SHOT OK " + out); await b.close(); process.exit(0);
  }
  await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "endTurn" } })); await p.waitForTimeout(2300);
}
console.log("no adjacent enemy"); await b.close(); process.exit(1);
