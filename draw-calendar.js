var courseElements = document.getElementsByClassName("WMSC WKSC WLTC WEUC");
const WIDTH = 14.2857;

function hideElement(element) {
  element.style.display = "none";
}

function showElement(element) {
  element.style.display = "block";
}

//displays tagged elements on calendar page
async function displayElements() {
  for (const course of courseElements) {
    let courseName = course.innerText.slice(0, 10);
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
  await resetCalendar();
  await displayElements();
  redrawCalendar();
}

draw();

async function resetCalendar() {
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
