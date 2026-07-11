"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type GlobalProgressApi = {
  /** Mark a long-running task as started. Returns a token to release it. */
  begin: () => () => void;
  /**
   * Convenience wrapper: call `begin()`, await the promise, then release —
   * even on rejection. Use for local async work (file probes, thumbnail
   * decoding) so it pings the global bar without going through useApiAction.
   */
  wrap: <T>(promise: Promise<T>) => Promise<T>;
  /** Number of currently active tasks. */
  active: number;
};

const GlobalProgressContext = createContext<GlobalProgressApi | null>(null);

/**
 * Tracks the number of long-running async tasks in flight. The studio
 * mounts a thin {@link GlobalProgressBar} that watches `active` and shows
 * an indeterminate top-of-page progress strip whenever any task is running.
 *
 * Usage: hooks like {@link useApiAction} call `begin()` on dispatch and
 * invoke the returned token on settle. UI components do NOT touch this
 * context directly.
 */
export function GlobalProgressProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  // Stable counter id used by useApiAction to ensure each call releases
  // exactly once even if the component re-renders mid-flight.
  const seqRef = useRef(0);

  const begin = useCallback(() => {
    seqRef.current += 1;
    setActive((n) => n + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setActive((n) => Math.max(0, n - 1));
    };
  }, []);

  const wrap = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      const release = begin();
      try {
        return await promise;
      } finally {
        release();
      }
    },
    [begin],
  );

  const value = useMemo<GlobalProgressApi>(() => ({ begin, wrap, active }), [begin, wrap, active]);
  return <GlobalProgressContext value={value}>{children}</GlobalProgressContext>;
}

export function useGlobalProgress(): GlobalProgressApi {
  const ctx = useContext(GlobalProgressContext);
  // Safe fallback so tests / standalone renders don't throw.
  if (!ctx) {
    return {
      begin: () => () => undefined,
      wrap: <T,>(p: Promise<T>) => p,
      active: 0,
    };
  }
  return ctx;
}
