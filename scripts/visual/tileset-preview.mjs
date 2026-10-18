// 타일셋 비교 미리보기: 같은 지도(십자 길 + 작은 풀섬)를 각 타일셋으로 자동 타일링하고 이방인 B를 세워 PNG 한 장으로 만든다.
// 사용: node scripts/visual/tileset-preview.mjs <out.png> <tileset-dir> [<tileset-dir> ...]
// 페이지 오류가 있으면 실패한다 (AGENTS.md §9.1). 결과 PNG는 반드시 열어 본다.
import { chromium } from "playwright";
import fs from "node:fs";
const [out, ...dirs] = process.argv.slice(2);
if (!out || !dirs.length) { console.error("usage: tileset-preview.mjs <out.png> <dir>..."); process.exit(2); }
const u = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
const sets = dirs.map(d => ({ name: d.split("/").pop(), sheet: u(d + "/sheet.png"), tiles: JSON.parse(fs.readFileSync(d + "/metadata.json")).tileset_data.tiles.map(t => ({ c: t.corners, b: t.bounding_box })) }));
const hero = u(process.cwd() + "/assets/sprites/characters/stranger-B/rot-south.png");
const html = `<body style="margin:0;background:#1e1e1e;color:#ddd;font:14px sans-serif"><div id=w style="display:flex;flex-wrap:wrap;gap:12px;padding:12px"></div><script>
const S=${JSON.stringify(sets)},H=new Image();H.src="${hero}";
const W=15,Hh=11,T=32,path=new Set(),add=(x,y)=>{for(const[a,b]of[[0,0],[1,0],[0,1],[1,1]])path.add((x+a)+","+(y+b))};
for(let x=1;x<=12;x++)add(x,5);for(let y=1;y<=9;y++)add(7,y);for(let x=2;x<=4;x++)for(let y=1;y<=3;y++)add(x,y);path.delete("3,2");
const corner=(x,y)=>path.has(x+","+y)?"lower":"upper";
(async()=>{await H.decode();for(const s of S){const im=new Image();im.src=s.sheet;await im.decode();
 const box=document.createElement("div");box.innerHTML="<div>"+s.name+"</div>";const c=document.createElement("canvas");c.width=W*T;c.height=Hh*T;c.style.cssText="width:"+W*T*2+"px;height:"+Hh*T*2+"px;image-rendering:pixelated";box.appendChild(c);document.getElementById("w").appendChild(box);
 const x=c.getContext("2d");x.imageSmoothingEnabled=false;let miss=0;
 for(let ty=0;ty<Hh;ty++)for(let tx=0;tx<W;tx++){const t=s.tiles.find(t=>t.c.NW==corner(tx,ty)&&t.c.NE==corner(tx+1,ty)&&t.c.SW==corner(tx,ty+1)&&t.c.SE==corner(tx+1,ty+1));if(!t){miss++;x.fillStyle="#f0f";x.fillRect(tx*T,ty*T,T,T);continue}x.drawImage(im,t.b.x,t.b.y,T,T,tx*T,ty*T,T,T)}
 if(miss)throw new Error(s.name+": "+miss+" cells had no matching wang tile");
 x.fillStyle="rgba(0,0,0,.25)";x.beginPath();x.ellipse(7.5*T,5.5*T+10,10,4,0,0,7);x.fill();x.drawImage(H,7.5*T-24,5.5*T-40);}
 document.body.dataset.done="1"})().catch(e=>{document.body.dataset.err=e.message});
</script>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000 * Math.min(2, sets.length), height: 800 } });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.setContent(html); await p.waitForFunction(() => document.body.dataset.done || document.body.dataset.err);
const err = await p.evaluate(() => document.body.dataset.err); if (err) errs.push(err);
await p.screenshot({ path: out, fullPage: true }); await b.close();
if (errs.length) { console.error("PREVIEW FAIL:", errs.join("; ")); process.exit(1); }
console.log("PREVIEW OK", out);
