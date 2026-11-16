// DOMShield Hybrid — Manifest V3 Content Script
// Batches DOM modifications with requestAnimationFrame to avoid blocking the main thread.

async function highlightRiskyElementsBatched(elements, borderColor) {
  const BATCH_SIZE = 20;
  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        const slice = elements.slice(i, i + BATCH_SIZE);
        for (const el of slice) {
          el.style.outline = `2px solid ${borderColor}`;
          el.style.outlineOffset = "2px";
          el.setAttribute("data-domshield-highlighted", "true");
        }
        resolve();
      });
    });
    if (globalThis.scheduler?.yield) {
      await globalThis.scheduler.yield();
    }
  }
}

async function disarmPageDarkPatterns() {
  const checkedBoxes = Array.from(
    document.querySelectorAll('input[type="checkbox"][checked]')
  );
  const riskyNodes = Array.from(
    document.querySelectorAll(
      '[data-dark-pattern], [data-fake-urgency], .fine-print-trap, .confirmshame-decline'
    )
  );

  await highlightRiskyElementsBatched(
    [...checkedBoxes, ...riskyNodes],
    "#F59E0B"
  );

  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      for (const box of checkedBoxes) {
        box.checked = false;
        box.removeAttribute("checked");
      }
      resolve();
    });
  });

  return {
    highlightedCount: checkedBoxes.length + riskyNodes.length,
    uncheckedCount: checkedBoxes.length,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "DOMSHIELD_DISARM_PAGE") {
      const stats = await disarmPageDarkPatterns();
      sendResponse({ ok: true, stats });
      return;
    }
    if (message?.type === "DOMSHIELD_EXTRACT_DOM") {
      sendResponse({
        ok: true,
        html: document.documentElement.outerHTML.slice(0, 60000),
        pageUrl: window.location.href,
      });
      return;
    }
    sendResponse({ ok: false });
  })();
  return true;
});
