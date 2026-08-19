# Prüfen vor dem Ausliefern

Die Vorschau im Programm lädt lokale Dateien als `data:`-Adresse, dort lösen
relative Pfade nicht auf. Zum Prüfen wird deshalb alles zu einer Datei
zusammengesetzt. Ausgeliefert werden die getrennten Dateien — ein Bauschritt
entsteht nicht.

## Zusammenbauen und prüfen

Im Ordner `scarnet.de`:

```
awk '/^<link rel="stylesheet"/ { print "<style>";
       while ((getline l < "css/rauchfrei.css") > 0) print l; print "</style>"; next }
     /^<script src="js\// { if (!d) { print "<script>";
       while ((getline l < "js/basis.js") > 0) print l;
       while ((getline l < "js/inhalte.js") > 0) print l;
       while ((getline l < "js/rauchfrei.js") > 0) print l;
       print "</script>"; print "<script>";
       while ((getline l < "werkzeug/pruefung.js") > 0) print l;
       print "</script>"; d = 1 } next }
     { print }' rauchfrei.html > _pruef.html
```

Dann `_pruef.html` im Browser öffnen und in der Konsole aufrufen:

```
pruefung()
```

`_pruef*.html` ist über `.gitignore` ausgeschlossen und wird nie ausgeliefert.

## Was der Prüflauf abdeckt — und warum

Jeder Abschnitt steht für einen Fehler, der genau so schon einmal bis zum
Nutzer durchgerutscht ist. Der Prüflauf prüft nicht, was gerade gebaut wurde —
dafür sieht man ohnehin hin. Er prüft die Wege, die man beim Bauen übersieht,
weil man sie selbst nie geht.

| Nr. | Prüfung | Der Fehler dahinter |
|-----|---------|---------------------|
| 1 | Jede angesprochene Kennung existiert im Markup | Das Skript griff auf einen Kasten zu, den das Markup nicht mehr hatte. `zeichnen()` brach ab, im Countdown blieb „In –“ stehen. |
| 2 | Der Startblock steht hinter allen Konstanten | Der gemerkte Zugang meldet mitten im Laden an und ruft `zeichnen()` auf. Alles, was danach mit `const` kommt, ist in der zeitlichen Totzone. Daran ist das Feuerwerk gescheitert. |
| 3 | Alle vier Einstiegswege | Beim Bauen meldet man sich über das Formular an. Der gemerkte Zugang ist der Weg, den die Leute nehmen — und der lief nie durch. |
| 4 | Zeitliche Randzustände von Tag 0 bis 4000 | „Erfolge“ war an Tag 0 leer, weil immer mit siebzehn Tagen getestet wurde. |
| 5 | Der Moment des Centwechsels | Betrag und Münze waren in jedem Zustand richtig, nur im Übergang nicht. |
| 6 | Inhaltslisten auf Anzahl und Dubletten | 38 von 137 selbst geschriebenen Vorschlägen waren Dubletten — frisches eigenes Material wurde weniger streng geprüft als altes. |
| 7 | Zieltexte in der Zukunftsform | Dreimal derselbe Fehler: Texte hinter „Als Nächstes“ waren als Rückblick geschrieben. |
| 8 | Umlaute, Einzahl mit Mehrzahlwort, Null mit Einheit | „1 Jahr 1 Tage“, „1 Jahr 0 Tage“, kaputte Umlaute nach einer Perl-Ersetzung. |
| 9 | Jeder Knopf lässt sich drücken, ohne zu werfen | — |
| 10 | Feuerwerk nur bei neuem Tag, und nur einmal | — |

## Was der Prüflauf nicht kann

- **Hinsehen.** Ob etwas hässlich ist, ob eine Beschriftung abgeschnitten wird,
  ob ein Abstand fehlt — dafür braucht es ein Bildschirmfoto bei 375 Pixeln.
  Die Wochenmedaille war „zu groß“ und das Feuerwerk „zu wenig“, beides bei
  einwandfreien Messwerten.
- **Den Zwischenspeicher.** Ein Missverhältnis zwischen ausgelieferten Dateien
  lässt sich lokal nicht nachstellen. Dagegen laufen drei Sicherungen:
  Fassungsnummer in den Adressen, Zeitstempel am Reiter der Startseite, und
  die Selbstprüfung des Skripts beim Start.
- **Sinn.** Ob ein Satz stimmt, muss gelesen werden.

## Nach dem Ausliefern

Nicht nur per `curl` gegenprüfen, sondern über den echten Weg: Startseite
aufrufen, auf den Reiter klicken, anmelden. Zweimal lag der Fehler genau
dort, wo `curl` nichts sehen konnte.

## Beim Diagnostizieren

Erst nachstellen, dann die Ursache benennen. Zweimal wurde ein Fehler dem
Zwischenspeicher zugeschrieben, und beim zweiten Mal stimmte das nicht — die
echte Ursache kam erst heraus, als die Ausnahme ausgelesen wurde statt
vermutet.

Und: der Prüflauf muss selbst geprüft werden. Beim ersten Anlauf suchte er
eine Zeichenkette und fand sie in seinem eigenen Quelltext — er meldete
„sauber“, obwohl der Fehler wieder drin war. Nach jeder Änderung an
`pruefung.js` einmal einen bekannten Fehler wiederherstellen und nachsehen,
ob er anschlägt.
