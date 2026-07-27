import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { keyboardEvent } from './helpers.js';
import { KeyboardController } from '../../../src/keyboard.js';

let keydownHandler;
let visibleModal;

beforeEach(() => {
  keydownHandler = null;
  visibleModal = null;

  globalThis.window = {
    addEventListener(type, handler) {
      if (type === 'keydown') keydownHandler = handler;
    },
  };

  globalThis.document = {
    activeElement: { tagName: 'BODY' },
    getElementById() {
      return null;
    },
    querySelector(selector) {
      return selector === '.modal-overlay:not(.hidden)' ? visibleModal : null;
    },
    querySelectorAll() {
      return visibleModal ? [visibleModal] : [];
    },
  };
});

function createController() {
  const calls = [];
  const scorekeeper = {
    addScore(...args) {
      calls.push(['score', ...args]);
    },
    undoLastScore() {
      calls.push(['undo']);
    },
  };
  const soloDraw = {
    executeSoloDraw() {
      calls.push(['draw']);
    },
  };

  const controller = new KeyboardController(scorekeeper, soloDraw);
  controller.init();
  return calls;
}

test('maps draw, undo, and every scoring shortcut', () => {
  const calls = createController();
  const events = [
    keyboardEvent({ key: ' ', code: 'Space' }),
    keyboardEvent({ key: 'z', code: 'KeyZ' }),
    ...['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p'].map(key =>
      keyboardEvent({ key, code: `Key${key.toUpperCase()}` })),
  ];

  events.forEach(event => keydownHandler(event));

  assert.deepEqual(calls, [
    ['draw'],
    ['undo'],
    ['score', 1, 1, 'Spin Finish'],
    ['score', 1, 2, 'Burst Finish'],
    ['score', 1, 2, 'Over Finish'],
    ['score', 1, 3, 'Xtreme Finish'],
    ['score', 2, 1, 'Spin Finish'],
    ['score', 2, 2, 'Burst Finish'],
    ['score', 2, 2, 'Over Finish'],
    ['score', 2, 3, 'Xtreme Finish'],
  ]);
  assert.equal(events.every(event => event.defaultPrevented), true);
});

test('does not trigger gameplay shortcuts while typing or while a modal is open', () => {
  const calls = createController();

  document.activeElement = { tagName: 'INPUT' };
  keydownHandler(keyboardEvent({ key: 'q', code: 'KeyQ' }));

  document.activeElement = { tagName: 'BODY' };
  visibleModal = { classList: { add() {} } };
  keydownHandler(keyboardEvent({ key: 'r', code: 'KeyR' }));

  assert.deepEqual(calls, []);
});

test('Escape closes visible modals before processing gameplay shortcuts', () => {
  const calls = createController();
  let hidden = false;
  visibleModal = {
    classList: {
      add(className) {
        if (className === 'hidden') hidden = true;
      },
    },
  };
  const event = keyboardEvent({ key: 'Escape', code: 'Escape' });

  keydownHandler(event);

  assert.equal(hidden, true);
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(calls, []);
});
