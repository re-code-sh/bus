/**
 * Type-safe browser storage helper with memory fallback for private/sandboxed modes.
 */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const backend = isLocalStorageAvailable() ? window.localStorage : new MemoryStorage();

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const val = backend.getItem(key);
      if (val === null) return defaultValue;
      return JSON.parse(val) as T;
    } catch {
      return defaultValue;
    }
  },
  getString(key: string, defaultValue: string): string {
    return backend.getItem(key) ?? defaultValue;
  },
  set(key: string, value: unknown): void {
    try {
      if (typeof value === 'string') {
        backend.setItem(key, value);
      } else {
        backend.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`[storage] Failed to set ${key}`, e);
    }
  },
  remove(key: string): void {
    backend.removeItem(key);
  }
};
