import { audio } from './audio.js';
import { particles } from './particles.js';
import { ScorekeeperController } from './scorekeeper.js';
import { SoloDrawController } from './soloDraw.js';
import { ConfigController } from './config.js';
import { KeyboardController } from './keyboard.js';
import { i18n } from './i18n.js';
import { stateManager } from './state.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Não foi possível ativar o modo offline do PWA:', error);
    });
  });
}

export function updateUITranslations() {
  const cfg = stateManager.getConfig();
  const name1 = (cfg.blader1Name || i18n.t('defaultPlayer1')).toUpperCase();
  const name2 = (cfg.blader2Name || i18n.t('defaultPlayer2')).toUpperCase();

  // Dropdown language label
  const langLabel = document.getElementById('lang-label');
  if (langLabel) langLabel.textContent = i18n.t('language');

  // Menu items
  const undoSpan = document.querySelector('#btn-undo-score span');
  if (undoSpan) undoSpan.textContent = i18n.t('undo');

  const historySpan = document.querySelector('#btn-history-toggle span');
  if (historySpan) historySpan.textContent = i18n.t('history');

  const configSpan = document.querySelector('#btn-config-toggle span');
  if (configSpan) configSpan.textContent = i18n.t('config');

  const soundSpan = document.querySelector('#btn-sound-toggle span:last-child');
  if (soundSpan) soundSpan.textContent = i18n.t('sound');

  const resetSpan = document.querySelector('#btn-quick-reset span');
  if (resetSpan) resetSpan.textContent = i18n.t('reset');

  // Card Tags reflect actual Blader Names!
  const redTag = document.querySelector('#card-bey-red .card-bey-tag');
  if (redTag) {
    const tagText = name1 === 'YOU' ? 'YOUR BEYBLADE' : (i18n.getLang() === 'en' ? `${name1}'S BEYBLADE` : `BEYBLADE DE ${name1}`);
    redTag.textContent = tagText;
  }

  const blueTag = document.querySelector('#card-bey-blue .card-bey-tag');
  if (blueTag) {
    const tagText = name2 === 'OPPONENT' ? "OPPONENT'S BEYBLADE" : (i18n.getLang() === 'en' ? `${name2}'S BEYBLADE` : `BEYBLADE DE ${name2}`);
    blueTag.textContent = tagText;
  }

  // Panel Titles reflect actual Blader Names!
  const leftPanelTitle = document.querySelector('#stage-left .panel-title');
  if (leftPanelTitle) {
    leftPanelTitle.textContent = `${i18n.t('registerPointYou').split('(')[0]} (${name1})`;
  }

  const rightPanelTitle = document.querySelector('#stage-right .panel-title');
  if (rightPanelTitle) {
    rightPanelTitle.textContent = `${i18n.t('registerPointOpponent').split('(')[0]} (${name2})`;
  }

  // First Launcher Badge Tag & Default state
  const badgeTag = document.querySelector('.first-launcher-badge .badge-tag');
  if (badgeTag) badgeTag.textContent = i18n.t('firstLaunchLabel');

  const valFirstLauncher = document.getElementById('val-first-launcher');
  if (valFirstLauncher && (valFirstLauncher.textContent.includes('ESPAÇO') || valFirstLauncher.textContent.includes('SPACE') || valFirstLauncher.textContent.includes('DRAW') || valFirstLauncher.textContent.includes('SORTEAR'))) {
    valFirstLauncher.textContent = i18n.t('pressSpaceToDraw');
  }

  // Modals (Config, History, Victory)
  const configHeader = document.querySelector('#config-modal .drawer-header h2');
  if (configHeader) configHeader.textContent = i18n.t('configTitle');

  const labelMinNum = document.querySelector('label[for="cfg-min-num"]');
  if (labelMinNum) labelMinNum.textContent = i18n.t('minNumLabel');

  const labelMaxNum = document.querySelector('label[for="cfg-max-num"]');
  if (labelMaxNum) labelMaxNum.textContent = i18n.t('maxNumLabel');

  const labelAllowDup = document.querySelector('#config-modal .toggle-checkbox span');
  if (labelAllowDup) labelAllowDup.textContent = i18n.t('allowDupLabel');

  const labelTargetScore = document.querySelector('label[for="cfg-target-score"]');
  if (labelTargetScore) labelTargetScore.textContent = i18n.t('targetScoreLabel');

  const labelBlader1 = document.querySelector('label[for="cfg-blader1-name"]');
  if (labelBlader1) labelBlader1.textContent = i18n.t('blader1NameLabel');

  const labelBlader2 = document.querySelector('label[for="cfg-blader2-name"]');
  if (labelBlader2) labelBlader2.textContent = i18n.t('blader2NameLabel');

  const btnSaveCfg = document.getElementById('btn-save-config');
  if (btnSaveCfg) btnSaveCfg.textContent = i18n.t('saveChanges');

  const btnResetCfg = document.getElementById('btn-reset-config');
  if (btnResetCfg) btnResetCfg.textContent = i18n.t('restoreDefaults');

  const historyHeader = document.querySelector('#history-modal .drawer-header h2');
  if (historyHeader) historyHeader.textContent = i18n.t('historyTitle');

  const victoryTitle = document.querySelector('#victory-modal .victory-title');
  if (victoryTitle) victoryTitle.textContent = i18n.t('matchVictory');

  const newMatchBtn = document.getElementById('btn-modal-new-match');
  if (newMatchBtn) newMatchBtn.textContent = i18n.t('newMatch');
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize background particles
  particles.init();

  // Instantiate controllers
  const scorekeeper = new ScorekeeperController();
  const soloDraw = new SoloDrawController();
  const config = new ConfigController();
  const keyboard = new KeyboardController(scorekeeper, soloDraw);

  // Init controllers
  scorekeeper.init();
  soloDraw.init();
  keyboard.init();

  config.init(() => {
    scorekeeper.render();
  });

  // Apply initial translations
  updateUITranslations();

  // Language toggle button
  const btnLang = document.getElementById('btn-lang-toggle');
  if (btnLang) {
    btnLang.addEventListener('click', (e) => {
      e.stopPropagation();
      i18n.toggleLanguage();
      updateUITranslations();
      scorekeeper.render();
    });
  }

  // Sound toggle button
  const btnSound = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  if (btnSound) {
    btnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = audio.toggleMute();
      if (soundIcon) {
        soundIcon.textContent = isMuted ? '🔇' : '🔊';
      }
    });
  }

  // Hamburger menu toggle
  const btnHamburger = document.getElementById('btn-hamburger');
  const headerDropdown = document.getElementById('header-dropdown');

  if (btnHamburger && headerDropdown) {
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = btnHamburger.classList.toggle('open');
      headerDropdown.classList.toggle('open', isOpen);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!btnHamburger.contains(e.target) && !headerDropdown.contains(e.target)) {
        btnHamburger.classList.remove('open');
        headerDropdown.classList.remove('open');
      }
    });

    // Close dropdown after clicking any action inside it
    headerDropdown.addEventListener('click', () => {
      btnHamburger.classList.remove('open');
      headerDropdown.classList.remove('open');
    });
  }
});
