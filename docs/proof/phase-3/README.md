# Bằng chứng kiểm chứng — Phase 3 (Ticket-03 & Test Contract v2.0.0)

Tài liệu kiểm chứng thực tế tại mốc `phase-3`. Toàn bộ đầu ra trong thư mục này được sinh tự động bởi `npm run verify` và `node scripts/capture-proof.mjs 3`.

## Bảng truy vết Yêu cầu -> Bằng chứng

| AC | Yêu cầu nghiệm thu | Cách kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|---|
| **AC-3.1** | Dầu đèn (`lanternOil`): hao sương đen `-1.8/s`, hồi vùng an toàn `+12/s`, va chạm `-35`, thua khi `= 0` | Unit test (`tests/core.test.ts`) + `p3_mist_oil_drain_sanctuary.json` + migrated `p1_shadow_collision_loss.json` | [verify-output.txt](verify-output.txt), [scenario-p3_mist_oil_drain_sanctuary.out.json](scenario-p3_mist_oil_drain_sanctuary.out.json), [scenario-p1_shadow_collision_loss.out.json](scenario-p1_shadow_collision_loss.out.json) | **PASS** |
| **AC-3.2** | Đèn đơn (`< 2` lit) mất `charge` `-8/s` khi có Bóng Mực trong `9.0` đơn vị và tắt (`lit=false`) tại `0` | Unit test (`500` ticks decay -> extinguish) + `p3_lantern_decay_and_resonance.json` (`lantern_dimming`) | [verify-output.txt](verify-output.txt), [scenario-p3_lantern_decay_and_resonance.out.json](scenario-p3_lantern_decay_and_resonance.out.json) | **PASS** |
| **AC-3.3** | Resonance Chain (`>= 2` lit) kích hoạt `resonanceActive=true`, hồi `charge +4/s`; `E` khơi đèn miễn phí | Unit tests + `p3_lantern_decay_and_resonance.json` (`lanterns=2/3, resonance=true`) | [scenario-p3_lantern_decay_and_resonance.out.json](scenario-p3_lantern_decay_and_resonance.out.json) | **PASS** |
| **AC-3.4** | Di trú tường minh test cũ kèm ADR; `0` test bị tắt | [phase-3-change-log.md](../../notes/phase-3-change-log.md) + `scripts/check-no-skipped-tests.mjs` (`0 skipped`) | [verify-output.txt](verify-output.txt) | **PASS** |
| **AC-3.5** | Toàn bộ scenario không bị thay luật (`p1_collect_and_win`, `p1_boundary_and_obstacle`, `p2_flare_repel_shadow`, `p2_level2_win`) đạt 100% | `tests/contract.test.ts` + `verify-all.mjs` | [determinism.txt](determinism.txt) | **PASS** |

## SHA-256 Determinism (Phase 3 Baseline — 7/7 Match)

- `p1_boundary_and_obstacle.json`: `7219c7e40edcc1388b64114e4da50a3cd1f2f7416064d7906951c9fb5f26c1f1`
- `p1_collect_and_win.json`: `2b2db884ea07e251bf2b8b814413332ab1394dd81274d75efe60c6548e6965e8`
- `p1_shadow_collision_loss.json`: `1ac6f6fea9ab98c21aa03e6a430e63e3e6e86d10f5edab53a2651916e92388a5`
- `p2_flare_repel_shadow.json`: `f678ebd5d90a75c9d92b408e1e0eda949a6a36f4047e71ae46621c602d47b63f`
- `p2_level2_win.json`: `8c20e5a84e247fb3f38efcc8e13f7e8d6ca9733b724b278d0c2d29473d211944`
- `p3_lantern_decay_and_resonance.json`: `723b14d02a427d75e0d5d69dec7dab2aab684e6c87854cd891cf055787df723d`
- `p3_mist_oil_drain_sanctuary.json`: `846933677aecd050e4661f2007605edc97de491d2521a99511d5956e58861f65`
