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

---

## Phase 2 — Ticket-02 (Light Flare, Shadow Chase AI & Level 2)

### 1. Đánh giá kết quả Phase 2
- **Đạt:** Toàn bộ `AC-2.1`..`AC-2.5` đều xanh (`14/14` Vitest tests, `5/5` scenarios headless tất định 100%, `check-core-purity.mjs` 0 vi phạm). Toàn bộ 3 scenario Phase 1 giữ nguyên đầu vào và vượt qua hồi quy dưới contract `1.1.0`.
- **Quan sát hồi quy thú vị:** `p1_shadow_collision_loss.json` thua sớm hơn (`62` ticks thay vì `132` ticks) vì Bóng Mực `S1` ở Phase 2 đã kích hoạt `chase` ở tốc độ `3.4` units/s khi Mây đi vào vùng `7.5` ngoài vùng an toàn — hoàn toàn đúng hành vi mới mà vẫn giữ nguyên `status="lost"`, `hp=0`.

### 2. Lỗi AI phát hiện & Cách xử lý
1. **Lỗi off-by-one trên `stunTicks`:** Trong lần chạy đầu của Phase 2, `tests/core.test.ts` phát hiện `shadow.stunTicks` trả về `59` thay vì `60` ngay sau tick phóng Quầng Sáng vì Section 4 gán `60` rồi Section 5 trong cùng tick giảm ngay xuống `59` (khác với `invulnTicks` và `flareCooldownTicks` được giảm ở đầu tick). Đã chuẩn hóa giảm `stunTicks` ở đầu `stepSimulation` và kiểm tra lại đạt `14/14` tests.

### 3. Điều chỉnh Harness -> v2
- Thêm `scripts/check-core-purity.mjs` (quét tĩnh toàn bộ `src/core/*.ts`, cấm `three`, DOM, `Math.random`, `Date.now`, `node:*`) vào `verify-all.mjs` và CI.
- Thêm skill `.agents/skills/review-diff/SKILL.md` và cập nhật `AGENTS.md` (v2) khóa chặt các invariant của Flare và Shadow AI.

### 4. Ước tính Token & Tiết kiệm (`[ESTIMATE]`)
- **Ước tính Phase 2 (`[ESTIMATE]`):** ~24k input tokens / ~7.5k output tokens (~$0.12–$0.20).
- **Cách tiết kiệm:** Đọc đúng vùng 140 dòng liên quan trong `src/core/engine.ts` khi fix bug `stunTicks` thay vì đọc toàn bộ codebase; mở rộng `test-contract.json` tương thích ngược để không phải viết lại bộ scenario Phase 1.
