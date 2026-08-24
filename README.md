# Better Workday Calendar

A lightweight, fast, and private browser extension that fixes and improves various features on the course calendar view on UBC workday. We hope people submit issues and feedback to keep this project alive as long as possible!

<details>
<summary><b> Details </b></summary>

This extension assigns courses to Term 1 or Term 2 from their Workday course data and adds controls for switching terms.

Waitlisted courses are hidden by default and can be shown separately. Courses receive stable colours, overlapping events use recalculated widths, and clicking an event opens readable course details.

The existing calendar export is available as an iCalendar (`.ics`) download.

</details>

## Usage

This extension is available on [Google Chrome](https://chromewebstore.google.com/detail/better-workday-calendar/ebgddfhinidlemocaclojkiadpknpoia) and [Firefox](https://addons.mozilla.org/en-CA/firefox/addon/better-workday-calendar/).

The extension applies to the **View as Course Calendar** popup opened from **View My Courses**. It adds Term 1 / Term 2 filters, a waitlisted-course toggle, course details, and calendar export without changing other Workday pages.

## What's next?

It's tough to keep track of what to do so we've made a list.

#### Bug fixes:

- [ ] Code optimization
- [ ] Unit testing
- [ ] Fixing Workday bugs when viewport becomes sufficiently small
- [x] Bug where buttons show up on wrong popup
- [x] Hiding waitlisted courses
- [x] Bug fixes related to reopening the calendar popup
- [x] Compatibility with small viewports

#### Features:

- [x] Course colour coding
- [x] Ability to export calendar
- [x] Support for summer sessions
- [x] Support full-year courses
- [x] Turn it into an extension!
