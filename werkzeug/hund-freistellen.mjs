import fs from "node:fs";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const A = Object.fromEntries(process.argv.slice(2).map(s => s.split("=")));
const X0 = +(A.x0 ?? 660), Y0 = +(A.y0 ?? 500), X1 = +(A.x1 ?? 900), Y1 = +(A.y1 ?? 935);
const T_WARM = +(A.warm ?? 16), T_HELL = +(A.hell ?? 40), WEICH = +(A.weich ?? 2);

const q = jpeg.decode(fs.readFileSync("/Users/schadwell/Claude/scarnet.de/Welcome.jpg"), {useTArray:true});
const B = X1 - X0, H = Y1 - Y0;
const px = new Uint8Array(B*H*4);
const a = new Float32Array(B*H);

for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) {
  const i = ((y+Y0)*q.width + (x+X0)) * 4, j = y*B + x;
  const r = q.data[i], g = q.data[i+1], b = q.data[i+2];
  px[j*4] = r; px[j*4+1] = g; px[j*4+2] = b;
  const lum = .299*r + .587*g + .114*b;
  a[j] = (r - b > T_WARM && lum > T_HELL) ? 1 : 0;
}

// Morphologisch schliessen: erst dicker, dann wieder duenner — fuellt Loecher
const nachbar = (src, r, art) => {
  const out = new Float32Array(src.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) {
    let v = art === "max" ? 0 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const yy = y+dy, xx = x+dx;
      const s = (yy<0||xx<0||yy>=H||xx>=B) ? 0 : src[yy*B+xx];
      v = art === "max" ? Math.max(v,s) : Math.min(v,s);
    }
    out[y*B+x] = v;
  }
  return out;
};
let m = nachbar(nachbar(a, 4, "max"), 4, "min");

// Groesste zusammenhaengende Flaeche behalten — Kabelreste fliegen raus
const marke = new Int32Array(B*H).fill(-1);
let beste = -1, besteN = 0, id = 0;
for (let s = 0; s < B*H; s++) {
  if (m[s] < .5 || marke[s] >= 0) continue;
  const stapel = [s]; marke[s] = id; let n = 0;
  while (stapel.length) {
    const p = stapel.pop(); n++;
    const y = (p/B)|0, x = p%B;
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const xx=x+dx, yy=y+dy;
      if (xx<0||yy<0||xx>=B||yy>=H) continue;
      const t = yy*B+xx;
      if (m[t] >= .5 && marke[t] < 0) { marke[t] = id; stapel.push(t); }
    }
  }
  if (n > besteN) { besteN = n; beste = id; }
  id++;
}
for (let s = 0; s < B*H; s++) m[s] = marke[s] === beste ? 1 : 0;

// Kalte, dunkle Stellen innerhalb der Maske sind kein Hund, sondern der
// Gitterrost, der zwischen den Laeufen durchscheint. Raus damit.
for (let s = 0; s < B*H; s++) {
  if (m[s] < .5) continue;
  const r = px[s*4], g = px[s*4+1], b = px[s*4+2];
  const lum = .299*r + .587*g + .114*b;
  if (b >= r - 2 && lum < 96) m[s] = 0;
}
m = nachbar(nachbar(m, 2, "max"), 2, "min");

// Kante weich machen
for (let d = 0; d < WEICH; d++) {
  const o = new Float32Array(m.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) {
    let sum = 0, n = 0;
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
      const yy=y+dy, xx=x+dx;
      sum += (yy<0||xx<0||yy>=H||xx>=B) ? 0 : m[yy*B+xx]; n++;
    }
    o[y*B+x] = sum/n;
  }
  m = o;
}

// Zuschnitt auf das, was uebrig blieb
let ax0=B, ay0=H, ax1=0, ay1=0;
for (let y=0;y<H;y++) for (let x=0;x<B;x++) if (m[y*B+x] > .12) {
  if (x<ax0) ax0=x; if (x>ax1) ax1=x; if (y<ay0) ay0=y; if (y>ay1) ay1=y;
}
const nb = ax1-ax0+1, nh = ay1-ay0+1;
const png = new PNG({width:nb, height:nh});
for (let y=0;y<nh;y++) for (let x=0;x<nb;x++) {
  const s = (y+ay0)*B + (x+ax0), t = (y*nb+x)*4;
  png.data[t]=px[s*4]; png.data[t+1]=px[s*4+1]; png.data[t+2]=px[s*4+2];
  png.data[t+3]=Math.round(Math.min(1,m[s])*255);
}
fs.writeFileSync(A.out ?? "hund.png", PNG.sync.write(png));
console.log(`Ausschnitt ${B}x${H} → Hund ${nb}x${nh}, Deckung ${(besteN/(B*H)*100).toFixed(1)} % des Ausschnitts`);
console.log(`Lage im Originalbild: x ${X0+ax0}–${X0+ax1}, y ${Y0+ay0}–${Y0+ay1}`);
