"use client";

import { clsx } from "@/lib/clsx";

type Variant = "primary" | "ghost" | "soft";

export default function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-6 py-3.5 font-display text-sm font-bold uppercase tracking-widest transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-charcoal text-cream hover:bg-charcoal/90",
        variant === "soft" &&
          "bg-mint text-charcoal hover:bg-mint-deep",
        variant === "ghost" &&
          "bg-transparent text-charcoal-soft hover:text-charcoal",
        className,
      )}
    />
  );
}
