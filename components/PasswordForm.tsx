"use client";

import { useState } from "react";
import { setStoredSecret } from "@/lib/session-auth";
import Button from "./Button";

/**
 * Inline save-password entry. Stores the value on submit and hands it to the
 * caller. Shown when no password is stored yet, or after a 401 cleared it.
 */
export default function PasswordForm({
  busy = false,
  label = "Unlock & Save",
  onSubmit,
}: {
  busy?: boolean;
  label?: string;
  onSubmit: (secret: string) => void;
}) {
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setStoredSecret(password);
    onSubmit(password);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <input
        type="password"
        name="save-password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Save password"
        className="w-full rounded-[4px] border border-line bg-white px-4 py-3.5 text-sm outline-none transition focus:border-charcoal"
      />
      <Button
        type="submit"
        disabled={busy || !password}
        className="w-full py-4 text-sm"
      >
        {busy ? "Saving…" : label}
      </Button>
    </form>
  );
}
