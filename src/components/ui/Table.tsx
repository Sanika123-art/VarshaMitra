"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const thClass = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted";
export const tdClass = "px-3 py-3 align-middle";

export function Table({ className, children, ...props }: React.ComponentProps<"table">) {
  return (
    <table className={cn("w-full border-collapse text-sm", className)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ className, children, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead className={cn("border-b border-line bg-paper-deep/60", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody className={cn("divide-y divide-line", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ComponentProps<"th">) {
  return (
    <th className={cn(thClass, className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn(tdClass, className)} {...props}>
      {children}
    </td>
  );
}

/** Horizontally scrollable table container with an accessible caption. */
export function TableShell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export type SortDirection = "asc" | "desc";

export function SortableTh({
  label,
  active,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("p-0", align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          thClass,
          "flex w-full items-center gap-1.5 hover:text-ink",
          align === "right" && "justify-end",
          active && "text-ink"
        )}
      >
        {label}
        <Icon size={13} aria-hidden />
      </button>
    </th>
  );
}
