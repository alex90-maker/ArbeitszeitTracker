function p2(n) { return n < 10 ? "0" + n : "" + n; }

// Date -> "YYYY-MM-DD" (lokale Zeit)
function ds(d) {
  return d.getFullYear() + "-" + p2(d.getMonth()+1) + "-" + p2(d.getDate());
}

// "YYYY-MM-DD" -> Date in lokaler Zeit (00:00). null bei ungueltiger Eingabe.
// Bewusst nicht new Date("YYYY-MM-DD"), weil das als UTC interpretiert wird.
function parseISO(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  var d = new Date(+m[1], +m[2] - 1, +m[3]);
  return ds(d) === s ? d : null;
}

function iw(d) { return d.getDay() === 0 || d.getDay() === 6; }

function ih(s) {
  for (var i = 0; i < H.length; i++) if (H[i] === s) return true;
  return false;
}

function isWD(d) { return !iw(d) && !ih(ds(d)); }

// Sollzeit (90%) eines Arbeitstags in Minuten; an Vorfeiertagen reduziert.
function sollMin(s) { return PRE[s] ? VAC_PRE : VAC; }

function addDays(d, n) { var r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() + n); return r; }

// Gestern als ISO (Default-Stichtag des Saldos)
function yesterdayISO(now) { return ds(addDays(now || new Date(), -1)); }

function toISO(s) {
  s = (s || "").trim(); if (!s) return "";
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
  var p = s.split(".");
  if (p.length === 3) {
    var y = p[2]; if (y.length === 2) y = "20" + y;
    return y + "-" + p2(parseInt(p[1],10)) + "-" + p2(parseInt(p[0],10));
  }
  return s;
}

function toCH(s) {
  if (!s) return "";
  var p = s.split("-");
  if (p.length === 3) return p[2] + "." + p[1] + "." + p[0];
  return s;
}

function nm(s) {
  s = (s || "").trim();
  var neg = s.charAt(0) === "-";
  if (neg) s = s.slice(1);
  if (s.indexOf(".") > -1 && s.indexOf(":") < 0) s = s.replace(".", ":");
  return neg ? "-" + s : s;
}

function pt(s) {
  s = nm(s); if (!s) return null;
  var neg = s.charAt(0) === "-";
  if (neg) s = s.slice(1);
  var p = s.split(":"); if (p.length !== 2) return null;
  var h = parseInt(p[0], 10), m = parseInt(p[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return neg ? -(h * 60 + m) : h * 60 + m;
}

function fm(x) {
  var neg = x < 0, a = Math.abs(Math.round(x));
  return (neg ? "-" : "") + Math.floor(a / 60) + "h " + p2(a % 60) + "min";
}

// Minuten kurz als "7h34" (fuer Beschriftungen)
function fhm(x) { var a = Math.round(x); return Math.floor(a / 60) + "h" + p2(a % 60); }

// Zahl mit einer Nachkommastelle
function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }

// Tage: ganze Zahlen ohne ".0", sonst eine Nachkommastelle (25, 27.5)
function fd(x) { var r = Math.round(x * 10) / 10; return r % 1 === 0 ? "" + r : r.toFixed(1); }

// Alle Kalendertage einer Eintragsliste als Set { "YYYY-MM-DD": true }.
// Eintrag: { f, t } (Bereich) oder nur { f } (einzelner Tag).
function getDaysSet(list) {
  return analyzeEntries(list).days;
}

// Wertet eine Eintragsliste aus:
//  days:  alle Kalendertage (Set)
//  wd:    nur Arbeitstage (Set) - nur diese zaehlen in der Berechnung
//  dupes: Arbeitstage, die durch mehrere Eintraege der Liste abgedeckt sind
function analyzeEntries(list) {
  var days = {}, wd = {}, seen = {}, dupes = {};
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    var f = parseISO(e.f); if (!f) continue;
    var t = e.t ? parseISO(e.t) : f; if (!t || t < f) continue;
    var own = {};
    for (var d = f; d <= t; d = addDays(d, 1)) {
      var s = ds(d);
      if (own[s]) continue; own[s] = true;
      days[s] = true;
      if (!isWD(d)) continue;
      if (seen[s]) dupes[s] = true;
      seen[s] = true; wd[s] = true;
    }
  }
  return { days: days, wd: wd, dupes: dupes };
}

function keys(o) { var a = []; for (var k in o) if (o.hasOwnProperty(k)) a.push(k); return a.sort(); }

function showNotice(m) {
  var el = document.getElementById("notice");
  el.textContent = m;
  setTimeout(function() { el.textContent = ""; }, 5000);
}
