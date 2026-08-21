/* Stellt den Hund aus einem Wiesenfoto frei.

   Der Trick ist hier nicht Waerme, sondern Gruen: Gras ist gruen, Hundefell
   ist es nie. Das trennt sauberer als jede Helligkeitsschwelle — und vor
   allem frisst es keine beschatteten Stellen weg. Genau daran ist der erste
   Versuch aus dem Serverraum-Foto gescheitert: dort wurde "kalt und dunkel"
   entfernt, und die beschattete Gesichtshaelfte war weg.

   Aufruf:
     node gras-freistellen.mjs quelle.jpg x0 y0 x1 y1 [rand=10] [weich=2] [drehen=1] ziel.png
*/
import fs from "node:fs";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const A = Object.fromEntries(process.argv.slice(2).map(s => s.split("=")).filter(p => p.length === 2));
const quelle = process.argv[2];
const ziel   = A.out ?? "hund-neu.png";
const X0=+A.x0, Y0=+A.y0, X1=+A.x1, Y1=+A.y1;
const RAND=+(A.rand ?? 10), WEICH=+(A.weich ?? 2), DREHEN=+(A.drehen ?? 1), PUTZ=+(A.putz ?? 3);

const q = jpeg.decode(fs.readFileSync(quelle), {useTArray:true, maxMemoryUsageInMB:1024});
const B = X1-X0, H = Y1-Y0;
const px = new Uint8Array(B*H*4);
let m = new Float32Array(B*H);

let gruenAnteil = 0;
for (let y=0; y<H; y++) for (let x=0; x<B; x++){
  const i=((y+Y0)*q.width + (x+X0))*4, j=y*B+x;
  const r=q.data[i], g=q.data[i+1], b=q.data[i+2];
  px[j*4]=r; px[j*4+1]=g; px[j*4+2]=b;
  /* Gruenueberschuss statt Farbton. Gemessen an diesem Foto: reines Gras
     liegt im Median bei 0,30, cremefarbenes und weisses Fell bei 0,00.
     Das trennt, was der Farbton allein nicht trennt — denn graues Fell
     liegt im Farbton mitten im Grasbereich, weil die Wiese gruenes Licht
     auf den Hund wirft. */
  const summe = r + g + b || 1;
  const gruen = (2*g - r - b) / summe > RAND/100;
  if (gruen) gruenAnteil++;
  m[j] = gruen ? 0 : 1;
}
console.log(`  Ausschnitt ${B}x${H}, davon ${(gruenAnteil/(B*H)*100).toFixed(1)} % Gras`);

const nachbar = (src, r, art) => {
  const out = new Float32Array(src.length);
  for (let y=0; y<H; y++) for (let x=0; x<B; x++){
    let v = art === "max" ? 0 : 1;
    for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++){
      const yy=y+dy, xx=x+dx;
      const s = (yy<0||xx<0||yy>=H||xx>=B) ? 0 : src[yy*B+xx];
      v = art === "max" ? Math.max(v,s) : Math.min(v,s);
    }
    out[y*B+x]=v;
  }
  return out;
};
m = nachbar(nachbar(m, PUTZ, "min"), PUTZ, "max");   /* duenne Strukturen weg: trockene Halme haben denselben Farbton wie das Fell */
m = nachbar(nachbar(m, 2, "max"), 2, "min");   /* Loecher schliessen */

/* Groesste zusammenhaengende Flaeche */
const marke = new Int32Array(B*H).fill(-1);
let beste=-1, besteN=0, id=0;
for (let s=0; s<B*H; s++){
  if (m[s] < .5 || marke[s] >= 0) continue;
  const st=[s]; marke[s]=id; let n=0;
  while (st.length){
    const p=st.pop(); n++;
    const y=(p/B)|0, x=p%B;
    if (x>0   && m[p-1]>=.5 && marke[p-1]<0){ marke[p-1]=id; st.push(p-1); }
    if (x<B-1 && m[p+1]>=.5 && marke[p+1]<0){ marke[p+1]=id; st.push(p+1); }
    if (y>0   && m[p-B]>=.5 && marke[p-B]<0){ marke[p-B]=id; st.push(p-B); }
    if (y<H-1 && m[p+B]>=.5 && marke[p+B]<0){ marke[p+B]=id; st.push(p+B); }
  }
  if (n > besteN){ besteN=n; beste=id; }
  id++;
}
if (beste < 0){ console.error("  FEHLER: nichts gefunden"); process.exit(2); }
console.log(`  ${id} Flaechen, groesste ${besteN} Punkte (${(besteN/(B*H)*100).toFixed(1)} %)`);
for (let s=0; s<B*H; s++) m[s] = marke[s]===beste ? 1 : 0;

/* Loecher fuellen: was vom Rand aus nicht erreichbar ist, gehoert dazu */
{
  const aussen=new Uint8Array(B*H), st=[];
  for (let x=0;x<B;x++){ st.push(x, (H-1)*B+x); }
  for (let y=0;y<H;y++){ st.push(y*B, y*B+B-1); }
  while (st.length){
    const p=st.pop();
    if (aussen[p] || m[p]>=.5) continue;
    aussen[p]=1;
    const y=(p/B)|0, x=p%B;
    if (x>0) st.push(p-1); if (x<B-1) st.push(p+1);
    if (y>0) st.push(p-B); if (y<H-1) st.push(p+B);
  }
  let f=0; for (let s=0;s<B*H;s++) if (!aussen[s] && m[s]<.5){ m[s]=1; f++; }
  console.log("  Loecher gefuellt:", f);
}

for (let d=0; d<WEICH; d++){
  const o=new Float32Array(m.length);
  for (let y=0;y<H;y++) for (let x=0;x<B;x++){
    let sum=0;
    for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){
      const yy=y+dy, xx=x+dx;
      sum += (yy<0||xx<0||yy>=H||xx>=B) ? 0 : m[yy*B+xx];
    }
    o[y*B+x]=sum/9;
  }
  m=o;
}

let ax0=B, ay0=H, ax1=0, ay1=0;
for (let y=0;y<H;y++) for (let x=0;x<B;x++) if (m[y*B+x] > .12){
  if (x<ax0)ax0=x; if(x>ax1)ax1=x; if(y<ay0)ay0=y; if(y>ay1)ay1=y;
}
const nb=ax1-ax0+1, nh=ay1-ay0+1;
{
  let o=0,u=0,l=0,r=0;
  for (let x=0;x<nb;x++){ if(m[ay0*B+x+ax0]>.5)o++; if(m[ay1*B+x+ax0]>.5)u++; }
  for (let y=0;y<nh;y++){ if(m[(y+ay0)*B+ax0]>.5)l++; if(m[(y+ay0)*B+ax1]>.5)r++; }
  console.log(`  Randberuehrung — oben ${o}, unten ${u}, links ${l}, rechts ${r}`);
}

/* Drehen: das Foto liegt quer in der Datei, der Hund steht hochkant.
   drehen=1 heisst 90 Grad im Uhrzeigersinn. */
const dreh = DREHEN === 1;
const W = dreh ? nh : nb, Ho = dreh ? nb : nh;
const png = new PNG({width:W, height:Ho});
for (let y=0;y<nh;y++) for (let x=0;x<nb;x++){
  const s=(y+ay0)*B + (x+ax0);
  const zx = dreh ? (nh-1-y) : x;
  const zy = dreh ? x        : y;
  const t=(zy*W+zx)*4;
  png.data[t]=px[s*4]; png.data[t+1]=px[s*4+1]; png.data[t+2]=px[s*4+2];
  png.data[t+3]=Math.round(Math.min(1,m[s])*255);
}
fs.writeFileSync(ziel, PNG.sync.write(png));
console.log(`  → ${ziel}  ${W}x${Ho}`);
