"use client";

import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full min-h-11 rounded-md border border-line-strong bg-surface-raised px-3 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-forest/50 focus-visible:border-forest disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-subtle";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-risk-critical-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  error,
  id: idProp,
  className,
  children,
  ...props
}: { label: string; hint?: string; error?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div className="relative">
        <select id={id} className={cn(controlBase, "appearance-none py-2 pr-9", className)} {...props}>
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
      </div>
    </Field>
  );
}

/** Compact select without a visible label (pair with aria-label). */
export function InlineSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(controlBase, "min-h-10 appearance-none py-1.5 pr-8", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
    </div>
  );
}

export const inputClass = controlBase;

/**
 * Segmented single-choice control built from native radio inputs, so arrow-key
 * navigation and screen-reader semantics come for free.
 */
export function SegmentedControl<T extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
  size = "md",
}: {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex rounded-md border border-line-strong bg-surface-raised p-0.5">
        {options.map((o) => (
          <label key={String(o.value)} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(o.value)}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex items-center justify-center rounded-[5px] font-semibold text-ink-muted transition-colors hover:text-ink peer-checked:bg-forest peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                size === "md" ? "min-h-10 px-4 text-sm" : "min-h-8 px-3 text-xs"
              )}
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
