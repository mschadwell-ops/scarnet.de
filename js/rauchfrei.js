"use strict";
/* =====================================================================
   scarnet.de — Rauchfrei: die Anwendung
   ---------------------------------------------------------------------
   Rechnen, Speichern, Zeichnen, Krisenfenster und Atemklang. Alles, was
   hier steht, arbeitet mit den Listen aus inhalte.js — die Datei muss
   also vorher geladen sein, und in rauchfrei.html steht sie deshalb
   davor. Die Reihenfolge ist keine Kosmetik: rechnete hier etwas beim
   Laden sofort mit einer Liste, die noch nicht existiert, stuende das
   ganze Skript still.

   Ladefolge: basis.js, inhalte.js, rauchfrei.js
   ===================================================================== */

/* ====================================================================
   1. Zugänge
   --------------------------------------------------------------------
   Hier stehen nur Prüfsummen. Aus einem Hash lassen sich weder Name noch
   Passwort zurückrechnen — beides steht also nirgends im Quelltext, auch
   nicht in der Fassung, die auf GitHub liegt.

   Neuen Zugang anlegen: setup.html öffnen, Name und Passwort eintragen,
   die erzeugte Zeile hier in die Liste einfügen.

   Ehrlich gesagt: Das ist Verschleierung, keine Festung. Wer den Hash
   hat, kann schwache Passwörter durchprobieren. Nimm etwas, das nicht
   in einer Wörterliste steht.
   ==================================================================== */
const KONTEN = [
  { hash:"e9baa8463e3398cbeaf48a7520b3e197b11eddc60af6ffcd7838092f620fa4d0" },
  { hash:"cc254845e459367949e126c5f6674c04252a5657a1da57c570647e375ceb2889" },
  { hash:"0997d134dac77615f607b8269294354ab173e19b613096b72028fa5d5a30f7d5" }
];

/* ---------------------------------------------------------------------
   Passt das Markup zu diesem Skript?
   ---------------------------------------------------------------------
   Am 18.08.2026 gemeldet: auf dem Handy stand in der Countdown-Karte nur
   noch „In –“. Nachgestellt und bestätigt — die Ursache war ein Browser,
   der noch die HTML-Fassung von VOR der Versionierung im Zwischenspeicher
   hatte. Die verweist auf js/rauchfrei.js ohne ?v=, und diese Adresse
   liefert die aktuelle Datei aus: neues Skript, altes Markup. Das Skript
   suchte einen Kasten, den es dort nicht mehr gibt, warf einen TypeError,
   und zeichnen() brach ab, bevor der Countdown geschrieben wurde.

   Gegen genau diesen Fall hilft ?v= nicht — es wirkt erst ab der Fassung,
   die es eingeführt hat. Deshalb prüft das Skript hier selbst nach. Das
   funktioniert in beide Richtungen und dauerhaft, auch wenn irgendwann
   wieder ein Kasten umbenannt wird.

   Ein throw an dieser Stelle beendet die Ausführung der ganzen Datei. Das
   ist gewollt: was danach käme, würde ohnehin nur weitere Fehler werfen.
   --------------------------------------------------------------------- */
(function markupPruefen(){
  const noetig = ["anmeldeForm", "einrichtenForm", "ansichtApp", "zTage", "cdZeit",
                  "erfolge", "erfolgAntwort", "tagfenster", "tfZu", "muenze", "krise"];
  const fehlt = noetig.filter(id => !document.getElementById(id));

  if (!fehlt.length){
    /* Alles da. Merker loeschen, damit sich die Seite in derselben Sitzung
       auch ein zweites Mal heilen koennte, und die Sonderabfrage aus der
       Adresszeile nehmen — sonst steht sie da und wandert womoeglich in ein
       Lesezeichen. */
    try { sessionStorage.removeItem("frischGeholt"); } catch (e) {}
    if (location.search.indexOf("frisch=") >= 0 && history.replaceState)
      history.replaceState(null, "", location.pathname);
    return;
  }

  /* Einmal von selbst neu laden, unter Umgehung des Zwischenspeichers. Ein
     Knopf war hier vorher, aber niemand soll erst etwas anklicken oder gar
     eine Sonderadresse eintippen muessen, damit die Seite laeuft.

     Der Merker in sessionStorage verhindert eine Endlosschleife: liegt nach
     dem Neuladen immer noch etwas quer, wird nicht wieder geladen, sondern
     die Meldung gezeigt. Faellt sessionStorage aus, greift zusaetzlich die
     Abfrage im URL als zweite Bremse. */
  let schonVersucht = false;
  try { schonVersucht = sessionStorage.getItem("frischGeholt") === "1"; } catch (e) {}
  if (!schonVersucht && location.search.indexOf("frisch=") < 0){
    try { sessionStorage.setItem("frischGeholt", "1"); } catch (e) {}
    location.replace(location.pathname + "?frisch=" + Date.now());
    throw new Error("Markup veraltet, lade neu");
  }

  document.body.innerHTML =
    '<div style="max-width:34rem;margin:20vh auto;padding:0 1.5rem;' +
    'font:400 1rem/1.6 ui-sans-serif,system-ui,sans-serif;color:#E9F2EE">' +
    '<p style="font-size:1.3rem;font-weight:600;margin:0 0 .6rem">' +
    'Die Seite liess sich nicht vollstaendig laden.</p>' +
    '<p style="color:#8CA8A0;margin:0 0 1.4rem">Automatisches Neuladen hat nicht ' +
    'geholfen. Im Browser einmal die Daten dieser Seite loeschen raeumt das auf.</p>' +
    '<button id="frischLaden" style="font:inherit;cursor:pointer;padding:.7rem 1.2rem;' +
    'border-radius:.5rem;border:1px solid #62D6AE;background:#62D6AE;color:#062018;' +
    'font-weight:650">Noch einmal versuchen</button></div>';

  document.getElementById("frischLaden").onclick = function(){
    try { sessionStorage.removeItem("frischGeholt"); } catch (e) {}
    location.replace(location.pathname + "?frisch=" + Date.now());
  };

  throw new Error("Markup passt nicht zu diesem Skript, es fehlen: " + fehlt.join(", "));
})();


/* ====================================================================
   5. Speicher — läuft auch weiter, wenn er gesperrt ist
   ==================================================================== */
const SCHLUESSEL = "scarnet.rauchfrei.v1";
const SITZUNG = "scarnet.rauchfrei.sitzung";
let speicherGeht = true;
let ramSpeicher = {};

function lesen(){
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    return roh ? JSON.parse(roh) : {};
  } catch (e) {
    speicherGeht = false;
    return ramSpeicher;
  }
}
function schreiben(daten){
  ramSpeicher = daten;
  if (!speicherGeht) return;
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
  } catch (e) {
    speicherGeht = false;
  }
}
function merkenSetzen(id, dauerhaft){
  try {
    (dauerhaft ? localStorage : sessionStorage).setItem(SITZUNG, id);
  } catch (e) { /* dann eben nur für diesen Seitenaufruf */ }
}
function merkenLesen(){
  try {
    return localStorage.getItem(SITZUNG) || sessionStorage.getItem(SITZUNG);
  } catch (e) { return null; }
}
function merkenLoeschen(){
  try { localStorage.removeItem(SITZUNG); sessionStorage.removeItem(SITZUNG); } catch (e) {}
}

/* ====================================================================
   6. Rechnen und Formatieren
   ==================================================================== */

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

const zahl = (n, stellen = 0) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

function euro(betrag){
  return betrag.toLocaleString("de-DE",
    { style:"currency", currency:"EUR", minimumFractionDigits:2, maximumFractionDigits:2 });
}

/** Minuten in eine lesbare Angabe: „3 Tage 4 Std.“ oder „12 Std. 30 Min.“
 *  Zwei Regeln, die vorher fehlten. Bei genau eins die Einzahl — sonst stand
 *  dort „1 Jahr 1 Tage“. Und keine Einheit mit einer Null davor: „1 Jahr
 *  0 Tage“ ist keine Angabe, das ist ein Rechenrest. */
function dauerAusMinuten(minuten){
  const t = Math.floor(minuten / 1440);
  const s = Math.floor((minuten % 1440) / 60);
  const m = Math.floor(minuten % 60);
  if (t >= 365){
    const j = Math.floor(t / 365), rest = t % 365;
    return j + (j === 1 ? " Jahr" : " Jahre")
         + (rest ? " " + rest + (rest === 1 ? " Tag" : " Tage") : "");
  }
  if (t > 0) return t + (t === 1 ? " Tag" : " Tage") + (s ? " " + s + " Std." : "");
  if (s > 0) return s + " Std." + (m ? " " + m + " Min." : "");
  return m + " Min.";
}

/* Mit Uhrzeit, weil die jetzt in die Rechnung eingeht — so lässt sich auch
   nachsehen, was tatsächlich eingetragen wurde. */
const datumLang = ts => new Date(ts).toLocaleString("de-DE",
  { weekday:"long", day:"numeric", month:"long", year:"numeric",
    hour:"2-digit", minute:"2-digit" }) + " Uhr";

/** Alle abgeleiteten Werte an einem Ort — so bleibt das Rendern dumm. */
function rechnen(profil, jetzt = Date.now()){
  const verstrichen = Math.max(0, jetzt - profil.start);
  const tage = Math.floor(verstrichen / TAG);
  const restMs = verstrichen % TAG;
  const nichtGeraucht = (verstrichen / TAG) * profil.menge;
  const preisJeZig = profil.preis / profil.proSchachtel;
  return {
    verstrichen, tage,
    stunden: Math.floor(restMs / STD),
    minuten: Math.floor((restMs % STD) / MIN),
    sekunden: Math.floor((restMs % MIN) / 1000),
    nichtGeraucht,
    geld: nichtGeraucht * preisJeZig,
    lebensMinuten: nichtGeraucht * 11,
    schachteln: nichtGeraucht / profil.proSchachtel
  };
}

/* ====================================================================
   7. Zustand und Ansichten
   ==================================================================== */
let meineId = null;      // Kennung des angemeldeten Kontos
let profil = null;       // dessen Daten
let uhrLaeuft = null;
let letzterTag = -1;         // damit Spruch und Tagesliste nicht sekündlich neu gebaut werden

const ANSICHTEN = ["ansichtAnmeldung", "ansichtEinrichten", "ansichtApp"];
function zeigen(welche){
  ANSICHTEN.forEach(a => $(a).hidden = (a !== welche));
}

const standard = () => ({ start:Date.now(), menge:20, preis:10, proSchachtel:22, beste:0, rueckfaelle:0, wellen:0, wellenNacht:0, letzteWelle:0, ruheErreicht:false, ton:false, gesehenerTag:0 });

/* Datum UND Uhrzeit, nicht nur das Datum. Wer mittags aufhört, soll nicht
   rückdatiert auf Mitternacht starten und sofort zwölf Stunden geschenkt
   bekommen — bei Marken wie 20 Minuten oder 8 Stunden zählt die Uhrzeit. */

const zz = n => String(n).padStart(2, "0");

/** Zeitstempel zu YYYY-MM-DDTHH:MM für ein datetime-local-Feld. */
function inFeld(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${zz(d.getMonth()+1)}-${zz(d.getDate())}`
       + `T${zz(d.getHours())}:${zz(d.getMinutes())}`;
}

/** Feldwert zurück zum Zeitstempel. Ohne Zeitzonenangabe deutet der Browser
    die Angabe als Ortszeit, was hier genau richtig ist. */
function ausFeld(wert){
  const ts = new Date(wert).getTime();
  return Number.isNaN(ts) ? null : ts;
}

/** Nur das Datum, für Dateinamen. */
function datumKurz(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${zz(d.getMonth()+1)}-${zz(d.getDate())}`;
}

/* ---------- Anmeldung ---------- */
function anmelden(id){
  meineId = id;
  const alle = lesen();
  profil = alle[id] || null;

  if (!profil){
    const jetzt = inFeld(Date.now());
    $("fStart").value = jetzt;   // Voreinstellung: genau jetzt
    $("fStart").max = jetzt;
    zeigen("ansichtEinrichten");
    $("fStart").focus();
    return;
  }
  starten();
}

function starten(){
  // fehlende Felder aus älteren Datenständen auffüllen
  profil = Object.assign(standard(), profil);
  letzterTag = -1;
  zeigen("ansichtApp");
  einstellungenFuellen();
  if ($("speicherWarnung")){
    $("speicherWarnung").hidden = speicherGeht;
    $("speicherWarnung").textContent =
      "Dieser Browser lässt kein Speichern zu — die Angaben gelten nur, solange die Seite offen ist.";
  }
  wellenZeichnen();

  zeichnen();
  clearInterval(uhrLaeuft);
  uhrLaeuft = setInterval(zeichnen, 1000);
}

$("anmeldeForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("fName").value, pass = $("fPass").value;
  const fehler = $("anmeldeFehler");
  if (!name.trim() || !pass){ fehler.textContent = "Bitte beides ausfüllen."; return; }

  const id = kennung(name, pass);
  const konto = KONTEN.find(k => k.hash === id);
  if (!konto){
    fehler.textContent = "Name oder Passwort stimmt nicht.";
    $("fPass").select();
    return;
  }
  fehler.textContent = "";
  merkenSetzen(id, $("fMerken").checked);
  $("fPass").value = "";
  anmelden(id);
});

$("einrichtenForm").addEventListener("submit", e => {
  e.preventDefault();
  const fehler = $("einrichtenFehler");
  const start = ausFeld($("fStart").value);
  if (start === null){ fehler.textContent = "Bitte Datum und Uhrzeit angeben."; return; }
  if (start > Date.now()){ fehler.textContent = "Das liegt in der Zukunft."; return; }
  const menge = parseInt($("fMenge").value, 10);
  if (!menge || menge < 1){ fehler.textContent = "Bitte eine Zahl ab 1 eintragen."; return; }

  fehler.textContent = "";
  profil = Object.assign(standard(), { start, menge });
  /* Wer beim Einrichten ein Datum von vor fünf Tagen einträgt, hat Tag 5 nicht
     in der App erlebt — dafür gibt es kein Feuerwerk. Der Stand von jetzt gilt
     als gesehen, gefeiert wird ab dem nächsten Tag. */
  profil.gesehenerTag = Math.floor(rechnen(profil).verstrichen / TAG);
  sichern();
  starten();
});

function sichern(){
  const alle = lesen();
  alle[meineId] = profil;
  schreiben(alle);
}

$("bAbmelden").onclick = () => {
  merkenLoeschen();
  clearInterval(uhrLaeuft);
  meineId = null; profil = null;
  $("fName").value = ""; $("fPass").value = "";
  zeigen("ansichtAnmeldung");
  $("fName").focus();
};

/* ---------- Zeichnen ---------- */
function zeichnen(){
  const w = rechnen(profil);

  /* Am ersten Tag stand hier eine nackte Null, und zwar vierundzwanzig
     Stunden lang. Genau dann, wenn es am schwersten ist, sah die große
     Zahl aus, als wäre nichts passiert.

     Deshalb zählt der erste Tag in Hundertsteln: 0,01 — 0,02 — bis 0,99,
     und beim Übergang lösen sie sich in eine glatte 1 auf. Hundert
     Schritte bis zum ersten Tag, einer alle 14 Minuten.

     Abgeschnitten, nicht gerundet: sonst stünde die letzten sieben Minuten
     vor Mitternacht schon eine 1,00 da, obwohl der Tag noch nicht voll ist.
     Genau derselbe Fehler wie damals in der Tagesliste.

     Ab Tag eins wieder ganze Tage — „3,42 Tage rauchfrei“ sagt niemand. */
  if (w.tage < 1){
    const anteil = Math.floor((w.verstrichen / TAG) * 100) / 100;
    $("zTage").textContent = anteil.toFixed(2).replace(".", ",");
    $("zTageWort").textContent = " Tage";
  } else {
    $("zTage").textContent = zahl(w.tage);
    $("zTageWort").textContent = w.tage === 1 ? " Tag" : " Tage";
  }
  /* Die Einheiten stehen kleiner und blasser als die Zahlen — sonst liest sich
     die Zeile als Fließtext statt als Uhr. Deshalb hier innerHTML statt
     textContent; eingesetzt werden nur eigene Zahlen, kein fremder Text. */
  $("zUhr").innerHTML =
      w.stunden + "<small> Std.</small> "
    + String(w.minuten).padStart(2,"0") + "<small> Min.</small> "
    + String(w.sekunden).padStart(2,"0") + "<small> Sek.</small>";
  $("zSeit").textContent = "seit " + datumLang(profil.start);

  // Der Rauch der ersten 24 Stunden. Voll beim Start, gleichmäßig dünner,
  // und genau dann verschwunden, wenn Tag 1 freigeschaltet wird. Bewusst
  // linear: eine gekrümmte Kurve war nach der Hälfte schon fast unsichtbar,
  // obwohl da noch ein halber Tag vor einem liegt.
  const rest = Math.max(0, 1 - w.verstrichen / TAG);
  $("rauch").style.setProperty("--rauch", rest.toFixed(3));

  /* Auf ganze Cent abschneiden, nicht runden. euro() rundet ueber
     toLocaleString, die Muenze rechnet mit Math.floor — dadurch zeigte die
     Zahl den naechsten Cent schon an, waehrend die Muenze noch bei 99
     Prozent stand. Beide zaehlen jetzt denselben Cent, und der Sprung
     passiert in derselben Sekunde. Abschneiden ist ausserdem die ehrliche
     Richtung: es wird nie mehr behauptet, als tatsaechlich gespart ist. */
  $("kGeld").textContent = euro(Math.floor(w.geld * 100) / 100);
  muenzeZeichnen(w);
  const schachteln = Math.floor(w.schachteln);
  $("kGeldNote").textContent = schachteln === 1
    ? "eine Schachtel nicht gekauft"
    : zahl(schachteln) + " Schachteln nicht gekauft";

  const zig = Math.floor(w.nichtGeraucht);
  $("kZig").textContent = zahl(zig);
  const stangen = w.nichtGeraucht / (profil.proSchachtel * 10);
  $("kZigNote").textContent = stangen >= 1
    ? zahl(stangen, 1) + " Stangen"
    : "Zigaretten, die niemand geraucht hat";

  $("kLeben").textContent = dauerAusMinuten(w.lebensMinuten);

  // Spruch und Tagesliste nur neu bauen, wenn der Tag umschlägt. Sonst würde
  // die Sekundenanzeige jede Sekunde das halbe DOM ersetzen und dabei jede
  // Textmarkierung des Nutzers zerstören.
  if (w.tage !== letzterTag){
    spruchZeichnen(w.tage);
    stattZeichnen();
    /* Frisch ist ein Tag, den DIESE PERSON noch nicht gesehen hat — nicht
       einer, dessen Umschlag die Seite zufällig miterlebt hat. Damit ist beides
       abgedeckt: der Tag springt bei offener Seite um, ODER man meldet sich
       erst danach wieder an.

       Wer drei Tage nicht hereinsieht, bekommt genau eine Feier, und zwar für
       den Tag, auf dem er jetzt steht — nicht drei nacheinander.

       Gemerkt wird es im Profil und nicht in einer Variablen, sonst käme die
       Belohnung bei jedem Neuladen wieder. Tag 0 zählt nicht: am
       Einrichtungstag ist noch nichts erreicht. */
    /* Profile, die vor dieser Aenderung angelegt wurden, haben das Feld noch
       nicht. Einmal auf den jetzigen Stand setzen und sichern — ohne das
       fiele die Pruefung jedes Mal auf w.tage zurueck, frisch waere immer
       null, und es gaebe fuer diese Person nie eine Feier. */
    if (!Number.isFinite(profil.gesehenerTag)){
      profil.gesehenerTag = w.tage;
      sichern();
    }
    const frisch = (w.tage > profil.gesehenerTag && w.tage >= 1) ? w.tage : null;
    tageZeichnen(w.tage, profil, frisch);   // w.tage = abgeschlossene Tage
    $("cdTag").textContent = "Tag " + (w.tage + 1);
    $("cdText").textContent = tagesText(w.tage + 1, profil, true);   // Ziel-Fassung
    erfolgeZeichnen(w.verstrichen, frisch);   // alle Marken liegen auf Tagesgrenzen
    if (frisch){
      feuerwerk(w.tage);
      profil.gesehenerTag = w.tage;
      sichern();
    }
    wellenZeichnen();
    letzterTag = w.tage;
  }

  naechstesZeichnen(w);

  const beste = Math.max(profil.beste || 0, w.verstrichen);
  $("bestzeit").innerHTML = (profil.rueckfaelle > 0)
    ? `Längste rauchfreie Zeit bisher: <b>${Math.floor(beste / TAG)} Tage</b>.`
    : "";
}

/* Die Münze zeigt den Weg zum nächsten Cent. Der Anteil ist einfach der
   Nachkommarest der Cent-Zahl — dadurch stimmt die Füllung immer mit dem
   überein, was gleich in der Anzeige steht. */
let letzterCent = -1;

function muenzeZeichnen(w){
  const cent   = w.geld * 100;
  const ganz   = Math.floor(cent);
  const anteil = cent - ganz;
  const mz     = $("muenze");
  const fuell  = mz.firstElementChild;

  if (ganz !== letzterCent){
    if (letzterCent >= 0 && ganz === letzterCent + 1){
      // Umschlag: erst ohne Übergang zurücksetzen, sonst läuft die Füllung
      // rückwärts leer, statt neu anzufangen.
      fuell.style.transition = "none";
      mz.classList.remove("voll");
      void mz.offsetWidth;
      mz.classList.add("voll");
      requestAnimationFrame(() => { fuell.style.transition = ""; });
    }
    letzterCent = ganz;
  }
  mz.style.setProperty("--fuell", anteil.toFixed(3));

  // Wie lange noch. Ergibt sich aus dem Verdienst pro Millisekunde.
  const proMs = (profil.menge / TAG) * (profil.preis / profil.proSchachtel);
  if (proMs > 0){
    const restS = Math.ceil((1 - anteil) * 0.01 / proMs / 1000);
    $("muenzeNote").textContent = restS > 90
      ? "nächster Cent in " + Math.floor(restS / 60) + ":" + zz(restS % 60) + " Min."
      : "nächster Cent in " + restS + " Sek.";
  }
}

/* Ein Beutel statt Würfeln. Bei purem Zufall käme bei 518 Einträgen im
   Schnitt nach etwa 27 Griffen der erste Doppelte — und genau das zerstört
   den Eindruck, dass die Liste endlos ist. Hier wird die ganze Liste
   gemischt und der Reihe nach abgearbeitet; erst wenn sie durch ist, wird
   neu gemischt. So sieht man alle 518, bevor sich einer wiederholt. */
let stBeutel = [], stKrBeutel = [];

/* Im Krisenfenster taugt nicht jeder Vorschlag. Wer gerade vor der Tür
   steht und es kaum aushält, kann nicht die Gefriertruhe abtauen und keine
   Karotten vorschneiden. Dort kommt nur, was sofort geht und überall geht —
   alles andere wäre in dem Moment Hohn. */
const AKUT = ["Sofort", "Stress", "Pause", "Mund"];

/* Erst beim ersten Bedarf ausrechnen, nicht hier. Diese Zeilen stehen im
   Quelltext über der Liste selbst — würde hier direkt gerechnet, liefe der
   Zugriff in die zeitliche Totzone und das ganze Skript stünde still. */
let akutNr = null;
function akutNummern(){
  if (!akutNr)
    akutNr = STATTDESSEN.map((s, i) => AKUT.indexOf(s.w) >= 0 ? i : -1).filter(i => i >= 0);
  return akutNr;
}

function ausBeutel(beutel, quelle){
  if (!beutel.length){
    if (quelle) beutel.push.apply(beutel, quelle);
    else for (let i = 0; i < STATTDESSEN.length; i++) beutel.push(i);
    for (let i = beutel.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [beutel[i], beutel[j]] = [beutel[j], beutel[i]];
    }
  }
  return STATTDESSEN[beutel.pop()];
}

function stattZeichnen(){
  const s = ausBeutel(stBeutel);
  $("stWo").textContent = s.w;
  $("stText").textContent = s.t;

  // Klasse kurz setzen und wieder abnehmen, sonst läuft die Animation nur
  // beim ersten Mal.
  const karte = $("stattKarte");
  karte.classList.remove("frisch");
  void karte.offsetWidth;
  karte.classList.add("frisch");
}

function spruchZeichnen(tage){
  const versatz = parseInt(meineId.slice(0, 6), 16) % SPRUECHE.length;
  const s = SPRUECHE[(tage + versatz) % SPRUECHE.length];
  const namen = { fakt:"Fakt", mut:"Zuspruch", tipp:"Tipp", blick:"Ach übrigens" };
  $("sArt").textContent = namen[s.k] || "Gedanke";
  $("sText").textContent = s.t;
}

/** Der Erfolg eines bestimmten Tages. nr = 1 ist der erste Tag.
    Bis Tag 90 ein eigener Eintrag, danach die dokumentierten Langzeitmarken
    und sonst ein aus den eigenen Zahlen errechneter Erfolg. Der wechselt
    täglich und ist immer wahr, ohne dass ich Medizin erfinden muss. */
function tagesText(nr, p, alsZiel){
  if (nr >= 1 && nr <= TAGE.length) return alsZiel ? TAGE_ZIEL[nr - 1] : TAGE[nr - 1];

  const lang = LANGZEIT.find(m => m.tag === nr);
  if (lang) return alsZiel ? lang.ziel : lang.text;

  const zig  = p.menge * nr;
  const geld = zig * (p.preis / p.proSchachtel);

  if (nr % 365 === 0){
    // Am ersten Jahrestag stand hier "1 Jahre".
    const j = (nr / 365) + (nr === 365 ? " Jahr" : " Jahre");
    return alsZiel
      ? j + " werden voll sein — " + zahl(zig) + " Zigaretten, die es nie gegeben hat."
      : j + " rauchfrei. " + zahl(zig) + " Zigaretten, die es nie gegeben hat.";
  }
  if (nr % 30 === 0) return alsZiel
    ? Math.round(nr / 30) + " Monate werden voll sein — bis dahin " + euro(geld) + " nicht ausgegeben."
    : Math.round(nr / 30) + " Monate rauchfrei — bis hierher " + euro(geld) + " nicht ausgegeben.";
  if (nr % 7 === 0) return alsZiel
    ? "Woche " + (nr / 7) + " wird abgeschlossen sein, ohne eine einzige."
    : "Woche " + (nr / 7) + " abgeschlossen, ohne eine einzige.";

  switch (nr % 5){
    case 0: return alsZiel
      ? "Dann sind es " + zahl(zig) + " Zigaretten, die du nicht geraucht hast."
      : zahl(zig) + " Zigaretten nicht geraucht.";
    case 1: return alsZiel
      ? "Dann sind es " + euro(geld) + ", die du nicht ausgegeben hast."
      : euro(geld) + " nicht ausgegeben.";
    case 2: return alsZiel
      ? "Dann wirst du " + dauerAusMinuten(zig * 11) + " Lebenszeit zurückgerechnet haben."
      : dauerAusMinuten(zig * 11) + " Lebenszeit zurückgerechnet.";
    case 3: return alsZiel
      ? "Dann sind es " + zahl(Math.floor(zig / p.proSchachtel)) + " Schachteln, die niemand gekauft hat."
      : zahl(Math.floor(zig / p.proSchachtel)) + " Schachteln, die niemand gekauft hat.";
  }

  // Jeder fünfte Tag trifft keinen der Rechenwege. Damit dort nicht immer
  // dasselbe steht, wandert er durch diese Liste — je Fassung eine eigene.
  const erreicht = [
    "Tag " + nr + " — und es ist längst normal geworden.",
    "Deine Lunge arbeitet seit " + nr + " Tagen ohne Nachschub.",
    nr + " Tage, an denen du nicht bei Regen vor der Tür gestanden hast.",
    "Seit " + nr + " Tagen riecht nichts an dir nach Rauch.",
    nr + " Tage, in denen dein Herz in seinem eigenen Takt geschlagen hat.",
    "Seit " + nr + " Tagen hat niemand Passivrauch von dir abbekommen.",
    nr + " Tage ohne einen einzigen Umweg zum Automaten.",
    "Tag " + nr + " — die Sache ist entschieden, nicht mehr offen."
  ];
  const ziel = [
    "Tag " + nr + " — und es wird längst normal sein.",
    "Dann wird deine Lunge seit " + nr + " Tagen ohne Nachschub arbeiten.",
    "Dann sind es " + nr + " Tage, an denen du nicht bei Regen vor der Tür gestanden hast.",
    "Dann riecht seit " + nr + " Tagen nichts mehr an dir nach Rauch.",
    "Dann sind es " + nr + " Tage, in denen dein Herz im eigenen Takt geschlagen hat.",
    "Dann wird seit " + nr + " Tagen niemand Passivrauch von dir abbekommen haben.",
    "Dann sind es " + nr + " Tage ohne einen einzigen Umweg zum Automaten.",
    "Tag " + nr + " — die Sache wird entschieden sein, nicht mehr offen."
  ];
  return (alsZiel ? ziel : erreicht)[Math.floor(nr / 5) % 8];
}

/** Drei Zustände, und die Unterscheidung ist wichtig:
    „läuft“  — der Tag, in dem man gerade steckt. Offener Ring, noch nicht
               abgehakt. Der Text steht schon da, damit man sieht, worauf
               der Tag hinausläuft.
    „da“     — abgeschlossen, volle 24 Stunden vorbei. Gefüllter Punkt.
    „kommt“  — Ausblick auf morgen.

    `fertig` ist die Zahl vollständig abgeschlossener Tage. Vorher wurde der
    laufende Tag als erledigt markiert; dadurch stand „Eine ganze Woche“
    schon nach sechs Tagen und 23 Stunden da, also bevor es stimmte. */
function tageZeichnen(fertig, p, frischNr){
  const liste = $("tage");

  /* Solange nichts freigeschaltet ist, verschwindet der ganze Abschnitt —
     Überschrift, Trennstrich und Liste. Vorher stand hier eine leere
     Kategorie mit einem einzelnen Hinweissatz darunter, und der Satz lag
     als Listeneintrag im Raster von .meilen, also in der 20-Pixel-Spalte
     für den Punkt: ein Wort je Zeile. Was der Tag bringt, steht ohnehin
     schon in der Karte „Als Nächstes“ weiter oben. */
  const zeigen = fertig >= 1;
  $("titelFrei").hidden = !zeigen;
  liste.hidden           = !zeigen;
  $("tageDavor").hidden  = !zeigen;

  if (!zeigen){
    liste.innerHTML = "";
    $("tageDavor").textContent = "";
    $("anzahlFrei").textContent = "";
    return;
  }

  const zeilen = [];
  for (let n = fertig; n >= Math.max(1, fertig - 5); n--) zeilen.push(n);

  liste.innerHTML = zeilen.map(n => `
      <li class="da${n === frischNr ? " frisch" : ""}">
        <span class="punkt"></span>
        <span class="was">${esc(tagesText(n, p))}</span>
        <span class="wann">Tag ${n}</span>
      </li>`).join("");

  $("tageDavor").textContent = fertig > 6
    ? "und " + zahl(fertig - 6) + " weitere davor"
    : "";
  $("anzahlFrei").textContent = fertig === 1 ? "· 1 Tag" : "· " + zahl(fertig) + " Tage";
}

/* ---------------------------------------------------------------------
   Erfolge — ein Block für den ersten Monat und die langen Marken
   ---------------------------------------------------------------------
   Vorher zwei Abschnitte: „Trophäen“ über zehn Jahre und „Die ersten 30
   Tage“. Tag 1, Tag 3, eine Woche, zwei Wochen und ein Monat kamen darin
   beide Male vor. Jetzt einer: die Bänder deckern den ersten Monat ab, die
   Chips darunter alles, was danach kommt.

   Jedes Feld ist antippbar. Angezeigt wird dann, was am Ende dieses Tages
   zusammengekommen ist — nicht geraucht und nicht ausgegeben, gerechnet mit
   den eigenen Einstellungen. Zweites Antippen hebt die Auswahl auf.
   --------------------------------------------------------------------- */

const BAENDER = [
  { kopf:"W1", von: 1, bis: 7 },
  { kopf:"W2", von: 8, bis:14 },
  { kopf:"W3", von:15, bis:21 },
  { kopf:"W4", von:22, bis:28 },
  { kopf:"M",  von:29, bis:30 }
];
const BAND_BREIT = 7;

/* Nur die Marken jenseits des ersten Monats — alles darunter steckt schon in
   den Bändern. Genau diese Dopplung war der Grund für den Umbau. */
const ferne = () => TROPHAEEN.filter(t => t.ms > 30 * TAG);

/** Der Name, unter dem ein Tag oder eine Marke angesprochen wird. */
function erfolgName(nr){
  if (nr >= 1 && nr <= TAGESTROPHAEEN.length)
    return "Tag " + nr + " · " + TAGESTROPHAEEN[nr - 1].titel;
  const t = TROPHAEEN.find(x => Math.round(x.ms / TAG) === nr);
  return t ? t.kurz : "Tag " + nr;
}


function erfolgAntwort(verstrichen){
  const kasten = $("erfolgAntwort");
  const fertig = Math.floor(verstrichen / TAG);
  const hinweis = '<span class="tipp">Tipp auf ein Feld — dann steht da, was an dem Tag zusammengekommen ist.</span>';

  if (fertig < TAGESTROPHAEEN.length){
    const t = TAGESTROPHAEEN[fertig];      // der laufende Tag
    kasten.innerHTML = "<b>Als Nächstes: Tag " + (fertig + 1) + " — " + esc(t.titel)
      + ".</b><br>" + esc(t.was) + hinweis;
    return;
  }
  const t = ferne().find(x => verstrichen < x.ms);
  kasten.innerHTML = t
    ? "<b>Als Nächstes: " + esc(t.kurz) + ".</b><br>" + esc(t.was) + hinweis
    : "<b>Alles geholt.</b><br>Mehr Marken habe ich nicht vorgesehen." + hinweis;
}

function erfolgeZeichnen(verstrichen, frischNr){
  const fertig  = Math.floor(verstrichen / TAG);
  const laufend = fertig + 1;
  let h = "";

  BAENDER.forEach(b => {
    const voll   = fertig >= b.bis;
    const frisch = frischNr && frischNr === b.bis;
    let segs = "";
    for (let n = b.von; n <= b.bis; n++){
      const zustand = fertig >= n ? "da" : n === laufend ? "jetzt" : "zu";
      segs += '<button type="button" class="seg ' + zustand
            + '" data-tag="' + n
            + '" aria-label="Tag ' + n + '"><i></i></button>';
    }
    for (let f = b.bis - b.von + 1; f < BAND_BREIT; f++)
      segs += '<span class="seg leer"><i></i></span>';

    h += '<div class="bz' + (voll ? " voll" : "") + (frisch ? " frisch" : "") + '">'
       + '<span class="bz-kopf">' + b.kopf + "</span>"
       + '<span class="bz-band">' + segs + "</span>"
       + '<span class="bz-stern">' + (voll ? "★" : "·") + "</span></div>";
  });

  h += '<div class="fern-kopf">Danach</div><div class="fern">';
  ferne().forEach(t => {
    const tage = Math.round(t.ms / TAG);
    h += '<button type="button" class="' + (verstrichen >= t.ms ? "da" : "")
       + '" data-tag="' + tage
       + '">' + esc(t.kurz) + "</button>";
  });
  h += "</div>";

  $("erfolge").innerHTML = h;

  const wochen = Math.min(Math.floor(fertig / 7), 4);
  $("erfolgZahl").textContent = "· " + Math.min(fertig, 30) + " von 30 Tagen"
    + (wochen ? " · " + wochen + (wochen === 1 ? " Woche" : " Wochen") : "");

  erfolgAntwort(verstrichen);
}

/* Ein Zuhörer für alle Felder und Chips. Beim Neuzeichnen verschwinden die
   Knöpfe, ein Zuhörer je Knopf wäre also jedes Mal neu zu setzen. */
$("erfolge").addEventListener("click", e => {
  const knopf = e.target.closest("[data-tag]");
  if (!knopf) return;
  tagfensterAuf(parseInt(knopf.dataset.tag, 10));
});

/* ---------- Standhaft-Trophäen ---------- */
function wellenZeichnen(){
  // „7 Tage Ruhe“ gilt, sobald eine Woche seit dem letzten Knopfdruck vergangen
  // ist. Einmal erreicht, bleibt es stehen — eine Trophäe, die wieder
  // verschwindet, gibt es in keinem Spiel.
  if (!profil.ruheErreicht && (profil.wellen || 0) > 0 && profil.letzteWelle
      && Date.now() - profil.letzteWelle >= 7 * TAG){
    profil.ruheErreicht = true;
    sichern();
  }

  const naechste = WELLEN.findIndex(t => !t.hat(profil));

  $("wellen").innerHTML = WELLEN.map((t, i) => {
    const da   = t.hat(profil);
    const dran = i === naechste;
    return `<li class="${da ? "geholt" : dran ? "dran" : "zu"}" style="--verzug:${(i * 0.18).toFixed(2)}s">
        <span class="tr-scheibe">${da ? "★" : ""}</span>
        <span class="tr-name">${esc(t.n)}</span>
      </li>`;
  }).join("");

  const anzahl = profil.wellen || 0;
  $("wellenZahl").textContent = "· " + (anzahl === 1 ? "1 Welle" : zahl(anzahl) + " Wellen");

  const t = naechste === -1 ? null : WELLEN[naechste];
  $("wellenText").textContent = anzahl === 0
    ? "Noch keine. Wenn dich das Verlangen packt, drück unten rechts und halte durch — genau das zählt hier."
    : t ? "Als Nächstes: " + t.n + " — " + t.was
        : "Alles geholt. Mehr habe ich nicht vorgesehen.";
}

/* ---------- Was das gesparte Geld wert ist ---------- */
const grossErst = s => s.charAt(0).toUpperCase() + s.slice(1);

function kaufkraft(geld, ausser){
  const drin = PREISE.filter(x => x.p <= geld);

  // „bis ein Brötchen“ wäre falscher Kasus. Mit „dann ist … drin“ passt die
  // Nominativform aus der Liste, und zwar für Dinge wie für Unternehmungen.
  const dannDrin = (fehlbetrag, sache) =>
    "Noch " + euro(fehlbetrag) + ", dann ist " + sache + " drin.";

  if (!drin.length){
    const erstes = PREISE[0];
    return {
      reicht: "Noch für nichts auf der Liste.",
      witz:   "Aber der Tag ist jung.",
      oder:   "",
      fehlt:  dannDrin(erstes.p - geld, erstes.e)
    };
  }

  // Nicht stur das teuerste Ding nehmen — dann käme bei 8,66 € immer die
  // Currywurst. Stattdessen alles, was mindestens halb so teuer ist wie das
  // teuerste Bezahlbare, und daraus ziehen. Sind es zu wenige, nehmen wir die
  // sechs teuersten dazu.
  const hoechster = drin[drin.length - 1].p;
  let kandidaten  = drin.filter(x => x.p >= hoechster * 0.5);
  if (kandidaten.length < 4) kandidaten = drin.slice(-6);

  // Nicht zweimal hintereinander dasselbe, sofern es eine Alternative gibt.
  const auswahl = kandidaten.filter(x => x !== ausser);
  const topf    = auswahl.length ? auswahl : kandidaten;
  const bestes  = topf[Math.floor(Math.random() * topf.length)];
  const anzahl  = Math.floor(geld / bestes.p);

  // Für die Oder-Zeile eine der billigsten Sachen, aber nicht immer dieselbe.
  // Erst prüfen, bei welchen die Menge überhaupt absurd wird, dann ziehen —
  // sonst fällt die Zeile aus, nur weil zufällig das teuerste Kleinding kam.
  const billige = PREISE.slice(0, 6)
    .filter(x => x !== bestes && Math.floor(geld / x.p) >= 8);
  let oder = "";
  if (billige.length){
    const billig = billige[Math.floor(Math.random() * billige.length)];
    oder = "Oder " + zahl(Math.floor(geld / billig.p)) + " " + billig.v + ".";
  }

  const naechstes = PREISE.find(x => x.p > geld);

  return {
    gewaehlt:   bestes,
    kandidaten: kandidaten,
    reicht: anzahl === 1 ? grossErst(bestes.e) : zahl(anzahl) + " " + bestes.v,
    witz:   bestes.w || oder,
    oder:   bestes.w ? oder : "",
    fehlt:  naechstes
      ? dannDrin(naechstes.p - geld, naechstes.e)
      : "Auf der ganzen Liste steht nichts mehr, das du dir nicht leisten könntest."
  };
}

/* Die Ziehung. Statt das Ergebnis einfach hinzuschreiben, flackert es erst
   durch die Kandidaten und wird dabei langsamer — wie beim Öffnen eines
   Päckchens. Der Treffer rastet mit einem Lichtwisch ein. */
let zieht = false;
let letzteWahl = null;

$("bWofuer").onclick = () => {
  if (zieht) return;

  const k = kaufkraft(rechnen(profil).geld, letzteWahl);
  letzteWahl = k.gewaehlt || null;

  const kasten = $("wofuer");
  kasten.hidden = false;
  kasten.innerHTML = `
    <div class="wf-kopf">Dafür reicht es</div>
    <div class="wf-haupt" id="wfHaupt"></div>
    <div id="wfRest"></div>`;
  $("bWofuer").textContent = "Was kriege ich sonst noch dafür?";

  const aufdecken = () => {
    const h = $("wfHaupt");
    h.className = "wf-haupt treffer";
    h.textContent = k.reicht;
    $("wfRest").innerHTML =
      (k.witz ? `<p class="wf-witz">${esc(k.witz)}</p>` : "") +
      (k.oder ? `<p class="wf-oder">${esc(k.oder)}</p>` : "") +
      /* Den Betrag hervorheben. Die Ersetzung läuft auf dem bereits
         entschärften Text — Ziffern, Komma und das Eurozeichen bleiben davon
         unberührt, es lässt sich darüber also nichts einschleusen. */
      `<p class="wf-fehlt">${esc(k.fehlt).replace(/(\d[\d.,]*\s*€)/, "<b>$1</b>")}</p>`;

    /* Klasse wieder abnehmen. Der Wisch blendet zwar selbst aus, aber ohne
       das Abnehmen ließe er sich beim nächsten Zug nicht neu starten. */
    kasten.classList.remove("zieht");
    zieht = false;
  };

  const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ruhig || !k.kandidaten || k.kandidaten.length < 2){
    aufdecken();
    return;
  }

  zieht = true;
  kasten.classList.remove("zieht");
  void kasten.offsetWidth;          // erzwingt den Neustart der Animation
  kasten.classList.add("zieht");

  const h = $("wfHaupt");
  h.className = "wf-haupt flackert";
  let i = 0;
  const schritt = () => {
    const kand = k.kandidaten[Math.floor(Math.random() * k.kandidaten.length)];
    h.textContent = grossErst(kand.e);
    i++;
    if (i < 13) setTimeout(schritt, 40 + i * i * 1.6);   // wird spürbar langsamer
    else aufdecken();
  };
  schritt();
};


let letzterAbschluss = -1;

function abschlussSatz(){
  let i;
  do { i = Math.floor(Math.random() * ABSCHLUSS.length); }
  while (i === letzterAbschluss && ABSCHLUSS.length > 1);
  letzterAbschluss = i;
  return ABSCHLUSS[i];
}

/** Der eigene Stand, in Zahlen, die genau jetzt zählen. */
function krisenStand(){
  const w = rechnen(profil);
  // Nach „seit“ steht der Dativ: seit einem Tag, seit drei Tagen, seit einer
  // Stunde. Und eine Einheit, die null ist, wird weggelassen — „seit 200
  // Tagen und 0 Stunden“ liest sich wie eine Maschinenausgabe.
  const tageT = w.tage    === 1 ? "einem Tag"   : zahl(w.tage) + " Tagen";
  const stdT  = w.stunden === 1 ? "einer Stunde" : w.stunden + " Stunden";
  const minT  = w.minuten === 1 ? "einer Minute" : w.minuten + " Minuten";

  const zeit = w.tage > 0
    ? tageT + (w.stunden ? " und " + stdT : "")
    : w.stunden
      ? stdT + (w.minuten ? " und " + minT : "")
      : minT;
  return "Du bist seit <b>" + zeit + "</b> rauchfrei, hast <b>"
    + zahl(Math.floor(w.nichtGeraucht)) + "</b> Zigaretten nicht geraucht und <b>"
    + euro(w.geld) + "</b> nicht ausgegeben."
    + (profil.wellen > 0
        ? "<br>Und du hast das hier schon <b>" + profil.wellen + "-mal</b> geschafft."
        : "")
    + "<br>" + abschlussSatz();
}

/* ====================================================================
   Atemklang — Musik zum Ein- und Ausatmen
   --------------------------------------------------------------------
   Hier wird keine Audiodatei geladen. Der Ton entsteht im Browser selbst,
   Schwingung für Schwingung. Das hat drei Gründe: es gibt nichts, was
   ausgeliefert werden müsste, der Klang folgt dem Atem auf die
   Millisekunde genau, und es geht kein einziger Aufruf an einen fremden
   Server — dieselbe Regel wie auf dem Rest der Seite.

   Wie die Musik gebaut ist
   ------------------------
   Unten liegt ein Bordun auf D, der durchläuft und sich nie ändert. Er
   ist der Boden, auf dem geatmet wird.

   Darüber vier Akkorde, einer je Atemzug. Nach vierzig Sekunden fängt die
   Folge von vorn an — lang genug, dass man sie nicht mitzählt. Alle vier
   stehen gut über dem D, und von einem zum nächsten bewegt sich jede
   Stimme höchstens einen Ganzton. Deshalb gleiten die Töne ineinander,
   statt umzuschalten.

   Der Atem steckt nicht in der Melodie, sondern im Klang. Beim Einatmen
   öffnet sich ein Filter, der Akkord wird heller und voller, eine hohe
   Stimme kommt dazu. Beim Ausatmen geht alles zurück — über sechs
   Sekunden statt über vier, also spürbar langsamer. Man hört, wo im
   Atemzug man ist, ohne auf den Kreis zu sehen. Das ist der eigentliche
   Zweck: Augen zu, und die Anleitung läuft trotzdem weiter.
   ==================================================================== */

/* Frequenzen in Hertz, vier Stimmen je Akkord.
   d-Moll mit None, B-Dur-Septime, F-Dur-Septime, a-Moll-Septime.
   Wer nachrechnet, sieht es: von Zeile zu Zeile ändert sich je Stimme
   höchstens ein Ganzton. Genau das macht den Wechsel unauffällig. */
const AKKORDE = [
  [293.66, 349.23, 440.00, 659.25],
  [293.66, 349.23, 466.16, 587.33],
  [261.63, 349.23, 440.00, 659.25],
  [261.63, 329.63, 440.00, 659.25]
];

const EIN = 4, AUS = 6, ZYKLUS = EIN + AUS;   // Sekunden, wie beim Kreis

let klang = null;         // wird erst gebaut, wenn jemand den Ton anschaltet
let klangPlaner = null;   // plant die Atemzüge im Voraus ein

/* Weiche Kurve statt gerader Rampe. Web Audio kennt nur gerade und
   exponentielle Rampen; acht kurze Stücke entlang einer Kosinuskurve
   ergeben ein sauberes Anschwellen und Abklingen. Anders als
   setValueCurveAtTime können sie sich mit dem nächsten Atemzug nicht
   beißen — und das wäre hier ein Aussetzer mitten im Ton. */
function kurve(regler, ab, von, nach, dauer, exponentiell){
  const STUFEN = 8;
  regler.setValueAtTime(von, ab);
  for (let i = 1; i <= STUFEN; i++){
    const anteil = i / STUFEN;
    const weich  = (1 - Math.cos(Math.PI * anteil)) / 2;
    const wert   = exponentiell ? von * Math.pow(nach / von, weich)
                                : von + (nach - von) * weich;
    if (exponentiell) regler.exponentialRampToValueAtTime(Math.max(wert, 0.0001), ab + dauer * anteil);
    else              regler.linearRampToValueAtTime(wert, ab + dauer * anteil);
  }
}

/* Nachhall ohne Datei: ein Rauschimpuls, der exponentiell leiser wird, ist
   die einfachste brauchbare Raumantwort. Zwei Kanäle mit unterschiedlichem
   Rauschen, damit der Raum breit steht statt in der Mitte zu kleben. */
function hallRaum(ctx, sekunden, abfall){
  const laenge = Math.floor(ctx.sampleRate * sekunden);
  const puffer = ctx.createBuffer(2, laenge, ctx.sampleRate);
  for (let k = 0; k < 2; k++){
    const daten = puffer.getChannelData(k);
    for (let i = 0; i < laenge; i++){
      daten[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / laenge, abfall);
    }
  }
  return puffer;
}

function klangBauen(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  let ctx;
  try { ctx = new AC(); } catch(e){ return null; }

  // Ausgang. Der Begrenzer dahinter ist nur ein Netz: bei elf gleichzeitigen
  // Schwingungen soll nichts übersteuern, auch wenn ich mich verrechne.
  const meister = ctx.createGain();
  meister.gain.value = 0;
  const schutz = ctx.createDynamicsCompressor();
  schutz.threshold.value = -3;
  schutz.knee.value      = 8;
  schutz.ratio.value     = 10;
  schutz.attack.value    = 0.02;
  schutz.release.value   = 0.35;
  meister.connect(schutz);
  schutz.connect(ctx.destination);

  const hall = ctx.createConvolver();
  hall.buffer = hallRaum(ctx, 3.4, 2.6);
  const hallDaempfer = ctx.createBiquadFilter();
  hallDaempfer.type = "lowpass";
  hallDaempfer.frequency.value = 2200;
  const hallWeg = ctx.createGain();
  hallWeg.gain.value = 0.5;
  hallWeg.connect(hall);
  hall.connect(hallDaempfer);
  hallDaempfer.connect(meister);

  /* --- Bordun. Läuft durch und atmet nicht mit. Dass etwas ruhig bleibt,
     während sich darüber alles bewegt, ist die halbe Wirkung. --- */
  const bordunFilter = ctx.createBiquadFilter();
  bordunFilter.type = "lowpass";
  bordunFilter.frequency.value = 400;
  const bordunTor = ctx.createGain();
  bordunTor.gain.value = 0.30;
  bordunFilter.connect(bordunTor);
  bordunTor.connect(meister);

  [[73.42, 0.50], [146.83, 0.26], [220.00, 0.05]].forEach(paar => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = paar[0];
    const g = ctx.createGain();
    g.gain.value = paar[1];
    o.connect(g);
    g.connect(bordunFilter);
    o.start();
  });

  /* --- Akkord. Der atmet mit: Filter auf beim Einatmen, Filter zu beim
     Ausatmen. --- */
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.Q.value = 0.9;
  padFilter.frequency.value = 260;
  const padTor = ctx.createGain();
  padTor.gain.value = 0.22;
  padFilter.connect(padTor);
  padTor.connect(meister);
  padTor.connect(hallWeg);

  /* Jede Stimme doppelt, sieben Cent auseinander, eine nach links und eine
     nach rechts. Zwei fast gleiche Töne schweben langsam ineinander — das
     ist der Unterschied zwischen einem Testton und etwas, das man drei
     Minuten lang aushält. */
  const stimmen = AKKORDE[0].map((hz, i) => {
    const oszillatoren = [-7, 7].map(cent => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = hz;
      o.detune.value = cent;
      const g = ctx.createGain();
      g.gain.value = i === 3 ? 0.09 : 0.15;   // die oberste Stimme bleibt zurück
      o.connect(g);
      if (ctx.createStereoPanner){
        const p = ctx.createStereoPanner();
        p.pan.value = cent < 0 ? -0.4 : 0.4;
        g.connect(p);
        p.connect(padFilter);
      } else {
        g.connect(padFilter);   // ältere Browser: dann eben in der Mitte
      }
      o.start();
      return o;
    });
    return { oszillatoren: oszillatoren, hz: hz };
  });

  /* --- Schimmer. Kommt nur beim Einatmen dazu, eine Oktave über dem
     Akkord, und geht fast ganz in den Hall. Dadurch klingt das Einatmen
     weiter, als der Raum ist, und das Ausatmen zieht sich wieder
     zusammen. --- */
  const schimmerTor = ctx.createGain();
  schimmerTor.gain.value = 0;
  schimmerTor.connect(hallWeg);
  const schimmerTrocken = ctx.createGain();
  schimmerTrocken.gain.value = 0.3;
  schimmerTor.connect(schimmerTrocken);
  schimmerTrocken.connect(meister);

  const schimmer = [AKKORDE[0][2] * 2, AKKORDE[0][3] * 2].map((hz, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.value = i ? 0.045 : 0.065;
    o.connect(g);
    g.connect(schimmerTor);
    o.start();
    return o;
  });

  return { ctx: ctx, meister: meister, hallWeg: hallWeg,
           padFilter: padFilter, padTor: padTor, schimmerTor: schimmerTor,
           stimmen: stimmen, schimmer: schimmer, naechster: 0, nr: 0 };
}

/* Ein Anschlag zu jedem Einatmen — für alle, die die Augen zumachen. Drei
   leicht verstimmte Teiltöne, weil eine reine Oktave elektronisch klingt
   und eine Glocke nie ganz sauber ist. Sehr leise: nach drei Minuten sind
   das achtzehn Anschläge, und keiner davon soll auffallen. */
function anschlag(t, grundton){
  const ctx = klang.ctx;
  [[1, 0.070], [2.01, 0.026], [3.02, 0.011]].forEach(paar => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = grundton * paar[0];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(paar[1], t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    o.connect(g);
    g.connect(klang.meister);
    g.connect(klang.hallWeg);
    o.start(t);
    o.stop(t + 3.8);
  });
}

/* Ein vollständiger Atemzug, im Voraus in die Web-Audio-Uhr geschrieben. */
function zyklusPlanen(t, nr){
  const akkord = AKKORDE[nr % AKKORDE.length];

  // Akkordwechsel: die Stimmen gleiten in anderthalb Sekunden hinüber.
  klang.stimmen.forEach(function(stimme, i){
    stimme.oszillatoren.forEach(function(o){
      o.frequency.setValueAtTime(stimme.hz, t);
      o.frequency.exponentialRampToValueAtTime(akkord[i], t + 1.5);
    });
    stimme.hz = akkord[i];
  });
  [akkord[2] * 2, akkord[3] * 2].forEach(function(hz, i){
    const o = klang.schimmer[i];
    o.frequency.setValueAtTime(o.frequency.value, t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 1.5);
  });

  // Einatmen, vier Sekunden: Filter auf, Akkord voller, Schimmer kommt.
  kurve(klang.padFilter.frequency, t, 260,  2400, EIN, true);
  kurve(klang.padTor.gain,         t, 0.22, 1.00, EIN, false);
  kurve(klang.schimmerTor.gain,    t, 0.00, 1.00, EIN, false);

  // Ausatmen, sechs Sekunden: alles zurück, und zwar merklich langsamer.
  kurve(klang.padFilter.frequency, t + EIN, 2400, 260,  AUS, true);
  kurve(klang.padTor.gain,         t + EIN, 1.00, 0.22, AUS, false);
  kurve(klang.schimmerTor.gain,    t + EIN, 1.00, 0.00, AUS, false);

  anschlag(t, akkord[0] * 2);
}

/* Immer gut zwei Sekunden im Voraus planen. Die Web-Audio-Uhr läuft
   unabhängig vom Bildschirm; dadurch bleibt der Atem im Takt, auch wenn
   der Browser gerade mit etwas anderem beschäftigt ist. Ein Zeitgeber, der
   den Ton direkt erzeugt, würde bei jedem Ruckler hörbar stolpern. */
function planen(){
  if (!klang) return;
  while (klang.naechster < klang.ctx.currentTime + 2.5){
    zyklusPlanen(klang.naechster, klang.nr);
    klang.naechster += ZYKLUS;
    klang.nr++;
  }
}

function klangStarten(){
  if (!klang) klang = klangBauen();
  if (!klang) return false;

  const ctx = klang.ctx;
  if (ctx.state === "suspended") ctx.resume();
  const jetzt = ctx.currentTime;

  // Alles Geplante von einem früheren Durchgang wegräumen, sonst laufen
  // zwei Atemzüge gegeneinander.
  clearInterval(klangPlaner);
  [klang.padFilter.frequency, klang.padTor.gain, klang.schimmerTor.gain]
    .forEach(function(r){ r.cancelScheduledValues(jetzt); });
  klang.padFilter.frequency.setValueAtTime(260, jetzt);
  klang.padTor.gain.setValueAtTime(0.22, jetzt);
  klang.schimmerTor.gain.setValueAtTime(0, jetzt);
  klang.stimmen.forEach(function(s, i){
    s.hz = AKKORDE[0][i];
    s.oszillatoren.forEach(function(o){
      o.frequency.cancelScheduledValues(jetzt);
      o.frequency.setValueAtTime(s.hz, jetzt);
    });
  });

  klang.nr = 0;
  klang.naechster = jetzt + 0.25;

  // Über anderthalb Sekunden aufblenden. Ein Ton, der sofort in voller
  // Lautstärke da ist, erschreckt genau in dem Moment, in dem jemand ruhig
  // werden soll.
  klang.meister.gain.cancelScheduledValues(jetzt);
  klang.meister.gain.setValueAtTime(0.0001, jetzt);
  klang.meister.gain.linearRampToValueAtTime(0.22, jetzt + 1.5);

  planen();
  klangPlaner = setInterval(planen, 500);
  return true;
}

function klangStoppen(){
  clearInterval(klangPlaner);
  klangPlaner = null;
  if (!klang) return;

  const ctx = klang.ctx, jetzt = ctx.currentTime;
  klang.meister.gain.cancelScheduledValues(jetzt);
  klang.meister.gain.setValueAtTime(Math.max(klang.meister.gain.value, 0.0001), jetzt);
  klang.meister.gain.linearRampToValueAtTime(0.0001, jetzt + 1.1);

  // Danach anhalten statt abbauen: einen Klangkontext bekommt man pro Seite
  // nur ein paar Mal, und beim nächsten Öffnen soll der Ton sofort da sein.
  setTimeout(function(){
    if (klang && klang.ctx.state === "running") klang.ctx.suspend();
  }, 1300);
}

/* Kreis, Wort und Musik auf denselben Start setzen. Wer den Ton mitten im
   Ausatmen einschaltet, würde sonst gegen die Musik atmen. Der Kreis läuft
   über eine CSS-Animation, und die lässt sich nur neu anstoßen, indem man
   sie kurz abschaltet und einen Neuaufbau erzwingt. */
function atemNeuStarten(){
  kriseAtemStart = Date.now();
  $("krAtemWort").textContent = "Einatmen";
  const kreis = document.querySelector(".kr-kreis");
  if (kreis){
    kreis.style.animation = "none";
    void kreis.offsetWidth;
    kreis.style.animation = "";
  }
}

function tonKnopfZeichnen(){
  const an = !!profil.ton;
  $("bTon").setAttribute("aria-pressed", an ? "true" : "false");
  $("tonWort").textContent = an ? "Ton an" : "Ton aus";
}

/* Der Ton bleibt gemerkt. Wer ihn einmal anschaltet, bekommt ihn beim
   nächsten Mal sofort — das Fenster geht immer über einen Knopfdruck auf,
   und nur deshalb darf der Browser überhaupt Ton abspielen. */
function tonUmschalten(){
  if (profil.ton){
    klangStoppen();
    profil.ton = false;
  } else {
    if (!klangStarten()){
      $("tonWort").textContent = "Geht hier nicht";
      return;
    }
    profil.ton = true;
    atemNeuStarten();
  }
  sichern();
  tonKnopfZeichnen();
}

let kriseUhr = null, kriseAtem = null, kriseEnde = 0, letzterFakt = -1;
let kriseAtemStart = 0;   // Beginn des laufenden Atemzugs, geteilt von Wort, Kreis und Ton
let kriseSeit = 0;   // wann das Fenster aufging — daraus wird die Welle gezaehlt

function faktZeigen(){
  let i;
  do { i = Math.floor(Math.random() * KRISE.length); }
  while (i === letzterFakt && KRISE.length > 1);
  letzterFakt = i;
  $("krFakt").textContent = KRISE[i];

  // Ein Grund allein sagt nur, warum nicht. Der Vorschlag sagt, was
  // stattdessen — und das ist in dem Moment die nuetzlichere Haelfte.
  const s = ausBeutel(stKrBeutel, akutNummern());
  $("krStatt").innerHTML = "<b>Mach doch lieber:</b> " + esc(s.t);
}

function kriseAuf(){
  kriseSeit = Date.now();
  profil.letzteWelle = kriseSeit;
  sichern();
  $("krise").hidden = false;
  $("krStand").innerHTML = krisenStand();
  $("krTitel").textContent = "Drei Minuten. Mehr will ich nicht.";
  faktZeigen();

  tonKnopfZeichnen();
  if (profil.ton) klangStarten();

  kriseEnde = Date.now() + 3 * MIN;
  kriseAtemStart = Date.now();

  clearInterval(kriseUhr);
  kriseUhr = setInterval(() => {
    const rest = kriseEnde - Date.now();
    if (rest <= 0){
      $("krUhr").textContent = "vorbei";
      $("krTitel").textContent = "Geschafft. Die Welle ist durch.";
      clearInterval(kriseUhr);
      return;
    }
    const m = Math.floor(rest / MIN), s = Math.floor((rest % MIN) / 1000);
    $("krUhr").textContent = m + ":" + zz(s);
  }, 250);

  clearInterval(kriseAtem);
  kriseAtem = setInterval(() => {
    // vier Sekunden ein, sechs aus — dieselbe Kurve wie die Animation
    $("krAtemWort").textContent =
      ((Date.now() - kriseAtemStart) % 10000) < 4000 ? "Einatmen" : "Ausatmen";
  }, 200);
}

function kriseZu(){
  $("krise").hidden = true;
  klangStoppen();
  clearInterval(kriseUhr);
  clearInterval(kriseAtem);
}

$("bKrise").onclick     = kriseAuf;
/* „Geht wieder“ zählt die Welle. Die zehn Sekunden Mindestdauer verhindern
   nur, dass ein versehentlicher Doppeltipp als überstandene Welle gilt —
   sie sind keine Prüfung, sondern ein Filter gegen Rutschfinger. */
$("bKriseWeg").onclick = () => {
  const dauer = Date.now() - kriseSeit;

  if (dauer >= 10000){
    profil.wellen = (profil.wellen || 0) + 1;
    const std = new Date().getHours();
    if (std >= 22 || std < 5) profil.wellenNacht = (profil.wellenNacht || 0) + 1;
    sichern();

    // Der Moment der Belohnung: kurz stehen lassen, dann schließen.
    $("krTitel").textContent = "Welle überstanden.";
    $("krFakt").textContent = profil.wellen === 1
      ? "Das war die erste. Jede weitere fällt leichter, weil du jetzt weißt, dass sie vorbeigeht."
      : "Das war die " + profil.wellen + ". Du weißt inzwischen, wie das geht.";
    $("krStand").innerHTML = "";
    wellenZeichnen();
    setTimeout(kriseZu, 2200);
    return;
  }
  kriseZu();
};
$("bStatt").onclick = stattZeichnen;
$("bTon").onclick = tonUmschalten;

$("bKriseNoch").onclick = faktZeigen;

$("bKriseGeraucht").onclick = () => {
  if (!confirm("Rückfall eintragen? Der Zähler beginnt neu, deine längste rauchfreie Zeit bleibt gespeichert.")) return;
  rueckfallEintragen();
  kriseZu();
};

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("krise").hidden) kriseZu();
});

/** Der Countdown auf die nächste Freischaltung. Läuft im Sekundentakt und
    ist der einzige Ort, an dem etwas Zukünftiges steht — deshalb formuliert
    als Versprechen, nicht als Zustand. */
function naechstesZeichnen(w){
  const imTag  = w.verstrichen % TAG;          // seit der letzten Freischaltung
  const restMs = TAG - imTag;
  const std = Math.floor(restMs / STD);
  const min = Math.floor((restMs % STD) / MIN);
  const sek = Math.floor((restMs % MIN) / 1000);

  $("cdZeit").textContent = std > 0
    ? `${std} Std. ${zz(min)} Min. ${zz(sek)} Sek.`
    : `${min} Min. ${zz(sek)} Sek.`;

  const feld = $("cdSegmente");
  if (feld.childElementCount !== 24){
    feld.innerHTML = "<i></i>".repeat(24);
  }

  const voll   = Math.floor(imTag / STD);            // abgeschlossene Stunden
  const anteil = ((imTag % STD) / STD) * 100;        // Füllung der laufenden

  for (let i = 0; i < 24; i++){
    const seg  = feld.children[i];
    const soll = i < voll ? "an" : (i === voll ? "jetzt" : "");
    if (seg.className !== soll) seg.className = soll;

    if (i === voll){
      const p = anteil.toFixed(1) + "%";
      seg.style.background = `linear-gradient(90deg, var(--air) ${p}, var(--surface-2) ${p})`;
    } else if (seg.style.background){
      seg.style.background = "";
    }
  }
  $("cdStunden").textContent = voll;
}

/* ---------- Einstellungen ---------- */
function einstellungenFuellen(){
  $("eStart").value = inFeld(profil.start);
  $("eStart").max = inFeld(Date.now());
  $("eMenge").value = profil.menge;
  $("ePreis").value = profil.preis;
  $("eProSchachtel").value = profil.proSchachtel;
}

$("bSpeichern").onclick = () => {
  const fehler = $("eFehler");
  const grenze = (el, vorher) => {
    const lo = parseFloat(el.min), hi = parseFloat(el.max);
    const n = parseFloat(el.value);
    return Number.isNaN(n) ? vorher : Math.min(hi, Math.max(lo, n));
  };
  const start = ausFeld($("eStart").value) ?? profil.start;
  if (start > Date.now()){ fehler.textContent = "Das liegt in der Zukunft."; return; }

  profil.start = start;
  profil.menge = Math.round(grenze($("eMenge"), profil.menge));
  profil.preis = grenze($("ePreis"), profil.preis);
  profil.proSchachtel = Math.round(grenze($("eProSchachtel"), profil.proSchachtel));
  einstellungenFuellen();
  sichern();
  zeichnen();
  fehler.textContent = "Gespeichert.";
  setTimeout(() => { fehler.textContent = ""; }, 2500);
};

/* Wird von zwei Stellen gerufen: aus den Einstellungen und aus dem
   Krisenfenster. Deshalb ohne eigene Rückfrage — die stellt der Aufrufer. */
function rueckfallEintragen(){
  const w = rechnen(profil);
  profil.beste = Math.max(profil.beste || 0, w.verstrichen);
  profil.rueckfaelle = (profil.rueckfaelle || 0) + 1;
  profil.start = Date.now();   // ab diesem Augenblick, nicht ab Mitternacht
  profil.gesehenerTag = 0;     // sonst bliebe die Feier für Tag 1 bis zum alten Stand aus
  einstellungenFuellen();
  sichern();
  letzterTag = -1;
  zeichnen();
}

$("bRueckfall").onclick = () => {
  const w = rechnen(profil);
  if (!confirm("Zähler ab jetzt neu starten? Deine längste rauchfreie Zeit von "
      + Math.floor(w.verstrichen / TAG) + " Tagen bleibt gespeichert.")) return;
  rueckfallEintragen();
};

/* ---------- Daten mitnehmen ---------- */
$("bExport").onclick = () => {
  const inhalt = JSON.stringify({ art:"scarnet-rauchfrei", fassung:1, profil }, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([inhalt], { type:"application/json" }));
  a.download = "rauchfrei-" + datumKurz(Date.now()) + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

$("bImport").onclick = () => $("fImport").click();
$("fImport").onchange = e => {
  const datei = e.target.files[0];
  if (!datei) return;
  const leser = new FileReader();
  leser.onload = () => {
    try {
      const d = JSON.parse(leser.result);
      if (d.art !== "scarnet-rauchfrei" || !d.profil || !d.profil.start)
        throw new Error("fremd");
      if (!confirm("Eingelesene Daten übernehmen? Die Angaben in diesem Browser werden ersetzt."))
        return;
      profil = Object.assign(standard(), d.profil);
      einstellungenFuellen();
      sichern();
      zeichnen();
      alert("Übernommen.");
    } catch (err) {
      alert("Das war keine Datei aus diesem Bereich.");
    }
  };
  leser.readAsText(datei);
  e.target.value = "";
};

/* ---------------------------------------------------------------------
   Tagesfenster
   ---------------------------------------------------------------------
   Der Erfolg eines Tages stand vorher als Zeile unter dem ganzen Block —
   bei fünf Bänderzeilen und zwei Reihen Chips also weit weg von dem Feld,
   das man angetippt hatte. Dass beides zusammengehört, war nicht zu sehen.
   Jetzt geht ein eigenes Fenster auf.
   --------------------------------------------------------------------- */
function tagfensterAuf(nr){
  const zig  = nr * profil.menge;
  const geld = zig * (profil.preis / profil.proSchachtel);
  const verstrichen = rechnen(profil).verstrichen;
  const fertig = Math.floor(verstrichen / TAG);

  const istTag = nr >= 1 && nr <= TAGESTROPHAEEN.length;
  const marke  = TROPHAEEN.find(x => Math.round(x.ms / TAG) === nr);

  const kopf  = istTag ? "Tag " + nr : (marke ? marke.kurz : "Tag " + nr);
  const titel = istTag ? TAGESTROPHAEEN[nr - 1].titel : (marke ? marke.was : "");

  const zustand = nr <= fertig ? "erreicht" : nr === fertig + 1 ? "läuft gerade" : "noch offen";
  const satz = nr <= fertig
    ? "So weit warst du am Ende dieses Tages."
    : nr === fertig + 1
      ? "So weit bist du heute Abend."
      : "So weit wirst du sein, wenn es soweit ist.";

  $("tfMarke").textContent = zustand;
  $("tfMarke").className = "tf-marke" + (nr <= fertig ? " da" : "");
  $("tfTag").textContent = kopf;
  $("tfTitel").textContent = titel;
  $("tfZig").textContent = zahl(zig);
  $("tfGeld").textContent = euro(geld);
  $("tfSatz").textContent = satz;

  $("tagfenster").hidden = false;
  $("tfZu").focus();
}

function tagfensterZu(){
  $("tagfenster").hidden = true;
}

$("tfZu").onclick = tagfensterZu;
/* Ein Tipper neben den Kasten schließt ebenfalls — auf dem Handy ist das
   die Geste, die alle erwarten. */
$("tagfenster").addEventListener("click", e => {
  if (e.target === $("tagfenster")) tagfensterZu();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("tagfenster").hidden) tagfensterZu();
});

/* ---------------------------------------------------------------------
   Feuerwerk beim Tageswechsel
   ---------------------------------------------------------------------
   Drei versetzte Salven statt einer. Jede bringt einen Blitz, eine
   Druckwelle und rund zwanzig Funken mit — zusammen etwa sechzig, nicht
   achtzehn wie in der ersten Fassung.

   Wichtig für den Eindruck ist weniger die Zahl der Funken als der Blitz:
   eine kurze Aufhellung der ganzen Karte macht aus einem Funkenflug einen
   Knall. Die Druckwelle liefert den Umriss dazu, und weil ein Teil der
   Funken als Streifen statt als Punkt fliegt, sieht man die Richtung.

   Alles liegt in der Zählerkarte, nicht über der Seite: die Belohnung
   gehört zu der Zahl, die sich gerade geändert hat.
   --------------------------------------------------------------------- */
const FUNKENFARBEN = ["#FFE7B2", "#D9A94F", "#62D6AE", "#FFFFFF", "#F0C97A"];

/* Ort und Zeitpunkt der drei Salven. Die erste sitzt hinter der Zahl, die
   beiden anderen versetzt daneben — alle drei an derselben Stelle sähe aus
   wie ein einzelner, nur längerer Knall. */
const SALVEN = [
  { qx:"50%", qy:"38%", spaet:   0, n:24, weite:1.00, hell:1    },
  { qx:"27%", qy:"48%", spaet: 330, n:19, weite:0.82, hell:0.45 },
  { qx:"73%", qy:"44%", spaet: 640, n:19, weite:0.82, hell:0.45 }
];

function feuerwerk(tage){
  const karte = document.querySelector(".zaehler");
  if (!karte) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  karte.querySelectorAll(".funken, .glueckwunsch").forEach(e => e.remove());

  const feld = document.createElement("div");
  feld.className = "funken";
  let h = "";

  SALVEN.forEach(s => {
    const ort = "--qx:" + s.qx + ";--qy:" + s.qy + ";--spaet:" + s.spaet + "ms;";
    const blitzOrt = ort + "--hell:" + s.hell + ";";
    h += '<span class="fw-blitz" style="' + blitzOrt + '"></span>';
    h += '<span class="fw-ring"  style="' + ort + '"></span>';

    for (let i = 0; i < s.n; i++){
      const winkel = Math.random() * Math.PI * 2;
      const weite  = (95 + Math.random() * 135) * s.weite;
      const x = Math.cos(winkel) * weite;
      // Schwerkraft: die Senkrechte wird gestaucht und alles fällt nach unten
      const y = Math.sin(winkel) * weite * 0.55 + 85 + Math.random() * 55;

      // Etwa ein Drittel fliegt als Streifen — daran sieht man die Richtung.
      const streifen = Math.random() < 0.34;
      const gr   = streifen ? 3 : 4 + Math.random() * 4;
      const rund = streifen ? "1px" : "50%";

      h += '<i style="' + ort
         + "--x:" + x.toFixed(0) + "px;--y:" + y.toFixed(0) + "px;"
         + "--gr:" + gr.toFixed(1) + "px;--rund:" + rund + ";"
         + "--dreh:" + Math.floor(Math.random() * 540 - 270) + "deg;"
         + "--dauer:" + Math.floor(1300 + Math.random() * 700) + "ms;"
         + "--spaet:" + (s.spaet + Math.floor(Math.random() * 220)) + "ms;"
         + "background:" + FUNKENFARBEN[Math.floor(Math.random() * FUNKENFARBEN.length)] + ";"
         + (streifen ? "height:" + (9 + Math.random() * 7).toFixed(0) + "px;" : "")
         + '"></i>';
    }
  });

  feld.innerHTML = h;
  karte.appendChild(feld);

  // Die große Zahl setzt einmal nach.
  karte.classList.remove("knall");
  void karte.offsetWidth;
  karte.classList.add("knall");

  const gw = document.createElement("div");
  gw.className = "glueckwunsch";
  gw.textContent = tage === 1
    ? "Herzlichen Glückwunsch — der erste Tag!"
    : "Herzlichen Glückwunsch — Tag " + tage + "!";
  karte.appendChild(gw);

  setTimeout(() => { feld.remove(); karte.classList.remove("knall"); }, 3400);
  setTimeout(() => gw.remove(), 4000);
}

/* ---------------------------------------------------------------------
   Start — und zwar als ALLERLETZTES in dieser Datei
   ---------------------------------------------------------------------
   Dieser Block stand frueher in der Mitte. Wer „Angemeldet bleiben“ gesetzt
   hat, wird hier ohne Formular angemeldet, und das ruft ueber starten()
   sofort zeichnen() auf — mitten im Laden der Datei. Alles, was weiter
   unten mit const oder let angelegt wird, existiert zu diesem Zeitpunkt
   noch nicht.

   Am 18.08.2026 genau daran gescheitert: das Feuerwerk beim Tageswechsel
   griff auf seine Salvenliste zu, die vierzig Zeilen spaeter steht. Der
   Fehler war „Cannot access SALVEN before initialization“, zeichnen() brach
   ab, und in der Countdown-Karte blieb der Platzhalter „In –“ stehen.

   Warum es beim Testen nie auffiel: ich habe mich immer ueber das Formular
   angemeldet, also erst nachdem die Datei fertig durchgelaufen war. Nur der
   gemerkte Zugang laeuft mitten im Laden — und den benutzen die Leute.

   Am Ende der Datei kann das nicht mehr passieren, egal was spaeter noch
   dazukommt.
   --------------------------------------------------------------------- */
(function los(){
  const gemerkt = merkenLesen();
  if (gemerkt && KONTEN.some(k => k.hash === gemerkt)){
    anmelden(gemerkt);
  } else {
    zeigen("ansichtAnmeldung");
  }
})();
