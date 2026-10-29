// 병과 확인: ?debug=1 로 궁수 동료를 파티에 넣고 연습장 "궁수" 조우를 열어, 사거리 블록(주황)·병과 HUD와 쏘는 연출을 캡처한다(개발 서버 필요).
// 사용: node scripts/visual/class-shot.mjs <out-prefix>      → <prefix>-range.png, <prefix>-arrow.png
import { chromium } from "playwright";
const out = process.argv[2] ?? "class";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
await p.evaluate(() => window.__hollowCodex__.debugJoin(["npc.spirituality.novice", "npc.arena.trainer"]));
await p.evaluate(() => window.__hollowCodex__.debugTeleport("map.arena", 7, 3));
await p.waitForTimeout(400);
await p.keyboard.press("ArrowUp"); await p.waitForTimeout(1200);          // (7,2) 궁수 조우
const st = () => p.evaluate(() => window.__hollowCodex__.state().combat?.units.map(u => ({ id: u.id, side: u.side, c: u.class, x: u.pos.x, y: u.pos.y, hp: u.hp, active: u.id === window.__hollowCodex__.state().combat.active })));
console.log(JSON.stringify(await st()));
await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "endTurn" } })); await p.waitForTimeout(300);   // 다음 동료(궁수)가 활성
await p.screenshot({ path: `${out}-range.png` });
await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "endTurn" } })); await p.waitForTimeout(100);
await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "endTurn" } }));   // 적 차례: 적 궁수가 쏜다
for (let i = 0; i < 14; i++) { await p.waitForTimeout(110); await p.screenshot({ path: `${out}-enemy-${String(i).padStart(2, "0")}.png` }); }
console.log(errs.length ? "ERRORS " + errs.join("|") : "SHOT OK");
await b.close();
