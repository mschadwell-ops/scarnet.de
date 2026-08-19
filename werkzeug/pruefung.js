"use strict";
/* =====================================================================
   Prüflauf für rauchfrei.html
   ---------------------------------------------------------------------
   Wird in den zusammengesetzten Prüfabzug eingespielt und im Browser
   aufgerufen. Meldet, was nicht stimmt.

   Er prüft nicht, was ich gerade gebaut habe — dafür sehe ich ohnehin hin.
   Er prüft die Wege, die ich beim Bauen übersehe, weil ich sie selbst nie
   gehe. Jeder Abschnitt hier steht für einen Fehler, der genau so schon
   einmal bis zum Nutzer durchgerutscht ist; der Kommentar nennt ihn.

   Aufruf im Browser:  pruefung()
   ===================================================================== */
function pruefung(){
  const zeilen = [];
  let fehler = 0;
  const ok   = (t)    => zeilen.push("  ok    " + t);
  const bad  = (t)    => { fehler++; zeilen.push("  FEHLT " + t); };
  const pruef= (b, t) => b ? ok(t) : bad(t);
  const kopf = (t)    => zeilen.push("\n" + t);

  const setz = (id,v) => { const e = document.getElementById(id); if (e) e.value = v; };
  const ab   = id     => { const e = document.getElementById(id);
                           if (e) e.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true})); };
  const anmeldenAlsMarie = () => {
    setz("fName","Marie"); setz("fPass","NichtMehr2026Rauchen!"); ab("anmeldeForm");
  };
  const einrichten = (msHer, menge) => {
    setz("fStart", inFeld(Date.now() - msHer)); setz("fMenge", String(menge || 20));
    ab("einrichtenForm");
  };
  const stand = (tage, std) => {
    profil.start = Date.now() - tage*86400000 - (std||1)*3600000;
    letzterTag = -1;
    try { zeichnen(); return null; } catch (e){ return e; }
  };

  /* -------------------------------------------------------------------
     1. Spricht das Skript nur Kästen an, die es auch gibt?
     Ursache von „In –“ am 18.08.: erfolgeZeichnen griff auf einen Kasten
     zu, den das ausgelieferte Markup nicht mehr hatte. Ein TypeError, und
     zeichnen() brach ab, bevor der Countdown geschrieben wurde.
     ------------------------------------------------------------------- */
  kopf("1. Angesprochene Kästen gegen das Markup");
  /* Der eigene Quelltext muss draussen bleiben. Beim ersten Anlauf suchte die
     Pruefung nach der Zeichenkette fuer den Startblock und fand sie in sich
     selbst — sie mass also ihren eigenen Text und meldete „sauber“, obwohl
     der Fehler wieder drin war. Eine Pruefung, die sich selbst misst, ist
     wertlos; das ist mir beim Gegentest aufgefallen und nicht vorher. */
  const quelle = [...document.querySelectorAll("script")]
    .map(s => s.textContent)
    .filter(t => t.indexOf("function pruefung()") < 0)
    .join("\n");
  const ids = new Set();
  const muster = /\$\("([A-Za-z][\w-]*)"\)|getElementById\("([A-Za-z][\w-]*)"\)/g;
  let m;
  while ((m = muster.exec(quelle))) ids.add(m[1] || m[2]);
  /* Diese legt das Skript selbst an, bevor es sie anspricht — sie stehen
     also zu Recht nicht im Markup. Die Liste ist bewusst kurz und wird nur
     ergaenzt, wenn ich nachgesehen habe, dass es stimmt. */
  const SELBSTGEBAUT = ["frischLaden", "wfHaupt", "wfRest"];
  const ohne = [...ids].filter(id => !document.getElementById(id) && SELBSTGEBAUT.indexOf(id) < 0);
  pruef(ohne.length === 0, ids.size + " Kennungen angesprochen, "
    + SELBSTGEBAUT.length + " davon selbst gebaut"
    + (ohne.length ? " — nicht im Markup: " + ohne.join(", ") : ", der Rest vorhanden"));

  /* -------------------------------------------------------------------
     2. Steht der Startblock wirklich als Letztes?
     Ursache von „In –“ am 18.08., zweiter Anlauf: der gemerkte Zugang
     meldet mitten im Laden an und ruft zeichnen() auf. Alles, was danach
     mit const angelegt wird, ist zu dem Zeitpunkt in der zeitlichen
     Totzone. Genau daran ist das Feuerwerk gescheitert.
     ------------------------------------------------------------------- */
  kopf("2. Reihenfolge im Skript");
  const startAb = quelle.lastIndexOf("(function los()");
  let letzteDekl = -1;
  const dekl = /^(?:const|let) [A-Z_]{2,}/gm;
  while ((m = dekl.exec(quelle))) letzteDekl = m.index;
  pruef(startAb > letzteDekl,
    "Startblock steht hinter der letzten Konstanten"
    + (startAb > letzteDekl ? "" : " — der gemerkte Zugang läuft sonst in die Totzone"));

  /* -------------------------------------------------------------------
     3. Die vier Einstiegswege. Ich melde mich beim Bauen immer über das
     Formular an — der gemerkte Zugang ist der, den die Leute nehmen, und
     genau der lief nie durch meine Hände.
     ------------------------------------------------------------------- */
  kopf("3. Einstiegswege");

  anmeldenAlsMarie();
  pruef(!document.getElementById("ansichtAnmeldung") ||
        document.getElementById("ansichtAnmeldung").hidden, "Anmeldung über das Formular");

  einrichten(5*86400000 + 3600000, 20);
  pruef(!document.getElementById("ansichtApp").hidden, "Ersteinrichtung");
  pruef(profil.gesehenerTag === Math.floor(rechnen(profil).verstrichen / 86400000),
    "Ersteinrichtung feiert keinen Tag, der nie erlebt wurde");

  merkenSetzen(meineId, true);
  let f = null;
  letzterTag = -1;
  try { anmelden(meineId); } catch (e){ f = e; }
  pruef(!f, "gemerkter Zugang, mitten im Laden" + (f ? " — wirft " + f.message : ""));
  pruef(document.getElementById("cdZeit").textContent.indexOf("–") < 0,
    "Countdown ist nach dem Anmelden gefüllt, nicht „–“");
  merkenLoeschen();

  const vorher = profil.rueckfaelle || 0;
  rueckfallEintragen();
  pruef((profil.rueckfaelle || 0) === vorher + 1 && profil.gesehenerTag === 0, "Rückfall");

  /* -------------------------------------------------------------------
     4. Zeitliche Randzustände. „Erfolge“ war am Tag 0 leer und der
     Hinweissatz brach mit einem Wort je Zeile um — nie angesehen, weil
     ich immer mit siebzehn Tagen getestet habe.
     ------------------------------------------------------------------- */
  kopf("4. Zeitliche Randzustände");
  anmeldenAlsMarie();
  [[0,0], [0,13], [0,23], [1,1], [6,23], [7,1], [29,23], [30,1], [100,1], [400,1], [4000,1]]
    .forEach(([t, s]) => {
      const e = stand(t, s);
      if (e) return bad("Tag " + t + ", " + s + " Uhr — wirft " + e.message);
      const leer = ["zTage","erfolgZahl","kGeld","cdZeit","cdTag"]
        .filter(id => !document.getElementById(id).textContent.trim());
      const platzhalter = document.getElementById("cdZeit").textContent.indexOf("–") >= 0;
      if (leer.length)      return bad("Tag " + t + " — leer: " + leer.join(", "));
      if (platzhalter)      return bad("Tag " + t + " — Countdown zeigt „–“");
      ok("Tag " + t + ", " + s + " Uhr");
    });

  /* -------------------------------------------------------------------
     5. Übergänge, nicht nur Zustände. Der Betrag sprang einen
     Sekundenbruchteil vor der Münze — beide Zustände waren richtig, nur
     der Moment dazwischen nicht.
     ------------------------------------------------------------------- */
  kopf("5. Übergang am Centwechsel");
  stand(3, 1);
  const proMs = (profil.menge / 86400000) * (profil.preis / profil.proSchachtel);
  const msProCent = 0.01 / proMs;
  const basis = Date.now();
  let lz = null, lf = null, sz = null, sm = null;
  for (let k = -60; k <= 60; k++){
    profil.start = basis - (300*msProCent + k*(msProCent/40));
    zeichnen();
    const t = document.getElementById("kGeld").textContent;
    const fu = parseFloat(getComputedStyle(document.getElementById("muenze")).getPropertyValue("--fuell"));
    if (lz !== null && t !== lz && sz === null) sz = k;
    if (lf !== null && fu < lf - 0.5 && sm === null) sm = k;
    lz = t; lf = fu;
  }
  pruef(sz !== null && sz === sm, "Betrag und Münze springen im selben Schritt"
    + (sz === sm ? "" : " — Betrag bei " + sz + ", Münze bei " + sm));

  /* -------------------------------------------------------------------
     6. Die Inhaltslisten. 38 von 137 eigenen Vorschlägen waren Dubletten,
     weil ich frisch geschriebenes Material nicht so streng geprüft habe
     wie älteres.
     ------------------------------------------------------------------- */
  kopf("6. Inhaltslisten");
  [["SPRUECHE",SPRUECHE,"t"], ["STATTDESSEN",STATTDESSEN,"t"], ["PREISE",PREISE,"e"],
   ["TAGE",TAGE,null], ["TAGE_ZIEL",TAGE_ZIEL,null], ["TAGESTROPHAEEN",TAGESTROPHAEEN,"titel"],
   ["KRISE",KRISE,null], ["TROPHAEEN",TROPHAEEN,"kurz"], ["WELLEN",WELLEN,"n"]]
    .forEach(([name, liste, feld]) => {
      const werte = liste.map(x => feld ? x[feld] : x);
      const doppelt = werte.length - new Set(werte).size;
      const leer = werte.filter(x => !x || String(x).length < 3).length;
      pruef(doppelt === 0 && leer === 0,
        name + ": " + liste.length + " Einträge"
        + (doppelt ? ", " + doppelt + " doppelt" : "")
        + (leer ? ", " + leer + " leer" : ""));
    });
  pruef(TAGE.length === TAGE_ZIEL.length, "TAGE und TAGE_ZIEL gleich lang");

  /* -------------------------------------------------------------------
     7. Zeitform. Dreimal ist mir derselbe Fehler unterlaufen: Texte, die
     hinter „Als Nächstes“ stehen, waren als Rückblick geschrieben.
     ------------------------------------------------------------------- */
  kopf("7. Zeitform der Zieltexte");
  const rueckblick = /liegt hinter dir|hattest du|war der|ist durch|hast du geschafft/;
  const schief = TAGESTROPHAEEN.filter(t => rueckblick.test(t.was)).map((t,i) => t.titel);
  pruef(schief.length === 0, "TAGESTROPHAEEN als Ziel formuliert"
    + (schief.length ? " — Rückblick in: " + schief.join(", ") : ""));

  /* -------------------------------------------------------------------
     8. Sprache. Kaputte Anführungszeichen haben schon einmal das ganze
     Skript zerlegt.
     ------------------------------------------------------------------- */
  kopf("8. Sprache");
  const alleTexte = [].concat(
    SPRUECHE.map(s => s.t), STATTDESSEN.map(s => s.t), TAGE, TAGE_ZIEL, KRISE,
    TAGESTROPHAEEN.map(t => t.was), PREISE.map(p => p.w || ""));
  const mojibake = alleTexte.filter(t => /Ã|Â|â€/.test(t));
  const plural   = alleTexte.filter(t => /(^|[^0-9,])1 (Tage|Jahre|Monate|Wochen|Zigaretten|Schachteln)\b/.test(t));
  const nullEinh = alleTexte.filter(t => /(^|[^0-9,])0 (Tage?|Jahre?|Std\.|Min\.)\b/.test(t));
  pruef(mojibake.length === 0, "keine kaputten Umlaute");
  pruef(plural.length   === 0, "keine Einzahl mit Mehrzahlwort" + (plural.length ? ": " + plural[0] : ""));
  pruef(nullEinh.length === 0, "keine Einheit mit Null davor" + (nullEinh.length ? ": " + nullEinh[0] : ""));

  /* -------------------------------------------------------------------
     9. Nichts wirft. Der Reihe nach alles anfassen, was Knöpfe haben.
     ------------------------------------------------------------------- */
  kopf("9. Bedienelemente");
  stand(17, 9);
  const knopf = (id, was) => {
    const e = document.getElementById(id);
    if (!e) return bad(was + " — Knopf " + id + " fehlt");
    try { e.click(); ok(was); } catch (err){ bad(was + " — wirft " + err.message); }
  };
  knopf("bWofuer", "Was kriege ich dafür");
  const feld = document.querySelector('#erfolge [data-tag="7"]');
  if (!feld) bad("Tagesfeld im Erfolgsbereich");
  else { feld.click();
         pruef(!document.getElementById("tagfenster").hidden
               && document.getElementById("tfZig").textContent.length > 0,
               "Tagesfenster mit Zahlen");
         document.getElementById("tfZu").click(); }
  knopf("bStatt", "Noch eine Idee");
  knopf("bKrise", "Krisenknopf");
  knopf("bKriseNoch", "Noch einen Grund");
  knopf("bTon", "Tonschalter");
  knopf("bKriseWeg", "Geht wieder");

  /* -------------------------------------------------------------------
     10. Feuerwerk: nur bei einem neuen Tag, und nur einmal.
     ------------------------------------------------------------------- */
  kopf("10. Feuerwerk");
  const karte = document.querySelector(".zaehler");
  /* Der Glueckwunsch steht jetzt IN der Ueberschrift, nicht mehr als eigener
     Kasten — also auch die Klasse und den Text zuruecksetzen. */
  const sauber = () => {
    karte.querySelectorAll(".funken").forEach(e => e.remove());
    const kf = karte.querySelector(".zaehler-kopf");
    if (kf){ if (kf.dataset.alt) kf.textContent = kf.dataset.alt;
            kf.classList.remove("glueckwunsch", "zurueck"); }
  };
  sauber(); profil.gesehenerTag = 1; profil.start = Date.now() - 49*3600000;
  letzterTag = -1; zeichnen();
  pruef(!!karte.querySelector(".funken"), "läuft beim neuen Tag");
  pruef(profil.gesehenerTag === 2, "merkt sich den gefeierten Tag");
  sauber(); letzterTag = -1; zeichnen();
  pruef(!karte.querySelector(".funken"), "läuft beim Neuladen NICHT wieder");
  sauber(); profil.gesehenerTag = 1; profil.start = Date.now() - 9*86400000;
  letzterTag = -1; zeichnen();
  pruef(karte.querySelectorAll(".funken").length === 1, "nach drei Tagen Abwesenheit nur eine Feier");
  sauber();


  /* -------------------------------------------------------------------
     11. Zweimal feiern hintereinander. Der Glueckwunsch ersetzt den Text
     der Ueberschrift und traegt dazu deren Klasse. Solange das Aufraeumen
     nach ".glueckwunsch" suchte, loeschte der zweite Tageswechsel die
     Ueberschrift dauerhaft — die Karte bestand danach nur noch aus der
     Zahl. Kein Markup-Fehler, sondern erst zur Laufzeit sichtbar.
     ------------------------------------------------------------------- */
  kopf("11. Zweimal feiern");
  const kf0 = karte.querySelector(".zaehler-kopf");
  const urText = kf0 ? (kf0.dataset.alt || kf0.textContent) : null;
  for (let n = 0; n < 2; n++){
    sauber();
    profil.gesehenerTag = 1 + n; profil.start = Date.now() - (49 + n*24)*3600000;
    letzterTag = -1; zeichnen();
  }
  const kf1 = karte.querySelector(".zaehler-kopf");
  pruef(!!kf1, "Überschrift ist nach zwei Feiern noch da");
  if (kf1){
    kf1.textContent = urText; kf1.classList.remove("glueckwunsch","zurueck");
    pruef(karte.children.length >= 3, "Karte hat noch alle Bausteine ("
      + [...karte.children].map(e => e.className.split(" ")[0]).join(", ") + ")");
  }
  sauber();

  zeilen.unshift(fehler === 0
    ? "PRÜFLAUF SAUBER — nichts gefunden"
    : "PRÜFLAUF: " + fehler + " Beanstandung" + (fehler === 1 ? "" : "en"));
  return zeilen.join("\n");
}
