"use client";

import Link from "next/link";
import { useSession } from "@/lib/store";

export default function HomeLink({ className }: { className?: string }) {
  const reset = useSession((s) => s.reset);
  return (
    <Link href="/" className={className} onClick={() => reset()}>
      Home
    </Link>
  );
}
