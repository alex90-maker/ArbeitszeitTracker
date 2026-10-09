# Arbeitszeit-Tracker 2026

Statische Web-App (HTML/JS, kein Build, kein Server) für meine Überzeit.
**Ziel: Abwesenheit pro Jahr** = Ferientage + Kompensationstage, in der App anpassbar (Standard 25 + 25 = 50 Tage = 10 Wochen). Zusätzliche Ferientage können gekauft werden.
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
| `FERIEN_ANSPRUCH` | 25 | Vertraglicher Ferienanspruch; Ferien im Ziel darüber gelten als gekauft |
| `ZIEL_FERIEN` | 25 | Startwert Ziel Ferientage (in der App änderbar, im Link gespeichert) |
| `ZIEL_KOMP` | 25 | Startwert Ziel Kompensationstage (in der App änderbar, im Link gespeichert) |
| `OTP` | berechnet | Nötige Überzeit pro gearbeitetem Tag (siehe Jahresmodell) |
| `H` / `PRE` | – | Feiertage bzw. Vorfeiertage Kanton Zug 2026 |

## Eingaben

- **Saldo**: Überzeitsaldo aus der Zeiterfassung (HH:MM, negativ mit `-`).
- **Saldo-Stand inkl. Tag (Stichtag)**: letzter Tag, der im Saldo enthalten ist. Wird beim Laden der Seite und beim Tippen eines neuen Saldos immer auf gestern gesetzt und nicht im Link gespeichert. **Saldo bei jedem Öffnen aktualisieren:** Ein alter Saldo mit neuem Stichtag zeigt pro nicht nachgeführtem Arbeitstag ≈ 56 Min. zu viel Minus. Der aktuelle Stichtag wird unter dem Titel angezeigt (rot, falls ungültig).
- **Kompensation / Ferien**: einzelne Tage oder Bereiche. Gezählt werden nur Arbeitstage (keine Wochenenden/Feiertage).
  Einträge **bis und mit Stichtag = bezogen**, **danach = geplant**.

- **Ziel Abwesenheit**: Ferientage (inkl. gekaufte) und Kompensationstage für das Jahr. Daraus rechnet die App die nötige Überzeit pro Tag (`OTP`), den Plus/Minus-Status und die nötige Überzeit bis 31.12. Achtung: Wird das Ziel unterjährig erhöht, wird auch der bisherige Stand am neuen Ziel gemessen (Status rutscht sofort ins Minus).

## Berechnungsmodell

Begriffe: AT = Arbeitstag, OT = Überzeit, Komp. = Kompensationstag.

**1. Jahresmodell → nötige Überzeit pro Tag (`OTP`)**

- OTP = Ziel-Komp.-Tage × 7h34 ÷ (AT − Ziel-Ferien − Ziel-Komp.)
- Standard 25 + 25: 25 × 7h34 = 189h10 OT ÷ (252 − 50 = 202 AT) ≈ **56.2 Min.** pro gearbeitetem Tag
- Beispiele: 30 Ferien + 25 Komp. → 189h10 ÷ 197 ≈ 57.6 Min.; 27 Ferien + 23 Komp. → 174h02 ÷ 202 ≈ 51.7 Min.

Ändern sich Ferienanspruch, Ziel oder Feiertage, rechnet sich `OTP` automatisch neu.
Annahmen: Saldo am 1.1. = 0; Vorfeiertage nicht berücksichtigt (Komp. an einem Vorfeiertag kostet nur 6h40 → minimal Reserve).

**2. Stand per Stichtag (Plus/Minus)**

- Ist (brutto erarbeitete OT) = Saldo + Σ Sollzeit der *bezogenen* Komp.-Tage (7h34, an Vorfeiertagen 6h40)
- Soll = (AT bis Stichtag − bezogene Ferientage − bezogene Komp.-Tage) × OTP
- Differenz = Ist − Soll → Status „Über / Im / Unter Plan“ (Toleranz ±60 Min.)

Geplante Einträge (nach dem Stichtag) beeinflussen diesen Teil nicht.

**3. Hochrechnung bis 31.12.**

- Verbleibende AT nach Stichtag − geplante Ferien − Ferien laut Ziel, noch nicht eingetragen − geplante Komp. = AT, die noch OT erzeugen
- Annahme: Die Ferien laut Ziel werden alle noch im Jahr bezogen (erzeugen also keine OT), auch wenn sie noch nicht eingetragen sind.
- Saldo 31.12. = Saldo + Zufluss (AT × OTP) − Sollzeit der geplanten Komp.-Tage
- Zusätzlich kompensierbar = Saldo 31.12. ÷ (7h34 + OTP), abgerundet auf halbe Tage.
  Ein zusätzlicher Komp.-Tag kostet 7h34 und erzeugt an dem Tag keine Überzeit.

**4. Ziel (laufendes Jahr)**

- Erreichbare Abwesenheit (bei OTP) = Ferien laut Ziel + Komp. bezogen + geplant + zusätzlich möglich
- Offene Komp.-Tage = Ziel-Komp. − bezogene − geplante Komp.-Tage
- **Nötige OT pro AT bis 31.12.** = (offene Komp.-Tage × 7h34 − (Saldo − geplante Komp.)) ÷ AT, die nach allen Ferien und Komp. bis 31.12. noch bleiben.
  Unterschied zu OTP: Dieser Wert berücksichtigt den aktuellen Rückstand bzw. Vorsprung („Aufholrate“).

## Vorfeiertage

Die Sollzeit ist an Vorfeiertagen 6h40 statt 7h34. Für die OT-Erzeugung spielt das keine Rolle (es zählt die Überzeit über Soll).
Relevant ist es nur, wenn an einem Vorfeiertag **kompensiert** wird: Die Zeiterfassung zieht dann nur 6h40 ab, deshalb rechnet die App dort mit 6h40.

## Bekannte Einschränkungen / offene Punkte

- **Eintritt März 2026** wird nicht modelliert (siehe unten).
- **Übertrag aus dem Vorjahr** wird nicht berücksichtigt: Das Soll startet am 1.1. bei 0. (bewusst zurückgestellt)
- **Halbe Tage / Stunden-Kompensation** nicht erfassbar. (bewusst zurückgestellt)
- Jahr und Feiertage sind fest auf 2026 codiert → für 2027 neu aufsetzen (siehe Abschnitt 2027). Einträge ausserhalb von 2026 werden in der Berechnung ignoriert, in den Totalen unter den Eingabelisten aber mitgezählt (bewusst zurückgestellt).
- Eintritt März: Jan/Feb sind mit 4 Komp.- und 4 Ferientagen im Januar überbrückt. Diese Tage zählen in „Erreichbare Abwesenheit“ und im Ferienziel mit.
- Vorfeiertags-Liste prüfen: `2026-12-30` ist als „Vorfeiertag Stephanstag“ beschriftet (Stephanstag = 26.12.); 31.07. und 14.08. sind Freitage vor Feiertagen, die auf Samstag fallen. Ob das bei WWZ als Vorfeiertag gilt, ist ungeklärt. Wirkt sich nur bei Kompensation an diesen Tagen aus (54 Min. pro Tag).
- Bei Ferien und Kompensation am selben Tag wird gewarnt; gerechnet wird der Tag als Kompensation.

## Vorschau 2027

Für 2027 `YR`, `H`, `HNAMES` und `PRE` anpassen; `OTP` rechnet sich dann selbst. Erwartete Werte (Kt. Zug, gleiche Feiertage wie 2026):

- Ostern 28.03.2027 → Karfreitag 26.03., Ostermontag 29.03., Auffahrt 06.05., Pfingstmontag 17.05., Fronleichnam 27.05.
- Auf Wochenende: Berchtoldstag (Sa), 01.08. (So), 15.08. (So), 25.12. (Sa), 26.12. (So)
- 261 Wochentage − 8 Feiertage = **253 AT** (2026: 252) → 203 Tage mit OT
- **OTP 2027 = 25 × 454 ÷ 203 ≈ 55.9 Min./Tag** (2026: 56.2)
- Ein Übertrag aus 2026 ist darin nicht enthalten: je 1 h Übertrag sinkt der Bedarf um ≈ 0.3 Min./Tag (60 ÷ 203).

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
tests/calc.test.js  Tests der Rechenlogik inkl. Tag-für-Tag-Gegenprobe: node tests/calc.test.js
```

## Deployment

Kein Build-Schritt: Die Dateien werden so ausgeliefert, wie sie im Repo liegen.
Lokal: `index.html` öffnen. Mit GitHub Pages: Nach dem Push auf den Pages-Branch wird die Seite automatisch neu veröffentlicht (ca. 1 Min.).
Gespeicherte Links (URL-Hash) bleiben kompatibel; ein in älteren Links gespeicherter Stichtag wird ignoriert (Stichtag = gestern).

Siehe `WORKLOG.md` für Änderungen und Entscheide.
