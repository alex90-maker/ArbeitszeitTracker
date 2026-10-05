// ===== Berechnung (rein, ohne DOM) =====
// Modell und Begriffe: siehe README.md

function initTWD() {
  var n = 0, d = new Date(YR, 0, 1);
  while (d.getFullYear() === YR) { if (isWD(d)) n++; d = addDays(d, 1); }
  TWD = n;
}

// Theoretisches Jahresmodell: Was ist mit OTP Min./Tag ueber das ganze Jahr moeglich?
// Annahme: Saldo am 1.1. = 0, voller Ferienanspruch wird bezogen,
// Kompensationstage kosten VAC (Vorfeiertage nicht beruecksichtigt).
function computeYearModel() {
  var avail = TWD - FERIEN_ANSPRUCH;                  // Tage ohne normale Ferien
  var kMax = avail * OTP / (VAC + OTP);               // jeder Komp.-Tag kostet VAC und erzeugt keine OTP
  var total = FERIEN_ANSPRUCH + kMax;
  var zielKomp = ZIEL_TAGE - FERIEN_ANSPRUCH;
  var otMoeglich = (TWD - FERIEN_ANSPRUCH - kMax) * OTP;
  var otZiel = zielKomp * VAC;                        // benoetigte OT fuer das Ziel
  var otZielErzeugbar = (TWD - ZIEL_TAGE) * OTP;      // OT bei OTP Min. an allen Tagen ausser Ziel-Abwesenheit
  return {
    twd: TWD,
    avail: avail,
    kMax: kMax,
    total: total,
    wochen: total / 5,
    zielKomp: zielKomp,
    otMoeglich: otMoeglich,
    otZiel: otZiel,
    lueckeMin: otZiel - otZielErzeugbar,
    lueckeTage: zielKomp - kMax,
    otProTagFuerZiel: otZiel / (TWD - ZIEL_TAGE)
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
  r.ferUeber = Math.max(0, ferEingetragen - FERIEN_ANSPRUCH);
  var frei = r.remAT - r.ferFut - r.kompFut;                    // noch unverplante Arbeitstage
  r.ferRest = Math.min(Math.max(0, FERIEN_ANSPRUCH - ferEingetragen), Math.max(0, frei));
  r.arbFut = Math.max(0, frei - r.ferRest);                     // Tage, die noch OT erzeugen (vor zusaetzlicher Komp.)
  r.zufluss = r.arbFut * OTP;
  r.saldoEnd = input.saldo + r.zufluss - r.kompFutMin;          // Saldo 31.12. ohne weitere Kompensation
  var kAdd = r.saldoEnd > 0 ? Math.floor(r.saldoEnd / (VAC + OTP) * 2) / 2 : 0;
  r.kAdd = Math.min(kAdd, r.arbFut);
  r.kompJahr = r.kompPast + r.kompFut + r.kAdd;
  r.ferJahr = ferEingetragen + r.ferRest;
  r.abwesenheit = r.ferJahr + r.kompJahr;

  // Was braucht es ab jetzt fuer das Ziel?
  var zielKomp = ZIEL_TAGE - r.ferJahr;
  r.kompFehlend = Math.max(0, zielKomp - r.kompPast - r.kompFut);
  var wRest = r.arbFut - r.kompFehlend;                         // Arbeitstage, die dann noch bleiben
  var otBedarf = r.kompFehlend * VAC - (input.saldo - r.kompFutMin);
  r.otProTagFuerZiel = wRest > 0 ? Math.max(0, otBedarf / wRest) : null;
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

  var r = computeStatus({ saldo: s, stichtag: x, komp: kompEnts, ferien: ferienEnts });
  var y = computeYearModel();

  var st, co, av, diff = r.diff;
  if (diff > 60)       { st = "Ueber Plan"; co = "#16a34a"; av = "Du koenntest weniger arbeiten oder mehr kompensieren."; }
  else if (diff < -60) { st = "Unter Plan"; co = "#dc2626"; av = "Du liegst unter 50 Min. pro gearbeitetem Tag."; }
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
  if (r.ferUeber > 0) warn += "<div class='warn-box'>Eingetragene Ferien (" + f1(r.ferPast + r.ferFut) + " Tage) uebersteigen den Anspruch von " + FERIEN_ANSPRUCH + " Tagen.</div>";

  var zielOk = r.abwesenheit >= ZIEL_TAGE;
  var bedarf = r.otProTagFuerZiel === null ? "nicht mehr erreichbar" : Math.ceil(r.otProTagFuerZiel) + " Min./Tag";

  o.innerHTML = warn
    + "<div class='status-banner' style='background:" + co + "'><div class='status-title'>" + st + "</div><div class='status-advice'>" + av + "</div></div>"
    + "<div class='white-card'><div class='wc-label'>Differenz zum Soll per " + toCH(x) + "</div><div class='diff-val' style='color:" + dc + "'>" + sg + fm(Math.abs(diff)) + "</div><div class='diff-sub'>ca. " + sg + dd + " Tage &agrave; 7h34</div></div>"
    + card("Stand per " + toCH(x),
        rw("Vergangene AT (bis Stichtag)", r.elAT + " / " + TWD)
      + rw("Davon Ferientage", r.ferPast)
      + rw("Davon Kompensationstage", r.kompPast)
      + rw("OT generiert (Saldo + kompensiert)", fm(r.otG))
      + rw("OT-Soll (" + OTP + " Min. &times; gearbeitete AT)", fm(r.otS)))
    + card("Hochrechnung bis 31.12." + YR,
        rw("Aktuelles Saldo", fm(s))
      + rw("Verbleibende AT nach Stichtag", r.remAT)
      + rw("&minus; geplante Ferien", r.ferFut)
      + rw("&minus; noch nicht geplanter Ferienanspruch", f1(r.ferRest))
      + rw("&minus; geplante Kompensation", r.kompFut + " Tage (" + fm(r.kompFutMin) + ")")
      + rw("= AT mit Ueberzeit", f1(r.arbFut))
      + rw("Zufluss " + f1(r.arbFut) + " AT &times; " + OTP + " Min", "+" + fm(r.zufluss))
      + rw("Saldo 31.12. nach geplanter Komp.", fm(r.saldoEnd))
      + rw("Kosten / zusaetzlicher Komp.-Tag", fm(OTP + VAC))
      + big("Zusaetzlich kompensierbar bis 31.12." + YR, f1(r.kAdd) + " Tage", "#7c3aed", "zusaetzlich zu den bereits geplanten Kompensationstagen"))
    + card("Ziel " + ZIEL_TAGE / 5 + " Wochen (" + ZIEL_TAGE + " Tage)",
        rw("Ferien (Anspruch)", f1(r.ferJahr) + " Tage")
      + rw("Kompensation bezogen / geplant / zusaetzlich", r.kompPast + " / " + r.kompFut + " / " + f1(r.kAdd))
      + rw("Noch ungeplante Komp.-Tage fuer Ziel", f1(r.kompFehlend))
      + rw("Noetige Ueberzeit pro AT fuer Ziel", bedarf)
      + big("Erreichbare Abwesenheit " + YR, f1(r.abwesenheit) + " Tage", zielOk ? "#16a34a" : "#dc2626", "= " + f1(r.abwesenheit / 5) + " Wochen (Ziel " + ZIEL_TAGE / 5 + ")"))
    + card("Jahresmodell: " + OTP + " Min. an jedem Arbeitstag",
        rw("Arbeitstage " + YR + " (Kt. Zug)", y.twd)
      + rw("&minus; Ferienanspruch", FERIEN_ANSPRUCH)
      + rw("= verfuegbare Tage", f1(y.avail))
      + rw("Max. Komp.-Tage (" + f1(y.avail) + " &times; " + OTP + " / " + (VAC + OTP) + ")", f1(y.kMax))
      + rw("Total Abwesenheit", f1(y.total) + " Tage = " + f1(y.wochen) + " Wochen")
      + rw("Fuer Ziel fehlen", f1(y.lueckeTage) + " Komp.-Tage (" + fm(y.lueckeMin) + " OT)")
      + rw("Noetige Ueberzeit/AT fuer Ziel", Math.ceil(y.otProTagFuerZiel) + " Min. (statt " + OTP + ")"))
    + "<div class='info-box'>Saldo = Stand inkl. Stichtag. Ist = Saldo + bezogene Komp.-Tage &times; Sollzeit (7h34, Vorfeiertag 6h40). "
    + "Soll = (AT bis Stichtag &minus; Ferien &minus; Komp.) &times; " + OTP + " Min. Eintraege nach dem Stichtag gelten als geplant. "
    + "Jahresmodell ab Saldo 0 am 1.1. Details: README.md</div>";
}
