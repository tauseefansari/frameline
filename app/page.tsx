import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/components/home/HomePage";

export default function Page() {
  return (
    <AppShell studioHref="/studio" fullBleed>
      <HomePage studioHref="/studio" />
    </AppShell>
  );
}
