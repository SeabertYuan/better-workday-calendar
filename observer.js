// All the codes relating to the observers

// variables
let popupObserver = null;
let windowResizeObserver = null;
let isPopupCurrentlyOpen = false;
let isCurrentlyTargetPage = false;


// ---------------------- Course Tables ----------------------

// check is the table is loaded
function isTablesLoaded() {
  let tables = document.getElementsByTagName("table");
  return !!tables ? tables.length > 1 : false;
}

// wait for the course tables and return it
function waitForTables() {
  return new Promise((resolve) => {
    if (isTablesLoaded()) {
      return resolve(Array.from(document.getElementsByTagName("table")));
    }

    const tableObserver = new MutationObserver(() => {
      if (isTablesLoaded()) {
        resolve(Array.from(document.getElementsByTagName("table")));
        tableObserver.disconnect();
      }
    });
    tableObserver.observe(document.body, { childList: true, subtree: true });
  });
}

// change the table style (to fixed)
async function fixTable() {
  courseTables = await waitForTables();

  for (let courseTable of courseTables) {
    courseTable.style.tableLayout = "fixed";
  }

  addCourseTableStyles();
}


// ---------------------- Window Size ----------------------

// any operation that should be done when the window is resized
function resizeWindow() {
  if (isPopupOpen()) {
    updateCalendar();
    console.log("resized");
  }
}

// open windowResizeObserver
function openWindowResizeObserver() {
  if (!windowResizeObserver) {
    windowResizeObserver = new ResizeObserver(() => {
      console.log('resized');
      resizeWindow();
    })
    windowResizeObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// close windowResizeObserver
function closeWindowResizeObserver() {
  if (windowResizeObserver) {
    windowResizeObserver.disconnect();
    windowResizeObserver = null;
  }
}


// ---------------------- Popup ----------------------

// check if popup exists
function isPopupOpen() {
  return (
    isInTargetPage() && !!document.querySelector(".css-fgks37-HeaderContents")
  );
}

// open popupObserver
function openPopupObserver() {
  if (!popupObserver) {
    popupObserver = new MutationObserver(() => {
      handlePopupStateChange();
    });
    popupObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// close popupObserver
function closePopupObserver() {
  if (popupObserver) {
    popupObserver.disconnect();
    popupObserver = null;
  }
}

// handle the switching state of popup
function handlePopupStateChange() {
  const isOpen = isPopupOpen();
  if (isOpen != isPopupCurrentlyOpen) {
    isPopupCurrentlyOpen = isOpen;
    if (isOpen) {
      // any operation when the popup is opened
      runProgram();
      console.log("popup opened");
    } else {
      // any operation when the popup is closed
      console.log("popup closed");
    }
  }
}

// main popup observer
// observe according to handlePopupStateChange()
function observePopup() {
  isPopupCurrentlyOpen = false;
  handlePopupStateChange(); // initial check
  openPopupObserver(); // mutation check
}


// ---------------------- Target Page ----------------------

// check if we are at the target page (View My Courses)
function isInTargetPage() {
  return window.location.href.includes(
    "wd10.myworkday.com/ubc/d/task/2998$28771",
  );
}

// any operation when we reach the target page
function reachTargetPage() {
  fixTable();
  observePopup();
  openWindowResizeObserver();
  console.log("target page reached");
}

// any operation when we dismiss from the target page
function dismissTargetPage() {
  removeStyles();
  closePopupObserver();
  closeWindowResizeObserver();
  console.log("target page dismissed");
}

// handle the switch between pages
function handleTargetPageStateChange() {
  const isTargetPage = isInTargetPage();
  if (isTargetPage != isCurrentlyTargetPage) {
    isCurrentlyTargetPage = isTargetPage;
    if (isTargetPage) {
      reachTargetPage();
    } else {
      dismissTargetPage();
    }
  }
}


// ---------------------- main observer ----------------------

// main observer
function observer() {
  console.log("program ran");
  isCurrentlyTargetPage = false;
  handleTargetPageStateChange(); // initial check

  // mutation check
  const targetPageObserver = new MutationObserver(() => {
    handleTargetPageStateChange();
  });
  targetPageObserver.observe(document.body, { childList: true, subtree: true });
}