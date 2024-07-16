let TERM, courseDatesArr, courseTables, courseElements;
const coursesToShow = new Set();
const courseDates = new Set();
const WIDTH = 14.2857;

function initializeVariables() {
  TERM = 1;
  courseTables = document.getElementsByClassName("css-sec5tc");
  courseElements = document.getElementsByClassName("WMSC WKSC WLTC WEUC");
}

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

function hideElement(element) {
  element.style.display = "none";
}

function showElement(element) {
  element.style.display = "block";
}

//displays tagged elements on calendar page
function displayElements() {
  for (const course of courseElements) {
    let courseName = course.innerText.slice(0, 10);
    if (coursesToShow.has(courseName)) {
      showElement(course);
    } else {
      hideElement(course);
    }
  }
}

function draw() {
  document.styleSheets[40].insertRule(
    ".WCU.WACR { max-width: 1000px !important; }",
    document.styleSheets[40].cssRules.length
  );
  resetCalendar();
  displayElements();
  redrawCalendar();
}

function resetCalendar() {
  for (const course of courseElements) {
    showElement(course);
  }
}

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

// creates filter buttons "Term 1" and "Term 2"
function addFilterButtons() {
  // header part
  const headerContents = document.querySelector(".css-fgks37-HeaderContents");
  if (!headerContents) return;

  // title and x button
  const existingDivs = headerContents.children;
  if (existingDivs.length < 2) return;

  const buttonDiv = document.createElement("div");
  buttonDiv.className = "term-filter-buttons";

  const buttons = ["Term 1", "Term 2"];
  buttons.forEach((text, index) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "term-filter-button";
    button.addEventListener("click", () => {
      TERM = index + 1;
      updateCalendar();
      updateButtonStyles(button);
    });
    buttonDiv.appendChild(button);
  });

  // add the buttons inbetween
  headerContents.insertBefore(buttonDiv, existingDivs[1]);
}

// sets the selected button to active
function updateButtonStyles(clickedButton) {
  const buttons = document.querySelectorAll(".term-filter-button");
  buttons.forEach(button => {
    if (button == clickedButton) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  })
}

// updates the calendar
function updateCalendar() {
  clearCourses();
  filterCourses();
  draw();
}

// initialize the view, set the term 1 button as selected
function main() {
  initializeVariables();
  addFilterButtons();
  term1_button = document.querySelectorAll(".term-filter-button")[0];
  updateButtonStyles(term1_button);
  updateCalendar();
}

// use addEventListener to wait for all the DOM to be loaded
if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}