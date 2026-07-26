// Config & Modal Drawer Controller

import { stateManager } from './state.js';
import { audio } from './audio.js';

export class ConfigController {
  init(onConfigUpdatedCallback) {
    this.onConfigUpdated = onConfigUpdatedCallback;
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Config modal toggles
    const btnOpenConfig = document.getElementById('btn-config-toggle');
    const btnCloseConfig = document.getElementById('btn-close-config');
    const configModal = document.getElementById('config-modal');

    if (btnOpenConfig && configModal) {
      btnOpenConfig.addEventListener('click', () => {
        audio.playClick();
        this.render();
        configModal.classList.remove('hidden');
      });
    }

    if (btnCloseConfig && configModal) {
      btnCloseConfig.addEventListener('click', () => {
        audio.playClick();
        configModal.classList.add('hidden');
      });
    }

    // History modal toggles
    const btnOpenHistory = document.getElementById('btn-history-toggle');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const historyModal = document.getElementById('history-modal');

    if (btnOpenHistory && historyModal) {
      btnOpenHistory.addEventListener('click', () => {
        audio.playClick();
        historyModal.classList.remove('hidden');
      });
    }

    if (btnCloseHistory && historyModal) {
      btnCloseHistory.addEventListener('click', () => {
        audio.playClick();
        historyModal.classList.add('hidden');
      });
    }

    // Backdrop tap to close modals
    [configModal, historyModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            audio.playClick();
            modal.classList.add('hidden');
          }
        });
      }
    });

    // Submit on Enter inside inputs
    const configInputs = document.querySelectorAll('#config-modal input');
    configInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.saveFromForm();
        }
      });
    });

    // Touch Steppers (- and + buttons)
    document.querySelectorAll('.btn-step').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        audio.playClick();
        this.hideError();
        const targetId = btn.dataset.target;
        const step = parseInt(btn.dataset.step, 10) || 0;
        const input = document.getElementById(targetId);
        if (input) {
          const currentVal = parseInt(input.value, 10) || 0;
          const min = input.hasAttribute('min') ? parseInt(input.min, 10) : -Infinity;
          const max = input.hasAttribute('max') ? parseInt(input.max, 10) : Infinity;
          const newVal = Math.max(min, Math.min(max, currentVal + step));
          input.value = newVal;
        }
      });
    });

    // Save config
    const btnSave = document.getElementById('btn-save-config');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveFromForm());
    }

    // Reset defaults
    const btnReset = document.getElementById('btn-reset-default-config');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetDefaults());
    }
  }

  showError(message) {
    audio.playClick();
    const errorEl = document.getElementById('config-error-msg');
    if (errorEl) {
      errorEl.textContent = `⚠️ ${message}`;
      errorEl.classList.remove('hidden');
    }
  }

  hideError() {
    const errorEl = document.getElementById('config-error-msg');
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }
  }

  saveFromForm() {
    this.hideError();

    const minNumInput = document.getElementById('cfg-min-num');
    const maxNumInput = document.getElementById('cfg-max-num');
    const targetScoreInput = document.getElementById('cfg-target-score');

    let minNum = parseInt(minNumInput?.value, 10);
    let maxNum = parseInt(maxNumInput?.value, 10);
    let targetScore = parseInt(targetScoreInput?.value, 10);

    if (isNaN(minNum) || minNum < 0) minNum = 1;
    if (isNaN(maxNum) || maxNum <= 0) maxNum = 100;
    if (isNaN(targetScore) || targetScore < 1) targetScore = 4;

    if (minNum >= maxNum) {
      this.showError(`O Total de Beys (${maxNum}) deve ser MAIOR que o Número Mínimo (${minNum})!`);
      return;
    }

    if (targetScore < 1 || targetScore > 20) {
      this.showError('A Meta de Pontos deve ser entre 1 e 20!');
      return;
    }

    const allowDup = document.getElementById('cfg-allow-dup')?.checked || false;
    const blader1Name = document.getElementById('cfg-blader1-name')?.value.trim() || 'VOCÊ';
    const blader2Name = document.getElementById('cfg-blader2-name')?.value.trim() || 'ADVERSÁRIO';

    audio.playClick();

    stateManager.updateConfig({
      minNum,
      maxNum,
      allowDup,
      targetScore,
      blader1Name,
      blader2Name
    });

    if (this.onConfigUpdated) {
      this.onConfigUpdated();
    }

    const configModal = document.getElementById('config-modal');
    if (configModal) configModal.classList.add('hidden');
  }

  resetDefaults() {
    audio.playClick();
    this.hideError();
    stateManager.updateConfig({
      minNum: 1,
      maxNum: 100,
      allowDup: false,
      targetScore: 4,
      blader1Name: 'VOCÊ',
      blader2Name: 'ADVERSÁRIO'
    });
    this.render();
    if (this.onConfigUpdated) {
      this.onConfigUpdated();
    }
  }

  render() {
    this.hideError();
    const cfg = stateManager.getConfig();

    const elMin = document.getElementById('cfg-min-num');
    const elMax = document.getElementById('cfg-max-num');
    const elDup = document.getElementById('cfg-allow-dup');
    const elTarget = document.getElementById('cfg-target-score');
    const elName1 = document.getElementById('cfg-blader1-name');
    const elName2 = document.getElementById('cfg-blader2-name');

    if (elMin) elMin.value = cfg.minNum || 1;
    if (elMax) elMax.value = cfg.maxNum || 100;
    if (elDup) elDup.checked = !!cfg.allowDup;
    if (elTarget) elTarget.value = cfg.targetScore || 4;
    if (elName1) elName1.value = cfg.blader1Name || 'VOCÊ';
    if (elName2) elName2.value = cfg.blader2Name || 'ADVERSÁRIO';
  }
}
