"use client";

import { startTransition, useActionState, useCallback, useEffect, useRef } from "react";
import { useGlobalProgress } from "@/lib/hooks/use-global-progress";

export type ApiActionState<TResult> = {
  data: TResult | null;
  error: string | null;
};

/**
 * Thin wrapper over React 19.2 `useActionState` that always carries
 * `{ data, error }` and exposes a typed `run(input)` callable.
 *
 * Optional `onStart`/`onSuccess`/`onError` callbacks fire exactly once per
 * state transition so callers can surface toasts/notifications without
 * mirroring state in their own effects. Every dispatch also pings the
 * global progress bar, so individual buttons never need their own spinner.
 */
export function useApiAction<TInput, TResult>(
  runner: (input: TInput) => Promise<TResult>,
  options?: {
    fallbackError?: string;
    onStart?: (input: TInput) => void;
    onSuccess?: (data: TResult) => void;
    onError?: (message: string) => void;
  },
): {
  state: ApiActionState<TResult>;
  isPending: boolean;
  run: (input: TInput) => void;
  reset: () => void;
} {
  const fallback = options?.fallbackError ?? "Action failed.";
  const { begin: beginProgress } = useGlobalProgress();

  const [state, dispatch, isPending] = useActionState<
    ApiActionState<TResult>,
    TInput | { __reset: true }
  >(
    async (prev, input) => {
      if (input && typeof input === "object" && "__reset" in input) {
        return { data: null, error: null };
      }
      try {
        const data = await runner(input as TInput);
        return { data, error: null };
      } catch (err) {
        return {
          data: prev.data,
          error: err instanceof Error ? err.message : fallback,
        };
      }
    },
    { data: null, error: null },
  );

  // Track the global progress strip via `isPending` instead of begin/release
  // inside the async action: React 19 runs `useActionState` actions in a
  // transition, so any `setState` inside them is deferred and the progress
  // bar would only flicker on at the end. Reading `isPending` outside the
  // transition makes the bar light up immediately on dispatch.
  const releaseRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (isPending && !releaseRef.current) {
      releaseRef.current = beginProgress();
    } else if (!isPending && releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }
    return () => {
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
    };
  }, [isPending, beginProgress]);

  const onStart = options?.onStart;
  const run = useCallback(
    (input: TInput) => {
      onStart?.(input);
      startTransition(() => dispatch(input));
    },
    [dispatch, onStart],
  );

  const reset = useCallback(() => {
    startTransition(() => dispatch({ __reset: true }));
  }, [dispatch]);

  // Fire callbacks once per data/error transition (compare-by-identity).
  const prevDataRef = useRef<TResult | null>(state.data);
  const prevErrorRef = useRef<string | null>(state.error);
  const onSuccess = options?.onSuccess;
  const onError = options?.onError;

  useEffect(() => {
    if (state.data !== prevDataRef.current) {
      prevDataRef.current = state.data;
      if (state.data !== null) onSuccess?.(state.data);
    }
    if (state.error !== prevErrorRef.current) {
      prevErrorRef.current = state.error;
      if (state.error) onError?.(state.error);
    }
  }, [state.data, state.error, onSuccess, onError]);

  return { state, isPending, run, reset };
}
