// Functions pertaining to translating calendar objects into one large iCal file
function addEvent(calendarObject) {
  const date = new Date();
  let currTime = `DTSTAMP:${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${("0" + date.getDate()).slice(-2)}T${("0" + date.getHours()).slice(-2)}${("0" + date.getMinutes()).slice(-2)}${("0" + date.getSeconds()).slice(-2)}\r\n`;
  let eventString = "BEGIN:VEVENT\r\nRRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=";
  eventString +=
    getEndDate(calendarObject) +
    "T235959\r\n" +
    generateUUID() +
    generateSummary(calendarObject) +
    generateStartDate(calendarObject) +
    generateStartEndDate(calendarObject) +
    currTime +
    generateLocation(calendarObject) +
    "END:VEVENT\r\n";
  return eventString;
}

async function createCalendarString() {
  await parseCourseInfo();
  let calendar =
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:better-workday-calendar\r\n";
  for (let calendarObject of calendarObjects) {
    calendar += addEvent(calendarObject);
  }
  calendar += "END:VCALENDAR";
  return calendar;
}

function getEndDate(calendarObject) {
  return calendarObject.endDay.replaceAll("-", "");
}

function generateUUID() {
  let uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16),
  );
  return "UID:" + uuid + "\r\n";
}

function generateSummary(calendarObject) {
  return `SUMMARY:${calendarObject.courseName}\r\n`;
}

function generateStartDate(calendarObject) {
  return (
    "DTSTART:" +
    calendarObject.startDay.replaceAll("-", "") +
    "T" +
    calendarObject.startTime.replaceAll(":", "") +
    "00\r\n"
  );
  // get start date and return it in the format YYYYMMDDTHHMMSS
}

function generateStartEndDate(calendarObject) {
  return (
    "DTEND:" +
    calendarObject.startDay.replaceAll("-", "") +
    "T" +
    calendarObject.endTime.replaceAll(":", "") +
    "00\r\n"
  );
  //get the end of the start date and return it in the format YYYYMMDDTHHMMSS
}

function generateLocation(calendarObject) {
  return `LOCATION:${calendarObject.location}\r\n`;
}

async function downloadICalFile() {
  const iCalContent = await createCalendarString();
  console.log(iCalContent);
  const blob = new Blob([iCalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const headerContents = document.querySelector(".css-fgks37-HeaderContents");
  if (!headerContents) return;

  const existingDivs = headerContents.children;
  if (existingDivs.length < 3) return;

  const link = document.createElement("a");
  link.innerText = "Download";
  link.href = url;
  link.setAttribute("download", "courses.ics");
  headerContents.insertBefore(link, existingDivs[1]);
  link.addEventListener("click", () => {
    headerContents.removeChild(link);
  });
}
