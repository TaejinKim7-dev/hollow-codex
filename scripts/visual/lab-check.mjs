// 자산 실험실(lab/) 동작 검사: 개발 서버의 lab 페이지를 열어 시작 → 오른쪽으로 걷기 → 물에 부딪히기를 하고,
// 페이지 오류·요청 실패·화면 오류 표시가 없는지, 캐릭터가 실제로 움직였는지 확인하고 스크린샷 2장을 남긴다 (AGENTS.md §9.1).
// 사용: (npm run dev 실행 중) node scripts/visual/lab-check.mjs <out-prefix> [url]
import { chromium } from "playwright";
const [prefix, url = "http://localhost:5173/hollow-codex/lab/"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message));
p.on("response", r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url()}`); });
await p.goto(url); await p.click("#startBtn"); await p.waitForTimeout(800);
const pos0 = await p.textContent("#pos");
await p.screenshot({ path: prefix + "-start.png" });
await p.keyboard.down("ArrowRight"); await p.waitForTimeout(1600); await p.keyboard.up("ArrowRight"); await p.waitForTimeout(400);
const pos1 = await p.textContent("#pos");
await p.screenshot({ path: prefix + "-walked.png" });
const shown = (await p.textContent("#err")).trim(); if (shown) errs.push("화면 오류: " + shown);
const sfxButtons = await p.locator("#sfx button").count();
await b.close();
console.log(JSON.stringify({ pos0, pos1, sfxButtons }));
if (pos0 === pos1) errs.push("캐릭터가 움직이지 않음");
if (!sfxButtons) errs.push("효과음 버튼 없음");
if (errs.length) { console.error("LAB FAIL:\n" + errs.join("\n")); process.exit(1); }
console.log("LAB OK");
