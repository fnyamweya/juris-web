export type JobQueue<TPayload = unknown> = {
  enqueue(name: string, payload: TPayload): Promise<void>;
};

export class InMemoryJobQueue<
  TPayload = unknown,
> implements JobQueue<TPayload> {
  readonly jobs: Array<{ name: string; payload: TPayload }> = [];

  enqueue(name: string, payload: TPayload): Promise<void> {
    this.jobs.push({ name, payload });
    return Promise.resolve();
  }
}
