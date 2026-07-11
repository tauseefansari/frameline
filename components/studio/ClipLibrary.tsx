"use client";

import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { alpha, Box, Chip, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ThumbnailSkeleton } from "@/components/studio/StudioSkeletons";
import { generateVideoThumbnail } from "@/lib/video/thumbnail.client";
import { formatMegabytes } from "@/lib/format";
import { useGlobalProgress } from "@/lib/hooks/use-global-progress";
import { THUMB_INNER_WIDTH_PX, THUMB_WIDTH_PX } from "@/lib/constants/studio";
import type { StudioClip } from "@/lib/types/studio";

export function ClipLibrary({
  clips,
  activeId,
  onSelect,
  onRemove,
  onReorder,
  onAddMore,
}: {
  clips: StudioClip[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (next: StudioClip[]) => void;
  onAddMore: () => void;
}) {
  const t = useTranslations("studio.library");

  if (clips.length === 0) return null;

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= clips.length) return;
    const next = clips.slice();
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onReorder(next);
  };

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
          {t("title")}
        </Typography>
        <Chip size="small" label={t("count", { count: clips.length })} />
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {t("reorderHint")}
        </Typography>
        <Tooltip title={t("addMore")}>
          <IconButton size="small" onClick={onAddMore} aria-label={t("addMore")}>
            <AddPhotoAlternateOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack
        direction="row"
        sx={{
          gap: 1.25,
          overflowX: "auto",
          pb: 1,
        }}
      >
        <AnimatePresence initial={false}>
          {clips.map((clip, index) => (
            <ClipThumb
              key={clip.id}
              clip={clip}
              active={clip.id === activeId}
              canMoveLeft={index > 0}
              canMoveRight={index < clips.length - 1}
              onSelect={() => onSelect(clip.id)}
              onRemove={() => onRemove(clip.id)}
              onMoveLeft={() => move(index, -1)}
              onMoveRight={() => move(index, 1)}
            />
          ))}
        </AnimatePresence>
      </Stack>
    </Stack>
  );
}

function ClipThumb({
  clip,
  active,
  canMoveLeft,
  canMoveRight,
  onSelect,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  clip: StudioClip;
  active: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  const t = useTranslations("studio.library");
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [thumb, setThumb] = useState<string | null>(null);
  const { wrap } = useGlobalProgress();

  useEffect(() => {
    let cancelled = false;
    void wrap(generateVideoThumbnail(clip.file, { width: THUMB_INNER_WIDTH_PX })).then((data) => {
      if (!cancelled) setThumb(data);
    });
    return () => {
      cancelled = true;
    };
  }, [clip.file, wrap]);

  return (
    <motion.div
      layout={reduced ? false : "position"}
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
      style={{ flex: "0 0 auto" }}
    >
      <Box
        onClick={onSelect}
        sx={{
          width: THUMB_WIDTH_PX,
          borderRadius: 2,
          border: `2px solid ${
            active ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.18)
          }`,
          bgcolor: alpha(theme.palette.primary.main, active ? 0.12 : 0.04),
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 160ms ease, background-color 160ms ease",
          "&:hover": {
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16 / 9",
            bgcolor: alpha(theme.palette.text.primary, 0.08),
            backgroundImage: thumb ? `url(${thumb})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          {!thumb ? <ThumbnailSkeleton /> : null}
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ p: 1, pr: 4, alignItems: "center" }}>
          <Stack direction="row" spacing={0}>
            <Tooltip title={t("moveLeft")}>
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLeft();
                  }}
                  disabled={!canMoveLeft}
                  aria-label={t("moveLeft")}
                  sx={{ p: 0.25 }}
                >
                  <ArrowBackOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t("moveRight")}>
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveRight();
                  }}
                  disabled={!canMoveRight}
                  aria-label={t("moveRight")}
                  sx={{ p: 0.25 }}
                >
                  <ArrowForwardOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" noWrap sx={{ fontWeight: 600 }}>
              {clip.file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("fileSize", { size: formatMegabytes(clip.file.size) })}
            </Typography>
          </Stack>
        </Stack>
        <Tooltip title={t("remove")}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              bgcolor: alpha(theme.palette.common.black, 0.55),
              color: "#fff",
              "&:hover": {
                bgcolor: alpha(theme.palette.common.black, 0.75),
              },
            }}
            aria-label={t("remove")}
          >
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </motion.div>
  );
}
