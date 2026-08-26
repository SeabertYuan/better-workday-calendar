(function createWorkdayTermCalendar(global) {
  const API_KEY = "__UBC_WORKDAY_TERM_CALENDAR__";

  // Content scripts can be evaluated more than once when Workday navigates
  // internally. Keep one API and one state object for the whole page.
  if (global[API_KEY]) return;

  const DAY_WIDTH = 100 / 7;
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_ALIASES = new Map([
    ["sun", 0],
    ["sunday", 0],
    ["mon", 1],
    ["monday", 1],
    ["tue", 2],
    ["tues", 2],
    ["tuesday", 2],
    ["wed", 3],
    ["weds", 3],
    ["wednesday", 3],
    ["thu", 4],
    ["thur", 4],
    ["thurs", 4],
    ["thursday", 4],
    ["fri", 5],
    ["friday", 5],
    ["sat", 6],
    ["saturday", 6],
  ]);

  const TABLE_SELECTORS = [
    "table",
    '[role="table"]',
    '[data-automation-id="table"]',
    '[data-testid="table"]',
    ".css-sec5tc",
  ];
  const ROW_SELECTORS = [
    "tr",
    '[role="row"]',
    '[data-automation-id="row"]',
    '[data-testid="row"]',
  ];
  const CELL_SELECTORS = [
    "td",
    "th",
    '[role="cell"]',
    '[role="gridcell"]',
    '[data-automation-id="cell"]',
    '[data-testid="cell"]',
  ];
  const STRUCTURAL_BREAK_TAGS = new Set([
    "ADDRESS",
    "ARTICLE",
    "BR",
    "DIV",
    "LI",
    "OL",
    "P",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
    "TH",
    "THEAD",
    "TR",
    "UL",
  ]);
  const EVENT_SELECTORS = [
    ".WMSC.WKSC.WLTC.WEUC",
    '[data-automation-id="calendarevent"]',
    '[data-automation-id="calendarEvent"]',
    '[data-automation-id="calendar-event"]',
    '[style*="left"]',
  ];
  const SURFACE_SELECTORS = [
    '[role="dialog"]',
    '[aria-modal="true"]',
    '[data-automation-id="popUpDialog"]',
    '[class*="Dialog"]',
    '[class*="Modal"]',
  ];

  const state = {
    activeTerm: 1,
    showWaitlisted: false,
    context: null,
    originalDisplays: new WeakMap(),
    originalPositions: new WeakMap(),
    originalEventAttributes: new WeakMap(),
    lastAppliedStyles: new WeakMap(),
    courseColors: new Map(),
    courseColorSlots: new Map(),
    popover: null,
    started: false,
  };

  function safeQueryAll(root, selector) {
    if (!root || !root.querySelectorAll) return [];
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (_error) {
      return [];
    }
  }

  function unique(elements) {
    return Array.from(
      new Set(
        elements.filter(
          (element) => element !== null && element !== undefined && element !== "",
        ),
      ),
    );
  }

  function matchesAny(element, selectors) {
    if (!element || element.nodeType !== 1) return false;
    return selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (_error) {
        return false;
      }
    });
  }

  function normaliseText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t\r\f]+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();
  }

  function compactKey(value) {
    return normaliseText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function getStructuralText(node) {
    if (!node) return "";
    if (node.nodeType === 3) return node.nodeValue || "";
    if (node.nodeType !== 1) return "";

    const tagName = String(node.tagName || "").toUpperCase();
    if (tagName === "BR") return "\n";
    const text = Array.from(node.childNodes || [])
      .map(getStructuralText)
      .join("");
    return STRUCTURAL_BREAK_TAGS.has(tagName) ? `${text}\n` : text;
  }

  function getText(element) {
    if (!element) return "";
    const values = [
      element.innerText,
      getStructuralText(element),
      element.getAttribute && element.getAttribute("aria-label"),
      element.getAttribute && element.getAttribute("title"),
      element.getAttribute && element.getAttribute("data-automation-label"),
    ]
      .filter(Boolean)
      .map((part) => normaliseText(part))
      .filter(Boolean);
    return values[0] || "";
  }

  function getDirectMatches(parent, selectors) {
    if (!parent || !parent.children) return [];
    return Array.from(parent.children).filter((child) =>
      matchesAny(child, selectors),
    );
  }

  function getRows(table) {
    const directRows = getDirectMatches(table, ROW_SELECTORS);
    if (directRows.length) return directRows;

    const scopedRows = [];
    for (const selector of ROW_SELECTORS) {
      scopedRows.push(...safeQueryAll(table, `:scope > ${selector}`));
      scopedRows.push(...safeQueryAll(table, `:scope > thead > ${selector}`));
      scopedRows.push(...safeQueryAll(table, `:scope > tbody > ${selector}`));
      scopedRows.push(...safeQueryAll(table, `:scope > tfoot > ${selector}`));
    }
    if (scopedRows.length) return unique(scopedRows);

    return unique(safeQueryAll(table, ROW_SELECTORS.join(","))).filter((row) => {
      const ownerTable = row.closest && row.closest("table");
      return !ownerTable || ownerTable === table;
    });
  }

  function getCells(row) {
    const directCells = getDirectMatches(row, CELL_SELECTORS);
    if (directCells.length) return directCells;

    const scopedCells = [];
    for (const selector of CELL_SELECTORS) {
      scopedCells.push(...safeQueryAll(row, `:scope > ${selector}`));
    }
    if (scopedCells.length) return unique(scopedCells);

    const allCells = unique(safeQueryAll(row, CELL_SELECTORS.join(","))).filter(
      (cell) => {
        const ownerRow = cell.closest && cell.closest('tr,[role="row"]');
        return !ownerRow || ownerRow === row;
      },
    );
    if (allCells.length) return allCells;

    // Some Workday table variants use row-like divs without cell roles.
    return Array.from(row.children || []).filter((child) => getText(child));
  }

  function isVisible(element) {
    if (!element || !element.isConnected) return false;
    if (!global.getComputedStyle) return true;
    const style = global.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      style.opacity !== "0"
    );
  }

  function makeDate(year, month, day) {
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function parseDate(value) {
    const text = normaliseText(value);
    if (!text) return null;

    let match = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
    if (match) return makeDate(+match[1], +match[2], +match[3]);

    match = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (match) {
      const first = +match[1];
      const second = +match[2];
      const year = +match[3];
      // Workday commonly uses day/month/year. Resolve unambiguous US-style
      // values as well, while keeping the requested day-first fallback.
      if (first > 12) return makeDate(year, second, first);
      if (second > 12) return makeDate(year, first, second);
      return makeDate(year, second, first);
    }

    match = text.match(/\b(\d{4})[-/](\d{1,2})(?![-/]\d)\b/);
    if (match) return makeDate(+match[1], +match[2], 1);

    match = text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:,)?\s+(\d{4})\b/i,
    );
    if (match) {
      const parsed = new Date(`${match[1]} ${match[2]}, ${match[3]} 12:00:00`);
      return Number.isNaN(parsed.getTime())
        ? null
        : makeDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }

    match = text.match(
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[,\s]+(\d{4})\b/i,
    );
    if (match) {
      const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]} 12:00:00`);
      return Number.isNaN(parsed.getTime())
        ? null
        : makeDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }

    if (!/\b\d{4}\b/.test(text)) return null;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime())
      ? null
      : makeDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  function dateKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function uniqueDates(dates) {
    const seen = new Set();
    return dates
      .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
      .map((date) => {
        const key = dateKey(date);
        return { key, date };
      })
      .filter(({ key }) => {
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(({ date }) => date)
      .sort((left, right) => left - right);
  }

  function extractDates(value) {
    const text = normaliseText(value);
    if (!text) return [];

    const candidates = [];
    const addMatches = (regex) => {
      for (const match of text.matchAll(regex)) {
        const token = match[0];
        const start = match.index || 0;
        const end = start + token.length;
        if (candidates.some((item) => start < item.end && end > item.start)) {
          continue;
        }
        const date = parseDate(token);
        if (date) candidates.push({ start, end, date });
      }
    };

    addMatches(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g);
    addMatches(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g);
    addMatches(/\b\d{4}[-/]\d{1,2}(?![-/]\d)\b/g);
    addMatches(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2}(?:,)?\s+\d{4}\b/gi,
    );
    addMatches(
      /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[,\s]+\d{4}\b/gi,
    );

    return candidates
      .sort((left, right) => left.start - right.start)
      .map((candidate) => candidate.date);
  }

  function parseDayNumbers(value) {
    const days = [];
    const text = normaliseText(value);
    const dayPattern =
      /\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Tues|Wed|Weds|Thu|Thur|Thurs|Fri|Sat)\b/gi;
    for (const match of text.matchAll(dayPattern)) {
      const day = DAY_ALIASES.get(match[1].toLowerCase());
      if (day !== undefined && !days.includes(day)) days.push(day);
    }
    return days;
  }

  function parseClock(value, defaultMeridiem) {
    const text = normaliseText(value).toLowerCase().replace(/\s+/g, "");
    const match = text.match(/^(\d{1,2})(?::(\d{2}))?(a\.?m\.?|p\.?m\.?)?$/);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const meridiem = (match[3] || defaultMeridiem || "").replace(/\./g, "");
    if (hour > 23 || minute > 59) return null;
    if (meridiem === "am" && hour === 12) hour = 0;
    if (meridiem === "pm" && hour < 12) hour += 12;
    return hour * 60 + minute;
  }

  function parseTimeRange(value) {
    const text = normaliseText(value);
    const clock = "(\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)?)";
    const match = text.match(
      new RegExp(`${clock}\\s*(?:-|–|—|to)\\s*${clock}`, "i"),
    );
    if (!match) return null;

    const firstMeridiem = match[1].match(/(a\.?m\.?|p\.?m\.?)\s*$/i)?.[1];
    const secondMeridiem = match[2].match(/(a\.?m\.?|p\.?m\.?)\s*$/i)?.[1];
    const startMinutes = parseClock(match[1], secondMeridiem);
    const endMinutes = parseClock(match[2], firstMeridiem);
    if (startMinutes === null || endMinutes === null) return null;

    return {
      startMinutes,
      endMinutes: endMinutes > startMinutes ? endMinutes : endMinutes + 24 * 60,
    };
  }

  function parseLocationParts(parts) {
    const values = (Array.isArray(parts) ? parts : [])
      .map((part) => normaliseText(part))
      .filter(Boolean);
    const location = {
      campus: "",
      building: "",
      floor: "",
      room: "",
      extras: [],
      label: "",
    };

    if (!values.length) return location;

    if (/^(?:UBCV|UBCO|UBC\s+(?:Vancouver|Okanagan))$/i.test(values[0])) {
      location.campus = values.shift();
    }

    const addExtra = (value) => {
      const text = normaliseText(value);
      if (text && !location.extras.includes(text)) location.extras.push(text);
    };

    for (const value of values) {
      const labelled = value.match(
        /^(building|floor|room)\s*(?::|[-–—])?\s*(.+)$/i,
      );
      if (labelled) {
        const field = labelled[1].toLowerCase();
        const fieldValue = normaliseText(labelled[2]);
        if (!fieldValue) continue;
        if (field === "building" && !location.building) {
          location.building = fieldValue;
        } else if (field === "floor" && !location.floor) {
          location.floor = fieldValue;
        } else if (field === "room" && !location.room) {
          location.room = fieldValue;
        } else {
          addExtra(value);
        }
        continue;
      }

      if (!location.building) location.building = value;
      else addExtra(value);
    }

    location.label = [
      location.building,
      location.floor ? `Floor ${location.floor}` : "",
      location.room ? `Room ${location.room}` : "",
      ...location.extras,
    ]
      .filter(Boolean)
      .join(", ");
    return location;
  }

  function parseMeetingText(value) {
    const text = normaliseText(value);
    if (!text.includes("|")) return null;

    const parts = text.split("|").map((part) => part.trim());
    if (parts.length < 3) return null;
    const dates = extractDates(parts[0]);
    const meetingDays = parseDayNumbers(parts[1]);
    const times = parseTimeRange(parts[2]);
    if (!dates.length || !meetingDays.length || !times) return null;

    return {
      startDate: dates[0],
      endDate: dates[1] || dates[0],
      meetingDays,
      startMinutes: times.startMinutes,
      endMinutes: times.endMinutes,
      location: parseLocationParts(parts.slice(3)),
      text,
    };
  }

  function getMeetingTexts(cells, rowText) {
    const sourceTexts = cells.map(getText).filter(Boolean);
    const candidates = [];
    const hasCellMeeting = sourceTexts.some((source) =>
      source
        .split(/\n+/)
        .some((line) => Boolean(parseMeetingText(line))),
    );
    const sources = hasCellMeeting ? sourceTexts : sourceTexts.concat(rowText);
    for (const source of sources) {
      const lines = source
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      candidates.push(...lines);
    }
    return unique(candidates);
  }

  function explicitTerm(value) {
    const match = normaliseText(value).match(
      /\b(?:term|session|semester)\s*([12])\b/i,
    );
    return match ? Number(match[1]) : null;
  }

  function getTableLabel(table) {
    const values = [
      table && table.caption && getText(table.caption),
      table && table.getAttribute && table.getAttribute("aria-label"),
      table && table.getAttribute && table.getAttribute("data-automation-label"),
      table && table.getAttribute && table.getAttribute("title"),
    ];
    const previous = table && table.previousElementSibling;
    if (previous && /^(H1|H2|H3|H4|LABEL)$/i.test(previous.tagName || "")) {
      values.push(getText(previous));
    }
    return normaliseText(values.filter(Boolean).join(" "));
  }

  function getHeaderRows(table, rows) {
    return rows.filter((row, index) => {
      const tag = row.tagName || "";
      const className = String(row.className || "").toLowerCase();
      const hasHeaderCell =
        !!row.querySelector &&
        !!row.querySelector('th,[role="columnheader"],[role="rowheader"]');
      const inHead = !!row.closest && !!row.closest("thead");
      const looksLikeHeader = /header|column|heading/.test(className);
      const rowText = getText(row);
      const isData = extractDates(rowText).length || parseMeetingText(rowText);
      return (
        tag === "TH" ||
        hasHeaderCell ||
        inHead ||
        looksLikeHeader ||
        (index < 2 && !isData)
      );
    });
  }

  function getHeaderNames(table, rows) {
    const headerRows = getHeaderRows(table, rows);
    const names = [];
    for (const row of headerRows) {
      getCells(row).forEach((cell, index) => {
        const text = getText(cell);
        if (text && (!names[index] || text.length > names[index].length)) {
          names[index] = text;
        }
      });
    }
    return names.map((name) => normaliseText(name || ""));
  }

  function tableScore(table) {
    const rows = getRows(table);
    if (!rows.length) return { score: -Infinity, table, rows };

    const label = getTableLabel(table).toLowerCase();
    const headers = getHeaderNames(table, rows).join(" ").toLowerCase();
    const sampleText = getText(table).slice(0, 16000).toLowerCase();
    const combined = `${label} ${headers} ${sampleText}`;
    const keywords = ["course", "class", "section", "subject", "catalog"];
    const dateRows = rows.filter((row) => extractDates(getText(row)).length);

    let score = 0;
    if (matchesAny(table, [".css-sec5tc"])) score += 8;
    if (/my enrolled courses/.test(label)) score += 14;
    if (/my waitlisted courses|waitlist|waitlisted/.test(label)) score += 14;
    score += keywords.filter((keyword) => combined.includes(keyword)).length * 2;
    if (dateRows.length) score += 7;
    if (combined.includes("term") || combined.includes("session")) score += 2;
    if (isVisible(table)) score += 2;
    return { score, table, rows };
  }

  function findCourseTables() {
    const candidates = [];
    for (const selector of TABLE_SELECTORS) {
      candidates.push(...safeQueryAll(global.document, selector));
    }
    const scored = unique(candidates)
      .map(tableScore)
      .filter((item) => item.score >= 7)
      .sort((left, right) => right.score - left.score);

    if (scored.length) return scored.map((item) => item.table);

    // Keep a conservative fallback for a Workday build that has removed the
    // identifying labels but still has a date-bearing table.
    return unique(candidates)
      .map(tableScore)
      .filter((item) => item.rows.some((row) => extractDates(getText(row)).length))
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map((item) => item.table);
  }

  function courseCodeMatches(value) {
    const text = normaliseText(value);
    const pattern =
      /\b([A-Z][A-Z0-9]{1,7}(?:[_-][A-Z][A-Z0-9]{0,3})?)\s*[_\s-]+(\d{3,5})(?:\s*[-–]\s*([A-Z0-9]*\d[A-Z0-9]*))?\b/gi;
    const matches = [];
    for (const match of text.matchAll(pattern)) {
      const department = match[1].toUpperCase();
      const number = match[2];
      const section = match[3] ? match[3].toUpperCase() : "";
      const displayName = `${department} ${number}`;
      const fullCode = section ? `${displayName}-${section}` : displayName;
      matches.push({
        department,
        number,
        section,
        displayName,
        fullCode,
        index: match.index || 0,
        raw: match[0],
      });
    }
    return matches;
  }

  function stripCourseCode(value, info) {
    const text = normaliseText(value);
    if (!text || !info) return "";
    const escaped = info.fullCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stripped = normaliseText(
      text
        .replace(new RegExp(escaped, "i"), "")
        .replace(/^\s*[-–—:]\s*/, "")
        .replace(/^\s*[-–—:]\s*/, ""),
    );
    const repeatedParts = stripped
      .split(/\s+[-–—:]\s+/)
      .map((part) => normaliseText(part))
      .filter(Boolean);
    if (
      repeatedParts.length === 2 &&
      repeatedParts[0].toLowerCase() === repeatedParts[1].toLowerCase()
    ) {
      return repeatedParts[0];
    }
    return stripped;
  }

  function extractCourseInfo(row, headers) {
    const cells = getCells(row);
    const preferredIndexes = headers
      .map((header, index) =>
        /course|class|subject|catalog/i.test(header) ? index : -1,
      )
      .filter((index) => index >= 0);
    const orderedIndexes = unique(
      preferredIndexes.concat(cells.map((_cell, index) => index)),
    );
    const candidates = orderedIndexes
      .map((index) => getText(cells[index]))
      .filter(Boolean);

    const matches = [];
    for (const candidate of candidates) {
      for (const match of courseCodeMatches(candidate)) {
        matches.push({ ...match, source: candidate });
      }
    }
    matches.sort((left, right) => {
      if (Boolean(left.section) !== Boolean(right.section)) {
        return left.section ? -1 : 1;
      }
      return right.fullCode.length - left.fullCode.length;
    });

    if (matches.length) {
      const match = matches[0];
      const title = stripCourseCode(match.source, match);
      return {
        name: normaliseText(match.source),
        displayName: match.displayName,
        courseId: match.displayName,
        section: match.section,
        fullCode: match.fullCode,
        title,
      };
    }

    const fallback = candidates
      .filter((candidate) => {
        const lower = candidate.toLowerCase();
        return (
          !extractDates(candidate).length &&
          !parseMeetingText(candidate) &&
          !/wait\s*listed|registered|term\s*[12]|session\s*[12]/i.test(lower) &&
          candidate.length >= 3
        );
      })
      .sort((left, right) => {
        const leftLooksLikeName = /[A-Za-z]/.test(left);
        const rightLooksLikeName = /[A-Za-z]/.test(right);
        if (leftLooksLikeName !== rightLooksLikeName) {
          return rightLooksLikeName - leftLooksLikeName;
        }
        return right.length - left.length;
      })[0];

    if (!fallback) return null;
    const displayName = normaliseText(fallback).slice(0, 80);
    return {
      name: normaliseText(fallback),
      displayName,
      courseId: compactKey(displayName) || displayName,
      section: "",
      fullCode: displayName,
      title: "",
    };
  }

  function getColumnText(cells, headers, pattern) {
    const index = headers.findIndex((header) => pattern.test(header));
    return index >= 0 ? getText(cells[index]) : "";
  }

  function buildRecord(row, table, headers) {
    const rowText = getText(row);
    const courseInfo = extractCourseInfo(row, headers);
    if (!courseInfo) return null;

    const cells = getCells(row);
    const credits = getColumnText(cells, headers, /\b(?:credit|credits|unit|units)\b/i);
    const instructor = getColumnText(
      cells,
      headers,
      /\b(?:instructor|teacher|professor)\b/i,
    );
    const meetingTexts = getMeetingTexts(cells, rowText);
    const meetings = unique(meetingTexts)
      .map(parseMeetingText)
      .filter(Boolean);
    const dates = extractDates(rowText);
    const firstMeeting = meetings[0];
    const meetingStartDates = meetings.map((meeting) => meeting.startDate);
    const meetingEndDates = meetings.map(
      (meeting) => meeting.endDate || meeting.startDate,
    );
    const sortedMeetingEndDates = uniqueDates(meetingEndDates);
    const startDate = uniqueDates(meetingStartDates)[0] || dates[0] || null;
    const endDate =
      sortedMeetingEndDates[sortedMeetingEndDates.length - 1] ||
      dates[1] ||
      dates[0] ||
      null;
    const label = getTableLabel(table);
    const registrationStatus = /wait\s*list|waitlisted/i.test(
      `${label} ${rowText}`,
    )
      ? "waitlisted"
      : "registered";
    const tableTerm = explicitTerm(label);
    const rowTerm = explicitTerm(rowText);
    const keys = unique(
      [
        courseInfo.name,
        courseInfo.fullCode,
        courseInfo.displayName,
        courseInfo.courseId,
      ].filter(Boolean),
    ).sort((left, right) => right.length - left.length);

    return {
      name: courseInfo.name,
      courseId: courseInfo.courseId,
      keys,
      compactKeys: unique(keys.map(compactKey).filter(Boolean)).sort(
        (left, right) => right.length - left.length,
      ),
      rowText,
      startDate,
      endDate,
      term: rowTerm || tableTerm || null,
      registrationStatus,
      details: rowText,
      meetingDays: firstMeeting ? firstMeeting.meetingDays : [],
      startMinutes: firstMeeting ? firstMeeting.startMinutes : null,
      endMinutes: firstMeeting ? firstMeeting.endMinutes : null,
      meetings,
      displayName: courseInfo.displayName,
      title: courseInfo.title,
      section: courseInfo.section,
      credits,
      instructor,
      row,
      table,
    };
  }

  function dateBasedTerm(record) {
    const startDate = record && record.startDate;
    const endDate = record && (record.endDate || record.startDate);
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      return null;
    }

    const startMonth = startDate.getMonth() + 1;
    const endMonth =
      endDate instanceof Date && !Number.isNaN(endDate.getTime())
        ? endDate.getMonth() + 1
        : startMonth;
    let term = 0;

    // Preserve Workday's academic-calendar semantics from the original
    // implementation: August/September starts are Term 1, January/April
    // courses are Term 2, and May-August or September-April spans are shown
    // in both terms.
    if ([8, 9, 5].includes(startMonth)) term += 1;
    if ([4, 8].includes(endMonth)) term += 2;
    if (term) return term;

    // Keep a deterministic fallback for date formats that do not line up
    // with the month boundaries above.
    if (startMonth >= 8 || startMonth === 5) return 1;
    if (startMonth <= 4) return 2;
    return null;
  }

  function assignFallbackTerms(records) {
    const explicitByDate = new Map();
    for (const record of records) {
      if (!record.term || !record.startDate) continue;
      const key = dateKey(record.startDate);
      if (key && !explicitByDate.has(key)) explicitByDate.set(key, record.term);
    }

    for (const record of records) {
      if (!record.term && record.startDate) {
        record.term = explicitByDate.get(dateKey(record.startDate)) || null;
      }
    }

    for (const record of records) {
      if (!record.term) record.term = dateBasedTerm(record);
    }

    const dates = uniqueDates(
      records
        .map((record) => record.startDate)
        .filter((date) => date instanceof Date && !Number.isNaN(date.getTime())),
    );

    let splitIndex = -1;
    let largestGap = -1;
    for (let index = 0; index < dates.length - 1; index += 1) {
      const gap = dates[index + 1].getTime() - dates[index].getTime();
      if (gap > largestGap) {
        largestGap = gap;
        splitIndex = index;
      }
    }

    // Only use the relative-date fallback when there is a real semester-sized
    // gap. Courses that start a few days apart are commonly in the same term
    // and must not be split based on their order in the table.
    const hasSemesterGap = largestGap >= 45 * 24 * 60 * 60 * 1000;
    for (const record of records) {
      if (record.term) continue;
      if (!record.startDate || splitIndex < 0 || !hasSemesterGap) {
        record.term = 1;
        continue;
      }
      const position = dates.findIndex(
        (date) => dateKey(date) === dateKey(record.startDate),
      );
      record.term = position > splitIndex ? 2 : 1;
    }
  }

  function getCalendarViewInfo(surface, bindings = []) {
    if (!surface) {
      return { singleDay: false, visibleDates: [], visibleDays: [] };
    }

    const rangeValues = [
      surface.getAttribute &&
        surface.getAttribute("data-automation-visiblerangeinterval"),
      surface.getAttribute &&
        surface.getAttribute("data-automation-visible-range-interval"),
      ...safeQueryAll(
        surface,
        "[data-automation-visiblerangeinterval],[data-automation-visible-range-interval],[data-visiblerangeinterval]",
      ).flatMap((element) => [
        element.getAttribute("data-automation-visiblerangeinterval"),
        element.getAttribute("data-automation-visible-range-interval"),
        element.getAttribute("data-visiblerangeinterval"),
      ]),
    ]
      .filter(Boolean)
      .map((value) => String(value).toUpperCase());

    const headerElements = unique(
      safeQueryAll(
        surface,
        '[role="columnheader"],th,[data-automation-id*="date"],[data-automation-id*="day"],[data-testid*="date"],[data-testid*="day"]',
      ),
    );
    const dateSources = headerElements;
    const headerDayNames = unique(
      dateSources.flatMap((element) => {
        const attributes = [
          element.getAttribute && element.getAttribute("aria-label"),
          element.getAttribute && element.getAttribute("title"),
        ]
          .filter(Boolean)
          .join(" ");
        return parseDayNumbers(`${getText(element)} ${attributes}`);
      }),
    );
    const visibleDates = uniqueDates(
      dateSources.flatMap((element) => {
        const attributes = [
          element.getAttribute && element.getAttribute("data-date"),
          element.getAttribute && element.getAttribute("data-automation-date"),
          element.getAttribute && element.getAttribute("aria-label"),
          element.getAttribute && element.getAttribute("title"),
        ]
          .filter(Boolean)
          .join(" ");
        return extractDates(`${getText(element)} ${attributes}`);
      }),
    );

    const singleDay =
      rangeValues.some((value) => /(?:^|_)1_DAY(?:$|_)/.test(value)) ||
      visibleDates.length === 1 ||
      bindings.some((binding) => {
        const position = state.originalPositions.get(binding.element);
        return position && Number.isFinite(position.widthPercent)
          ? position.widthPercent > DAY_WIDTH * 2
          : false;
      });
    const usefulVisibleDates =
      singleDay || (visibleDates.length >= 5 && visibleDates.length <= 14)
        ? visibleDates
        : [];
    const visibleDays = usefulVisibleDates.length
      ? unique(usefulVisibleDates.map((date) => date.getDay()))
      : singleDay && headerDayNames.length === 1
        ? headerDayNames
        : [];

    return {
      singleDay,
      visibleDates: usefulVisibleDates,
      visibleDays,
    };
  }

  function discoverRecords() {
    const tables = findCourseTables();
    const records = [];
    const seenRows = new WeakSet();
    for (const table of tables) {
      const rows = getRows(table);
      const headers = getHeaderNames(table, rows);
      for (const row of rows) {
        if (seenRows.has(row)) continue;
        seenRows.add(row);
        const rowText = getText(row);
        if (!extractDates(rowText).length && !parseMeetingText(rowText)) continue;
        const record = buildRecord(row, table, headers);
        if (record) records.push(record);
      }
    }
    assignFallbackTerms(records);
    return { tables, records };
  }

  function isCalendarEventCandidate(element) {
    if (!element || element.nodeType !== 1) return false;
    if (
      element.getAttribute("data-workday-term-calendar-generated") === "waitlisted"
    ) {
      return true;
    }
    const inlineStyle = element.getAttribute("style") || "";
    const hasKnownMarker = matchesAny(element, EVENT_SELECTORS.slice(0, 4));
    if (hasKnownMarker) return true;

    const hasHorizontalGeometry = ["left", "width"].every((property) =>
      new RegExp(`(?:^|;)\\s*${property}\\s*:`, "i").test(inlineStyle),
    );
    if (!hasHorizontalGeometry || !getText(element)) return false;
    if (global.getComputedStyle) {
      const computed = global.getComputedStyle(element);
      const position = computed.position;
      if (position !== "absolute" && position !== "relative") return false;
      if (computed.top === "auto" || computed.height === "auto") return false;
    } else if (
      !/(?:^|;)\s*top\s*:/i.test(inlineStyle) ||
      !/(?:^|;)\s*height\s*:/i.test(inlineStyle)
    ) {
      return false;
    }
    return true;
  }

  function findEventCandidates(root, records = null) {
    if (!root) return [];
    const candidates = [];
    for (const selector of EVENT_SELECTORS) {
      candidates.push(...safeQueryAll(root, selector));
    }
    if (
      matchesAny(root, EVENT_SELECTORS.slice(0, 4)) ||
      root.getAttribute?.("data-workday-term-calendar-generated") === "waitlisted"
    ) {
      candidates.push(root);
    }
    return unique(candidates).filter((element) => {
      if (!isCalendarEventCandidate(element)) return false;
      const hasKnownEventMarker = matchesAny(element, EVENT_SELECTORS.slice(0, 4));
      const isGenerated =
        element.getAttribute("data-workday-term-calendar-generated") === "waitlisted";
      if (
        !hasKnownEventMarker &&
        !isGenerated &&
        safeQueryAll(element, '[style*="left"]').some(
          (child) => child !== element && isCalendarEventCandidate(child),
        )
      ) {
        return false;
      }
      // Workday renders the real calendar surface as a table. Only reject
      // style-only candidates inside tables; explicit calendar event markers
      // are valid even when their parent is a table.
      if (element.closest && element.closest("table") && !hasKnownEventMarker && !isGenerated) {
        return false;
      }
      return (
        isVisible(element) ||
        element.getAttribute("data-workday-term-calendar-generated") === "waitlisted" ||
        element.getAttribute("data-workday-term-calendar-event") === "true"
      );
    }).filter((element) => {
      if (!records || !records.length) return true;
      if (
        element.getAttribute("data-workday-term-calendar-generated") === "waitlisted"
      ) {
        return true;
      }
      return Boolean(matchEventToRecord(element, records));
    });
  }

  function hasCloseControl(root) {
    if (!root) return null;
    const controls = safeQueryAll(root, "button,[role=button],[data-automation-id]");
    return (
      controls.find((control) => {
        const label = `${getText(control)} ${
          control.getAttribute("aria-label") || ""
        } ${control.getAttribute("title") || ""} ${
          control.getAttribute("data-automation-id") || ""
        }`.toLowerCase();
        return /close|dismiss|cancel|^×$|^x$/.test(label);
      }) || null
    );
  }

  function findCalendarSurface(records) {
    const candidates = [];
    for (const selector of SURFACE_SELECTORS) {
      candidates.push(...safeQueryAll(global.document, selector));
    }
    const eventCandidates = findEventCandidates(global.document, records);
    const scored = unique(candidates)
      .map((candidate) => {
        const text = getText(candidate).toLowerCase();
        const titleMatch = /view\s+as\s+course\s+calendar/i.test(text);
        const calendarMatch = /calendar|schedule/.test(text);
        const containsEvent = eventCandidates.some((event) =>
          candidate.contains && candidate.contains(event),
        );
        const hasRecords = records.some((record) =>
          record.keys.some((key) => text.includes(key.toLowerCase())),
        );
        let score = 0;
        if (titleMatch) score += 20;
        if (calendarMatch) score += 8;
        if (containsEvent) score += 6;
        if (hasRecords) score += 3;
        if (candidate.getAttribute("role") === "dialog") score += 5;
        if (candidate.getAttribute("aria-modal") === "true") score += 4;
        if (hasCloseControl(candidate)) score += 3;
        if (isVisible(candidate)) score += 2;
        return { candidate, score };
      })
      .filter((item) => item.score >= 10)
      .sort((left, right) => right.score - left.score);

    if (scored.length) return scored[0].candidate;

    const matchingEvent = eventCandidates.find((event) =>
      records.some((record) => matchEventToRecord(event, [record])),
    );
    if (matchingEvent) {
      let current = matchingEvent;
      let fallback = matchingEvent.parentElement;
      while (
        current.parentElement &&
        current.parentElement !== global.document.body
      ) {
        current = current.parentElement;
        const text = getText(current).toLowerCase();
        if (
          /calendar|schedule/.test(text) ||
          current.getAttribute("role") === "dialog" ||
          current.getAttribute("aria-modal") === "true" ||
          /dialog|modal/i.test(String(current.className || ""))
        ) {
          fallback = current;
        }
      }
      return fallback;
    }
    return null;
  }

  function getAccessibleEventText(element) {
    return normaliseText(
      [
        element && element.innerText,
        element && element.textContent,
        element && element.getAttribute("aria-label"),
        element && element.getAttribute("title"),
        element && element.getAttribute("data-automation-label"),
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  function matchEventToRecord(element, records) {
    const text = getAccessibleEventText(element);
    const compactText = compactKey(text);
    let best = null;
    for (const record of records) {
      let score = 0;
      for (const key of record.keys) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
          score = Math.max(score, 100 + key.length);
        }
      }
      for (const key of record.compactKeys) {
        if (key && compactText.includes(key)) {
          score = Math.max(score, 50 + key.length);
        }
      }
      const courseCode = compactKey(record.courseId);
      if (courseCode && compactText.includes(courseCode)) {
        score = Math.max(score, 40 + courseCode.length);
      }
      if (score && (!best || score > best.score)) best = { record, score };
    }
    return best;
  }

  function parentWidth(element) {
    const parent = element && (element.offsetParent || element.parentElement);
    if (!parent) return 0;
    return parent.clientWidth || parent.getBoundingClientRect?.().width || 0;
  }

  function parentHeight(element) {
    const parent = element && (element.offsetParent || element.parentElement);
    if (!parent) return 0;
    return parent.clientHeight || parent.getBoundingClientRect?.().height || 0;
  }

  function cssNumber(value, reference) {
    if (value === undefined || value === null || value === "") return null;
    const number = Number.parseFloat(value);
    if (Number.isNaN(number)) return null;
    if (String(value).includes("%") && reference) return (number / 100) * reference;
    return number;
  }

  function positionFor(element) {
    const style = global.getComputedStyle ? global.getComputedStyle(element) : null;
    const inline = {
      left: element.style.left || "",
      width: element.style.width || "",
      top: element.style.top || "",
      height: element.style.height || "",
    };
    const computed = {
      left: element.style.left || style?.left || "",
      width: element.style.width || style?.width || "",
      top: element.style.top || style?.top || "",
      height: element.style.height || style?.height || "",
    };
    const width = parentWidth(element);
    const height = parentHeight(element);
    const leftPixels = cssNumber(computed.left, width);
    const widthPixels = cssNumber(computed.width, width);
    const topPixels = cssNumber(computed.top, height);
    const heightPixels = cssNumber(computed.height, height);
    return {
      inline,
      leftPercent:
        computed.left.includes("%")
          ? Number.parseFloat(computed.left)
          : width && leftPixels !== null
            ? (leftPixels / width) * 100
            : null,
      widthPercent:
        computed.width.includes("%")
          ? Number.parseFloat(computed.width)
          : width && widthPixels !== null
            ? (widthPixels / width) * 100
            : null,
      topPixels,
      heightPixels,
    };
  }

  function inlineStyleSnapshot(element) {
    return {
      display: element.style.display || "",
      left: element.style.left || "",
      width: element.style.width || "",
      top: element.style.top || "",
      height: element.style.height || "",
    };
  }

  function sameInlineStyle(left, right) {
    return Boolean(
      left &&
        right &&
        ["display", "left", "width", "top", "height"].every(
          (property) => left[property] === right[property],
        ),
    );
  }

  function rememberElement(element, generated = false) {
    if (!state.originalDisplays.has(element)) {
      state.originalDisplays.set(element, generated ? "" : element.style.display || "");
    }

    const currentStyles = inlineStyleSnapshot(element);
    const lastApplied = state.lastAppliedStyles.get(element);
    const savedPosition = state.originalPositions.get(element);
    let position = positionFor(element);
    if (!generated && lastApplied && savedPosition && !sameInlineStyle(currentStyles, lastApplied)) {
      const temporarilyRestored = [];
      for (const property of ["left", "width"]) {
        if (currentStyles[property] !== lastApplied[property]) continue;
        temporarilyRestored.push({ property, value: element.style[property] });
        element.style[property] = savedPosition.inline[property];
      }
      position = positionFor(element);
      for (const { property, value } of temporarilyRestored) {
        element.style[property] = value;
      }
    }

    if (
      generated ||
      !state.originalPositions.has(element) ||
      (lastApplied && !sameInlineStyle(currentStyles, lastApplied))
    ) {
      state.originalPositions.set(element, position);
      if (!generated) state.originalDisplays.set(element, currentStyles.display);
    }

    if (!generated && !state.originalEventAttributes.has(element)) {
      state.originalEventAttributes.set(element, {
        title: element.getAttribute("title"),
        tabIndex: element.getAttribute("tabindex"),
        marker: element.getAttribute("data-workday-term-calendar-event"),
        status: element.getAttribute("data-workday-registration-status"),
        courseId: element.getAttribute("data-workday-course-id"),
        courseColor: element.style.getPropertyValue("--workday-course-color"),
        managedClass: element.classList.contains("ubc-workday-managed-event"),
      });
    }
  }

  function getEventHost(surface, nativeEvents) {
    const nativeEvent = nativeEvents.find((event) => event && event.parentElement);
    if (nativeEvent) {
      return nativeEvent.offsetParent || nativeEvent.parentElement;
    }
    const grid = safeQueryAll(
      surface,
      '[role="grid"],[role="presentation"],[class*="Calendar"],[class*="calendar"]',
    ).find((element) => isVisible(element));
    return grid || surface;
  }

  function getCalendarDay(position) {
    if (!position || !Number.isFinite(position.leftPercent)) return null;
    const left = position.leftPercent;
    const width = position.widthPercent;
    if (Number.isFinite(width) && width > DAY_WIDTH * 2) return null;
    if (Number.isFinite(width) && Math.abs(width - DAY_WIDTH) <= 1.5) {
      return Math.max(0, Math.min(6, Math.round(left / DAY_WIDTH)));
    }
    return Math.max(0, Math.min(6, Math.floor(left / DAY_WIDTH + 0.01)));
  }

  function getNativeMeetingCandidates(binding, viewInfo) {
    const record = binding && binding.record;
    const meetings = Array.isArray(record && record.meetings)
      ? record.meetings
      : [];
    if (!meetings.length) return [];

    const position = state.originalPositions.get(binding.element);
    let day = getCalendarDay(position);
    if (
      day === null &&
      viewInfo?.singleDay &&
      viewInfo.visibleDays &&
      viewInfo.visibleDays.length === 1
    ) {
      day = viewInfo.visibleDays[0];
    }
    if (day === null) return meetings;

    const dayMeetings = meetings.filter((meeting) =>
      (meeting.meetingDays || []).includes(day),
    );
    return dayMeetings.length ? dayMeetings : meetings;
  }

  function selectNativeMeeting(binding, viewInfo) {
    const candidates = getNativeMeetingCandidates(binding, viewInfo);
    if (candidates.length <= 1) return candidates[0] || null;

    const position = state.originalPositions.get(binding.element);
    const top = position && position.topPixels;
    const height = position && position.heightPixels;
    const scored = candidates.map((meeting, index) => {
      const duration = meeting.endMinutes - meeting.startMinutes;
      const topScale =
        Number.isFinite(top) && meeting.startMinutes > 0
          ? top / meeting.startMinutes
          : null;
      const heightScale =
        Number.isFinite(height) && duration > 0 ? height / duration : null;
      let score = index;
      if (topScale !== null && heightScale !== null) {
        score = Math.abs(topScale - heightScale);
      } else if (topScale !== null) {
        score = topScale;
      } else if (heightScale !== null) {
        score = heightScale;
      }
      return { meeting, score };
    });
    scored.sort((left, right) => left.score - right.score);
    return scored[0].meeting;
  }

  function calculateTimeScale(nativeEvents, viewInfo) {
    const ratios = [];
    for (const binding of nativeEvents) {
      const record = binding.record;
      const position = state.originalPositions.get(binding.element);
      if (!record || !position) continue;

      const meeting = selectNativeMeeting(binding, viewInfo);
      const startMinutes = meeting?.startMinutes ?? record.startMinutes;
      const duration = meeting
        ? meeting.endMinutes - meeting.startMinutes
        : record.endMinutes - record.startMinutes;
      let ratio = null;
      if (
        Number.isFinite(position.topPixels) &&
        Number.isFinite(startMinutes) &&
        startMinutes > 0
      ) {
        ratio = position.topPixels / startMinutes;
      } else if (
        Number.isFinite(position.heightPixels) &&
        Number.isFinite(duration) &&
        duration > 0
      ) {
        ratio = position.heightPixels / duration;
      }
      if (ratio > 0 && Number.isFinite(ratio)) ratios.push(ratio);
    }
    if (!ratios.length) return 0.8;
    ratios.sort((left, right) => left - right);
    const middle = Math.floor(ratios.length / 2);
    const median =
      ratios.length % 2
        ? ratios[middle]
        : (ratios[middle - 1] + ratios[middle]) / 2;
    return Math.min(Math.max(median, 0.1), 10);
  }

  function generatedEventKey(record, meeting, day) {
    return [
      compactKey(record.name || record.courseId),
      record.term || "",
      day,
      meeting.startMinutes,
      meeting.endMinutes,
    ].join("|");
  }

  function syncGeneratedEvents(surface, records, nativeBindings) {
    if (!surface) return;
    const existing = new Map();
    for (const element of safeQueryAll(
      surface,
      '[data-workday-term-calendar-generated="waitlisted"]',
    )) {
      const key = element.getAttribute("data-workday-generated-key");
      if (existing.has(key)) {
        element.remove();
      } else {
        existing.set(key, element);
      }
    }

    const desired = new Set();
    const waitlisted = records.filter(
      (record) => record.registrationStatus === "waitlisted",
    );
    const nativeWaitlistedRecords = new Set(
      nativeBindings
        .filter((binding) => binding.record.registrationStatus === "waitlisted")
        .map((binding) => binding.record),
    );
    const viewInfo = getCalendarViewInfo(surface, nativeBindings);
    const timeScale = calculateTimeScale(nativeBindings, viewInfo);
    const host = getEventHost(surface, nativeBindings.map((item) => item.element));

    for (const record of waitlisted) {
      if (nativeWaitlistedRecords.has(record)) continue;
      const meetings = record.meetings.length
        ? record.meetings
        : record.meetingDays.length &&
            Number.isFinite(record.startMinutes) &&
            Number.isFinite(record.endMinutes)
          ? [
              {
                startDate: record.startDate,
                endDate: record.endDate || record.startDate,
                meetingDays: record.meetingDays,
                startMinutes: record.startMinutes,
                endMinutes: record.endMinutes,
              },
            ]
          : [];
      for (const meeting of meetings) {
        for (const day of meeting.meetingDays || []) {
          if (viewInfo.singleDay) {
            if (viewInfo.visibleDays.length && !viewInfo.visibleDays.includes(day)) {
              continue;
            }
            if (!viewInfo.visibleDays.length && meeting.meetingDays.length !== 1) {
              continue;
            }
          }
          const hasMeetingDates =
            meeting.startDate instanceof Date &&
            !Number.isNaN(meeting.startDate.getTime());
          if (
            viewInfo.visibleDates.length &&
            hasMeetingDates &&
            !viewInfo.visibleDates.some(
              (date) =>
                date.getDay() === day &&
                date >= meeting.startDate &&
                date <= (meeting.endDate || meeting.startDate),
            )
          ) {
            continue;
          }
          const key = generatedEventKey(record, meeting, day);
          desired.add(key);
          let element = existing.get(key);
          const duration = Math.max(
            30,
            (meeting.endMinutes - meeting.startMinutes) * timeScale,
          );
          if (!element) {
            element = global.document.createElement("div");
            element.setAttribute(
              "data-workday-term-calendar-generated",
              "waitlisted",
            );
            element.setAttribute("data-workday-generated-key", key);
            element.style.position = "absolute";
            if (host) host.appendChild(element);
            existing.set(key, element);
          }
          element.setAttribute("data-workday-generated-details", record.details || "");
          element.style.left = `${day * DAY_WIDTH}%`;
          element.style.width = `${DAY_WIDTH}%`;
          element.style.top = `${meeting.startMinutes * timeScale}px`;
          element.style.height = `${duration}px`;
          element.style.boxSizing = "border-box";
          rememberElement(element, true);
        }
      }
    }

    for (const [key, element] of existing) {
      if (!desired.has(key)) {
        element.remove();
      }
    }
  }

  function collapseDuplicateBindings(bindings) {
    const priority = (element) => {
      if (
        element.getAttribute("data-workday-term-calendar-generated") === "waitlisted"
      ) {
        return 100;
      }
      if (
        element.hasAttribute("data-automation-id") ||
        matchesAny(element, [".WMSC.WKSC.WLTC.WEUC"])
      ) {
        return 20;
      }
      return 1;
    };
    const seenGeometry = new Set();
    const ordered = [...bindings].sort(
      (left, right) => priority(right.element) - priority(left.element),
    );
    return ordered.filter((binding) => {
      const position = state.originalPositions.get(binding.element);
      const recordKey = compactKey(
        binding.record.fullCode || binding.record.name || binding.record.courseId,
      );
      const geometryKey = position
        ? [
            recordKey,
            position.leftPercent,
            position.widthPercent,
            position.topPixels,
            position.heightPixels,
          ].join("|")
        : "";
      if (geometryKey && seenGeometry.has(geometryKey)) return false;
      if (geometryKey) seenGeometry.add(geometryKey);

      return !bindings.some((other) => {
        if (binding === other || binding.record !== other.record) return false;
        const bindingElement = binding.element;
        const otherElement = other.element;
        if (!otherElement.contains(bindingElement)) return false;
        if (priority(otherElement) > priority(bindingElement)) return true;
        return (
          priority(otherElement) === priority(bindingElement) &&
          otherElement !== bindingElement
        );
      });
    });
  }

  function discover() {
    const { tables, records } = discoverRecords();
    const surface = findCalendarSurface(records);
    if (!surface) {
      const context = { tables, records, surface: null, events: [] };
      state.context = context;
      return context;
    }

    const nativeCandidates = findEventCandidates(surface, records).filter(
      (element) =>
        element.getAttribute("data-workday-term-calendar-generated") !== "waitlisted",
    );
    const nativeBindings = [];
    for (const element of nativeCandidates) {
      const match = matchEventToRecord(element, records);
      if (!match) continue;
      rememberElement(element);
      nativeBindings.push({ element, record: match.record, generated: false });
    }

    syncGeneratedEvents(surface, records, nativeBindings);
    const generatedRecords = new Map(
      records.flatMap((record) => {
        const meetings = record.meetings.length ? record.meetings : [];
        return meetings.flatMap((meeting) =>
          (meeting.meetingDays || []).map((day) => [
            generatedEventKey(record, meeting, day),
            record,
          ]),
        );
      }),
    );
    const bindings = [];
    for (const element of findEventCandidates(surface, records)) {
      const generatedKey = element.getAttribute("data-workday-generated-key");
      const record = generatedKey
        ? generatedRecords.get(generatedKey)
        : matchEventToRecord(element, records)?.record;
      if (!record) continue;
      if (generatedKey) rememberElement(element, true);
      else rememberElement(element);
      bindings.push({
        element,
        record,
        generated: Boolean(generatedKey),
      });
    }

    const context = {
      tables,
      records,
      surface,
      events: collapseDuplicateBindings(bindings),
      nativeEvents: nativeBindings,
    };
    state.context = context;
    return context;
  }

  global[API_KEY] = {
    API_KEY,
    DAY_WIDTH,
    DAY_NAMES,
    state,
    discover,
    findCalendarSurface,
    findEventCandidates,
    parseDate,
    parseTimeRange,
    parseDayNumbers,
    parseLocationParts,
    getCalendarViewInfo,
  };
})(globalThis);
