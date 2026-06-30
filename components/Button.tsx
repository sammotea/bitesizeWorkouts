"use client";

import { clsx } from "@/lib/clsx";

type Variant = "primary" | "ghost" | "secondary";

export default function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-[4px] px-6 py-3.5 font-display text-sm font-medium uppercase tracking-widest transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-charcoal text-cream hover:bg-charcoal/90",
        variant === "secondary" &&
          "bg-line text-charcoal hover:brightness-95",
        variant === "ghost" &&
          "bg-transparent text-charcoal-soft hover:text-charcoal",
        className,
      )}
    />
  );
}
