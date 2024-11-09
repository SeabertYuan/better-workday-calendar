// DOM-related constants
const courseElementClasses = ".WNSC.WLSC.WMTC.WFUC"; //.WMSC.WKSC.WLTC.WEUC
const courseNameTextClasses = ".gwt-Label.WIUC.WPSC.WEVC";
const courseDescriptionTextClasses = ".gwt-Label.WJUC.WEVC";
const smallViewportDayOfWeekButtonsClasses = "ul.WH31 li";

// initialize variables (wait for the course tables and course elements
// to show up then initialize them)
function initializeVariables() {
  TERM = 0; // 0-none, 1-term 1, 2-term 2, 3-full year
  courseElements = Array.from(
    document.querySelectorAll(courseElementClasses),
  );
}

// run the main program
// initialize variables -> add UIs -> update calendar
function runProgram() {
  initializeVariables();
  setupUI();
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
