// Filtering courses by term

let TERM, courseTables;
const coursesToShow = new Set();

// check is the table is loaded
function isTablesLoaded() {
  let tables = document.getElementsByTagName("table");
  return !!tables ? tables.length > 1 : false;
}

// wait for the course tables and return it
function waitForTables() {
  return new Promise((resolve) => {
    if (isTablesLoaded()) {
      return resolve(Array.from(document.getElementsByTagName("table")));
    }

    const tableObserver = new MutationObserver(() => {
      if (isTablesLoaded()) {
        resolve(Array.from(document.getElementsByTagName("table")));
        tableObserver.disconnect();
      }
    });
    tableObserver.observe(document.body, { childList: true, subtree: true });
  });
}

// change the table style (to fixed)
async function fixTable() {
  courseTables = await waitForTables();

  // ↓Code to solve the course table cut-off issue. Commented out for now.

  //for (let courseTable of courseTables) {
  //  courseTable.style.tableLayout = "fixed";
  //}
  //
  //addCourseTableStyles();
}

function parseCourseMonth(courseDate) {
  let monthString = courseDate.innerText.split("-")[1];
  return parseInt(monthString);
}

function getCourseTerm(courseRow) {
  let startMonth = parseCourseMonth(courseRow.childNodes[10]);
  let endMonth = parseCourseMonth(courseRow.childNodes[11]);
  return calculateCourseTerm(startMonth, endMonth);
}

// takes a start and end month, returns the term (3 if full year)
function calculateCourseTerm(startMonth, endMonth) {
  let firstTermStartMonths = new Set([8, 9, 5]);
  let secondTermEndMonths = new Set([4, 8]);
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
