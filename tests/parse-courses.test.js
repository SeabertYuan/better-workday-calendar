const {
  getActualStartDate,
  getActualEndDate,
  getDayOfWeek,
  getStartDay,
  getEndDay,
  getDaysOfWeek,
  handleExceptionalDays,
  getTimeSection,
  isAm,
  parseTime,
} = require("../src/parse-courses");

test("tests getActualStartDate gets the actual start date on day after start date", () => {
  expect(getActualStartDate("2024-09-07", "Mon")).toBe("2024-09-09");
});

test("tests getActualStartDate gets the actual start date on 6 days after date", () => {
  expect(getActualStartDate("2024-09-03", "Mon")).toBe("2024-09-09");
});

test("tests getActualStartDate gets the actual start date on date", () => {
  expect(getActualStartDate("2024-09-03", "Tue")).toBe("2024-09-03");
});

test("tests getActualEndDate gets the actual end date on day or before end date", () => {
  expect(getActualEndDate("2024-09-07", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on 1 day before end date", () => {
  expect(getActualEndDate("2024-09-03", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on end date", () => {
  expect(getActualEndDate("2024-09-05", "Thu")).toBe("2024-09-05");
});

//-------------- getDayOfWeek ---------------

// recent date
test("tests getDayOfWeek when 2024-09-09 (Monday)", () => {
  expect(getDayOfWeek(2024, 9, 9)).toBe(1);
});

// beginning of century
test("tests getDayOfWeek when 2000-1-1 (Saturday)", () => {
  expect(getDayOfWeek(2000, 1, 1)).toBe(6);
});

// end of century
test("tests getDayOfWeek when 2004-12-31 (Friday)", () => {
  expect(getDayOfWeek(1999, 12, 31)).toBe(5);
});

// leap year Feb 29
test("tests getDayOfWeek when 2024-02-29 (Thursday)", () => {
  expect(getDayOfWeek(2024, 2, 29)).toBe(4);
});

//-------------- getStartDay ---------------
test("tests getStartDay on MATH226", () => {
  const block = "2024-09-03 - 2024-12-06 | Mon Wed Fri | 11:00 a.m. - 12:00 p.m. | CHBE-Floor 1-Room 102";
  expect(getStartDay(block)).toBe("2024-09-03");
});

test("tests getStartDay on CS213 lab (Friday)", () => {
  const block = "2024-09-06 - 2024-12-06 | Fri | 3:00 p.m. - 5:00 p.m. | ICCS-Floor 2-Room X251";
  expect(getStartDay(block)).toBe("2024-09-06");
});

//-------------- getEndDay ---------------
test("tests getEndDay on MATH226", () => {
  const block = "2024-09-03 - 2024-12-06 | Mon Wed Fri | 11:00 a.m. - 12:00 p.m. | CHBE-Floor 1-Room 102";
  expect(getEndDay(block)).toBe("2024-12-06");
});

test("tests getEndDay on CS213 lab (Friday)", () => {
  const block = "2024-09-06 - 2024-12-06 | Fri | 3:00 p.m. - 5:00 p.m. | ICCS-Floor 2-Room X251";
  expect(getEndDay(block)).toBe("2024-12-06");
});

//-------------- getDaysOfWeek ---------------
test("tests getDaysOfWeek on MATH226", () => {
  const block = "2024-09-03 - 2024-12-06 | Mon Wed Fri | 11:00 a.m. - 12:00 p.m. | CHBE-Floor 1-Room 102";
  const expected = ["Mon", "Wed", "Fri"];
  const result = getDaysOfWeek(block);
  expect(result.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(result[i]).toBe(expected[i]);
  }
});

test("tests getDaysOfWeek on CS213 lab (Friday)", () => {
  const block = "2024-09-06 - 2024-12-06 | Fri | 3:00 p.m. - 5:00 p.m. | ICCS-Floor 2-Room X251";
  const expected = ["Fri"];
  const result = getDaysOfWeek(block);
  expect(result.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(result[i]).toBe(expected[i]);
  }
});

//-------------- handleExceptionalDays ---------------
test("tests handleExceptionalDays when not exceptional", () => {
  const input = ["Mon", "Wed", "Fri"];
  const expected = ["Mon", "Wed", "Fri"];
  const result = handleExceptionalDays(input);
  expect(result.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(result[i]).toBe(expected[i]);
  }
});

test("tests handleExceptionalDays when exceptional, multiple days", () => {
  const input = ["Mon", "Wed (Alternative)", "Fri"];
  const expected = ["Mon", "Fri"];
  const result = handleExceptionalDays(input);
  expect(result.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(result[i]).toBe(expected[i]);
  }
});

test("tests handleExceptionalDays when exceptional, single day", () => {
  const input = ["Wed (Alternative)"];
  const expected = [];
  const result = handleExceptionalDays(input);
  expect(result.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(result[i]).toBe(expected[i]);
  }
});

//-------------- getTimeSection ---------------
test("tests getTimeSection on Math226", () => {
  const block = "2024-09-06 - 2024-12-06 | Fri | 3:00 p.m. - 5:00 p.m. | ICCS-Floor 2-Room X251";
  expect(getTimeSection(block)).toBe("3:00 p.m. - 5:00 p.m.");
});

test("tests getTimeSection on CS213 lab (Friday)", () => {
  const block = "2024-09-06 - 2024-12-06 | Fri | 3:00 p.m. - 5:00 p.m. | ICCS-Floor 2-Room X251";
  expect(getTimeSection(block)).toBe("3:00 p.m. - 5:00 p.m.");
});

//-------------- isAm ---------------
test("tests isAm on 3:00 p.m.", () => {
  expect(isAm("3:00 p.m.")).toBe(false);
});

test("tests isAm on 12:00 a.m.", () => {
  expect(isAm("12:00 a.m.")).toBe(true);
});