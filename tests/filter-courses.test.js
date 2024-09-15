const {
  doTablesExist,
  calculateCourseTerm,
  addCourseIfTermMatches,
} = require("../src/filter-courses");

//-------------- doTablesExist ---------------
test("tests doTablesExist with more than 1 tables", () => {
  const tables = ["course_table1", "course_table2", "waitlist_table"];
  expect(doTablesExist(tables)).toBe(true);
});

test("tests doTablesExist with 1 table", () => {
  const tables = ["course_table1"];
  expect(doTablesExist(tables)).toBe(false);
});

test("tests doTablesExist with no table (null)", () => {
  const tables = null;
  expect(doTablesExist(tables)).toBe(false);
});

//-------------- calculateCourseTerm ---------------
test("tests calculateCourseTerm (normal winter term 1)", () => {
  expect(calculateCourseTerm(9, 12)).toBe(1);
});

test("tests calculateCourseTerm (early-start winter term 1)", () => {
  expect(calculateCourseTerm(8, 12)).toBe(1);
});

test("tests calculateCourseTerm (normal winter term 2)", () => {
  expect(calculateCourseTerm(1, 4)).toBe(2);
});

test("tests calculateCourseTerm (normal full-year course)", () => {
  expect(calculateCourseTerm(9, 4)).toBe(3);
});

test("tests calculateCourseTerm (early-start full-year course)", () => {
  expect(calculateCourseTerm(8, 4)).toBe(3);
});

test("tests calculateCourseTerm (normal summer term 1)", () => {
  expect(calculateCourseTerm(5, 6)).toBe(1);
});

test("tests calculateCourseTerm (normal summer term 2)", () => {
  expect(calculateCourseTerm(7, 8)).toBe(2);
});

test("tests calculateCourseTerm (normal full-summer course)", () => {
  expect(calculateCourseTerm(5, 8)).toBe(3);
});

//-------------- addCourseIfTermMatches ---------------
test("tests addCourseIfTermMatches when TERM = 0, elementterm = 1", () => {
  const TERM = 0;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(1, "Math_V 226", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(1);
  expect(setOfCoursesToShow.has("Math_V 226")).toBe(true);
});

test("tests addCourseIfTermMatches when TERM = 0, elementterm = 2", () => {
  const TERM = 0;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(2, "Math_V 226", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(1);
  expect(setOfCoursesToShow.has("Math_V 226")).toBe(true);
});

test("tests addCourseIfTermMatches when TERM = 1, elementterm = 1", () => {
  const TERM = 1;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(1, "CPSC_V 213", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(1);
  expect(setOfCoursesToShow.has("CPSC_V 213")).toBe(true);
});

test("tests addCourseIfTermMatches when TERM = 1, elementterm = 2", () => {
  const TERM = 1;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(2, "CPSC_V 213", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(0);
});

test("tests addCourseIfTermMatches when TERM = 1, elementterm = 3", () => {
  const TERM = 1;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(3, "CPSC_V 213", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(1);
  expect(setOfCoursesToShow.has("CPSC_V 213")).toBe(true);
});

test("tests addCourseIfTermMatches when TERM = 2, elementterm = 1", () => {
  const TERM = 2;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(1, "Math_V 226", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(0);
});

test("tests addCourseIfTermMatches when TERM = 2, elementterm = 3", () => {
  const TERM = 2;
  const setOfCoursesToShow = new Set();
  addCourseIfTermMatches(3, "Math_V 226", TERM, setOfCoursesToShow);
  expect(setOfCoursesToShow.size).toBe(1);
  expect(setOfCoursesToShow.has("Math_V 226")).toBe(true);
});