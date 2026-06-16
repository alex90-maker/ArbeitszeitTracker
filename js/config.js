var VAC = 454;
var OTP = 50;
var YR = 2026;
var TWD = 0;
var kompEnts = [];
var ferienEnts = [];

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
