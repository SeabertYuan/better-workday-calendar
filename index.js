// initialize variables (wait for the course tables and course elements
// to show up then initialize them)
async function initializeVariables() {
  TERM = 0;
  //courseTables = await waitForElement(".css-sec5tc");
  courseTables = await waitForElement(".css-y9nazf");
  console.log(courseTables[0].rows.length)
  courseElements = await waitForElement(".WMSC.WKSC.WLTC.WEUC");
}

// wait for an element (selector) to be loaded and then return it
function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(Array.from(document.querySelectorAll(selector)));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(Array.from(document.querySelectorAll(selector)));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// If the popup exists (the header element that only exists in the
// popup is used as a detector)
function isPopupOpen() {
  return !!document.querySelector(".css-fgks37-HeaderContents");
}

// Wait for the popup to show up
function waitForPopup() {
  return new Promise((resolve) => {
    if (isPopupOpen()) {
      resolve();
    } else {
      const popupObserver = new MutationObserver(() => {
        if (isPopupOpen()) {
          popupObserver.disconnect();
          resolve();
        }
      });
      popupObserver.observe(document.body, { childList: true, subtree: true });
    }
  });
}

// run the main program
// initialize variables -> add buttons -> update calendar -> add styles
async function runProgram() {
  await initializeVariables()
  addFilterButtons();
  console.log("added filter buttons");
  //let term1_button = document.querySelectorAll(".term-filter-button")[0];
  //updateButtonStyles(term1_button);
  updateCalendar();
  addStyles();
}

// popup observer
// if there is no popup: wait for it to appear
// if there is a pop: run the program and wait for
// the popup to close and call this funciton reccursively
async function observePopup() {
  await waitForPopup()
  console.log("popup detected");
  runProgram();

  const closeObserver = new MutationObserver(() => {
    if (!isPopupOpen()) {
      closeObserver.disconnect();
      observePopup();
    }
  });
  closeObserver.observe(document.body, { childList: true, subtree: true });
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
  } else {
    const targetPageObserver = new MutationObserver(() => {
      if (isTargetPage()) {
        observePopup();
        targetPageObserver.disconnect();
      }
    });
    targetPageObserver.observe(document, { childList: true, subtree: true });
  }
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