function initializeVariables() {
  TERM = 1;
  courseTables = document.getElementsByClassName("css-sec5tc");
  courseElements = document.getElementsByClassName("WMSC WKSC WLTC WEUC");
}

// initialize the view, set the term 1 button as selected
function main() {
  initializeVariables();
  addFilterButtons();
  term1_button = document.querySelectorAll(".term-filter-button")[0];
  updateButtonStyles(term1_button);
  updateCalendar();
  addStyles();
}

// use addEventListener to wait for all the DOM to be loaded
if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}