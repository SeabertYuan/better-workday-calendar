# Better Workday Calendar

An extension that fixes overlapping course terms in the calendar view.

## Usage

As of 07.15.24, this project is a set of scripts that should be run in your browser's inspect elements console.

1. Paste the contents of `index.js` into the console
2. Paste the contents of `draw-calendar.js` into the console
3. Profit.

To change terms, type `TERM = x` where `x` is the desired term number. Then run `filterCourses()` and finally `draw()` in the console.

## Todo

- [ ] Turn it into an extension!
