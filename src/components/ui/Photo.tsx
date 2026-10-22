"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Responsive photo with a fixed-aspect container (no layout shift), lazy loading
 * by default and a tidy fallback if the file fails to load.
 * The parent chooses the aspect ratio via `className` (e.g. "aspect-[4/3]").
 */
export function Photo({
  src,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
  position = "center",
  fallbackIcon: FallbackIcon = Sprout,
}: {
  src: string;
  /** Pass "" for purely decorative images. */
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** CSS object-position, e.g. "50% 30%". */
  position?: string;
  fallbackIcon?: LucideIcon;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-paper-deep", className)}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center text-ink-subtle" role={alt ? "img" : undefined} aria-label={alt || undefined}>
          {alt ? <FallbackIcon size={28} aria-hidden /> : <ImageOff size={22} aria-hidden />}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn("object-cover", imgClassName)}
          style={{ objectPosition: position }}
        />
      )}
    </div>
  );
}
