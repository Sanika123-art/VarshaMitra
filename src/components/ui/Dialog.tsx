"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { Button } from "./Button";

/** Accessible confirmation dialog built on the native <dialog> element (focus trap + Escape for free). */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  tone = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-[min(92vw,26rem)] rounded-lg border border-line bg-surface p-0 text-ink shadow-lg"
    >
      <div className="p-6">
        <h2 id="confirm-dialog-title" className="font-sans text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-ink-muted">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
