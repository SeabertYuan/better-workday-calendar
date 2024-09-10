// Parsing the course info for calendar
//const exampleCourse = {
//courseName: "CPSC_V 210 - 101",
//startDay: "2024-09-03",
//endDay: "2024-12-23",
//startTime: "15:00",
//endTime: "16:00",
//location: "ICCS-Floor 2-Room X251"
//}

var calendarObjects;
const dayOfWeekToNum = new Map([
  ["Sun", 0],
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6],
]);

function parseCourseInfo() {
  calendarObjects = [];
  for (let i = 0; i < courseTables.length - 1; i++) {
    const courseRows = courseTables[i].rows;
    for (let j = 2; j < courseRows.length; j++) {
      const courseRow = courseRows[j];
      let courseName = getCourseName(courseRow);

      let meeting_patterns = courseRow.childNodes[7].innerText.split("\n");
      for (let block of meeting_patterns) {
        block = block.trim();
        let startDay = getStartDay(block);
        let endDay = getEndDay(block);
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
}

function getCourseName(courseRow) {
  return courseRow.childNodes[4].innerText.slice(0, 14);
}

// ---------------------- Logics (Testable) ----------------------

// gets the actual start date which is:
// 1. later than the start date listed on the course table
// 2. on dayOfWeek
function getActualStartDate(startDay, dayOfWeek) {
  let startDateVals = startDay.split("-");
  let startDayOfWeek = getDayOfWeek(
    Number(startDateVals[0]),
    Number(startDateVals[1]),
    Number(startDateVals[2]),
  );
  let dif = (dayOfWeekToNum.get(dayOfWeek) - startDayOfWeek + 7) % 7;
  startDateVals[2] = (Number(startDateVals[2]) + dif).toString();
  return `${startDateVals[0]}-${startDateVals[1]}-${startDateVals[2].padStart(2, "0")}`;
}

// Formula obtained from https://cs.uwaterloo.ca/~alopez-o/math-faq/node73.html#:~:text=For%20a%20Gregorian%20date%2C%20add,7%20and%20take%20the%20remainder.
// input: int year, int month, int day
// output: int, 0 is Sunday → 6 is Saturday
function getDayOfWeek(year, month, day) {
  // treat Jan and Feb as months of the preceding year
  if (month == 1 || month == 2) year -= 1;
  const k = day;
  const m = ((month + 9) % 12) + 1;
  const C = Math.floor(year / 100);
  const Y = year % 100;
  const W =
    (k +
      Math.floor(2.6 * m - 0.2) -
      2 * C +
      Y +
      Math.floor(Y / 4) +
      Math.floor(C / 4)) %
    7;
  return (W + 7) % 7;
}

// gets the actual end date which is:
// 1. earlier than the end date listed on the course table
// 2. on dayOfWeek
function getActualEndDate(endDay, dayOfWeek) {
  let endDateVals = endDay.split("-");
  let endDayOfWeek = getDayOfWeek(
    Number(endDateVals[0]),
    Number(endDateVals[1]),
    Number(endDateVals[2]),
  );
  let dif = (endDayOfWeek - dayOfWeekToNum.get(dayOfWeek) + 7) % 7;
  endDateVals[2] = (Number(endDateVals[2]) - dif).toString();
  return `${endDateVals[0]}-${endDateVals[1]}-${endDateVals[2].padStart(2, "0")}`;
}

function getStartDay(block) {
  let startDay_section = block.split("|")[0].trim();
  let startDay = startDay_section.split(" - ")[0].trim();
  return startDay;
}

function getEndDay(block) {
  let endDay_section = block.split("|")[0].trim();
  let endDay = endDay_section.split(" - ")[1].trim();
  return endDay;
}

function getDaysOfWeek(block) {
  let day_section = block.split("|")[1].trim();
  let days = Array.from(day_section.split(" "));
  return handleExceptionalDays(days);
}

function handleExceptionalDays(days) {
  for (let i = days.length; i >= 0; i--) {
    if (!dayOfWeekToNum.has(days[i])) days.splice(i, 1);
  }
  return days;
}

function getTimeSection(block) {
  return block.split("|")[2].trim();
}

function isAm(timeSection) {
  return timeSection.split(" ")[1] == "a.m.";
}

// converts to 24-hour clock if needed
function parseTime(time) {
  let timeNum = time.split(" ")[0].trim();
  if (isAm(time) || parseInt(timeNum.split(":")[0]) >= 12) {
    return ("0" + timeNum).slice(-5);
  } else {
    return `${parseInt(timeNum.split(":")[0]) + 12}:${timeNum.split(":")[1].trim()}`;
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

module.exports = {
  getActualStartDate,
  getActualEndDate,
  getDayOfWeek,
  getStartDay,
  getEndDay,
  getDaysOfWeek,
  handleExceptionalDays,
  getTimeSection,
  isAm,
  parseTime,
};