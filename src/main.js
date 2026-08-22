(function startWorkdayTermCalendar(global) {
  const API = global.__UBC_WORKDAY_TERM_CALENDAR__;
  if (!API || API.__mainInstalled) return;
  API.__mainInstalled = true;

  let refreshTimer = null;
  let observer = null;

  function isExtensionNode(node) {
    if (!node || node.nodeType !== 1) return true;
    return Boolean(
      node.matches(
        '[data-workday-term-calendar-toolbar="true"], [data-workday-term-calendar-titlebar="true"], [data-workday-term-calendar-generated="waitlisted"], [data-workday-term-calendar-event="true"], .ubc-workday-event-summary, .ubc-workday-detail-popover, #ubc-workday-term-calendar-styles',
      ) ||
        node.closest(
          '[data-workday-term-calendar-toolbar="true"], [data-workday-term-calendar-titlebar="true"], [data-workday-term-calendar-generated="waitlisted"], [data-workday-term-calendar-event="true"], .ubc-workday-detail-popover, #ubc-workday-term-calendar-styles',
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
    const previous = API.state.context;
    const context = API.discover();

    if (previous && previous.surface !== context.surface) {
      API.closePopover();
    }
    if (API.state.popover && !API.state.popover.anchor.isConnected) {
      API.closePopover();
    }

    if (!context.surface) {
      API.removeToolbars();
      return;
    }

    // addFilterButtons deliberately does nothing unless it finds the actual
    // Course Calendar title bar and its close control.
    API.addFilterButtons(context);
    API.applyTerm(API.state.activeTerm);
  }

  function scheduleRefresh() {
    if (refreshTimer !== null) return;
    refreshTimer = global.setTimeout(refresh, 100);
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
    API.addStyles();
    refresh();
    observe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(globalThis);
