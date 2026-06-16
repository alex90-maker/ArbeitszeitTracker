function p2(n) { return n < 10 ? "0" + n : "" + n; }

function ds(d) {
  return d.getFullYear() + "-" + p2(d.getMonth()+1) + "-" + p2(d.getDate());
}

function iw(d) { return d.getDay() === 0 || d.getDay() === 6; }

function ih(s) {
  for (var i = 0; i < H.length; i++) if (H[i] === s) return true;
  return false;
}

function isWD(d) { return !iw(d) && !ih(ds(d)); }

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

function cwd(f, t) {
  var n = 0, d = new Date(f), e = new Date(t);
  e.setHours(23, 59, 59, 999);
  while (d <= e) { if (isWD(d)) n++; d.setDate(d.getDate()+1); }
  return n;
}

function getDaysSet(list) {
  var days = {};
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    if (e.f && e.t) {
      var d = new Date(e.f), to = new Date(e.t); to.setHours(23,59,59,999);
      while (d <= to) { days[ds(d)] = true; d.setDate(d.getDate()+1); }
    } else if (e.f) { days[e.f] = true; }
  }
  return days;
}

function showNotice(m) {
  var el = document.getElementById("notice");
  el.textContent = m;
  setTimeout(function() { el.textContent = ""; }, 5000);
}
