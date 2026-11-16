import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
} from "firebase/ai";
import {
  ensureOnDeviceLanguageModelProvider,
  type LocalEngineBackendType,
} from "./localNanoProvider.js";

export interface RealOnDeviceInferenceResult {
  inferenceSource: "on_device" | "in_cloud";
  backendType: LocalEngineBackendType;
  availabilityStatus: "available" | "downloadable" | "downloading" | "unavailable";
  reasoningJson: string;
  latencyMs: number;
}

let cachedApp: FirebaseApp | null = null;

function getOrCreateFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0]!;
    return cachedApp;
  }
  cachedApp = initializeApp({
    apiKey: "demo-domshield-hybrid-key",
    authDomain: "domshield-hybrid-2026.firebaseapp.com",
    projectId: "domshield-hybrid-2026",
    appId: "1:8880002026:web:domshieldhybrid2026",
  });
  return cachedApp;
}

/**
 * Runs real on-device inference through the official Firebase AI Logic SDK v3.1.0 (`firebase@13.4.0`)
 * `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, onDeviceParams, inCloudParams })`
 * which delegates to `globalThis.LanguageModel` (`ChromeAdapterImpl`) in browser contexts and sets
 * `result.response.inferenceSource === InferenceSource.ON_DEVICE` ("on_device").
 */
export async function runFirebaseOnDeviceGenerateContent(
  html: string,
  pageUrl: string
): Promise<RealOnDeviceInferenceResult> {
  const t0 = performance.now();
  const providerDiag = await ensureOnDeviceLanguageModelProvider();
  const app = getOrCreateFirebaseApp();
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  const hybridModel = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      },
    },
    inCloudParams: {
      model: "gemini-2.5-flash",
    },
  });

  await hybridModel.initializeDeviceModel();

  const prompt = `URL: ${pageUrl}\nInspect DOM for manipulative dark patterns and phishing:\n${html.slice(0, 8000)}`;

  // In Browser ESM (@firebase/ai/dist/esm/index.esm.js), hybridModel.chromeAdapter is populated by chromeAdapterFactory.
  // In Node.js (@firebase/ai/dist/index.node.mjs), chromeAdapterFactory is omitted from AIService, so we invoke globalThis.LanguageModel directly if chromeAdapter is absent.
  const hasBrowserChromeAdapter = Boolean(
    (hybridModel as unknown as { chromeAdapter?: unknown }).chromeAdapter
  );

  if (hasBrowserChromeAdapter) {
    const result = await hybridModel.generateContent(prompt);
    const source =
      result.response.inferenceSource === InferenceSource.ON_DEVICE
        ? "on_device"
        : "in_cloud";
    const text = result.response.text();
    const latencyMs = Number(Math.max(0.2, performance.now() - t0).toFixed(2));
    return {
      inferenceSource: source,
      backendType: providerDiag.backendType,
      availabilityStatus: providerDiag.availabilityStatus,
      reasoningJson: text,
      latencyMs,
    };
  }

  const g = globalThis as unknown as {
    LanguageModel: {
      create: (opts?: unknown) => Promise<{
        prompt: (input: string) => Promise<string>;
        destroy: () => void;
      }>;
    };
  };
  const session = await g.LanguageModel.create({
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  });
  const text = await session.prompt(prompt);
  session.destroy();
  const latencyMs = Number(Math.max(0.2, performance.now() - t0).toFixed(2));

  return {
    inferenceSource: InferenceSource.ON_DEVICE,
    backendType: providerDiag.backendType,
    availabilityStatus: providerDiag.availabilityStatus,
    reasoningJson: text,
    latencyMs,
  };
}
