"use client";

import { createContext } from "react";
import type { ToastApi } from "@/lib/types/toast";

const noop = (): never => {
  throw new Error("ToastContext must be used inside <ToastProvider>");
};

export const ToastContext = createContext<ToastApi>({
  show: noop,
  success: noop,
  error: noop,
  info: noop,
  warning: noop,
  dismiss: noop,
  dismissAll: noop,
});
