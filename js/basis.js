"use strict";
/* =====================================================================
   Grundlagen — von rauchfrei.html und setup.html gemeinsam benutzt
   ---------------------------------------------------------------------
   Hier liegt genau das, was auf beiden Seiten identisch sein MUSS. Vorher
   stand dieser SHA-256-Block zweimal im Projekt, wortgleich. Solange
   niemand etwas anfasst, geht das gut; sobald aber das Salz oder die
   Namensbehandlung auf einer Seite geaendert wird, erzeugt setup.html
   Pruefsummen, mit denen sich niemand mehr anmelden kann — und der Fehler
   sieht aus wie ein vergessenes Passwort.

   Deshalb gibt es kennung() nur einmal. Beide Seiten rufen dieselbe
   Funktion auf, und die Frage kann sich nicht mehr stellen.
   ===================================================================== */

/* Fassungsnummer. Muss mit der Zahl hinter ?v= in rauchfrei.html und
   setup.html uebereinstimmen. Bei JEDER Aenderung an CSS oder JS beide
   hochzaehlen.

   Warum das noetig ist: GitHub Pages liefert jede Datei mit
   Cache-Control max-age=600 aus, also zehn Minuten, und zwar einzeln. Wer
   die Seite offen hatte und neu laedt, bekam dadurch neues HTML mit altem
   JavaScript. Am 18.08.2026 genau so passiert: das alte Skript griff auf
   einen Kasten zu, den es im neuen Markup nicht mehr gab, warf dort einen
   Fehler, und zeichnen() brach ab, bevor der Countdown aktualisiert wurde.
   Sichtbar war das als leerer Erfolgsbereich und ein "In -" in der Karte.

   Mit ?v= kann das nicht mehr vorkommen: neues HTML verweist auf neue
   Adressen, die im Zwischenspeicher gar nicht liegen. Als Netz prueft die
   Seite die Zahl zusaetzlich gegen. */
const FASSUNG = 8;

/* Zeit. Steht hier, weil TROPHAEEN in inhalte.js damit rechnet und diese
   Datei zuerst geladen wird. */
const MIN = 60000, STD = 60 * MIN, TAG = 24 * STD;

const $ = id => document.getElementById(id);

/* ---------------------------------------------------------------------
   SHA-256 in reinem JavaScript
   Nicht crypto.subtle, weil das einen sicheren Kontext braucht und damit
   beim lokalen Oeffnen der Datei ausfaellt. Gegen die offiziellen
   Testvektoren und gegen die .NET-Implementierung geprueft.
   --------------------------------------------------------------------- */
const SALZ = "scaRnet-rauchfrei-v1";

const K256 = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];
const rotr = (x,n) => (x >>> n) | (x << (32 - n));

function sha256(str){
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes = new TextEncoder().encode(str), len = bytes.length;
  const total = (((len + 8) >> 6) << 6) + 64;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  const bits = len * 8;
  dv.setUint32(total - 8, Math.floor(bits / 4294967296));
  dv.setUint32(total - 4, bits >>> 0);
  const w = new Uint32Array(64);
  for (let i = 0; i < total; i += 64){
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++){
      const x = w[t-15], y = w[t-2];
      const s0 = rotr(x,7) ^ rotr(x,18) ^ (x >>> 3);
      const s1 = rotr(y,17) ^ rotr(y,19) ^ (y >>> 10);
      w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let t = 0; t < 64; t++){
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[t] + w[t]) >>> 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H = H.map((v,i) => (v + [a,b,c,d,e,f,g,h][i]) >>> 0);
  }
  return H.map(v => v.toString(16).padStart(8,"0")).join("");
}

/** Aus Name und Passwort wird die Kennung, unter der auch die Daten liegen. */
const kennung = (name, pass) => sha256(SALZ + "|" + name.trim().toLowerCase() + "|" + pass);
