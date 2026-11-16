# Chrome Web Store Listing & Compliance — DOMShield Hybrid

**Extension Name:** DOMShield Hybrid: On-Device Anti-Scam & Dark-Pattern Firewall  
**Version:** 1.0.0  
**Last Updated:** 2026-11-17

---

## 1. Store Listing Copy (User-Benefit Focused)

- **Short Description:** Spots deceptive checkout dark patterns, hidden recurring fees, fake countdown timers, and phishing forms before you pay or sign in.
- **Detailed Description:**
  - **Uncover Hidden Fees & Sneaky Add-ons:** Automatically highlights pre-checked warranty boxes, low-contrast subscription auto-renewal clauses, and surprise checkout surcharges.
  - **Disarm Manipulative Interfaces in One Click:** Unchecks sneaky add-ons, pauses artificial urgency timers, and makes tiny fine print clearly readable directly on the page.
  - **Private by Default:** Evaluates checkout pages right on your device so your personal shopping and billing details stay on your computer.
  - **Cross-Domain Phishing Protection:** Warns you immediately if a sign-in or recovery form attempts to send your credentials to an untrusted external address.

---

## 2. Permissions Justification

| Permission / Host Permission | Plain-English Justification |
|---|---|
| `sidePanel` | Opens the DOMShield Hybrid security summary panel alongside the active webpage so users can review detected dark patterns and disarm them without leaving their checkout page. |
| `tabs` | Reads the active tab's URL to verify whether login or payment forms are submitting credentials to a mismatched external domain. |
| `scripting` | Runs the on-demand DOM dark-pattern inspector and one-click countermeasure action when the user clicks "Scan Active Tab" in the Side Panel. |
| `storage` | Saves the user's preferred inference routing mode (`PREFER_ON_DEVICE`, `AUTO_HYBRID`, `PREFER_CLOUD`) and local scan counter in `chrome.storage.local`. |
| `http://localhost/*`, `https://*/*` | Allows the content script and on-demand scanner to highlight dark patterns and deceptive forms on shopping and sign-in websites the user visits. |

---

## 3. Privacy & Data Use Disclosure

- **Single-Page Dark Pattern Scans:** Processed 100% locally on the user's device (`0 bytes` of page content transmitted externally).
- **Multi-Domain Phishing Escalation:** Only anonymized SHA-256 domain hashes and structural threat categories are checked against the threat intelligence database; raw passwords, form inputs, and personal identifiers are never collected or transmitted.

---

## 4. Version History

- **1.0.0 (2026-11-17):** Initial Manifest V3 release featuring Side Panel integration, batched `requestAnimationFrame` DOM highlighting, one-click dark-pattern neutralization, Chrome Prompt API (`LanguageModel`) integration, and Firebase AI Logic Hybrid escalation.
