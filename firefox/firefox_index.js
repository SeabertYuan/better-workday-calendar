function initializeVariables() {
  TERM = 1;
  courseTables = document.getElementsByClassName("css-sec5tc");
  courseElements = document.getElementsByClassName("WMSC WKSC WLTC WEUC");
  document
    .getElementById("wd-MultiParameterButton-56$461383")
    .addEventListener("click", main);
}

// initialize the view, set the term 1 button as selected
function main() {
  //initializeVariables();
  addFilterButtons();
  let firstTermButton = document.querySelectorAll(".term-filter-button")[0];
  updateButtonStyles(firstTermButton);
  updateCalendar();
  addStyles();
}

switch (document.readyState) {
  case "loading":
    break;
  case "interactive": {
    break;
  }
  case "complete": {
    initializeVariables();
    break;
  }
}

