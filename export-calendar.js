// Collection of functions for exporting the course schedules as iCalendar
const calendarObjects = [];

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
          startDay: startDay,
          endDay: endDay,
          startTime: startTime,
          endTime: endTime,
          location: location,
        };
        calendarObjects.push(calendarObject);
        //!!! create a js object here??
      }
    }
  }
}

function getCourseName(courseRow) {
  return courseRow.childNodes[4].innerText.slice(0, 14); //!!! should we exclude "_V"?
}

function getStartDay(courseRow) {
  return courseRow.childNodes[10].innerText;
  //!!! still need to calculate the "actual" start date
}

function getEndDay(courseRow) {
  return courseRow.childNodes[11].innerText;
  //!!! still need to calculate the "actual" end date
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

