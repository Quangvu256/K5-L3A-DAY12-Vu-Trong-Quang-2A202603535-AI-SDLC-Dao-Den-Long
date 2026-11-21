# Bằng chứng kiểm chứng — Phase 2 (Ticket-02 & Test Contract v1.1.0)

Tài liệu kiểm chứng thực tế tại mốc `phase-2`. Toàn bộ đầu ra trong thư mục này được sinh tự động bởi `npm run verify` và `node scripts/capture-proof.mjs 2`.

## Bảng truy vết Yêu cầu -> Bằng chứng

| AC | Yêu cầu nghiệm thu | Cách kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|---|
| **AC-2.1** | Shadow AI state machine `patrol -> alert -> chase -> patrol` (về tuần tra khi vào vùng an toàn) | Unit test (`tests/core.test.ts`) | [verify-output.txt](verify-output.txt) | **PASS** |
| **AC-2.2** | Quầng Sáng (`flare`) tốn `1` đom đóm, cooldown `80` ticks, đẩy lùi + choáng `60` ticks, không gây sát thương khi choáng | Unit test + `p2_flare_repel_shadow.json` (`flaresUsed=1, aiState=repelled`) | [scenario-p2_flare_repel_shadow.out.json](scenario-p2_flare_repel_shadow.out.json) | **PASS** |
| **AC-2.3** | Level 2 ("Bến Sương Mù", `r=28`, `4` đèn, `8` đom đóm, `3` Bóng Mực) chơi được và thắng | Unit test + `p2_level2_win.json` (`status=won, ticks=270, lanterns=4/4`) | [scenario-p2_level2_win.out.json](scenario-p2_level2_win.out.json) | **PASS** |
| **AC-2.4** | Hồi quy toàn bộ 3 scenario Phase 1 giữ nguyên file đầu vào | `tests/contract.test.ts` + `verify-all.mjs` | [verify-output.txt](verify-output.txt), [determinism.txt](determinism.txt) | **PASS** (`p1_collect_and_win` 143 ticks `won`, `p1_shadow_collision_loss` 62 ticks `lost`, `p1_boundary_and_obstacle` 160 ticks `running`) |
| **AC-2.5** | Core Purity Guard tự động chặn DOM/Three.js/random trong `src/core/` | `node scripts/check-core-purity.mjs` (5/5 files OK) | [verify-output.txt](verify-output.txt) | **PASS** |
| **Build 3D** | Bản web 3D hiển thị Quầng Sáng, màu AI Bóng Mực & chuyển Màn 1/2 | `npm run build` (`dist/index.html` + `497.98 kB` JS) | Command output trong session | **PASS** *(chưa quay clip chơi trực tiếp tại Phase 2)* |

## Tóm tắt SHA-256 Determinism (từ `determinism.txt`)

- `p1_boundary_and_obstacle.json`: `status=running | ticks=160 | match=true | sha256=64894a00f48151c5b9a9f7d6d8468813e50e570dcf9572acc52e9236e6416c95`
- `p1_collect_and_win.json`: `status=won | ticks=143 | match=true | sha256=c7634782be90149b144908f96b6a89473721bd3cfc1179cf13d25a85a356fdca`
- `p1_shadow_collision_loss.json`: `status=lost | ticks=62 | match=true | sha256=f6b37d4537f1967f993113128679a3a1573ccf81999bf8c108131be7f1e4302a`
- `p2_flare_repel_shadow.json`: `status=running | ticks=60 | match=true | sha256=a2bb47a9eaea8f4c5288630f579dd21dc84f1072c1c91010b39c1f20c00e6059`
- `p2_level2_win.json`: `status=won | ticks=270 | match=true | sha256=eb41296138101f81d8e907e958cbfbe012704efd8d884ad7f9f2feded9eb6dbb`
