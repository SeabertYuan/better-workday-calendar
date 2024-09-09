const { getActualStartDate } = require("../src/parse-courses");

test("tests getActualStartDate gets the actual start date on day after start date", () => {
  expect(getActualStartDate("2024-09-07", "Mon")).toBe("2024-09-09");
});

test("tests getActualStartDate gets the actual start date on 6 days after date", () => {
  expect(getActualStartDate("2024-09-03", "Mon")).toBe("2024-09-09");
});

test("tests getActualStartDate gets the actual start date on date", () => {
  expect(getActualStartDate("2024-09-03", "Tue")).toBe("2024-09-03");
});

test("tests getActualEndDate gets the actual end date on day after end date", () => {
  expect(getActualEndDate("2024-09-07", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on 6 days end date", () => {
  expect(getActualEndDate("2024-09-03", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on end date", () => {
  expect(getActualEndDate("2024-09-05", "Thu")).toBe("2024-09-05");
});

test("tests getActualStartDate gets the actual start date on date", () => {
  expect(getActualStartDate("2024-09-03", "Tue")).toBe("2024-09-03");
});

test("tests getActualEndDate gets the actual end date on day after end date", () => {
  expect(getActualEndDate("2024-09-07", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on 6 days end date", () => {
  expect(getActualEndDate("2024-09-03", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on end date", () => {
  expect(getActualEndDate("2024-09-05", "Thu")).toBe("2024-09-05");
});

//-------------- getDayOfWeek ---------------

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