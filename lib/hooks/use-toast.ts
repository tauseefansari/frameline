"use client";

import { use } from "react";
import { ToastContext } from "@/components/toast/toast-context";
import type { ToastApi } from "@/lib/types/toast";

/** React 19 `use()`-based access to the toast API. */
export function useToast(): ToastApi {
  return use(ToastContext);
}
