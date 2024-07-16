let courseElements;
const WIDTH = 14.2857;

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

// adds css styles
function addStyles() {
  const css = `
    .term-filter-buttons {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-left: auto;
      padding-inline: 10px;
    }
    
    .term-filter-button {
      padding: 5px 10px;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .term-filter-button:not(.active):hover {
      background-color: #e0e0e0;
    }
    
    .term-filter-button.active {
      background-color: #2391d7;
      color: white;
    }
    
    .css-1i5y6dv-StyledBoxElement-StyledFlex-IconsContainer {
      margin-inline-start: 0;
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.appendChild(document.createTextNode(css));
  
  document.head.appendChild(styleElement);
}