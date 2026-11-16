import { runGroundTruthBenchmark } from "./groundTruthCorpus.js";

const report = runGroundTruthBenchmark();
console.log("==============================================================");
console.log("🛡️  DOMShield Hybrid — Domain Ground-Truth Benchmark Report");
console.log("==============================================================");
console.log(`Total Labeled Scenarios : ${report.totalScenarios}`);
console.log(
  `Confusion Matrix        : TP=${report.truePositives} | TN=${report.trueNegatives} | FP=${report.falsePositives} | FN=${report.falseNegatives}`
);
console.log(`Precision               : ${(report.precision * 100).toFixed(2)}%`);
console.log(`Recall                  : ${(report.recall * 100).toFixed(2)}%`);
console.log(`F1 Score                : ${(report.f1Score * 100).toFixed(2)}%`);
console.log(
  `On-Device Privacy Ratio : ${(report.onDevicePrivacyRatio * 100).toFixed(2)}% (0 bytes sent to cloud)`
);
console.log(`p95 Scan Latency        : ${report.p95LatencyMs} ms`);
console.log("==============================================================");
