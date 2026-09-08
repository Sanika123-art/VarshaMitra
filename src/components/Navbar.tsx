"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CloudRain,
  Menu,
  MapPin,
  User,
  X,
  Sprout,
  ShieldCheck,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  labelKey: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { role, location, logout } = useAppState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setOpen(false);
  }, [pathname]);

  function handleLogout() {
    setUserMenuOpen(false);
    setOpen(false);
    logout();
    router.push("/login");
  }

  const isFarmer = pathname?.startsWith("/farmer");
  const isOfficer = pathname?.startsWith("/officer");

  let links: NavLink[];
  if (isFarmer) {
    links = [
      { href: "/farmer/dashboard", labelKey: "nav.home" },
      { href: "/farmer/climate", labelKey: "nav.climate" },
      { href: "/farmer/risk-map", labelKey: "nav.riskMap" },
      { href: "/farmer/advisory", labelKey: "nav.advisory" },
    ];
  } else if (isOfficer) {
    links = [
      { href: "/officer/dashboard", labelKey: "nav.overview" },
      { href: "/officer/risk-map", labelKey: "nav.riskMap" },
      { href: "/insights", labelKey: "nav.insights" },
    ];
  } else {
    links = [
      { href: "/farmer/climate", labelKey: "nav.climateIntelligence" },
      { href: "/farmer/risk-map", labelKey: "nav.riskMap" },
      { href: "/farmer/advisory", labelKey: "nav.advisories" },
      { href: "/insights", labelKey: "nav.insights" },
      { href: "/about", labelKey: "nav.about" },
    ];
  }

  const homeHref = isOfficer ? "/officer/dashboard" : isFarmer ? "/farmer/dashboard" : "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-[var(--color-paper)]/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-[var(--color-paper)]/80",
        scrolled ? "border-[var(--color-line)] shadow-[var(--shadow-sm)]" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={homeHref} className="flex items-center gap-2.5 shrink-0 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-forest)] text-white transition-transform group-hover:scale-105">
            <CloudRain size={15} aria-hidden />
          </span>
          <span className="font-display text-lg tracking-tight text-[var(--color-forest-dark)]">
            VarshaMitra
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--color-forest)] text-white shadow-[var(--shadow-sm)]"
                    : "text-[var(--color-ink)]/70 hover:bg-[var(--color-paper-raised)] hover:text-[var(--color-ink)]"
                )}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5">
          {(isFarmer || isOfficer) && (
            <Link
              href="/location"
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]/75 transition-colors hover:border-[var(--color-forest)]/40 hover:text-[var(--color-ink)]"
              title={t("nav.location")}
            >
              <MapPin size={13} className="text-[var(--color-forest)]" />
              {location.blockName}
            </Link>
          )}
          <LanguageSwitcher compact />

          {role ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={t("nav.userMenu")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer shadow-[var(--shadow-sm)]",
                  userMenuOpen
                    ? "bg-[var(--color-paper-raised)] border-[var(--color-forest)] text-[var(--color-ink)]"
                    : "bg-[var(--color-paper-raised)] border-[var(--color-line)] text-[var(--color-ink)]/80 hover:border-[var(--color-forest)]/40 hover:bg-[var(--color-paper)]"
                )}
              >
                {role === "farmer" ? (
                  <Sprout size={13} className="text-[var(--color-forest)]" />
                ) : (
                  <ShieldCheck size={13} className="text-[var(--color-sky)]" />
                )}
                <span>{role === "farmer" ? t("login.roleFarmer") : t("login.roleOfficer")}</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "text-[var(--color-ink)]/50 transition-transform duration-200",
                    userMenuOpen && "rotate-180 text-[var(--color-forest)]"
                  )}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-1.5 shadow-[var(--shadow-lg)] z-50 animate-in fade-in-0 zoom-in-95"
                >
                  {/* Account overview */}
                  <div className="px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink)]/45">
                      {t("nav.account")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--color-ink)]">
                      {role === "farmer" ? t("login.demoFarmer") : t("login.demoOfficer")}
                    </p>
                    <p className="text-xs text-[var(--color-ink)]/60">
                      {location.blockName}, {location.districtName}
                    </p>
                  </div>

                  <div className="h-px bg-[var(--color-line)] my-1" />

                  {/* Profile / Home */}
                  <Link
                    href={role === "farmer" ? "/farmer/dashboard" : "/officer/dashboard"}
                    onClick={() => setUserMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-ink)]/80 hover:bg-[var(--color-forest)]/8 hover:text-[var(--color-forest-dark)] transition-colors"
                  >
                    <User size={14} className="text-[var(--color-forest)]" />
                    {t("nav.myAccount")}
                  </Link>

                  <Link
                    href="/location"
                    onClick={() => setUserMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-ink)]/80 hover:bg-[var(--color-forest)]/8 hover:text-[var(--color-forest-dark)] transition-colors"
                  >
                    <MapPin size={14} className="text-[var(--color-forest)]" />
                    {t("nav.location")} ({location.blockName})
                  </Link>

                  <div className="h-px bg-[var(--color-line)] my-1" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--color-clay)] hover:bg-[var(--color-clay)]/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--color-forest)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)]"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-raised)]"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t border-[var(--color-line)] bg-[var(--color-paper)] px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-[var(--color-forest)] text-white"
                    : "text-[var(--color-ink)]/80 hover:bg-[var(--color-paper-raised)]"
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {role ? (
            <div className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
              <div className="flex items-center justify-between rounded-xl bg-[var(--color-paper-raised)] px-3 py-2">
                <div className="flex items-center gap-2">
                  {role === "farmer" ? (
                    <Sprout size={16} className="text-[var(--color-forest)]" />
                  ) : (
                    <ShieldCheck size={16} className="text-[var(--color-sky)]" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-ink)]">
                      {role === "farmer" ? t("login.demoFarmer") : t("login.demoOfficer")}
                    </p>
                    <p className="text-[11px] text-[var(--color-ink)]/55">
                      {location.blockName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/location");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink)]/70 cursor-pointer"
                >
                  <MapPin size={11} className="text-[var(--color-forest)]" />
                  {t("nav.location")}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 px-1 py-1">
                <span className="text-xs text-[var(--color-ink)]/55">{t("nav.language")}</span>
                <LanguageSwitcher compact />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/8 px-4 py-2.5 text-sm font-semibold text-[var(--color-clay)] hover:bg-[var(--color-clay)]/15 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-3">
                <span className="text-xs text-[var(--color-ink)]/55">{t("nav.language")}</span>
                <LanguageSwitcher compact />
              </div>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-3 block rounded-full bg-[var(--color-forest)] px-4 py-3 text-center text-sm font-medium text-white"
              >
                {t("nav.login")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
