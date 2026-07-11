import { AppShell } from "@/components/layout/AppShell";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import { getServerEnv, isLocalVisionEnabled } from "@/lib/config/env";
import { PiperVoiceId, isPiperVoiceId } from "@/lib/constants/piper-voices";

export default function StudioPage() {
  const configured = getServerEnv().PIPER_DEFAULT_VOICE;
  const defaultVoice: PiperVoiceId = isPiperVoiceId(configured) ? configured : PiperVoiceId.Amy;

  return (
    <AppShell studioHref="/studio">
      <StudioWorkspace defaultVoice={defaultVoice} localVisionEnabled={isLocalVisionEnabled()} />
    </AppShell>
  );
}
