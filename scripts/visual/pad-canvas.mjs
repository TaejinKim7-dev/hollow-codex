// 작은 캔버스(예: 아이 40×40)를 표준 48×48 캔버스로 옮긴다: 가로는 가운데, 세로는 발 끝(불투명 픽셀 맨 아래)을 footY 행에 맞춘다.
// 같은 캐릭터의 모든 방향이 같은 이동량을 쓰도록, 첫 파일에서 구한 이동량을 모든 파일에 적용한다.
// 사용: node scripts/visual/pad-canvas.mjs <size> <footY> <in.png> [<in.png> ...]   (제자리 덮어쓰기)
// 어른(이방인 B) 기준: 48×48에서 발 끝 행 = 41. 이동 뒤 그림이 캔버스를 벗어나면 실패한다.
import { chromium } from "playwright";
import fs from "node:fs";
const [size, footY, ...files] = process.argv.slice(2); const N = +size, FY = +footY;
if (!files.length) { console.error("usage: pad-canvas.mjs <size> <footY> <in.png>..."); process.exit(2); }
const b = await chromium.launch(); const p = await b.newPage();
const load = f => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const bottom = async f => p.evaluate(async d => { const i = new Image(); i.src = d; await i.decode(); const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const x = c.getContext("2d"); x.drawImage(i, 0, 0); const a = x.getImageData(0, 0, c.width, c.height).data; let m = -1; for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (a[(y * c.width + xx) * 4 + 3]) m = y; return { w: i.width, h: i.height, m }; }, load(f));
const first = await bottom(files[0]); const dy = FY - first.m, dx = Math.floor((N - first.w) / 2);
for (const f of files) {
  const r = await p.evaluate(async ([d, N, dx, dy]) => { const i = new Image(); i.src = d; await i.decode(); const c = document.createElement("canvas"); c.width = N; c.height = N; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(i, dx, dy);
    const a = x.getImageData(0, 0, N, N).data; let n = 0; for (let k = 3; k < a.length; k += 4) if (a[k]) n++; return { n, png: c.toDataURL("image/png").split(",")[1] }; }, [load(f), N, dx, dy]);
  const src = await p.evaluate(async d => { const i = new Image(); i.src = d; await i.decode(); const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const x = c.getContext("2d"); x.drawImage(i, 0, 0); const a = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < a.length; k += 4) if (a[k]) n++; return n; }, load(f));
  if (r.n !== src) { console.error(f, "pixels cut off by the move", src, "→", r.n); process.exit(1); }
  fs.writeFileSync(f, Buffer.from(r.png, "base64"));
}
await b.close(); console.log(`pad: ${files.length} files → ${N}×${N}, shift dx=${dx} dy=${dy}`);
