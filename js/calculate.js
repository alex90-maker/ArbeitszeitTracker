function initTWD() {
  var n = 0, d = new Date(YR, 0, 1);
  while (d.getFullYear() === YR) { if (isWD(d)) n++; d.setDate(d.getDate()+1); }
  TWD = n;
}

function elap() {
  var n = 0, d = new Date(YR, 0, 1), e = new Date();
  e.setHours(0, 0, 0, 0);
  while (d < e) { if (isWD(d)) n++; d.setDate(d.getDate()+1); }
  return n;
}

function ferienElapsed() {
  var fd = getDaysSet(ferienEnts), n = 0, d = new Date(YR, 0, 1), e = new Date();
  e.setHours(0, 0, 0, 0);
  while (d < e) { if (isWD(d) && fd[ds(d)]) n++; d.setDate(d.getDate()+1); }
  return n;
}

function kompElapsed() {
  var kd = getDaysSet(kompEnts), n = 0, d = new Date(YR, 0, 1), e = new Date();
  e.setHours(0, 0, 0, 0);
  while (d < e) { if (isWD(d) && kd[ds(d)]) n++; d.setDate(d.getDate()+1); }
  return n;
}

function calculate() {
  var se = document.getElementById("saldo");
  se.value = nm(se.value); ut();
  var s = pt(se.value), o = document.getElementById("output");
  if (s === null) { o.innerHTML = "<div class='error-box'>Bitte Saldo eingeben (z.B. 20:52)</div>"; return; }

  var kd = countDaysFromEnts(kompEnts);
  var komp = kd * VAC;
  var el = elap(), ferEl = ferienElapsed(), kompEl = kompElapsed(), rem = TWD - el;
  var otG = s + komp, otS = (el - ferEl - kompEl) * OTP, diff = otG - otS;
  var dd = (Math.abs(diff) / VAC).toFixed(1), tn = 27.5 * VAC;

  var st, co, av;
  if (diff > 60)       { st = "Ueber Plan"; co = "#16a34a"; av = "Du koenntest weniger arbeiten oder mehr Ferien nehmen."; }
  else if (diff < -60) { st = "Unter Plan"; co = "#dc2626"; av = "Du solltest ab heute mehr arbeiten."; }
  else                 { st = "Im Plan";    co = "#d97706"; av = "Weiter so - du bist genau auf Kurs."; }

  var sg = diff >= 0 ? "+" : "-", dc = diff >= 0 ? "#16a34a" : "#dc2626";
  var futureOT = s + rem * OTP;
  var maxVacDays = Math.max(0, Math.floor(futureOT / (OTP + VAC)));

  function rw(l, v) { return "<div class='detail-row'><span>" + l + "</span><span>" + v + "</span></div>"; }

  o.innerHTML = "<div class='status-banner' style='background:" + co + "'><div class='status-title'>" + st + "</div><div class='status-advice'>" + av + "</div></div>"
    + "<div class='white-card'><div class='wc-label'>Differenz zum Soll</div><div class='diff-val' style='color:" + dc + "'>" + sg + fm(Math.abs(diff)) + "</div><div class='diff-sub'>ca. " + sg + dd + " Ferientage</div></div>"
    + "<div class='white-card'><div class='wc-label' style='margin-bottom:10px'>Details</div>"
    + rw("Vergangene AT", el + " / " + TWD)
    + rw("Davon Ferientage", ferEl)
    + rw("Davon Kompensationstage", kompEl)
    + rw("Verbleibende AT", rem)
    + rw("OT generiert", fm(otG))
    + rw("OT-Soll heute", fm(otS))
    + rw("Gesamtziel OT", fm(tn))
    + "</div>"
    + "<div class='white-card'><div class='wc-label' style='margin-bottom:10px'>Hochrechnung OT-Ferientage</div>"
    + rw("Aktuelles Saldo", fm(s))
    + rw("Projektion " + rem + " AT \xd7 50 Min", "+" + fm(rem * OTP))
    + rw("Total OT-Pool", fm(futureOT))
    + rw("Kosten / OT-Ferientag", fm(OTP + VAC))
    + "<div style='border-top:2px solid #e2e8f0;margin-top:8px;padding-top:10px'><div class='wc-label'>Noch entnehmbar bis 31.12." + YR + "</div><div class='diff-val' style='color:#7c3aed'>" + maxVacDays + " Tage</div><div class='diff-sub'>OT-Kompensationsurlaub (Hochrechnung)</div></div>"
    + "</div>"
    + "<div class='info-box'>Logik: OT = Saldo + komp. Std + Komp.Tage x7h34. Soll = (vergangene AT - Ferientage - Kompensationstage) x 50 Min. Feiertage Kanton Zug.</div>";
}
