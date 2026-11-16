# DOMShield Hybrid — Spec

**Version:** 1.0  
**Last updated:** 2026-11-17  
**Process:** SDD → VSDD → CoDD  
**Sources:** `HACKATHON_BRIEF.md`; `.antigravity/IDEA_APPROVAL.json`; `DESIGN.md`; Studio Harness `templates/SPEC.md`.

---

## System Intent

**DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall** protects everyday web users from manipulative e-commerce dark patterns (sneak-into-basket, fake urgency timers, confirmshaming, hidden subscription traps, roach motels) and multi-domain phishing campaigns. It combines a **Chrome Extension (Manifest V3)** and an interactive **Web Command Center & Live DOM Sandbox** powered by **Firebase AI Logic Hybrid Inference SDK (`firebase/ai` with `InferenceMode.PREFER_ON_DEVICE` and `GoogleAIBackend` cloud fallback)**, **Chrome Built-in Gemini Nano (`LanguageModel` API)**, **Firebase App Check**, **Firebase Remote Config**, and **Cloud Firestore**. By executing primary DOM structural and semantic scans on-device with zero network latency and complete privacy, and escalating to Cloud Gemini + Firestore only when cross-domain campaign correlation or low-confidence obfuscation requires deep analysis, DOMShield Hybrid delivers instant protection without leaking sensitive checkout or personal page data.

**Outcome metrics**:

- **Activation:** Users or judges opening the Web Command Center (`http://localhost:3000`) or Chrome Extension Side Panel execute a full DOM scan and view pinpointed dark-pattern/phishing bounding boxes plus inference routing telemetry within **5 seconds** without requiring manual API key entry.
- **Retention:** Users rely on the one-click **"Disarm Dark Patterns"** countermeasure across checkout sessions to neutralize pre-checked recurring fee boxes, reveal hidden renewal clauses, and freeze fake countdown timers.
- **Value / conversion:** Achieves **F1 >= 0.90** on the 24-scenario Domain Ground-Truth Benchmark corpus while keeping **100% of single-page dark-pattern scans on-device (0 bytes of PII sent to cloud)**.

---

## Acceptance Criteria

- AC-1: The DOM Structural & Semantic Scanner extracts normalized DOM threat features (forms, pre-checked inputs, low-opacity/micro-font fee clauses, countdown timers, confirmshaming CTAs, and cross-origin form/link mismatches) and outputs schema-validated `ThreatFinding` items with exact CSS selectors and severity scores (`0..100`).
- AC-2: The Hybrid AI Inference Router integrates the official Firebase AI Logic SDK (`firebase/ai` with `getAI`, `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode.PREFER_ON_DEVICE`) and Chrome Built-in `LanguageModel` API, automatically routing high-confidence single-page dark-pattern scans on-device (`LOCAL_NANO`) with 0 cloud payload bytes and escalating complex/cross-domain threats to `CLOUD_GEMINI` (with deterministic heuristic + AST fallback when offline or without cloud credentials).
- AC-3: Firebase App Check (`firebase/app-check`), Firebase Remote Config (`firebase/remote-config`), and Cloud Firestore (`firebase/firestore`) adapters initialize safely in both Live Firebase and Credential-Free Local/Demo modes, enforcing configurable confidence escalation thresholds (`escalationThreshold`, `maxOnDeviceTokens`, `activeModelName`) and syncing anonymized domain threat signatures.
- AC-4: The One-Click DOM Countermeasure & Sanitizer Engine (`disarmDomThreats`) safely neutralizes detected dark patterns in live DOM trees (unchecking sneaky opt-ins, elevating hidden fee text contrast, halting fake urgency timers, and blocking cross-origin credential submission) while using the modern Sanitizer API (`Element.prototype.setHTML` with safe fallback) to prevent XSS when rendering untrusted DOM snippets.
- AC-5: The Chrome Extension (`extension/manifest.json`) is a valid Manifest V3 package containing `service-worker.js`, `content-script.js` (using `requestAnimationFrame` batched DOM highlighting), and `sidepanel/sidepanel.html` + `sidepanel/sidepanel.js` with `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`, real PNG icons (`16x16`, `48x48`, `128x128`), and `chrome.storage.local` state persistence.
- AC-6: The Domain Ground-Truth Benchmark Engine (`server/benchmark/groundTruthCorpus.ts`) evaluates at least 24 labeled web scenarios (spanning benign checkouts, 6 dark-pattern categories, and multi-domain phishing traps) and computes reproducible Precision, Recall, F1 Score, On-Device Privacy Ratio, and p95 latency via both CLI test suite and `/api/benchmark/run`.
- AC-7: The Web Command Center & Live DOM Threat Sandbox runs on port 3000 (`http://localhost:3000`), showcasing the 5-Second Visual Hook with 4 interactive scenarios, live DOM bounding-box inspection, One-Click Disarm countermeasures, Hybrid AI routing telemetry (`LOCAL_NANO` vs `CLOUD_GEMINI`), Firebase status pills (App Check, Remote Config, Firestore), custom HTML/DOM scanning, and interactive Ground-Truth Benchmark execution with zero console or page errors.
- AC-8: The repository includes complete documentation and validation artifacts (`DESIGN.md`, `SPEC.md`, `VALIDATION.md`, `README.md` with Mermaid architecture diagram, `SUBMISSION.md`, `CHROMEWEBSTORE.md`, `.env.example`), passes 100% of unit, integration, and Playwright E2E tests, and passes `coverage:check`.

---

## Modules

### 1. DOM Structural & Semantic Scanner (`shared/domScanner.ts`)

**Intent:** Parse HTML/DOM trees into structured security signals and identify dark patterns and phishing indicators with deterministic sub-millisecond extraction.

**Input:**
- `html`: `string` — Raw HTML or serialized DOM subtree (max `250,000` characters).
- `pageUrl`: `string` — Origin and path of the inspected document.

**Output:**
- Success: `DomScanFeatures` containing extracted nodes, risk signals, preliminary `ThreatFinding[]`, and byte/token counts.
- Error: Structured validation error when input is empty or exceeds size bounds.

**Edge cases:**
- Malformed HTML or script injection attempts inside attributes: stripped/escaped before rendering; never executed.
- Benign urgency timer (e.g., genuine ticket hold with transparent policy): distinguished from fake reset-loop timers.

**Out of scope:**
- Full headless browser network packet capture outside DOM/URL inspection.

**Depends on:** `none`

**Metrics:**
- Success signal: `p95` extraction latency `< 5ms` on 50KB DOM payloads.
- False positive: Flagging standard accessible checkout forms with transparent pricing as dark patterns (`FPR < 5%`).
- Failure signal: Uncaught parser exception on arbitrary HTML strings.

---

### 2. Firebase AI Logic Hybrid Router (`shared/hybridRouter.ts` & `client/src/services/firebaseHybridClient.ts`)

**Intent:** Execute privacy-preserving on-device inference via Chrome Built-in Gemini Nano (`InferenceMode.PREFER_ON_DEVICE` / `LanguageModel`) first, and dynamically fall back to Cloud Gemini (`GoogleAIBackend`) when cross-domain correlation or low on-device confidence occurs.

**Input:**
- `scanRequest`: `{ html: string, pageUrl: string, modePreference: 'PREFER_ON_DEVICE' | 'PREFER_CLOUD' | 'AUTO_HYBRID', remoteConfigPolicy: RemoteConfigPolicy }`

**Output:**
- Success: `HybridScanResult` with `inferenceRoute: 'ON_DEVICE_NANO' | 'CLOUD_GEMINI_FALLBACK'`, `cloudBytesSent`, `latencyMs`, `riskScore`, `findings`, and `firebaseTelemetry`.
- Error: Graceful degradation to verified local structural AST + semantic rules with explicit `fallbackReason`.

**Edge cases:**
- Browser lacks `globalThis.LanguageModel` or model is still downloading: seamlessly uses local deterministic AST-Nano engine or escalates to Cloud Gemini according to policy without crashing.
- Missing Firebase credentials in local judge Demo environment: runs full Hybrid pipeline using local verified App Check debug attestation and deterministic Cloud Threat Graph replica while exposing real `firebase/ai` SDK wiring.

**Out of scope:**
- Training custom foundation weights inside the browser.

**Depends on:** `DOM Structural & Semantic Scanner`, `Firebase Security & Sync Layer`

**Metrics:**
- Success signal: `100%` of single-domain dark-pattern pages resolved with `cloudBytesSent === 0` in `PREFER_ON_DEVICE` mode.
- False positive: Escalating every trivial DOM scan to cloud inference.
- Failure signal: Unhandled promise rejection when `LanguageModel` or network is unavailable.

---

### 3. Firebase Security & Sync Layer (`server/firebase/threatStore.ts`)

**Intent:** Enforce Firebase App Check verification, serve dynamic Remote Config routing policies, and synchronize anonymized multi-domain phishing fingerprints with Cloud Firestore.

**Input:**
- `appCheckToken`: `string`
- `domainFingerprint`: `DomainThreatRecord`

**Output:**
- Success: Verified `RemoteConfigPolicy`, matched multi-domain campaign correlation records, and persisted Firestore threat telemetry.
- Error: `401/403` when App Check enforcement rejects an invalid/forged token in strict mode.

**Edge cases:**
- Offline field operation: caches Remote Config defaults and queues threat telemetry locally.

**Out of scope:**
- Storing raw user PII, passwords, or credit card numbers in Firestore (strictly forbidden; only SHA-256 domain/pattern hashes are stored).

**Depends on:** `none`

**Metrics:**
- Success signal: Zero PII fields present in Firestore threat documents.
- False positive: Accepting unverified mutations when strict App Check mode is enabled.
- Failure signal: Policy sync latency exceeding `200ms`.

---

### 4. Chrome Extension Manifest V3 & Web Command Center (`extension/` & `client/`)

**Intent:** Deliver both a native Chrome Extension (`manifest_version: 3`) with Side Panel + Content Script HUD and a self-contained Web Command Center on `http://localhost:3000` for instant 5-second visual verification and one-click dark-pattern neutralization.

**Input:**
- User interaction with live storefront scenarios, custom HTML payloads, extension Side Panel triggers, or `"Disarm Dark Patterns"` actions.

**Output:**
- Success: Visual bounding-box overlays on risky DOM nodes, neutralized dark-pattern controls in the live DOM, real-time hybrid telemetry metrics, and benchmark verification tables.
- Error: Accessible inline alert banner with diagnostic guidance.

**Edge cases:**
- Rapid double-clicks on scan or disarm buttons: idempotent state locking prevents duplicate DOM mutations.
- Untrusted HTML snippets in findings: sanitized via `Element.prototype.setHTML` (Sanitizer API) with safe fallback.

**Out of scope:**
- Manifest V2 legacy APIs or `eval()` in extension pages.

**Depends on:** `DOM Structural & Semantic Scanner`, `Firebase AI Logic Hybrid Router`, `Firebase Security & Sync Layer`

**Metrics:**
- Success signal: Zero console errors, zero uncaught page errors, and `< 5s` time-to-first-scan in Playwright E2E tests.
- False positive: Modifying benign checkout buttons during `"Disarm Dark Patterns"`.
- Failure signal: Missing extension icon files or broken Side Panel open behavior.
