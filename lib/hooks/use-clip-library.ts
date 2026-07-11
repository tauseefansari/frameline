"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { StudioClip } from "@/lib/types/studio";
import { createClipId } from "@/lib/studio/clip-utils";
import { useToast } from "./use-toast";

interface UseClipLibraryOptions {
  /** Reset every per-clip workflow state. Called whenever the active clip changes. */
  resetWorkflowState: () => void;
}

/**
 * Owns the studio clip library: the list of clips, the active selection, and
 * all CRUD callbacks (pick / add / select / remove). Surfaces toast feedback
 * for every interaction so consumers don't have to re-thread it.
 */
export function useClipLibrary({ resetWorkflowState }: UseClipLibraryOptions) {
  const t = useTranslations("studio");
  const toast = useToast();

  const [clips, setClips] = useState<StudioClip[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  const videoFile = useMemo<File | null>(
    () => clips.find((c) => c.id === activeClipId)?.file ?? null,
    [clips, activeClipId],
  );

  const pickVideo = useCallback(
    (file: File | null) => {
      if (!file) {
        setClips([]);
        setActiveClipId(null);
        resetWorkflowState();
        return;
      }
      const id = createClipId();
      setClips((prev) => [...prev, { id, file }]);
      setActiveClipId(id);
      resetWorkflowState();
      toast.success(
        t("toasts.videoSelected.message", { name: file.name }),
        t("toasts.videoSelected.title"),
      );
    },
    [resetWorkflowState, toast, t],
  );

  const addClips = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;
      const built: StudioClip[] = incoming.map((file) => ({
        id: createClipId(file.name.length),
        file,
      }));
      setClips((prev) => [...prev, ...built]);
      // If nothing was active, focus the first newly-added clip and reset workflow.
      if (!activeClipId) {
        setActiveClipId(built[0].id);
        resetWorkflowState();
      }
      toast.success(
        t("toasts.clipsAdded.message", { count: built.length }),
        t("toasts.clipsAdded.title"),
      );
    },
    [activeClipId, resetWorkflowState, toast, t],
  );

  const selectClip = useCallback(
    (id: string) => {
      if (id === activeClipId) return;
      const next = clips.find((c) => c.id === id);
      setActiveClipId(id);
      resetWorkflowState();
      if (next) {
        toast.info(
          t("toasts.videoReplaced.message", { name: next.file.name }),
          t("toasts.videoReplaced.title"),
        );
      }
    },
    [activeClipId, clips, resetWorkflowState, toast, t],
  );

  const removeClip = useCallback(
    (id: string) => {
      const removed = clips.find((c) => c.id === id);
      // Compute the new active clip up front so the setState updater stays pure.
      let nextActive: string | null | undefined;
      setClips((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeClipId) {
          nextActive = next[0]?.id ?? null;
        }
        return next;
      });
      if (nextActive !== undefined) {
        setActiveClipId(nextActive);
        resetWorkflowState();
      }
      if (removed) {
        toast.info(
          t("toasts.clipRemoved.message", { name: removed.file.name }),
          t("toasts.clipRemoved.title"),
        );
      }
    },
    [activeClipId, clips, resetWorkflowState, toast, t],
  );

  return {
    clips,
    setClips,
    activeClipId,
    setActiveClipId,
    videoFile,
    pickVideo,
    addClips,
    selectClip,
    removeClip,
  };
}
