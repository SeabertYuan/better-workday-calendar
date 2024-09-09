const {
  getActualStartDate,
  getActualEndDate,
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

test("tests getActualEndDate gets the actual end date on day after end date", () => {
  expect(getActualEndDate("2024-09-07", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on 6 days end date", () => {
  expect(getActualEndDate("2024-09-03", "Mon")).toBe("2024-09-02");
});

test("tests getActualEndDate gets the actual end date on end date", () => {
  expect(getActualEndDate("2024-09-05", "Thu")).toBe("2024-09-05");
});
