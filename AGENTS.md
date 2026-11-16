# AGENTS.md — #BuildHybridAI 2026 (`DOMShield Hybrid`)

Hướng dẫn cho Antigravity (`agy`), OpenAI Codex CLI (`codex`) & Studio Harness làm việc trên repo này.

## Project

Sản phẩm dự thi Hackathon **#BuildHybridAI 2026** (Đã được người dùng phê duyệt ý tưởng):
- **Tên sản phẩm**: DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall
- **Mô tả**: Tiện ích Chrome (Manifest V3) & Web Command Center dùng Gemini Nano On-Device thông qua Firebase AI Logic Hybrid SDK (`firebase/ai` với `InferenceMode.PREFER_ON_DEVICE`) và Chrome Prompt API (`LanguageModel`) để quét tức thì cấu trúc DOM, điều khoản ẩn và bẫy giao diện (Dark Patterns / Fake Checkout) ngay trên máy người dùng với độ trễ 0ms và quyền riêng tư tuyệt đối; tự động fallback lên Cloud Gemini (`GoogleAIBackend`) qua Firebase AI Logic khi phát hiện chiến dịch lừa đảo đa tên miền cần đối chiếu sâu với Cloud Firestore, Remote Config & App Check.
- **Góc độ thắng giải**: Khác hoàn toàn các ví dụ notes/PDF reader/coach/game master của Google; tận dụng trực diện thế mạnh riêng tư & độ trễ tức thì của Chrome built-in Gemini Nano kết hợp Firebase App Check, Remote Config và Firestore.
- **Quy trình kỹ thuật**: **SDD → VSDD → CoDD** của `/Volumes/AllySSD/Projects/AgentAppStudio/studio-harness`.

## Architectural decisions (đọc trước khi sửa)

| Quyết định | Lý do | Ngày |
|---|---|---|
| Chốt ý tưởng `DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall` | Đã qua bước Human Approval Gate trước khi build | 2026-11-15 |
| Áp dụng Studio Harness (`SDD → VSDD → CoDD`) với 8 tiêu chí `AC-1..AC-8` | Đảm bảo mọi tính năng đều có `DESIGN.md`, `SPEC.md`, test tự động, benchmark thực tế và `VALIDATION.md` | 2026-11-17 |
| Kiến trúc Hybrid Dual-Surface (Chrome Extension MV3 + Web Command Center & Live DOM Sandbox trên cổng 3000) | Giúp ban giám khảo trải nghiệm ngay "5-Second Visual Hook" không cần cài đặt phức tạp, đồng thời cung cấp gói Chrome Extension MV3 chuẩn chỉnh | 2026-11-17 |
| Tích hợp thật `firebase` (`firebase/ai`, `firebase/app-check`, `firebase/remote-config`, `firebase/firestore`) kèm chế độ Local/Demo tự chủ | Hoạt động 100% cả khi có Firebase Cloud credentials lẫn khi giám khảo chấm локально không cần cấu hình `.env` | 2026-11-17 |
| Sanitizer API (`Element.prototype.setHTML`) với fallback an toàn | Ngăn chặn XSS tuyệt đối khi hiển thị các đoạn mã DOM/HTML độc hại trong bảng phân tích mối đe dọa | 2026-11-17 |

## Known gaps (đừng "sửa nhầm")

- Khi trình duyệt không bật cờ Chrome Built-in AI (`globalThis.LanguageModel` unavailable), bộ định tuyến Hybrid (`shared/hybridRouter.ts`) tự động sử dụng bộ phân tích AST + Semantic cục bộ tốc độ sub-millisecond kết hợp Cloud Fallback theo ngưỡng `escalationThreshold` của Remote Config. Không xóa nhánh fallback này.

## Structure aliases (SPEC ↔ code)

- `SPEC.md` → Đặc tả hệ thống & danh sách `- AC-1: ...` đến `- AC-8: ...`
- `DESIGN.md` → Hệ thống thiết kế UI/UX ("Obsidian Shield" Tactical HUD & 5-Second Visual Hook)
- `shared/types.ts` → Các kiểu dữ liệu dùng chung cho Scanner, Hybrid Router, Firebase Telemetry và Benchmark
- `shared/domScanner.ts` → Bộ quét cấu trúc DOM & phát hiện Dark Patterns / Phishing (`AC-1`, `AC-4`)
- `shared/hybridRouter.ts` → Bộ định tuyến suy luận lai On-Device Nano vs Cloud Gemini (`AC-2`)
- `server/firebase/threatStore.ts` → Tích hợp Firebase App Check, Remote Config & Firestore Threat Intelligence (`AC-3`)
- `server/benchmark/groundTruthCorpus.ts` → Bộ 24 kịch bản Domain Ground-Truth Benchmark (`AC-6`)
- `extension/` → Gói Chrome Extension Manifest V3 (`manifest.json`, `service-worker.js`, `content-script.js`, `sidepanel/`) (`AC-5`)
- `client/` → Giao diện Web Command Center & Live DOM Threat Sandbox (`AC-7`)
- `VALIDATION.md` → Báo cáo nghiệm thu theo chuẩn Studio Harness (`AC-8`)
- `SUBMISSION.md` → Bài thuyết trình nộp Devpost kèm kịch bản Video Demo (`AC-8`)
