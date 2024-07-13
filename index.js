var TERM = 1;
const courseElements = document.getElementsByClassName("WMSC WKSC WLTC WEUC");
const courseNameMap = new Set();

function hideElement(element) {
  element.style.display = "none";
}

function showElement(element) {
  element.style.display = "block";
}

// gets the terms of the given element
async function getElementTerm(element) {
  let courseString = await element.innerText;
  let courseTerm = await courseString.split("\n")[0].slice(-3, -2); // gets the term number
  return courseTerm;
}

//tags elements with given term
async function tagElements() {
  for (const element of courseElements) {
    let elemTerm = await getElementTerm(element);
    if (TERM.toString() == elemTerm) {
      let courseName = await element.innerText.split("\n")[0].slice(0, -4);
      courseNameMap.add(courseName);
    }
  }
}

//displays tagged elements
async function displayElements() {
  for (const course of courseElements) {
    let courseName = await course.innerText.split("\n")[0].slice(0, -4);
    if (courseNameMap.has(courseName)) {
      showElement(course);
    } else {
      hideElement(course);
    }
  }
}

function refreshElements() {
  for (const course of courseElements) {
    showElement(course);
  }
  courseNameMap.clear();
}
async function main() {
  await tagElements(refreshElements());
  // increase the size of the popup
  document.styleSheets[40].insertRule(
    ".WCU.WACR { max-width: 1000px !important; }",
    document.styleSheets[40].cssRules.length,
  );

  await displayElements();
  redrawCalendar();
}

main();

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
