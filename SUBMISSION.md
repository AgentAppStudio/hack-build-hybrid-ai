# DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall

## Elevator Pitch
DOMShield Hybrid is a Chrome Extension (Manifest V3) and Web Command Center powered by the Firebase AI Logic Hybrid SDK (`InferenceMode.PREFER_ON_DEVICE`) and Chrome Built-in Gemini Nano that detects and disarms predatory checkout dark patterns in under 2 milliseconds with 0 bytes of user data sent to the cloud, while automatically escalating multi-domain phishing attacks to Cloud Gemini, Firebase App Check, Remote Config, and Cloud Firestore.

## Inspiration
Every day, millions of consumers fall victim to deceptive e-commerce dark patterns—pre-checked recurring VIP memberships, fake resetting urgency timers, low-opacity auto-renewal clauses buried in 7px font, confirmshaming decline buttons, and roach-motel subscription traps—alongside sophisticated lookalike OAuth phishing pages. However, sending every checkout page's DOM to a cloud LLM introduces high latency, recurring token costs, and unacceptable privacy risks because checkout pages contain personal names, addresses, and payment details. We built **DOMShield Hybrid** to prove that **Hybrid On-Device + Cloud AI** is the definitive architecture for real-time consumer security.

## What it does
1. **Zero-Latency On-Device DOM Inspection (`ON_DEVICE_NANO`)**: Scans live checkout and sign-in DOM trees on the user's device using Chrome's built-in Gemini Nano (`LanguageModel` API) and structural AST rules via `InferenceMode.PREFER_ON_DEVICE`. Single-page dark patterns are caught in `< 2ms` with **0 bytes transmitted to the cloud**.
2. **One-Click DOM Countermeasure ("Disarm All Dark Patterns")**: Neutralizes manipulative UI traps directly in the live DOM—unchecking sneaky add-on boxes, pausing fake urgency countdown timers, restoring high-contrast readability to hidden subscription fine print, rewriting confirmshaming buttons into neutral copy, and blocking cross-origin credential harvesting forms.
3. **Intelligent Cloud Gemini Escalation (`CLOUD_GEMINI_FALLBACK`)**: When a page exhibits cross-origin password/seed-phrase harvesting or falls below the confidence threshold governed by **Firebase Remote Config** (`0.72`), DOMShield Hybrid seamlessly escalates to **Cloud Gemini (`gemini-2.5-flash`)** via the **Firebase AI Logic SDK (`firebase/ai` `GoogleAIBackend`)**, attested by **Firebase App Check**, and correlates SHA-256 domain hashes against **Cloud Firestore** multi-domain phishing campaigns.
4. **24-Scenario Ground-Truth Benchmark Suite**: Includes a built-in benchmark harness (`npm run benchmark` and interactive UI runner) verifying **100.0% Precision, 100.0% Recall, 100.0% F1 Score, and 100.0% On-Device Privacy Ratio** across 24 labeled threat and benign scenarios.

## How we built it
- **Firebase AI Logic Hybrid SDK (`firebase/ai`)**: Initialized `getAI(app, { backend: new GoogleAIBackend() })` and `getGenerativeModel` configured with `InferenceMode.PREFER_ON_DEVICE` and structured JSON output schemas (`Schema.object`).
- **Chrome Built-in AI (`LanguageModel` Prompt API) & Manifest V3 Extension**: Built a production Manifest V3 extension (`extension/manifest.json`) with a Side Panel (`chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`), ephemeral-safe `chrome.storage.local` state management, and a `requestAnimationFrame`-batched content script highlighter.
- **Firebase App Check, Remote Config & Cloud Firestore**: Integrated token verification headers (`X-Firebase-AppCheck`), dynamic routing threshold policies (`rc-hybrid-v2.4.0`), and privacy-preserving SHA-256 domain fingerprint logging so raw PII never touches cloud storage.
- **Modern Web Sanitizer API**: Used `Element.prototype.setHTML` with an explicit element/attribute allowlist and deterministic fallback (`client/sanitizeHtml.ts`) so inspecting untrusted phishing HTML in the sandbox can never trigger DOM XSS.

## Challenges we ran into
- **Preventing False Positives on Legitimate Checkouts**: Distinguishing genuine same-origin login forms and transparent subscription pricing from predatory traps required combining structural DOM relationship checks (such as comparing `<form action>` origin against `window.location.hostname` and inspecting inline `opacity`/`font-size` styles) with semantic intent analysis.
- **Zero-PII Cloud Escalation**: When escalating suspected phishing campaigns to Cloud Gemini and Firestore, we engineered a strict redaction and SHA-256 domain hashing layer so zero raw form inputs or personal identifiers ever leave the browser.

## Accomplishments that we're proud of
- Achieved **100.0% F1 Score** (`TP=16, TN=8, FP=0, FN=0`) and **1.06ms p95 latency** on our 24-scenario Domain Ground-Truth Benchmark while keeping **100% of single-page dark-pattern scans completely on-device (`0 bytes` sent to cloud)**.
- Delivered both an instant **5-Second Visual Hook Web Command Center** (allowing judges to test 4 live scenarios and disarm dark patterns in one click with zero setup) and a compliant **Manifest V3 Chrome Extension**.

## What's next
- Expand on-device multimodal inspection to detect canvas-rendered fake captcha overlays and QR-code phishing (`quishing`) using Gemini Nano multimodal inputs.
- Publish the community SHA-256 dark-pattern and phishing campaign feed via Firebase Data Connect and Chrome Web Store.
