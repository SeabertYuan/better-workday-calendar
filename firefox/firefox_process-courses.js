let TERM, courseDatesArr;
let courseTables;
const coursesToShow = new Set();
const courseDates = new Set();

function getCourseTerms() {
  if (courseTables.length > 0) {
    let courseRows = courseTables[0].rows;
    for (let i = 2; i < courseRows.length; i++) {
      let date = parseCourseDate(courseRows[i].childNodes[10]);
      courseDates.add(date);
    }
    courseDatesArr = Array.from(courseDates);
    courseDatesArr.sort();
  } else {
    console.error("No course table found");
  }
}

function parseCourseDate(courseDate) {
  let dateString = courseDate.innerText.replaceAll("-", "");
  return parseInt(dateString);
}

function getCourseTerm(courseRow) {
  let courseDate = parseCourseDate(courseRow.childNodes[10]);
  return (courseDatesArr[0] - courseDate == 0) ? 1 : 2;
}

function clearCourses() {
  coursesToShow.clear();
}

//tags elements with given term
function tagCourses() {
  let courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length; i++) {
    let elemTerm = getCourseTerm(courseRows[i]);
    if (TERM == elemTerm) {
      let courseName = courseRows[i].childNodes[4].innerText.slice(0, 10);
      coursesToShow.add(courseName);
    }
  }
}

function filterCourses() {
  getCourseTerms();
  clearCourses();
  tagCourses();
}
