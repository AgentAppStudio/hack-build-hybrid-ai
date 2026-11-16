export type PatternCategory =
  | "SNEAK_INTO_BASKET"
  | "FAKE_URGENCY_TIMER"
  | "HIDDEN_SUBSCRIPTION_TRAP"
  | "CONFIRMSHAMING_OPT_OUT"
  | "ROACH_MOTEL_CANCELLATION"
  | "BAIT_AND_SWITCH_PRICING"
  | "PHISHING_CREDENTIAL_HARVEST"
  | "CROSS_ORIGIN_TOKEN_EXFIL";

export type ThreatSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InferenceModeSetting =
  | "PREFER_ON_DEVICE"
  | "PREFER_CLOUD"
  | "AUTO_HYBRID";

export type ExecutedInferenceRoute =
  | "ON_DEVICE_NANO"
  | "CLOUD_GEMINI_FALLBACK";

export interface ThreatFinding {
  id: string;
  category: PatternCategory;
  severity: ThreatSeverity;
  score: number; // 0..100
  title: string;
  domSelector: string;
  elementTag: string;
  evidenceSnippet: string;
  explanation: string;
  remediationAction: string;
  neutralizable: boolean;
  requiresCloudCorrelation: boolean;
}

export interface RemoteConfigPolicy {
  policyVersion: string;
  escalationThreshold: number; // e.g., 0.72 confidence threshold before Cloud Fallback
  maxOnDeviceTokens: number;
  activeCloudModel: string; // e.g., "gemini-2.5-flash"
  activeOnDeviceModel: string; // e.g., "gemini-nano-v4-chrome-ai"
  strictAppCheck: boolean;
}

export interface FirebaseTelemetryStatus {
  sdkInitialized: boolean;
  inferenceMode: InferenceModeSetting;
  executedRoute: ExecutedInferenceRoute;
  appCheckVerified: boolean;
  appCheckTokenPreview: string;
  remoteConfigVersion: string;
  firestoreSynced: boolean;
  matchedCampaignId: string | null;
  cloudBytesSent: number;
  localTokensProcessed: number;
  onDeviceLatencyMs: number;
  cloudLatencyMs: number;
  escalationReason: string;
}

export interface HybridScanRequest {
  html: string;
  pageUrl: string;
  scenarioId?: string;
  modePreference?: InferenceModeSetting;
  appCheckToken?: string;
  promptApiOutput?: string; // Optional structured JSON output from browser LanguageModel API
}

export interface HybridScanResult {
  scanId: string;
  timestamp: string;
  pageUrl: string;
  domain: string;
  overallRiskScore: number; // 0..100
  verdict: "SAFE" | "DARK_PATTERN_WARNING" | "CRITICAL_PHISHING_BLOCK";
  summary: string;
  findings: ThreatFinding[];
  telemetry: FirebaseTelemetryStatus;
  sanitizedDisarmedHtml: string;
  disarmedActionsCount: number;
}

export interface GroundTruthScenario {
  id: string;
  title: string;
  pageUrl: string;
  expectedThreat: boolean;
  expectedCategories: PatternCategory[];
  expectedRouteInPreferOnDevice: ExecutedInferenceRoute;
  html: string;
}

export interface BenchmarkCaseResult {
  id: string;
  title: string;
  expectedThreat: boolean;
  predictedThreat: boolean;
  expectedCategories: PatternCategory[];
  detectedCategories: PatternCategory[];
  executedRoute: ExecutedInferenceRoute;
  cloudBytesSent: number;
  latencyMs: number;
  overallRiskScore: number;
  correctClassification: boolean;
}

export interface BenchmarkSummaryReport {
  timestamp: string;
  totalScenarios: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  onDevicePrivacyRatio: number; // Percentage of single-page scans resolved with 0 cloud bytes
  p95LatencyMs: number;
  cases: BenchmarkCaseResult[];
}
