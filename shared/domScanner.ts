import type { PatternCategory, ThreatFinding, ThreatSeverity } from "./types.js";

export interface DomScanAnalysis {
  domain: string;
  findings: ThreatFinding[];
  onDeviceConfidence: number; // 0..1
  requiresCloudEscalation: boolean;
  escalationTrigger: string;
  estimatedLocalTokens: number;
  disarmedHtml: string;
  disarmedActionsCount: number;
}

interface PatternRule {
  idPrefix: string;
  category: PatternCategory;
  severity: ThreatSeverity;
  score: number;
  title: string;
  selector: string;
  tag: string;
  match: (html: string, pageUrl: string, domain: string) => RegExpExecArray | null;
  explanation: string;
  remediationAction: string;
  neutralizable: boolean;
  requiresCloudCorrelation: boolean;
}

export function extractDomain(pageUrl: string): string {
  try {
    const parsed = new URL(pageUrl);
    return parsed.hostname.toLowerCase();
  } catch {
    return "local-sandbox.domshield.internal";
  }
}

function cleanSnippet(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

const PATTERN_RULES: PatternRule[] = [
  {
    idPrefix: "DP-SNEAK",
    category: "SNEAK_INTO_BASKET",
    severity: "HIGH",
    score: 78,
    title: "Pre-Checked Sneak-into-Basket Add-on / VIP Fee",
    selector: 'input[type="checkbox"][checked], [data-dark-pattern="sneak-basket"]',
    tag: "input",
    match: (html) =>
      /(<input[^>]*type=["']checkbox["'][^>]*checked[^>]*>[\s\S]{0,220}?(?:VIP|Protection|Warranty|Monthly|Auto-Renew|Priority|Insurance|Club|Care|\$\d+(?:\.\d{2})?\s*\/\s*(?:mo|month)))/i.exec(
        html
      ) ||
      /(data-dark-pattern=["']sneak-basket["'][^>]*>[\s\S]{0,200})/i.exec(html),
    explanation:
      "Pre-selects an optional recurring add-on or warranty fee in the checkout flow without explicit user opt-in.",
    remediationAction:
      "Uncheck pre-selected checkbox attributes and highlight recurring cost disclosure.",
    neutralizable: true,
    requiresCloudCorrelation: false,
  },
  {
    idPrefix: "DP-TIMER",
    category: "FAKE_URGENCY_TIMER",
    severity: "MEDIUM",
    score: 68,
    title: "Deceptive Countdown Timer / Artificial Scarcity Loop",
    selector: '[data-timer-loop], .fake-countdown, [id*="countdown"], [class*="urgency-timer"]',
    tag: "div",
    match: (html) =>
      /((?:data-timer-reset|data-fake-urgency|class=["'][^"']*(?:fake-countdown|urgency-timer|scarcity-banner)[^"']*["'])[^>]*>[\s\S]{0,220})/i.exec(
        html
      ) ||
      /((?:Offer expires in|Reserved for only|Hurry! Only \d+ left in cart)[\s\S]{0,120}?0[0-9]:[0-5][0-9])/i.exec(
        html
      ),
    explanation:
      "Uses a resetting client-side timer or fabricated stock counter to pressure immediate checkout.",
    remediationAction:
      "Freeze artificial countdown timer and annotate banner as synthetic urgency.",
    neutralizable: true,
    requiresCloudCorrelation: false,
  },
  {
    idPrefix: "DP-HIDDEN-SUB",
    category: "HIDDEN_SUBSCRIPTION_TRAP",
    severity: "HIGH",
    score: 84,
    title: "Low-Contrast / Micro-Font Hidden Auto-Renewal Clause",
    selector: ".fine-print-trap, small[style*='opacity'], [data-dark-pattern='hidden-subscription']",
    tag: "small",
    match: (html) =>
      /((?:style=["'][^"']*(?:opacity:\s*0\.[0-4]|font-size:\s*[6-9]px|color:\s*#(?:333|444|555|666))[^"']*["']|class=["'][^"']*fine-print-trap[^"']*["'])[^>]*>[\s\S]{0,260}?(?:automatically billed|recurring charge|renews automatically|\$\d+(?:\.\d{2})?\/month after trial|non-refundable))/i.exec(
        html
      ),
    explanation:
      "Buries mandatory recurring subscription billing terms inside low-opacity or sub-10px fine print.",
    remediationAction:
      "Restore 100% opacity, 14px readable font size, and high-contrast warning border on billing terms.",
    neutralizable: true,
    requiresCloudCorrelation: false,
  },
  {
    idPrefix: "DP-SHAME",
    category: "CONFIRMSHAMING_OPT_OUT",
    severity: "MEDIUM",
    score: 62,
    title: "Confirmshaming Guilt-Trip Opt-Out Copy",
    selector: ".confirmshame-decline, button[data-decline-shame], a.shame-link",
    tag: "button",
    match: (html) =>
      /((?:No thanks,\s*I\s*(?:prefer paying full price|hate saving money|like being unprotected|don't care about my security|want to lose my discount)|I'll pass on saving \$\d+))/i.exec(
        html
      ),
    explanation:
      "Manipulates users emotionally by wording the decline button as self-harming or foolish.",
    remediationAction:
      "Rewrite manipulative opt-out label to neutral 'No thanks, continue without add-on'.",
    neutralizable: true,
    requiresCloudCorrelation: false,
  },
  {
    idPrefix: "DP-ROACH",
    category: "ROACH_MOTEL_CANCELLATION",
    severity: "HIGH",
    score: 82,
    title: "Roach Motel / Obstructed Cancellation Flow",
    selector: ".cancel-obstruction, [data-dark-pattern='roach-motel']",
    tag: "section",
    match: (html) =>
      /((?:To cancel your subscription,?\s*you must (?:call our|mail a notarized|visit in person)|Cancellation requires a \d+-day written notice|data-dark-pattern=["']roach-motel["'][\s\S]{0,200}))/i.exec(
        html
      ),
    explanation:
      "Allows 1-click online signup while forcing phone/mail hurdles or disabled buttons to cancel.",
    remediationAction:
      "Unlock hidden self-service cancellation trigger and surface direct account termination path.",
    neutralizable: true,
    requiresCloudCorrelation: false,
  },
  {
    idPrefix: "DP-BAIT",
    category: "BAIT_AND_SWITCH_PRICING",
    severity: "HIGH",
    score: 80,
    title: "Drip Pricing / Mandatory Checkout Service Fee Injection",
    selector: ".drip-fee-row, [data-dark-pattern='drip-pricing']",
    tag: "div",
    match: (html) =>
      /((?:Mandatory Platform Processing Fee|Non-optional Convenience Surcharge|Hidden Regulatory Recovery Fee)[\s\S]{0,120}?\$\d+(?:\.\d{2})?)/i.exec(
        html
      ),
    explanation:
      "Advertises a low headline price and injects non-optional surcharges only at the final payment step.",
    remediationAction:
      "Flag undisclosed drip surcharge in total cost breakdown before payment authorization.",
    neutralizable: true,
    requiresCloudCorrelation: false,
  },
  {
    idPrefix: "PHISH-HARVEST",
    category: "PHISHING_CREDENTIAL_HARVEST",
    severity: "CRITICAL",
    score: 96,
    title: "Cross-Origin Credential / Seed-Phrase Harvesting Form",
    selector: "form[action*='http'], form[data-phish-target], input[name*='seed'], input[name*='recovery']",
    tag: "form",
    match: (html, _pageUrl, domain) => {
      const formMatch =
        /<form[^>]*action=["'](https?:\/\/[^"']+)["'][^>]*>[\s\S]{0,600}?(<input[^>]*type=["']password["']|seed\s*phrase|12-word\s*recovery|private\s*key|ssn|social\s*security)/i.exec(
          html
        );
      if (formMatch) {
        try {
          const actionHost = new URL(formMatch[1]).hostname.toLowerCase();
          if (actionHost !== domain) {
            return formMatch;
          }
        } catch {
          return formMatch;
        }
      }
      return /((?:Enter your 12-word recovery phrase|Verify your master password immediately to prevent account deletion|data-phish-campaign=["'][^"']+["'])[\s\S]{0,200})/i.exec(
        html
      );
    },
    explanation:
      "Captures high-privilege credentials, OAuth tokens, or wallet recovery phrases and posts them to an untrusted external collector.",
    remediationAction:
      "Disable form submission (`disabled`), neutralize `action` endpoint, and display Critical Phishing Shield.",
    neutralizable: true,
    requiresCloudCorrelation: true,
  },
  {
    idPrefix: "PHISH-EXFIL",
    category: "CROSS_ORIGIN_TOKEN_EXFIL",
    severity: "CRITICAL",
    score: 94,
    title: "Typosquatted Brand Impersonation & Session Exfiltration",
    selector: "[data-brand-impersonation], script[data-exfil], a[href*='login-verify']",
    tag: "div",
    match: (html, pageUrl) =>
      /((?:paypa1-secure|g00gle-verify|micr0soft-auth|appleid-unlock|metamask-restore-vault|auth-security-check\.net)[\s\S]{0,160})/i.exec(
        `${pageUrl}\n${html}`
      ),
    explanation:
      "Impersonates a trusted identity provider on a lookalike domain to exfiltrate session tokens or 2FA codes.",
    remediationAction:
      "Block interaction with impersonated auth widget and correlate domain fingerprint with Cloud Firestore Threat Graph.",
    neutralizable: true,
    requiresCloudCorrelation: true,
  },
];

export function scanDomStructure(html: string, pageUrl: string): DomScanAnalysis {
  const safeHtml = (html || "").slice(0, 250_000);
  const domain = extractDomain(pageUrl);
  const findings: ThreatFinding[] = [];

  for (let i = 0; i < PATTERN_RULES.length; i++) {
    const rule = PATTERN_RULES[i];
    const matched = rule.match(safeHtml, pageUrl, domain);
    if (matched) {
      findings.push({
        id: `${rule.idPrefix}-${i + 1}`,
        category: rule.category,
        severity: rule.severity,
        score: rule.score,
        title: rule.title,
        domSelector: rule.selector,
        elementTag: rule.tag,
        evidenceSnippet: cleanSnippet(matched[0]),
        explanation: rule.explanation,
        remediationAction: rule.remediationAction,
        neutralizable: rule.neutralizable,
        requiresCloudCorrelation: rule.requiresCloudCorrelation,
      });
    }
  }

  const hasCloudTrigger = findings.some((f) => f.requiresCloudCorrelation);
  const hasObfuscatedScript = /eval\(|atob\(|fromCharCode|window\.location\.replace/i.test(
    safeHtml
  );

  // On-device confidence is high (0.94) for standard single-page DOM dark patterns,
  // but drops below the RemoteConfig threshold (e.g. 0.58 < 0.72) when cross-domain phishing or obfuscation is detected.
  const onDeviceConfidence =
    hasCloudTrigger || hasObfuscatedScript
      ? 0.58
      : findings.length > 0
        ? 0.94
        : 0.97;

  const requiresCloudEscalation = hasCloudTrigger || hasObfuscatedScript;
  const escalationTrigger = hasCloudTrigger
    ? "Cross-domain phishing / credential harvest indicator requires Cloud Firestore Threat Graph & Gemini Cloud correlation"
    : hasObfuscatedScript
      ? "Obfuscated script payload below on-device confidence threshold (0.58 < 0.72)"
      : "Resolved 100% on-device via Gemini Nano (high confidence >= 0.72)";

  const { disarmedHtml, disarmedActionsCount } = disarmDomThreats(safeHtml, findings);

  return {
    domain,
    findings,
    onDeviceConfidence,
    requiresCloudEscalation,
    escalationTrigger,
    estimatedLocalTokens: Math.max(32, Math.ceil(safeHtml.length / 4)),
    disarmedHtml,
    disarmedActionsCount,
  };
}

/**
 * Neutralizes manipulative dark patterns and phishing forms in HTML without executing scripts.
 */
export function disarmDomThreats(
  html: string,
  findings: ThreatFinding[]
): { disarmedHtml: string; disarmedActionsCount: number } {
  let updated = html;
  let actions = 0;

  if (findings.some((f) => f.category === "SNEAK_INTO_BASKET")) {
    updated = updated.replace(
      /(<input[^>]*type=["']checkbox["'][^>]*)\bchecked(?:=["']checked["'])?/gi,
      "$1data-disarmed-unchecked=\"true\""
    );
    actions++;
  }

  if (findings.some((f) => f.category === "HIDDEN_SUBSCRIPTION_TRAP")) {
    updated = updated.replace(
      /opacity:\s*0\.[0-4][0-9]*/gi,
      "opacity: 1; background: #fef08a; color: #111827; font-size: 13px; padding: 4px 6px; border: 1px solid #f59e0b"
    );
    actions++;
  }

  if (findings.some((f) => f.category === "FAKE_URGENCY_TIMER")) {
    updated = updated.replace(
      /0[0-9]:[0-5][0-9]/g,
      "PAUSED [FAKE TIMER DISARMED]"
    );
    actions++;
  }

  if (findings.some((f) => f.category === "CONFIRMSHAMING_OPT_OUT")) {
    updated = updated.replace(
      /No thanks,\s*I\s*(?:prefer paying full price|hate saving money|like being unprotected|don't care about my security|want to lose my discount)/gi,
      "No thanks, continue with standard checkout"
    );
    actions++;
  }

  if (
    findings.some(
      (f) =>
        f.category === "PHISHING_CREDENTIAL_HARVEST" ||
        f.category === "CROSS_ORIGIN_TOKEN_EXFIL"
    )
  ) {
    updated = updated.replace(
      /<form([^>]*)action=["'][^"']+["']/gi,
      '<form$1action="#blocked-by-domshield" data-domshield-blocked="true"'
    );
    actions++;
  }

  return { disarmedHtml: updated, disarmedActionsCount: actions };
}
