// All the codes relating to the observers

// variables
let popupObserver = null;
let windowResizeObserver = null;
let viewportObserver = null;
let dayOfWeekObserver = null;

let isPopupCurrentlyOpen = false;
let isCurrentlyTargetPage = false;
let isCurrentlySmallViewport = false;


// ---------------------- Window Size ----------------------

// any operation that should be done when the window is resized
function resizeWindow() {
  if (isPopupOpen()) {
    updateCalendar();
  }
}

// open windowResizeObserver
function openWindowResizeObserver() {
  if (!windowResizeObserver) {
    windowResizeObserver = new ResizeObserver(() => {
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


// ---------------------- Small Viewport ----------------------

// check small/large viewport
function isInSmallViewport() {
  const calendar = document.getElementById("wd-Calendar-6$40849");
  if (!calendar) {
    console.log("No calendar element found");
    return;
  }
  return calendar.getAttribute("data-automation-visiblerangeinterval") === "WEEK_1_DAY";
}

// handle the switching state viewport
function handleViewportState() {
  const isSmallViewport = isInSmallViewport();
  if (isSmallViewport != isCurrentlySmallViewport) {
    isCurrentlySmallViewport = isSmallViewport;
    if (isSmallViewport) {
      // any operation when changed to small viewport
      addDayOfWeekEventListener();
      console.log("small viewport");
    } else {
      // any operation when changed to large viewport
      console.log("large viewport");
    }
  }
}

// open viewportObserver
function openViewportObserver() {
  if (!viewportObserver) {
    viewportObserver = new MutationObserver(() => {
      handleViewportState();
    });
    viewportObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// close viewportObserver
function closeViewportObserver() {
  if (viewportObserver) {
    viewportObserver.disconnect();
    viewportObserver = null;
  }
}

// main popup observer
// observe according to handlePopupStateChange()
function observeViewport() {
  isCurrentlySmallViewport = false;
  handleViewportState(); // initial check
  openViewportObserver(); // mutation check
}


// ---------------------- Popup ----------------------

// check if popup exists
function isPopupOpen() {
  return (
    isInTargetPage() && !!document.querySelector(".css-fgks37-HeaderContents")
  );
}

// handle the switching state of popup
function handlePopupState() {
  const isOpen = isPopupOpen();
  if (isOpen != isPopupCurrentlyOpen) {
    isPopupCurrentlyOpen = isOpen;
    if (isOpen) {
      // any operation when the popup is opened
      runProgram();
      observeViewport();
      console.log("popup opened");
    } else {
      // any operation when the popup is closed
      closeViewportObserver();
      console.log("popup closed");
    }
  }
}

// open popupObserver
function openPopupObserver() {
  if (!popupObserver) {
    popupObserver = new MutationObserver(() => {
      handlePopupState();
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

// main popup observer
// observe according to handlePopupStateChange()
function observePopup() {
  isPopupCurrentlyOpen = false;
  handlePopupState(); // initial check
  openPopupObserver(); // mutation check
}


// ---------------------- Target Page ----------------------

// check if we are at the target page (View My Courses)
function isInTargetPage() {
  const targetUrls = [
    "wd10.myworkday.com/ubc/d/task/2998$28771",
    "wd10.myworkday.com/ubc/d/inst/1$37/10089$157357"
  ];

  return targetUrls.some(url => window.location.href.includes(url));
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
function handleTargetPageState() {
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
  handleTargetPageState(); // initial check

  // mutation check
  const targetPageObserver = new MutationObserver(() => {
    handleTargetPageState();
  });
  targetPageObserver.observe(document.body, { childList: true, subtree: true });
}


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

  // ↓Code to solve the course table cut-off issue. Commented out for now.

  //for (let courseTable of courseTables) {
  //  courseTable.style.tableLayout = "fixed";
  //}
  //
  //addCourseTableStyles();
}