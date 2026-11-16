const scanBtn = document.getElementById("scan-btn");
const disarmBtn = document.getElementById("disarm-btn");
const outputEl = document.getElementById("output");

scanBtn.addEventListener("click", async () => {
  outputEl.textContent = "Scanning active tab with On-Device Gemini Nano...";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) {
      outputEl.textContent = "No active tab found.";
      return;
    }
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        html: document.documentElement.outerHTML.slice(0, 40000),
        pageUrl: window.location.href,
      }),
    });

    const response = await chrome.runtime.sendMessage({
      type: "DOMSHIELD_ANALYZE_TAB",
      html: result?.html || "",
      pageUrl: result?.pageUrl || tab.url || "",
    });

    outputEl.textContent = JSON.stringify(response, null, 2);
  } catch (err) {
    outputEl.textContent = `Scan error: ${err instanceof Error ? err.message : String(err)}`;
  }
});

disarmBtn.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "DOMSHIELD_DISARM_PAGE",
    });
    outputEl.textContent = `Disarmed page dark patterns:\n${JSON.stringify(response, null, 2)}`;
  } catch (err) {
    outputEl.textContent = `Disarm error: ${err instanceof Error ? err.message : String(err)}`;
  }
});
