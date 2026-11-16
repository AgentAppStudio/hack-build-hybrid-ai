# DOMShield Hybrid — Design System & Visual Architecture (`DESIGN.md`)

**Product:** DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall  
**Hackathon:** #BuildHybridAI 2026 (Google Firebase & Chrome Built-in AI)  
**Design Philosophy:** Cyber-Defensive Tactical HUD ("Obsidian Shield") — instant clarity, zero cognitive clutter, and verifiable hybrid inference telemetry.

---

## 1. 5-Second Visual Hook (First-Impression Engineering)

Within **5 seconds** of opening `http://localhost:3000` (or clicking the Chrome Extension Side Panel), judges experience an immediate, visceral demonstration of **Why Hybrid AI Matters**:

1. **Split-Screen Live DOM Arena**:
   - **Left Viewport (Interactive Target Storefront & Phishing Sandbox)**: Renders live, interactive trap pages (*"FlashDealz Pro Checkout"*, *"CloudVault Urgent Security Alert"*, and *"FreeTrial Roach-Motel SaaS"*) containing real DOM-level dark patterns:
     - Fake urgency countdown timers (`setInterval` reset loops)
     - Hidden subscription fee toggles (`opacity: 0.35`, tiny font-size, pre-checked opt-in)
     - Bait-and-switch pricing disclosures buried in `<small>` terms
     - Cross-origin lookalike credential harvester forms
   - **Right Viewport (DOMShield Hybrid Command Deck & Extension Side Panel)**:
     - **Live Routing Gauge**: Displays **On-Device Gemini Nano (`PREFER_ON_DEVICE` / `LanguageModel`)** executing DOM structural AST + semantic classification in **< 5 ms** with a pulsing **`0 Bytes Sent to Cloud (100% Local Privacy)`** badge.
     - **Bounding-Box Threat Highlights**: Clicking any detected threat highlights the exact DOM node in the storefront with a color-coded tactical callout badge (`[DP-01: Sneak into Basket]`, `[DP-02: Fake Urgency Timer]`, `[PHISH-01: Cross-Domain Credential Harvest]`).
     - **One-Click DOM Countermeasure ("Disarm Dark Patterns")**: Neutralizes manipulative UI elements in real time (unchecks hidden recurring billing, reveals hidden fee text in high-contrast yellow, and locks fake timers) using the native Sanitizer API (`Element.prototype.setHTML` with fallback).
     - **Automatic Cloud Fallback Trigger**: When a complex multi-domain phishing signature or low-confidence obfuscated script is encountered, the router visibly escalates from **On-Device Nano** to **Firebase AI Logic Cloud Gemini (`gemini-2.5-flash`)** protected by **Firebase App Check** and cross-referenced against **Cloud Firestore Threat Intelligence** and **Firebase Remote Config** routing thresholds.

---

## 2. Color System & Semantic Tokens

| Token | Hex | Role | Contrast Ratio (vs `#090D16`) |
|---|---|---|---|
| `--bg-canvas` | `#090D16` | Deep Obsidian primary viewport background | — |
| `--bg-surface` | `#111827` | Tactical card & Side Panel container surface | 1.2:1 |
| `--bg-elevated` | `#1E293B` | Interactive control cards, modal dialogs, code inspectors | 1.9:1 |
| `--text-primary` | `#F8FAFC` | Crisp headline & primary telemetry readouts | 18.1:1 (AAA) |
| `--text-secondary` | `#94A3B8` | Metadata, DOM selectors, latency timestamps | 7.2:1 (AA) |
| `--accent-local` | `#10B981` | **On-Device Gemini Nano** active badge & privacy shield | 8.4:1 (AAA) |
| `--accent-cloud` | `#3B82F6` | **Firebase Cloud Gemini Fallback** & Firestore sync badge | 6.1:1 (AA) |
| `--threat-critical` | `#EF4444` | Phishing, credential harvesting, malicious redirect | 5.8:1 (AA) |
| `--threat-warning` | `#F59E0B` | Dark patterns (Sneak-into-basket, Roach Motel, Fake Timer) | 9.6:1 (AAA) |
| `--border-subtle` | `#334155` | Hairline structural grid dividers (`1px solid`) | — |

---

## 3. Typography & Hierarchy

- **UI & Telemetry Sans**: `'Inter'`, `-apple-system`, `BlinkMacSystemFont`, sans-serif.
  - Hero Metric / Risk Score: `2.25rem` (`36px`), `font-weight: 800`, `letter-spacing: -0.03em`, `font-variant-numeric: tabular-nums`.
  - Section Header: `1.125rem` (`18px`), `font-weight: 700`.
  - Body & Explanations: `0.875rem` (`14px`), `line-height: 1.5`.
- **DOM Selectors, SHA-256 Fingerprints & JSON Schemas**: `'JetBrains Mono'`, `'Fira Code'`, monospace (`0.75rem` / `12px`).

---

## 4. Layout & Component Architecture

1. **Top Tactical Bar (`64px` fixed height)**:
   - Brand Identity (`DOMShield Hybrid` + Manifest V3 Extension status pill).
   - **Firebase Hybrid Status Strip**:
     - `Inference Mode`: `PREFER_ON_DEVICE` | `PREFER_CLOUD` | `AUTO_HYBRID`
     - `App Check Token`: `VERIFIED (Debug/Attested)`
     - `Remote Config Policy`: `v2.4 (Threshold: 0.72)`
     - `Firestore Threat Sync`: `LIVE`
   - **Action Trigger**: `"Run Ground-Truth Benchmark (24 Scenarios)"` button.
2. **Main Split Workbench (12-Column Responsive CSS Grid)**:
   - **Columns 1–7 (`Target DOM Sandbox & Inspector`)**:
     - Scenario Switcher Tabs:
       1. *Scenario 1: Predatory E-Commerce Checkout (Dark Patterns — Handled 100% On-Device)*
       2. *Scenario 2: Multi-Domain OAuth & Typosquat Phishing (Escalates to Cloud Gemini + Firestore)*
       3. *Scenario 3: Subscription Roach-Motel & Obfuscated ToS Trap (Hybrid AST + Policy Check)*
       4. *Custom DOM / HTML Paste Inspector*
     - Live interactive DOM preview with visual overlay pins and `"Disarm All Threats"` action bar.
   - **Columns 8–12 (`Hybrid AI Firewall Telemetry & Chrome Side Panel`)**:
     - Real-time **Risk Score Gauge (`0–100`)** + Inference Path Breakdown (`On-Device Latency` vs `Cloud Fallback Latency`).
     - Structured JSON Threat Cards (`patternType`, `severity`, `domSelector`, `evidenceSnippet`, `remediationAction`, `inferenceSource`).
     - **Benchmark & Compliance Drawer**: Displays Precision, Recall, F1 Score, and Privacy Byte-Leakage Proof across the 24-case ground-truth corpus.

---

## 5. Accessibility & Modern Web Standards

- Full keyboard navigation (`Tab`, `Enter`, `Escape`) across scenario tabs, threat cards, and disarm actions.
- High-contrast focus rings (`2px solid #38BDF8`, `outline-offset: 2px`).
- Safe HTML rendering using the modern **Sanitizer API** (`Element.prototype.setHTML`) with deterministic fallback so untrusted DOM snippets in threat reports can never trigger XSS.
- Native Manifest V3 Chrome Extension architecture (`service-worker.js`, `content-script.js`, `sidepanel/sidepanel.html`) sharing the exact core hybrid detection schema with the web command center.
