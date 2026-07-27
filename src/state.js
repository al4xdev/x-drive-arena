// Application State & LocalStorage Manager for Beyblade X Solo Arena

export const STORAGE_KEY = 'beyx_arena_solo_state_v2';

export const defaultState = {
  config: {
    minNum: 1,
    maxNum: 100,
    allowDup: false,
    targetScore: 4,
    blader1Name: 'YOU',
    blader2Name: 'OPPONENT'
  },
  match: {
    blader1Score: 0,
    blader2Score: 0,
    history: []
  },
  gacha: {
    history: []
  }
};

function createDefaultState() {
  return {
    config: { ...defaultState.config },
    match: { ...defaultState.match, history: [] },
    gacha: { ...defaultState.gacha, history: [] }
  };
}

export class StateManager {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loaded = JSON.parse(saved);
        const merged = {
          ...createDefaultState(),
          ...loaded,
          config: { ...defaultState.config, ...loaded.config },
          match: { ...defaultState.match, ...loaded.match },
          gacha: { ...defaultState.gacha, ...loaded.gacha }
        };
        if (merged.config.blader1Name === 'Você') merged.config.blader1Name = 'YOU';
        if (merged.config.blader2Name === 'Adversário') merged.config.blader2Name = 'OPPONENT';
        return merged;
      }
    } catch (e) {
      console.warn('Unable to load state from LocalStorage:', e);
    }
    return createDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Unable to save state to LocalStorage:', e);
    }
  }

  getConfig() {
    return this.state.config;
  }

  updateConfig(newConfig) {
    this.state.config = { ...this.state.config, ...newConfig };
    this.saveState();
  }

  getMatch() {
    return this.state.match;
  }

  updateMatch(score1, score2, history) {
    this.state.match = { blader1Score: score1, blader2Score: score2, history };
    this.saveState();
  }

  resetMatch() {
    this.state.match = { blader1Score: 0, blader2Score: 0, history: [] };
    this.saveState();
  }

  getGachaHistory() {
    return this.state.gacha.history || [];
  }

  addGachaResult(pair, firstLauncher) {
    if (!this.state.gacha.history) this.state.gacha.history = [];
    this.state.gacha.history.unshift({
      num1: pair[0],
      num2: pair[1],
      firstLauncher: firstLauncher || 'Você',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    if (this.state.gacha.history.length > 30) {
      this.state.gacha.history.pop();
    }
    this.saveState();
  }

  clearGachaHistory() {
    this.state.gacha.history = [];
    this.saveState();
  }
}

export const stateManager = new StateManager();
