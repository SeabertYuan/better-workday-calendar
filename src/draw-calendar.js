// Codes relating to calendar UI

// variables
let courseElements;
const WIDTH = 14.2857;


// ---------------------- Course Display ----------------------

function hideElement(element) {
  element.style.display = "none";
}

function showElement(element) {
  element.style.display = "block";
}

//displays tagged elements on calendar page
function displayElements() {
  for (const course of courseElements) {
    let courseName = course.innerText.slice(0, 14);
    if (coursesToShow.has(courseName)) {
      showElement(course);
    } else {
      hideElement(course);
    }
  }
}

function resetCalendar() {
  for (const course of courseElements) {
    showElement(course);
  }
}

//returns weekdayFactor (number of "widths" away from the left)
function calculateFactor(element) {
  return Math.floor(element.style.left.slice(0, -1) / WIDTH);
}

//redraws course in correct width
function redrawCourse(weekdayFactor, course) {
  if (isInSmallViewport()) {
    course.style.left = "0%";
    course.style.width = "100%";
  } else {
    course.style.left = `${weekdayFactor * WIDTH}%`;
    course.style.width = `${WIDTH}%`;
  }
}

//redraws calendar with correct widths
function redrawCalendar() {
  for (const course of courseElements) {
    redrawCourse(calculateFactor(course), course);
  }
}

function draw() {
  resetCalendar();
  displayElements();
  if (TERM != 0) {
    redrawCalendar();
  }
}

function refreshCourseElements() {
  courseElements = Array.from(
    document.querySelectorAll(".WMSC.WKSC.WLTC.WEUC"),
  );
}

// updates the calendar
function updateCalendar() {
  refreshCourseElements();
  clearCourses();
  filterCourses();
  draw();
  console.log("calendar updated");
}

async function updateDayOfWeek() {
  const repaint = async () => {
    for (let i = 0; i < 2; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
  };
  await repaint();

  updateCalendar();
  addDayOfWeekEventListener();
  console.log("day of week changed");
}

function addDayOfWeekEventListener() {
  const buttons = document.querySelectorAll("ul.WB31 li");
  if (!buttons) return;
  buttons.forEach(button => {
    button.addEventListener("click", updateDayOfWeek);
  });
}


// ---------------------- Other UI ----------------------

// creates filter buttons "Term 1" and "Term 2"
function createFilterButtons() {
  // header part
  const headerContents = document.querySelector(".css-fgks37-HeaderContents");
  if (!headerContents) return;

  // title and x button
  const existingDivs = headerContents.children;
  if (existingDivs.length < 2) return;

  const buttonDiv = document.createElement("div");
  buttonDiv.className = "toolbar-buttons";

  const buttons = ["Term 1", "Term 2"];
  buttons.forEach((text, index) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "toolbar-button";
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
  const buttons = document.querySelectorAll(".toolbar-button");
  buttons.forEach((button) => {
    if (button == clickedButton) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

// adds styles to toolbar buttons
function addToolbarButtonStyles() {
  // remove all the remaining styles if any
  removeStyle("toolbar-button-styles");

  const rule = `
    .toolbar-buttons {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-left: auto;
      padding-inline: 10px;
    }
    
    .toolbar-button {
      padding: 5px 10px;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
      height: 30px;
    }
    
    .toolbar-button:not(.active):hover {
      background-color: #e0e0e0;
    }
    
    .toolbar-button.active {
      background-color: #418ccf;
      color: white;
      border: none;
    }
    
    .css-1i5y6dv-StyledBoxElement-StyledFlex-IconsContainer {
      margin-inline-start: 0;
    }

    .gwt-Label.WHUC.WOSC.WDVC {
      font-size: 11px;
    }

    .gwt-Label.WIUC.WDVC {
      font-size: 10px
    }

    .export-button {
      margin-inline-start: 15px;
      border-radius: 15px;
      padding: 5px 15px;
    }
  `;

  const styleElement = document.createElement("style");
  styleElement.id = "toolbar-button-styles";
  styleElement.appendChild(document.createTextNode(rule));

  document.head.appendChild(styleElement);
}

/* Commented out for now
// adds styles to course tables
function addCourseTableStyles() {
  // remove all the remaining styles if any
  removeStyle("course-table-styles");

  let rule =
    ".WLMM.WKMM { justify-content: center; flex-direction: column; } .WOMY.WKMY.WKMY .WDVM, .WOMY.WKMY.WKMY .WGVM, .WOMY.WKMY.WKMY .WLSM, .WOMY.WKMY.WKMY .WMSM, .WOMY.WKMY.WKMY .WEVM, .WOMY.WKMY.WKMY .WHVM, .WOMY.WKMY.WKMY .WOSM, .WOMY.WKMY.WKMY .WNSM { min-width: 70px; padding: 0 12px;} .WDHN { min-width: 70px } .WJMM { margin: 0; } .WLMM > .WJMM { padding: 0; }";
  let styleElement = document.createElement("style");
  styleElement.id = "course-table-styles";
  styleElement.appendChild(document.createTextNode(rule));
  document.head.appendChild(styleElement);
}
*/

// remove a style with id
function removeStyle(id) {
  const styleElement = document.getElementById(id);
  if (styleElement && document.head) {
    document.head.removeChild(styleElement);
  }
}

// remove all the styles
function removeStyles() {
  const idsToRemove = ["toolbar-button-styles", "course-table-styles"];
  for (id of idsToRemove) {
    removeStyle(id);
  }
}

function addPopupWindowStyle() {
  const styleElement = document.createElement("style");
  styleElement.id = "popupWindowStyle";
  styleElement.appendChild(document.createTextNode(`
    .WCU.wd-popup {
      max-width: 1000px !important;
      width: 100%;
    }

    .WPT.wd-popup-content {
      max-width: none !important;
      width: 100%;
    }

    @media screen and (max-width: 1250px) {
      .WCU.wd-popup {
        max-width: 80% !important;
      }
    }
  `));
  document.head.appendChild(styleElement);
}

// create toolbar buttons (filter and export)
function createToolbarButtons() {
  createFilterButtons();
  createExportButton();
  addToolbarButtonStyles();
}

function setupUI() {
  createToolbarButtons();
  addPopupWindowStyle();
}