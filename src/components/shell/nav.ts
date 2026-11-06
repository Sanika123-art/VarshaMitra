import {
  CloudRain,
  Info,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Sparkles,
  Sprout,
  TrendingUp,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** i18n key for the group label; omitted for the primary group. */
  labelKey?: string;
  items: NavItem[];
}

/** Role-aware primary navigation for the authenticated application shell. */
export function navFor(role: UserRole): NavGroup[] {
  if (role === "officer") {
    return [
      {
        items: [
          { href: "/officer/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
          { href: "/officer/risk-map", labelKey: "nav.riskMap", icon: MapIcon },
          { href: "/officer/insights", labelKey: "nav.insights", icon: TrendingUp },
        ],
      },
      {
        labelKey: "nav.groupMore",
        items: [
          { href: "/location", labelKey: "nav.area", icon: MapPin },
          { href: "/about", labelKey: "nav.about", icon: Info },
        ],
      },
    ];
  }
  return [
    {
      items: [
        { href: "/farmer/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
        { href: "/farmer/saarthi", labelKey: "nav.saarthi", icon: Sparkles },
        { href: "/farmer/climate", labelKey: "nav.climateIntelligence", icon: CloudRain },
        { href: "/farmer/risk-map", labelKey: "nav.riskMap", icon: MapIcon },
        { href: "/farmer/advisory", labelKey: "nav.cropAdvisory", icon: Sprout },
      ],
    },
    {
      labelKey: "nav.groupMyFarm",
      items: [
        { href: "/farmer/crop", labelKey: "nav.myCrop", icon: Wheat },
        { href: "/location", labelKey: "nav.location", icon: MapPin },
      ],
    },
    {
      labelKey: "nav.groupMore",
      items: [
        { href: "/insights", labelKey: "nav.insights", icon: TrendingUp },
        { href: "/about", labelKey: "nav.about", icon: Info },
      ],
    },
  ];
}
