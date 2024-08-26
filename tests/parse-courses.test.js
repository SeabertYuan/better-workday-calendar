test("tests getCourseName gets the course name", () => {
  //!!! need to add an example HTML case
  // let courseRow = fetch('testPage.html').idk get the tables;
  expect(getCourseName(courseRow)).toBe("CPSC_V 213-101");
});
