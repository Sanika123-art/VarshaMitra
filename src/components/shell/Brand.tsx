import { cn } from "@/lib/utils";

/** VarshaMitra's own mark: a raindrop with a sprout vein — deliberately not any official emblem. */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="VarshaMitra"
      className={cn("shrink-0", className)}
    >
      <rect width="40" height="40" rx="9" fill="var(--color-forest)" />
      <path
        d="M20 7.5c4.6 5.7 8 9.9 8 14.2a8 8 0 0 1-16 0c0-4.3 3.4-8.5 8-14.2z"
        fill="#fff"
      />
      <path d="M20 30.5V20" stroke="var(--color-forest)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 24c-2.6 0-4-1.4-4-3.8 2.6 0 4 1.4 4 3.8z" fill="var(--color-moss)" />
      <path d="M20 21.5c2.4 0 3.7-1.3 3.7-3.5-2.4 0-3.7 1.3-3.7 3.5z" fill="var(--color-monsoon)" />
    </svg>
  );
}

export function BrandLockup({ light = false, showTagline = true, tagline }: { light?: boolean; showTagline?: boolean; tagline?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-tight">
        <span className={cn("block font-serif text-xl font-semibold tracking-tight", light ? "text-white" : "text-forest-dark")}>
          VarshaMitra
        </span>
        {showTagline && tagline && (
          <span className={cn("hidden text-xs sm:block", light ? "text-white/70" : "text-ink-muted")}>{tagline}</span>
        )}
      </span>
    </span>
  );
}
