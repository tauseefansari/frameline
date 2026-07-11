"use client";

import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import MovieFilterOutlined from "@mui/icons-material/MovieFilterOutlined";
import PublishedWithChangesOutlined from "@mui/icons-material/PublishedWithChangesOutlined";
import RestoreOutlined from "@mui/icons-material/RestoreOutlined";
import { alpha, Box, Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { concatVideosApi } from "@/lib/studio/api-client";
import { downloadBlob, formatMegabytes, formatTimecode } from "@/lib/format";
import { useApiAction } from "@/lib/hooks/use-api-action";
import { useObjectUrl } from "@/lib/hooks/use-object-url";
import { useToast } from "@/lib/hooks/use-toast";
import { useGlobalProgress } from "@/lib/hooks/use-global-progress";
import { useVideoPlayer } from "@/lib/hooks/use-video-player";
import { getEffectiveDuration } from "@/lib/studio/clip-utils";
import { probeVideoDuration } from "@/lib/video/thumbnail.client";
import type { ClipRange, StudioClip } from "@/lib/types/studio";
import { MAX_CONCAT_FILES } from "@/lib/constants/api";
import { MergeClipRow, type ClipMeta } from "@/components/studio/MergeClipRow";
import { SectionTitle } from "@/components/studio/SectionTitle";
import { VideoStage } from "@/components/studio/VideoStage";
import { VideoStageSkeleton } from "@/components/studio/StudioSkeletons";

export function MergeWorkspace({
  libraryClips,
  onMergeInPlace,
}: {
  libraryClips: StudioClip[];
  /**
   * When provided, the workspace shows a “Replace in library” action that
   * hands the merged file back to the parent along with the ids of the clips
   * that were included in the merge — the parent uses those ids to swap the
   * sources out for a single merged entry.
   */
  onMergeInPlace?: (file: File, replacedClipIds: string[]) => void;
}) {
  const t = useTranslations("studio.merge");
  const te = useTranslations("errors");
  const theme = useTheme();
  const toast = useToast();

  /** Probed duration + per-clip trim, keyed by library clip id. */
  const [meta, setMeta] = useState<Record<string, ClipMeta>>({});
  /** Library ids the user has chosen to skip from the merge. */
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());

  /**
   * `excluded` may carry stale ids for clips that have since been removed from
   * the library. Derive an effective set so we never read those stale ids when
   * iterating, while keeping the raw state lazy (purged on the next user toggle).
   */
  const effectiveExcluded = useMemo(() => {
    const present = new Set(libraryClips.map((c) => c.id));
    const next = new Set<string>();
    for (const id of excluded) if (present.has(id)) next.add(id);
    return next;
  }, [excluded, libraryClips]);

  const fallback = te("validation_error");

  const merge = useApiAction<{ files: File[]; ranges: Array<ClipRange | null> }, Blob>(
    ({ files, ranges }) => concatVideosApi(files, ranges, fallback),
    {
      fallbackError: fallback,
      onSuccess: () => toast.success(t("toast.mergedMessage"), t("toast.mergedTitle")),
      onError: (msg) => toast.error(msg, t("toast.errorTitle")),
    },
  );

  const mergedBlob = merge.state.data;
  const mergedUrl = useObjectUrl(mergedBlob);
  // Local player instance so the merged-preview controls don't collide with
  // the source-clip player on the main workspace.
  const mergedPlayer = useVideoPlayer();

  // Track which blob has been staged back into the library so a re-render
  // doesn’t keep appending the same merge result.
  const [stagedBlob, setStagedBlob] = useState<Blob | null>(null);

  // Drop entries whenever a library clip disappears: purge stale ids the next
  // time the user mutates the set (handled by `effectiveExcluded` above).

  // Probe duration for any newly-added library clip.
  const { wrap: wrapProgress } = useGlobalProgress();
  useEffect(() => {
    let cancelled = false;
    const missing = libraryClips.filter((c) => !meta[c.id]);
    if (missing.length === 0) return;
    void wrapProgress(
      Promise.all(
        missing.map(async (c) => ({ id: c.id, duration: await probeVideoDuration(c.file) })),
      ),
    ).then((results) => {
      if (cancelled) return;
      setMeta((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (!next[r.id]) next[r.id] = { durationSec: r.duration, range: null };
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [libraryClips, meta, wrapProgress]);

  /** Library clips that will participate in the merge, in library order. */
  const includedClips = useMemo(
    () => libraryClips.filter((c) => !effectiveExcluded.has(c.id)),
    [libraryClips, effectiveExcluded],
  );

  const handleMergeInPlace = useCallback(() => {
    if (!mergedBlob || !onMergeInPlace || mergedBlob === stagedBlob) return;
    const file = new File([mergedBlob], t("downloadFilename"), { type: "video/mp4" });
    onMergeInPlace(
      file,
      includedClips.map((c) => c.id),
    );
    setStagedBlob(mergedBlob);
    toast.success(t("toast.replacedInLibrary.message"), t("toast.replacedInLibrary.title"));
  }, [mergedBlob, onMergeInPlace, stagedBlob, includedClips, t, toast]);

  // Single pass over included clips: derive both the total duration and the
  // per-clip cumulative start offset (used by the row UI). Avoids iterating
  // the same list twice with the same `getEffectiveDuration` call.
  const { totalDuration, cumulativeStarts } = useMemo(() => {
    const starts = new Map<string, number>();
    let acc = 0;
    for (const c of includedClips) {
      starts.set(c.id, acc);
      const m = meta[c.id];
      if (!m) continue;
      acc += getEffectiveDuration(m.range, m.durationSec);
    }
    return { totalDuration: acc, cumulativeStarts: starts };
  }, [includedClips, meta]);

  const toggleExcluded = useCallback((id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setClipRange = useCallback((id: string, range: ClipRange | null) => {
    setMeta((prev) => {
      const m = prev[id];
      if (!m) return prev;
      return { ...prev, [id]: { ...m, range } };
    });
  }, []);

  const resetTrims = useCallback(() => {
    setMeta((prev) => {
      const next: Record<string, ClipMeta> = {};
      for (const [id, m] of Object.entries(prev)) {
        next[id] = { ...m, range: null };
      }
      return next;
    });
  }, []);

  const handleMerge = () => {
    if (includedClips.length < 2) {
      toast.warning(t("errors.needTwo"));
      return;
    }
    if (includedClips.length > MAX_CONCAT_FILES) {
      toast.warning(t("errors.maxReached", { max: MAX_CONCAT_FILES }));
      return;
    }
    merge.run({
      files: includedClips.map((c) => c.file),
      ranges: includedClips.map((c) => meta[c.id]?.range ?? null),
    });
  };

  // Per-clip cumulative timestamps are derived above alongside totalDuration.

  return (
    <Stack spacing={2}>
      <SectionTitle>{t("title")}</SectionTitle>
      <Typography variant="body2" color="text.secondary">
        {t("subtitle")}
      </Typography>

      {libraryClips.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
            borderRadius: 2,
            p: { xs: 3, md: 4 },
            textAlign: "center",
            color: "text.secondary",
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="body2">{t("noLibrary")}</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={t("clipCount", {
                count: includedClips.length,
                max: MAX_CONCAT_FILES,
              })}
            />
            <Chip
              size="small"
              label={t("totalDuration", {
                duration: formatTimecode(totalDuration),
              })}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="text"
              startIcon={<RestoreOutlined />}
              onClick={resetTrims}
              disabled={merge.isPending}
            >
              {t("resetTrims")}
            </Button>
          </Stack>

          <Stack spacing={1}>
            {libraryClips.map((clip, index) => (
              <MergeClipRow
                key={clip.id}
                clip={clip}
                meta={meta[clip.id]}
                index={index}
                excluded={effectiveExcluded.has(clip.id)}
                startSec={cumulativeStarts.get(clip.id) ?? 0}
                onToggle={() => toggleExcluded(clip.id)}
                onChangeRange={(r) => setClipRange(clip.id, r)}
              />
            ))}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MovieFilterOutlined />}
              onClick={handleMerge}
              disabled={includedClips.length < 2 || merge.isPending}
            >
              {merge.isPending ? t("merging") : t("merge")}
            </Button>
            {mergedBlob ? (
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                onClick={() => downloadBlob(mergedBlob, t("downloadFilename"))}
              >
                {t("download")}
              </Button>
            ) : null}
            {mergedBlob && onMergeInPlace ? (
              <Button
                variant="outlined"
                startIcon={<PublishedWithChangesOutlined />}
                onClick={handleMergeInPlace}
                disabled={mergedBlob === stagedBlob}
              >
                {mergedBlob === stagedBlob ? t("addedToLibrary") : t("mergeInPlace")}
              </Button>
            ) : null}
          </Stack>
          {merge.isPending ? <VideoStageSkeleton /> : null}

          {!merge.isPending && mergedBlob && mergedUrl ? (
            <Box sx={{ mt: 1 }}>
              <VideoStage
                src={mergedUrl}
                player={mergedPlayer}
                fileName={t("downloadFilename")}
                fileSizeMb={formatMegabytes(mergedBlob.size)}
              />
            </Box>
          ) : null}

          <Typography variant="caption" color="text.secondary">
            {t("orderNote")}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
