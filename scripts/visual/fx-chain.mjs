// 연계 연출 확인: 연습장에서 훈련 교관을 동료로 받고 섞인 무리 전투(9×9)에 들어가, 교관이 적 옆에 있을 때 공격하는 연속 프레임을 한 장으로 합친다(개발 서버 필요).
// 사용: node scripts/visual/fx-chain.mjs <out.png>
import { chromium } from "playwright";
const out = process.argv[2] ?? "fx-chain.png";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:5173/hollow-codex/"); await p.waitForTimeout(1500);
const dispatch = (c) => p.evaluate((x) => window.__hollowCodex__.dispatch(x), c);
const key = async (k, n) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(230); } };
await key("ArrowRight", 2);                                   // 연습장 입장 (1,4)
await dispatch({ type: "interact", at: { x: 2, y: 4 } }); await dispatch({ type: "recruit", npcId: "npc.arena.trainer" }); await dispatch({ type: "endTalk" });
const party = await p.evaluate(() => window.__hollowCodex__.state().party);
console.log("party", JSON.stringify(party));
await key("ArrowDown", 1); await key("ArrowRight", 8); await key("ArrowUp", 1); await p.waitForTimeout(800);
const st = () => p.evaluate(() => { const s = window.__hollowCodex__.state(); return s.combat === null ? null : { active: s.combat.active, units: s.combat.units.map(u => ({ id: u.id, side: u.side, x: u.pos.x, y: u.pos.y, gone: u.gone, acted: u.acted, hp: u.hp })) }; });
let s = await st(); if (s === null) { console.log("combat did not start"); await b.close(); process.exit(1); }
const adj = (a, c) => Math.abs(a.x - c.x) + Math.abs(a.y - c.y) === 1;
for (let g = 0; g < 40; g++) {
  s = await st(); if (s === null) break;
  if (process.env.DEBUG) console.log("loop", g, s.active, JSON.stringify(s.units.map((u) => `${u.id.slice(-8)}@${u.x},${u.y}${u.gone ? "x" : ""}:${u.hp}`)));
  const me = s.units.find((u) => u.id === s.active), foes = s.units.filter((u) => u.side === "enemy" && !u.gone);
  const mates = s.units.filter((u) => u.side === "ally" && !u.gone && u.id !== me.id);
  const target = foes.find((f) => adj(me, f));
  if (target && mates.some((m) => adj(m, target))) {
    const dir = target.x > me.x ? "e" : target.x < me.x ? "w" : target.y > me.y ? "s" : "n";
    const clip = { x: 340, y: 100, width: 600, height: 460 }; const frames = []; const t0 = Date.now();
    await dispatch({ type: "combat", action: { kind: "attack", dir } });
    while (Date.now() - t0 < 800) frames.push({ t: Date.now() - t0, buf: await p.screenshot({ clip, type: "jpeg", quality: 70 }) });
    const pick = frames.filter((_, i) => i % Math.max(1, Math.floor(frames.length / 10)) === 0).slice(0, 10);
    const html = `<body style="margin:0;background:#111;color:#fff;font:14px sans-serif"><div style="display:flex;flex-wrap:wrap;width:2600px">` + pick.map((f) => `<div style="width:500px;margin:4px"><img width=500 src="data:image/jpeg;base64,${f.buf.toString("base64")}"><div>t=${f.t}ms</div></div>`).join("") + `</div>`;
    const pg = await b.newPage({ viewport: { width: 2620, height: 900 } }); await pg.setContent(html); await pg.screenshot({ path: out });
    console.log(`chain strip: ${frames.length} frames → ${out}`, errs.length ? "ERRORS " + errs.join("|") : ""); await b.close(); process.exit(0);
  }
  if (target) { const dir = target.x > me.x ? "e" : target.x < me.x ? "w" : target.y > me.y ? "s" : "n"; await dispatch({ type: "combat", action: { kind: "attack", dir } }); }
  else {
    const flanked = foes.filter((f) => mates.some((m) => adj(m, f)))
    const goal = (flanked.length ? flanked : foes).reduce((best, f) => (best === null || Math.abs(f.x - me.x) + Math.abs(f.y - me.y) < Math.abs(best.x - me.x) + Math.abs(best.y - me.y) ? f : best), null);
    const occupiedBy = (x, y) => s.units.some((u) => !u.gone && u.x === x && u.y === y);
    const cands = [[0, -1], [1, 0], [-1, 0], [0, 1]].map(([dx, dy]) => ({ x: goal.x + dx, y: goal.y + dy })).filter((c) => !occupiedBy(c.x, c.y) && c.x >= 0 && c.y >= 0 && c.x < 9 && c.y < 9);
    const near = cands.sort((a, c) => (Math.abs(a.x - me.x) + Math.abs(a.y - me.y)) - (Math.abs(c.x - me.x) + Math.abs(c.y - me.y)))[0];
    if (near && Math.abs(near.x - me.x) + Math.abs(near.y - me.y) <= 3) await dispatch({ type: "combat", action: { kind: "move", to: near } });
    await dispatch({ type: "combat", action: { kind: "endTurn" } });
  }
  await p.waitForTimeout(1600);
}
console.log("no chain situation reached"); await b.close(); process.exit(1);
