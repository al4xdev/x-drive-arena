import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { MemoryStorage } from './helpers.js';

globalThis.localStorage = new MemoryStorage();

const {
  I18nManager,
  LANG_STORAGE_KEY,
  translations,
} = await import('../../../src/i18n.js');

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

test('uses English by default and restores a saved language', () => {
  assert.equal(new I18nManager().getLang(), 'en');

  localStorage.setItem(LANG_STORAGE_KEY, 'pt');
  const restored = new I18nManager();
  assert.equal(restored.getLang(), 'pt');
  assert.equal(restored.t('matchVictory'), 'VITÓRIA DA PARTIDA!');
});

test('toggles and persists the selected language', () => {
  const manager = new I18nManager();

  assert.equal(manager.toggleLanguage(), 'pt');
  assert.equal(localStorage.getItem(LANG_STORAGE_KEY), 'pt');
  assert.equal(manager.toggleLanguage(), 'en');
  assert.equal(localStorage.getItem(LANG_STORAGE_KEY), 'en');
});

test('ignores unsupported languages and falls back for unknown keys', () => {
  const manager = new I18nManager();

  manager.setLanguage('es');
  assert.equal(manager.getLang(), 'en');
  assert.equal(manager.t('missingTranslation'), 'missingTranslation');
});

test('keeps the English and Portuguese dictionaries structurally aligned', () => {
  assert.deepEqual(
    Object.keys(translations.pt).sort(),
    Object.keys(translations.en).sort(),
  );
});
