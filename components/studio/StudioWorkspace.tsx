"use client";

import ContentCutOutlined from "@mui/icons-material/ContentCutOutlined";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import IosShareOutlined from "@mui/icons-material/IosShareOutlined";
import MovieFilterOutlined from "@mui/icons-material/MovieFilterOutlined";
import RecordVoiceOverOutlined from "@mui/icons-material/RecordVoiceOverOutlined";
import SubtitlesOutlined from "@mui/icons-material/SubtitlesOutlined";
import { Box, Paper, Stack, Tab, Tabs, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import type { RenderOptions } from "@/lib/types/api";
import type { TimelineRange } from "@/lib/types/studio";
import {
  downloadBlob,
  formatMegabytes,
  rebalanceTranscriptToVideo,
  transcriptExceedsVideoBudget,
} from "@/lib/format";
import { useObjectUrl } from "@/lib/hooks/use-object-url";
import { useReducedMotionFlag } from "@/lib/hooks/use-reduced-motion-flag";
import { useStudioActions } from "@/lib/hooks/use-studio-actions";
import { useClipLibrary } from "@/lib/hooks/use-clip-library";
import { useStudioKeyboardShortcuts } from "@/lib/hooks/use-studio-keyboard-shortcuts";
import { useToast } from "@/lib/hooks/use-toast";
import { useVideoPlayer } from "@/lib/hooks/use-video-player";
import type { PiperVoiceId } from "@/lib/constants/piper-voices";
import { ScriptTone, type TranscriptSegment } from "@/lib/types/studio";
import { createClipId } from "@/lib/studio/clip-utils";
import { normalizeSegmentsForTrack, resolveTrackDurationSec } from "@/lib/studio/speech-sync";
import { glassPaperBg } from "@/components/home/theme-visuals";
import { MergeWorkspace } from "@/components/studio/MergeWorkspace";
import { StudioExportTab } from "@/components/studio/StudioExportTab";
import { StudioPreviewPanel } from "@/components/studio/StudioPreviewPanel";
import { StudioSourceTab } from "@/components/studio/StudioSourceTab";
import { StudioTabPanel } from "@/components/studio/StudioTabPanel";
import { StudioTimelineTab } from "@/components/studio/StudioTimelineTab";
import { StudioTranscriptTab } from "@/components/studio/StudioTranscriptTab";
import { StudioVoiceTab } from "@/components/studio/StudioVoiceTab";

enum StudioTab {
  Source = "source",
  Transcript = "transcript",
  Voice = "voice",
  Timeline = "timeline",
  Export = "export",
  Merge = "merge",
}

export function StudioWorkspace({
  defaultVoice,
  localVisionEnabled,
}: {
  defaultVoice: PiperVoiceId;
  localVisionEnabled: boolean;
}) {
  const t = useTranslations("studio");
  const te = useTranslations("errors");
  const reduced = useReducedMotionFlag();
  const theme = useTheme();
  const player = useVideoPlayer();
  const toast = useToast();

  const [tab, setTab] = useState<StudioTab>(StudioTab.Source);
  const [transcriptOverride, setTranscriptOverride] = useState<string | null>(null);
  const [voice, setVoice] = useState<PiperVoiceId>(defaultVoice);
  const [tone, setTone] = useState<ScriptTone>(ScriptTone.Demo);
  const [customTone, setCustomTone] = useState<string>("");
  const [repoContext, setRepoContext] = useState<string>("");
  const [range, setRange] = useState<TimelineRange>({ in: 0, out: 0 });
  const [lastSeenTabSource, setLastSeenTabSource] = useState<File | null>(null);
  const [lastAutoSyncedSource, setLastAutoSyncedSource] = useState<File | null>(null);
  const [segmentsOverride, setSegmentsOverride] = useState<TranscriptSegment[] | null>(null);

  const fallback = te("validation_error");

  const notifyError = useCallback(
    (message: string) => {
      toast.error(message, t("toasts.errorTitle"));
    },
    [toast, t],
  );
  const notifySuccess = useCallback(
    (titleKey: "transcribe" | "synth" | "cut" | "render") => {
      toast.success(t(`toasts.${titleKey}.message`), t(`toasts.${titleKey}.title`));
    },
    [toast, t],
  );

  const {
    transcribe: transcribeAction,
    synth: synthAction,
    synthSync: synthSyncAction,
    cut: cutAction,
    clip: clipAction,
    render: renderAction,
    resetAll: resetActions,
  } = useStudioActions({
    fallback,
    notifySuccess,
    notifyError,
    onIntroDetected: (introSec) =>
      toast.info(
        t("toasts.introDetected.message", { seconds: introSec.toFixed(1) }),
        t("toasts.introDetected.title"),
      ),
    onSyncedSegments: setSegmentsOverride,
  });

  // Derive transcript-related state from action state (no mirror).
  const transcribeData = transcribeAction.state.data;
  const transcript = transcriptOverride ?? transcribeData?.text ?? "";
  const aiSegments: TranscriptSegment[] = transcribeData?.segments ?? [];
  const segments: TranscriptSegment[] = segmentsOverride ?? aiSegments;
  const trackDurationSec = resolveTrackDurationSec(
    player.duration,
    segments,
    transcribeData?.durationSec ?? 0,
  );
  const language = transcribeData?.language;
  // Prefer the time-synced result; fall back to plain-text synthesis.
  const audioBlob = synthSyncAction.state.data?.audioBlob ?? synthAction.state.data;
  const cutBlob = cutAction.state.data;
  const renderBlob = renderAction.state.data;

  const audioUrl = useObjectUrl(audioBlob);
  const cutUrl = useObjectUrl(cutBlob);
  const renderUrl = useObjectUrl(renderBlob);

  const latestActionError =
    transcribeAction.state.error ??
    synthAction.state.error ??
    synthSyncAction.state.error ??
    cutAction.state.error ??
    renderAction.state.error;
  // Errors and successes surface as toasts via action callbacks; this value is
  // kept only so we know which actions are in a non-pending error state.
  void latestActionError;

  /** Reset every per-clip workflow state. Called whenever the active clip changes. */
  const resetWorkflowState = useCallback(() => {
    setSegmentsOverride(null);
    setTranscriptOverride(null);
    setRange({ in: 0, out: 0 });
    setLastSeenTabSource(null);
    setLastAutoSyncedSource(null);
    resetActions();
  }, [resetActions]);

  const {
    clips,
    setClips,
    activeClipId,
    setActiveClipId,
    videoFile,
    pickVideo,
    addClips,
    selectClip,
    removeClip,
  } = useClipLibrary({ resetWorkflowState });
  const videoUrl = useObjectUrl(videoFile);

  // Auto-jump to transcript tab once a fresh transcription completes for the current file.
  if (transcribeData && lastSeenTabSource !== videoFile) {
    setLastSeenTabSource(videoFile);
    setTab(StudioTab.Transcript);
  }

  // Auto-sync timestamps as soon as a fresh transcript is ready *and* the
  // player has reported a real duration. Scale the AI segment boundaries to
  // the actual clip duration, then cap each segment's text to what Piper can
  // speak inside that window.
  if (
    transcribeData &&
    videoFile &&
    lastAutoSyncedSource !== videoFile &&
    segmentsOverride === null &&
    player.duration > 0
  ) {
    setLastAutoSyncedSource(videoFile);
    const total = player.duration;
    const script = transcriptOverride ?? transcribeData.text ?? "";
    const next = normalizeSegmentsForTrack(rebalanceTranscriptToVideo(script, total), total);
    if (next.length > 0) setSegmentsOverride(next);
  }

  useStudioKeyboardShortcuts(player, setRange);

  const fileSizeMb = videoFile ? formatMegabytes(videoFile.size) : "0.0";
  const estMinutes = player.duration > 0 ? Math.max(1, Math.round(player.duration / 60)) : null;

  const handleTranscribe = () => {
    if (!videoFile) {
      toast.warning(t("errors.noVideo"));
      return;
    }
    transcribeAction.run({ file: videoFile, tone, customTone, repoContext });
    // Jump to the Transcript tab so the user immediately sees the skeleton
    // (and then the script + segments) where the result lands.
    setTab(StudioTab.Transcript);
  };

  const handleSynth = () => {
    if (!transcript.trim()) {
      toast.warning(t("errors.noTranscript"));
      return;
    }
    if (segments.length > 0 && trackDurationSec > 0) {
      synthSyncAction.run({
        segments: normalizeSegmentsForTrack(segments, trackDurationSec),
        voice,
        totalDurationSec: trackDurationSec,
      });
      return;
    }
    synthAction.run({ text: transcript, voice });
  };

  const handleCut = () => {
    if (!videoFile) {
      toast.warning(t("errors.noVideo"));
      return;
    }
    if (range.out <= range.in) {
      toast.warning(te("bad_range"));
      return;
    }
    cutAction.run({ file: videoFile, in: range.in, out: range.out });
  };

  const handleClipInPlace = () => {
    if (!videoFile) {
      toast.warning(t("errors.noVideo"));
      return;
    }
    if (range.out <= range.in) {
      toast.warning(te("bad_range"));
      return;
    }
    clipAction.run({ file: videoFile, in: range.in, out: range.out });
  };

  // When the clip-in-place action resolves, swap the trimmed result into the
  // currently active library entry so the user keeps editing the same slot
  // (no extra item piles up in the library).
  const clipBlob = clipAction.state.data;
  const lastStagedClipRef = useRef<Blob | null>(null);
  useEffect(() => {
    if (!clipBlob || clipBlob === lastStagedClipRef.current || !videoFile || !activeClipId) return;
    lastStagedClipRef.current = clipBlob;
    const baseName = videoFile.name.replace(/\.[^.]+$/, "").replace(/-clip-\d+s-\d+s$/, "");
    const stem = `${baseName}-clip-${Math.round(range.in)}s-${Math.round(range.out)}s.mp4`;
    const file = new File([clipBlob], stem, { type: "video/mp4" });
    setClips((prev) => prev.map((c) => (c.id === activeClipId ? { ...c, file } : c)));
    toast.success(t("toasts.clip.message"), t("toasts.clip.title"));
  }, [clipBlob, videoFile, activeClipId, range.in, range.out, setClips, t, toast]);

  // Render handler — ExportTab assembles the options (voiceover/captions
  // toggles + trim slice) and we just hand the audio blob plus video file
  // to the API.
  const handleRender = (options: RenderOptions, includeVoiceover: boolean) => {
    if (!videoFile) {
      toast.warning(t("errors.noVideo"));
      return;
    }
    const audioFile =
      includeVoiceover && audioBlob
        ? new File([audioBlob], t("files.voiceAudio"), { type: "audio/mpeg" })
        : null;
    renderAction.run({ video: videoFile, audio: audioFile, options });
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, t("files.transcript"));
  };

  const handleTranscriptChange = useCallback(
    (next: string) => {
      setTranscriptOverride(next);
      // Edited text invalidates any AI/synced timestamps until the user resyncs.
      setSegmentsOverride(null);
      synthSyncAction.reset();
      synthAction.reset();
    },
    [synthAction, synthSyncAction],
  );

  const handleSegmentsChange = useCallback(
    (next: TranscriptSegment[] | null) => {
      setSegmentsOverride(next);
      synthSyncAction.reset();
      synthAction.reset();
    },
    [synthAction, synthSyncAction],
  );

  const handleSyncTimestamps = useCallback(() => {
    const total = player.duration > 0 ? player.duration : (transcribeData?.durationSec ?? 0);
    if (!total) {
      toast.warning(t("errors.noVideo"));
      return;
    }
    const next = normalizeSegmentsForTrack(rebalanceTranscriptToVideo(transcript, total), total);
    if (next.length === 0) {
      toast.warning(t("errors.noTranscript"));
      return;
    }
    setSegmentsOverride(next);
    synthSyncAction.reset();
    synthAction.reset();
    if (transcriptExceedsVideoBudget(transcript, total)) {
      toast.info(t("toasts.syncTrimmed.message"), t("toasts.syncTrimmed.title"));
    }
    toast.success(t("toasts.sync.message"), t("toasts.sync.title"));
  }, [
    player.duration,
    synthAction,
    synthSyncAction,
    t,
    toast,
    transcribeData?.durationSec,
    transcript,
  ]);

  const tabConfig: Array<{
    value: StudioTab;
    labelKey:
      | "tabs.source"
      | "tabs.transcript"
      | "tabs.voice"
      | "tabs.timeline"
      | "tabs.export"
      | "tabs.merge";
    icon: ReactElement;
  }> = [
    { value: StudioTab.Source, labelKey: "tabs.source", icon: <CloudUploadOutlined /> },
    { value: StudioTab.Transcript, labelKey: "tabs.transcript", icon: <SubtitlesOutlined /> },
    { value: StudioTab.Voice, labelKey: "tabs.voice", icon: <RecordVoiceOverOutlined /> },
    { value: StudioTab.Timeline, labelKey: "tabs.timeline", icon: <ContentCutOutlined /> },
    { value: StudioTab.Merge, labelKey: "tabs.merge", icon: <MovieFilterOutlined /> },
    { value: StudioTab.Export, labelKey: "tabs.export", icon: <IosShareOutlined /> },
  ];

  return (
    <Stack spacing={3}>
      <StudioPreviewPanel
        clips={clips}
        activeClipId={activeClipId}
        videoFile={videoFile}
        videoUrl={videoUrl ?? null}
        fileSizeMb={fileSizeMb}
        player={player}
        onPickVideo={pickVideo}
        onAddClips={addClips}
        onSelectClip={selectClip}
        onRemoveClip={removeClip}
        onReorderClips={setClips}
      />

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          background: glassPaperBg(theme, 0.55, 0.92),
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as StudioTab)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 3 }}
        >
          {tabConfig.map((cfg) => (
            <Tab
              key={cfg.value}
              value={cfg.value}
              label={t(cfg.labelKey)}
              icon={cfg.icon}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>

        <Box>
          <StudioTabPanel
            value={StudioTab.Source}
            active={tab}
            name="studio-source"
            reduced={reduced}
          >
            <StudioSourceTab
              localVisionEnabled={localVisionEnabled}
              hasVideo={!!videoFile}
              durationSec={player.duration}
              estMinutes={estMinutes}
            />
          </StudioTabPanel>

          <StudioTabPanel
            value={StudioTab.Transcript}
            active={tab}
            name="studio-transcript"
            reduced={reduced}
          >
            <StudioTranscriptTab
              localVisionEnabled={localVisionEnabled}
              isPending={transcribeAction.isPending}
              text={transcript}
              segments={segments}
              language={language}
              videoDuration={player.duration > 0 ? player.duration : undefined}
              hasVideo={!!videoFile}
              durationSec={player.duration}
              tone={tone}
              onToneChange={setTone}
              customTone={customTone}
              onCustomToneChange={setCustomTone}
              repoContext={repoContext}
              onRepoContextChange={setRepoContext}
              onTranscribe={handleTranscribe}
              onTextChange={handleTranscriptChange}
              onSegmentsChange={handleSegmentsChange}
              onDownload={downloadTranscript}
              onUseInVoice={() => setTab(StudioTab.Voice)}
              onSyncTimestamps={handleSyncTimestamps}
            />
          </StudioTabPanel>

          <StudioTabPanel
            value={StudioTab.Voice}
            active={tab}
            name="studio-voice"
            reduced={reduced}
          >
            <StudioVoiceTab
              voice={voice}
              onVoiceChange={setVoice}
              hasTranscript={!!transcript.trim()}
              hasSegments={segments.length > 0}
              isPending={synthAction.isPending || synthSyncAction.isPending}
              audioBlob={audioBlob}
              audioUrl={audioUrl ?? null}
              onSynth={handleSynth}
            />
          </StudioTabPanel>

          <StudioTabPanel
            value={StudioTab.Timeline}
            active={tab}
            name="studio-timeline"
            reduced={reduced}
          >
            <StudioTimelineTab
              hasVideo={!!videoFile}
              videoUrl={videoUrl ?? null}
              player={player}
              range={range}
              onRangeChange={setRange}
              cutBlob={cutBlob}
              cutUrl={cutUrl ?? null}
              isCutting={cutAction.isPending}
              isClipping={clipAction.isPending}
              onCut={handleCut}
              onClipInPlace={handleClipInPlace}
            />
          </StudioTabPanel>

          <StudioTabPanel
            value={StudioTab.Merge}
            active={tab}
            name="studio-merge"
            reduced={reduced}
          >
            <MergeWorkspace
              libraryClips={clips}
              onMergeInPlace={(file, replacedIds) => {
                // Swap every clip that participated in the merge for a single
                // merged entry, slotted into the position of the first one.
                const id = createClipId();
                const replaced = new Set(replacedIds);
                setClips((prev) => {
                  const firstIdx = prev.findIndex((c) => replaced.has(c.id));
                  const filtered = prev.filter((c) => !replaced.has(c.id));
                  const insertAt = firstIdx === -1 ? filtered.length : firstIdx;
                  return [
                    ...filtered.slice(0, insertAt),
                    { id, file },
                    ...filtered.slice(insertAt),
                  ];
                });
                // Focus the merged entry and clear per-clip workflow state so
                // the transcript/voice tabs don't keep stale data.
                setActiveClipId(id);
                resetWorkflowState();
              }}
            />
          </StudioTabPanel>

          <StudioTabPanel
            value={StudioTab.Export}
            active={tab}
            name="studio-export"
            reduced={reduced}
          >
            <StudioExportTab
              hasVideo={!!videoFile}
              audioBlob={audioBlob}
              segments={segments}
              range={range}
              playerDuration={player.duration}
              isPending={renderAction.isPending}
              renderBlob={renderBlob}
              renderUrl={renderUrl ?? null}
              onRender={handleRender}
            />
          </StudioTabPanel>
        </Box>
      </Paper>
    </Stack>
  );
}
