const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const { getCourseName } = require("../src/parse-courses");

test("tests getCourseName gets the course name", () => {
  //!!! need to add an example HTML case
  const filePath = path.resolve(__dirname, "testPage.html");
  const htmlContent = fs.readFileSync(filePath, "utf8");

  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  let courseTables = document.getElementsByTagName("table");
  let courseRow = courseTables[0].rows[3];
  console.log(courseRow);

  expect(getCourseName(courseRow)).toBe("CPSC_V 213-101");
});
