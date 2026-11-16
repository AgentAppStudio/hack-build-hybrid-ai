// DOMShield Hybrid — Manifest V3 Service Worker
// Follows Chrome Extensions MV3 best practices:
// - Uses chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
// - Stores all state in chrome.storage.local (never ephemeral global variables)
// - Uses async/await with return true for message channels

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  await chrome.storage.local.set({
    inferenceMode: "PREFER_ON_DEVICE",
    escalationThreshold: 0.72,
    totalScans: 0,
    lastScanResult: null,
  });
});

async function runOnDeviceLanguageModelAnalysis(domSnapshotText) {
  if (!globalThis.LanguageModel) {
    return null;
  }
  try {
    const availability = await globalThis.LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
    if (availability === "unavailable") {
      return null;
    }
    const params = globalThis.LanguageModel.params
      ? await globalThis.LanguageModel.params()
      : { defaultTemperature: 0.2, defaultTopK: 3 };
    const session = await globalThis.LanguageModel.create({
      temperature: params.defaultTemperature ?? 0.2,
      topK: params.defaultTopK ?? 3,
      initialPrompts: [
        {
          role: "system",
          content:
            "You are DOMShield Hybrid. Identify dark patterns (sneak-into-basket, fake timers, hidden subscriptions, confirmshaming) and phishing forms.",
        },
      ],
    });
    const output = await session.prompt(
      `Inspect DOM excerpt for dark patterns:\n${domSnapshotText.slice(0, 3000)}`
    );
    session.destroy();
    return output;
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === "DOMSHIELD_ANALYZE_TAB") {
        const stored = await chrome.storage.local.get([
          "inferenceMode",
          "totalScans",
        ]);
        const promptSummary = await runOnDeviceLanguageModelAnalysis(
          message.html || ""
        );
        const nextCount = (stored.totalScans || 0) + 1;
        const resultPayload = {
          timestamp: new Date().toISOString(),
          pageUrl: message.pageUrl || "https://active-tab.local",
          inferenceMode: stored.inferenceMode || "PREFER_ON_DEVICE",
          promptApiUsed: Boolean(promptSummary),
          promptSummary,
          totalScans: nextCount,
        };
        await chrome.storage.local.set({
          totalScans: nextCount,
          lastScanResult: resultPayload,
        });
        await chrome.action.setBadgeText({ text: "SAFE" });
        await chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
        sendResponse({ ok: true, result: resultPayload });
        return;
      }

      if (message?.type === "DOMSHIELD_GET_STATE") {
        const state = await chrome.storage.local.get([
          "inferenceMode",
          "escalationThreshold",
          "totalScans",
          "lastScanResult",
        ]);
        sendResponse({ ok: true, state });
        return;
      }

      sendResponse({ ok: false, error: "Unknown message type" });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Service worker error",
      });
    }
  })();
  return true;
});
