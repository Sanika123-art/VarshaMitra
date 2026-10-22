import type { ReactNode } from "react";

/** Standard page heading block: one h1, optional eyebrow, description, actions and meta row. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl leading-tight sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-base text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Small descriptive chip used in page header meta rows. */
export function MetaChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-sm font-medium text-ink-muted">
      {icon && <span className="text-forest" aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}

/** Section heading used between groups of cards. */
export function SectionHeading({
  eyebrow,
  title,
  body,
  id,
  center,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  id?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="mt-1 text-2xl leading-tight sm:text-3xl">
        {title}
      </h2>
      {body && <p className="mt-2 text-base text-ink-muted">{body}</p>}
    </div>
  );
}
