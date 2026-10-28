// 한 바퀴 돌며 화면을 캡처한다: 들판 → 다리 위 전투 → 도망 → (?debug=1 이동 훅으로) 칼라스 마을 → 마을 걷기. 페이지 오류를 보고한다 (AGENTS.md §9.1).
// 사용: (npm run dev 실행 중) node scripts/visual/game-tour.mjs <out-prefix> [가로x세로 기본 1280x720]
import { chromium } from "playwright";
const [prefix, size = "1280x720"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message));
p.on("response", r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url()}`); });
p.on("console", m => { if (m.type() === "error") errs.push("console " + m.text()); });
const press = async (k, n = 1, ms = 230) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(ms); } };
const st = () => p.evaluate(() => { const s = window.__hollowCodex__.state(); return { map: s.mapId, x: s.player.pos.x, y: s.player.pos.y, combat: s.combat !== null }; });
const shot = async (name) => { await p.waitForTimeout(450); await p.screenshot({ path: `${prefix}-${name}.png` }); console.log(name, JSON.stringify(await st())); };
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
await press("ArrowRight", 6); await press("ArrowDown"); await press("ArrowRight", 2);
await shot("combat");
for (let i = 0; i < 6 && (await st()).combat; i++) { await p.evaluate(() => window.__hollowCodex__.dispatch({ type: "combat", action: { kind: "flee" } })); await p.waitForTimeout(400); }
await shot("after-flee");
await p.evaluate(() => window.__hollowCodex__.debugTeleport("map.kalas", 1, 12)); await p.waitForTimeout(800);
await shot("kalas-arrive");
await press("ArrowRight", 8); await press("ArrowUp", 4); await shot("kalas-walk");
await b.close();
if (errs.length) { console.error("TOUR ERRORS:\n" + errs.join("\n")); process.exit(1); }
console.log("TOUR OK");
