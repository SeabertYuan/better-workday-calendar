var TERM = 1;
const courseElements = document.getElementsByClassName("WMSC WKSC WLTC WEUC");
const coursesToShow = new Set();
const courseDates = new Set();
const courseDatesArr = [];
const courseTables = document.getElementsByClassName("css-sec5tc");

function parseCourseDate(courseDate) {
  courseDate.replace("-", "");
  return parseInt(courseDate);
}

function hideElement(element) {
  element.style.display = "none";
}

function showElement(element) {
  element.style.display = "block";
}

// gets the terms of the given element
async function getElementTerm(courseRow) {
  let courseDate = parseCourseDate(courseRow[10]);
  if (courseDatesArr[0] - courseDate == 0) {
    return 1;
  } else {
    return 2;
  }
}

//displays tagged elements on calendar page
async function displayElements() {
  for (const course of courseElements) {
    let courseName = await course.innerText.split("\n")[0].slice(0, -4);
    if (coursesToShow.has(courseName)) {
      showElement(course);
    } else {
      hideElement(course);
    }
  }
}

async function draw() {
  // increase the size of the popup
  document.styleSheets[40].insertRule(
    ".WCU.WACR { max-width: 1000px !important; }",
    document.styleSheets[40].cssRules.length,
  );

  await displayElements();
  redrawCalendar();
}

draw();

//redraws calendar with correct widths
function redrawCalendar() {
  for (const course of courseElements) {
    redrawCourse(calculateFactor(course), course);
  }
}

//returns weekdayFactor (number of "widths" away from the left)
function calculateFactor(element) {
  return Math.floor(element.style.left.slice(0, -1) / WIDTH);
}

//redraws course in correct width
function redrawCourse(weekdayFactor, course) {
  course.style.left = `${weekdayFactor * WIDTH}%`;
  course.style.width = `${WIDTH}%`;
}