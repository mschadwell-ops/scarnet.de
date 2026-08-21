import fs from "node:fs"; import { PNG } from "pngjs";
const A=Object.fromEntries(process.argv.slice(2).map(s=>s.split("=")).filter(p=>p.length===2));
const p=PNG.sync.read(fs.readFileSync(A.in)), W=p.width, H=p.height;
const z=+A.breite, f=W/z, zh=Math.round(H/f);
const out=new PNG({width:z,height:zh});
for(let y=0;y<zh;y++)for(let x=0;x<z;x++){
  let r=0,g=0,b=0,a=0,n=0;
  const x0=Math.floor(x*f),x1=Math.max(Math.floor((x+1)*f),x0+1),y0=Math.floor(y*f),y1=Math.max(Math.floor((y+1)*f),y0+1);
  for(let sy=y0;sy<Math.min(y1,H);sy++)for(let sx=x0;sx<Math.min(x1,W);sx++){
    const i=(sy*W+sx)*4, al=p.data[i+3]/255;
    r+=p.data[i]*al; g+=p.data[i+1]*al; b+=p.data[i+2]*al; a+=al; n++;
  }
  const t=(y*z+x)*4, ad=a/n;
  /* Durchsichtige Stellen bekommen Schwarz statt Bildresten: der Packer
     komprimiert eine gleichmaessige Flaeche um ein Vielfaches besser, und
     zu sehen ist davon nichts. */
  out.data[t]   = ad<0.004 ? 0 : Math.round(r/a);
  out.data[t+1] = ad<0.004 ? 0 : Math.round(g/a);
  out.data[t+2] = ad<0.004 ? 0 : Math.round(b/a);
  out.data[t+3] = Math.round(ad*255);
}
fs.writeFileSync(A.out, PNG.sync.write(out, {deflateLevel:9}));
console.log(`  ${A.out}  ${z}x${zh}  ${fs.statSync(A.out).size} Bytes`);
