// Internationalization (i18n) Module for Beyblade X Arena Digital
// Default language: English ('en'), fallback support for Portuguese ('pt')

export const LANG_STORAGE_KEY = 'beyx_arena_lang_v1';

export const translations = {
  en: {
    // Top Header & Status
    defaultPlayer1: 'YOU',
    defaultPlayer2: 'OPPONENT',
    pressSpaceToDraw: '[ PRESS SPACE TO DRAW ]',
    firstLaunchLabel: 'FIRST LAUNCH:',
    launchesFirst: 'LAUNCHES FIRST',

    // Hamburger Dropdown
    undo: 'UNDO [Z]',
    history: 'HISTORY',
    config: 'SETTINGS',
    sound: 'SOUND',
    language: 'LANG: 🇺🇸 EN',
    reset: 'RESET MATCH',

    // Arena Stage Cards
    myBeyblade: 'MY BEYBLADE',
    opponentBeyblade: 'OPPONENT BEYBLADE',

    // Finish Action Panels
    registerPointYou: 'REGISTER POINT (YOU)',
    registerPointOpponent: 'REGISTER POINT (OPPONENT)',
    spinFinish: 'SPIN FINISH (+1)',
    burstFinish: 'BURST FINISH (+2)',
    overFinish: 'OVER FINISH (+2)',
    xtremeFinish: 'XTREME FINISH (+3)',

    // Victory Modal
    matchVictory: 'MATCH VICTORY!',
    newMatch: '🔥 NEW MATCH',

    // Config Modal
    configTitle: '⚙️ Arena Settings',
    collectionTitle: '🎰 Beyblade Collection',
    minNumLabel: 'Minimum Number (e.g. 1):',
    maxNumLabel: 'Total Beys in Collection (1 to N):',
    allowDupLabel: 'Allow 2 duplicate Beys in same match',
    rulesTitle: '🏆 Match Rules',
    targetScoreLabel: 'Target Score for Victory:',
    blader1NameLabel: 'Your Name (Red Side):',
    blader2NameLabel: 'Opponent Name (Blue Side):',
    saveChanges: '💾 Save Changes',
    restoreDefaults: 'Restore Defaults',
    errorMinMax: '⚠️ Minimum number must be strictly smaller than total collection.',
    errorTargetScore: '⚠️ Target score must be between 1 and 20.',

    // History Modal
    historyTitle: '📜 Match & Draw History',
    scoreHistoryTitle: '🏆 Scoring History',
    drawHistoryTitle: '🎰 Drawn Battles History',
    emptyScoreLog: 'No points recorded yet.',
    emptyDrawLog: 'No draws performed yet.',
    scored: 'scored',
    with: 'with'
  },
  pt: {
    // Top Header & Status
    defaultPlayer1: 'VOCÊ',
    defaultPlayer2: 'ADVERSÁRIO',
    pressSpaceToDraw: '[ ESPAÇO PARA SORTEAR ]',
    firstLaunchLabel: 'PRIMEIRO LANÇAMENTO:',
    launchesFirst: 'LANÇA PRIMEIRO',

    // Hamburger Dropdown
    undo: 'DESFAZER [Z]',
    history: 'HISTÓRICO',
    config: 'CONFIG',
    sound: 'SOM',
    language: 'IDIOMA: 🇧🇷 PT',
    reset: 'REINICIAR',

    // Arena Stage Cards
    myBeyblade: 'MEU BEYBLADE',
    opponentBeyblade: 'BEY ADVERSÁRIO',

    // Finish Action Panels
    registerPointYou: 'REGISTRAR PONTO (VOCÊ)',
    registerPointOpponent: 'REGISTRAR PONTO (ADVERSÁRIO)',
    spinFinish: 'SPIN FINISH (+1)',
    burstFinish: 'BURST FINISH (+2)',
    overFinish: 'OVER FINISH (+2)',
    xtremeFinish: 'XTREME FINISH (+3)',

    // Victory Modal
    matchVictory: 'VITÓRIA DA PARTIDA!',
    newMatch: '🔥 NOVA PARTIDA',

    // Config Modal
    configTitle: '⚙️ Configurações da Arena',
    collectionTitle: '🎰 Coleção de Beyblades',
    minNumLabel: 'Número Mínimo (Ex: 1):',
    maxNumLabel: 'Total de Beys na Coleção (1 até N):',
    allowDupLabel: 'Permitir 2 Beys iguais no mesmo combate',
    rulesTitle: '🏆 Regras do Placar',
    targetScoreLabel: 'Meta de Pontos para Vitória:',
    blader1NameLabel: 'Seu Nome (Lado Vermelho):',
    blader2NameLabel: 'Nome do Adversário (Lado Azul):',
    saveChanges: '💾 Salvar Alterações',
    restoreDefaults: 'Restaurar Padrões',
    errorMinMax: '⚠️ O número mínimo deve ser estritamente menor que o total da coleção.',
    errorTargetScore: '⚠️ A meta de pontos deve ser entre 1 e 20.',

    // History Modal
    historyTitle: '📜 Histórico da Partida & Sorteios',
    scoreHistoryTitle: '🏆 Histórico de Pontuação',
    drawHistoryTitle: '🎰 Histórico de Combates Sorteados',
    emptyScoreLog: 'Nenhum ponto registrado ainda.',
    emptyDrawLog: 'Nenhum sorteio realizado ainda.',
    scored: 'marcou',
    with: 'com'
  }
};

export class I18nManager {
  constructor() {
    this.currentLang = this.loadLanguage();
  }

  loadLanguage() {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'pt')) {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to read language setting:', e);
    }
    return 'en'; // Default is English
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'pt') return;
    this.currentLang = lang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Unable to save language setting:', e);
    }
  }

  toggleLanguage() {
    const nextLang = this.currentLang === 'en' ? 'pt' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  getLang() {
    return this.currentLang;
  }

  t(key) {
    const dict = translations[this.currentLang] || translations.en;
    return dict[key] || translations.en[key] || key;
  }
}

export const i18n = new I18nManager();
