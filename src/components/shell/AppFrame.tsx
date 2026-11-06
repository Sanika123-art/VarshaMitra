"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, MapPin, X, ChevronRight, Activity } from "lucide-react";
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
    <div className="border-b border-[#123C32]/30 bg-[#123C32] text-[#F4F0E5]">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-1.5">
        <p className="min-w-0 font-mono text-xs text-[#F4F0E5]/85">
          <span className="mr-2 inline-flex items-center gap-1 rounded border border-[#E6A52E] bg-[#E6A52E]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E6A52E]">
            <Activity size={10} className="animate-pulse" />
            {t("shell.platformBadge")}
          </span>
          <span className="hidden sm:inline">{t("shell.notice")}</span>
          <span className="sm:hidden">{t("shell.noticeShort")}</span>
        </p>
        <div className="flex items-center gap-3">
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
      <header className="sticky top-0 z-40 border-b-2 border-[#123C32]/15 bg-[#F4F0E5]/95 backdrop-blur-md">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <Link href="/" aria-label={t("shell.homeAria")}>
            <BrandLockup tagline={t("shell.tagline")} />
          </Link>
          <nav aria-label={t("shell.primaryNav")} className="flex items-center gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-md px-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive(pathname, l.href)
                    ? "border border-[#123C32] bg-[#123C32] text-[#F4F0E5]"
                    : "text-[#252923] hover:bg-[#123C32]/10"
                )}
              >
                {l.label}
              </Link>
            ))}
            {hydrated && role ? (
              <ButtonLink
                href={role === "officer" ? "/officer/dashboard" : "/farmer/dashboard"}
                size="sm"
                className="ml-2 border-2 border-[#123C32] bg-[#123C32] font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923]"
              >
                {t("nav.dashboard")}
              </ButtonLink>
            ) : (
              <ButtonLink
                href="/login"
                size="sm"
                className="ml-2 border-2 border-[#123C32] bg-[#123C32] font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923]"
              >
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
          {group.labelKey && (
            <p className="mb-2 px-3 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[#123C32]">
              {t(group.labelKey)}
            </p>
          )}
          <ul className="space-y-1">
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
                      "group flex min-h-11 items-center justify-between rounded-lg border-2 px-3 text-sm font-semibold transition-all",
                      active
                        ? "border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-[3px_3px_0px_#252923]"
                        : "border-transparent text-[#252923] hover:border-[#123C32]/30 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={17}
                        aria-hidden
                        className={active ? "text-[#E6A52E]" : "text-[#123C32] group-hover:scale-110 transition-transform"}
                      />
                      <span>{t(item.labelKey)}</span>
                    </div>
                    {active && <ChevronRight size={14} className="text-[#E6A52E]" />}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer on route change
    setOpen(false);
  }, [pathname]);

  const navRole: UserRole = pathname.startsWith("/officer")
    ? "officer"
    : pathname.startsWith("/farmer")
    ? "farmer"
    : role ?? "farmer";
  const home = navRole === "officer" ? "/officer/dashboard" : "/farmer/dashboard";

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-[#123C32]/15 bg-[#F4F0E5]/95 backdrop-blur-md">
        <div className="container-page flex min-h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#123C32] bg-[#F4F0E5] text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-white lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t("shell.closeMenu") : t("shell.openMenu")}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            </button>
            <Link href={home} aria-label={t("shell.homeAria")}>
              <BrandLockup tagline={t("shell.tagline")} />
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/location"
              className="hidden min-h-9 items-center gap-1.5 rounded-md border-2 border-[#123C32]/30 bg-white px-3 font-mono text-xs font-semibold text-[#252923] shadow-xs hover:border-[#123C32] hover:shadow-[2px_2px_0px_#123C32] md:inline-flex"
              aria-label={t("shell.changeLocationAria", { location: full })}
            >
              <MapPin size={13} className="text-[#123C32]" aria-hidden />
              <span>{full}</span>
            </Link>
            <UserMenu />
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label={t("shell.primaryNav")}
            className="max-h-[75vh] overflow-y-auto border-t-2 border-[#123C32]/20 bg-[#F4F0E5] px-4 py-4 lg:hidden"
          >
            <div className="mb-4 rounded-md border-2 border-[#123C32]/30 bg-white p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#123C32]/60">{t("shell.yourLocation")}</p>
              <p className="mt-0.5 text-xs font-bold text-[#252923]">{full}</p>
              <Link href="/location" className="mt-1 block text-xs font-semibold text-[#123C32] underline">
                {t("location.changeLocation")}
              </Link>
            </div>
            <NavList role={navRole} onNavigate={() => setOpen(false)} />
            <div className="mt-4 flex items-center justify-between border-t border-[#123C32]/20 pt-4 sm:hidden">
              <span className="font-mono text-xs font-semibold text-[#252923]/70">{t("shell.textSize")}</span>
              <div className="rounded border border-[#123C32] bg-[#123C32] p-0.5 text-[#F4F0E5]">
                <TextSizeControl />
              </div>
            </div>
          </nav>
        )}
      </header>

      <div className="container-page py-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <nav aria-label={t("shell.primaryNav")}>
              <NavList role={navRole} />
            </nav>

            {/* Location Badge Card */}
            <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[4px_4px_0px_#123C32]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/70">
                  {t("shell.yourLocation")}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#3B8B61] animate-pulse" />
              </div>
              <p className="mt-1 font-display text-sm font-bold text-[#252923]">{full}</p>
              <Link
                href="/location"
                className="mt-2.5 inline-flex items-center gap-1 font-mono text-xs font-bold text-[#123C32] underline decoration-[#123C32]/40 underline-offset-4 hover:decoration-[#123C32]"
              >
                <span>{t("location.changeLocation")}</span>
                <ChevronRight size={12} />
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

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { role, hydrated } = useAppState();
  const inApp =
    APP_PREFIX.test(pathname) ||
    ((pathname === "/insights" || pathname === "/about") && hydrated && !!role);

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
