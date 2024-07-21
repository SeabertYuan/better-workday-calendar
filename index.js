// initialize variables (wait for the course tables and course elements
// to show up then initialize them)
function initializeVariables() {
  TERM = 0;
  courseTables = document.getElementsByTagName("table");
  courseElements = Array.from(document.querySelectorAll(".WMSC.WKSC.WLTC.WEUC"));
}

// run the main program
// initialize variables -> add buttons -> update calendar -> add styles
function runProgram() {
  initializeVariables();
  addFilterButtons();
  console.log("added filter buttons");
  //let term1_button = document.querySelectorAll(".term-filter-button")[0];
  //updateButtonStyles(term1_button);
  updateCalendar();
  addStyles();
}

// If the popup exists (the header element that only exists in the
// popup is used as a detector)
function isPopupOpen() {
  return isTargetPage() && !!document.querySelector(".css-fgks37-HeaderContents");
}


let popupObserver = null;

// Wait for the popup to show up
function waitForPopup() {
  return new Promise((resolve) => {
    if (isPopupOpen()) {
      resolve();
    } else {
      popupObserver = new MutationObserver(() => {
        if (isPopupOpen()) {
          popupObserver.disconnect();
          resolve();
        }
      });
      popupObserver.observe(document.body, { childList: true, subtree: true });
    }
  });
}

// popup observer
// if there is no popup: wait for it to appear
// if there is a pop: run the program and wait for
// the popup to close and call this funciton reccursively
async function observePopup() {
  await waitForPopup()
  runProgram();

  const popupCloseObserver = new MutationObserver(() => {
    if (!isPopupOpen()) {
      popupCloseObserver.disconnect();
      observePopup();
    }
  });
  popupCloseObserver.observe(document.body, { childList: true, subtree: true });
}

// checks if we are at the target page (View My Courses)
function isTargetPage() {
  return window.location.href.includes("wd10.myworkday.com/ubc/d/task/2998$28771");
}

// observe the current path we are at
// if we are at the target page: start observing the popup
// if we are not at the target page: wait until we reach there
function observeTargetPage() {
  console.log("program ran");
  if (isTargetPage()) {
    observePopup();
    observeCloseTargetPage();
  } else {
    const targetPageObserver = new MutationObserver(() => {
      if (isTargetPage()) {
        observePopup();
        targetPageObserver.disconnect();
        observeCloseTargetPage();
      } 
    });
    targetPageObserver.observe(document, { childList: true, subtree: true });
  }
}

function observeCloseTargetPage() {
  if (!isTargetPage()) {
    observeTargetPage();
  }
  const targetPageCloseObserver = new MutationObserver(() => {
    if (!isTargetPage()) {
      observeTargetPage();
      targetPageCloseObserver.disconnect();
      popupObserver.disconnect();
      popupObserver = null;
    }
  })
  targetPageCloseObserver.observe(document, { childList: true, subtree: true });
}

// If all the DOM content are loaded, start observing the target page
function main() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeTargetPage);
  } else {
    observeTargetPage();
  }
}

// call main()
main();