// Collection of functions for exporting the course schedules as iCalendar
const calendarObjects = [];
const dayOfWeekToNum = new Map([
  ["Sun", 0],
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6]
]);

// gets the actual start date which is:
// 1. later than the start date listed on the course table
// 2. on dayOfWeek
function getActualStartDate(startDay, dayOfWeek) {
  let startDate = new Date(startDay);
  let startDayOfWeek = startDate.getDay();
  let dif = (dayOfWeekToNum.get(dayOfWeek) - startDayOfWeek + 7) % 7;
  startDate.setDate(startDate.getDate() + dif);
  return formatDate(startDate);
}

// gets the actual end date which is:
// 1. earlier than the end date listed on the course table
// 2. on dayOfWeek
function getActualEndDate(endDay, dayOfWeek) {
  let endDate = new Date(endDay);
  let endDayOfWeek = endDate.getDay();
  let dif = (endDayOfWeek - dayOfWeekToNum.get(dayOfWeek) + 7) % 7;
  endDate.setDate(endDate.getDate() - dif);
  return formatDate(endDate);
}

// formats the Data object to "yyyy-mm-dd" format
function formatDate(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseCourseInfo() {
  const courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length; i++) {
    const courseRow = courseRows[i];
    let courseName = getCourseName(courseRow);
    let startDay = getStartDay(courseRow);
    let endDay = getEndDay(courseRow);

    meeting_patterns = courseRow.childNodes[7].innerText.split("\n");
    for (let block of meeting_patterns) {
      block = block.trim();
      let daysOfWeek = getDaysOfWeek(block);
      let startTime = getStartTime(block);
      let endTime = getEndTime(block);
      let location = getLocation(block);

      for (let dayOfWeek of daysOfWeek) {
        let calendarObject = {
          courseName: courseName,
          startDay: getActualStartDate(startDay, dayOfWeek),
          endDay: getActualEndDate(endDay, dayOfWeek),
          startTime: startTime,
          endTime: endTime,
          location: location,
        };
        calendarObjects.push(calendarObject);
      }
    }
  }
}

function getCourseName(courseRow) {
  return courseRow.childNodes[4].innerText.slice(0, 14); //!!! should we exclude "_V"?
}

function getStartDay(courseRow) {
  return courseRow.childNodes[10].innerText;
}

function getEndDay(courseRow) {
  return courseRow.childNodes[11].innerText;
}

function getDaysOfWeek(block) {
  let day_section = block.split("|")[1].trim();
  let days = day_section.split(" ");
  return days;
}

function isAm(timeSection) {
  return timeSection.slice(5) == "a.m.";
}

function getTimeSection(block) {
  return block.split("|")[2].trim();
}

// converts to 24-hour clock if needed
function parseTime(time) {
  if (isAm(time)) {
    return time.slice(0, 4);
  } else {
    return `${parseInt(time.split(":")[0]) + 12}:${time.split(":")[1].slice(0, 2)}`;
  }
}

function getStartTime(block) {
  let start_time = getTimeSection(block).split("-")[0].trim();
  return parseTime(start_time);
}

function getEndTime(block) {
  let end_time = getTimeSection(block).split("-")[1].trim();
  return parseTime(end_time);
}

function getLocation(block) {
  let loc_section = block.split("|")[3].trim();
  return loc_section;
}