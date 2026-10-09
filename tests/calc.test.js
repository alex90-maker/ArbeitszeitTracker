// Ausfuehren: node tests/calc.test.js  (prueft die reine Rechenlogik ohne Browser)
var fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
var ctx = {}; vm.createContext(ctx);
["config.js", "utils.js", "calculate.js"].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx);
});
ctx.initTWD();
var ok = 0;
function t(name, fn) { fn(); ok++; console.log("ok  " + name); }
function near(a, b, eps) { assert.ok(Math.abs(a - b) <= (eps || 1e-6), a + " != " + b); }

t("252 Arbeitstage 2026 Kt. Zug", function () { assert.strictEqual(ctx.TWD, 252); });

t("Jahresmodell: noetige OT/Tag fuer 10 Wochen", function () {
  var y = ctx.computeYearModel();
  near(y.zielKomp, 25);
  near(y.arbeitstage, 202);
  near(y.otp, 25 * 454 / 202);               // 56.19 Min
  near(ctx.OTP, y.otp);
  // Gegenprobe: an 202 AT erzeugte OT deckt genau 25 Komp.-Tage
  near(202 * ctx.OTP, 25 * 454);
});

var base = { saldo: 1252, stichtag: "2026-10-02", komp: [], ferien: [] };
function st(o) { return ctx.computeStatus(Object.assign({}, base, o)); }

t("Geplante Kompensation veraendert die Differenz nicht (Fehler 1)", function () {
  var a = st({}), b = st({ komp: [{ f: "2026-12-14", t: "2026-12-18" }] });
  assert.strictEqual(a.diff, b.diff);
  assert.strictEqual(b.kompFut, 5);
  assert.strictEqual(b.kompFutMin, 5 * 454);
});

t("Geplante Ferien veraendern die Differenz nicht (Fehler 1)", function () {
  var a = st({}), b = st({ ferien: [{ f: "2026-11-16", t: "2026-11-20" }] });
  assert.strictEqual(a.diff, b.diff);
});

t("Bezogene Kompensation wird zum Ist addiert", function () {
  var r = st({ komp: [{ f: "2026-03-02", t: "2026-03-06" }] });
  assert.strictEqual(r.kompPast, 5);
  assert.strictEqual(r.otG, 1252 + 5 * 454);
});

t("Kompensation an Vorfeiertag kostet 6h40", function () {
  var r = st({ komp: [{ f: "2026-12-24" }] });
  assert.strictEqual(r.kompFutMin, 400);
});

t("Hochrechnung: Ferienanspruch und geplante Tage erzeugen keine OT (Fehler 2)", function () {
  var r = st({ ferien: [{ f: "2026-02-02", t: "2026-02-13" }] }); // 10 Tage bezogen
  // Verbleibende AT nach dem Stichtag 02.10. direkt nachzaehlen
  var rem = 0; for (var d = new Date(2026, 9, 3); d.getFullYear() === 2026; d = ctx.addDays(d, 1)) if (ctx.isWD(d)) rem++;
  assert.strictEqual(r.remAT, rem);
  near(r.ferRest, 15);
  near(r.arbFut, rem - 15);
  near(r.saldoEnd, 1252 + (rem - 15) * ctx.OTP);
  var a = st({ ferien: [{ f: "2026-02-02", t: "2026-02-13" }, { f: "2026-11-16", t: "2026-11-20" }] });
  near(a.saldoEnd, r.saldoEnd); // geplante Ferien innerhalb des Anspruchs: gleiche Hochrechnung
  near(a.ferRest, 10);
});

t("Hochrechnung von Hand nachgerechnet (Saldo 20h52, Stichtag 02.10., keine Eintraege)", function () {
  // Verbleibende AT: Okt 20 + Nov 21 + Dez 21 (ohne 08.12./25.12.) = 62
  // - 25 Ferien (noch nicht eingetragen) = 37 AT mit OT
  // Saldo 31.12. = 1252 + 37 x 56.19 = 3330.96 Min (55h31)
  // Zusaetzliche Komp.: 3330.96 / (454 + 56.19) = 6.53 -> 6.5 Tage (halbe Tage abgerundet)
  var r = st({});
  assert.strictEqual(r.remAT, 62);
  near(r.ferRest, 25);
  near(r.arbFut, 37);
  near(r.saldoEnd, 3330.96, 0.01);
  near(r.kAdd, 6.5);
  near(r.abwesenheit, 31.5);
});

t("Geplante Kompensation groesser als erwartete OT -> Saldo 31.12. negativ, keine Zusatztage", function () {
  var r = st({ saldo: 0, komp: [{ f: "2026-10-05", t: "2026-11-27" }] });   // 40 AT geplant
  assert.ok(r.saldoEnd < 0);
  assert.strictEqual(r.kAdd, 0);
});

t("Zusaetzliche Komp.-Tage hoechstens so viele wie freie AT", function () {
  var r = st({ saldo: 100000 });
  near(r.kAdd, r.arbFut);
});

t("Ziel nicht mehr erreichbar -> Aufholrate null", function () {
  var r = st({ stichtag: "2026-12-29", ferien: [{ f: "2026-01-05", t: "2026-02-06" }] }); // 25 Ferien bezogen, 0 Komp.
  assert.strictEqual(r.remAT, 2);
  near(r.kompFehlend, 25);
  assert.strictEqual(r.otProTagFuerZiel, null);
});

t("Eingaben: Zeit- und Datumsformate", function () {
  assert.strictEqual(ctx.pt("20:52"), 1252);
  assert.strictEqual(ctx.pt("20.52"), 1252);
  assert.strictEqual(ctx.pt("-1:30"), -90);
  assert.strictEqual(ctx.pt("abc"), null);
  assert.strictEqual(ctx.pt(""), null);
  assert.strictEqual(ctx.toISO("1.3.26"), "2026-03-01");
  assert.strictEqual(ctx.toISO("01.03.2026"), "2026-03-01");
  assert.strictEqual(ctx.toCH("2026-03-01"), "01.03.2026");
  assert.strictEqual(ctx.fhm(454), "7h34");
  assert.strictEqual(ctx.fhm(400), "6h40");
});

t("Gegenprobe: Tag-fuer-Tag-Simulation stimmt mit der Rechnung ueberein (300 Zufallsfaelle)", function () {
  var days = [];
  for (var d = new Date(2026, 0, 1); d.getFullYear() === 2026; d = ctx.addDays(d, 1)) if (ctx.isWD(d)) days.push(ctx.ds(d));
  var seed = 7;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  function entries(n) {
    var a = [];
    for (var i = 0; i < n; i++) { var s = Math.floor(rnd() * days.length); a.push({ f: days[s], t: days[Math.min(days.length - 1, s + Math.floor(rnd() * 7))] }); }
    return a;
  }
  function set(list) {
    var o = {};
    list.forEach(function (e) { days.forEach(function (s) { if (s >= e.f && s <= e.t) o[s] = true; }); });
    return o;
  }
  for (var k = 0; k < 300; k++) {
    var komp = entries(Math.floor(rnd() * 5)), fer = entries(Math.floor(rnd() * 6));
    var x = days[Math.floor(rnd() * days.length)], saldo = Math.round((rnd() - 0.3) * 6000);
    var r = ctx.computeStatus({ saldo: saldo, stichtag: x, komp: komp, ferien: fer });
    var K = set(komp), F = set(fer), ist = saldo, soll = 0, ferAll = 0;
    days.forEach(function (s) {
      var isK = !!K[s], isF = !isK && !!F[s];       // Konflikttag = Kompensation
      if (isF) ferAll++;
      if (s <= x) { if (isK) ist += ctx.sollMin(s); else if (!isF) soll += ctx.OTP; }
    });
    // Zukunft Tag fuer Tag: noch nicht eingetragene Ferien auf die ersten freien Tage legen
    var rest = Math.max(0, ctx.ZIEL_FERIEN - ferAll), bal = saldo, free = 0;
    days.forEach(function (s) {
      if (s <= x || F[s] && !K[s]) return;
      if (K[s]) bal -= ctx.sollMin(s);
      else if (rest > 0) rest--;
      else { bal += ctx.OTP; free++; }
    });
    var add = 0;
    while (add + 0.5 <= free && bal - (add + 0.5) * (454 + ctx.OTP) >= -1e-9) add += 0.5;
    near(r.diff, ist - soll, 1e-6);
    near(r.saldoEnd, bal, 1e-6);
    near(r.kAdd, add);
  }
});

t("Exakt im Plan -> Hochrechnung ergibt genau das Ziel (50 Tage)", function () {
  // Bezogen: 5 Ferien, 3 Komp. (keine Vorfeiertage). Saldo so gewaehlt, dass Differenz = 0.
  var o = { stichtag: "2026-06-30", komp: [{ f: "2026-03-10", t: "2026-03-12" }], ferien: [{ f: "2026-02-16", t: "2026-02-20" }] };
  var r0 = ctx.computeStatus(Object.assign({}, o, { saldo: 0 }));
  var saldo = r0.otS - r0.kompPastMin;
  var r = ctx.computeStatus(Object.assign({}, o, { saldo: saldo }));
  near(r.diff, 0);
  // Ungerundet: Ferien + Komp. bezogen/geplant + zusaetzlich moegliche Komp. = Ziel
  near(r.ferJahr + r.kompPast + r.kompFut + r.saldoEnd / (454 + ctx.OTP), ctx.zielTage());
  assert.ok(r.abwesenheit <= ctx.zielTage() && r.abwesenheit > ctx.zielTage() - 0.5); // kAdd auf halbe Tage abgerundet
  near(r.otProTagFuerZiel, ctx.OTP);   // Aufholrate = Planrate
});

t("Ueberlappung Ferien/Komp. wird nur einmal abgezogen (Fehler 3)", function () {
  var r = st({ komp: [{ f: "2026-03-02", t: "2026-03-06" }], ferien: [{ f: "2026-03-05", t: "2026-03-10" }] });
  assert.strictEqual(JSON.stringify(r.conflicts), JSON.stringify(["2026-03-05", "2026-03-06"]));
  assert.strictEqual(r.kompPast, 5);
  assert.strictEqual(r.ferPast, 2); // 09.+10.03.
});

t("Doppelte Eintraege innerhalb einer Liste werden erkannt und einmal gezaehlt", function () {
  var a = ctx.analyzeEntries([{ f: "2026-03-02", t: "2026-03-06" }, { f: "2026-03-05" }]);
  assert.strictEqual(JSON.stringify(ctx.keys(a.dupes)), JSON.stringify(["2026-03-05"]));
  assert.strictEqual(ctx.keys(a.wd).length, 5);
});

t("Wochenende/Feiertag in Bereich zaehlt nicht", function () {
  var a = ctx.analyzeEntries([{ f: "2026-04-01", t: "2026-04-07" }]); // Karfreitag, Ostermontag, WE
  assert.strictEqual(ctx.keys(a.wd).length, 3); // 01., 02., 07.04.
});

t("Ungueltige Daten werden ignoriert", function () {
  var a = ctx.analyzeEntries([{ f: "2026-02-30" }, { f: "abc" }, { f: "2026-05-05", t: "2026-05-01" }]);
  assert.strictEqual(ctx.keys(a.wd).length, 0);
});

// ----- Anpassbares Ziel (Ferien inkl. gekaufte + Kompensation) -----
function mitZiel(f, k, fn) { ctx.setZiel(f, k); try { fn(); } finally { ctx.setZiel(25, 25); } }

t("Ziel 30 Ferien + 25 Komp. (55 Tage): OT/Tag = 25 x 7h34 / (252 - 55)", function () {
  mitZiel(30, 25, function () {
    near(ctx.OTP, 25 * 454 / 197);                 // 57.6 Min
    var y = ctx.computeYearModel();
    near(y.arbeitstage, 197);
  });
  near(ctx.OTP, 25 * 454 / 202);                   // zurueckgesetzt
});

t("Ziel 27 Ferien + 23 Komp. (50 Tage): weniger Komp. -> weniger OT/Tag", function () {
  mitZiel(27, 23, function () { near(ctx.OTP, 23 * 454 / 202); });   // 51.7 Min
});

t("Ziel mit gekauften Ferien: Hochrechnung rechnet mit 30 Ferientagen, keine Warnung", function () {
  mitZiel(30, 25, function () {
    var fer = [{ f: "2026-02-02", t: "2026-02-27" }, { f: "2026-11-16", t: "2026-11-20" }]; // 20 + 5 eingetragen
    var r = st({ ferien: fer });
    near(r.ferRest, 5);                            // 30 - 25 noch einzutragen
    near(r.ferJahr, 30);
    near(r.ferUeber, 0);
    assert.strictEqual(r.kompFehlend, 25);
  });
});

t("Mehr Ferien eingetragen als im Ziel -> Warnung (ferUeber)", function () {
  mitZiel(20, 25, function () {
    var r = st({ ferien: [{ f: "2026-02-02", t: "2026-02-27" }, { f: "2026-03-02", t: "2026-03-06" }] }); // 25
    near(r.ferUeber, 5);
  });
});

t("Exakt im Plan mit eigenem Ziel (30 + 25) -> Hochrechnung ergibt 55 Tage, Aufholrate = Planrate", function () {
  mitZiel(30, 25, function () {
    var o = { stichtag: "2026-06-30", komp: [{ f: "2026-03-10", t: "2026-03-12" }], ferien: [{ f: "2026-02-16", t: "2026-02-20" }] };
    var r0 = ctx.computeStatus(Object.assign({}, o, { saldo: 0 }));
    var r = ctx.computeStatus(Object.assign({}, o, { saldo: r0.otS - r0.kompPastMin }));
    near(r.diff, 0);
    near(r.ferJahr + r.kompPast + r.kompFut + r.saldoEnd / (454 + ctx.OTP), 55);
    near(r.otProTagFuerZiel, ctx.OTP);
  });
});

console.log("\n" + ok + " Tests bestanden");
