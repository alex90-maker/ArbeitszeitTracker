# Arbeitszeit-Tracker 2026

Statische Web-App (HTML/JS, kein Build, kein Server), die meine Überzeit gegen den Plan rechnet:
**90 % Pensum, faktisch 100 % arbeiten → 50 Min. Überzeit pro Arbeitstag**, die als Kompensationstage bezogen werden.
Ziel: zusammen mit dem Ferienanspruch **10 Wochen (50 Tage) Abwesenheit** pro Jahr.

Starten: `index.html` im Browser öffnen. Daten werden im URL-Hash gespeichert („Speichern“ → Lesezeichen).

## Parameter (`js/config.js`)

| Variable | Wert | Bedeutung |
|---|---|---|
| `YR` | 2026 | Berechnungsjahr |
| `VAC` | 454 | Sollzeit/Tag bei 90 % in Min. (7h34 = 90 % von 8h24) |
| `VAC_PRE` | 400 | Sollzeit an Vorfeiertagen bei 90 % (6h40) |
| `OTP` | 50 | Geplante Überzeit pro gearbeitetem Tag in Min. |
| `FERIEN_ANSPRUCH` | 25 | Ferientage pro Jahr |
| `ZIEL_TAGE` | 50 | Ziel Abwesenheit (Ferien + Kompensation) in Tagen |
| `H` / `PRE` | – | Feiertage bzw. Vorfeiertage Kanton Zug 2026 |

## Eingaben

- **Saldo**: Überzeitsaldo aus der Zeiterfassung (HH:MM, negativ mit `-`).
- **Saldo-Stand inkl. Tag (Stichtag)**: letzter Tag, der im Saldo enthalten ist. Standard: gestern; wird beim Tippen eines neuen Saldos automatisch auf gestern gesetzt.
- **Kompensation / Ferien**: einzelne Tage oder Bereiche. Gezählt werden nur Arbeitstage (keine Wochenenden/Feiertage).
  Einträge **bis und mit Stichtag = bezogen**, **danach = geplant**.

## Berechnungsmodell

Begriffe: AT = Arbeitstag, OT = Überzeit, Komp. = Kompensationstag.

**1. Stand per Stichtag (Ist vs. Soll)**

- Ist (brutto erarbeitete OT) = Saldo + Σ Sollzeit der *bezogenen* Komp.-Tage (7h34, an Vorfeiertagen 6h40)
- Soll = (AT bis Stichtag − bezogene Ferientage − bezogene Komp.-Tage) × 50 Min.
- Differenz = Ist − Soll → Status „Über / Im / Unter Plan“ (Toleranz ±60 Min.)

Geplante Einträge (nach dem Stichtag) beeinflussen diesen Teil nicht.

**2. Hochrechnung bis 31.12.**

- Verbleibende AT nach Stichtag − geplante Ferien − noch nicht geplanter Ferienanspruch − geplante Komp. = AT, die noch OT erzeugen
- Annahme: Der restliche Ferienanspruch wird noch im Jahr bezogen (erzeugt also keine OT), auch wenn er noch nicht eingetragen ist.
- Saldo 31.12. = Saldo + Zufluss (AT × 50 Min.) − Sollzeit der geplanten Komp.-Tage
- Zusätzlich kompensierbar = Saldo 31.12. ÷ (7h34 + 50 Min.), abgerundet auf halbe Tage.
  Ein zusätzlicher Komp.-Tag kostet 7h34 und erzeugt an dem Tag keine 50 Min.

**3. Ziel 10 Wochen**

- Erreichbare Abwesenheit = Ferien (Anspruch) + Komp. bezogen + geplant + zusätzlich möglich
- Nötige OT pro AT für das Ziel = (fehlende Komp.-Tage × 7h34 − (Saldo − geplante Komp.)) ÷ verbleibende AT mit OT

**4. Jahresmodell (theoretisch, ab Saldo 0 am 1.1.)**

Mit *k* = Komp.-Tage gilt: (252 − 25 − k) × 50 = k × 454 → **k = 227 × 50 / 504 ≈ 22.5 Tage**.

| | Wert |
|---|---|
| Arbeitstage 2026 Kt. Zug | 252 |
| Max. Komp.-Tage bei 50 Min./Tag | 22.5 |
| Total Abwesenheit | 47.5 Tage ≈ 9.5 Wochen |
| Fehlend zum Ziel (25 Komp.-Tage) | 2.5 Tage ≈ 20h50 OT |
| Nötige OT/Tag für 10 Wochen | ≈ 56 Min. |

→ **Mit 50 Min./Tag sind rund 9.5 statt 10 Wochen möglich** (ohne Übertrag aus dem Vorjahr).
Eintritt 2026 (März) wird nicht modelliert; Jan/Feb sind manuell als Überzeit im Saldo erfasst.
Das Modell ignoriert Vorfeiertage (Komp. an Vorfeiertagen kostet nur 6h40 → minimal mehr Spielraum).

## Vorfeiertage

Die Sollzeit ist an Vorfeiertagen 6h40 statt 7h34. Für die OT-Erzeugung spielt das keine Rolle (es zählen weiterhin 50 Min. über Soll).
Relevant ist es nur, wenn an einem Vorfeiertag **kompensiert** wird: Die Zeiterfassung zieht dann nur 6h40 ab, deshalb rechnet die App dort mit 6h40.

## Bekannte Einschränkungen / offene Punkte

- **Übertrag aus dem Vorjahr** wird nicht berücksichtigt: Das Soll startet am 1.1. bei 0. Ein Übertrag im Saldo lässt den Stand zu gut aussehen. (bewusst zurückgestellt)
- **Halbe Tage / Stunden-Kompensation** nicht erfassbar. (bewusst zurückgestellt)
- Jahr und Feiertage sind fest auf 2026 codiert → für 2027 neu aufsetzen.
- Vorfeiertags-Liste prüfen: `2026-12-30` ist als „Vorfeiertag Stephanstag“ beschriftet (Stephanstag = 26.12.); 31.07. und 14.08. sind Freitage vor Feiertagen, die auf Samstag fallen. Ob das bei WWZ als Vorfeiertag gilt, ist ungeklärt. Wirkt sich nur bei Kompensation an diesen Tagen aus (54 Min. pro Tag).
- Bei Ferien und Kompensation am selben Tag wird gewarnt; gerechnet wird der Tag als Kompensation.

## Struktur

```
index.html          UI
css/style.css       Styles
js/config.js        Parameter, Feiertage
js/utils.js         Datums-/Zeit-Helfer, analyzeEntries()
js/entries.js       Eingabelisten, Doppelbuchungs-Warnung
js/calendar.js      Jahreskalender
js/calculate.js     computeStatus(), computeYearModel() (rein) + Darstellung
js/storage.js       Speichern/Laden über URL-Hash
tests/calc.test.js  Tests der Rechenlogik: node tests/calc.test.js
```

Siehe `WORKLOG.md` für Änderungen und Entscheide.
