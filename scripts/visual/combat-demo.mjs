// 전투 연출 확인: 들판 늑대 전투를 열고, 늑대가 붙을 때까지 턴을 넘긴 뒤 공격하는 순간을 연속 캡처해 한 장의 스트립으로 합친다.
// 사용: (npm run dev 실행 중) node scripts/visual/combat-demo.mjs <out-prefix> [가로x세로 기본 1280x720]
// 만드는 파일: <out-prefix>-adjacent.png (공격 가능 적 표시·예상 피해), <out-prefix>-strip.png (공격 연출 프레임 모음), <out-prefix>-enemy.png (적 차례 배너 장면), <out-prefix>-overlay.png (이동 범위·미리보기)
import { chromium } from "playwright";
import fs from "node:fs";
const [prefix, size = "1280x720"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message));
p.on("console", m => { if (m.type() === "error") errs.push("console " + m.text()); });
const st = () => p.evaluate(() => { const s = window.__hollowCodex__.state(); return { combat: s.combat !== null, units: s.combat?.units.map(u => ({ id: u.id, side: u.side, x: u.pos.x, y: u.pos.y, hp: u.hp, gone: u.gone, acted: u.acted })) ?? [], active: s.combat?.active }; });
const dispatch = (cmd) => p.evaluate((c) => window.__hollowCodex__.dispatch(c), cmd);
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
for (const [k, n] of [["ArrowRight", 6], ["ArrowDown", 1], ["ArrowRight", 2]]) for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(230); }
await p.waitForTimeout(500);
await p.screenshot({ path: `${prefix}-overlay.png` });
let enemyShot = false;
for (let i = 0; i < 8; i++) {
  const s = await st();
  const me = s.units.find(u => u.id === "player");
  const adj = s.units.find(u => u.side === "enemy" && !u.gone && Math.abs(u.x - me.x) + Math.abs(u.y - me.y) === 1);
  if (adj) {
    const dir = adj.x > me.x ? "e" : adj.x < me.x ? "w" : adj.y > me.y ? "s" : "n";
    await p.waitForTimeout(300); await p.screenshot({ path: `${prefix}-adjacent.png` });
    const frames = []; const t0 = Date.now();
    await dispatch({ type: "combat", action: { kind: "attack", dir } });
    while (Date.now() - t0 < 700) { const t = Date.now() - t0; frames.push({ t, buf: await p.screenshot({ clip: { x: Math.round(w * 0.3), y: Math.round(h * 0.04), width: Math.round(w * 0.4), height: Math.round(h * 0.82) }, type: "png" }) }); }
    const pick = frames.filter((_, i) => i % Math.max(1, Math.floor(frames.length / 8)) === 0).slice(0, 8);
    const html = `<body style="margin:0;background:#111;color:#fff;font:12px sans-serif"><div style="display:flex;flex-wrap:wrap;width:${w}px">` + pick.map(f => `<div style="width:${w / 4}px"><img style="width:100%" src="data:image/png;base64,${f.buf.toString("base64")}"><div>${f.t} ms</div></div>`).join("") + "</div>";
    const pg = await b.newPage({ viewport: { width: w, height: Math.round(((h * 0.82) / (w * 0.4)) * (w / 4) * 2 + 70) } }); await pg.setContent(html); await pg.screenshot({ path: `${prefix}-strip.png` }); await pg.close();
    console.log("attack frames", frames.length, "pick", pick.map(f => f.t).join(","));
    break;
  }
  await dispatch({ type: "combat", action: { kind: "endTurn" } });
  if (!enemyShot) { await p.waitForTimeout(150); await p.screenshot({ path: `${prefix}-enemy.png` }); enemyShot = true; }
  await p.waitForTimeout(1100);
}
await b.close();
if (errs.length) { console.error("DEMO ERRORS:\n" + errs.join("\n")); process.exit(1); }
console.log("DEMO OK");
