import { cn } from "@/lib/utils";

/**
 * VarshaMitra Emblem:
 * Refined institutional mark with monsoon precipitation droplet, germinating seed sprout,
 * and soil contour lines in Forest Green (#123C32) and Harvest Gold (#E6A52E).
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="VarshaMitra"
      className={cn("shrink-0 select-none", className)}
    >
      {/* Neo-brutalist solid base with subtle shadow border */}
      <rect width="40" height="40" rx="8" fill="#123C32" />
      <rect x="1" y="1" width="38" height="38" rx="7" fill="none" stroke="#E6A52E" strokeWidth="1" strokeOpacity="0.4" />
      
      {/* Rainfall Drop Geometry */}
      <path
        d="M20 7c4.8 6 8.5 10.3 8.5 14.8a8.5 8.5 0 0 1-17 0c0-4.5 3.7-8.8 8.5-14.8z"
        fill="#F4F0E5"
      />
      {/* Center Sprout Stem */}
      <path d="M20 30V19" stroke="#123C32" strokeWidth="2.2" strokeLinecap="round" />
      
      {/* Sprout Foliage: Left Foliage in Harvest Gold, Right Foliage in Rain Blue */}
      <path d="M20 23.5c-3 0-4.6-1.6-4.6-4.2 3 0 4.6 1.6 4.6 4.2z" fill="#E6A52E" />
      <path d="M20 20.5c2.8 0 4.4-1.5 4.4-4 -2.8 0-4.4 1.5-4.4 4z" fill="#2878A5" />

      {/* Moisture Arc Accent */}
      <circle cx="20" cy="11.5" r="1.5" fill="#123C32" />
    </svg>
  );
}

export function BrandLockup({
  light = false,
  showTagline = true,
  tagline,
}: {
  light?: boolean;
  showTagline?: boolean;
  tagline?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight",
            light ? "text-[#F4F0E5]" : "text-[#123C32]"
          )}
        >
          VarshaMitra
        </span>
        {showTagline && (
          <span
            className={cn(
              "hidden font-mono text-[11px] font-semibold tracking-wider uppercase sm:block",
              light ? "text-[#F4F0E5]/70" : "text-[#252923]/70"
            )}
          >
            {tagline ?? "Agricultural Intelligence"}
          </span>
        )}
      </span>
    </span>
  );
}
