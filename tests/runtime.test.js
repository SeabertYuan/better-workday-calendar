const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const indexSource = fs.readFileSync(
  path.resolve(__dirname, "../src/index.js"),
  "utf8",
);
const drawingSource = fs.readFileSync(
  path.resolve(__dirname, "../src/draw-calendar.js"),
  "utf8",
);
const exportSource = fs.readFileSync(
  path.resolve(__dirname, "../src/export-calendar.js"),
  "utf8",
);

function courseTable(rows) {
  return courseTableWithCaption("My Enrolled Courses", rows);
}

function courseTableWithCaption(caption, rows) {
  return `
    <table>
      <caption>${caption}</caption>
      <thead><tr><th>Course</th><th>Meetings</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function courseRow(code, meeting) {
  return `<tr><td>${code}</td><td>${meeting}</td></tr>`;
}

function courseRowWithMeetings(code, meetings) {
  return `<tr><td>${code}</td>${meetings
    .map((meeting) => `<td>${meeting}</td>`)
    .join("")}</tr>`;
}

function courseRowWithMeetingList(code, meetings) {
  return `<tr><td>${code}</td><td><div><ul>${meetings
    .map((meeting) => `<li><div>${meeting}</div></li>`)
    .join("")}</ul></div></td></tr>`;
}

function calendarPopup(event, attributes = "") {
  return `
    <div role="dialog" aria-modal="true">
      <div class="css-fgks37-HeaderContents">
        <span>View as Course Calendar</span>
        <button aria-label="Close"></button>
      </div>
      <div role="grid" ${attributes}>${event}</div>
    </div>
  `;
}

function loadRuntime(html, includeExport = false) {
  const dom = new JSDOM(html, {
    url: "https://wd10.myworkday.com/ubc/d/task/2998$28771.htmld",
    runScripts: "outside-only",
  });
  dom.window.eval(indexSource);
  dom.window.eval(drawingSource);
  if (includeExport) dom.window.eval(exportSource);
  return {
    dom,
    api: dom.window.__UBC_WORKDAY_TERM_CALENDAR__,
  };
}

test("classifies full-year courses into both terms", () => {
  const event =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:14.2857%;top:100px;height:50px;position:absolute"><span>CPSC_V 400-101 - Full Year Course</span></div>';
  const { api } = loadRuntime(
    courseTable([
      courseRow(
        "CPSC_V 400-101 - Full Year Course",
        "2026-09-08 - 2027-04-08 | Tue Thu | 10:00 a.m. - 11:00 a.m. | Room 1",
      ),
    ]) + calendarPopup(event),
  );
  const context = api.discover();

  expect(context.records[0].term).toBe(3);
  api.state.context = context;
  api.applyTerm(2);
  expect(context.events[0].element.style.display).not.toBe("none");
});

test("does not split courses from one term based on table order", () => {
  const rows = [6, 13, 20].map((day, index) =>
    courseRow(
      `CPSC_V ${400 + index}-101 - Course ${index}`,
      `2027-01-${day} - 2027-04-08 | Wed | 10:00 a.m. - 11:00 a.m. | Room ${index}`,
    ),
  );
  const { api } = loadRuntime(courseTable(rows));
  const records = api.discover().records;

  expect(records).toHaveLength(3);
  expect(records.every((record) => record.term === 2)).toBe(true);
});

test("keeps events full width in a one-day calendar view", () => {
  const event =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:100%;top:100px;height:50px;position:absolute"><span>CPSC_V 400-101 - One Day Course</span></div>';
  const { api } = loadRuntime(
    courseTable([
      courseRow(
        "CPSC_V 400-101 - One Day Course",
        "2026-09-08 - 2026-12-08 | Tue | 10:00 a.m. - 11:00 a.m. | Room 1",
      ),
    ]) + calendarPopup(event, 'data-automation-visiblerangeinterval="WEEK_1_DAY"'),
  );
  const context = api.discover();
  api.state.context = context;
  api.applyTerm(1);

  expect(context.events[0].element.style.left).toBe("0%");
  expect(context.events[0].element.style.width).toBe("100%");
});

test("does not treat back-to-back events with pixel drift as conflicts", () => {
  const events = `
    <div class="WMSC WKSC WLTC WEUC" style="left:28.5714%;width:14.2857%;top:400px;height:106px;position:absolute"><span>CPSC_V 400-101 - 4pm Course</span></div>
    <div class="WMSC WKSC WLTC WEUC" style="left:28.5714%;width:14.2857%;top:499px;height:150px;position:absolute"><span>CPSC_V 401-101 - 5pm Course</span></div>
  `;
  const { api } = loadRuntime(
    courseTable([
      courseRow(
        "CPSC_V 400-101 - 4pm Course",
        "2026-09-08 - 2026-12-08 | Tue | 4:00 p.m. - 5:00 p.m. | Room 1",
      ),
      courseRow(
        "CPSC_V 401-101 - 5pm Course",
        "2026-09-08 - 2026-12-08 | Tue | 5:00 p.m. - 6:30 p.m. | Room 2",
      ),
    ]) + calendarPopup(events),
  );
  const context = api.discover();
  api.state.context = context;
  api.applyTerm(1);

  expect(context.events).toHaveLength(2);
  expect(
    context.events.map((binding) => binding.element.style.width),
  ).toEqual([`${api.DAY_WIDTH}%`, `${api.DAY_WIDTH}%`]);
});

test("keeps adjacent events in the same column when geometry has pixel drift", () => {
  const registeredCourse = "CPSC_V 406 - Computational Course";
  const waitlistedCourse = "MATH_V 302 - Waitlisted Course";
  const registeredMeetings = [
    "2026-09-07 - 2026-12-07 | Mon Wed Fri | 12:00 p.m. - 1:00 p.m. | Room 1",
    "2026-09-07 - 2026-12-07 | Tue | 2:00 p.m. - 3:00 p.m. | Room 2",
  ];
  const waitlistedMeetings = [
    "2026-09-07 - 2026-12-07 | Mon Wed Fri | 11:00 a.m. - 12:00 p.m. | Room 3",
    "2026-09-07 - 2026-12-07 | Tue | 2:00 p.m. - 3:00 p.m. | Room 4",
  ];
  const nativeEvent =
    '<div class="WMSC WKSC WLTC WEUC" style="left:14.2857%;width:14.2857%;top:721px;height:60px;position:absolute"><span>CPSC_V 406 - Computational</span></div>';
  const { api } = loadRuntime(
    courseTableWithCaption("My Enrolled Courses", [
      courseRowWithMeetings(registeredCourse, registeredMeetings),
    ]) +
      courseTableWithCaption("My Waitlisted Courses", [
        courseRowWithMeetings(waitlistedCourse, waitlistedMeetings),
      ]) +
      calendarPopup(nativeEvent),
  );
  const context = api.discover();
  api.state.context = context;
  api.setShowWaitlisted(true);

  const registeredBinding = context.events.find(
    (binding) => binding.record.registrationStatus === "registered",
  );
  expect(registeredBinding.element.style.left).toBe(`${api.DAY_WIDTH}%`);
  expect(registeredBinding.element.style.width).toBe(`${api.DAY_WIDTH}%`);
});

test("scales waitlisted events using the matching meeting pattern", () => {
  const { api } = loadRuntime(
    courseTableWithCaption("My Enrolled Courses", [
      courseRowWithMeetings("CPSC_V 406 - Registered", [
        "2026-09-07 - 2026-12-07 | Mon | 10:00 a.m. - 11:00 a.m. | Room 1",
        "2026-09-08 - 2026-12-08 | Tue | 2:00 p.m. - 3:00 p.m. | Room 2",
      ]),
    ]) +
      courseTableWithCaption("My Waitlisted Courses", [
        courseRowWithMeetings("MATH_V 302 - Waitlisted", [
          "2026-09-07 - 2026-12-07 | Mon | 11:00 a.m. - 12:00 p.m. | Room 3",
          "2026-09-08 - 2026-12-08 | Tue | 4:00 p.m. - 5:00 p.m. | Room 4",
        ]),
      ]) +
      calendarPopup(
        '<div class="WMSC WKSC WLTC WEUC" style="left:28.5714%;width:14.2857%;top:840px;height:60px;position:absolute"><span>CPSC_V 406 - Registered</span></div>',
      ),
  );
  const context = api.discover();
  const generated = context.events.filter((binding) => binding.generated);

  expect(generated).toHaveLength(2);
  expect(generated.map((binding) => binding.element.style.top)).toEqual([
    "660px",
    "960px",
  ]);
  expect(generated.map((binding) => binding.element.style.height)).toEqual([
    "60px",
    "60px",
  ]);
});

test("filters synthesized waitlisted events to the visible day and time grid", () => {
  const registeredEvent =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:14.2857%;top:600px;height:60px;position:absolute"><span>CPSC_V 400-101 - Registered</span></div>';
  const { api } = loadRuntime(
    courseTable([
      courseRow(
        "CPSC_V 400-101 - Registered",
        "2026-09-08 - 2026-12-08 | Tue | 10:00 a.m. - 11:00 a.m. | Room 1",
      ),
    ]) +
      courseTableWithCaption("My Waitlisted Courses", [
        courseRow(
          "CPSC_V 401-101 - Waitlisted",
          "2026-08-01 - 2026-12-08 | Tue | 11:00 a.m. - 12:00 p.m. | Room 2",
        ),
        courseRow(
          "CPSC_V 402-101 - Waitlisted Wednesday",
          "2026-08-01 - 2026-12-08 | Wed | 11:00 a.m. - 12:00 p.m. | Room 3",
        ),
      ]) +
      calendarPopup(
        '<div role="columnheader">August 25, 2026</div>' + registeredEvent,
        'data-automation-visiblerangeinterval="WEEK_1_DAY"',
      ),
  );
  const context = api.discover();
  const generated = context.events.filter((binding) => binding.generated);

  expect(generated).toHaveLength(1);
  expect(generated[0].record.name).toContain("401-101");
  expect(generated[0].element.style.top).toBe("660px");
  expect(generated[0].element.style.height).toBe("60px");
});

test("keeps up to twenty course colours unique and stable", () => {
  const courses = Array.from({ length: 20 }, (_value, index) => ({
    code: `CPSC_V ${400 + index}-101`,
    meeting: "2026-09-08 - 2026-12-08 | Tue | 10:00 a.m. - 11:00 a.m. | Room 1",
  }));
  const renderColors = (orderedCourses) => {
    const events = orderedCourses
      .map(
        (course, index) =>
          `<div class="WMSC WKSC WLTC WEUC" style="left:${
            (index % 7) * (100 / 7)
          }%;width:14.2857%;top:${index * 60}px;height:50px;position:absolute"><span>${
            course.code
          } - Course</span></div>`,
      )
      .join("");
    const { api } = loadRuntime(
      courseTable(
        orderedCourses.map((course) =>
          courseRow(`${course.code} - Course`, course.meeting),
        ),
      ) + calendarPopup(events),
    );
    const context = api.discover();
    api.state.context = context;
    api.applyTerm(1);
    return new Map(
      context.events.map((binding) => [
        binding.record.courseId,
        binding.element.style.getPropertyValue("--workday-course-color"),
      ]),
    );
  };

  const firstAssignments = renderColors(courses);
  expect(firstAssignments.size).toBe(20);
  expect(new Set(firstAssignments.values()).size).toBe(20);
  expect(renderColors([...courses].reverse())).toEqual(firstAssignments);
});

test("places controls when events are found through style-only fallback", () => {
  const genericPopup = `
    <div role="dialog" aria-modal="true">
      <div class="css-fgks37-HeaderContents">
        <span>View as Course Calendar</span>
        <button aria-label="Close"></button>
      </div>
      <div class="generic-calendar-container">
        <div style="position:absolute;left:28%;width:14%;top:100px;height:50px">
          <span>CPSC_V 400-101 - Course</span>
        </div>
      </div>
    </div>
  `;
  const { api } = loadRuntime(
    courseTable([
      courseRow(
        "CPSC_V 400-101 - Course",
        "2026-09-08 - 2026-12-08 | Tue | 10:00 a.m. - 11:00 a.m. | Room 1",
      ),
    ]) + genericPopup,
  );
  const context = api.discover();
  api.state.context = context;

  expect(api.addFilterButtons(context)).not.toBeNull();
  expect(
    context.surface.querySelector('[data-workday-term-calendar-toolbar="true"]'),
  ).not.toBeNull();
});

test("parses the campus, building, floor, and room from meeting locations", () => {
  const meeting =
    "2026-09-09 - 2026-12-07 | Mon Wed Fri | 10:00 a.m. - 11:00 a.m. | UBCV | Civil and Mechanical Engineering Building (CEME) | Floor: 1 | Room: 1202";
  const { api } = loadRuntime(
    courseTable([courseRow("CPSC_V 400-101 - Course", meeting)]),
  );
  const record = api.discover().records[0];

  expect(record.meetings[0].location).toEqual({
    campus: "UBCV",
    building: "Civil and Mechanical Engineering Building (CEME)",
    floor: "1",
    room: "1202",
    extras: [],
    label: "Civil and Mechanical Engineering Building (CEME), Floor 1, Room 1202",
  });
});

test("renders structured meeting locations in the popup and ICS export", () => {
  const meeting =
    "2026-09-09 - 2026-12-07 | Mon Wed Fri | 10:00 a.m. - 11:00 a.m. | UBCV | Civil and Mechanical Engineering Building (CEME) | Floor: 1 | Room: 1202";
  const event =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:14.2857%;top:600px;height:60px;position:absolute"><span>CPSC_V 400-101 - Course</span></div>';
  const { dom, api } = loadRuntime(
    courseTable([courseRow("CPSC_V 400-101 - Course", meeting)]) +
      calendarPopup(event),
    true,
  );
  const context = api.discover();
  api.state.context = context;
  api.applyTerm(1);

  context.events[0].element.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );

  const locationCard = dom.window.document.querySelector(
    ".ubc-workday-detail-popover-location",
  );
  expect(locationCard).not.toBeNull();
  expect(
    locationCard.parentElement.nextElementSibling.classList.contains(
      "ubc-workday-detail-popover-meetings",
    ),
  ).toBe(true);
  expect(
    locationCard.querySelector(
      ".ubc-workday-detail-popover-location-building",
    ).textContent,
  ).toBe("Civil and Mechanical Engineering Building (CEME)");
  expect(
    locationCard.querySelector(
      ".ubc-workday-detail-popover-location-details",
    ).textContent,
  ).toBe("Floor 1 · Room 1202");
  expect(
    locationCard.querySelector(
      ".ubc-workday-detail-popover-location-campus",
    ).textContent,
  ).toBe("UBCV");
  const dateLine = dom.window.document.querySelector(
    ".ubc-workday-detail-popover-meeting-date",
  );
  expect(dateLine.textContent.match(/2026/g)).toHaveLength(1);

  const locations = dom
    .window.createCalendarString()
    .match(/^LOCATION:[^\r\n]*/gm);
  expect(locations).toEqual([
    "LOCATION:Civil and Mechanical Engineering Building (CEME)\\, Floor 1\\, Room 1202",
    "LOCATION:Civil and Mechanical Engineering Building (CEME)\\, Floor 1\\, Room 1202",
    "LOCATION:Civil and Mechanical Engineering Building (CEME)\\, Floor 1\\, Room 1202",
  ]);
});

test("omits unavailable location fields and keeps legacy location text", () => {
  const { api } = loadRuntime(
    courseTable([
      courseRow(
        "CPSC_V 400-101 - Building Only",
        "2026-09-09 - 2026-12-07 | Wed | 10:00 a.m. - 11:00 a.m. | UBCV | Buchanan Tower",
      ),
      courseRow(
        "CPSC_V 401-101 - Legacy Room",
        "2026-09-09 - 2026-12-07 | Wed | 11:00 a.m. - 12:00 p.m. | Room 1",
      ),
    ]),
  );
  const records = api.discover().records;

  expect(records[0].meetings[0].location).toMatchObject({
    campus: "UBCV",
    building: "Buchanan Tower",
    floor: "",
    room: "",
    label: "Buchanan Tower",
  });
  expect(records[1].meetings[0].location).toMatchObject({
    building: "",
    floor: "",
    room: "1",
    label: "Room 1",
  });
});

test("merges adjacent date ranges with the same schedule and location", () => {
  const meetings = [
    "2027-01-05 - 2027-02-11 | Tue Thu | 11:00 a.m. - 12:30 p.m. | UBCV | Buchanan Building (BUCH) | Floor: 1 | Room: A102",
    "2027-02-23 - 2027-04-08 | Tue Thu | 11:00 a.m. - 12:30 p.m. | UBCV | Buchanan Building (BUCH) | Floor: 1 | Room: A102",
  ];
  const event =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:14.2857%;top:600px;height:60px;position:absolute"><span>MATH_V 307-202 - Applied Linear Algebra</span></div>';
  const { dom, api } = loadRuntime(
    courseTable([
      courseRowWithMeetingList(
        "MATH_V 307-202 - Applied Linear Algebra",
        meetings,
      ),
    ]) + calendarPopup(event),
  );
  const context = api.discover();
  api.state.context = context;
  api.applyTerm(2);
  context.events[0].element.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );

  const popup = dom.window.document.querySelector(
    ".ubc-workday-detail-popover",
  );
  expect(popup.querySelectorAll(".ubc-workday-detail-popover-location")).toHaveLength(1);
  expect(
    popup.querySelectorAll(
      ".ubc-workday-detail-popover-meeting-schedule",
    ),
  ).toHaveLength(1);
  expect(
    popup.querySelectorAll(
      ".ubc-workday-detail-popover-meeting-date",
    ),
  ).toHaveLength(1);
  const dateText = popup.querySelector(
    ".ubc-workday-detail-popover-meeting-date",
  ).textContent;
  expect(dateText).toContain("·");
  expect(dateText.match(/2027/g)).toHaveLength(1);
  expect(
    popup.querySelector(
      ".ubc-workday-detail-popover-meeting-date-ranges-header",
    ),
  ).toBeNull();
  expect(
    popup.querySelectorAll(".ubc-workday-detail-popover-day-strip"),
  ).toHaveLength(1);
  expect(
    popup.querySelectorAll(".ubc-workday-detail-popover-day"),
  ).toHaveLength(7);
  expect(
    popup.querySelectorAll(".ubc-workday-detail-popover-day.is-active"),
  ).toHaveLength(2);
  const dayStrip = popup.querySelector(
    ".ubc-workday-detail-popover-day-strip",
  );
  const timeLine = popup.querySelector(
    ".ubc-workday-detail-popover-meeting-time",
  );
  expect(dayStrip.parentElement).toBe(timeLine.parentElement);
  expect(dayStrip.nextElementSibling).toBe(timeLine);
  expect(
    popup.querySelectorAll(".ubc-workday-detail-popover-meeting-time"),
  ).toHaveLength(1);
});

test("keeps non-contiguous or changed schedules as separate location groups", () => {
  const meetings = [
    "2027-01-05 - 2027-01-29 | Tue Thu | 11:00 a.m. - 12:30 p.m. | UBCV | Buchanan Building (BUCH) | Floor: 1 | Room: A102",
    "2027-02-02 - 2027-02-26 | Tue Thu | 11:00 a.m. - 12:30 p.m. | UBCV | Civil and Mechanical Engineering Building (CEME) | Floor: 1 | Room: 1202",
    "2027-03-02 - 2027-04-08 | Tue Thu | 11:00 a.m. - 12:30 p.m. | UBCV | Buchanan Building (BUCH) | Floor: 1 | Room: A102",
  ];
  const event =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:14.2857%;top:600px;height:60px;position:absolute"><span>MATH_V 307-202 - Applied Linear Algebra</span></div>';
  const { dom, api } = loadRuntime(
    courseTable([
      courseRowWithMeetingList(
        "MATH_V 307-202 - Applied Linear Algebra",
        meetings,
      ),
    ]) + calendarPopup(event),
  );
  const context = api.discover();
  api.state.context = context;
  api.applyTerm(2);
  context.events[0].element.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );

  const popup = dom.window.document.querySelector(
    ".ubc-workday-detail-popover",
  );
  expect(
    Array.from(
      popup.querySelectorAll(
        ".ubc-workday-detail-popover-location-building",
      ),
    ).map((building) => building.textContent),
  ).toEqual([
    "Buchanan Building (BUCH)",
    "Civil and Mechanical Engineering Building (CEME)",
    "Buchanan Building (BUCH)",
  ]);
  expect(
    popup.querySelectorAll(
      ".ubc-workday-detail-popover-meeting-schedule",
    ),
  ).toHaveLength(3);
});

test("shares one location across separate time schedules", () => {
  const meetings = [
    "2027-01-05 - 2027-02-11 | Tue Thu | 11:00 a.m. - 12:30 p.m. | UBCV | Buchanan Building (BUCH) | Floor: 1 | Room: A102",
    "2027-02-23 - 2027-04-08 | Tue Thu | 1:00 p.m. - 2:30 p.m. | UBCV | Buchanan Building (BUCH) | Floor: 1 | Room: A102",
  ];
  const event =
    '<div class="WMSC WKSC WLTC WEUC" style="left:0%;width:14.2857%;top:600px;height:60px;position:absolute"><span>MATH_V 307-202 - Applied Linear Algebra</span></div>';
  const { dom, api } = loadRuntime(
    courseTable([
      courseRowWithMeetingList(
        "MATH_V 307-202 - Applied Linear Algebra",
        meetings,
      ),
    ]) + calendarPopup(event),
  );
  const context = api.discover();
  api.state.context = context;
  api.applyTerm(2);
  context.events[0].element.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );

  const popup = dom.window.document.querySelector(
    ".ubc-workday-detail-popover",
  );
  expect(popup.querySelectorAll(".ubc-workday-detail-popover-location")).toHaveLength(1);
  expect(
    popup.querySelectorAll(
      ".ubc-workday-detail-popover-meeting-schedule",
    ),
  ).toHaveLength(2);
  expect(
    popup.querySelectorAll(".ubc-workday-detail-popover-meeting-time"),
  ).toHaveLength(2);
});

test("does not export hidden waitlisted courses by default", () => {
  const { dom, api } = loadRuntime("<body></body>", true);
  const date = (year, month, day) => new dom.window.Date(year, month, day, 12);
  api.state.context = {
    records: [
      {
        name: "CPSC_V 400-101 - Registered Course",
        registrationStatus: "registered",
        meetings: [
          {
            startDate: date(2026, 8, 8),
            endDate: date(2026, 11, 8),
            meetingDays: [2],
            startMinutes: 600,
            endMinutes: 660,
            text: "2026-09-08 - 2026-12-08 | Tue | 10:00 a.m. - 11:00 a.m. | Room 1",
          },
        ],
      },
      {
        name: "CPSC_V 401-101 - Waitlisted Course",
        registrationStatus: "waitlisted",
        meetings: [
          {
            startDate: date(2026, 8, 8),
            endDate: date(2026, 11, 8),
            meetingDays: [2],
            startMinutes: 660,
            endMinutes: 720,
            text: "2026-09-08 - 2026-12-08 | Tue | 11:00 a.m. - 12:00 p.m. | Room 2",
          },
        ],
      },
    ],
  };

  api.state.showWaitlisted = false;
  let calendar = dom.window.createCalendarString();
  expect(calendar).toContain("Registered Course");
  expect(calendar).not.toContain("Waitlisted Course");

  api.state.showWaitlisted = true;
  calendar = dom.window.createCalendarString();
  expect(calendar).toContain("Waitlisted Course");
});
