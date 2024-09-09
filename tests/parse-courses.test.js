const { getActualStartDate } = require("../src/parse-courses");

test("tests getActualStartDate gets the actual start date on day after start date", () => {
  expect(getActualStartDate("2024-09-07", "Mon")).toBe("2024-09-09");
});

test("tests getActualStartDate gets the actual start date on 6 days after date", () => {
  expect(getActualStartDate("2024-09-03", "Mon")).toBe("2024-09-09");
});
