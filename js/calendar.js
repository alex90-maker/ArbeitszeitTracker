function buildCalendar() {
  var kd = getDaysSet(kompEnts);
  var fd = getDaysSet(ferienEnts);
  var today = ds(new Date());
  var grid = document.getElementById("calGrid"); grid.innerHTML = "";

  for (var mo = 0; mo < 12; mo++) {
    var block = document.createElement("div"); block.className = "month-block";
    var title = document.createElement("div"); title.className = "month-name";
    title.textContent = MONTHS[mo] + " " + YR; block.appendChild(title);
    var cg = document.createElement("div"); cg.className = "cal-grid";

    for (var dw = 0; dw < 7; dw++) {
      var dow = document.createElement("div"); dow.className = "cal-dow";
      dow.textContent = DOWS[dw]; cg.appendChild(dow);
    }

    var firstDay = new Date(YR, mo, 1).getDay(), offset = (firstDay + 6) % 7;
    for (var x = 0; x < offset; x++) {
      var emp = document.createElement("div"); emp.className = "cal-day empty"; cg.appendChild(emp);
    }

    var dim = new Date(YR, mo+1, 0).getDate();
    for (var day = 1; day <= dim; day++) {
      var date = new Date(YR, mo, day), dateStr = ds(date);
      var cell = document.createElement("div"); cell.className = "cal-day";
      var tip = "";
      if (ih(dateStr))       { cell.className += " holiday";      tip = HNAMES[dateStr] || "Feiertag"; }
      else if (iw(date))     { cell.className += " weekend"; }
      else if (kd[dateStr])  { cell.className += " kompensation"; tip = "Kompensation"; }
      else if (fd[dateStr])  { cell.className += " vacation";     tip = "Ferien"; }
      else if (PRE[dateStr]) { cell.className += " prefeiertag";  tip = PRE[dateStr]; }
      else                   { cell.className += " workday"; }
      if (dateStr === today) cell.className += " today";
      cell.textContent = day;
      if (tip) cell.title = tip;
      cg.appendChild(cell);
    }
    block.appendChild(cg); grid.appendChild(block);
  }
}
