# Worklog

Neueste Einträge oben. Pro Eintrag: was geändert wurde, warum, und offene Punkte.

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
