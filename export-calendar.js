// Collection of functions for exporting the course schedules as iCalendar

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

function getStartTime(block) {
  let time_section = block.split("|")[2].trim();
  let start_time = time_section.split("-")[0].trim().slice(0, 5);
  return start_time;
}

function getEndTime(block) {
  let time_section = block.split("|")[2].trim();
  let end_time = time_section.split("-")[1].trim().slice(0, 5);
  return end_time;
}

function getLocation(block) {
  let loc_section = block.split("|")[3].trim();
  return loc_section;
}