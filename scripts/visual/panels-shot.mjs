// 수첩·고리·경전·메뉴 패널을 모든 단서·능력을 푼 상태로 열어 캡처한다(개발 서버 필요, ?debug=1).
// 사용: node scripts/visual/panels-shot.mjs <out-prefix> [가로x세로 기본 1280x800]
import { chromium } from "playwright";
const [prefix = "panels", size = "1280x800"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
await p.evaluate(() => { window.__hollowCodex__.debugGrantFacts(["*"]); window.__hollowCodex__.debugGrantAbilities(["*"]); }); await p.waitForTimeout(500);
const ids = await p.evaluate(() => window.__hollowCodex__.state().facts.length);
for (const [label, name] of [["수첩", "notebook"], ["고리", "rings"], ["메뉴", "menu"]]) {
  await p.getByRole("button", { name: label }).first().click(); await p.waitForTimeout(700);
  await p.screenshot({ path: `${prefix}-${name}.png` });
  const close = p.getByRole("button", { name: /닫기|Close/ }).first(); if (await close.count()) await close.click(); await p.waitForTimeout(300);
}
console.log(errs.length ? "ERRORS " + errs.join("|") : `SHOT OK ${prefix}-*.png (start facts ${ids})`); await b.close();
