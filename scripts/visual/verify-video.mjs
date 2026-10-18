// 최종 영상 파일 자체를 재생해 프레임을 뽑아 검사한다 (AGENTS.md §9).
// 사용: node scripts/visual/verify-video.mjs <video.webm> [--skin r,g,b-범위 대신 기본 피부색] [--out <폴더>]
// 실패 조건: 표본 프레임 중 하나라도 캐릭터 픽셀(피부색)이 없음, 또는 모든 프레임이 같음(애니메이션 멈춤).
// --out 을 주면 표본 프레임 PNG를 저장한다 → 에이전트가 반드시 열어 본다.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
const file = args[0];
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
if (!file) { console.error("usage: verify-video.mjs <video> [--out dir]"); process.exit(2); }
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 960 } });
await p.setContent(`<body style=margin:0><video id=v muted src="data:video/webm;base64,${fs.readFileSync(file).toString("base64")}"></video><canvas id=c></canvas>`);
const dur = await p.evaluate(async () => { const v = document.getElementById("v"); await new Promise(r => v.readyState >= 1 ? r() : v.onloadedmetadata = r); return isFinite(v.duration) ? v.duration : 0; });
if (!dur) { console.error("VERIFY FAIL: duration unknown"); process.exit(1); }
const times = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(f => +(dur * f).toFixed(2));
const frames = [];
for (const t of times) {
  const r = await p.evaluate(async t => {
    const v = document.getElementById("v"); v.currentTime = t; await new Promise(r => v.onseeked = r);
    const c = document.getElementById("c"); c.width = v.videoWidth; c.height = v.videoHeight;
    const x = c.getContext("2d"); x.drawImage(v, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
    let skin = 0, h = 0; for (let i = 0; i < d.length; i += 4) { const [R, G, B] = [d[i], d[i + 1], d[i + 2]]; if (R > 200 && G > 140 && G < 200 && B > 110 && B < 170) skin++; if (i % 3989 === 0) h = (h * 31 + R + G * 7 + B * 13) % 1e9; }
    return { skin, h, png: c.toDataURL("image/png") };
  }, t);
  if (outDir) { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, `frame-${t}s.png`), Buffer.from(r.png.split(",")[1], "base64")); }
  frames.push({ t, skin: r.skin, h: r.h });
}
await b.close();
console.log(JSON.stringify({ dur, frames }));
const missing = frames.filter(f => f.skin < 20).map(f => f.t);
const frozen = new Set(frames.map(f => f.h)).size === 1;
if (missing.length || frozen) { console.error(`VERIFY FAIL: ${missing.length ? "no character at " + missing.join(",") + "s " : ""}${frozen ? "all frames identical" : ""}`); process.exit(1); }
console.log("VERIFY OK");
