"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, MapPin, X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { BrandLockup } from "./Brand";
import Footer from "./Footer";
import { navFor } from "./nav";
import TextSizeControl from "./TextSizeControl";
import UserMenu from "./UserMenu";

const APP_PREFIX = /^\/(farmer|officer|location)(\/|$)/;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UtilityBar() {
  const { t } = useTranslation();
  return (
    <div className="bg-forest-dark text-white">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <p className="min-w-0 text-xs text-white/85 sm:text-sm">
          <span className="mr-2 rounded-sm bg-white/15 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
            {t("shell.platformBadge")}
          </span>
          <span className="hidden sm:inline">{t("shell.notice")}</span>
          <span className="sm:hidden">{t("shell.noticeShort")}</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <TextSizeControl />
          </div>
          <LanguageSwitcher onDark />
        </div>
      </div>
    </div>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { role, hydrated } = useAppState();
  const links = [
    { href: "/insights", label: t("nav.insights") },
    { href: "/about", label: t("nav.about") },
  ];
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <Link href="/" aria-label={t("shell.homeAria")}>
            <BrandLockup tagline={t("shell.tagline")} />
          </Link>
          <nav aria-label={t("shell.primaryNav")} className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold",
                  isActive(pathname, l.href) ? "bg-forest-soft text-forest" : "text-ink-muted hover:bg-paper-deep hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
            {hydrated && role ? (
              <ButtonLink
                href={role === "officer" ? "/officer/dashboard" : "/farmer/dashboard"}
                size="sm"
                className="ml-2"
              >
                {t("nav.dashboard")}
              </ButtonLink>
            ) : (
              <ButtonLink href="/login" size="sm" className="ml-2">
                {t("nav.login")}
              </ButtonLink>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </>
  );
}

function NavList({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  return (
    <div className="space-y-5">
      {navFor(role).map((group, gi) => (
        <div key={gi}>
          {group.labelKey && <p className="eyebrow mb-1.5 px-3 text-ink-subtle">{t(group.labelKey)}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md border-l-[3px] px-3 text-sm font-semibold transition-colors",
                      active
                        ? "border-forest bg-forest-soft text-forest-dark"
                        : "border-transparent text-ink-muted hover:bg-paper-deep hover:text-ink"
                    )}
                  >
                    <Icon size={18} aria-hidden className={active ? "text-forest" : "text-ink-subtle"} />
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { role } = useAppState();
  const { full } = useLocationLabel();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer when the route changes
    setOpen(false);
  }, [pathname]);

  const navRole: UserRole = pathname.startsWith("/officer") ? "officer" : pathname.startsWith("/farmer") ? "farmer" : (role ?? "farmer");
  const home = navRole === "officer" ? "/officer/dashboard" : "/farmer/dashboard";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-page flex min-h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line-strong text-ink hover:bg-paper-deep lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t("shell.closeMenu") : t("shell.openMenu")}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
            <Link href={home} aria-label={t("shell.homeAria")}>
              <BrandLockup tagline={t("shell.tagline")} />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/location"
              className="hidden min-h-10 items-center gap-1.5 rounded-md border border-line-strong bg-surface-raised px-3 text-sm font-medium text-ink-muted hover:border-forest/50 hover:text-ink md:inline-flex"
              aria-label={t("shell.changeLocationAria", { location: full })}
            >
              <MapPin size={15} className="text-forest" aria-hidden />
              {full}
            </Link>
            <UserMenu />
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label={t("shell.primaryNav")}
            className="max-h-[70vh] overflow-y-auto border-t border-line bg-surface px-4 py-4 lg:hidden"
          >
            <NavList role={navRole} onNavigate={() => setOpen(false)} />
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 sm:hidden">
              <span className="text-sm font-semibold text-ink-muted">{t("shell.textSize")}</span>
              <div className="rounded-md bg-forest-dark p-0.5">
                <TextSizeControl />
              </div>
            </div>
          </nav>
        )}
      </header>

      <div className="container-page py-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <nav aria-label={t("shell.primaryNav")}>
              <NavList role={navRole} />
            </nav>
            <div className="mt-6 rounded-lg border border-line bg-surface p-4">
              <p className="eyebrow">{t("shell.yourLocation")}</p>
              <p className="mt-1 text-sm font-semibold">{full}</p>
              <Link href="/location" className="mt-2 inline-block text-sm font-semibold text-forest underline underline-offset-4">
                {t("location.changeLocation")}
              </Link>
            </div>
          </div>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </>
  );
}

/** Chooses the public or authenticated chrome for the current route. */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { role, hydrated } = useAppState();
  const inApp = APP_PREFIX.test(pathname) || ((pathname === "/insights" || pathname === "/about") && hydrated && !!role);

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t("shell.skip")}
      </a>
      <UtilityBar />
      {inApp ? <AppShell>{children}</AppShell> : <PublicShell>{children}</PublicShell>}
      <Footer />
    </>
  );
}
