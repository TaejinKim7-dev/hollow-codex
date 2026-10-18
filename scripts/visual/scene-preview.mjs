// 장면 목업: 꼭짓점 지도(풀 . / 흙길 , / 물 ~)를 두 Wang 타일셋(풀↔흙길, 풀↔물)으로 자동 타일링하고 물건·캐릭터를 올려 PNG로 만든다.
// 땅 층 → 물건 층 → 캐릭터 층 순서로 그린다(0.1.0 검은 사각형 결함의 반대). 페이지 오류·빈 칸이 있으면 실패 (AGENTS.md §9.1).
// 사용: node scripts/visual/scene-preview.mjs <scene.json> <out.png>
// scene.json: { "scale":2, "path":"<dir>", "water":"<dir>", "vertices":["...,,,~~"...], "objects":[{"src":"x.png","x":px,"y":px}], "actors":[{"src":"x.png","tx":7.5,"ty":5.5}] }
// 한 칸의 네 꼭짓점에 흙길과 물이 함께 있으면 그릴 타일셋이 없으므로 실패한다(사이에 풀 한 줄을 둔다).
import { chromium } from "playwright";
import fs from "node:fs";
const [sceneFile, out] = process.argv.slice(2);
if (!out) { console.error("usage: scene-preview.mjs <scene.json> <out.png>"); process.exit(2); }
const sc = JSON.parse(fs.readFileSync(sceneFile, "utf8"));
const u = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
const ts = d => ({ sheet: u(d + "/sheet.png"), tiles: JSON.parse(fs.readFileSync(d + "/metadata.json")).tileset_data.tiles.map(t => ({ c: t.corners, b: t.bounding_box })) });
const data = { scale: sc.scale || 2, path: ts(sc.path), water: ts(sc.water), v: sc.vertices,
  objects: (sc.objects || []).map(o => ({ ...o, src: u(o.src) })), actors: (sc.actors || []).map(a => ({ ...a, src: u(a.src) })) };
const html = `<body style="margin:0;background:#111"><canvas id=c></canvas><script>
const D=${JSON.stringify(data)},T=32,V=D.v,H=V.length-1,W=V[0].length-1;
const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error("image load failed"));i.src=s});
(async()=>{const P=await load(D.path.sheet),Wt=await load(D.water.sheet);
 const c=document.getElementById("c");c.width=W*T;c.height=H*T;c.style.cssText="width:"+W*T*D.scale+"px;height:"+H*T*D.scale+"px;image-rendering:pixelated;display:block";
 const x=c.getContext("2d");x.imageSmoothingEnabled=false;
 for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const k=[V[ty][tx],V[ty][tx+1],V[ty+1][tx],V[ty+1][tx+1]];
  const hasW=k.includes("~"),hasP=k.includes(",");if(hasW&&hasP)throw new Error("cell "+tx+","+ty+" mixes path and water");
  const set=hasW?D.water:D.path,img=hasW?Wt:P,low=hasW?"~":",",m=ch=>ch===low?"lower":"upper";
  const t=set.tiles.find(t=>t.c.NW==m(k[0])&&t.c.NE==m(k[1])&&t.c.SW==m(k[2])&&t.c.SE==m(k[3]));
  if(!t)throw new Error("no wang tile for cell "+tx+","+ty);x.drawImage(img,t.b.x,t.b.y,T,T,tx*T,ty*T,T,T)}
 for(const o of D.objects){const i=await load(o.src);x.drawImage(i,Math.round(o.x),Math.round(o.y))}
 for(const a of D.actors){const i=await load(a.src);x.fillStyle="rgba(0,0,0,.28)";x.beginPath();x.ellipse(a.tx*T,a.ty*T+10,10,4,0,0,7);x.fill();x.drawImage(i,Math.round(a.tx*T-i.width/2),Math.round(a.ty*T-i.height+14))}
 document.body.dataset.done="1"})().catch(e=>{document.body.dataset.err=e.message});
</script>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } }); const errs = [];
p.on("pageerror", e => errs.push(e.message)); await p.setContent(html);
await p.waitForFunction(() => document.body.dataset.done || document.body.dataset.err);
const e = await p.evaluate(() => document.body.dataset.err); if (e) errs.push(e);
await p.locator("#c").screenshot({ path: out }); await b.close();
if (errs.length) { console.error("SCENE FAIL:", errs.join("; ")); process.exit(1); }
console.log("SCENE OK", out);
