import type { ElementType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "muted";

const tones: Record<Tone, string> = {
  default: "border border-line bg-surface shadow-xs",
  primary: "border border-forest-dark bg-forest-dark text-white shadow-sm",
  muted: "border border-line bg-paper-deep/60",
};

export function Card({
  as: Tag = "section",
  tone = "default",
  padded = true,
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  tone?: Tone;
  padded?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Tag className={cn("rounded-lg", tones[tone], padded && "p-5 sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  icon: Icon,
  title,
  description,
  action,
  level = 2,
  id,
  tone = "default",
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  level?: 2 | 3;
  id?: string;
  tone?: "default" | "onDark";
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const onDark = tone === "onDark";
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              onDark ? "bg-white/12 text-white" : "bg-forest-soft text-forest"
            )}
            aria-hidden
          >
            <Icon size={16} />
          </span>
        )}
        <div className="min-w-0">
          <Heading
            id={id}
            className={cn("font-sans text-base font-semibold leading-snug", onDark && "text-white")}
          >
            {title}
          </Heading>
          {description && (
            <p className={cn("mt-0.5 text-sm", onDark ? "text-white/75" : "text-ink-muted")}>{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
