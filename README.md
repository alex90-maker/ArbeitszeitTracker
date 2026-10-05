# Arbeitszeit-Tracker 2026

Statische Web-App (HTML/JS, kein Build, kein Server) für meine Überzeit.
**Ziel: 10 Wochen (50 Tage) Abwesenheit pro Jahr** = 25 Ferientage + 25 Kompensationstage.
Ich bin mit 90 % angestellt und erarbeite die Kompensationstage durch tägliche Überzeit.
Die App berechnet aus dem Ziel, **wie viel Überzeit pro Arbeitstag nötig ist**, und misst daran, ob ich im Plus oder Minus bin.

Starten: `index.html` im Browser öffnen. Daten werden im URL-Hash gespeichert („Speichern“ → Lesezeichen).

## Parameter (`js/config.js`)

| Variable | Wert | Bedeutung |
|---|---|---|
| `YR` | 2026 | Berechnungsjahr |
| `PENSUM` | 90 | Pensum in % – nur Anzeige; `VAC`/`VAC_PRE` passend setzen |
| `VAC` | 454 | Sollzeit/Tag bei 90 % in Min. (7h34 = 90 % von 8h24) |
| `VAC_PRE` | 400 | Sollzeit an Vorfeiertagen bei 90 % (6h40) |
| `FERIEN_ANSPRUCH` | 25 | Ferientage pro Jahr |
| `ZIEL_TAGE` | 50 | Ziel Abwesenheit (Ferien + Kompensation) in Tagen |
| `OTP` | berechnet | Nötige Überzeit pro gearbeitetem Tag (siehe Jahresmodell) |
| `H` / `PRE` | – | Feiertage bzw. Vorfeiertage Kanton Zug 2026 |

## Eingaben

- **Saldo**: Überzeitsaldo aus der Zeiterfassung (HH:MM, negativ mit `-`).
- **Saldo-Stand inkl. Tag (Stichtag)**: letzter Tag, der im Saldo enthalten ist. Standard: gestern; wird beim Tippen eines neuen Saldos automatisch auf gestern gesetzt. Der aktuelle Stichtag wird unter dem Titel angezeigt (rot, falls ungültig).
- **Kompensation / Ferien**: einzelne Tage oder Bereiche. Gezählt werden nur Arbeitstage (keine Wochenenden/Feiertage).
  Einträge **bis und mit Stichtag = bezogen**, **danach = geplant**.

## Berechnungsmodell

Begriffe: AT = Arbeitstag, OT = Überzeit, Komp. = Kompensationstag.

**1. Jahresmodell → nötige Überzeit pro Tag (`OTP`)**

- Komp.-Tage für das Ziel = 50 − 25 Ferien = **25 Tage** → 25 × 7h34 = **189h10 OT**
- Tage mit Überzeit = 252 AT − 50 Tage Abwesenheit = **202 AT**
- **OTP = 189h10 ÷ 202 ≈ 56.2 Min. pro gearbeitetem Tag**

Ändern sich Ferienanspruch, Ziel oder Feiertage, rechnet sich `OTP` automatisch neu.
Annahmen: Saldo am 1.1. = 0; Vorfeiertage nicht berücksichtigt (Komp. an einem Vorfeiertag kostet nur 6h40 → minimal Reserve).

**2. Stand per Stichtag (Plus/Minus)**

- Ist (brutto erarbeitete OT) = Saldo + Σ Sollzeit der *bezogenen* Komp.-Tage (7h34, an Vorfeiertagen 6h40)
- Soll = (AT bis Stichtag − bezogene Ferientage − bezogene Komp.-Tage) × OTP
- Differenz = Ist − Soll → Status „Über / Im / Unter Plan“ (Toleranz ±60 Min.)

Geplante Einträge (nach dem Stichtag) beeinflussen diesen Teil nicht.

**3. Hochrechnung bis 31.12.**

- Verbleibende AT nach Stichtag − geplante Ferien − noch nicht geplanter Ferienanspruch − geplante Komp. = AT, die noch OT erzeugen
- Annahme: Der restliche Ferienanspruch wird noch im Jahr bezogen (erzeugt also keine OT), auch wenn er noch nicht eingetragen ist.
- Saldo 31.12. = Saldo + Zufluss (AT × OTP) − Sollzeit der geplanten Komp.-Tage
- Zusätzlich kompensierbar = Saldo 31.12. ÷ (7h34 + OTP), abgerundet auf halbe Tage.
  Ein zusätzlicher Komp.-Tag kostet 7h34 und erzeugt an dem Tag keine Überzeit.

**4. Ziel 10 Wochen (laufendes Jahr)**

- Erreichbare Abwesenheit = Ferien (Anspruch) + Komp. bezogen + geplant + zusätzlich möglich
- Nötige OT pro AT ab Stichtag = (fehlende Komp.-Tage × 7h34 − (Saldo − geplante Komp.)) ÷ verbleibende AT mit OT.
  Unterschied zu OTP: Dieser Wert berücksichtigt den aktuellen Rückstand bzw. Vorsprung („Aufholrate“).

## Vorfeiertage

Die Sollzeit ist an Vorfeiertagen 6h40 statt 7h34. Für die OT-Erzeugung spielt das keine Rolle (es zählt die Überzeit über Soll).
Relevant ist es nur, wenn an einem Vorfeiertag **kompensiert** wird: Die Zeiterfassung zieht dann nur 6h40 ab, deshalb rechnet die App dort mit 6h40.

## Bekannte Einschränkungen / offene Punkte

- **Eintritt März 2026** wird nicht modelliert (siehe unten).
- **Übertrag aus dem Vorjahr** wird nicht berücksichtigt: Das Soll startet am 1.1. bei 0. (bewusst zurückgestellt)
- **Halbe Tage / Stunden-Kompensation** nicht erfassbar. (bewusst zurückgestellt)
- Jahr und Feiertage sind fest auf 2026 codiert → für 2027 neu aufsetzen. Einträge ausserhalb von 2026 werden in der Berechnung ignoriert, in den Totalen unter den Eingabelisten aber mitgezählt (bewusst zurückgestellt).
- Eintritt März: Jan/Feb sind mit 4 Komp.- und 4 Ferientagen im Januar überbrückt. Diese Tage zählen in „Erreichbare Abwesenheit“ und im Ferienanspruch mit.
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
js/calculate.js     computeYearModel(), computeStatus() (rein) + Darstellung
js/storage.js       Speichern/Laden über URL-Hash
tests/calc.test.js  Tests der Rechenlogik: node tests/calc.test.js
```

## Deployment

Kein Build-Schritt: Die Dateien werden so ausgeliefert, wie sie im Repo liegen.
Lokal: `index.html` öffnen. Mit GitHub Pages: Nach dem Push auf den Pages-Branch wird die Seite automatisch neu veröffentlicht (ca. 1 Min.).
Gespeicherte Links (URL-Hash) bleiben kompatibel; alte Links ohne Stichtag laden mit Stichtag = gestern.

Siehe `WORKLOG.md` für Änderungen und Entscheide.
