// 지도 한 장 캡처: ?debug=1 이동 훅으로 지정한 지도·칸에 서서 스크린샷을 남긴다(개발 서버 필요).
// 사용: node scripts/visual/map-shot.mjs <out.png> <mapId> <x> <y> [가로x세로 기본 1600x900]
import { chromium } from "playwright";
const [out, map, x, y, size = "1600x900"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
const base = process.env.HC_BASE_URL ?? "http://localhost:5173/hollow-codex/";
await p.goto(base + "?debug=1"); await p.waitForTimeout(1500);
await p.evaluate(([m, a, c]) => window.__hollowCodex__.debugTeleport(m, a, c), [map, +x, +y]); await p.waitForTimeout(1500);
await p.screenshot({ path: out });
console.log(errs.length ? "ERRORS " + errs.join("|") : "SHOT OK " + out); await b.close();
