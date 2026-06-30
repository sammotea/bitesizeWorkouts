"use client";

import { useSession } from "@/lib/store";
import ModifierPanel from "@/components/ModifierPanel";
import CandidateView from "@/components/CandidateView";
import LoggingView from "@/components/LoggingView";

export default function HomePage() {
  const phase = useSession((s) => s.phase);

  return (
    <div>
      {phase === "config" && <ModifierPanel />}
      {phase === "candidate" && <CandidateView />}
      {phase === "logging" && <LoggingView />}
    </div>
  );
}
