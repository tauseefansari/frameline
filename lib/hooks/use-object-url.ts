"use client";

import { useEffect, useMemo } from "react";

/**
 * Returns a stable object URL for a Blob/File and revokes it on unmount/replacement.
 * Returns `null` while no source is set.
 */
export function useObjectUrl(source: Blob | File | null): string | null {
  const url = useMemo(() => (source ? URL.createObjectURL(source) : null), [source]);

  useEffect(() => {
    if (!url) return;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
