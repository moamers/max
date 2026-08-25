"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { createCommitScheduler, type CommitScheduler } from "@/lib/commit-scheduler";

/**
 * The one way a controlled input is allowed to persist itself.
 *
 * Never call a server action directly from `onChange`. Update local state for
 * responsiveness, then hand the write to `commit(key, fn)` — see
 * `src/lib/commit-scheduler.ts` for what went wrong when we didn't.
 *
 * `key` groups edits: use one per field, so editing two targets in a row
 * doesn't cancel the first.
 */
export function useDebouncedCommit(): {
  commit: (key: string, run: () => Promise<unknown>) => void;
  isPending: boolean;
} {
  const [isPending, startTransition] = useTransition();
  const scheduler = useRef<CommitScheduler | null>(null);
  scheduler.current ??= createCommitScheduler();

  const commit = useCallback(
    (key: string, run: () => Promise<unknown>) => {
      scheduler.current!.schedule(key, () => {
        startTransition(async () => {
          await run();
        });
      });
    },
    [startTransition]
  );

  // An edit still waiting when the screen closes would be lost silently, so it
  // is written on the way out rather than dropped.
  useEffect(() => {
    const current = scheduler.current!;
    return () => current.flushAll();
  }, []);

  return { commit, isPending };
}
