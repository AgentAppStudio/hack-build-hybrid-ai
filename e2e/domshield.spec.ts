import { test, expect } from "@playwright/test";

test("AC-7: Web Command Center showcases 5-Second Visual Hook, On-Device vs Cloud Hybrid Routing, One-Click Disarm, and 24-Scenario Ground-Truth Benchmark with zero console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await page.goto("/");

  // 1. Verify 5-Second Visual Hook loads Scenario 1 (On-Device Nano, 0 cloud bytes)
  await expect(page.getByTestId("top-tactical-bar")).toBeVisible();
  await expect(page.getByTestId("telemetry-route")).toHaveText("ON_DEVICE_NANO");
  await expect(page.getByTestId("telemetry-bytes")).toHaveText("0 B");
  await expect(page.getByTestId("verdict-label")).toContainText(
    "DARK_PATTERN_WARNING"
  );

  const findingCards = page.getByTestId("finding-card");
  await expect(findingCards).toHaveCount(4);

  // 2. Test One-Click Disarm Dark Patterns countermeasure
  await page.getByTestId("disarm-threats-btn").click();
  await expect(page.getByTestId("live-dom-sandbox")).toContainText(
    "PAUSED [FAKE TIMER DISARMED]"
  );
  await expect(page.getByTestId("live-dom-sandbox")).toContainText(
    "No thanks, continue with standard checkout"
  );

  // 3. Switch to Scenario 2 (Multi-Domain Phishing) -> Verify escalation to CLOUD_GEMINI_FALLBACK + Firestore Campaign
  await page.getByTestId("scenario-tab-2").click();
  await expect(page.getByTestId("telemetry-route")).toHaveText(
    "CLOUD_GEMINI_FALLBACK"
  );
  await expect(page.getByTestId("verdict-label")).toContainText(
    "CRITICAL_PHISHING_BLOCK"
  );
  await expect(page.getByTestId("telemetry-campaign")).toHaveText(
    "FS-CAMPAIGN-2026-091"
  );

  // 4. Switch to Scenario 4 (Verified Clean Checkout) -> Verify SAFE verdict and 0 false positives
  await page.getByTestId("scenario-tab-4").click();
  await expect(page.getByTestId("verdict-label")).toContainText("SAFE");
  await expect(page.getByTestId("telemetry-route")).toHaveText("ON_DEVICE_NANO");

  // 5. Run 24-Scenario Ground-Truth Benchmark in UI
  await page.getByTestId("run-benchmark-btn").click();
  await expect(page.getByTestId("benchmark-report-card")).toBeVisible();
  await expect(page.getByTestId("bench-f1")).toHaveText("100.0%");
  await expect(page.getByTestId("bench-privacy")).toHaveText("100.0%");

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
