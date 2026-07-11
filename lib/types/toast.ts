import type { AlertColor } from "@mui/material";

export type ToastSeverity = AlertColor;

export type ToastInput = {
  message: string;
  severity?: ToastSeverity;
  /** Optional title shown in bold above the message. */
  title?: string;
  /** Auto-hide duration in ms; null = sticky until dismissed. */
  durationMs?: number | null;
};

export type ToastApi = {
  show: (toast: ToastInput) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};
