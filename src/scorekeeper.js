// Beyblade X Match Scorekeeper Controller

import { stateManager } from './state.js';
import { audio } from './audio.js';
import { particles } from './particles.js';

export class ScorekeeperController {
  constructor() {
    this.blader1Score = 0;
    this.blader2Score = 0;
    this.history = [];
    this.targetScore = 4;
    this.victoryTimer = null;
    this.longPressTimer = null;
    this.suppressNextArenaClick = false;
    this.suppressClickTimer = null;
    this.comboTimer = null;
  }

  init() {
    const match = stateManager.getMatch();
    const cfg = stateManager.getConfig();

    this.blader1Score = match.blader1Score || 0;
    this.blader2Score = match.blader2Score || 0;
    this.history = match.history || [];
    this.targetScore = cfg.targetScore || 4;

    this.bindEvents();
    this.render();
    
    // Ensure modal is hidden on clean load
    this.hideVictoryModal();
  }

  bindEvents() {
    // Finish buttons
    document.querySelectorAll('.btn-finish').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blader = parseInt(btn.dataset.blader);
        const pts = parseInt(btn.dataset.pts);
        const finishType = btn.dataset.type;
        this.addScore(blader, pts, finishType);
        btn.closest('.side-stage')
          ?.querySelector('.card-bey-display')
          ?.classList.remove('finish-panel-active');
        btn.blur();
      });
    });

    // Touch equivalent of hover: hold a Bey card to reveal its finish panel.
    document.querySelectorAll('.card-bey-display').forEach(card => {
      let startX = 0;
      let startY = 0;
      let longPressActivated = false;

      card.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

        startX = e.clientX;
        startY = e.clientY;
        longPressActivated = false;
        card.classList.add('touch-hold-pending');
        clearTimeout(this.longPressTimer);
        this.longPressTimer = setTimeout(() => {
          document.querySelectorAll('.card-bey-display.finish-panel-active')
            .forEach(activeCard => activeCard.classList.remove('finish-panel-active'));
          card.classList.add('finish-panel-active');
          card.classList.remove('touch-hold-pending');
          longPressActivated = true;
          this.armArenaClickSuppression();
        }, 320);
      });

      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 12) {
          clearTimeout(this.longPressTimer);
          card.classList.remove('touch-hold-pending');
        }
      });

      const finishPress = (e) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        clearTimeout(this.longPressTimer);
        card.classList.remove('touch-hold-pending');
        if (longPressActivated) this.armArenaClickSuppression();
      };

      card.addEventListener('pointerup', finishPress);
      card.addEventListener('pointercancel', finishPress);
      card.addEventListener('contextmenu', (e) => {
        if (window.matchMedia('(pointer: coarse)').matches) e.preventDefault();
      });
    });

    // Closing an open touch panel must not bubble into the global draw action.
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

      const activeCard = document.querySelector('.card-bey-display.finish-panel-active');
      if (!activeCard) return;

      const activePanel = activeCard.nextElementSibling;
      if (activeCard.contains(e.target) || activePanel?.contains(e.target)) return;

      activeCard.classList.remove('finish-panel-active');

      const targetAlreadyBlocksDraw = e.target.closest(
        'button, input, .modal-drawer, .modal-card, .modal-overlay, .top-broadcast-bar'
      );
      if (!targetAlreadyBlocksDraw) this.armArenaClickSuppression();
    }, true);

    document.addEventListener('click', (e) => {
      if (!this.suppressNextArenaClick) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.clearArenaClickSuppression();
    }, true);

    // Undo button
    const btnUndo = document.getElementById('btn-undo-score');
    if (btnUndo) {
      btnUndo.addEventListener('click', (e) => {
        e.stopPropagation();
        this.undoLastScore();
      });
    }

    // Quick reset
    const btnReset = document.getElementById('btn-quick-reset');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetMatch();
      });
    }

    // Modal button
    const btnNewMatch = document.getElementById('btn-modal-new-match');
    if (btnNewMatch) {
      btnNewMatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetMatch();
        this.hideVictoryModal();
      });
    }
  }

  armArenaClickSuppression() {
    this.suppressNextArenaClick = true;
    clearTimeout(this.suppressClickTimer);
    this.suppressClickTimer = setTimeout(() => this.clearArenaClickSuppression(), 1200);
  }

  clearArenaClickSuppression() {
    this.suppressNextArenaClick = false;
    clearTimeout(this.suppressClickTimer);
    this.suppressClickTimer = null;
  }

  addScore(bladerNum, pts, finishType) {
    audio.playPointScore(pts);

    const cfg = stateManager.getConfig();
    const bladerName = bladerNum === 1 ? cfg.blader1Name : cfg.blader2Name;

    if (bladerNum === 1) {
      this.blader1Score += pts;
      this.blader1Streak = (this.blader1Streak || 0) + 1;
      this.blader2Streak = 0;
    } else {
      this.blader2Score += pts;
      this.blader2Streak = (this.blader2Streak || 0) + 1;
      this.blader1Streak = 0;
    }

    this.history.unshift({
      bladerNum,
      bladerName,
      pts,
      finishType,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    this.save();
    this.render();
    const wonMatch = (bladerNum === 1 ? this.blader1Score : this.blader2Score) >= this.targetScore;
    if (wonMatch) this.clearTransientFeedback();

    // Trigger visual score bump & screen shake & arcade toast
    this.triggerScoreBump(bladerNum);
    this.triggerScreenShake(pts);
    if (!wonMatch) {
      this.triggerFinishToast(bladerNum, bladerName, pts, finishType);
    }

    // Particle FX based on Finish Type
    if (pts >= 3) {
      particles.triggerXDashSparks();
      particles.triggerShockwaveRing();
    } else if (pts >= 2) {
      particles.triggerShockwaveRing();
    }

    // Trigger Win Streak Combo Toast if streak >= 2
    const currentStreak = bladerNum === 1 ? this.blader1Streak : this.blader2Streak;
    if (!wonMatch && currentStreak >= 2) {
      clearTimeout(this.comboTimer);
      this.comboTimer = setTimeout(() => {
        this.triggerComboToast(bladerNum, bladerName, currentStreak);
        this.comboTimer = null;
      }, 350);
    }

    this.checkVictory(bladerNum, bladerName);
  }

  triggerComboToast(bladerNum, bladerName, streak) {
    const existing = document.querySelector('.combo-toast-banner');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `combo-toast-banner ${bladerNum === 1 ? 'combo-red' : 'combo-blue'}`;
    toast.innerHTML = `🔥 ${streak}x STREAK! ${bladerName.toUpperCase()} IS ON FIRE!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1600);
  }

  clearTransientFeedback() {
    clearTimeout(this.comboTimer);
    this.comboTimer = null;
    document.querySelector('.finish-toast-banner')?.remove();
    document.querySelector('.combo-toast-banner')?.remove();
  }

  triggerScoreBump(bladerNum) {
    const el = document.getElementById(bladerNum === 1 ? 'blader1-score' : 'blader2-score');
    if (el) {
      el.classList.remove('score-bump');
      void el.offsetWidth;
      el.classList.add('score-bump');
      setTimeout(() => el.classList.remove('score-bump'), 500);
    }
  }

  triggerScreenShake(pts) {
    const app = document.getElementById('app') || document.body;
    const shakeClass = pts >= 3 ? 'screen-shake-heavy' : (pts === 2 ? 'screen-shake-medium' : 'screen-shake-light');
    app.classList.remove('screen-shake-light', 'screen-shake-medium', 'screen-shake-heavy');
    void app.offsetWidth;
    app.classList.add(shakeClass);
    setTimeout(() => app.classList.remove(shakeClass), 450);
  }

  triggerFinishToast(bladerNum, bladerName, pts, finishType) {
    const existing = document.querySelector('.finish-toast-banner');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `finish-toast-banner ${bladerNum === 1 ? 'toast-red' : 'toast-blue'} ${pts >= 3 ? 'toast-xtreme' : ''}`;
    toast.innerHTML = `
      <span class="toast-pts">+${pts} PT${pts > 1 ? 'S' : ''}</span>
      <span class="toast-type">${finishType.toUpperCase()}</span>
      <span class="toast-name">${bladerName.toUpperCase()}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  }

  subtractScore(bladerNum) {
    audio.playClick();
    if (bladerNum === 1 && this.blader1Score > 0) {
      this.blader1Score -= 1;
    } else if (bladerNum === 2 && this.blader2Score > 0) {
      this.blader2Score -= 1;
    }

    this.save();
    this.render();
  }

  undoLastScore() {
    if (this.history.length === 0) return;
    audio.playClick();
    this.hideVictoryModal();

    const last = this.history.shift();
    if (last.bladerNum === 1) {
      this.blader1Score = Math.max(0, this.blader1Score - last.pts);
    } else {
      this.blader2Score = Math.max(0, this.blader2Score - last.pts);
    }

    this.save();
    this.render();
  }

  resetMatch() {
    audio.playClick();
    this.hideVictoryModal();
    this.blader1Score = 0;
    this.blader2Score = 0;
    this.history = [];
    this.save();
    this.render();
  }

  checkVictory(bladerNum, bladerName) {
    const currentScore = bladerNum === 1 ? this.blader1Score : this.blader2Score;
    if (currentScore >= this.targetScore) {
      if (this.victoryTimer) clearTimeout(this.victoryTimer);
      this.victoryTimer = setTimeout(() => {
        audio.playVictory();
        particles.setHyperdrive(true);
        particles.triggerTreasureFountain(bladerNum);
        this.showVictoryModal(bladerName, bladerNum);
        this.victoryTimer = null;
      }, 300);
    }
  }

  showVictoryModal(winnerName, bladerNum) {
    const modal = document.getElementById('victory-modal');
    const winnerEl = document.getElementById('modal-winner-name');
    const scoreEl = document.getElementById('modal-final-score');

    if (modal && winnerEl && scoreEl) {
      winnerEl.textContent = winnerName;
      scoreEl.textContent = `${this.blader1Score} - ${this.blader2Score}`;
      modal.classList.toggle('victory-red', bladerNum === 1);
      modal.classList.toggle('victory-blue', bladerNum === 2);
      modal.classList.remove('hidden');
      document.body.classList.remove('victory-celebration');
      void document.body.offsetWidth;
      document.body.classList.add('victory-celebration');
    }
  }

  hideVictoryModal() {
    if (this.victoryTimer) {
      clearTimeout(this.victoryTimer);
      this.victoryTimer = null;
    }
    const modal = document.getElementById('victory-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('victory-red', 'victory-blue');
    }
    document.body.classList.remove('victory-celebration');
    this.clearTransientFeedback();
    particles.stopTreasureFountain();
    particles.setHyperdrive(false);
  }

  save() {
    stateManager.updateMatch(this.blader1Score, this.blader2Score, this.history);
  }

  render() {
    const cfg = stateManager.getConfig();
    this.targetScore = cfg.targetScore || 4;

    const isMatchPoint = (this.blader1Score >= this.targetScore - 1 || this.blader2Score >= this.targetScore - 1) && (this.blader1Score < this.targetScore && this.blader2Score < this.targetScore);
    document.body.classList.toggle('match-point-active', isMatchPoint);

    const elTarget = document.getElementById('display-target-score');
    const elName1 = document.getElementById('display-blader1-name');
    const elName2 = document.getElementById('display-blader2-name');

    if (elTarget) elTarget.textContent = this.targetScore;
    if (elName1) elName1.textContent = cfg.blader1Name;
    if (elName2) elName2.textContent = cfg.blader2Name;

    const elScore1 = document.getElementById('blader1-score');
    const elScore2 = document.getElementById('blader2-score');
    if (elScore1) elScore1.textContent = this.blader1Score;
    if (elScore2) elScore2.textContent = this.blader2Score;

    const btnUndo = document.getElementById('btn-undo-score');
    if (btnUndo) {
      btnUndo.disabled = this.history.length === 0;
    }

    const logList = document.getElementById('score-log-list');
    if (logList) {
      if (this.history.length === 0) {
        logList.innerHTML = '<li class="empty-log">Nenhum ponto registrado ainda.</li>';
      } else {
        logList.innerHTML = this.history.map(item => `
          <li class="log-item">
            <span>
              <strong class="${item.bladerNum === 1 ? 'log-blader red' : 'log-blader blue'}">${item.bladerName}</strong>
              marcou <strong>+${item.pts} PT${item.pts > 1 ? 'S' : ''}</strong> com
              <span class="log-finish">${item.finishType}</span>
            </span>
            <small style="color: var(--text-muted);">${item.time}</small>
          </li>
        `).join('');
      }
    }
  }
}
