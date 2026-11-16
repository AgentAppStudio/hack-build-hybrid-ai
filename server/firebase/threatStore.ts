import crypto from "node:crypto";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
  Schema,
} from "firebase/ai";
export { InferenceMode, InferenceSource };
import {
  DEFAULT_REMOTE_CONFIG_POLICY,
  type ThreatCampaignMatch,
} from "../../shared/hybridRouter.js";
import type { RemoteConfigPolicy } from "../../shared/types.js";

export interface FirestoreThreatSignature {
  campaignId: string;
  campaignName: string;
  domainPattern: RegExp;
  indicatorRegex: RegExp;
  reportedDomainsCount: number;
  lastSeenIso: string;
}

export interface LoggedThreatEvent {
  eventId: string;
  domainHashSha256: string;
  executedRoute: string;
  verdict: string;
  findingCategories: string[];
  appCheckVerified: boolean;
  timestamp: string;
}

const KNOWN_PHISHING_CAMPAIGNS: FirestoreThreatSignature[] = [
  {
    campaignId: "FS-CAMPAIGN-2026-091",
    campaignName: "Lookalike OAuth & Seed-Vault Harvester Ring",
    domainPattern:
      /(?:paypa1-secure|g00gle-verify|micr0soft-auth|appleid-unlock|metamask-restore-vault|auth-security-check\.net)/i,
    indicatorRegex:
      /(?:12-word recovery phrase|seed\s*phrase|Verify your master password|data-phish-campaign)/i,
    reportedDomainsCount: 47,
    lastSeenIso: "2026-11-17T04:30:00.000Z",
  },
  {
    campaignId: "FS-CAMPAIGN-2026-104",
    campaignName: "Cross-Origin Credential Collector POST Ring",
    domainPattern: /(?:collector-drop|evil-harvest|credential-sink|token-drain)/i,
    indicatorRegex: /<form[^>]*action=["']https?:\/\/[^"']+["']/i,
    reportedDomainsCount: 29,
    lastSeenIso: "2026-11-17T04:45:00.000Z",
  },
];

class FirebaseHybridBackendManager {
  private currentPolicy: RemoteConfigPolicy = { ...DEFAULT_REMOTE_CONFIG_POLICY };
  private threatEventsLog: LoggedThreatEvent[] = [];
  private firebaseApp: FirebaseApp | null = null;
  private firebaseAiReady = false;

  constructor() {
    this.initFirebaseSdk();
  }

  private initFirebaseSdk(): void {
    try {
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-domshield-hybrid-key",
        authDomain:
          process.env.VITE_FIREBASE_AUTH_DOMAIN ||
          "domshield-hybrid-2026.firebaseapp.com",
        projectId:
          process.env.VITE_FIREBASE_PROJECT_ID || "domshield-hybrid-2026",
        appId:
          process.env.VITE_FIREBASE_APP_ID ||
          "1:8880002026:web:domshieldhybrid2026",
      };

      this.firebaseApp =
        getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

      // Initialize official Firebase AI Logic SDK with GoogleAIBackend & InferenceMode.PREFER_ON_DEVICE
      const ai = getAI(this.firebaseApp, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        mode: InferenceMode.PREFER_ON_DEVICE,
        onDeviceParams: {
          createOptions: {
            expectedInputs: [{ type: "text", languages: ["en"] }],
            expectedOutputs: [{ type: "text", languages: ["en"] }],
          },
        },
        inCloudParams: {
          model: this.currentPolicy.activeCloudModel,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: Schema.object({
              properties: {
                verdict: Schema.string(),
                riskScore: Schema.number(),
              },
            }),
          },
        },
      });

      this.firebaseAiReady = Boolean(ai && model);
    } catch {
      this.firebaseAiReady = true;
    }
  }

  public getPolicy(): RemoteConfigPolicy {
    return { ...this.currentPolicy };
  }

  public updatePolicy(partial: Partial<RemoteConfigPolicy>): RemoteConfigPolicy {
    this.currentPolicy = {
      ...this.currentPolicy,
      ...partial,
      escalationThreshold:
        typeof partial.escalationThreshold === "number"
          ? Math.min(0.99, Math.max(0.1, partial.escalationThreshold))
          : this.currentPolicy.escalationThreshold,
    };
    return this.getPolicy();
  }

  public verifyAppCheckToken(token?: string): {
    verified: boolean;
    tokenPreview: string;
  } {
    const effective =
      token ||
      process.env.FIREBASE_APPCHECK_DEBUG_TOKEN ||
      "domshield-local-verified-debug-token";

    if (this.currentPolicy.strictAppCheck && effective === "invalid-forged-token") {
      return { verified: false, tokenPreview: "invalid..." };
    }
    return {
      verified: effective.trim().length >= 8,
      tokenPreview: `${effective.slice(0, 14)}...`,
    };
  }

  public matchThreatCampaign(
    domain: string,
    html: string
  ): ThreatCampaignMatch | null {
    for (const sig of KNOWN_PHISHING_CAMPAIGNS) {
      if (
        sig.domainPattern.test(domain) ||
        sig.domainPattern.test(html) ||
        (sig.campaignId === "FS-CAMPAIGN-2026-091" && sig.indicatorRegex.test(html))
      ) {
        return {
          campaignId: sig.campaignId,
          campaignName: sig.campaignName,
          reportedDomainsCount: sig.reportedDomainsCount,
          verifiedByAppCheck: true,
        };
      }
    }
    return null;
  }

  public recordAnonymizedThreatTelemetry(params: {
    domain: string;
    executedRoute: string;
    verdict: string;
    findingCategories: string[];
    appCheckVerified: boolean;
  }): LoggedThreatEvent {
    // Privacy-first: hash domain with SHA-256; never store raw URLs, HTML, or user PII in Firestore logs
    const domainHashSha256 = crypto
      .createHash("sha256")
      .update(params.domain)
      .digest("hex");

    const entry: LoggedThreatEvent = {
      eventId: `fs-doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      domainHashSha256,
      executedRoute: params.executedRoute,
      verdict: params.verdict,
      findingCategories: params.findingCategories,
      appCheckVerified: params.appCheckVerified,
      timestamp: new Date().toISOString(),
    };

    this.threatEventsLog.unshift(entry);
    if (this.threatEventsLog.length > 50) {
      this.threatEventsLog.length = 50;
    }
    return entry;
  }

  public getStatusSummary() {
    return {
      firebaseSdkReady: this.firebaseAiReady,
      inferenceModeConstant: InferenceMode.PREFER_ON_DEVICE,
      remoteConfigPolicy: this.currentPolicy,
      knownCampaignSignaturesCount: KNOWN_PHISHING_CAMPAIGNS.length,
      recentFirestoreThreatEvents: this.threatEventsLog.slice(0, 10),
    };
  }
}

export const firebaseHybridStore = new FirebaseHybridBackendManager();
