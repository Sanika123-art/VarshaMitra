"use client";

import { Info, Loader2, SearchX, TriangleAlert, CircleCheck, OctagonAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function LoadingBlock({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn("flex min-h-40 flex-col items-center justify-center gap-3 text-ink-muted", className)}
    >
      <Loader2 className="spinner text-forest" size={26} aria-hidden />
      <span className="text-sm">{label ?? t("states.loading")}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-deep text-ink-muted" aria-hidden>
        <Icon size={20} />
      </span>
      <h3 className="mt-3 font-sans text-base font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-lg border border-risk-critical/40 bg-risk-critical-soft px-6 py-10 text-center",
        className
      )}
    >
      <OctagonAlert className="text-risk-critical-ink" size={26} aria-hidden />
      <h3 className="mt-3 font-sans text-base font-semibold text-risk-critical-ink">
        {title ?? t("states.errorTitle")}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{body ?? t("states.errorBody")}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

type AlertVariant = "info" | "success" | "warning" | "danger";

const alertStyles: Record<AlertVariant, { box: string; icon: LucideIcon }> = {
  info: { box: "border-monsoon/30 bg-monsoon-soft text-monsoon-dark", icon: Info },
  success: { box: "border-risk-low/40 bg-risk-low-soft text-risk-low-ink", icon: CircleCheck },
  warning: { box: "border-risk-moderate/50 bg-risk-moderate-soft text-risk-moderate-ink", icon: TriangleAlert },
  danger: { box: "border-risk-critical/40 bg-risk-critical-soft text-risk-critical-ink", icon: OctagonAlert },
};

export function InlineAlert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = alertStyles[variant];
  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", box, className)}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5", "text-ink-muted")}>{children}</div>
      </div>
    </div>
  );
}
