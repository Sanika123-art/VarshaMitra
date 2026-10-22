"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Contextual explanation tooltip: works on hover, keyboard focus and tap; closes on Escape. */
export function InfoTip({
  label,
  children,
  align = "center",
}: {
  /** Accessible name for the trigger button. */
  label: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-paper-deep hover:text-forest"
      >
        <Info size={15} aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "absolute top-full z-30 mt-1.5 w-64 max-w-[78vw] rounded-md border border-line-strong bg-surface-raised px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink shadow-md",
            align === "start" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "end" && "right-0"
          )}
        >
          {children}
        </span>
      )}
    </span>
  );
}
