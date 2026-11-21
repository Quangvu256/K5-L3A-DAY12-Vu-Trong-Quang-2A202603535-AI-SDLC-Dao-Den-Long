import { FIREFLIES_PER_LANTERN, PLAYER_MAX_HP } from '../core/constants';
import { GameState } from '../core/types';

export interface HudCallbacks {
  onRestart: () => void;
  onTogglePause: () => void;
}

export class GameHud {
  private readonly root: HTMLDivElement;
  private readonly statusText: HTMLDivElement;
  private readonly statsText: HTMLDivElement;
  private readonly banner: HTMLDivElement;
  private readonly pauseBtn: HTMLButtonElement;

  constructor(container: HTMLElement, callbacks: HudCallbacks) {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:16px;';

    const topBar = document.createElement('div');
    topBar.style.cssText =
      'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;';

    const panel = document.createElement('div');
    panel.style.cssText =
      'pointer-events:auto;background:rgba(10,16,28,0.82);border:1px solid rgba(255,209,102,0.35);border-radius:10px;padding:12px 16px;backdrop-filter:blur(6px);min-width:260px;';

    const title = document.createElement('div');
    title.textContent = 'Đảo Đèn Lồng — Phase 1';
    title.style.cssText = 'font-weight:700;font-size:15px;color:#ffd166;margin-bottom:6px;';

    this.statusText = document.createElement('div');
    this.statusText.style.cssText = 'font-size:13px;color:#cbd5e1;margin-bottom:4px;';

    this.statsText = document.createElement('div');
    this.statsText.style.cssText = 'font-size:14px;font-weight:600;color:#f8fafc;';

    panel.append(title, this.statusText, this.statsText);

    const controlsBox = document.createElement('div');
    controlsBox.style.cssText =
      'pointer-events:auto;background:rgba(10,16,28,0.82);border:1px solid rgba(148,163,184,0.28);border-radius:10px;padding:10px 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';

    const hint = document.createElement('span');
    hint.textContent = 'WASD/Mũi tên: Đi | E: Thắp đèn (2 đom đóm) | P: Tạm dừng | R: Chơi lại';
    hint.style.cssText = 'font-size:12px;color:#cbd5e1;margin-right:8px;';

    this.pauseBtn = document.createElement('button');
    this.pauseBtn.textContent = 'Tạm dừng';
    this.pauseBtn.style.cssText =
      'cursor:pointer;background:#1e293b;color:#f8fafc;border:1px solid #475569;border-radius:6px;padding:6px 10px;font-size:12px;';
    this.pauseBtn.onclick = callbacks.onTogglePause;

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Chơi lại (R)';
    restartBtn.style.cssText =
      'cursor:pointer;background:#ffd166;color:#0f172a;font-weight:600;border:none;border-radius:6px;padding:6px 10px;font-size:12px;';
    restartBtn.onclick = callbacks.onRestart;

    controlsBox.append(hint, this.pauseBtn, restartBtn);
    topBar.append(panel, controlsBox);

    this.banner = document.createElement('div');
    this.banner.style.cssText =
      'align-self:center;background:rgba(7,11,20,0.92);border:2px solid #ffd166;border-radius:14px;padding:18px 28px;font-size:18px;font-weight:700;text-align:center;display:none;pointer-events:auto;';

    this.root.append(topBar, this.banner);
    container.appendChild(this.root);
  }

  public update(state: GameState, paused: boolean): void {
    const lit = state.lanterns.filter((l) => l.lit).length;
    const total = state.lanterns.length;
    const collected = state.fireflies.filter((f) => f.collected).length;

    this.statusText.textContent = `Màn: ${state.levelName} | Tick: ${state.tick} | Đom đóm đã gom: ${collected}/${state.fireflies.length}`;
    this.statsText.textContent = `Máu: ${state.player.hp}/${PLAYER_MAX_HP}  ·  Mang theo: ${state.player.carriedFireflies} (cần ${FIREFLIES_PER_LANTERN}/đèn)  ·  Đèn sáng: ${lit}/${total}`;
    this.pauseBtn.textContent = paused ? 'Tiếp tục (P)' : 'Tạm dừng';

    if (state.status === 'won') {
      this.banner.style.display = 'block';
      this.banner.style.borderColor = '#ffd166';
      this.banner.textContent = 'Ánh sáng trở lại Đảo Đèn Lồng! Bạn đã thắng — Nhấn R để chơi lại.';
    } else if (state.status === 'lost') {
      this.banner.style.display = 'block';
      this.banner.style.borderColor = '#ef4444';
      this.banner.textContent = 'Mây đã kiệt sức trước Bóng Mực! Nhấn R để thử lại.';
    } else if (paused) {
      this.banner.style.display = 'block';
      this.banner.style.borderColor = '#94a3b8';
      this.banner.textContent = 'Đang tạm dừng — Nhấn P để tiếp tục.';
    } else {
      this.banner.style.display = 'none';
    }
  }
}
