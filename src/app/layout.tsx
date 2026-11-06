import type { Metadata, Viewport } from "next";
import {
  Inter,
  Space_Grotesk,
  IBM_Plex_Mono,
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AppStateProvider } from "@/hooks/useAppState";
import AppFrame from "@/components/shell/AppFrame";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });
const notoSansDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});
const notoSerifDeva = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-serif-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VarshaMitra — Hyperlocal climate intelligence for agriculture",
    template: "%s · VarshaMitra",
  },
  description:
    "VarshaMitra is an AI-powered hyperlocal climate-risk intelligence and agricultural decision-support platform for Maharashtra: delivering calibrated monsoon outlooks, block-level risk maps, and actionable crop advisories in English and Marathi.",
  keywords: "VarshaMitra, climate intelligence, agriculture, monsoon, crop advisory, Maharashtra, Bit2Bramha",
  authors: [{ name: "Team Bit2Bramha" }],
  openGraph: {
    title: "VarshaMitra — Hyperlocal climate intelligence for agriculture",
    description: "Hyperlocal monsoon outlooks, climate-risk maps, and actionable crop advisories for Maharashtra agriculture.",
    siteName: "VarshaMitra",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f4b3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} ${sourceSerif.variable} ${notoSansDeva.variable} ${notoSerifDeva.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          <AppStateProvider>
            <AppFrame>{children}</AppFrame>
          </AppStateProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
