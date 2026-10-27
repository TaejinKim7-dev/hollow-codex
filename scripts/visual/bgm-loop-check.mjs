// 루프 OGG 검사: 디코딩, 길이(≈ MAXLEN-XF), 파일 끝→처음 이음매의 소리 크기 차이·샘플 점프, 전체 음량(피크·RMS)을 확인한다.
// 이음매 검사는 '파일 끝 0.25초'와 '파일 처음 0.25초'의 음량비(5배 초과면 실패)와 끝↔처음 샘플 점프를 본다. 두 구간은 원곡에서 서로 이어진 지점이라 자연스러운 음량 변화(음 시작/감쇠)는 허용한다.
// 사용: (npm run dev 실행 중) node scripts/visual/bgm-loop-check.mjs [url-base]
import { chromium } from "playwright";
import fs from "node:fs";
const base = process.argv[2] || "http://localhost:5173/hollow-codex/";
const files = fs.readdirSync("assets/audio/bgm").filter(f => f.endsWith(".ogg"));
const b = await chromium.launch(); const p = await b.newPage(); await p.goto(base + "lab/");
const res = await p.evaluate(async ([base, files]) => {
  const ctx = new AudioContext(); const out = [];
  for (const f of files) { try {
    const bf = await ctx.decodeAudioData(await (await fetch(base + "assets/audio/bgm/" + f)).arrayBuffer()); const sr = bf.sampleRate, n = bf.length, ch = bf.getChannelData(0), w = Math.floor(sr * 0.25);
    const rms = (a, b2) => { let s = 0; for (let i = a; i < b2; i++) s += ch[i] * ch[i]; return Math.sqrt(s / (b2 - a)); };
    let pk = 0; for (let i = 0; i < n; i += 5) pk = Math.max(pk, Math.abs(ch[i]));
    out.push({ f, dur: +bf.duration.toFixed(1), peak: +pk.toFixed(2), rms: +rms(0, n).toFixed(3), endRms: +rms(n - w, n).toFixed(3), startRms: +rms(0, w).toFixed(3), jump: +Math.abs(ch[n - 1] - ch[0]).toFixed(3) });
  } catch (e) { out.push({ f, err: e.message }); } }
  return out; }, [base, files]);
await b.close(); let bad = 0;
for (const r of res) { const why = r.err || (r.dur < 90 || r.dur > 112 ? "length " + r.dur : r.peak > 0.99 ? "clipping" : r.rms < 0.03 ? "too quiet" : (Math.max(r.endRms, r.startRms) / Math.max(0.005, Math.min(r.endRms, r.startRms)) > 5) ? `seam level ${r.endRms} vs ${r.startRms}` : r.jump > 0.3 ? "seam sample jump " + r.jump : ""); if (why) { bad++; console.log("BAD", r.f, why); } }
console.log(`${res.length} files, ${bad} bad`); for (const r of res) console.log(JSON.stringify(r)); process.exit(bad ? 1 : 0);
