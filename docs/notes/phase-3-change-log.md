# Phase 3 Change Log & ADR (Ticket-03 Breaking Rule Replacement)

## Bối cảnh
Ticket-03 thay thế hai luật cốt lõi từ Phase 1–2 để tăng tính liên kết sinh tồn trong sương đen của Đảo Đèn Lồng.

## Các luật thay thế

### 1. `player.hp (3 -> 0)` => `player.lanternOil (100 -> 0)`
- **Luật cũ (Phase 1–2):** Mây có 3 máu rời rạc; chỉ mất máu khi va chạm Bóng Mực.
- **Luật mới (Phase 3):** Mây mang đèn bão chứa dầu (`0..100`):
  - Hao `1.8/s` (`0.09/tick`) khi đứng trong sương đen ngoài vùng an toàn đèn lớn.
  - Hồi `12.0/s` (`0.6/tick`, tối đa `100`) khi đứng trong vùng an toàn `5.5` của đèn đã sáng.
  - Bóng Mực va chạm trực tiếp trừ `35` dầu (vẫn có `20` ticks bất tử). Game thua khi `lanternOil <= 0`.

### 2. Đèn sáng vĩnh viễn => `charge (0..100)` & Resonance Chain
- **Luật cũ (Phase 1–2):** Đèn Lồng Lớn khi đã thắp sáng giữ trạng thái `lit = true` vĩnh viễn.
- **Luật mới (Phase 3):**
  - Đèn mới thắp có `charge = 100`.
  - Khi `< 2` đèn sáng (`resonanceActive = false`), Bóng Mực chưa choáng tiến vào bán kính `9.0` sẽ làm tụt `charge` ở tốc độ `8.0/s` (`0.4/tick`); về `0` đèn tắt (`lit = false`).
  - Khi `>= 2` đèn sáng đồng thời, **Resonance Chain** kích hoạt (`resonanceActive = true`), miễn nhiễm suy giảm và hồi `charge` `+4.0/s` (`+0.2/tick`).
  - Nhấn `E` (`interact`) gần đèn đang sáng nhưng hụt `charge` sẽ khơi sáng lại về `100` miễn phí.

## Tác động lên Test Contract (`1.1.0` -> `2.0.0`) & Danh sách Di trú Test

| Thành phần bị ảnh hưởng | Trạng thái cũ | Di trú trong Phase 3 | Lý do |
|---|---|---|---|
| `test-contract.json` & `src/headless/contract.ts` | `player.hp` | Thay bằng `player.lanternOil`; thêm `resonanceActive` & `lanterns: [{id, lit, charge}]` | Luật mới thay thế hoàn toàn hệ thống máu rời rạc |
| `scenarios/p1_shadow_collision_loss.json` | `expected.playerHp: 0` | Đổi metadata `expected.lanternOil: 0` (giữ nguyên toàn bộ `inputs`!) | Cùng chuỗi di chuyển đâm vào Bóng Mực vẫn dẫn tới `status="lost"` nhưng điều kiện kết thúc là `lanternOil === 0` |
| `tests/core.test.ts` (Phase 1 loss test) | Kiểm tra `hp === 0` | Di trú sang kiểm tra `lanternOil === 0` và `status === 'lost'` | Phản ánh đúng cơ chế dầu đèn |
| `tests/core.test.ts` (Phase 2 flare test) | Kiểm tra `hpBefore === hpAfter` | Di trú sang kiểm tra `lanternOil` không bị trừ `-35` bởi Bóng Mực đang bị choáng | Bóng Mực bị choáng không gây sát thương dầu |
| `tests/contract.test.ts` | Kiểm tra `contractVersion === '1.1.0'` & `r1.player.hp === 0` | Nâng version check `'2.0.0'` và kiểm tra `r1.player.lanternOil === 0` | Không tắt/skip test cũ; di trú tường minh theo ADR |

> **Cam kết:** Không có bất kỳ test nào bị tắt (`.skip` / `xit`), được bảo chứng tự động bởi `scripts/check-no-skipped-tests.mjs`.
