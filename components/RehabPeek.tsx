"use client";

import { useEffect, useState } from "react";
import { localDate } from "@/lib/datetime";
import type { RehabDay } from "@/lib/types";

/** Landing-card meta: today's rehab progress (read-only, never creates the day). */
export default function RehabPeek() {
  const [text, setText] = useState("Daily rehab drills");

  useEffect(() => {
    fetch(`/api/rehab/${localDate()}?peek=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((day: RehabDay | null) => {
        if (!day) return;
        const ticks = Object.values(day.progress).flat();
        setText(`${ticks.filter(Boolean).length}/${ticks.length} done today`);
      })
      .catch(() => {
        // No DB / offline — keep the static line.
      });
  }, []);

  return <>{text}</>;
}
