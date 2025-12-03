// Mock for react-native-mmkv - provides in-memory storage for tests
class MMKVInstance {
  constructor() {
    this.storage = new Map();
  }

  set(key, value) {
    this.storage.set(key, String(value));
  }

  getString(key) {
    return this.storage.get(key) || undefined;
  }

  getNumber(key) {
    const value = this.storage.get(key);
    return value ? Number(value) : undefined;
  }

  getBoolean(key) {
    const value = this.storage.get(key);
    return value === 'true';
  }

  delete(key) {
    this.storage.delete(key);
  }

  clearAll() {
    this.storage.clear();
  }

  getAllKeys() {
    return Array.from(this.storage.keys());
  }
}

export const MMKV = new MMKVInstance();

export function createMMKV(options) {
  return new MMKVInstance();
}
