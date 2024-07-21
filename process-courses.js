// Collection of functions for processing course terms

let TERM;
let courseDatesArr, courseTables;
const coursesToShow = new Set();
const courseDates = new Set();

function getCourseTerms() {
  if (courseTables.length > 0) {
    let courseRows = courseTables[0].rows;
    for (let i = 2; i < courseRows.length; i++) {
      let startDate = parseCourseDate(courseRows[i].childNodes[10]);
      let endDate = parseCourseDate(courseRows[i].childNodes[11]);
      courseDates.add(startDate);
      courseDates.add(endDate);
    }
    courseDatesArr = Array.from(courseDates);
    courseDatesArr.sort();
  } else {
    console.error("No course table found");
  }
}

function parseCourseDate(courseDate) {
  let monthString = courseDate.innerText.split("-")[1];
  return parseInt(monthString);
}

function getCourseTerm(courseRow) {
  let firstTermDates = new Set([8, 9, 10, 5, 6]);
  let secondTermDates = new Set([4, 5, 8, 9]);
  let startDate = parseCourseDate(courseRow.childNodes[10]);
  let endDate = parseCourseDate(courseRow.childNodes[11]);
  let term = 0;
  if (firstTermDates.has(startDate)) {
    term++;
  }
  if (secondTermDates.has(endDate)) {
    term += 2;
  }
  return term;
}

function clearCourses() {
  coursesToShow.clear();
}

//tags elements with given term
function tagCourses() {
  let courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length; i++) {
    let elemTerm = getCourseTerm(courseRows[i]);
    if (TERM == 0 || TERM == elemTerm || elemTerm == 3) {
      let courseName = courseRows[i].childNodes[4].innerText.slice(0, 14);
      coursesToShow.add(courseName);
    }
  }
}

function filterCourses() {
  getCourseTerms();
  clearCourses();
  tagCourses();
}
