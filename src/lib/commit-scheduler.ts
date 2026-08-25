/**
 * Defers a write until the user stops changing their mind about it.
 *
 * Written after a real outage: the goals screen called a server action from a
 * controlled input's `onChange`, so typing "260" fired three database writes
 * and three route revalidations each — and revalidating `/` re-runs the home
 * screen's six queries. Roughly eighteen queries inside a second took the page
 * down. The field must stay instant, so local state still updates per
 * keystroke; only the *write* waits.
 *
 * Deliberately framework-free so the timing rules can be tested directly
 * rather than through a component.
 */
export const COMMIT_DELAY_MS = 600;

export interface CommitScheduler {
  /** Queue `run` under `key`, replacing any write still waiting under that key. */
  schedule(key: string, run: () => void): void;
  /** Run anything waiting under `key` now. */
  flush(key: string): void;
  /** Run everything waiting, in the order it was queued. */
  flushAll(): void;
  /** Drop everything waiting without running it. */
  cancelAll(): void;
  /** How many writes are currently waiting — for tests and diagnostics. */
  pendingCount(): number;
}

export function createCommitScheduler(delayMs: number = COMMIT_DELAY_MS): CommitScheduler {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const runners = new Map<string, () => void>();

  function clear(key: string) {
    const timer = timers.get(key);
    if (timer !== undefined) clearTimeout(timer);
    timers.delete(key);
    runners.delete(key);
  }

  return {
    schedule(key, run) {
      // Replacing rather than queueing: two edits to the same field are one
      // intention, and only the last value is worth writing.
      clear(key);
      runners.set(key, run);
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          const pending = runners.get(key);
          runners.delete(key);
          pending?.();
        }, delayMs)
      );
    },

    flush(key) {
      const pending = runners.get(key);
      clear(key);
      pending?.();
    },

    flushAll() {
      // Snapshot first: a runner is free to schedule more work.
      for (const key of [...runners.keys()]) this.flush(key);
    },

    cancelAll() {
      for (const key of [...timers.keys()]) clear(key);
    },

    pendingCount() {
      return runners.size;
    },
  };
}
