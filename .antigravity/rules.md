# Hackathon Brief: #BuildHybridAI 2026

- Devpost URL: https://firebasehybridaihackathon.devpost.com/
- Prize Pool: $<span data-currency-value>30,000</span>
- Deadline: 19 days left
- Approval Status: ✅ APPROVED BY USER
- Approved Product Name: DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall
- Approved Pitch: Tiện ích Chrome & Web App dùng Gemini Nano 4 On-Device thông qua Firebase AI Logic Hybrid SDK để quét tức thì cấu trúc DOM, điều khoản ẩn và bẫy giao diện (Dark Patterns / Fake Checkout) ngay trên máy người dùng với độ trễ 0ms và quyền riêng tư tuyệt đối; tự động fallback lên Cloud Gemini qua Firebase AI Logic khi phát hiện chiến dịch lừa đảo đa tên miền cần đối chiếu sâu với Firestore & App Check.
- Winning Angle: Khác hoàn toàn các ví dụ notes/PDF reader/coach/game master của Google; tận dụng trực diện thế mạnh riêng tư & độ trễ tức thì của Chrome built-in Gemini Nano 4 kết hợp Firebase App Check, Remote Config và Firestore.
- Required Stack: Chrome Extension (Manifest V3) & Next.js Web App, Firebase AI Logic Hybrid Inference SDK (Gemini Nano 4 + Cloud Fallback), Firebase App Check, Auth, Firestore & Remote Config, TypeScript
- Studio Harness Root: `/Volumes/AllySSD/Projects/AgentAppStudio/studio-harness`

## Studio Harness Engineering Rules (SDD → VSDD → CoDD)

1. **Product & Architecture (`studio.design.init` + `studio.product.specification`)**:
   - Đọc `.claude/commands/design-init.md` và `.claude/commands/spec.md`.
   - Tạo `DESIGN.md` và `SPEC.md` (theo mẫu `/Volumes/AllySSD/Projects/AgentAppStudio/studio-harness/templates/SPEC.md`) bám sát ý tưởng đã được duyệt (`DOMShield Hybrid: Zero-Latency On-Device Anti-Scam, Dark-Pattern & Phishing Firewall`), với các tiêu chí nghiệm thu định dạng `- AC-1: <hành vi kiểm chứng được>`, `- AC-2: ...`.
   - Chạy `npm --prefix /Volumes/AllySSD/Projects/AgentAppStudio/studio-harness run coverage:check -- --spec ./SPEC.md` đảm bảo trả về danh sách tiêu chí hợp lệ (exit code 0).
2. **Engineering (`studio.build.implement`)**:
   - Đọc `.claude/commands/build.md`, xây dựng ứng dụng hoàn chỉnh chạy thực tế ở cổng 3000 (hoặc 8000), không dùng mock data cứng.
   - Viết test kiểm chứng cho từng tiêu chí `AC-*` và đảm bảo build + test pass 100%.
3. **Review, QA & Release (`studio.validate.gate` + `studio.validate.cto-review`)**:
   - Đọc `.claude/commands/validate.md` và `.claude/commands/cto.md`.
   - Tạo `VALIDATION.md` (theo mẫu `/Volumes/AllySSD/Projects/AgentAppStudio/studio-harness/templates/VALIDATION.md`) ánh xạ từng `AC-*` tới bằng chứng test/build thực tế.
   - Tạo `SUBMISSION.md` theo đúng chuẩn Devpost (gồm các mục: `## Elevator Pitch`, `## Inspiration`, `## What it does`, `## How we built it`, `## Challenges we ran into`, `## Accomplishments that we're proud of`, `## What's next`) và vẽ sơ đồ Mermaid.js trong `README.md`.
