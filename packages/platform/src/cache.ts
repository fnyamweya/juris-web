export type CacheStore = {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
};

type Entry = {
  value: unknown;
  expiresAt?: number;
};

export class InMemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();

  get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);

    if (!entry) {
      return Promise.resolve(undefined);
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return Promise.resolve(undefined);
    }

    return Promise.resolve(entry.value as T);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const entry: Entry = { value };

    if (ttlSeconds) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }

    this.entries.set(key, entry);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }
}
