// Functions pertaining to translating calendar objects into one large iCal file
function addEvent(calendarObject) {
  let currTime = "date"; //get the current time and make it into needed string
  let eventString = "BEGIN:VEVENT\r\nRRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=";
  eventString +=
    getEndDate(calendarObject) +
    "235959\r\n" +
    generateUUID(calendarObject) +
    generateSummary(calendarObject) +
    generateStartDate(calendarObject) +
    generateStartEndDate(calendarObject) +
    currTime +
    generateLocation(calendarObject) +
    "END:VENV\r\n";
  return eventString;
}

function createCalendarString() {
  let calendar =
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPROID:better-workday-calendar\r\n";
  for (let calendarObject of calendarObjects) {
    calendar += addEvent(calendarObject);
  }
  calendar += "END:VCALENDAR";
  return calendar;
}

function getEndDate(calendarObject) {
  // get the until date and return it in the format YYYYMMDDT
}

function generateUUID(calendarObject) {
  // use the calendar properties to generate a unique UUID
}

function generateSummary(calendarObject) {
  return `SUMMARY:"${calendarObject.courseName}"\r\n`;
}

function generateStartDate(calendarObject) {
  // get start date and return it in the format YYYYMMDDTHHMMSS
}

function generateStartEndDate(calendarObject) {
  //get the end of the start date and return it in the format YYYYMMDDTHHMMSS
}

function generateLocation(calendarObject) {
  return `LOCATION:"${calendarObject.location}"\r\n`;
}

function downloadICalFile() {
  const iCalContent = createCalendarString();
  const blob = new Blob([iCalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const headerContents = document.querySelector(".css-fgks37-HeaderContents");
  if (!headerContents) return;

  const existingDivs = headerContents.children;
  if (existingDivs.length < 3) return;

  const link = document.createElement("a");
  link.innerText = "Download";
  link.href = url;
  link.setAttribute("download", "test_MATH226.ics");
  headerContents.insertBefore(link, existingDivs[1]);
  link.addEventListener("click", () => {
    headerContents.removeChild(link);
  });
}
