var TERM = 1;
const coursesToShow = new Set();
const courseDates = new Set();
var courseDatesArr;
const courseTables = document.getElementsByClassName("css-sec5tc");

function getCourseTerms() {
  courseDatesArr = [];
  let courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length; i++) {
    let date = parseCourseDate(courseRows[i].childNodes[10]);
    courseDates.add(date);
  }
  courseDatesArr = Array.from(courseDates);
  //sorts course start dates by increasing order
  courseDatesArr.sort();
}

function parseCourseDate(courseDate) {
  let dateString = courseDate.innerText.replaceAll("-", "");
  return parseInt(dateString);
}

// gets the term of the given course
async function getCourseTerm(courseRow) {
  let courseDate = parseCourseDate(courseRow.childNodes[10]);
  if (courseDatesArr[0] - courseDate == 0) {
    return 1;
  } else {
    return 2;
  }
}

//tags elements with given term
async function tagCourses() {
  let courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length; i++) {
    let elemTerm = await getCourseTerm(courseRows[i]);
    if (TERM == elemTerm) {
      let courseName = await courseRows[i].childNodes[4].innerText.slice(0, 10);
      coursesToShow.add(courseName);
    }
  }
}

function clearCourses() {
  coursesToShow.clear();
}

function filterCourses() {
  getCourseTerms(clearCourses());
  tagCourses();
}

filterCourses();
