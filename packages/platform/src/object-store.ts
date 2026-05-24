export type ObjectStore = {
  get(key: string): Promise<Uint8Array | undefined>;
  put(key: string, value: Uint8Array, contentType?: string): Promise<void>;
  delete(key: string): Promise<void>;
};

export class InMemoryObjectStore implements ObjectStore {
  private readonly objects = new Map<string, Uint8Array>();

  get(key: string): Promise<Uint8Array | undefined> {
    return Promise.resolve(this.objects.get(key));
  }

  put(key: string, value: Uint8Array): Promise<void> {
    this.objects.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }
}
