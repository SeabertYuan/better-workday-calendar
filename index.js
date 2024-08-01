// initialize variables (wait for the course tables and course elements
// to show up then initialize them)
function initializeVariables() {
  TERM = 0; // 0-none, 1-term 1, 2-term 2, 3-full year
  courseElements = Array.from(
    document.querySelectorAll(".WMSC.WKSC.WLTC.WEUC"),
  );
}

async function fixTable() {
  await waitForTables();
  courseTables = document.getElementsByTagName("table");

  for (let courseTable of courseTables) {
    courseTable.style.tableLayout = "fixed";
  }
  let rule =
    ".WLMM.WKMM { justify-content: center; flex-direction: column; } .WOMY.WKMY.WKMY .WDVM, .WOMY.WKMY.WKMY .WGVM, .WOMY.WKMY.WKMY .WLSM, .WOMY.WKMY.WKMY .WMSM, .WOMY.WKMY.WKMY .WEVM, .WOMY.WKMY.WKMY .WHVM, .WOMY.WKMY.WKMY .WOSM, .WOMY.WKMY.WKMY .WNSM { min-width: 70px; padding: 0 12px;} .WDHN { min-width: 70px } .WJMM { margin: 0; } .WLMM > .WJMM { padding: 0; }";
  let styleElement = document.createElement("style");
  styleElement.id = "course-table-styles";
  styleElement.appendChild(document.createTextNode(rule));
  document.head.appendChild(styleElement);
}

function isTablesLoaded() {
  let tables = document.getElementsByTagName("table");
  return !!tables ? tables.length > 1 : false;
}

// run the main program
// initialize variables -> add buttons -> update calendar -> add styles
function runProgram() {
  initializeVariables();
  addFilterButtons();
  createExportButton();
  updateCalendar();
  addStyles();
}

function waitForTables() {
  return new Promise((resolve) => {
    if (isTablesLoaded()) {
      return resolve();
    }

    const observer = new MutationObserver(() => {
      if (isTablesLoaded()) {
        observer.disconnect();
        resolve();
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
  return (
    isTargetPage() && !!document.querySelector(".css-fgks37-HeaderContents")
  );
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
// the popup to close and call this function reccursively
async function observePopup() {
  await waitForPopup();
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
  return window.location.href.includes(
    "wd10.myworkday.com/ubc/d/task/2998$28771",
  );
}

// observe the current path we are at
// if we are at the target page: start observing the popup
// if we are not at the target page: wait until we reach there
function observeTargetPage() {
  console.log("program ran");
  if (isTargetPage()) {
    fixTable();
    observePopup();
    observeCloseTargetPage();
  } else {
    const targetPageObserver = new MutationObserver(() => {
      if (isTargetPage()) {
        fixTable();
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
      removeStyles("toolbar-button-styles");
      removeStyles("course-table-styles");
      observeTargetPage();
      targetPageCloseObserver.disconnect();
      popupObserver.disconnect();
      popupObserver = null;
    }
  });
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
