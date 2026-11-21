# Bằng chứng kiểm chứng — Phase 1 (PRD-0 & Test Contract v1.0.0)

Tài liệu kiểm chứng thực tế tại mốc `phase-1`. Toàn bộ đầu ra trong thư mục này được sinh tự động bởi `npm run verify` và `node scripts/capture-proof.mjs 1`, không chỉnh sửa thủ công.

## Bảng truy vết Yêu cầu -> Bằng chứng

| AC | Yêu cầu nghiệm thu | Cách kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|---|
| **AC-1.1** | Di chuyển chuẩn hóa đường chéo; chặn đá (`R1`, `R2`) và biên đảo (`24 - 0.6 = 23.4`) | Unit tests (`tests/core.test.ts`) + Scenario `p1_boundary_and_obstacle.json` | [verify-output.txt](verify-output.txt), [scenario-p1_boundary_and_obstacle.out.json](scenario-p1_boundary_and_obstacle.out.json) | **PASS** |
| **AC-1.2** | Nhặt đom đóm tự động trong bán kính `1.3` | Unit test + `p1_collect_and_win.json` (`6/6` collected) | [scenario-p1_collect_and_win.out.json](scenario-p1_collect_and_win.out.json) | **PASS** |
| **AC-1.3** | Thắp Đèn Lồng Lớn cần `interact=true`, khoảng cách `<= 2.4`, đủ `2` đom đóm; thất bại khi thiếu | Unit test (0 fireflies fails; 2 fireflies succeeds) | [verify-output.txt](verify-output.txt) | **PASS** |
| **AC-1.4** | Bóng Mực tuần tra `patrolA <-> patrolB` và bị chặn ngoài bán kính an toàn `5.5` của đèn đã sáng | Unit test (120 ticks check `dist >= 5.5`) | [verify-output.txt](verify-output.txt) | **PASS** |
| **AC-1.5** | Va chạm Bóng Mực giảm HP, cấp `20` ticks bất tử, thua khi `hp = 0` | Unit test + `p1_shadow_collision_loss.json` (`ticks=132, status=lost, hp=0`) | [scenario-p1_shadow_collision_loss.out.json](scenario-p1_shadow_collision_loss.out.json) | **PASS** |
| **AC-1.6** | Thắp đủ `3/3` đèn ở Level 1 ("Bến Bắc") trả về `status="won"` | `p1_collect_and_win.json` (`ticks=143, lanterns=3/3`) | [scenario-p1_collect_and_win.out.json](scenario-p1_collect_and_win.out.json) | **PASS** |
| **AC-1.7** | Headless Test Contract tất định (`digestSha256` trùng khớp tuyệt đối qua 2 lần chạy) | Double-run CLI check trong `verify-all.mjs` & `tests/contract.test.ts` | [determinism.txt](determinism.txt) | **PASS** |
| **Build 3D** | Bản web 3D Three.js biên dịch tĩnh không lỗi TypeScript | `npm run build` (`vite v6.4.6`, `dist/index.html` + `493.67 kB` JS) | Command output trong session | **PASS** *(chưa quay clip chơi trực tiếp tại Phase 1)* |

## Tóm tắt SHA-256 Determinism (từ `determinism.txt`)

- `p1_boundary_and_obstacle.json`: `status=running | ticks=160 | match=true | sha256=447b450c6a8748d46aed961d4a71bbb115ce11581b3fbcd6784a148bb62bc97a`
- `p1_collect_and_win.json`: `status=won | ticks=143 | match=true | sha256=2ce817372c43eafaf79440beb2039951116a0172d7cdae04c77b6d6a4e5477b5`
- `p1_shadow_collision_loss.json`: `status=lost | ticks=132 | match=true | sha256=0613449abbbb46164e7cb2ffdb5598d3f24377664932a2968bb62d9f3857172b`
