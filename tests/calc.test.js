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

t("Jahresmodell: max. Komp.-Tage bei 50 Min./Tag", function () {
  var y = ctx.computeYearModel();
  near(y.kMax, 227 * 50 / 504);              // 22.52
  near(y.total, 25 + 227 * 50 / 504);        // 47.52 Tage
  near(y.lueckeMin, 25 * 454 - 202 * 50);    // 1250 Min = 20h50
  near(y.otProTagFuerZiel, 25 * 454 / 202);  // 56.2 Min
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
  // Nach 02.10.: Okt 21 AT (05.-30.10. = 20 + 0?) -> direkt nachzaehlen
  var rem = 0; for (var d = new Date(2026, 9, 3); d.getFullYear() === 2026; d = ctx.addDays(d, 1)) if (ctx.isWD(d)) rem++;
  assert.strictEqual(r.remAT, rem);
  near(r.ferRest, 15);
  near(r.arbFut, rem - 15);
  near(r.saldoEnd, 1252 + (rem - 15) * 50);
  var a = st({ ferien: [{ f: "2026-02-02", t: "2026-02-13" }, { f: "2026-11-16", t: "2026-11-20" }] });
  near(a.saldoEnd, r.saldoEnd); // geplante Ferien innerhalb des Anspruchs: gleiche Hochrechnung
  near(a.ferRest, 10);
});

t("Zusaetzliche Komp.-Tage: Kosten 7h34 + 50 Min", function () {
  var r = st({});
  near(r.kAdd, Math.floor(r.saldoEnd / 504 * 2) / 2);
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

console.log("\n" + ok + " Tests bestanden");
