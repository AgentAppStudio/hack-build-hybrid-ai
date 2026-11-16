import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executeHybridDomScan } from "../shared/hybridRouter.js";
import type { HybridScanRequest, RemoteConfigPolicy } from "../shared/types.js";
import { firebaseHybridStore } from "./firebase/threatStore.js";
import {
  INTERACTIVE_DEMO_SCENARIOS,
  runGroundTruthBenchmark,
} from "./benchmark/groundTruthCorpus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, "../client");

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Firebase-AppCheck",
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 500_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export function createDomShieldServer(): http.Server {
  return http.createServer(async (req, res) => {
    const urlObj = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = urlObj.pathname;

    if (req.method === "OPTIONS") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(res, 200, {
        status: "ok",
        service: "domshield-hybrid-firewall",
        firebase: firebaseHybridStore.getStatusSummary(),
      });
      return;
    }

    if (pathname === "/api/scenarios" && req.method === "GET") {
      sendJson(res, 200, {
        scenarios: INTERACTIVE_DEMO_SCENARIOS,
      });
      return;
    }

    if (pathname === "/api/firebase/status" && req.method === "GET") {
      sendJson(res, 200, firebaseHybridStore.getStatusSummary());
      return;
    }

    if (pathname === "/api/firebase/policy" && req.method === "POST") {
      try {
        const body = await readJsonBody<Partial<RemoteConfigPolicy>>(req);
        const updated = firebaseHybridStore.updatePolicy(body);
        sendJson(res, 200, { policy: updated });
      } catch (err) {
        sendJson(res, 400, {
          error: err instanceof Error ? err.message : "Invalid policy payload",
        });
      }
      return;
    }

    if (pathname === "/api/scan" && req.method === "POST") {
      try {
        const body = await readJsonBody<HybridScanRequest>(req);
        if (!body.html || typeof body.html !== "string") {
          sendJson(res, 400, { error: "Missing required 'html' field" });
          return;
        }

        const headerToken = req.headers["x-firebase-appcheck"];
        const token =
          typeof headerToken === "string" ? headerToken : body.appCheckToken;
        const appCheck = firebaseHybridStore.verifyAppCheckToken(token);

        if (!appCheck.verified) {
          sendJson(res, 401, {
            error: "Firebase App Check attestation rejected token",
          });
          return;
        }

        const policy = firebaseHybridStore.getPolicy();
        const result = executeHybridDomScan(
          {
            ...body,
            appCheckToken: token || "domshield-local-verified-debug-token",
          },
          policy,
          (domain, html) => firebaseHybridStore.matchThreatCampaign(domain, html)
        );

        if (result.telemetry.executedRoute === "CLOUD_GEMINI_FALLBACK") {
          firebaseHybridStore.recordAnonymizedThreatTelemetry({
            domain: result.domain,
            executedRoute: result.telemetry.executedRoute,
            verdict: result.verdict,
            findingCategories: result.findings.map((f) => f.category),
            appCheckVerified: appCheck.verified,
          });
        }

        sendJson(res, 200, result);
      } catch (err) {
        sendJson(res, 400, {
          error: err instanceof Error ? err.message : "Invalid scan request",
        });
      }
      return;
    }

    if (
      pathname === "/api/benchmark/run" &&
      (req.method === "POST" || req.method === "GET")
    ) {
      const report = runGroundTruthBenchmark();
      sendJson(res, 200, report);
      return;
    }

    // Serve static frontend build in production/E2E
    if (fs.existsSync(CLIENT_DIST)) {
      const safePath =
        pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const candidate = path.join(CLIENT_DIST, safePath);
      const targetFile =
        fs.existsSync(candidate) && fs.statSync(candidate).isFile()
          ? candidate
          : path.join(CLIENT_DIST, "index.html");

      if (fs.existsSync(targetFile)) {
        const ext = path.extname(targetFile).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".html": "text/html; charset=utf-8",
          ".js": "application/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".json": "application/json; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
        };
        res.writeHead(200, {
          "Content-Type": mimeMap[ext] || "application/octet-stream",
        });
        fs.createReadStream(targetFile).pipe(res);
        return;
      }
    }

    sendJson(res, 404, { error: "Not found" });
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 3000);
  const server = createDomShieldServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(
      `🛡️  DOMShield Hybrid Server listening on http://127.0.0.1:${port}`
    );
  });
}
