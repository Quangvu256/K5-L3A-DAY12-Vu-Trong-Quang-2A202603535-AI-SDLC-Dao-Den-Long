import { DT, FIREFLIES_PER_LANTERN, PLAYER_MAX_HP } from '../core/constants';
import { GameState } from '../core/types';

export interface HudCallbacks {
  onRestart: () => void;
  onTogglePause: () => void;
  onSelectLevel: (levelId: string) => void;
}

export class GameHud {
  private readonly root: HTMLDivElement;
  private readonly statusText: HTMLDivElement;
  private readonly statsText: HTMLDivElement;
  private readonly banner: HTMLDivElement;
  private readonly pauseBtn: HTMLButtonElement;
  private readonly level1Btn: HTMLButtonElement;
  private readonly level2Btn: HTMLButtonElement;

  constructor(container: HTMLElement, callbacks: HudCallbacks) {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:16px;';

    const topBar = document.createElement('div');
    topBar.style.cssText =
      'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;';

    const panel = document.createElement('div');
    panel.style.cssText =
      'pointer-events:auto;background:rgba(10,16,28,0.82);border:1px solid rgba(255,209,102,0.35);border-radius:10px;padding:12px 16px;backdrop-filter:blur(6px);min-width:300px;';

    const title = document.createElement('div');
    title.textContent = 'Đảo Đèn Lồng — Phase 2';
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
    hint.textContent = 'WASD: Đi | E: Thắp đèn (2) | Space: Quầng Sáng (1) | 1/2: Đổi màn | P/R';
    hint.style.cssText = 'font-size:12px;color:#cbd5e1;margin-right:8px;';

    const btnStyle =
      'cursor:pointer;background:#1e293b;color:#f8fafc;border:1px solid #475569;border-radius:6px;padding:6px 10px;font-size:12px;';

    this.level1Btn = document.createElement('button');
    this.level1Btn.textContent = 'Màn 1';
    this.level1Btn.style.cssText = btnStyle;
    this.level1Btn.onclick = () => callbacks.onSelectLevel('level-1');

    this.level2Btn = document.createElement('button');
    this.level2Btn.textContent = 'Màn 2';
    this.level2Btn.style.cssText = btnStyle;
    this.level2Btn.onclick = () => callbacks.onSelectLevel('level-2');

    this.pauseBtn = document.createElement('button');
    this.pauseBtn.textContent = 'Tạm dừng';
    this.pauseBtn.style.cssText = btnStyle;
    this.pauseBtn.onclick = callbacks.onTogglePause;

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Chơi lại (R)';
    restartBtn.style.cssText =
      'cursor:pointer;background:#ffd166;color:#0f172a;font-weight:600;border:none;border-radius:6px;padding:6px 10px;font-size:12px;';
    restartBtn.onclick = callbacks.onRestart;

    controlsBox.append(hint, this.level1Btn, this.level2Btn, this.pauseBtn, restartBtn);
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
    const cdSec = (state.player.flareCooldownTicks * DT).toFixed(1);
    const flareText =
      state.player.flareCooldownTicks > 0 ? `Hồi ${cdSec}s` : state.player.carriedFireflies >= 1 ? 'Sẵn sàng' : 'Thiếu đom đóm';

    this.statusText.textContent = `Màn: ${state.levelName} (${state.levelId}) | Tick: ${state.tick} | Đom đóm: ${collected}/${state.fireflies.length}`;
    this.statsText.textContent = `HP: ${state.player.hp}/${PLAYER_MAX_HP} · Mang: ${state.player.carriedFireflies} (đèn ${FIREFLIES_PER_LANTERN}) · Đèn: ${lit}/${total} · Quầng Sáng: ${flareText}`;
    this.pauseBtn.textContent = paused ? 'Tiếp tục (P)' : 'Tạm dừng';

    this.level1Btn.style.borderColor = state.levelId === 'level-1' ? '#ffd166' : '#475569';
    this.level2Btn.style.borderColor = state.levelId === 'level-2' ? '#ffd166' : '#475569';

    if (state.status === 'won') {
      this.banner.style.display = 'block';
      this.banner.style.borderColor = '#ffd166';
      this.banner.textContent = `Đã thắp sáng toàn bộ ${state.levelName}! Nhấn R để chơi lại hoặc phím 2 qua màn.`;
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
