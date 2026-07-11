"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import { alpha, Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, type DragEvent, type ReactNode } from "react";
import { SectionTitle } from "@/components/studio/SectionTitle";

const ACCEPT = "video/*";

export function DropZone({
  onFile,
  onFiles,
  hasFile,
  multiple,
  children,
}: {
  onFile: (file: File) => void;
  /** When provided alongside `multiple`, receives every dropped/selected video. */
  onFiles?: (files: File[]) => void;
  hasFile: boolean;
  multiple?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("studio.stage");
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsOver(false);
      const files = Array.from(e.dataTransfer.files ?? []).filter((f) =>
        f.type.startsWith("video/"),
      );
      if (files.length === 0) return;
      if (multiple && onFiles) {
        onFiles(files);
      } else {
        onFile(files[0]);
      }
    },
    [multiple, onFile, onFiles],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          if (list.length > 0) {
            if (multiple && onFiles) onFiles(list);
            else onFile(list[0]);
          }
          e.currentTarget.value = "";
        }}
      />
      <Box
        component={motion.div}
        animate={{ scale: isOver ? 1.005 : 1 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        onClick={() => !hasFile && inputRef.current?.click()}
        sx={{
          position: "relative",
          borderRadius: 3,
          border: hasFile
            ? "1px solid transparent"
            : `1.5px dashed ${alpha(theme.palette.primary.main, isOver ? 0.7 : 0.32)}`,
          background: hasFile
            ? "transparent"
            : alpha(theme.palette.primary.main, isOver ? 0.1 : 0.04),
          minHeight: hasFile ? 0 : { xs: 280, md: 340 },
          display: "flex",
          alignItems: hasFile ? "stretch" : "center",
          justifyContent: hasFile ? "stretch" : "center",
          cursor: hasFile ? "default" : "pointer",
          transition: "background-color 0.25s ease, border-color 0.25s ease",
          overflow: hasFile ? "visible" : "hidden",
          p: hasFile ? 0 : 4,
        }}
      >
        {hasFile ? (
          <Box sx={{ width: "100%" }}>{children}</Box>
        ) : (
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <CloudUploadOutlined
              sx={{
                fontSize: 44,
                color: (th) =>
                  th.palette.mode === "light" ? th.palette.primary.main : th.palette.primary.light,
              }}
            />
            <SectionTitle>{isOver ? t("drag") : t("empty")}</SectionTitle>
            <Typography variant="body2" color="text.secondary">
              {t("emptyHint")}
            </Typography>
            <Button variant="contained" startIcon={<CloudUploadOutlined />}>
              {t("metaLabel")}
            </Button>
          </Stack>
        )}
      </Box>
    </>
  );
}
