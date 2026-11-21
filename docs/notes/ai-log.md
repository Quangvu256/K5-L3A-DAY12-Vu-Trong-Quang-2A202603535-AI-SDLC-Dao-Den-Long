# Nhật ký dùng AI & Đánh giá qua từng Phase

> Ghi nhận trung thực quá trình điều phối AI, lỗi AI phát sinh, điều chỉnh harness và ước tính token/chi phí qua 4 phase.

---

## Phase 1 — PRD-0, Core Headless & Level 1

### 1. Đánh giá kết quả Phase 1
- **Đạt:** Toàn bộ logic mô phỏng thuần (`src/core/`), adapter Test Contract (`src/headless/contract.ts`), 3 scenario headless, 9 unit/contract tests (`vitest`), bản build tĩnh Vite + Three.js (`493.67 kB`) và kiểm tra tính tất định (`3/3` SHA-256 trùng khớp) đều xanh.
- **Chưa hoàn tất tại mốc Phase 1:** Chưa kết nối trực tiếp vào Lab Board (`claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW`) do yêu cầu đăng nhập; mọi quy tắc chi tiết đã được gắn thẻ `[ASSUMPTION]` trong `docs/notes/assumptions.md`. Chưa quay video demo chơi thử trực quan (dành cho mốc CP5 cuối lab).

### 2. Lỗi AI / Cấu hình phát hiện & Cách xử lý
1. **`tsconfig.json` thiếu DOM `lib`:** Ban đầu cấu hình `"types": ["node"]` không khai báo `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, dễ gây lỗi type khi thêm `src/render/` và `src/main.ts`. Đã phát hiện trước khi build và bổ sung đầy đủ.
2. **Cảnh báo `DEP0190` trên Node.js v24.19.0:** Script `verify-all.mjs` bản đầu gọi `execFileSync(bin, args, { shell: true })` khiến Node 24 phát cảnh báo deprecation vào log. Đã sửa sang gọi `cmd.exe /d /s /c` trên Windows và trực tiếp binary trên POSIX để log bằng chứng sạch hoàn toàn.
3. **Làm tròn dấu phẩy động (`round6`):** Tránh sai số `8.399999999999999` khi tuần tự hóa JSON bằng hàm `round6` cố định trong `src/core/constants.ts`.

### 3. Điều chỉnh Harness
- Khởi tạo **Harness v1**: `AGENTS.md` (quy định ranh giới `src/core/` và quy tắc kiểm chứng trước khi báo đạt), `.agents/skills/verify-phase/SKILL.md`, `.githooks/pre-commit` chạy `npm run verify`, và GitHub Actions CI.

### 4. Ước tính Token & Tiết kiệm (`[ESTIMATE]`)
- **Ước tính Phase 1 (`[ESTIMATE]`):** ~28k input tokens / ~9k output tokens (chi phí tương đương ~$0.15–$0.25 tùy tier model).
- **Cách tiết kiệm:** Chốt schema `test-contract.json` và tọa độ `LEVEL_1` trước khi sinh code; viết unit test và scenario chạy thẳng bằng `vitest` trước khi dựng 3D Three.js nên không phải sửa lại cấu trúc core.
