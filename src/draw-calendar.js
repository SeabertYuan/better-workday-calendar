(function installWorkdayTermCalendarDrawing(global) {
  const API = global.__UBC_WORKDAY_TERM_CALENDAR__;
  if (!API || API.__drawingInstalled) return;
  API.__drawingInstalled = true;

  const STYLE_ID = "ubc-workday-term-calendar-styles";
  const TOOLBAR_SELECTOR = '[data-workday-term-calendar-toolbar="true"]';
  const EXPORT_ROW_SELECTOR = '[data-workday-term-calendar-export-row="true"]';
  const TITLEBAR_SELECTOR = '[data-workday-term-calendar-titlebar="true"]';
  const EVENT_SELECTOR = '[data-workday-term-calendar-event="true"]';
  const DAY_WIDTH = API.DAY_WIDTH;
  const PALETTE = [
    "#A8C7FA",
    "#F3B6C2",
    "#B7D9B1",
    "#F4D39A",
    "#C9B8E8",
    "#9FD4D0",
    "#F2B98F",
    "#B7C6D9",
    "#D6C58E",
    "#C4B3A5",
    "#AFC8B8",
    "#D7B7D9",
  ];

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

  function addStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head && document.head.appendChild(style);
    }
    if (!style) return;
    style.textContent = `
      ${TITLEBAR_SELECTOR} {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
      }

      ${TOOLBAR_SELECTOR} {
        display: flex;
        justify-content: flex-end;
        flex-wrap: nowrap;
        flex: 0 1 auto;
        min-width: 0;
        width: auto;
        margin-left: auto;
        gap: 0;
        align-items: center;
        align-self: center;
        box-sizing: border-box;
        padding: 0 8px;
        white-space: nowrap;
        position: relative;
        z-index: 2;
        pointer-events: auto !important;
      }

      ${TOOLBAR_SELECTOR} .ubc-workday-toolbar-group {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        gap: 6px;
      }

      ${TOOLBAR_SELECTOR} .ubc-workday-waitlisted-group {
        margin-left: 12px;
      }

      ${EXPORT_ROW_SELECTOR} {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: wrap;
        box-sizing: border-box;
        width: 100%;
        padding: 6px 16px;
        background: #f7f8fa;
        border-top: 1px solid #e1e4e8;
        margin: 0 !important;
        position: sticky;
        top: 0;
        z-index: 10;
        pointer-events: auto !important;
      }

      ${TOOLBAR_SELECTOR} ~ [class*="IconsContainer"] {
        flex: 0 0 auto;
        margin-left: 0 !important;
        margin-inline-start: 0 !important;
      }

      ${TOOLBAR_SELECTOR} button,
      ${EXPORT_ROW_SELECTOR} button {
        appearance: none;
        border: 1px solid #c9ced6;
        border-radius: 5px;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        line-height: 1.2;
        min-height: 28px;
        padding: 5px 10px;
        position: relative;
        z-index: 3;
        pointer-events: auto !important;
        transition: background-color 120ms ease, border-color 120ms ease;
      }

      ${TOOLBAR_SELECTOR} .ubc-workday-term-button {
        background: #f3f5f7;
        color: #27313d;
      }

      ${TOOLBAR_SELECTOR} .ubc-workday-term-button[aria-pressed="true"] {
        background: #418ccf;
        border-color: #2d73b1;
        color: #fff;
      }

      ${TOOLBAR_SELECTOR} .ubc-workday-waitlisted-button {
        background: #fff3c4;
        border-color: #e1be53;
        color: #6c4c00;
      }

      ${TOOLBAR_SELECTOR} .ubc-workday-waitlisted-button[aria-pressed="true"] {
        background: #c78908;
        border-color: #a76f00;
        color: #fff;
      }

      ${EXPORT_ROW_SELECTOR} .ubc-workday-export-button {
        background: #e3f2e5;
        border-color: #8fb898;
        color: #285d32;
        font-weight: 600;
      }

      ${EXPORT_ROW_SELECTOR} .ubc-workday-export-icon {
        width: 14px;
        height: 14px;
        margin-right: 6px;
        vertical-align: -2px;
      }

      ${TOOLBAR_SELECTOR} button:hover,
      ${EXPORT_ROW_SELECTOR} button:hover {
        filter: brightness(0.97);
      }

      ${EVENT_SELECTOR} {
        --workday-course-color: #dce5ef;
        background-color: var(--workday-course-color) !important;
        border: 1px solid color-mix(in srgb, var(--workday-course-color) 62%, #4b5563) !important;
        border-radius: 5px !important;
        box-sizing: border-box !important;
        cursor: pointer;
        overflow: hidden !important;
        pointer-events: auto !important;
      }

      ${EVENT_SELECTOR} > :not(.ubc-workday-event-summary) {
        visibility: hidden !important;
      }

      ${EVENT_SELECTOR}[data-workday-registration-status="waitlisted"] {
        background-color: color-mix(in srgb, var(--workday-course-color) 58%, #ffffff) !important;
        background-image: none !important;
        border-color: color-mix(in srgb, var(--workday-course-color) 62%, #4b5563) !important;
        border-radius: 5px !important;
        border-width: 2px !important;
        border-style: dashed !important;
      }

      ${EVENT_SELECTOR} .ubc-workday-event-summary {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        overflow: hidden;
        padding: 4px 5px;
        color: #24303b;
        font-size: 11px;
        line-height: 1.18;
        pointer-events: none;
        text-align: left;
        z-index: 2;
      }

      ${EVENT_SELECTOR} .ubc-workday-event-code {
        display: block;
        max-width: calc(100% - 2px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 700;
      }

      ${EVENT_SELECTOR} .ubc-workday-event-description {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        max-height: 2.36em;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-word;
      }

      ${EVENT_SELECTOR} .ubc-workday-wl-badge {
        position: absolute;
        right: 3px;
        top: 3px;
        border: 1px solid rgba(108, 76, 0, 0.5);
        border-radius: 3px;
        background: rgba(255, 247, 208, 0.92);
        color: #6c4c00;
        font-size: 9px;
        font-weight: 700;
        line-height: 1;
        padding: 2px 3px;
      }

      .ubc-workday-detail-popover {
        position: fixed;
        z-index: 2147483000;
        width: min(340px, calc(100vw - 24px));
        max-width: 340px;
        max-height: calc(100vh - 24px);
        overflow: hidden;
        box-sizing: border-box;
        border: 1px solid #aab5c2;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 8px 28px rgba(24, 39, 58, 0.24);
        color: #25313d;
        font: 13px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .ubc-workday-detail-popover-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px 8px;
        border-bottom: 1px solid #e1e5ea;
      }

      .ubc-workday-detail-popover-title {
        flex: 1;
        min-width: 0;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .ubc-workday-detail-popover-close {
        flex: 0 0 auto;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: #5b6773;
        cursor: pointer;
        font-size: 19px;
        line-height: 1;
        padding: 0 3px;
      }

      .ubc-workday-detail-popover-body {
        max-height: calc(100vh - 78px);
        overflow: auto;
        padding: 10px 12px 12px;
      }

      .ubc-workday-detail-popover-status {
        display: inline-block;
        margin: 0;
        border-radius: 999px;
        background: #edf1f5;
        color: #465360;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
      }

      .ubc-workday-detail-popover-status[data-status="waitlisted"] {
        background: #fff1bf;
        color: #6c4c00;
      }

      .ubc-workday-detail-popover-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
        margin-bottom: 4px;
      }

      .ubc-workday-detail-popover-term {
        display: inline-block;
        border: 1px solid color-mix(in srgb, var(--workday-course-color) 45%, #b8c2cc);
        border-radius: 999px;
        background: color-mix(in srgb, var(--workday-course-color) 22%, #ffffff);
        color: #38536a;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
      }

      .ubc-workday-detail-popover-field {
        margin-top: 10px;
      }

      .ubc-workday-detail-popover-label {
        margin-top: 8px;
        color: #66727d;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .ubc-workday-detail-popover-value {
        overflow-wrap: anywhere;
      }

      .ubc-workday-detail-popover-meetings {
        margin-top: 14px;
        border-top: 1px solid #e1e5ea;
        padding-top: 10px;
      }

      .ubc-workday-detail-popover-meeting {
        padding: 5px 0;
      }

      .ubc-workday-detail-popover-meeting + .ubc-workday-detail-popover-meeting {
        margin-top: 6px;
        border-top: 1px solid #edf0f3;
        padding-top: 10px;
      }

      .ubc-workday-detail-popover-meeting-line {
        overflow-wrap: anywhere;
      }

      .ubc-workday-detail-popover-meeting-date {
        font-weight: 600;
      }

      .ubc-workday-detail-popover-day-strip {
        display: flex;
        gap: 4px;
        margin-top: 6px;
      }

      .ubc-workday-detail-popover-day {
        display: grid;
        place-items: center;
        flex: 1 1 0;
        min-width: 0;
        height: 24px;
        box-sizing: border-box;
        border: 1px solid #d5dce3;
        border-radius: 5px;
        background: #f5f7f9;
        color: #75818d;
        font-size: 10px;
        font-weight: 600;
      }

      .ubc-workday-detail-popover-day.is-active {
        border-color: color-mix(in srgb, var(--workday-course-color) 65%, #7f8b97);
        background: color-mix(in srgb, var(--workday-course-color) 35%, #ffffff);
        color: #25313d;
      }

      .ubc-workday-detail-popover-meeting-time {
        margin-top: 6px;
        color: #344656;
        font-weight: 600;
      }

      .ubc-workday-detail-popover-meeting-location {
        margin-top: 2px;
        color: #5b6773;
      }
    `;
  }

  function restoreElement(element) {
    const position = API.state.originalPositions.get(element);
    const display = API.state.originalDisplays.get(element);
    if (position) {
      element.style.left = position.inline.left;
      element.style.width = position.inline.width;
      element.style.top = position.inline.top;
      element.style.height = position.inline.height;
    }
    if (display !== undefined) element.style.display = display;
  }

  function getCourseColor(courseId) {
    const key = compactKey(courseId) || "UNKNOWN";
    const colors = API.state.courseColors;
    if (colors.has(key)) return colors.get(key);

    let color;
    if (colors.size < PALETTE.length) {
      color = PALETTE[colors.size];
    } else {
      let hash = 0;
      for (const character of key) {
        hash = (hash * 31 + character.charCodeAt(0)) % 360;
      }
      color = `hsl(${hash}, 48%, 78%)`;
    }
    colors.set(key, color);
    return color;
  }

  function recordLabel(record) {
    return record.displayName || record.courseId || record.name || "Course";
  }

  function recordTitle(record) {
    return record.title || "";
  }

  function eventDescription(record) {
    const title = recordTitle(record);
    if (title) return title;
    const fullName = normaliseText(record.name || "");
    const code = normaliseText(recordLabel(record));
    if (fullName.toLowerCase().startsWith(code.toLowerCase())) {
      return fullName.slice(code.length).replace(/^\s*[-–—:]\s*/, "");
    }
    return "";
  }

  function ensureSummary(element, record) {
    let summary = Array.from(element.children || []).find((child) =>
      child.classList.contains("ubc-workday-event-summary"),
    );
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "ubc-workday-event-summary";
      const code = document.createElement("span");
      code.className = "ubc-workday-event-code";
      const description = document.createElement("span");
      description.className = "ubc-workday-event-description";
      summary.append(code, description);
      element.appendChild(summary);
    }

    const code = summary.querySelector(".ubc-workday-event-code");
    const description = summary.querySelector(".ubc-workday-event-description");
    if (code) code.textContent = recordLabel(record);
    if (description) description.textContent = eventDescription(record);

    let badge = summary.querySelector(".ubc-workday-wl-badge");
    if (record.registrationStatus === "waitlisted") {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "ubc-workday-wl-badge";
        summary.appendChild(badge);
      }
      badge.textContent = "WL";
    } else if (badge) {
      badge.remove();
    }
  }

  function decorateEvent(binding) {
    const { element, record } = binding;
    const status = record.registrationStatus === "waitlisted" ? "waitlisted" : "registered";
    const term = record.term === 2 ? "Term 2" : "Term 1";
    const details = record.details || record.rowText || "";
    const title = `${record.name || recordLabel(record)}\n${
      status === "waitlisted" ? "Waitlisted" : "Registered"
    } · ${term}${details ? `\n${details}` : ""}`;

    element.setAttribute("data-workday-term-calendar-event", "true");
    element.setAttribute("data-workday-registration-status", status);
    element.setAttribute("data-workday-course-id", record.courseId || "");
    element.style.setProperty("--workday-course-color", getCourseColor(record.courseId));
    element.title = title;
    element.classList.add("ubc-workday-managed-event");
    ensureSummary(element, record);
    bindEventInteraction(element, record);
  }

  function getOriginalPosition(element) {
    return API.state.originalPositions.get(element) || null;
  }

  function getDay(element) {
    const position = getOriginalPosition(element);
    if (!position || !Number.isFinite(position.leftPercent)) return null;
    const left = position.leftPercent;
    const width = position.widthPercent;
    if (Number.isFinite(width) && Math.abs(width - DAY_WIDTH) <= 1.5) {
      return Math.max(0, Math.min(6, Math.round(left / DAY_WIDTH)));
    }
    return Math.max(0, Math.min(6, Math.floor(left / DAY_WIDTH + 0.01)));
  }

  function getInterval(binding) {
    const position = getOriginalPosition(binding.element);
    if (
      !position ||
      !Number.isFinite(position.topPixels) ||
      !Number.isFinite(position.heightPixels) ||
      position.heightPixels <= 0
    ) {
      return null;
    }
    return {
      start: position.topPixels,
      end: position.topPixels + position.heightPixels,
    };
  }

  function conflictGroups(bindings) {
    const groups = [];
    const sorted = bindings
      .map((binding) => ({ binding, interval: getInterval(binding) }))
      .filter((item) => item.interval)
      .sort((left, right) => left.interval.start - right.interval.start);

    for (const item of sorted) {
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || item.interval.start >= lastGroup.end) {
        groups.push({ end: item.interval.end, items: [item] });
      } else {
        lastGroup.items.push(item);
        lastGroup.end = Math.max(lastGroup.end, item.interval.end);
      }
    }
    return groups;
  }

  function redrawConflicts(bindings) {
    const byDay = new Map();
    for (const binding of bindings) {
      const day = getDay(binding.element);
      if (day === null) continue;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(binding);
    }

    for (const [day, dayBindings] of byDay) {
      for (const group of conflictGroups(dayBindings)) {
        const laneEnds = [];
        const laneItems = [];
        for (const item of group.items) {
          let lane = laneEnds.findIndex((end) => end <= item.interval.start);
          if (lane < 0) {
            lane = laneEnds.length;
            laneEnds.push(item.interval.end);
            laneItems.push([]);
          } else {
            laneEnds[lane] = item.interval.end;
          }
          laneItems[lane].push(item.binding);
        }

        const laneWidth = DAY_WIDTH / laneEnds.length;
        laneItems.forEach((items, lane) => {
          for (const binding of items) {
            binding.element.style.left = `${day * DAY_WIDTH + lane * laneWidth}%`;
            binding.element.style.width = `${laneWidth}%`;
          }
        });
      }
    }
  }

  function isShown(record) {
    return (
      record.term === API.state.activeTerm &&
      (record.registrationStatus !== "waitlisted" || API.state.showWaitlisted)
    );
  }

  function applyTerm(term) {
    API.state.activeTerm = term === 2 ? 2 : 1;
    const context = API.state.context;
    if (!context || !context.surface) return;

    const visibleBindings = [];
    for (const binding of context.events || []) {
      restoreElement(binding.element);
      decorateEvent(binding);
      if (isShown(binding.record)) {
        binding.element.style.display =
          API.state.originalDisplays.get(binding.element) || "";
        visibleBindings.push(binding);
      } else {
        binding.element.style.display = "none";
      }
    }

    redrawConflicts(visibleBindings);
    updateToolbarState();
  }

  function setShowWaitlisted(show) {
    API.state.showWaitlisted = Boolean(show);
    applyTerm(API.state.activeTerm);
  }

  function findCloseControl(root) {
    if (!root) return null;
    return Array.from(
      root.querySelectorAll("button,[role=button],[data-automation-id]"),
    ).find((control) => {
      const label = `${control.textContent || ""} ${
        control.getAttribute("aria-label") || ""
      } ${control.getAttribute("title") || ""} ${
        control.getAttribute("data-automation-id") || ""
      }`.toLowerCase();
      return /close|dismiss|cancel|(^|\s)[×x](\s|$)/.test(label);
    });
  }

  function hasCalendarTitle(root) {
    const text = normaliseText(root.textContent);
    return /\bcourse\b/i.test(text) && /\bcalendar\b/i.test(text);
  }

  function findTitleBar(surface) {
    if (!surface) return null;
    const headerContents = Array.from(
      surface.querySelectorAll('[class*="HeaderContents"]'),
    )
      .map((element) => ({
        element,
        close: findCloseControl(element),
        visible:
          !global.getComputedStyle ||
          (global.getComputedStyle(element).display !== "none" &&
            global.getComputedStyle(element).visibility !== "hidden"),
      }))
      .filter(
        ({ element, close }) =>
          element !== surface && hasCalendarTitle(element) && close,
      )
      .sort((left, right) => {
        if (left.visible !== right.visible) return left.visible ? -1 : 1;
        return normaliseText(left.element.textContent).length -
          normaliseText(right.element.textContent).length;
      });
    if (headerContents.length) {
      return {
        element: headerContents[0].element,
        close: headerContents[0].close,
      };
    }

    const candidates = [];
    const add = (elements) => candidates.push(...elements);
    add(Array.from(surface.querySelectorAll('[data-automation-id="pageHeader"]')));
    for (const container of surface.querySelectorAll(
      '[data-automation-id="pageHeaderTitleContainer"]',
    )) {
      if (container.parentElement) candidates.push(container.parentElement);
    }
    add(Array.from(surface.querySelectorAll("header")));
    add(
      Array.from(
        surface.querySelectorAll('h1,h2,h3,[role="heading"]'),
      ).map((heading) => heading.parentElement || heading),
    );

    for (const candidate of Array.from(new Set(candidates))) {
      let current = candidate;
      for (let depth = 0; current && depth < 2; depth += 1) {
        if (
          current !== surface &&
          surface.contains(current) &&
          hasCalendarTitle(current)
        ) {
          const close = findCloseControl(current);
          if (close) return { element: current, close };
        }
        current = current.parentElement;
      }
    }
    return null;
  }

  function removeToolbars() {
    document
      .querySelectorAll(
        `${TOOLBAR_SELECTOR}, ${EXPORT_ROW_SELECTOR}`,
      )
      .forEach((toolbar) => toolbar.remove());
    document
      .querySelectorAll(TITLEBAR_SELECTOR)
      .forEach((titleBar) => titleBar.removeAttribute("data-workday-term-calendar-titlebar"));
  }

  function toolbarButton(toolbar, selector, label, className, parent = toolbar) {
    let button = toolbar.querySelector(selector);
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
    }
    button.classList.add(className);
    button.textContent = label;
    if (button.parentElement !== parent) {
      parent.appendChild(button);
    }
    return button;
  }

  function toolbarGroup(toolbar, className, label) {
    let group = toolbar.querySelector(`.${className}`);
    if (!group) {
      group = document.createElement("div");
    }
    group.className = `ubc-workday-toolbar-group ${className}`;
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", label);
    return group;
  }

  function findCalendarAnchor(surface) {
    const nativeEvent = surface.querySelector(
      '[data-automation-id="calendarevent"], [data-automation-id="calendarEvent"], .WMSC.WKSC.WLTC.WEUC',
    );
    return nativeEvent
      ? nativeEvent.closest('table,[role="grid"],[role="presentation"]') ||
          nativeEvent.parentElement
      : surface.querySelector(
          '[role="grid"], [data-automation-id*="calendar"], [class*="Calendar"], [class*="calendar"]',
        );
  }

  function findCalendarContainer(surface, titleBarElement, row) {
    const calendarAnchor = findCalendarAnchor(surface);
    if (!calendarAnchor || calendarAnchor === surface) return null;

    let header = titleBarElement;
    while (header.parentElement && header.parentElement !== surface) {
      header = header.parentElement;
    }

    let candidate = header.nextElementSibling;
    while (candidate) {
      if (candidate !== row && candidate.contains(calendarAnchor)) {
        return candidate;
      }
      candidate = candidate.nextElementSibling;
    }

    let container = calendarAnchor;
    while (container.parentElement && container.parentElement !== surface) {
      container = container.parentElement;
    }
    return container === titleBarElement || container.contains(titleBarElement)
      ? null
      : container;
  }

  function exportRow(surface, titleBarElement) {
    const rows = Array.from(document.querySelectorAll(EXPORT_ROW_SELECTOR));
    let row = rows.find((candidate) => surface.contains(candidate));

    let container = findCalendarContainer(surface, titleBarElement, row);
    if (!container) {
      return null;
    }
    if (/^(TABLE|TBODY|THEAD|TR)$/i.test(container.tagName)) {
      container = container.parentElement || container;
    }

    if (!row) row = document.createElement("div");

    rows
      .filter((candidate) => candidate !== row)
      .forEach((candidate) => candidate.remove());
    row.setAttribute("data-workday-term-calendar-export-row", "true");

    let header = titleBarElement;
    while (header.parentElement && header.parentElement !== surface) {
      header = header.parentElement;
    }
    let firstContent = header.nextElementSibling;
    while (firstContent === row) {
      firstContent = firstContent.nextElementSibling;
    }
    const reference = firstContent || container;
    const host = reference.parentElement || container.parentElement || container;
    if (row.parentElement !== host || row.nextElementSibling !== reference) {
      host.insertBefore(row, reference);
    }
    return row;
  }

  function updateToolbarState() {
    const toolbar = document.querySelector(TOOLBAR_SELECTOR);
    if (!toolbar) return;
    const term1 = toolbar.querySelector('[data-workday-term="1"]');
    const term2 = toolbar.querySelector('[data-workday-term="2"]');
    const waitlisted = toolbar.querySelector(
      '[data-workday-show-waitlisted="true"]',
    );
    if (term1) term1.setAttribute("aria-pressed", String(API.state.activeTerm === 1));
    if (term2) term2.setAttribute("aria-pressed", String(API.state.activeTerm === 2));
    if (waitlisted) {
      waitlisted.setAttribute("aria-pressed", String(API.state.showWaitlisted));
      waitlisted.textContent = API.state.showWaitlisted
        ? "Hide waitlisted"
        : "Show waitlisted";
    }
  }

  function addFilterButtons(context) {
    const surface = context && context.surface;
    const titleBar = findTitleBar(surface);
    if (!titleBar) {
      removeToolbars();
      return null;
    }

    document.querySelectorAll(TITLEBAR_SELECTOR).forEach((element) => {
      if (element !== titleBar.element) {
        element.removeAttribute("data-workday-term-calendar-titlebar");
      }
    });

    const toolbars = Array.from(surface.querySelectorAll(TOOLBAR_SELECTOR));
    const toolbar = toolbars[0] || document.createElement("div");
    toolbars.forEach((existing) => {
      if (existing !== toolbar) existing.remove();
    });

    toolbar.setAttribute("data-workday-term-calendar-toolbar", "true");
    titleBar.element.setAttribute("data-workday-term-calendar-titlebar", "true");
    const exportControls = exportRow(surface, titleBar.element);
    if (!exportControls) {
      removeToolbars();
      return null;
    }
    const exportButton =
      typeof API.addExportButton === "function"
        ? API.addExportButton(exportControls)
        : null;
    if (exportButton && exportControls.firstElementChild !== exportButton) {
      exportControls.insertBefore(exportButton, exportControls.firstElementChild);
    }
    if (
      toolbar.parentElement !== exportControls ||
      toolbar !== exportControls.lastElementChild
    ) {
      exportControls.appendChild(toolbar);
    }

    const termGroup = toolbarGroup(toolbar, "ubc-workday-term-group", "Term filter");
    const waitlistedGroup = toolbarGroup(
      toolbar,
      "ubc-workday-waitlisted-group",
      "Waitlisted filter",
    );
    const term1 = toolbarButton(
      toolbar,
      '[data-workday-term="1"]',
      "Term 1",
      "ubc-workday-term-button",
      termGroup,
    );
    const term2 = toolbarButton(
      toolbar,
      '[data-workday-term="2"]',
      "Term 2",
      "ubc-workday-term-button",
      termGroup,
    );
    const waitlisted = toolbarButton(
      toolbar,
      '[data-workday-show-waitlisted="true"]',
      "Show waitlisted",
      "ubc-workday-waitlisted-button",
      waitlistedGroup,
    );
    if (
      toolbar.firstElementChild !== termGroup ||
      termGroup.nextElementSibling !== waitlistedGroup
    ) {
      toolbar.append(termGroup, waitlistedGroup);
    }
    term1.setAttribute("data-workday-term", "1");
    term2.setAttribute("data-workday-term", "2");
    waitlisted.setAttribute("data-workday-show-waitlisted", "true");

    if (!term1.__workdayTermListener) {
      term1.__workdayTermListener = true;
      term1.addEventListener("click", () => applyTerm(1));
    }
    if (!term2.__workdayTermListener) {
      term2.__workdayTermListener = true;
      term2.addEventListener("click", () => applyTerm(2));
    }
    if (!waitlisted.__workdayTermListener) {
      waitlisted.__workdayTermListener = true;
      waitlisted.addEventListener("click", () =>
        setShowWaitlisted(!API.state.showWaitlisted),
      );
    }
    updateToolbarState();
    return toolbar;
  }

  function formatDetailDate(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(value);
  }

  function formatDetailTime(minutes) {
    if (!Number.isFinite(minutes)) return "";
    const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
    const hour24 = Math.floor(total / 60);
    const hour12 = hour24 % 12 || 12;
    const meridiem = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${String(total % 60).padStart(2, "0")} ${meridiem}`;
  }

  function formatDetailMeetingDate(meeting) {
    const start = formatDetailDate(meeting.startDate);
    const end = formatDetailDate(meeting.endDate || meeting.startDate);
    if (!start) return "";
    return end && end !== start ? `${start} – ${end}` : start;
  }

  function formatDetailLocation(meeting) {
    const parts = normaliseText(meeting.text || "")
      .split("|")
      .map((part) => part.trim());
    if (parts.length <= 3) return "";
    return normaliseText(
      parts[3]
        .replace(/\bUBCV\b/gi, "")
        .replace(/^\s*[-–—:,|]\s*/, "")
        .replace(/\s*[-–—:,|]\s*$/, ""),
    );
  }

  function appendMeetingDayStrip(parent, meeting) {
    const strip = document.createElement("div");
    strip.className = "ubc-workday-detail-popover-day-strip";
    const activeDays = new Set(meeting.meetingDays || []);
    const shortNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    strip.setAttribute(
      "aria-label",
      (meeting.meetingDays || [])
        .map((day) => API.DAY_NAMES[day])
        .filter(Boolean)
        .join(", "),
    );
    shortNames.forEach((name, day) => {
      const dayElement = document.createElement("span");
      dayElement.className = "ubc-workday-detail-popover-day";
      if (activeDays.has(day)) dayElement.classList.add("is-active");
      dayElement.textContent = name;
      strip.appendChild(dayElement);
    });
    parent.appendChild(strip);
  }

  function detailCourseCode(record) {
    const code = normaliseText(record.displayName || record.courseId || "");
    const section = normaliseText(record.section || "");
    if (!code) return normaliseText(record.name || "Course");
    return section ? `${code}-${section}` : code;
  }

  function detailDescription(record) {
    let value = normaliseText(record.title || eventDescription(record));
    const codes = [
      detailCourseCode(record),
      record.displayName,
      record.courseId,
    ]
      .map((code) => normaliseText(code))
      .filter(Boolean)
      .sort((left, right) => right.length - left.length);
    for (const code of codes) {
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      value = value.replace(new RegExp(escaped, "gi"), " ");
    }
    value = normaliseText(
      value
        .replace(/^\s*[-–—:]\s*/, "")
        .replace(/\s*[-–—:]\s*$/, ""),
    );
    const repeatedParts = value
      .split(/\s+[-–—:]\s+/)
      .map((part) => normaliseText(part))
      .filter(Boolean);
    if (
      repeatedParts.length === 2 &&
      repeatedParts[0].toLowerCase() === repeatedParts[1].toLowerCase()
    ) {
      return repeatedParts[0];
    }
    return value;
  }

  function detailCredits(value) {
    const text = normaliseText(value);
    if (!text) return "";
    if (/^\d+(?:\.\d+)?(?:\s*(?:credits?|units?))?$/i.test(text)) {
      return text;
    }
    const numbers = text.match(/\d+(?:\.\d+)?/g) || [];
    return numbers.length && numbers.every((number) => number === numbers[0])
      ? numbers[0]
      : "";
  }

  function addPopoverField(body, label, value) {
    if (!value) return;
    const field = document.createElement("div");
    field.className = "ubc-workday-detail-popover-field";
    const labelElement = document.createElement("div");
    labelElement.className = "ubc-workday-detail-popover-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("div");
    valueElement.className = "ubc-workday-detail-popover-value";
    valueElement.textContent = value;
    field.append(labelElement, valueElement);
    body.appendChild(field);
  }

  function showDetails(anchor, record) {
    closePopover();
    const popover = document.createElement("div");
    popover.className = "ubc-workday-detail-popover";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Course details");
    popover.style.setProperty(
      "--workday-course-color",
      getCourseColor(record.courseId),
    );

    const header = document.createElement("div");
    header.className = "ubc-workday-detail-popover-header";
    const title = document.createElement("div");
    title.className = "ubc-workday-detail-popover-title";
    title.textContent = detailCourseCode(record);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ubc-workday-detail-popover-close";
    close.setAttribute("aria-label", "Close course details");
    close.textContent = "×";
    header.append(title, close);

    const body = document.createElement("div");
    body.className = "ubc-workday-detail-popover-body";
    const status = document.createElement("div");
    status.className = "ubc-workday-detail-popover-status";
    status.dataset.status = record.registrationStatus;
    status.textContent =
      record.registrationStatus === "waitlisted" ? "Waitlisted" : "Registered";
    const term = document.createElement("div");
    term.className = "ubc-workday-detail-popover-term";
    term.textContent = record.term === 2 ? "Term 2" : "Term 1";
    const meta = document.createElement("div");
    meta.className = "ubc-workday-detail-popover-meta";
    meta.append(status, term);
    body.appendChild(meta);

    addPopoverField(body, "Description", detailDescription(record));
    addPopoverField(body, "Credits", detailCredits(record.credits));
    addPopoverField(body, "Instructor", record.instructor || "");

    const meetings = record.meetings && record.meetings.length
      ? record.meetings
      : record.startDate || Number.isFinite(record.startMinutes)
        ? [record]
        : [];
    if (meetings.length) {
      const meetingsList = document.createElement("div");
      meetingsList.className = "ubc-workday-detail-popover-meetings";
      meetings.forEach((meeting) => {
        const meetingCard = document.createElement("div");
        meetingCard.className = "ubc-workday-detail-popover-meeting";
        const date = formatDetailMeetingDate(meeting);
        const time = [
          formatDetailTime(meeting.startMinutes),
          formatDetailTime(meeting.endMinutes),
        ]
          .filter(Boolean)
          .join(" – ");
        const location = formatDetailLocation(meeting);
        if (date) {
          const dateLine = document.createElement("div");
          dateLine.className =
            "ubc-workday-detail-popover-meeting-line ubc-workday-detail-popover-meeting-date";
          dateLine.textContent = date;
          meetingCard.appendChild(dateLine);
        }
        if (meeting.meetingDays && meeting.meetingDays.length) {
          appendMeetingDayStrip(meetingCard, meeting);
        }
        if (time) {
          const timeLine = document.createElement("div");
          timeLine.className =
            "ubc-workday-detail-popover-meeting-line ubc-workday-detail-popover-meeting-time";
          timeLine.textContent = time;
          meetingCard.appendChild(timeLine);
        }
        if (location) {
          const locationLine = document.createElement("div");
          locationLine.className =
            "ubc-workday-detail-popover-meeting-line ubc-workday-detail-popover-meeting-location";
          locationLine.textContent = location;
          meetingCard.appendChild(locationLine);
        }
        meetingsList.appendChild(meetingCard);
      });
      body.appendChild(meetingsList);
    }
    popover.append(header, body);
    const surface = API.state.context && API.state.context.surface;
    const popoverHost = surface && surface.contains(anchor) ? surface : document.body;
    popoverHost.appendChild(popover);
    ["pointerdown", "mousedown", "mouseup", "click"].forEach((eventName) => {
      popover.addEventListener(eventName, (event) => event.stopPropagation());
    });

    const reposition = () => {
      if (!popover.isConnected || !anchor.isConnected) return;
      const margin = 12;
      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportWidth = global.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = global.innerHeight || document.documentElement.clientHeight;
      let left = anchorRect.left;
      let top = anchorRect.bottom + 8;
      if (top + popoverRect.height > viewportHeight - margin) {
        top = anchorRect.top - popoverRect.height - 8;
      }
      left = Math.min(Math.max(margin, left), viewportWidth - popoverRect.width - margin);
      top = Math.min(Math.max(margin, top), viewportHeight - popoverRect.height - margin);
      popover.style.left = `${Math.max(margin, left)}px`;
      popover.style.top = `${Math.max(margin, top)}px`;
    };
    const outsideClick = (event) => {
      if (!popover.contains(event.target) && !anchor.contains(event.target)) {
        closePopover();
      }
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closePopover();
      }
    };
    close.addEventListener("click", closePopover);
    document.addEventListener("mousedown", outsideClick, true);
    document.addEventListener("keydown", escape, true);
    global.addEventListener("resize", reposition);
    global.addEventListener("scroll", reposition, true);
    statePopover({ popover, anchor, reposition, outsideClick, escape });
    reposition();
    close.focus();
  }

  function statePopover(value) {
    API.state.popover = value;
  }

  function closePopover() {
    const current = API.state.popover;
    if (!current) return;
    current.popover.remove();
    document.removeEventListener("mousedown", current.outsideClick, true);
    document.removeEventListener("keydown", current.escape, true);
    global.removeEventListener("resize", current.reposition);
    global.removeEventListener("scroll", current.reposition, true);
    API.state.popover = null;
  }

  function bindEventInteraction(element, record) {
    element.__workdayTermRecord = record;
    if (element.getAttribute("tabindex") === null) element.setAttribute("tabindex", "0");
    installEventDelegation();
  }

  function findManagedEvent(target) {
    if (!target || target.nodeType !== 1) return null;
    if (target.matches(EVENT_SELECTOR)) return target;
    return target.closest(EVENT_SELECTOR);
  }

  function installEventDelegation() {
    if (API.__eventDelegationInstalled) return;
    API.__eventDelegationInstalled = true;
    document.addEventListener(
      "click",
      (event) => {
        const element = findManagedEvent(event.target);
        if (!element || !element.__workdayTermRecord || element.style.display === "none") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        showDetails(element, element.__workdayTermRecord);
      },
      true,
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const element = findManagedEvent(event.target);
        if (!element || !element.__workdayTermRecord || element.style.display === "none") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        showDetails(element, element.__workdayTermRecord);
      },
      true,
    );
  }

  API.addStyles = addStyles;
  API.applyTerm = applyTerm;
  API.setShowWaitlisted = setShowWaitlisted;
  API.addFilterButtons = addFilterButtons;
  API.removeToolbars = removeToolbars;
  API.closePopover = closePopover;
})(globalThis);
