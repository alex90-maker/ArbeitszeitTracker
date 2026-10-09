// ===== Grundparameter (siehe README.md, Abschnitt "Berechnungsmodell") =====
var YR = 2026;                // Berechnungsjahr
var PENSUM = 90;              // Pensum in % (nur Anzeige - VAC/VAC_PRE muessen passend gesetzt sein)
var VAC = 454;                // Sollzeit pro Arbeitstag bei 90% in Minuten (7h34)
var VAC_PRE = 400;            // Sollzeit an Vorfeiertagen bei 90% in Minuten (6h40)
var OTP = 0;                  // noetige Ueberzeit pro gearbeitetem Tag in Min. - wird aus dem Ziel berechnet (initTWD)
var FERIEN_ANSPRUCH = 25;     // Ferienanspruch pro Jahr in Tagen (vertraglich; mehr Ferien = gekauft)

// Jahresziel (in der App unter "Ziel" anpassbar, im Link gespeichert). Startwerte:
var ZIEL_FERIEN = 25;         // geplante Ferientage im Jahr (inkl. gekaufte)
var ZIEL_KOMP = 25;           // geplante Kompensationstage im Jahr (aus Ueberzeit)

// Laufzeitzustand
var TWD = 0;
function zielTage() { return ZIEL_FERIEN + ZIEL_KOMP; }   // Ziel Abwesenheit total
var kompEnts = [];
var ferienEnts = [];

// Feiertage Kanton Zug 2026
var H = [
  "2026-01-01","2026-01-02","2026-04-03","2026-04-06",
  "2026-05-14","2026-05-25","2026-06-04","2026-08-01",
  "2026-08-15","2026-11-01","2026-12-08","2026-12-25","2026-12-26"
];

var HNAMES = {
  "2026-01-01":"Neujahr","2026-01-02":"Berchtoldstag",
  "2026-04-03":"Karfreitag","2026-04-06":"Ostermontag",
  "2026-05-14":"Auffahrt","2026-05-25":"Pfingstmontag",
  "2026-06-04":"Fronleichnam","2026-08-01":"Nationalfeiertag",
  "2026-08-15":"Maria Himmelfahrt","2026-11-01":"Allerheiligen",
  "2026-12-08":"Maria Empfaengnis","2026-12-25":"Weihnachten",
  "2026-12-26":"Stephanstag"
};

// Vorfeiertage: reduzierte Sollzeit (VAC_PRE). Relevant fuer die Berechnung nur,
// wenn an einem solchen Tag kompensiert wird (Kompensation kostet dann 6h40 statt 7h34).
var PRE = {
  "2026-04-02":"Vorfeiertag Karfreitag",
  "2026-05-13":"Vorfeiertag Auffahrt",
  "2026-06-03":"Vorfeiertag Fronleichnam",
  "2026-07-31":"Vorfeiertag Nationalfeiertag",
  "2026-08-14":"Vorfeiertag Maria Himmelfahrt",
  "2026-12-07":"Vorfeiertag Maria Empfaengnis",
  "2026-12-24":"Vorfeiertag Weihnachten",
  "2026-12-30":"Vorfeiertag Stephanstag",
  "2026-12-31":"Vorfeiertag Neujahr"
};

var MONTHS = [
  "Januar","Februar","Maerz","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember"
];

var DOWS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
