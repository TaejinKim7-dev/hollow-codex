// 배경음악 후보 검사: bgm.json의 모든 곡을 <audio> 요소로 불러와 길이가 카탈로그 길이와 맞는지, 재생 가능한지(canplay) 확인한다.
// (긴 곡은 decodeAudioData가 실패할 수 있어 lab 페이지와 같은 <audio> 방식으로 검사한다.)
// 사용: (npm run dev 실행 중) node scripts/visual/bgm-load-check.mjs <bgm.json URL 경로> [url-base]
import { chromium } from "playwright";
const [mpath, base = "http://localhost:5173/hollow-codex/"] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }); const p = await b.newPage(); await p.goto(base + "lab/");
const res = await p.evaluate(async ([base, mpath]) => {
  const list = await (await fetch(base + mpath)).json(); const dir = mpath.replace(/[^/]+$/, ""); const out = [];
  for (const sl of list) for (const it of sl.items) {
    const [h, m, s] = it.length.split(":").map(Number), want = h * 3600 + m * 60 + s;
    const r = await new Promise(ok => { const a = new Audio(base + dir + it.src); a.preload = "auto"; const t = setTimeout(() => ok({ err: "timeout" }), 20000);
      a.oncanplay = () => { clearTimeout(t); ok({ dur: a.duration }); }; a.onerror = () => { clearTimeout(t); ok({ err: "media error " + (a.error && a.error.code) }); }; });
    out.push({ id: sl.id + "-" + it.key, want, ...r }); }
  return out; }, [base, mpath]);
await b.close(); let bad = 0;
for (const r of res) { const why = r.err || (Math.abs(r.dur - r.want) > Math.max(3, r.want * 0.05) ? `length ${r.dur.toFixed(1)}s vs ${r.want}s` : ""); if (why) { bad++; console.log("BAD", r.id, why); } }
console.log(`${res.length} tracks, ${bad} bad`); process.exit(bad ? 1 : 0);
