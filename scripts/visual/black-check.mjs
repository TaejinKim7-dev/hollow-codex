// 모든 지도를 가운데에서 그려 보고 캔버스의 순수 검정(0,0,0) 픽셀 비율을 잰다. 검은 칸·빈 칸(그림 누락) 점검용(개발 서버 필요).
// 사용: node scripts/visual/black-check.mjs [가로x세로 기본 1280x720]
import { chromium } from "playwright";
const [w, h] = (process.argv[2] ?? "1280x720").split("x").map(Number);
const maps = { "map.field": [12, 8], "map.kalas": [16, 13], "map.archive": [5, 7], "map.arena": [5, 4], "map.over": [30, 20], "map.sealed-archive": [5, 5] };
for (const t of ["compassion", "honor", "humility", "justice", "sacrifice", "spirituality", "valor"]) maps[`map.town.${t}`] = [14, 10];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
await p.goto("http://localhost:5173/hollow-codex/?debug=1"); await p.waitForTimeout(1500);
for (const [id, [x, y]] of Object.entries(maps)) {
  await p.evaluate(([m, a, c]) => window.__hollowCodex__.debugTeleport(m, a, c), [id, x, y]); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const cv = document.querySelector("canvas"); const ctx = cv.getContext("2d"); const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 6 && d[i + 1] < 6 && d[i + 2] < 6 && d[i + 3] > 200) n++; return { black: n / (d.length / 4) }; });
  console.log(id.padEnd(26), (r.black * 100).toFixed(2) + "% black");
}
await b.close();
