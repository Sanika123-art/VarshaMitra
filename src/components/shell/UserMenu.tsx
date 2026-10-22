"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, MapPin, ShieldCheck, Sprout, User } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import { ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Account disclosure menu: dashboard, change location, log out (with confirmation). */
export default function UserMenu() {
  const { t } = useTranslation();
  const { role, logout } = useAppState();
  const { full } = useLocationLabel();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu when the route changes
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!role) return null;
  const RoleIcon = role === "farmer" ? Sprout : ShieldCheck;
  const roleLabel = role === "farmer" ? t("login.roleFarmer") : t("login.roleOfficer");
  const home = role === "farmer" ? "/farmer/dashboard" : "/officer/dashboard";

  function doLogout() {
    setConfirming(false);
    setOpen(false);
    logout();
    router.push("/login");
  }

  const itemClass =
    "flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium text-ink hover:bg-paper-deep";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="user-menu-panel"
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line-strong bg-surface-raised px-3 text-sm font-semibold text-ink hover:border-forest/50"
      >
        <RoleIcon size={16} className="text-forest" aria-hidden />
        <span className="max-w-32 truncate">{roleLabel}</span>
        <ChevronDown size={14} className={cn("text-ink-subtle transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          id="user-menu-panel"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-line bg-surface-raised p-1.5 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="eyebrow">{t("shell.demoSession")}</p>
            <p className="mt-0.5 text-sm font-semibold">{role === "farmer" ? t("login.demoFarmer") : t("login.demoOfficer")}</p>
            <p className="text-xs text-ink-muted">{full}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href={home} className={itemClass}>
            <User size={16} className="text-forest" aria-hidden />
            {t("nav.dashboard")}
          </Link>
          <Link href="/location" className={itemClass}>
            <MapPin size={16} className="text-forest" aria-hidden />
            {t("location.changeLocation")}
          </Link>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className={cn(itemClass, "text-risk-critical-ink")}
          >
            <LogOut size={16} aria-hidden />
            {t("nav.logout")}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={t("shell.logoutTitle")}
        confirmLabel={t("nav.logout")}
        tone="danger"
        onConfirm={doLogout}
        onCancel={() => setConfirming(false)}
      >
        {t("shell.logoutBody")}
      </ConfirmDialog>
    </div>
  );
}
