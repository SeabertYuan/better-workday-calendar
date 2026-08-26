// Functions pertaining to translating calendar objects into one large iCal file

const pstTimeZone = "America/Vancouver";
var workdayCalendarAPI = globalThis.__UBC_WORKDAY_TERM_CALENDAR__;

function setExportButtonContent(button) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.classList.add("ubc-workday-export-icon");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("focusable", "false");

  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", "M12 3v12m0 0 4-4m-4 4-4-4M5 21h14");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "2");
  icon.appendChild(path);

  button.replaceChildren(icon, document.createTextNode("Export Calendar (.ics)"));
}

function createExportButton(toolbarDiv) {
  if (!toolbarDiv || !workdayCalendarAPI) return null;

  let downloadButton = toolbarDiv.querySelector(
    '[data-workday-export-calendar="true"]',
  );
  if (!downloadButton) {
    const link = document.createElement("a");
    const now = new Date();
    const fileName = `UBC-classes-${now.getFullYear()}-${("0" + (now.getMonth() + 1)).slice(-2)}-${("0" + now.getDate()).slice(-2)}.ics`;
    link.setAttribute("download", fileName);

    downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.classList.add("ubc-workday-export-button");
    downloadButton.setAttribute("data-workday-export-calendar", "true");
    downloadButton.addEventListener("click", () => {
      const iCalContent = createCalendarString();
      const blob = new Blob([iCalContent], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }
  setExportButtonContent(downloadButton);
  downloadButton.title = "Download calendar (.ics)";
  if (
    downloadButton.parentElement !== toolbarDiv ||
    toolbarDiv.firstElementChild !== downloadButton
  ) {
    toolbarDiv.insertBefore(downloadButton, toolbarDiv.firstElementChild);
  }
  return downloadButton;
}


// ---------------------- Adapter to the current course records ----------------------

function formatCalendarDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCalendarOccurrence(date, dayOfWeek, isStart) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const occurrence = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
  );
  const difference = isStart
    ? (dayOfWeek - occurrence.getDay() + 7) % 7
    : (occurrence.getDay() - dayOfWeek + 7) % 7;
  occurrence.setDate(occurrence.getDate() + (isStart ? difference : -difference));
  return formatCalendarDate(occurrence);
}

function formatCalendarTime(minutes) {
  if (!Number.isFinite(minutes)) return "";
  const minuteOfDay = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, "0")}:${String(
    minuteOfDay % 60,
  ).padStart(2, "0")}`;
}

function getCalendarLocation(meeting) {
  const location = meeting && meeting.location;
  if (location && typeof location === "object") {
    return String(location.label || "").trim();
  }
  if (typeof location === "string") return location.trim();

  const parts = String((meeting && meeting.text) || "")
    .split("|")
    .slice(3)
    .map((part) => part.trim())
    .filter(Boolean);
  if (typeof workdayCalendarAPI?.parseLocationParts === "function") {
    return workdayCalendarAPI.parseLocationParts(parts).label || "";
  }
  return parts[0] || "";
}

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function getCalendarObjects() {
  const records = (workdayCalendarAPI.state.context?.records || []).filter(
    (record) =>
      record.registrationStatus !== "waitlisted" ||
      workdayCalendarAPI.state.showWaitlisted,
  );
  const objects = [];
  for (const record of records) {
    for (const meeting of record.meetings || []) {
      for (const dayOfWeek of meeting.meetingDays || []) {
        const startDay = getCalendarOccurrence(meeting.startDate, dayOfWeek, true);
        const endDay = getCalendarOccurrence(
          meeting.endDate || meeting.startDate,
          dayOfWeek,
          false,
        );
        const startTime = formatCalendarTime(meeting.startMinutes);
        const endTime = formatCalendarTime(meeting.endMinutes);
        if (!startDay || !endDay || !startTime || !endTime) continue;
        objects.push({
          courseName: record.name,
          startDay,
          endDay,
          startTime,
          endTime,
          location: getCalendarLocation(meeting),
        });
      }
    }
  }
  return objects;
}


// ---------------------- Logics (Testable) ----------------------

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

function generateVTIMEZONE() {
  return `BEGIN:VTIMEZONE\r\nTZID:America/Vancouver\r\nBEGIN:STANDARD\r\nDTSTART:20241103T090000Z\r\nRRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11\r\nTZOFFSETFROM:-0700\r\nTZOFFSETTO:-0800\r\nTZNAME:PST\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:20240310T100000Z\r\nRRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3\r\nTZOFFSETFROM:-0800\r\nTZOFFSETTO:-0700\r\nTZNAME:PDT\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE\r\n`;
}

function createCalendarString() {
  const calendarObjects = getCalendarObjects();
  let calendar =
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:better-workday-calendar\r\n";
  calendar += generateVTIMEZONE();
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
  return `SUMMARY:${escapeIcsText(calendarObject.courseName)}\r\n`;
}

function generateStartDate(calendarObject) {
  return (
    "DTSTART;TZID=" +
    pstTimeZone +
    ":" +
    calendarObject.startDay.replaceAll("-", "") +
    "T" +
    calendarObject.startTime.replaceAll(":", "") +
    "00\r\n"
  );
  // get start date and return it in the format YYYYMMDDTHHMMSS
}

function generateStartEndDate(calendarObject) {
  return (
    "DTEND;TZID=" +
    pstTimeZone +
    ":" +
    calendarObject.startDay.replaceAll("-", "") +
    "T" +
    calendarObject.endTime.replaceAll(":", "") +
    "00\r\n"
  );
  //get the end of the start date and return it in the format YYYYMMDDTHHMMSS
}

function generateLocation(calendarObject) {
  return `LOCATION:${escapeIcsText(calendarObject.location)}\r\n`;
}

if (workdayCalendarAPI) {
  workdayCalendarAPI.addExportButton = createExportButton;
}
