function initializeVariables() {
  TERM = 1;
  return Promise.all([
    waitForElement('.css-sec5tc'),
    waitForElement('.WMSC.WKSC.WLTC.WEUC')
  ]).then(([courseTablesElement, courseElementsCollection]) => {
    courseTables = Array.from(courseTablesElement);
    courseElements = Array.from(courseElementsCollection);
  });
}

function waitForElement(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelectorAll(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelectorAll(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function isPopupOpen() {
  return !!document.querySelector('.css-fgks37-HeaderContents');
}

function waitForPopup() {
  return new Promise(resolve => {
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

function runProgram() {
  initializeVariables().then(() => {
    if (courseTables.length == 0 || courseElements.length == 0) {
      console.error("Course elements not found.");
      return;
    }
    addFilterButtons();
    console.log("added buttons");
    let term1_button = document.querySelectorAll(".term-filter-button")[0];
    if (term1_button) {
      updateButtonStyles(term1_button);
    }
    TERM = 1;
    updateCalendar();
    addStyles();
  }).catch(error => {
    console.error("Error initializing variables: ", error);
  });
}

function observePopup() {
  waitForPopup().then(() => {
    runProgram();

    const closeObserver = new MutationObserver(() => {
      if (!isPopupOpen()) {
        closeObserver.disconnect();
        observePopup();
        console.log("closed");
      }
    });
    closeObserver.observe(document.body, { childList: true, subtree: true });
  });
}

function main() {
  observePopup();
}

// Run main when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}