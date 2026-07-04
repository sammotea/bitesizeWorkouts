"use client";

// The save password is chosen by you and lives in APP_SECRET (server env).
// This is just the device-local copy so you enter it once: kept in
// localStorage (persists across sessions until cleared), never in the bundle.
const KEY = "saveSecret";

export function getStoredSecret(): string | null {
  return localStorage.getItem(KEY);
}

export function setStoredSecret(secret: string): void {
  localStorage.setItem(KEY, secret);
}

/** Forget the stored password (e.g. after a rejected save). */
export function clearStoredSecret(): void {
  localStorage.removeItem(KEY);
}
