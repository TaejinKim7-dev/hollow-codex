// 소리 파일 검사: manifest의 모든 파일을 브라우저로 내려받아 디코딩하고 길이·무음 여부를 확인한다 (AGENTS.md §9.1: 들을 수 없을 때 할 수 있는 최소 확인).
// 사용: (npm run dev 실행 중) node scripts/visual/audio-decode-check.mjs <manifest URL 경로> [url-base]  (효과음 manifest.json용. 긴 배경음악은 bgm-load-check.mjs)
// 실패: 내려받기 실패, 디코딩 실패, 길이가 manifest와 20% 넘게 다름, 거의 무음(최대 진폭 < 0.02)
import { chromium } from "playwright";
const [mpath, base = "http://localhost:5173/hollow-codex/"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage(); await p.goto(base + "lab/");
const res = await p.evaluate(async ([base, mpath]) => {
  let man = await (await fetch(base + mpath)).json(); const dir = mpath.replace(/manifest\.json$/, ""); const ctx = new AudioContext(); const out = [];
  for (const [id, m] of Object.entries(man)) {
    try { const r = await fetch(base + dir + m.file); if (!r.ok) throw new Error("HTTP " + r.status); const bf = await ctx.decodeAudioData(await r.arrayBuffer());
      let mx = 0; for (let c = 0; c < bf.numberOfChannels; c++) { const d = bf.getChannelData(c); for (let i = 0; i < d.length; i += 7) mx = Math.max(mx, Math.abs(d[i])); }
      out.push({ id, dur: +bf.duration.toFixed(2), want: m.duration_s, peak: +mx.toFixed(3) });
    } catch (e) { out.push({ id, err: e.message }); } }
  return out; }, [base, mpath]);
await b.close(); let bad = 0;
for (const r of res) { const why = r.err || (Math.abs(r.dur - r.want) > Math.max(0.5, r.want * 0.2) ? `length ${r.dur}s vs ${r.want}s` : r.peak < 0.02 ? "near silent" : ""); if (why) { bad++; console.log("BAD", r.id, why); } }
console.log(`${res.length} files, ${bad} bad`); console.log(res.map(r => `${r.id}:${r.dur}s/${r.peak}`).join("  ")); process.exit(bad ? 1 : 0);
