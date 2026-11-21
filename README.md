# Day 12 — AI SDLC: Đảo Đèn Lồng

> **Trạng thái:** Phase 1 hoàn thành bản chơi được Level 1 ("Bến Bắc") + chế độ Headless Test Contract v1.0.0.
> **Lab board:** [Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW) · Tài liệu gốc: [GUIDE.md](GUIDE.md) | [CHECKPOINTS.md](CHECKPOINTS.md) | [SUBMISSION.md](SUBMISSION.md) | [RULES.md](RULES.md) | [RUBRIC.md](RUBRIC.md)

> [!NOTE]
> Vì Lab Board yêu cầu đăng nhập Claude cá nhân nên các chi tiết kỹ thuật và Test Contract trong repo được định nghĩa tường minh theo dạng `[ASSUMPTION]` tại [docs/notes/assumptions.md](docs/notes/assumptions.md) và cách ly trong [test-contract.json](test-contract.json) + [src/headless/contract.ts](src/headless/contract.ts).

---

## Cài đặt và chạy nhanh (<= 3 lệnh)

```bash
npm ci
npm run verify
npm run dev
```

Mở URL do Vite hiển thị (mặc định `http://localhost:5173`) để chơi bản 3D.

---

## Điều khiển (Phase 1)

| Phím | Chức năng |
|---|---|
| `WASD` / Phím mũi tên | Di chuyển Mây (chuẩn hóa tốc độ đường chéo) |
| `E` | Thắp Đèn Lồng Lớn (khi đứng gần `<= 2.4` và có `>= 2` đom đóm) |
| `P` | Tạm dừng / Tiếp tục |
| `R` | Chơi lại màn hiện tại |

---

## Chế độ Headless & Kiểm chứng

- Chạy kiểm tra toàn bộ (TypeScript + Vitest + 3 scenario headless + kiểm tra tất định):
  ```bash
  npm run verify
  ```
- Chạy một scenario theo [test-contract.json](test-contract.json):
  ```bash
  npm run headless -- --scenario scenarios/p1_collect_and_win.json --pretty
  ```
- Build bản tĩnh (`dist/`):
  ```bash
  npm run build
  ```

---

## Tài liệu SDLC & Bằng chứng

- Giả định & tiêu chí nghiệm thu: [docs/notes/assumptions.md](docs/notes/assumptions.md)
- Nhật ký dùng AI & token: [docs/notes/ai-log.md](docs/notes/ai-log.md)
- Bằng chứng Phase 1: [docs/proof/phase-1/README.md](docs/proof/phase-1/README.md)
- Harness AI: [AGENTS.md](AGENTS.md), [.agents/skills/verify-phase/SKILL.md](.agents/skills/verify-phase/SKILL.md), [.githooks/pre-commit](.githooks/pre-commit)
