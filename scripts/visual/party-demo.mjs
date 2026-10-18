// 일행 걷기 데모 녹화: 타일셋 위 십자 길을 이방인이 앞장서고 동료가 몇 걸음 뒤에서 따라간다.
// 사용: node scripts/visual/party-demo.mjs <tileset-dir> <out.webm> <leader-dir> [<follower-dir> ...]
// 각 캐릭터 폴더에는 rot-<dir>.png 와 walk-<dir>/0..3.png 가 있어야 한다.
// 페이지 오류가 있으면 실패. 녹화 뒤 반드시: node scripts/visual/verify-video.mjs <out.webm> --out <폴더> 후 프레임을 열어 본다 (AGENTS.md §9.1).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const [tsDir, out, ...actorDirs] = process.argv.slice(2);
if (!actorDirs.length) { console.error("usage: party-demo.mjs <tileset-dir> <out.webm> <leader-dir> [follower-dir...]"); process.exit(2); }
const u = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
const DIRS = ["south", "east", "north", "west"];
const actors = actorDirs.map(d => ({ walk: Object.fromEntries(DIRS.map(x => [x, [0, 1, 2, 3].map(i => u(`${d}/walk-${x}/${i}.png`))])) }));
const tiles = JSON.parse(fs.readFileSync(tsDir + "/metadata.json")).tileset_data.tiles.map(t => ({ c: t.corners, b: t.bounding_box }));
const html = `<body style="margin:0;background:#111"><canvas id=c width=480 height=352 style="width:960px;height:704px;image-rendering:pixelated;display:block"></canvas><script>
const T=32,W=15,H=11,tiles=${JSON.stringify(tiles)},A=${JSON.stringify(actors)};
const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error("image load failed"));i.src=s});
const path=new Set(),add=(x,y)=>{for(const[a,b]of[[0,0],[1,0],[0,1],[1,1]])path.add((x+a)+","+(y+b))};
for(let x=1;x<=12;x++)add(x,5);for(let y=1;y<=9;y++)add(7,y);
const corner=(x,y)=>path.has(x+","+y)?"lower":"upper";
const route=[[1.5,5.5],[7.5,5.5],[7.5,1.5],[7.5,9.5],[7.5,5.5],[12.5,5.5],[1.5,5.5]];
const segLen=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1])),total=segLen.reduce((a,b)=>a+b);
function at(d){d=((d%total)+total)%total;for(let i=0;i<segLen.length;i++){if(d<=segLen[i]){const a=route[i],b=route[i+1],f=d/segLen[i],dx=b[0]-a[0],dy=b[1]-a[1];
 return {x:a[0]+dx*f,y:a[1]+dy*f,dir:Math.abs(dx)>Math.abs(dy)?(dx>0?"east":"west"):(dy>0?"south":"north")}}d-=segLen[i]}return {x:route[0][0],y:route[0][1],dir:"east"}}
(async()=>{const sheet=await load("${u(tsDir + "/sheet.png")}");
 const imgs=[];for(const a of A){const o={};for(const d in a.walk){o[d]=[];for(const s of a.walk[d])o[d].push(await load(s))}imgs.push(o)}
 const x=document.getElementById("c").getContext("2d");x.imageSmoothingEnabled=false;const t0=performance.now();
 function frame(now){const el=Math.max(0,now-t0)/1000,lead=el*3;
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const t=tiles.find(t=>t.c.NW==corner(tx,ty)&&t.c.NE==corner(tx+1,ty)&&t.c.SW==corner(tx,ty+1)&&t.c.SE==corner(tx+1,ty+1));if(!t)throw new Error("no wang tile");x.drawImage(sheet,t.b.x,t.b.y,T,T,tx*T,ty*T,T,T)}
  const ps=imgs.map((im,k)=>({im,...at(lead-k*1.2)})).sort((a,b)=>a.y-b.y);
  const f=Math.floor(el/0.14)%4;
  for(const p of ps){const fr=p.im[p.dir][f];if(!fr)throw new Error("missing frame "+p.dir+"/"+f);
   x.fillStyle="rgba(0,0,0,.28)";x.beginPath();x.ellipse(p.x*T,p.y*T+10,10,4,0,0,7);x.fill();x.drawImage(fr,Math.round(p.x*T-24),Math.round(p.y*T-38))}
  requestAnimationFrame(frame)}
 requestAnimationFrame(frame)})().catch(e=>{throw e});
</script>`;
const tmp = path.join(path.dirname(out), "party-demo.tmp.html"); fs.writeFileSync(tmp, html);
const b = await chromium.launch(); const vdir = path.join(process.cwd(), "test-results", "party-demo-video");
const ctx = await b.newContext({ viewport: { width: 960, height: 704 }, recordVideo: { dir: vdir, size: { width: 960, height: 704 } } });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("file://" + path.resolve(tmp)); await p.waitForTimeout(16000);
const v = p.video(); await ctx.close(); await v.saveAs(out); await b.close(); fs.unlinkSync(tmp);
if (errs.length) { console.error("DEMO FAIL:", errs.join("; ")); process.exit(1); }
console.log("DEMO OK", out);
