# scarnet.de

Statische Startseite für [scarnet.de](https://scarnet.de), ausgeliefert über GitHub Pages
vom Branch `main`. Kein Build, kein Generator — was hier liegt, ist die Seite.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Startseite: Hero-Bild, Panorama „Das Revier“, Menü |
| `rauchfrei.html` | Reiter „Rauchfrei“ — Anmeldung und Zähler, alles in einer Datei |
| `setup.html` | Werkzeug, um Zugänge zu erzeugen. Nicht im Menü verlinkt |
| `impressum.html` | Anbieterkennzeichnung nach § 5 DDG |
| `datenschutz.html` | Datenschutzerklärung |
| `Welcome.jpg` | Hero-Bild quer (1672 × 941), ab Viewport ≥ 769 px |
| `Welcome-mobile.jpg` | Hero-Bild hoch (941 × 1672), bis Viewport ≤ 768 px |
| `CNAME` | bindet die Domain `scarnet.de` an GitHub Pages |
| `robots.txt` | hält den persönlichen Bereich aus Suchmaschinen |

Jede Seite ist für sich vollständig — kein gemeinsames Stylesheet, kein
Skript von außen, nichts von einem fremden Server. Das ist Absicht:
So läuft jede Datei auch per Doppelklick lokal, und es geht nichts an Dritte
raus, was datenschutzrechtlich relevant wäre.

## Die Startseite

Drei Abschnitte, alles in `index.html`, kein zusätzlicher Abruf: das Hero-Foto
über die volle Höhe, darunter **„Das Revier“**, darunter die Karte zum
Rauchfrei-Bereich und die Rechtsfußzeile.

„Das Revier“ ist eine gezeichnete Landschaft, 3200 × 900 Einheiten, die beim
Scrollen von West nach Ost fährt: Fördergerüst im Morgengrauen, Jahrhunderthalle
am Tag, Flutlicht und gelbe Wand am Abend, Halde zur blauen Stunde. Kein Foto,
keine Bibliothek — ein Inline-SVG und rund 60 Zeilen Skript. Der Boden macht
dieselbe Wanderung: links trockenes Braun, rechts Gras.

Drei Sachen dabei sind wichtiger, als sie aussehen:

- **Der Maßstab wird gerechnet, nicht gesetzt.** Die Zeichnung wird immer ganz
  gezeigt, also legt die Höhe des Streifens auch seine Breite fest. `messen()`
  gleicht vier Ansprüche aus: hoch genug, um etwas zu erkennen; breit genug, um
  zu fahren; kurz genug, dass die Fahrt gut drei Bildschirme dauert; und
  mindestens 1,25 Fensterbreiten, sonst gäbe es auf einem breiten Monitor
  nichts zu fahren.
- **Kein `overflow` auf `html` oder `body`.** Ein Rollcontainer weiter oben
  setzt `position:sticky` in Safari außer Kraft, und dann fährt nichts mehr.
  Über die Breite läuft ohnehin nichts hinaus, das schneidet `.band` ab.
- **Ohne Skript bleibt die Seite vollständig.** Die Grundstellung im CSS ist der
  Streifen zum Seitwärtsschieben mit den vier Tafeln untereinander; erst das
  Skript setzt die Klasse `pano` auf `<html>` und schaltet die Fahrt frei. Wer
  „Bewegung reduzieren“ eingestellt hat, bekommt sie gar nicht erst.

Das kostet: 49 KB Quelltext statt 10, über die Leitung rund 15 KB statt 4 —
GitHub Pages liefert gzip-komprimiert aus. Dafür kommt kein einziger neuer
Abruf dazu.

## Schriften

In `schriften/` liegen drei variable WOFF2 mit ihren Lizenztexten (alle SIL
Open Font License, bezogen über Fontsource). **Benutzt wird eine:
Space Grotesk.** Die anderen beiden liegen bereit, kosten den Besucher aber
nichts — einen `@font-face`-Block, auf den keine Regel zeigt, lädt kein
Browser. Nachgemessen: beim Abruf der Startseite geht genau eine
Schriftanfrage raus.

| Datei | Größe | Gewichte |
|---|---|---|
| `space-grotesk.woff2` | 21 KB | 300–700, **aktiv** |
| `manrope.woff2` | 24 KB | 200–800 |
| `inter.woff2` | 47 KB | 100–900 |

Umschalten heißt: `--sans` in `css/rauchfrei.css`, `impressum.html`,
`datenschutz.html` und `setup.html` ändern, die `font-family` auf `html, body`
in `index.html`, **und den Preload in `index.html` mitziehen** — sonst wird die
falsche Schrift vorgeladen. Danach `FASSUNG` hochzählen.

Geladen wird nur die lateinische Teilmenge; die deckt äöü und ß ab, `latin-ext`
wäre für Deutsch unnötiger Ballast. Npm wurde nur zum Beschaffen gebraucht —
die Seite bleibt buildfrei, die Dateien liegen im Repo.

## Ein neuer Menüpunkt

Das Menü steht als `<nav class="nav">` in jeder Seite. Neuer Reiter heißt:
in `index.html` und in allen bestehenden Seiten eine Zeile in `.tabs`
ergänzen, und auf der neuen Seite bekommt der eigene Reiter
`aria-current="page"`. Bei drei Seiten ist das Kopieren billiger als eine
gemeinsame Datei, die jede Seite erst laden müsste. Ab etwa sechs Reitern
lohnt sich der Umbau.

## Zugänge für den Rauchfrei-Bereich

In `rauchfrei.html` steht im Abschnitt `KONTEN` eine Liste von Prüfsummen.
Aus einer Prüfsumme lassen sich weder Name noch Passwort zurückrechnen, also
steht beides nirgends im Quelltext.

Neuen Zugang anlegen:

1. `setup.html` öffnen
2. Name und Passwort eintragen, Zeile erzeugen
3. Zeile in `rauchfrei.html` in die Liste `KONTEN` einfügen

Zu welchem Namen ein Hash gehört, steht absichtlich nirgends — sonst stünden
die Namen ja doch wieder im Quelltext. Wer sich anmelden will, muss den Namen
kennen. Ein Kennwort ändern heißt: neue Zeile erzeugen, alte ersetzen.

Das Passwort wird dabei nur im Browser verarbeitet. Es sollte nicht in einer
Wörterliste stehen: Die Prüfsumme ist öffentlich, und schwache Passwörter
lassen sich durchprobieren. Diese Anmeldung ist Verschleierung, nicht
Verschlüsselung — für zwei Leute, die ihre rauchfreien Tage zählen, reicht
das, für Geheimnisse nicht.

## Wo die Daten liegen

Ausschließlich im `localStorage` des jeweiligen Browsers. Nichts wird
übertragen, es gibt keinen Server und keine Datenbank. Das bedeutet auch:
Handy und Laptop wissen nichts voneinander. Für den Umzug gibt es unter
„Einstellungen und Daten“ einen Export und einen Import.

Ist der Speicher gesperrt, etwa im privaten Modus, läuft die Seite weiter
und weist darauf hin, dass nichts gesichert wird.

## Tageserfolge

`rauchfrei.html` zeigt für jeden Tag einen eigenen Erfolg. Die Quellen dafür,
in dieser Reihenfolge:

1. `TAGE` — 90 handgeschriebene Einträge für die ersten 90 Tage. Dort gibt es
   belegte körperliche Veränderungen im Tagesabstand.
2. `LANGZEIT` — dokumentierte Marken an ihren Tagen: 4 Monate, ein halbes Jahr,
   9 Monate, 1, 2, 3, 5, 10 und 15 Jahre.
3. Sonst ein aus den eigenen Zahlen **errechneter** Erfolg — nicht gerauchte
   Zigaretten, gespartes Geld, zurückgerechnete Lebenszeit, abgeschlossene
   Wochen und Monate.

Der dritte Weg ist Absicht: Der Körper tut nicht an jedem einzelnen Tag etwas
neu Dokumentiertes, und erfundene Medizin für Tag 243 wäre schlechter als eine
wahre Zahl. Geprüft über 10 Jahre: kein Tag ohne Eintrag, kein Tag gleich wie
der Vortag, 3.608 verschiedene Texte.

## Impressum und Datenschutz

`impressum.html` und `datenschutz.html` sind zwei getrennte Seiten. Getrennt,
weil die Datenschutzerklärung nach Art. 13 DSGVO für sich erreichbar sein muss
und nicht unter dem Impressum versteckt gehört.

Verlinkt sind sie **nicht im Menü, sondern in einer Fußzeile** (`.rechtsfuss`)
auf der Startseite und im Rauchfrei-Bereich. Mit vier Reitern scrollt die
Menüleiste auf einem 375 Pixel breiten Display seitwärts, und der letzte
Eintrag fällt aus dem Bild — ausgerechnet der, der leicht erreichbar sein muss.
Unten sucht ihn ohnehin jeder zuerst.

Auf der Startseite liegt die Fußzeile `absolute` im Hero und nicht `fixed`: der
Hero ist `100svh` hoch und endet damit über der Adressleiste des
Handybrowsers, die ein `fixed`-Element auf `bottom:0` verdecken würde. Im
Rauchfrei-Bereich steht sie als Letztes im `.wrap`, also innerhalb der 88 Pixel
Bodenabstand, die den Krisenknopf freihalten.

Beide Rechtsseiten sind für sich vollständig, mit eigenem `<style>` im Kopf —
wie `setup.html`. Wer am Menü oder an der Farbwelt etwas ändert, muss es in
beiden Dateien tun.

**So wenig personenbezogene Angaben wie möglich.** Auf beiden Seiten stehen
nur Name und E-Mail-Adresse, keine Anschrift — die gibt es laut Text auf
Anfrage. Deshalb beruft sich `impressum.html` auch nicht auf § 5 DDG: eine
Anbieterkennzeichnung ohne Anschrift wäre unvollständig, und für eine private
Seite ohne Werbung und Einnahmen greift die Vorschrift nicht. Wird die Seite
jemals gewerblich, muss die Anschrift rein und der Bezug auf § 5 DDG zurück.

**Die E-Mail-Adresse steht ohne At-Zeichen und ohne anklickbaren Verweis**
(`scar(at)scarnet.de`), weil Adress-Sammler genau nach diesen beiden Mustern
suchen. Sie bleibt dabei normaler Text: markierbar, kopierbar und für einen
Screenreader in der richtigen Reihenfolge. Wer daran etwas ändert, sollte
danach gegenprüfen, dass keine Seite mehr auf ein Adressmuster passt:

```bash
grep -rEil '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|mailto' --include='*.html' .
```

Die Ausgabe muss leer bleiben.

## Ändern

Datei bearbeiten, committen, auf `main` pushen — GitHub Pages baut von selbst neu.
Die Umstellung dauert meist unter einer Minute.

## Bilder austauschen

Beide Hero-Bilder sind JPEG in Qualitätsstufe 90. Wer sie ersetzt, sollte

- das Format beibehalten (Desktop quer, Mobil hoch) — `background-size:cover`
  beschneidet sonst an unerwarteter Stelle,
- **kein PNG hochladen**: dieselben Fotos lagen vorher als PNG bei zusammen
  4,1 MB statt 711 KB, ohne sichtbar besser auszusehen.

Der Schriftzug „scaRnet" steckt als Pixel im Bild. Damit er auch für Screenreader
und Suchmaschinen existiert, steht er zusätzlich als unsichtbare `<h1>` im Markup —
beim Bildwechsel also mit anpassen, falls sich der Name ändert.
