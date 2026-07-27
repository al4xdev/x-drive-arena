import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { MemoryStorage } from './helpers.js';

globalThis.localStorage = new MemoryStorage();

const {
  StateManager,
  STORAGE_KEY,
} = await import('../../../src/state.js');

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

test('loads independent default state values', () => {
  const first = new StateManager();
  const second = new StateManager();

  first.getConfig().targetScore = 9;
  first.getMatch().history.push({ pts: 1 });

  assert.equal(second.getConfig().targetScore, 4);
  assert.deepEqual(second.getMatch().history, []);
  assert.deepEqual(second.getGachaHistory(), []);
});

test('merges partial saved state and migrates legacy player names', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    config: {
      targetScore: 7,
      blader1Name: 'Você',
      blader2Name: 'Adversário',
    },
    match: { blader1Score: 3 },
  }));

  const manager = new StateManager();

  assert.deepEqual(manager.getConfig(), {
    minNum: 1,
    maxNum: 100,
    allowDup: false,
    targetScore: 7,
    blader1Name: 'YOU',
    blader2Name: 'OPPONENT',
  });
  assert.deepEqual(manager.getMatch(), {
    blader1Score: 3,
    blader2Score: 0,
    history: [],
  });
});

test('persists config and match updates', () => {
  const manager = new StateManager();

  manager.updateConfig({ maxNum: 64, allowDup: true });
  manager.updateMatch(2, 1, [{ bladerNum: 1, pts: 2 }]);

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(saved.config.maxNum, 64);
  assert.equal(saved.config.allowDup, true);
  assert.equal(saved.match.blader1Score, 2);
  assert.equal(saved.match.blader2Score, 1);
  assert.equal(saved.match.history.length, 1);

  manager.resetMatch();
  assert.deepEqual(manager.getMatch(), {
    blader1Score: 0,
    blader2Score: 0,
    history: [],
  });
});

test('keeps only the 30 newest draw results', () => {
  const manager = new StateManager();

  for (let index = 0; index < 35; index += 1) {
    manager.addGachaResult([index, index + 1], `Player ${index}`);
  }

  const history = manager.getGachaHistory();
  assert.equal(history.length, 30);
  assert.equal(history[0].num1, 34);
  assert.equal(history.at(-1).num1, 5);

  manager.clearGachaHistory();
  assert.deepEqual(manager.getGachaHistory(), []);
});

test('falls back safely when persisted JSON is invalid', () => {
  localStorage.setItem(STORAGE_KEY, '{not-json');

  const manager = new StateManager();

  assert.equal(manager.getConfig().targetScore, 4);
  assert.deepEqual(manager.getMatch().history, []);
});
