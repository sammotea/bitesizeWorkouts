"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/store";
import GeneratorView from "@/components/GeneratorView";
import LoggingView from "@/components/LoggingView";

export default function WorkoutPage() {
  const phase = useSession((s) => s.phase);
  const ensureWorkout = useSession((s) => s.ensureWorkout);

  // Show a pre-generated standard workout on first load.
  useEffect(() => {
    ensureWorkout();
  }, [ensureWorkout]);

  return phase === "logging" ? <LoggingView /> : <GeneratorView />;
}
