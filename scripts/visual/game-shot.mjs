// 실제 게임 화면 캡처: 개발 서버의 게임을 열고 (선택) 키를 눌러 걸은 뒤 스크린샷을 남긴다. 페이지 오류·요청 실패를 보고한다 (AGENTS.md §9.1).
// 사용: (npm run dev 실행 중) node scripts/visual/game-shot.mjs <out.png> [키목록 예: ArrowRight*5,ArrowDown*2] [가로x세로 기본 1280x720]
import { chromium } from "playwright";
const [out, keys = "", size = "1280x720"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message));
p.on("response", r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url()}`); });
p.on("console", m => { if (m.type() === "error") errs.push("console " + m.text()); });
await p.goto("http://localhost:5173/hollow-codex/"); await p.waitForTimeout(1500);
for (const part of keys.split(",").filter(Boolean)) {
  const [k, n = "1"] = part.split("*");
  for (let i = 0; i < Number(n); i++) { await p.keyboard.press(k); await p.waitForTimeout(220); }
}
await p.waitForTimeout(500);
await p.screenshot({ path: out });
await b.close();
if (errs.length) { console.error("SHOT ERRORS:\n" + errs.join("\n")); process.exit(1); }
console.log("SHOT OK " + out);
