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

    const tableObserver = new MutationObserver(() => {
      if (isTablesLoaded()) {
        tableObserver.disconnect();
        resolve();
      }
    });

    tableObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}



// If all the DOM content are loaded, start observing the target page
function main() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observer);
  } else {
    observer();
  }
}

// call main()
main();
