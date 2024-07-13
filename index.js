var TERM = 1;
const coursesToShow = new Set();
const courseDates = new Set();
const courseDatesArr = [];
const courseTables = document.getElementsByClassName("css-sec5tc");

function getCourseTerms() {
  let courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length(); i++) {
    courseDates.add(parseCourseDate(courseRows[i][10]));
  }
  courseDatesArr = Array.from(courseDates);
  //sorts course start dates by increasing order
  courseDatesArr.sort();
}

function parseCourseDate(courseDate) {
  courseDate.replace("-", "");
  return parseInt(courseDate);
}

// gets the term of the given course
async function getCourseTerm(courseRow) {
  let courseDate = parseCourseDate(courseRow[10]);
  if (courseDatesArr[0] - courseDate == 0) {
    return 1;
  } else {
    return 2;
  }
}

//tags elements with given term
async function tagCourses() {
  let courseRows = courseTables[0].rows;
  for (let i = 2; i < courseRows.length(); i++) {
    let elemTerm = await getCourseTerm(courseRows[i]);
    if (TERM == elemTerm) {
      let courseName = await courseRows[4].innerText.slice(0, 10);
      coursesToShow.add(courseName);
    }
  }
}

function refreshElements() {
  courseNameMap.clear();
}

async function filterCourses() {
  getCourseTerms(refreshElements());
  tagCourses();
}

filterCourses();
