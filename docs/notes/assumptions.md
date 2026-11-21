# Assumptions & Acceptance Criteria — Đảo Đèn Lồng

> **Ghi chú minh bạch (`[ASSUMPTION]`):** Tài liệu đề bài gốc trên Lab Board (`https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW`) yêu cầu đăng nhập Claude cá nhân nên không thể truy cập tự động từ môi trường local. Toàn bộ hằng số, chi tiết luật chơi ngoài phần mô tả lõi trong `README.md` (Mây, đom đóm, Đèn Lồng Lớn, Bóng Mực trong sương đen) và schema Test Contract dưới đây được xác lập tường minh dưới dạng `[ASSUMPTION]` và cách ly trong `test-contract.json` + `src/headless/contract.ts` để có thể hiệu chỉnh nhanh nếu đối chiếu lại với Lab Board.

---

## Phase 1 — PRD-0 (Core Playable Level 1 & Headless Test Contract v1.0)

### 1. Explicit `[ASSUMPTION]` Decisions
1. **Simulation Timestep & Determinism (`[ASSUMPTION]`):** Fixed timestep `DT = 0.05` giây (`20 Hz`). Toàn bộ logic nằm trong `src/core/`, dùng seeded PRNG Mulberry32 (`src/core/rng.ts`), không gọi `Math.random()` hay clock hệ thống. Cùng `(levelId, seed, inputs)` luôn cho output JSON và `digestSha256` giống hệt nhau.
2. **Đảo & Di chuyển (`[ASSUMPTION]`):** Đảo hình tròn bán kính `ISLAND_RADIUS = 24` đơn vị, tâm `(0, 0)`. Mây có `PLAYER_RADIUS = 0.6`, tốc độ tối đa `PLAYER_SPEED = 6.0` units/s (`0.3` units/tick). Vector nhập `(moveX, moveZ)` được chuẩn hóa nếu độ dài `> 1` để đi chéo không nhanh hơn đi thẳng. Vật cản đá là hình tròn đẩy Mây ra ngoài theo pháp tuyến; biên đảo giới hạn `hypot(x, z) <= ISLAND_RADIUS - PLAYER_RADIUS`.
3. **Đom Đóm & Đèn Lồng Lớn (`[ASSUMPTION]`):**
   - Mây tự động nhặt đom đóm khi khoảng cách `<= FIREFLY_PICKUP_RADIUS (1.3)`.
   - Khi nhấn tương tác (`interact = true`) trong bán kính `LANTERN_INTERACT_RADIUS (2.4)` của Đèn Lồng Lớn chưa sáng và mang đủ `FIREFLIES_PER_LANTERN (2)` đom đóm, đèn bừng sáng (`lit = true`) và tiêu thụ `2` đom đóm.
   - Đèn Lồng Lớn đã sáng tạo vùng an toàn bán kính `LANTERN_SAFE_RADIUS (5.5)`.
4. **Bóng Mực & Sát thương (`[ASSUMPTION]`):**
   - Trong Phase 1, Mây có `PLAYER_MAX_HP = 3`.
   - Bóng Mực tuần tra qua lại giữa 2 điểm `patrolA <-> patrolB` với tốc độ `SHADOW_SPEED = 2.5` units/s (`0.125` units/tick) và bị chặn ngoài vùng an toàn `LANTERN_SAFE_RADIUS` của các Đèn Lồng đã sáng.
   - Va chạm trực tiếp (`dist <= SHADOW_CONTACT_RADIUS = 1.2`) khi `invulnTicks === 0` trừ `1 HP` và cấp `SHADOW_INVULN_TICKS = 20` (1.0s).
5. **Điều kiện Thắng / Thua (`[ASSUMPTION]`):** Thắng (`status = "won"`) khi toàn bộ Đèn Lồng Lớn của màn sáng (`3/3` ở Level 1 "Bến Bắc"). Thua (`status = "lost"`) khi `player.hp <= 0`.
6. **Test Contract Headless (`[ASSUMPTION]`):** Chạy qua CLI `npm run headless -- --scenario <path> [--out <path>]`, xuất JSON chuẩn theo `test-contract.json` kèm `digestSha256` (SHA-256 trên payload chuẩn hóa).

### 2. Acceptance Criteria (Phase 1)
- **AC-1.1:** Di chuyển chuẩn hóa trên mặt phẳng XZ; Mây bị chặn bởi đá (`R1`, `R2`) và biên đảo (`24 - 0.6 = 23.4`).
- **AC-1.2:** Nhặt đom đóm tự động trong bán kính `1.3` tăng `carriedFireflies` và `firefliesCollected`.
- **AC-1.3:** Thắp Đèn Lồng Lớn cần `interact = true`, khoảng cách `<= 2.4`, và `>= 2` đom đóm; thất bại khi thiếu đom đóm.
- **AC-1.4:** Bóng Mực tuần tra `patrolA <-> patrolB` và né vùng an toàn `5.5` quanh đèn đã sáng.
- **AC-1.5:** Va chạm Bóng Mực giảm HP, kích hoạt bất tử tạm thời `20` ticks, và dẫn tới `status = "lost"` khi `hp = 0`.
- **AC-1.6:** Thắp đủ `3/3` Đèn Lồng Lớn ở Level 1 đưa về `status = "won"`.
- **AC-1.7:** Chế độ headless chạy theo `test-contract.json` và cho `digestSha256` giống hệt nhau qua 2 lần chạy độc lập.

---

## Phase 2 — Ticket-02 (Light Flare, Shadow Chase AI, Level 2 & Harness v2)

### 1. Explicit `[ASSUMPTION]` Decisions
1. **Light Flare (`[ASSUMPTION]`):**
   - Kích hoạt qua `Space` (`input.flare = true`). Yêu cầu `player.carriedFireflies >= 1` và `player.flareCooldownTicks === 0`.
   - Tiêu thụ `1` đom đóm, đặt hồi chiêu `FLARE_COOLDOWN_TICKS = 80` (4.0s), tăng `player.flaresUsed += 1`.
   - Mọi Bóng Mực trong bán kính `FLARE_RADIUS = 7.0` bị đẩy lùi thêm `FLARE_KNOCKBACK = 4.0` đơn vị ra xa Mây (giữ trong biên đảo), chuyển sang trạng thái `'repelled'` và bị choáng `FLARE_STUN_TICKS = 60` (3.0s). Trong khi `'repelled'`, Bóng Mực không di chuyển và không gây sát thương va chạm.
2. **Ink Shadow AI State Machine (`[ASSUMPTION]`):**
   - 4 trạng thái: `'patrol' | 'alert' | 'chase' | 'repelled'`.
   - Khi Bóng Mực không bị choáng và Mây đứng ngoài mọi vùng an toàn `LANTERN_SAFE_RADIUS` của đèn đã sáng:
     - Nếu `dist(shadow, player) <= SHADOW_ALERT_RADIUS (7.5)` khi đang `'patrol'` -> chuyển `'alert'`.
     - Nếu đang `'alert'` và Mây vẫn ngoài vùng an toàn trong phạm vi `SHADOW_CHASE_EXIT_RADIUS (10.5)` -> chuyển `'chase'`, truy đuổi về phía Mây với tốc độ `SHADOW_CHASE_SPEED = 3.4` units/s (`0.17` units/tick).
     - Nếu Mây vào vùng an toàn hoặc thoát xa `> 10.5` -> quay về `'patrol'`.
   - Bóng Mực vẫn luôn bị đẩy ra ngoài `LANTERN_SAFE_RADIUS` của mọi đèn đã sáng.
3. **Level 2 — "Bến Sương Mù" (`[ASSUMPTION]`):**
   - `islandRadius = 28`, 4 vật cản đá (`R1..R4`), 8 đom đóm (`F1..F8`), 4 Đèn Lồng Lớn (`L1..L4`), 3 Bóng Mực (`S1..S3`).
4. **Backward Compatibility (`[ASSUMPTION]`):**
   - `test-contract.json` nâng lên `1.1.0` (`phase: 2`): `flare` trong input là tùy chọn (mặc định `false`); toàn bộ 3 scenario Phase 1 giữ nguyên đầu vào và tiếp tục đạt kết quả tương ứng.

### 2. Acceptance Criteria (Phase 2)
- **AC-2.1:** Bóng Mực chuyển đổi hợp lệ theo state machine `patrol -> alert -> chase` khi Mây vào phạm vi `7.5` ngoài vùng an toàn, và về `patrol` khi Mây vào vùng an toàn.
- **AC-2.2:** `flare` tiêu thụ `1` đom đóm, đặt cooldown `80` ticks, đẩy lùi và làm choáng Bóng Mực trong phạm vi `7.0` sang `'repelled'` (`60` ticks).
- **AC-2.3:** Level 2 ("Bến Sương Mù") chơi được và thắng khi thắp đủ `4/4` đèn.
- **AC-2.4:** Toàn bộ 3 scenario Phase 1 không đổi file đầu vào vẫn vượt qua hồi quy.
- **AC-2.5:** Core Purity Guard (`scripts/check-core-purity.mjs`) tự động chặn mọi phụ thuộc DOM/Three.js/random trong `src/core/`.
