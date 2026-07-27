export class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

export function keyboardEvent(overrides = {}) {
  return {
    key: '',
    code: '',
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    ...overrides,
  };
}
