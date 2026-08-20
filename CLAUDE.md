# scarnet.de

Private Startseite, ausgeliefert von GitHub Pages aus `mschadwell-ops/scarnet.de`,
Branch `main`. **Kein Build, kein Generator** — was hier liegt, ist die Seite.
Push auf `main`, Pages baut in unter einer Minute.

Die technische Aufteilung steht im [README](README.md). Hier stehen nur die
Regeln, die man dem Quelltext nicht ansieht und deren Verletzung teuer ist.

## 1. Nichts von fremden Servern — zur Laufzeit

Keine Google Fonts, keine CDNs, keine Symbolsätze, keine Karten, keine
Analysewerkzeuge. Die IP-Übertragung an Dritte ist in Deutschland
abmahnungsrelevant (LG München I, 2022); es sind seither über 100.000
Abmahnungen verschickt worden. **Alles, was der Besucher lädt, kommt von
scarnet.de.**

Ein **Bauschritt** ist davon nicht betroffen — er erzeugt ja gerade selbst
gehostete Dateien. Was auf dem Entwicklungsrechner passiert, geht niemanden
etwas an. Beides nicht verwechseln.

Zurzeit deshalb Systemschriften (`ui-sans-serif, system-ui, …`). Eine eigene
Schrift ist erlaubt, sobald sie als WOFF2 im Repo liegt und von hier
ausgeliefert wird.

## 2. Die Fassungsnummer ist die zentrale Regel

`FASSUNG` in `js/basis.js` muss übereinstimmen mit:

- jedem `?v=` in `rauchfrei.html` (vier Stück: CSS und drei Skripte)
- dem `?v=` in `setup.html`
- der Konstante `ERWARTET` im Wächter-Skript am Ende von `rauchfrei.html`

**Bei jeder Änderung an CSS oder JS hochzählen.** GitHub Pages liefert jede
Datei mit `max-age=600` aus; ohne Hochzählen trifft neues Markup auf altes
Skript. Der Wächter fängt das ab und ersetzt die Seite durch eine Meldung —
lädt der Rauchfrei-Bereich ohne Meldung, stimmen die Zahlen.

Gegenprobe:

```bash
grep -n "const FASSUNG" js/basis.js; grep -o "?v=[0-9]*" rauchfrei.html setup.html | sort -u
```

## 3. Bilder

Hero-Bilder bleiben **JPEG**, Qualitätsstufe 90. Dieselben Fotos lagen als PNG
bei 4,14 MB statt 711 KB, ohne besser auszusehen. Desktop quer, Mobil hoch —
`background-size:cover` beschneidet sonst an unerwarteter Stelle.

Auf dem Mac konvertiert `sips` (auch nach WebP), auf dem Windows-PC geht es nur
über PowerShell mit WPF. Weder ImageMagick noch ffmpeg noch cwebp sind da.

## 4. Impressum und Datenschutz — bewusste Entscheidungen

- **Keine Anschrift auf der Seite.** Nur „Maik Schadwell, Deutschland" und die
  E-Mail. Die Seite ist privat, ohne Werbung und Einnahmen, also greift § 5 DDG
  nicht — `impressum.html` beruft sich ausdrücklich **nicht** darauf. Wird die
  Seite je gewerblich, muss die Anschrift rein und der Bezug zurück.
- **Die E-Mail steht als `scar(at)scarnet.de`**, ohne At-Zeichen und ohne
  anklickbaren Verweis, auch nicht in Kommentaren. Gegen Adress-Sammler.
  Sie bleibt normaler Text: markierbar und für Screenreader in der richtigen
  Reihenfolge. Nach jeder Änderung an den HTML-Dateien gegenprüfen, Ausgabe
  muss leer bleiben:

  ```bash
  grep -rEil '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|mailto' --include='*.html' .
  ```

- **Verlinkt in der Fußzeile `.rechtsfuss`, nicht im Menü.** Mit vier Reitern
  braucht die Menüleiste 417 px bei 288 px Platz auf einem 375-px-Display, und
  „Datenschutz" fällt aus dem Bild. Nicht zurückbauen.

## 5. Der Rauchfrei-Bereich ist absichtlich zurückhaltend

Das ist kein Mangel an Gestaltung, sondern der Zweck. Der **Krisenknopf** ist
klein, rund, halb durchsichtig und in der Ecke: ein dauerhaft sichtbarer Knopf
mit Rauch-Bezug ist selbst ein Hinweisreiz, und genau die will man beim
Aufhören loswerden. Nicht auffälliger machen.

Er liegt `fixed` mit `z-index:20` und überlappt beim Vorbeiscrollen
Bedienelemente. Die 88 px `padding-bottom` am `.wrap` sorgen dafür, dass am
Scroll-Ende nichts verdeckt bleibt. **Geprüft, kein Fehler, nicht melden.**

Zugänge stehen als SHA-256 in `KONTEN` (`js/rauchfrei.js`). Das Kennwort steht
nirgends im Repository und darf dort auch nie landen — es stand dort schon
einmal. Neue Zugänge über `setup.html`.

## 6. Prüfen

Im Browser, nicht per Werkzeugkette:

```bash
python3 -m http.server 8765
```

Echtes localhost, damit relative Pfade und `localStorage` funktionieren — unter
`file://` und `data:` fällt beides aus. Dann `pruefung()` **ohne Argument** in
der Konsole; das Kennwort tippt der Nutzer selbst.

**Merkmal für einen echten Lauf: rund 80 in „… Kennungen angesprochen".** Steht
dort eine einstellige Zahl, wurden nur eingebettete Skripte gesehen und der Lauf
hat nichts geprüft.

Bekannte Lücke: `werkzeug/pruefung.js` sieht nur Daten, nie die **Ausgabe**.
Sprachfehler im zur Laufzeit erzeugten Text („seit 2 Tage" statt „Tagen") kann
er nicht finden. Nach dem Ausliefern über den echten Weg gegenprüfen —
Startseite, Reiter, anmelden — nicht nur per `curl`.

## 7. Arbeitskopie

Maßgeblich ist **`origin/main`**. Der Ordner
`~/Library/CloudStorage/Dropbox/Claude/scarnet.de` ist ein veralteter
Schnappschuss und nicht anzufassen: in Dropbox wurde `.git` mitsynchronisiert,
was Git-Operationen beschädigen kann.

`gh` ist nicht installiert, bewusst. Pull Requests laufen über einen
vorausgefüllten Compare-Link, Push über SSH.
