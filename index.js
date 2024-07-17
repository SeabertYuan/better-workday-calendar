// initialize variables (wait for the course tables and course elements
// to show up then initialize them)
async function initializeVariables() {
  TERM = 1;
  courseTables = Array.from(await waitForElement(".css-sec5tc"));
  courseelements = Array.from(await waitForElement(".WMSC.WKSC.WLTC.WEUC"));
}

// wait for an element (selector) to be loaded and then return it
function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelectorAll(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelectorAll(selector));
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
      const observer = new MutationObserver(() => {
        if (isPopupOpen()) {
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

// run the main program
// initialize variables -> add buttons -> update calendar -> add styles
function runProgram() {
  initializeVariables()
    .then(() => {
      addFilterButtons();
      let term1_button = document.querySelectorAll(".term-filter-button")[0];
      updateButtonStyles(term1_button);
      updateCalendar();
      addStyles();
    })
    .catch((error) => {
      console.error("Error initializing variables: ", error);
    });
}

// popup observer
// if there is no popup, wait for it to appear
// if there is a pop, run the program and wait for
// the popup to close and call this funciton reccursively
function observePopup() {
  waitForPopup().then(() => {
    runProgram();

    const closeObserver = new MutationObserver(() => {
      if (!isPopupOpen()) {
        closeObserver.disconnect();
        observePopup();
      }
    });
    closeObserver.observe(document.body, { childList: true, subtree: true });
  });
}

// start observing the popup
function main() {
  observePopup();
}

// run main when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

