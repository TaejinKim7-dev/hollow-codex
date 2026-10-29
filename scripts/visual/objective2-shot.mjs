// 호위·증원 확인: 연습장 호위 조우의 목표 칸·호위 대상·HUD, 매복 조우의 증원 알림을 캡처한다(개발 서버 필요).
// 사용: node scripts/visual/objective2-shot.mjs <out-prefix>   → <prefix>-escort.png, <prefix>-ambush.png
import { chromium } from "playwright";
const out = process.argv[2] ?? "obj2";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
const go = async (x, y, key) => { await p.evaluate(([a, c]) => window.__hollowCodex__.debugTeleport("map.arena", a, c), [x, y]); await p.waitForTimeout(300); await p.keyboard.press(key); await p.waitForTimeout(1000); };
await go(11, 3, "ArrowUp");                                          // (11,2) 호위
await p.screenshot({ path: `${out}-escort.png` });
console.log(JSON.stringify(await p.evaluate(() => window.__hollowCodex__.state().combat.units.map(u => `${u.id}@${u.pos.x},${u.pos.y}`))));
await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "flee" } })); await p.waitForTimeout(500);
await go(11, 5, "ArrowDown");                                        // (11,6) 매복
for (let r = 0; r < 2; r++) { await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "endTurn" } })); await p.waitForTimeout(r === 1 ? 900 : 2200); }   // 한 명뿐이라 라운드마다 한 번
await p.screenshot({ path: `${out}-ambush.png` });
console.log(JSON.stringify(await p.evaluate(() => window.__hollowCodex__.state().combat?.units.map(u => `${u.id}@${u.pos.x},${u.pos.y}`))));
console.log(errs.length ? "ERRORS " + errs.join("|") : "SHOT OK");
await b.close();
