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

t("Zusaetzliche Komp.-Tage: Kosten 7h34 + OT/Tag", function () {
  var r = st({});
  near(r.kAdd, Math.floor(r.saldoEnd / (454 + ctx.OTP) * 2) / 2);
});

t("Exakt im Plan -> Hochrechnung ergibt genau das Ziel (50 Tage)", function () {
  // Bezogen: 5 Ferien, 3 Komp. (keine Vorfeiertage). Saldo so gewaehlt, dass Differenz = 0.
  var o = { stichtag: "2026-06-30", komp: [{ f: "2026-03-10", t: "2026-03-12" }], ferien: [{ f: "2026-02-16", t: "2026-02-20" }] };
  var r0 = ctx.computeStatus(Object.assign({}, o, { saldo: 0 }));
  var saldo = r0.otS - r0.kompPastMin;
  var r = ctx.computeStatus(Object.assign({}, o, { saldo: saldo }));
  near(r.diff, 0);
  // Ungerundet: Ferien + Komp. bezogen/geplant + zusaetzlich moegliche Komp. = Ziel
  near(r.ferJahr + r.kompPast + r.kompFut + r.saldoEnd / (454 + ctx.OTP), ctx.ZIEL_TAGE);
  assert.ok(r.abwesenheit <= ctx.ZIEL_TAGE && r.abwesenheit > ctx.ZIEL_TAGE - 0.5); // kAdd auf halbe Tage abgerundet
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

console.log("\n" + ok + " Tests bestanden");
