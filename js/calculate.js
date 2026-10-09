// ===== Berechnung (rein, ohne DOM) =====
// Modell und Begriffe: siehe README.md

function initTWD() {
  var n = 0, d = new Date(YR, 0, 1);
  while (d.getFullYear() === YR) { if (isWD(d)) n++; d = addDays(d, 1); }
  TWD = n;
  OTP = computeYearModel().otp;
}

// Jahresziel setzen und die noetige Ueberzeit pro Tag (OTP) neu berechnen.
function setZiel(ferien, komp) {
  ZIEL_FERIEN = ferien; ZIEL_KOMP = komp;
  OTP = computeYearModel().otp;
}

// Jahresmodell: Welche Ueberzeit pro gearbeitetem Tag braucht es fuer das Ziel?
// Ziel = ZIEL_FERIEN + ZIEL_KOMP Tage Abwesenheit.
// Gearbeitet wird an TWD - Ziel Tagen; die dort erzeugte OT muss die
// Kompensationstage (je VAC) decken. Annahmen: Saldo 1.1. = 0, Vorfeiertage nicht beruecksichtigt.
function computeYearModel() {
  var zielKomp = ZIEL_KOMP;
  var arbeitstage = TWD - zielTage();
  var otZiel = zielKomp * VAC;
  return {
    twd: TWD,
    zielKomp: zielKomp,
    arbeitstage: arbeitstage,
    otZiel: otZiel,
    otp: arbeitstage > 0 ? otZiel / arbeitstage : 0
  };
}

// Stand per Stichtag + Hochrechnung bis 31.12.
// input: { saldo: Minuten, stichtag: "YYYY-MM-DD" (Saldo enthaelt alle Tage bis und mit Stichtag),
//          komp: [{f,t}], ferien: [{f,t}] }
function computeStatus(input) {
  var komp = analyzeEntries(input.komp), fer = analyzeEntries(input.ferien);
  var x = input.stichtag;
  var r = {
    elAT: 0, remAT: 0,
    kompPast: 0, kompPastMin: 0, kompFut: 0, kompFutMin: 0,
    ferPast: 0, ferFut: 0,
    conflicts: [], dupesKomp: keys(komp.dupes), dupesFer: keys(fer.dupes)
  };

  for (var d = new Date(YR, 0, 1); d.getFullYear() === YR; d = addDays(d, 1)) {
    if (!isWD(d)) continue;
    var s = ds(d), past = s <= x;
    var isK = !!komp.wd[s], isF = !!fer.wd[s];
    if (isK && isF) r.conflicts.push(s);
    if (past) {
      r.elAT++;
      if (isK) { r.kompPast++; r.kompPastMin += sollMin(s); }
      else if (isF) r.ferPast++;
    } else {
      r.remAT++;
      if (isK) { r.kompFut++; r.kompFutMin += sollMin(s); }
      else if (isF) r.ferFut++;
    }
  }

  // Stand per Stichtag
  r.otG = input.saldo + r.kompPastMin;                          // brutto erarbeitete OT
  r.otS = (r.elAT - r.ferPast - r.kompPast) * OTP;              // Soll bei OTP Min. pro gearbeitetem Tag
  r.diff = r.otG - r.otS;

  // Hochrechnung ab Stichtag
  var ferEingetragen = r.ferPast + r.ferFut;
  r.ferUeber = Math.max(0, ferEingetragen - ZIEL_FERIEN);     // mehr Ferien eingetragen als im Ziel
  var frei = r.remAT - r.ferFut - r.kompFut;                    // noch unverplante Arbeitstage
  r.ferRest = Math.min(Math.max(0, ZIEL_FERIEN - ferEingetragen), Math.max(0, frei)); // Ferien laut Ziel, noch nicht eingetragen
  r.arbFut = Math.max(0, frei - r.ferRest);                     // Tage, die noch OT erzeugen (vor zusaetzlicher Komp.)
  r.zufluss = r.arbFut * OTP;
  r.saldoEnd = input.saldo + r.zufluss - r.kompFutMin;          // Saldo 31.12. ohne weitere Kompensation
  var kAdd = r.saldoEnd > 0 ? Math.floor(r.saldoEnd / (VAC + OTP) * 2) / 2 : 0;
  r.kAdd = Math.min(kAdd, r.arbFut);
  r.kompJahr = r.kompPast + r.kompFut + r.kAdd;
  r.ferJahr = ferEingetragen + r.ferRest;
  r.abwesenheit = r.ferJahr + r.kompJahr;

  // Was braucht es ab jetzt fuer das Ziel?
  r.kompFehlend = Math.max(0, ZIEL_KOMP - r.kompPast - r.kompFut);   // Komp.-Tage laut Ziel, noch nicht eingetragen
  r.wRest = r.arbFut - r.kompFehlend;                           // Arbeitstage, die dann noch bleiben
  r.otBedarf = r.kompFehlend * VAC - (input.saldo - r.kompFutMin);
  r.otProTagFuerZiel = r.wRest > 0 ? Math.max(0, r.otBedarf / r.wRest) : null;
  return r;
}

// ===== Darstellung =====

function calculate() {
  var se = document.getElementById("saldo"), xe = document.getElementById("stichtag");
  se.value = nm(se.value); ut();
  var s = pt(se.value), o = document.getElementById("output");
  if (s === null) { o.innerHTML = "<div class='error-box'>Bitte Saldo eingeben (z.B. 20:52)</div>"; return; }
  var x = toISO(xe.value);
  if (!parseISO(x)) { o.innerHTML = "<div class='error-box'>Bitte Stichtag des Saldos eingeben (dd.mm.yyyy)</div>"; return; }
  xe.value = toCH(x);

  var y = computeYearModel();
  if (y.arbeitstage <= 0) { o.innerHTML = "<div class='error-box'>Ziel zu hoch: " + zielTage() + " Tage Abwesenheit bei " + TWD + " Arbeitstagen.</div>"; return; }
  var r = computeStatus({ saldo: s, stichtag: x, komp: kompEnts, ferien: ferienEnts });

  var st, co, av, diff = r.diff;
  if (diff > 60)       { st = "Ueber Plan"; co = "#16a34a"; av = "Du koenntest weniger arbeiten oder mehr kompensieren."; }
  else if (diff < -60) { st = "Unter Plan"; co = "#dc2626"; av = "Du liegst unter " + f1(OTP) + " Min. pro gearbeitetem Tag."; }
  else                 { st = "Im Plan";    co = "#d97706"; av = "Weiter so - du bist genau auf Kurs."; }

  var sg = diff >= 0 ? "+" : "-", dc = diff >= 0 ? "#16a34a" : "#dc2626";
  var dd = f1(Math.abs(diff) / VAC);

  function rw(l, v) { return "<div class='detail-row'><span>" + l + "</span><span>" + v + "</span></div>"; }
  function card(title, body) { return "<div class='white-card'><div class='wc-label' style='margin-bottom:10px'>" + title + "</div>" + body + "</div>"; }
  function big(label, val, color, sub) {
    return "<div style='border-top:2px solid #e2e8f0;margin-top:8px;padding-top:10px'><div class='wc-label'>" + label
      + "</div><div class='diff-val' style='color:" + color + "'>" + val + "</div><div class='diff-sub'>" + sub + "</div></div>";
  }

  var warn = "";
  if (r.saldoEnd < 0) warn += "<div class='warn-box'>Die geplante Kompensation uebersteigt die bis 31.12. erwartete Ueberzeit um " + fm(-r.saldoEnd) + ".</div>";
  if (r.ferUeber > 0) warn += "<div class='warn-box'>Eingetragene Ferien (" + f1(r.ferPast + r.ferFut) + " Tage) uebersteigen dein Ferienziel von " + fd(ZIEL_FERIEN) + " Tagen.</div>";

  var zt = zielTage(), wo = fd(zt / 5);
  var zielOk = r.abwesenheit >= zt;
  var bedarf = r.otProTagFuerZiel === null ? "nicht erreichbar" : Math.ceil(r.otProTagFuerZiel) + " Min.";
  var gekauft = ZIEL_FERIEN - FERIEN_ANSPRUCH;

  o.innerHTML = warn
    + "<div class='status-banner' style='background:" + co + "'><div class='status-title'>" + st + "</div><div class='status-advice'>" + av + "</div></div>"
    + "<div class='white-card'><div class='wc-label'>Differenz zum Soll per " + toCH(x) + "</div><div class='diff-val' style='color:" + dc + "'>" + sg + fm(Math.abs(diff)) + "</div><div class='diff-sub'>ca. " + sg + dd + " Tage &agrave; " + fhm(VAC) + "</div></div>"
    + card("Stand per " + toCH(x),
        rw("Vergangene AT (bis Stichtag)", r.elAT + " / " + TWD)
      + rw("Davon Ferientage", r.ferPast)
      + rw("Davon Kompensationstage", r.kompPast)
      + rw("OT generiert (Saldo + kompensiert)", fm(r.otG))
      + rw("OT-Soll (" + f1(OTP) + " Min. &times; " + (r.elAT - r.ferPast - r.kompPast) + " gearbeitete AT)", fm(r.otS)))
    + card("Hochrechnung bis 31.12." + YR,
        rw("Aktuelles Saldo", fm(s))
      + rw("Verbleibende AT nach Stichtag", r.remAT)
      + rw("&minus; geplante Ferien", r.ferFut)
      + rw("&minus; Ferien laut Ziel, noch nicht eingetragen", f1(r.ferRest))
      + rw("&minus; geplante Kompensation", r.kompFut + " Tage (" + fm(r.kompFutMin) + ")")
      + rw("= AT mit Ueberzeit", f1(r.arbFut))
      + rw("Zufluss " + f1(r.arbFut) + " AT &times; " + f1(OTP) + " Min", "+" + fm(r.zufluss))
      + rw("Saldo 31.12. nach geplanter Komp.", fm(r.saldoEnd))
      + rw("Kosten / zusaetzlicher Komp.-Tag", fm(OTP + VAC))
      + big("Zusaetzlich kompensierbar bis 31.12." + YR, f1(r.kAdd) + " Tage", "#7c3aed", "zusaetzlich zu den bereits geplanten Kompensationstagen"))
    + card("Ziel " + YR + ": " + fd(ZIEL_FERIEN) + " Ferien + " + fd(ZIEL_KOMP) + " Komp. = " + fd(zt) + " Tage (" + wo + " Wochen)",
        rw("Ferien: Ziel / eingetragen / noch einzutragen", fd(ZIEL_FERIEN) + " / " + (r.ferPast + r.ferFut) + " / " + fd(r.ferRest))
      + (gekauft > 0 ? rw("davon gekauft (ueber Anspruch " + FERIEN_ANSPRUCH + ")", fd(gekauft) + " Tage") : "")
      + rw("Kompensation: Ziel / bezogen / geplant / noch offen", fd(ZIEL_KOMP) + " / " + r.kompPast + " / " + r.kompFut + " / " + fd(r.kompFehlend))
      + rw("Benoetigte OT ab Stichtag (offene Komp. &minus; Saldo + geplante Komp.)", fm(Math.max(0, r.otBedarf)))
      + rw("AT mit Ueberzeit bis 31.12. (nach allen Ferien und Komp.)", r.wRest > 0 ? fd(r.wRest) : "keine")
      + rw("Erreichbare Abwesenheit bei " + f1(OTP) + " Min./Tag", fd(r.abwesenheit) + " Tage (" + fd(r.abwesenheit / 5) + " Wochen)")
      + big("Noetige Ueberzeit pro AT bis 31.12.", bedarf, r.otProTagFuerZiel === null ? "#dc2626" : "#2563eb",
          r.otProTagFuerZiel === null ? "Bis Ende Jahr bleiben keine Arbeitstage fuer die offenen Komp.-Tage" : "damit " + fd(zt) + " Tage Ziel erreicht werden (Plan-Durchschnitt Jahr: " + f1(OTP) + " Min.)"))
    + card("Jahresmodell: noetige Ueberzeit fuer " + fd(zt) + " Tage",
        rw("Arbeitstage " + YR + " (Kt. Zug)", y.twd)
      + rw("&minus; Ziel-Abwesenheit (" + fd(ZIEL_FERIEN) + " Ferien + " + fd(ZIEL_KOMP) + " Komp.)", fd(zt) + " Tage")
      + rw("= Tage mit Ueberzeit", fd(y.arbeitstage))
      + rw("Komp.-Tage laut Ziel", fd(y.zielKomp))
      + rw("Benoetigte OT (" + fd(y.zielKomp) + " &times; " + fhm(VAC) + ")", fm(y.otZiel))
      + big("Benoetigte Ueberzeit pro Arbeitstag", f1(y.otp) + " Min.", "#2563eb", fm(y.otZiel) + " &divide; " + fd(y.arbeitstage) + " AT &middot; Basis fuer Soll und Status"))
    + "<div class='info-box'>Saldo = Stand inkl. Stichtag. Ist = Saldo + bezogene Komp.-Tage &times; Sollzeit (" + fhm(VAC) + ", Vorfeiertag " + fhm(VAC_PRE) + "). "
    + "Soll = (AT bis Stichtag &minus; Ferien &minus; Komp.) &times; " + f1(OTP) + " Min. (aus Jahresziel berechnet). Eintraege nach dem Stichtag gelten als geplant. "
    + "Details: README.md</div>";
}
