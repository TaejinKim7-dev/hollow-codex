// 휴대폰 세로 화면에서 연습장 9×9 전투(섞인 무리)가 한 화면에 들어오는지 캡처한다(개발 서버 필요).
// 사용: node scripts/visual/arena-phone.mjs <out.png> [가로x세로 기본 390x844] [배율 기본 3]
import { chromium } from "playwright";
const [out = "arena-phone.png", size = "390x844", dpr = "3"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(dpr) });
await p.goto("http://localhost:5173/hollow-codex/"); await p.waitForTimeout(1500);
const key = async (k, n) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(230); } };
await key("ArrowRight", 2); await key("ArrowUp", 1); await key("ArrowRight", 8); await p.waitForTimeout(300); await key("ArrowDown", 1); await p.waitForTimeout(3000);
const inCombat = await p.evaluate(() => window.__hollowCodex__.state().combat !== null);
await p.screenshot({ path: out }); console.log(inCombat ? "SHOT OK " + out : "no combat (position?)"); await b.close();
