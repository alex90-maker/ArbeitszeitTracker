function saveLink() {
  var s = nm(document.getElementById("saldo").value);
  var ka = [], fa = [];
  for (var i = 0; i < kompEnts.length; i++) ka.push({ f: kompEnts[i].f, t: kompEnts[i].t });
  for (var i = 0; i < ferienEnts.length; i++) fa.push({ f: ferienEnts[i].f, t: ferienEnts[i].t });
  var hash = btoa(unescape(encodeURIComponent(JSON.stringify({ s: s, e: ka, f: fa }))));
  window.location.hash = hash;
  var lb = document.getElementById("linkbox"); lb.style.display = "block";
  document.getElementById("linktext").textContent = window.location.href;
  showNotice("Link gespeichert - Ctrl+D zum Aktualisieren des Lesezeichens!");
}

function copyLink() {
  var url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function() { showNotice("Link kopiert!"); });
  } else {
    var ta = document.createElement("textarea"); ta.value = url;
    document.body.appendChild(ta); ta.select(); document.execCommand("copy");
    document.body.removeChild(ta); showNotice("Link kopiert!");
  }
}

function loadFromHash() {
  initTWD();
  var hash = window.location.hash.replace("#", "");
  if (!hash) { buildCalendar(); return; }
  try {
    var data = JSON.parse(decodeURIComponent(escape(atob(hash))));
    if (data.s) document.getElementById("saldo").value = data.s;
    if (data.e) { kompEnts = []; for (var i = 0; i < data.e.length; i++) kompEnts.push({ id: Date.now()+Math.random(), f: data.e[i].f||"", t: data.e[i].t||"" }); }
    if (data.f) { ferienEnts = []; for (var i = 0; i < data.f.length; i++) ferienEnts.push({ id: Date.now()+Math.random(), f: data.f[i].f||"", t: data.f[i].t||"" }); }
    renderKomp(); renderFerien();
    if (data.s) calculate();
  } catch(e) { buildCalendar(); }
}
