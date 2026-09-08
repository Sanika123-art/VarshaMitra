import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AppStateProvider } from "@/hooks/useAppState";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "VarshaMitra — Hyperlocal Rainfall Intelligence for Smarter Farming",
  description:
    "VarshaMitra — AI-Powered Hyperlocal Rainfall Prediction and Decision Support for Climate-Resilient Agriculture. Developed for PCCOE Indradhanu Grand Challenge 2026.",
  keywords: "VarshaMitra, climate intelligence, agriculture, monsoon, risk prediction, crop advisory, hyperlocal, Maharashtra",
  authors: [{ name: "VarshaMitra Team" }],
  openGraph: {
    title: "VarshaMitra — Hyperlocal Rainfall Intelligence for Smarter Farming",
    description:
      "VarshaMitra — AI-Powered Hyperlocal Rainfall Prediction and Decision Support for Climate-Resilient Agriculture",
    siteName: "VarshaMitra",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1f4b3a" />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <AppStateProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AppStateProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
