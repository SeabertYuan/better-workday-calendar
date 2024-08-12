// initialize variables (wait for the course tables and course elements
// to show up then initialize them)
function initializeVariables() {
  TERM = 0; // 0-none, 1-term 1, 2-term 2, 3-full year
  courseElements = Array.from(
    document.querySelectorAll(".WMSC.WKSC.WLTC.WEUC"),
  );
  console.log(courseElements.length);
}

// run the main program
// initialize variables -> add buttons -> update calendar -> add styles
function runProgram() {
  initializeVariables();
  createToolbarButtons();
  updateCalendar();
}

// If all the DOM content are loaded, start observing the target page
function main() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observer);
  } else {
    observer();
  }
}

// call main()
main();
