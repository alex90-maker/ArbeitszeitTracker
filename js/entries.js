function makeDateInput(val, eid, ek, updateFn) {
  var inp = document.createElement("input");
  inp.type = "text";
  inp.placeholder = "dd.mm.yyyy";
  inp.value = toCH(val);
  inp.style.flex = "1";
  inp.style.padding = "9px 8px";
  inp.style.fontSize = "14px";
  inp.setAttribute("eid", "" + eid);
  inp.setAttribute("ek", ek);
  inp.onblur = function() {
    var iso = toISO(this.value);
    this.value = toCH(iso);
    updateFn(parseFloat(this.getAttribute("eid")), this.getAttribute("ek"), iso);
  };
  return inp;
}

function makeEntryRow(e, updateFn, deleteFn) {
  var row = document.createElement("div"); row.className = "erow";
  var d1 = makeDateInput(e.f, e.id, "f", updateFn);
  var sp = document.createElement("span"); sp.className = "sep"; sp.textContent = "bis";
  var d2 = makeDateInput(e.t, e.id, "t", updateFn);
  var db = document.createElement("button"); db.className = "del-btn"; db.type = "button"; db.textContent = "x";
  db.setAttribute("eid", "" + e.id);
  db.onclick = function() { deleteFn(parseFloat(this.getAttribute("eid"))); };
  row.appendChild(d1); row.appendChild(sp); row.appendChild(d2); row.appendChild(db);
  return row;
}

// Kompensation
function addKomp(f, t) { kompEnts.push({ id: Date.now()+Math.random(), f: f||"", t: t||"" }); renderKomp(); }
function delKomp(id) { var a = []; for (var i = 0; i < kompEnts.length; i++) if (kompEnts[i].id !== id) a.push(kompEnts[i]); kompEnts = a; renderKomp(); }
function updKomp(id, k, v) { for (var i = 0; i < kompEnts.length; i++) if (kompEnts[i].id === id) kompEnts[i][k] = v; ut(); }
function renderKomp() {
  var c = document.getElementById("kompEntries"); c.innerHTML = "";
  for (var i = 0; i < kompEnts.length; i++) c.appendChild(makeEntryRow(kompEnts[i], updKomp, delKomp));
  ut();
}

// Ferien
function addFerien(f, t) { ferienEnts.push({ id: Date.now()+Math.random(), f: f||"", t: t||"" }); renderFerien(); }
function delFerien(id) { var a = []; for (var i = 0; i < ferienEnts.length; i++) if (ferienEnts[i].id !== id) a.push(ferienEnts[i]); ferienEnts = a; renderFerien(); }
function updFerien(id, k, v) { for (var i = 0; i < ferienEnts.length; i++) if (ferienEnts[i].id === id) ferienEnts[i][k] = v; ut(); }
function renderFerien() {
  var c = document.getElementById("ferienEntries"); c.innerHTML = "";
  for (var i = 0; i < ferienEnts.length; i++) c.appendChild(makeEntryRow(ferienEnts[i], updFerien, delFerien));
  ut();
}

// Anzahl Arbeitstage einer Liste (jeder Tag nur einmal, auch bei ueberlappenden Eintraegen)
function countDaysFromEnts(list) { return keys(analyzeEntries(list).wd).length; }

function currentStichtag() {
  var el = document.getElementById("stichtag");
  var x = el ? toISO(el.value) : "";
  return parseISO(x) ? x : yesterdayISO();
}

// Doppelt gebuchte Arbeitstage (Ferien+Kompensation oder ueberlappende Eintraege)
function findDoubleBookings() {
  var k = analyzeEntries(kompEnts), f = analyzeEntries(ferienEnts), both = {};
  for (var s in k.wd) if (f.wd[s]) both[s] = true;
  return { both: keys(both), komp: keys(k.dupes), ferien: keys(f.dupes) };
}

function listCH(a) {
  var out = []; for (var i = 0; i < a.length && i < 8; i++) out.push(toCH(a[i]));
  return out.join(", ") + (a.length > 8 ? " (+" + (a.length - 8) + " weitere)" : "");
}

function ut() {
  var x = currentStichtag();
  var k = analyzeEntries(kompEnts), kp = 0, kf = 0, kmin = 0;
  for (var s in k.wd) { kmin += sollMin(s); if (s <= x) kp++; else kf++; }
  document.getElementById("ktotal").textContent = (kp + kf) > 0
    ? "Total: " + fm(kmin) + " (" + (kp + kf) + " Tage: " + kp + " bezogen, " + kf + " geplant)" : "";

  var f = analyzeEntries(ferienEnts), fp = 0, ff = 0;
  for (var t in f.wd) { if (k.wd[t]) continue; if (t <= x) fp++; else ff++; }  // Konflikttage zaehlen als Kompensation
  document.getElementById("ftotal").textContent = (fp + ff) > 0
    ? (fp + ff) + " Arbeitstage eingetragen (" + fp + " bezogen, " + ff + " geplant) von " + FERIEN_ANSPRUCH : "";

  var db = findDoubleBookings(), msg = [];
  if (db.both.length)   msg.push("Ferien und Kompensation am selben Tag: " + listCH(db.both) + ". Gerechnet wird als Kompensation.");
  if (db.komp.length)   msg.push("Kompensation mehrfach eingetragen: " + listCH(db.komp) + ". Wird nur einmal gezaehlt.");
  if (db.ferien.length) msg.push("Ferien mehrfach eingetragen: " + listCH(db.ferien) + ". Wird nur einmal gezaehlt.");
  var w = document.getElementById("dblWarn");
  w.innerHTML = "";
  for (var i = 0; i < msg.length; i++) { var p = document.createElement("div"); p.textContent = msg[i]; w.appendChild(p); }
  w.style.display = msg.length ? "block" : "none";

  buildCalendar();
}
