// 생성 스프라이트 걷기 데모: 타일셋 자동 타일 + 캐릭터 4방향 걷기를 녹화한다. 녹화 뒤 반드시 verify-video.mjs로 검사한다 (AGENTS.md §9).
import { chromium } from "playwright";
import fs from "node:fs";
const R=process.cwd()+"/assets/sprites";
const b64=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
const meta=JSON.parse(fs.readFileSync(R+"/tilesets/grass-path/metadata.json"));
const tiles=meta.tileset_data.tiles.map(t=>({c:t.corners,b:t.bounding_box}));
const frames={};
for(const d of["south","east","north","west"]){frames[d]=[0,1,2,3].map(i=>b64(`${R}/characters/stranger-B/walk-${d}/${i}.png`));}
const idle={};for(const d of["south","east","north","west"])idle[d]=b64(`${R}/characters/stranger-B/rot-${d}.png`);
const html=`<body style="margin:0;background:#222"><canvas id=c width=480 height=352 style="width:960px;height:704px;image-rendering:pixelated"></canvas><script>
const W=15,H=11,T=32,tiles=${JSON.stringify(tiles)},sheet=new Image(),F=${JSON.stringify(frames)},I=${JSON.stringify(idle)};
sheet.src="${b64(R+"/tilesets/grass-path/sheet.png")}";
const load=s=>{const i=new Image();i.src=s;return i};
const FI={},II={};for(const d in F){FI[d]=F[d].map(load);II[d]=load(I[d])}
// vertex grid (W+1 x H+1): 1=dirt path (lower), 0=grass (upper)
const path=new Set();const add=(x,y)=>{for(const[dx,dy]of[[0,0],[1,0],[0,1],[1,1]])path.add((x+dx)+","+(y+dy))};
for(let x=1;x<=12;x++)add(x,5);for(let y=1;y<=9;y++)add(7,y);
const corner=(x,y)=>path.has(x+","+y)?"lower":"upper";
const pick=(x,y)=>tiles.find(t=>t.c.NW==corner(x,y)&&t.c.NE==corner(x+1,y)&&t.c.SW==corner(x,y+1)&&t.c.SE==corner(x+1,y+1));
const cx=document.getElementById("c").getContext("2d");cx.imageSmoothingEnabled=false;
// route: (1,5)->(7,5)->(7,1)->(7,9)->(12,5)... simple loop along path, in tile units
const route=[[1.5,5],[7.5,5],[7.5,1],[7.5,9],[7.5,5],[12.5,5]];
let seg=0,pos={x:route[0][0],y:route[0][1]},dir="east",t0=performance.now();
function frame(now){
 const sp=3*T/1000*(now-(frame.l||now));frame.l=now;
 const tg=route[seg+1];let dx=tg[0]-pos.x,dy=tg[1]-pos.y,dist=Math.hypot(dx,dy),step=sp/T;
 if(dist<=step){pos={x:tg[0],y:tg[1]};seg=(seg+1)%(route.length-1);if(seg==0)pos={x:route[0][0],y:route[0][1]};}
 else{pos.x+=dx/dist*step;pos.y+=dy/dist*step;dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"east":"west"):(dy>0?"south":"north");}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=pick(x,y);if(t)cx.drawImage(sheet,t.b.x,t.b.y,32,32,x*T,y*T,32,32);}
 const moving=true,f=Math.floor(Math.max(0,now-t0)/140)%4;const im=moving?FI[dir][f]:II[dir];
 cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(pos.x*T,pos.y*T+10,10,4,0,0,7);cx.fill();
 cx.drawImage(im,Math.round(pos.x*T-24),Math.round(pos.y*T-40));
 requestAnimationFrame(frame)}
requestAnimationFrame(frame);
</script>`;
fs.writeFileSync(process.cwd()+"/docs/screenshots/2026-10-18-R1-walk-demo.html",html);
const br=await chromium.launch();
const ctx=await br.newContext({viewport:{width:960,height:704},recordVideo:{dir:process.cwd()+"/test-results/walk-demo-video",size:{width:960,height:704}}});
const p=await ctx.newPage();p.on("pageerror",e=>{console.error("PAGEERROR",e.message);process.exitCode=1});await p.goto("file://"+process.cwd()+"/docs/screenshots/2026-10-18-R1-walk-demo.html");
await p.waitForTimeout(1500);await p.screenshot({path:process.cwd()+"/docs/screenshots/2026-10-18-R1-walk-demo-a.png"});
await p.waitForTimeout(6000);await p.screenshot({path:process.cwd()+"/docs/screenshots/2026-10-18-R1-walk-demo-b.png"});
await p.waitForTimeout(5000);
const v=p.video();await ctx.close();await v.saveAs(process.cwd()+"/docs/screenshots/2026-10-18-R1-walk-demo.webm");await br.close();
