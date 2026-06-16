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

function countDaysFromEnts(list) {
  var t = 0;
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    if (e.f && e.t) { var f = new Date(e.f), to = new Date(e.t); if (to >= f) t += cwd(f, to); }
    else if (e.f) { var d = new Date(e.f); if (isWD(d)) t++; }
  }
  return t;
}

function ut() {
  var h = pt(document.getElementById("komp").value) || 0;
  var kd = countDaysFromEnts(kompEnts), kt = h + kd * VAC;
  document.getElementById("ktotal").textContent = kt > 0
    ? "Total: " + fm(kt) + (kd > 0 ? " (davon " + kd + " Tage = " + fm(kd*VAC) + ")" : "") : "";
  var fd = countDaysFromEnts(ferienEnts);
  document.getElementById("ftotal").textContent = fd > 0 ? fd + " Arbeitstage eingetragen" : "";
  buildCalendar();
}
