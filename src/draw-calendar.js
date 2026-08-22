(function installWorkdayTermCalendarDrawing(global) {
  const API = global.__UBC_WORKDAY_TERM_CALENDAR__;
  if (!API || API.__drawingInstalled) return;
  API.__drawingInstalled = true;

  const STYLE_ID = "ubc-workday-term-calendar-styles";
  const TOOLBAR_SELECTOR = '[data-workday-term-calendar-toolbar="true"]';
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
        gap: 6px;
        align-items: center;
        align-self: center;
        box-sizing: border-box;
        padding: 0 8px;
        white-space: nowrap;
      }

      ${TOOLBAR_SELECTOR} ~ [class*="IconsContainer"] {
        flex: 0 0 auto;
        margin-left: 0 !important;
        margin-inline-start: 0 !important;
      }

      ${TOOLBAR_SELECTOR} button {
        appearance: none;
        border: 1px solid #c9ced6;
        border-radius: 5px;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        line-height: 1.2;
        min-height: 28px;
        padding: 5px 10px;
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

      ${TOOLBAR_SELECTOR} button:hover {
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
        background-color: #fff4d6 !important;
        background-image: none !important;
        border-color: #d6a335 !important;
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
        margin-bottom: 8px;
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

      .ubc-workday-detail-popover-label {
        margin-top: 8px;
        color: #66727d;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .ubc-workday-detail-popover-details {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
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
    return /view\s+as\s+course\s+calendar/i.test(normaliseText(root.textContent));
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
      .querySelectorAll(`${TOOLBAR_SELECTOR}, .toolbar-buttons`)
      .forEach((toolbar) => toolbar.remove());
    document
      .querySelectorAll(TITLEBAR_SELECTOR)
      .forEach((titleBar) => titleBar.removeAttribute("data-workday-term-calendar-titlebar"));
  }

  function toolbarButton(toolbar, selector, label, className) {
    let button = toolbar.querySelector(selector);
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = className;
      toolbar.appendChild(button);
    }
    button.textContent = label;
    return button;
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

    // Remove the toolbar class used by the previous implementation if the
    // extension was reloaded without reloading the Workday page.
    document.querySelectorAll(".toolbar-buttons").forEach((toolbar) => toolbar.remove());
    document.querySelectorAll(TITLEBAR_SELECTOR).forEach((element) => {
      if (element !== titleBar.element) {
        element.removeAttribute("data-workday-term-calendar-titlebar");
      }
    });

    const toolbars = Array.from(document.querySelectorAll(TOOLBAR_SELECTOR));
    const inHost = toolbars.filter((toolbar) => titleBar.element.contains(toolbar));
    const toolbar = inHost[0] || document.createElement("div");
    toolbars.forEach((existing) => {
      if (existing !== toolbar) existing.remove();
    });

    toolbar.setAttribute("data-workday-term-calendar-toolbar", "true");
    titleBar.element.setAttribute("data-workday-term-calendar-titlebar", "true");
    const closeContainer = (() => {
      let current = titleBar.close;
      while (current.parentElement && current.parentElement !== titleBar.element) {
        current = current.parentElement;
      }
      return current.parentElement === titleBar.element ? current : null;
    })();
    if (closeContainer) {
      if (
        toolbar.parentElement !== titleBar.element ||
        toolbar.nextElementSibling !== closeContainer
      ) {
        titleBar.element.insertBefore(toolbar, closeContainer);
      }
    } else if (toolbar.parentElement !== titleBar.element) {
      titleBar.element.appendChild(toolbar);
    }

    const term1 = toolbarButton(
      toolbar,
      '[data-workday-term="1"]',
      "Term 1",
      "ubc-workday-term-button",
    );
    const term2 = toolbarButton(
      toolbar,
      '[data-workday-term="2"]',
      "Term 2",
      "ubc-workday-term-button",
    );
    const waitlisted = toolbarButton(
      toolbar,
      '[data-workday-show-waitlisted="true"]',
      "Show waitlisted",
      "ubc-workday-waitlisted-button",
    );
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

  function showDetails(anchor, record) {
    closePopover();
    const popover = document.createElement("div");
    popover.className = "ubc-workday-detail-popover";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Course details");

    const header = document.createElement("div");
    header.className = "ubc-workday-detail-popover-header";
    const title = document.createElement("div");
    title.className = "ubc-workday-detail-popover-title";
    title.textContent = record.name || recordLabel(record);
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
    body.appendChild(status);

    const termLabel = document.createElement("div");
    termLabel.className = "ubc-workday-detail-popover-label";
    termLabel.textContent = "Term";
    const termValue = document.createElement("div");
    termValue.textContent = record.term === 2 ? "Term 2" : "Term 1";
    body.append(termLabel, termValue);

    const detailsLabel = document.createElement("div");
    detailsLabel.className = "ubc-workday-detail-popover-label";
    detailsLabel.textContent = "Details";
    const details = document.createElement("div");
    details.className = "ubc-workday-detail-popover-details";
    details.textContent = record.details || record.rowText || "No additional details.";
    body.append(detailsLabel, details);
    popover.append(header, body);
    document.body.appendChild(popover);

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
      if (event.key === "Escape") closePopover();
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
