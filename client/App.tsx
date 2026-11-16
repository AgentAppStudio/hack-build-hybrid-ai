import React, { useEffect, useRef, useState } from "react";
import type {
  BenchmarkSummaryReport,
  GroundTruthScenario,
  HybridScanResult,
  InferenceModeSetting,
} from "../shared/types.js";
import { renderSanitizedHtml } from "./sanitizeHtml.js";

export function App(): React.ReactElement {
  const [scenarios, setScenarios] = useState<GroundTruthScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    "scenario-1-predatory-checkout"
  );
  const [pageUrl, setPageUrl] = useState<string>(
    "https://flashdealz-pro-store.example/checkout"
  );
  const [htmlInput, setHtmlInput] = useState<string>("");
  const [inferenceMode, setInferenceMode] =
    useState<InferenceModeSetting>("PREFER_ON_DEVICE");
  const [scanResult, setScanResult] = useState<HybridScanResult | null>(null);
  const [isDisarmed, setIsDisarmed] = useState<boolean>(false);
  const [benchmarkReport, setBenchmarkReport] =
    useState<BenchmarkSummaryReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const sandboxContainerRef = useRef<HTMLDivElement | null>(null);

  async function triggerScan(
    targetHtml: string,
    targetUrl: string,
    mode: InferenceModeSetting
  ) {
    setLoading(true);
    setIsDisarmed(false);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firebase-AppCheck": "domshield-local-verified-debug-token",
        },
        body: JSON.stringify({
          html: targetHtml,
          pageUrl: targetUrl,
          modePreference: mode,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as HybridScanResult;
        setScanResult(data);
        renderSanitizedHtml(sandboxContainerRef.current, targetHtml);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/scenarios");
      if (res.ok) {
        const data = (await res.json()) as { scenarios: GroundTruthScenario[] };
        setScenarios(data.scenarios);
        const first = data.scenarios[0];
        if (first) {
          setActiveScenarioId(first.id);
          setPageUrl(first.pageUrl);
          setHtmlInput(first.html);
          await triggerScan(first.html, first.pageUrl, "PREFER_ON_DEVICE");
        }
      }
    })();
  }, []);

  function handleSelectScenario(sc: GroundTruthScenario) {
    setActiveScenarioId(sc.id);
    setPageUrl(sc.pageUrl);
    setHtmlInput(sc.html);
    void triggerScan(sc.html, sc.pageUrl, inferenceMode);
  }

  function handleDisarmNow() {
    if (!scanResult) return;
    setIsDisarmed(true);
    renderSanitizedHtml(
      sandboxContainerRef.current,
      scanResult.sanitizedDisarmedHtml
    );
  }

  async function handleRunBenchmark() {
    const res = await fetch("/api/benchmark/run", { method: "POST" });
    if (res.ok) {
      const report = (await res.json()) as BenchmarkSummaryReport;
      setBenchmarkReport(report);
    }
  }

  const route = scanResult?.telemetry.executedRoute || "ON_DEVICE_NANO";
  const cloudBytes = scanResult?.telemetry.cloudBytesSent ?? 0;

  return (
    <div>
      <header className="topbar" data-testid="top-tactical-bar">
        <div className="brand-group">
          <div className="shield-logo">DS</div>
          <div>
            <h1 className="brand-title">DOMShield Hybrid</h1>
            <p className="brand-subtitle">
              Zero-Latency On-Device Gemini Nano + Firebase AI Logic Anti-Scam &amp; Dark-Pattern Firewall
            </p>
          </div>
        </div>

        <div className="telemetry-pills">
          <span
            className={`pill ${route === "ON_DEVICE_NANO" ? "pill-local" : "pill-cloud"}`}
            data-testid="active-route-pill"
          >
            Route: {route}
          </span>
          <span className="pill pill-local" data-testid="privacy-bytes-pill">
            Cloud Payload: {cloudBytes} Bytes{" "}
            {cloudBytes === 0 ? "(100% On-Device Private)" : "(Anonymized Hash)"}
          </span>
          <span className="pill" data-testid="appcheck-status-pill">
            Firebase App Check:{" "}
            {scanResult?.telemetry.appCheckVerified ? "VERIFIED" : "PENDING"}
          </span>
          <span className="pill" data-testid="remoteconfig-status-pill">
            Remote Config: {scanResult?.telemetry.remoteConfigVersion || "rc-hybrid-v2.4.0"}
          </span>
          <button
            type="button"
            className="btn-benchmark"
            data-testid="run-benchmark-btn"
            onClick={() => void handleRunBenchmark()}
          >
            Run 24-Scenario Ground-Truth Benchmark
          </button>
        </div>
      </header>

      <main className="workbench">
        {/* LEFT COLUMN: LIVE DOM SANDBOX & SCENARIO INSPECTOR */}
        <section className="panel" aria-label="Live Target DOM Sandbox">
          <div className="panel-header">
            <h2 className="panel-title">
              1. Interactive Storefront &amp; Phishing DOM Arena (5s Visual Hook)
            </h2>
            <select
              aria-label="Hybrid Inference Mode"
              data-testid="inference-mode-select"
              value={inferenceMode}
              onChange={(e) => {
                const nextMode = e.target.value as InferenceModeSetting;
                setInferenceMode(nextMode);
                void triggerScan(htmlInput, pageUrl, nextMode);
              }}
              style={{
                background: "#1e293b",
                color: "#f8fafc",
                border: "1px solid #334155",
                padding: "6px 10px",
                borderRadius: "6px",
                fontWeight: 700,
              }}
            >
              <option value="PREFER_ON_DEVICE">
                Mode: InferenceMode.PREFER_ON_DEVICE (Default)
              </option>
              <option value="AUTO_HYBRID">Mode: AUTO_HYBRID</option>
              <option value="PREFER_CLOUD">
                Mode: PREFER_CLOUD (Force Cloud Gemini)
              </option>
            </select>
          </div>

          <div className="scenario-tabs" role="tablist">
            {scenarios.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                role="tab"
                aria-selected={activeScenarioId === sc.id}
                data-testid={`scenario-tab-${idx + 1}`}
                className={`tab-btn ${activeScenarioId === sc.id ? "active" : ""}`}
                onClick={() => handleSelectScenario(sc)}
              >
                {sc.title}
              </button>
            ))}
          </div>

          <div className="url-bar">
            <span data-testid="inspected-url-readout">Target URL: {pageUrl}</span>
            <span>
              {isDisarmed
                ? "✅ DOM THREATS NEUTRALIZED"
                : `${scanResult?.findings.length ?? 0} Active Threat Vector(s)`}
            </span>
          </div>

          <div
            ref={sandboxContainerRef}
            data-testid="live-dom-sandbox"
            className={`sandbox-stage ${isDisarmed ? "disarmed" : ""}`}
          />

          <div className="action-bar">
            <button
              type="button"
              className="btn-primary"
              data-testid="rescan-dom-btn"
              disabled={loading}
              onClick={() => void triggerScan(htmlInput, pageUrl, inferenceMode)}
            >
              {loading ? "Scanning DOM..." : "Re-Scan Live DOM"}
            </button>

            <button
              type="button"
              className="btn-disarm"
              data-testid="disarm-threats-btn"
              onClick={handleDisarmNow}
            >
              ⚡ Disarm All Dark Patterns &amp; Phishing Forms ({scanResult?.disarmedActionsCount ?? 0} Fixes)
            </button>
          </div>

          <div style={{ marginTop: "18px" }}>
            <label
              htmlFor="custom-dom-input"
              style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}
            >
              Custom DOM / HTML Inspector (Paste any checkout or login HTML to test Hybrid AI routing):
            </label>
            <textarea
              id="custom-dom-input"
              data-testid="custom-dom-textarea"
              className="custom-textarea"
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: HYBRID AI FIREWALL TELEMETRY & CHROME EXTENSION SIDE PANEL */}
        <section className="panel" aria-label="Hybrid AI Firewall Telemetry">
          <div className="panel-header">
            <h2 className="panel-title">
              2. Hybrid AI Firewall Telemetry &amp; Extension Side Panel
            </h2>
            <span className="pill pill-local">Manifest V3 Ready</span>
          </div>

          {scanResult && (
            <>
              <div className="score-banner" data-testid="verdict-banner">
                <div
                  className={`score-Dial verdict-${scanResult.verdict}`}
                  data-testid="risk-score-value"
                >
                  {scanResult.overallRiskScore}/100
                </div>
                <div>
                  <div
                    style={{ fontWeight: 800, fontSize: "15px" }}
                    data-testid="verdict-label"
                  >
                    Verdict: {scanResult.verdict}
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#cbd5e1",
                    }}
                    data-testid="verdict-summary"
                  >
                    {scanResult.summary}
                  </p>
                </div>
              </div>

              <div className="telemetry-grid">
                <div className="metric-box">
                  <div className="metric-label">Executed Inference Path</div>
                  <div className="metric-value" data-testid="telemetry-route">
                    {scanResult.telemetry.executedRoute}
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Latency (On-Device / Cloud)</div>
                  <div className="metric-value" data-testid="telemetry-latency">
                    {scanResult.telemetry.onDeviceLatencyMs}ms /{" "}
                    {scanResult.telemetry.cloudLatencyMs}ms
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Cloud Bytes Transmitted</div>
                  <div className="metric-value" data-testid="telemetry-bytes">
                    {scanResult.telemetry.cloudBytesSent} B
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Firestore Campaign Match</div>
                  <div className="metric-value" data-testid="telemetry-campaign">
                    {scanResult.telemetry.matchedCampaignId || "NONE (Local Only)"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "12px",
                }}
              >
                <strong>Routing Decision:</strong>{" "}
                {scanResult.telemetry.escalationReason}
              </div>

              <h3 style={{ fontSize: "14px", margin: "12px 0 8px" }}>
                Detected DOM Threat Findings ({scanResult.findings.length})
              </h3>

              <div data-testid="findings-list">
                {scanResult.findings.length === 0 ? (
                  <div className="finding-card" style={{ borderLeftColor: "#10b981" }}>
                    <strong>✅ Clean DOM Verified</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      No deceptive dark patterns, hidden subscription clauses, or cross-origin credential harvesters detected.
                    </p>
                  </div>
                ) : (
                  scanResult.findings.map((f) => (
                    <div
                      key={f.id}
                      data-testid="finding-card"
                      className={`finding-card ${f.severity === "CRITICAL" ? "critical" : ""}`}
                    >
                      <div className="finding-header">
                        <span>
                          [{f.category}] {f.title}
                        </span>
                        <span>
                          {f.severity} ({f.score}/100)
                        </span>
                      </div>
                      <code className="selector-code">{f.domSelector}</code>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#cbd5e1" }}>
                        {f.explanation}
                      </p>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#34d399",
                          fontWeight: 600,
                        }}
                      >
                        Countermeasure: {f.remediationAction}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {benchmarkReport && (
            <div className="benchmark-card" data-testid="benchmark-report-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "14px", color: "#60a5fa" }}>
                  📊 24-Scenario Ground-Truth Benchmark Verified
                </strong>
                <span className="pill pill-local">
                  TP={benchmarkReport.truePositives} | TN={benchmarkReport.trueNegatives} | FP={benchmarkReport.falsePositives} | FN={benchmarkReport.falseNegatives}
                </span>
              </div>
              <div className="benchmark-stats">
                <div className="metric-box">
                  <div className="metric-label">Precision</div>
                  <div className="metric-value" data-testid="bench-precision">
                    {(benchmarkReport.precision * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Recall</div>
                  <div className="metric-value" data-testid="bench-recall">
                    {(benchmarkReport.recall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">F1 Score</div>
                  <div className="metric-value" data-testid="bench-f1">
                    {(benchmarkReport.f1Score * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">On-Device Privacy</div>
                  <div className="metric-value" data-testid="bench-privacy">
                    {(benchmarkReport.onDevicePrivacyRatio * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
