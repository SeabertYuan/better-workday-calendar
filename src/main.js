(function startWorkdayTermCalendar(global) {
  const API = global.__UBC_WORKDAY_TERM_CALENDAR__;
  if (!API || API.__mainInstalled) return;
  API.__mainInstalled = true;

  let refreshTimer = null;
  let observer = null;
  const TARGET_PATH = /^\/ubc\/d\/task\/2998\$28771\.htmld$/i;
  const CALENDAR_MARKER_SELECTOR = [
    '[data-automation-id="calendarevent"]',
    '[data-automation-id="calendarEvent"]',
    ".WMSC.WKSC.WLTC.WEUC",
    '[role="grid"]',
    '[class*="Calendar"]',
    '[class*="calendar"]',
    '[style*="left"][style*="width"]',
  ].join(",");
  const CALENDAR_SURFACE_SELECTOR = [
    '[role="dialog"]',
    '[aria-modal="true"]',
    '[data-automation-id="popUpDialog"]',
    '[class*="Dialog"]',
    '[class*="Modal"]',
  ].join(",");

  function normalisePageText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isTargetPage() {
    return TARGET_PATH.test(global.location && global.location.pathname);
  }

  function hasCloseControl(surface) {
    return Array.from(
      surface.querySelectorAll("button,[role=button],[data-automation-id]"),
    ).some((control) => {
      const label = normalisePageText(
        `${control.textContent || ""} ${control.getAttribute("aria-label") || ""} ${
          control.getAttribute("title") || ""
        } ${control.getAttribute("data-automation-id") || ""}`,
      ).toLowerCase();
      return /close|dismiss|cancel|(^|\s)[×x](\s|$)/.test(label);
    });
  }

  function hasCourseCalendarContent() {
    if (!isTargetPage() || !document.body) return false;
    return Array.from(
      document.querySelectorAll(CALENDAR_SURFACE_SELECTOR),
    ).some((surface) => {
      const text = normalisePageText(
        surface.innerText || surface.textContent,
      );
      return (
        /view\s+as\s+course\s+calendar/i.test(text) &&
        surface.querySelector(CALENDAR_MARKER_SELECTOR) &&
        hasCloseControl(surface)
      );
    });
  }

  function isExtensionNode(node) {
    if (!node || node.nodeType !== 1) return true;
    return Boolean(
      node.matches(
        '[data-workday-term-calendar-toolbar="true"], [data-workday-term-calendar-export-row="true"], [data-workday-term-calendar-titlebar="true"], [data-workday-term-calendar-generated="waitlisted"], [data-workday-term-calendar-event="true"], .ubc-workday-event-summary, .ubc-workday-detail-popover, #ubc-workday-term-calendar-styles',
      ) ||
        node.closest(
          '[data-workday-term-calendar-toolbar="true"], [data-workday-term-calendar-export-row="true"], [data-workday-term-calendar-titlebar="true"], [data-workday-term-calendar-generated="waitlisted"], [data-workday-term-calendar-event="true"], .ubc-workday-detail-popover, #ubc-workday-term-calendar-styles',
        ),
    );
  }

  function isExtensionOnlyMutation(mutations) {
    if (!mutations.length) return true;
    return mutations.every((mutation) => {
      if (mutation.type === "attributes") {
        return isExtensionNode(mutation.target);
      }
      const nodes = [
        ...Array.from(mutation.addedNodes || []),
        ...Array.from(mutation.removedNodes || []),
      ];
      return isExtensionNode(mutation.target) && nodes.every(isExtensionNode);
    });
  }

  function refresh() {
    refreshTimer = null;
    if (!hasCourseCalendarContent()) {
      API.closePopover();
      API.removeToolbars();
      API.state.context = null;
      return;
    }

    API.addStyles();
    const previous = API.state.context;
    const context = API.discover();

    if (previous && previous.surface !== context.surface) {
      API.closePopover();
    }
    if (API.state.popover && !API.state.popover.anchor.isConnected) {
      API.closePopover();
    }

    if (!context.surface || !context.records.length) {
      API.removeToolbars();
      API.state.context = null;
      return;
    }

    // addFilterButtons deliberately does nothing unless it finds the actual
    // Course Calendar title bar and its close control.
    const toolbar = API.addFilterButtons(context);
    if (!toolbar) {
      API.closePopover();
      return;
    }
    API.applyTerm(API.state.activeTerm);
  }

  function scheduleRefresh() {
    if (refreshTimer !== null) return;
    refreshTimer = global.setTimeout(refresh, 100);
  }

  function observeNavigation() {
    if (API.__navigationInstalled || !global.history) return;
    API.__navigationInstalled = true;
    const notify = () => scheduleRefresh();
    global.addEventListener("popstate", notify);
    global.addEventListener("hashchange", notify);

    ["pushState", "replaceState"].forEach((method) => {
      const original = global.history[method];
      if (typeof original !== "function") return;
      global.history[method] = function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
    });
  }

  function observe() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      if (!isExtensionOnlyMutation(mutations)) scheduleRefresh();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "aria-label",
        "class",
        "data-automation-id",
        "data-testid",
        "title",
      ],
    });
  }

  function start() {
    if (API.state.started) return;
    API.state.started = true;
    observeNavigation();
    refresh();
    observe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(globalThis);
