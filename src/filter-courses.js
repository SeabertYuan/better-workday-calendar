// Filtering courses by term

let TERM, courseTables;
const coursesToShow = new Set();

function parseCourseMonth(courseDate) {
  let monthString = courseDate.innerText.split("-")[1];
  return parseInt(monthString);
}

function getCourseTerm(courseRow) {
  let firstTermStartMonths = new Set([8, 9, 5]);
  let secondTermEndMonths = new Set([4, 8]);
  let startMonth = parseCourseMonth(courseRow.childNodes[10]);
  let endMonth = parseCourseMonth(courseRow.childNodes[11]);
  let term = 0;
  if (firstTermStartMonths.has(startMonth)) {
    term++;
  }
  if (secondTermEndMonths.has(endMonth)) {
    term += 2;
  }
  return term;
}

function clearCourses() {
  coursesToShow.clear();
}

//tags elements with given term
function tagCourses() {
  for (let i = 0; i < courseTables.length - 1; i++) {
    const courseRows = courseTables[i].rows;
    for (let j = 2; j < courseRows.length; j++) {
      let elemTerm = getCourseTerm(courseRows[j]);
      if (TERM == 0 || TERM == elemTerm || elemTerm == 3) {
        let courseName = courseRows[j].childNodes[4].innerText.slice(0, 14);
        coursesToShow.add(courseName);
      }
    }
  }
}

function filterCourses() {
  clearCourses();
  tagCourses();
}
