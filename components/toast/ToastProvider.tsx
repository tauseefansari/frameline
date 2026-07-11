"use client";

import { Alert, AlertTitle, Box, Stack } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TOAST_DEFAULT_DURATION_MS, TOAST_MAX_VISIBLE } from "@/lib/constants/ui";
import { ToastContext } from "@/components/toast/toast-context";
import type { ToastApi, ToastInput, ToastSeverity } from "@/lib/types/toast";

type ToastEntry = Required<Pick<ToastInput, "message">> & {
  id: string;
  severity: ToastSeverity;
  title?: string;
  durationMs: number | null;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common.a11y");
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const show = useCallback((toast: ToastInput): string => {
    counterRef.current += 1;
    const id = `t-${Date.now()}-${counterRef.current}`;
    const severity: ToastSeverity = toast.severity ?? "info";
    const durationMs =
      toast.durationMs === undefined ? TOAST_DEFAULT_DURATION_MS[severity] : toast.durationMs;
    const entry: ToastEntry = {
      id,
      message: toast.message,
      severity,
      title: toast.title,
      durationMs,
    };
    setToasts((prev) => [...prev.slice(-TOAST_MAX_VISIBLE + 1), entry]);
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, title) => show({ message, title, severity: "success" }),
      error: (message, title) => show({ message, title, severity: "error" }),
      info: (message, title) => show({ message, title, severity: "info" }),
      warning: (message, title) => show({ message, title, severity: "warning" }),
      dismiss,
      dismissAll,
    }),
    [show, dismiss, dismissAll],
  );

  return (
    <ToastContext value={api}>
      {children}
      <Box
        role="region"
        aria-label={t("notifications")}
        sx={{
          position: "fixed",
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: "auto" },
          width: { xs: "auto", sm: 420 },
          maxWidth: { xs: "calc(100vw - 32px)", sm: 420 },
          zIndex: (theme) => theme.zIndex.snackbar,
          pointerEvents: "none",
        }}
      >
        <Stack
          spacing={1.25}
          sx={{ width: "100%", pointerEvents: "auto" }}
          aria-live="polite"
          aria-atomic="false"
        >
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
            ))}
          </AnimatePresence>
        </Stack>
      </Box>
    </ToastContext>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastEntry; onClose: () => void }) {
  useEffect(() => {
    if (toast.durationMs === null) return;
    const id = window.setTimeout(onClose, toast.durationMs);
    return () => window.clearTimeout(id);
  }, [toast.durationMs, onClose]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Alert
        severity={toast.severity}
        variant="filled"
        onClose={onClose}
        elevation={0}
        sx={{
          width: "100%",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
          backdropFilter: "blur(8px)",
          "& .MuiAlert-icon": { alignSelf: "flex-start", mt: "2px" },
        }}
      >
        {toast.title ? <AlertTitle>{toast.title}</AlertTitle> : null}
        {toast.message}
      </Alert>
    </motion.div>
  );
}
