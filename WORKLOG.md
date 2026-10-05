# Worklog

Neueste Einträge oben. Pro Eintrag: was geändert wurde, warum, und offene Punkte.

## 2026-10-05 – Tests ergänzt, Nachrechnung, Vorschau 2027

- Selbstbestätigenden Test (Formel mit sich selbst verglichen) durch ein von Hand nachgerechnetes Beispiel ersetzt (Saldo 20h52, Stichtag 02.10. → 62 AT, 37 AT mit OT, Saldo 31.12. 55h31, 6.5 Zusatztage).
- Neue Tests: negativer Saldo 31.12., Obergrenze Zusatztage, Ziel nicht erreichbar, Zeit-/Datumsformate.
- Neue Gegenprobe: unabhängige Tag-für-Tag-Simulation vs. `computeStatus` (300 Zufallsfälle im Test, separat 2000 Fälle geprüft): keine Abweichung bei Differenz, Saldo 31.12. und Zusatztagen.
- Unbenutzte Funktionen `cwd()` und `countDaysFromEnts()` entfernt. 18 Tests.
- Vorschau 2027 im README: 253 AT, OTP ≈ 55.9 Min./Tag.
- Eintritt März ist mit dem Januar-Workaround erledigt (Angabe Alex) und betrifft nur 2026.

## 2026-10-05 – Review-Fixes: Enter-Taste, Texte aus Parametern, Stichtag-Anzeige

- **Enter in einem Datumsfeld** rechnete mit dem alten Wert, weil Einträge erst beim Verlassen des Feldes (onblur) übernommen werden. Enter verlässt jetzt zuerst das aktive Feld, dann wird gerechnet.
- **Fest codierte Texte** durch Parameter ersetzt: Titel, Untertitel (Pensum, OT/Tag, Ferien, Ziel), „Kalender YR“ und die Sollzeiten (7h34 / 6h40) in den Ergebnissen. Neuer Anzeige-Parameter `PENSUM`, neuer Helfer `fhm()` („7h34“).
- **Stichtag unter dem Titel**: „Saldo-Stand per …“, aktualisiert bei jeder Änderung (auch beim Tippen des Saldos). Ungültiger Stichtag wird rot gemeldet statt still auf gestern zu fallen.
- **Tests**: neuer Test „Exakt im Plan → Hochrechnung ergibt genau 50 Tage, Aufholrate = Planrate“ (Kerneigenschaft des Modells). Notizkommentar im Hochrechnungs-Test bereinigt. 13 Tests.
- Entscheid: Eintritt März bleibt unmodelliert; Jan/Feb sind mit 4 Komp.- und 4 Ferientagen im Januar überbrückt (Angabe Alex). Einträge ausserhalb 2026 und halbe Tage in „zusätzlich kompensierbar“ vorerst unverändert.

## 2026-10-05 – Überzeit pro Tag aus dem 10-Wochen-Ziel berechnet

- Logik umgedreht: Statt fixer 50 Min./Tag wird die nötige Überzeit aus dem Ziel berechnet: `OTP = (ZIEL_TAGE − FERIEN_ANSPRUCH) × 7h34 ÷ (Arbeitstage − ZIEL_TAGE)` = 25 × 454 ÷ 202 ≈ **56.2 Min./Tag**.
  *Warum:* Das Ziel (10 Wochen) ist die feste Grösse, die Überzeit die abgeleitete. Bei Änderung von Ferienanspruch, Ziel oder Feiertagen passt sich der Wert automatisch an.
- Soll, Status (Plus/Minus) und Hochrechnung rechnen mit diesem Wert. Untertitel zeigt ihn dynamisch.
- Jahresmodell-Karte zeigt jetzt die Herleitung statt „was ist mit 50 Min. möglich“.
- Zusätzlich bleibt die „Aufholrate“ ab Stichtag (berücksichtigt aktuellen Rückstand/Vorsprung).
- `OTP` in `config.js` ist kein Parameter mehr, sondern wird in `initTWD()` gesetzt. Tests angepasst (inkl. Gegenprobe 202 × OTP = 25 × 7h34).
- README um Abschnitt Deployment ergänzt.

## 2026-10-05 – Ferienanspruch 25 Tage

- `FERIEN_ANSPRUCH` von 22.5 auf 25 Tage korrigiert (Angabe Alex).
- Jahresmodell neu: max. 22.5 Komp.-Tage → 47.5 Tage ≈ 9.5 Wochen. Für 10 Wochen fehlen 2.5 Tage (20h50 OT) bzw. ≈ 56 statt 50 Min./Tag.
- Entscheid: Eintritt März 2026 wird in der App nicht modelliert; Alex hat Jan/Feb manuell als Überzeit erfasst, das Soll ab 1.1. ist damit konsistent.
- Tests an neuen Anspruch angepasst.

## 2026-10-05 – Planung zukünftiger Tage, Hochrechnung, Jahresmodell

### Ausgangslage (Review)
- Geplante (zukünftige) Kompensationstage wurden voll zum Ist addiert, obwohl der Saldo sie noch nicht enthält → Status zu gut (z. B. +38h bei einer geplanten Woche). Deshalb konnten keine zukünftigen Tage eingetragen werden.
- Hochrechnung rechnete jeden verbleibenden AT mit 50 Min., auch geplante Ferien/Komp. → zu optimistisch.
- Tage, die doppelt gebucht waren (Ferien + Komp.), wurden im Soll doppelt abgezogen.
- „Gesamtziel OT“ war eine feste Zahl (27.5 × 7h34) ohne Bezug zur Machbarkeit.
- Saldo im Lesezeichen hatte kein Datum → beim späteren Öffnen lief „heute“ weiter, der Saldo nicht → Status driftete ins Minus.

### Änderungen
1. **Stichtag für den Saldo** (`Saldo-Stand inkl. Tag`, im Link gespeichert). Alles bis und mit Stichtag = bezogen, danach = geplant.
   *Warum:* Ohne festen Stichtag ist die Trennung bezogen/geplant nicht eindeutig, und ein gespeicherter Saldo veraltet.
   Standard gestern; beim Eintippen eines neuen Saldos automatisch auf gestern gesetzt. Alte Links ohne Stichtag laden mit gestern.
2. **Ist** zählt nur bezogene Komp.-Tage (Fix Fehler 1). Geplante Ferien/Komp. ändern die Differenz nicht mehr.
3. **Hochrechnung** (Fix Fehler 2): zieht geplante Ferien, geplante Komp. und den noch nicht geplanten Rest des Ferienanspruchs (22.5) ab. Zeigt Saldo per 31.12. und zusätzlich mögliche Komp.-Tage (halbe Tage).
4. **Doppelbuchungen** (Fehler 3): Warnung unter den Eingaben + rote Markierung im Kalender, für Ferien+Komp. am selben Tag und für überlappende Einträge innerhalb einer Liste. Jeder Tag zählt nur einmal; Konflikttag = Kompensation.
5. **Jahresmodell** ersetzt „Gesamtziel OT“: zeigt, was mit 50 Min./Tag maximal möglich ist. Ergebnis: ≈ 22.8 Komp.-Tage → 45.3 Tage ≈ 9.1 Wochen; für 10 Wochen fehlen ≈ 4.7 Tage bzw. es bräuchte ≈ 62 Min./Tag.
6. **Ziel-Karte**: erreichbare Abwesenheit im laufenden Jahr und nötige OT pro AT ab Stichtag, um 10 Wochen zu erreichen.
7. **Vorfeiertage**: Komp. an einem Vorfeiertag zählt 6h40 statt 7h34 (`VAC_PRE`). OT-Erzeugung unverändert 50 Min.
8. Neue Parameter `FERIEN_ANSPRUCH`, `ZIEL_TAGE`, `VAC_PRE` in `config.js`.
9. Technisch: Datumsparsing in lokaler Zeit (`parseISO`) statt `new Date("YYYY-MM-DD")` (UTC); Rechenlogik als reine Funktionen (`computeStatus`, `computeYearModel`) getrennt von der Darstellung; Tests in `tests/calc.test.js` (12 Tests, `node tests/calc.test.js`).

### Entscheide
- Nicht geplanter Ferienrest wird in der Hochrechnung als „wird noch bezogen“ angenommen. Alternative (nur eingetragene Ferien) wäre zu optimistisch.
- Konflikttage zählen als Kompensation (wie bisher im Kalender priorisiert).
- Jahresmodell bewusst ohne Vorfeiertage und ohne Übertrag: einfache, nachvollziehbare Obergrenze.

### Offen / zurückgestellt
- Übertrag aus Vorjahr (Startsaldo) → später.
- Halbe Tage / Stunden-Kompensation → später.
- Vorfeiertags-Liste mit WWZ-Regelung abgleichen (30.12., 31.07., 14.08.).
- 2027: Jahr/Feiertage parametrisieren.
