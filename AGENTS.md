# AGENTS.md — #BuildHybridAI 2026

Hướng dẫn cho OpenAI Codex CLI (`codex`) & Studio Harness làm việc trên repo này.

## Project

Sản phẩm dự thi Hackathon **#BuildHybridAI 2026** (Đã được người dùng phê duyệt ý tưởng):
- **Tên sản phẩm**: DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall
- **Mô tả**: DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall: Tiện ích Chrome & Web App dùng Gemini Nano 4 On-Device thông qua Firebase AI Logic Hybrid SDK để quét tức thì cấu trúc DOM, điều khoản ẩn và bẫy giao diện (Dark Patterns / Fake Checkout) ngay trên máy người dùng với độ trễ 0ms và quyền riêng tư tuyệt đối; tự động fallback lên Cloud Gemini qua Firebase AI Logic khi phát hiện chiến dịch lừa đảo đa tên miền cần đối chiếu sâu với Firestore & App Check.
- **Góc độ thắng giải**: Khác hoàn toàn các ví dụ notes/PDF reader/coach/game master của Google; tận dụng trực diện thế mạnh riêng tư & độ trễ tức thì của Chrome built-in Gemini Nano 4 kết hợp Firebase App Check, Remote Config và Firestore.
- **Quy trình kỹ thuật**: **SDD → VSDD → CoDD** của `/Volumes/AllySSD/Projects/AgentAppStudio/studio-harness`.

## Architectural decisions (đọc trước khi sửa)

| Quyết định | Lý do | Ngày |
|---|---|---|
| Chốt ý tưởng `DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall` | Đã qua bước Human Approval Gate trước khi build | 2026-10 |
| Áp dụng Studio Harness (`SDD → VSDD → CoDD`) | Đảm bảo mọi tính năng đều có `DESIGN.md`, `SPEC.md` (`AC-1..N`), test tự động và `VALIDATION.md` | 2026-10 |

## Known gaps (đừng "sửa nhầm")

- Chưa có (cập nhật trong quá trình chạy `/build` và `/validate`).

## Structure aliases (SPEC ↔ code)

- `SPEC.md` → Đặc tả hệ thống & danh sách `- AC-1: ...`
- `DESIGN.md` → Hệ thống thiết kế UI/UX
- `VALIDATION.md` → Báo cáo nghiệm thu theo chuẩn Studio Harness
- `SUBMISSION.md` → Bài thuyết trình nộp Devpost
