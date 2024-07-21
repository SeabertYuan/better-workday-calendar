// Exporting js object as ical

example_ical = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AmonzonSeabert/better-workday-calendar//EN
BEGIN:VEVENT
UID:MATH226-101-20240721-115400@ubc.ca
DTSTAMP:20240721T120000Z
DTSTART:20240904T120000Z
DTEND:20240904T130000Z
RRULE:FREQ=WEEKLY;UNTIL= 20241206T235959Z
SUMMARY:MATH226-101
LOCATION:CHBE-Floor 1-Room 102
END:VEVENT
END:VCALENDAR
`

function downloadICalFile() {
  const iCalContent = example_ical;
  const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const headerContents = document.querySelector(".css-fgks37-HeaderContents");
  if (!headerContents) return;

  const existingDivs = headerContents.children;
  if (existingDivs.length < 3) return;
  
  const link = document.createElement('a');
  link.innerText = "Download";
  link.href = url;
  link.setAttribute('download', 'test_MATH226.ics');
  headerContents.insertBefore(link, existingDivs[1]);
  link.addEventListener("click", () => {
    headerContents.removeChild(link);
  });
}

