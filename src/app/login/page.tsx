"use client";

import { useState } from "react";
import { CloudRain, ShieldCheck, Sprout } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import FarmerRegistrationForm from "@/components/auth/FarmerRegistrationForm";
import FarmerLoginForm from "@/components/auth/FarmerLoginForm";
import OfficerLoginForm from "@/components/auth/OfficerLoginForm";

type PortalTab = "farmer" | "register" | "officer";

export default function LoginPage() {
  const { language } = useTranslation();
  const isMr = language === "mr";
  const { hydrated } = useAppState();
  const [portalTab, setPortalTab] = useState<PortalTab>("farmer");
  const [registrationMobile, setRegistrationMobile] = useState("");

  if (!hydrated) return null;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F4F0E5] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <header className="mb-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#123C32] text-[#E6A52E]">
            <CloudRain size={24} aria-hidden />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-[#123C32] sm:text-3xl">वर्षामित्र</h1>
          <p className="mt-1 text-sm text-[#252923]/75">
            {isMr ? "शेतीसाठी सोपी हवामान व पीक माहिती" : "Simple weather and crop information for your farm"}
          </p>
        </header>

        <section className="rounded-2xl border-2 border-[#123C32]/15 bg-white p-4 shadow-[0_8px_24px_rgba(18,60,50,0.10)] sm:p-6">
          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label={isMr ? "प्रवेशाचा प्रकार" : "Sign-in type"}>
            <button type="button" role="tab" aria-selected={portalTab === "farmer"} onClick={() => setPortalTab("farmer")} className={`rounded-lg px-2 py-3 text-sm font-bold ${portalTab === "farmer" ? "bg-[#123C32] text-white" : "bg-[#F4F0E5] text-[#123C32]"}`}>
              <Sprout size={16} className="mx-auto mb-1" aria-hidden />
              {isMr ? "शेतकरी लॉगिन" : "Farmer sign-in"}
            </button>
            <button type="button" role="tab" aria-selected={portalTab === "register"} onClick={() => setPortalTab("register")} className={`rounded-lg px-2 py-3 text-sm font-bold ${portalTab === "register" ? "bg-[#123C32] text-white" : "bg-[#F4F0E5] text-[#123C32]"}`}>
              {isMr ? "नवीन नोंदणी" : "New farmer"}
            </button>
            <button type="button" role="tab" aria-selected={portalTab === "officer"} onClick={() => setPortalTab("officer")} className={`rounded-lg px-2 py-3 text-sm font-bold ${portalTab === "officer" ? "bg-[#172B4D] text-white" : "bg-[#F4F0E5] text-[#123C32]"}`}>
              <ShieldCheck size={16} className="mx-auto mb-1" aria-hidden />
              {isMr ? "अधिकारी" : "Officer"}
            </button>
          </div>

          <div className="mt-5">
            {portalTab === "farmer" && (
              <FarmerLoginForm
                initialMobile={registrationMobile}
                onSwitchToRegister={(mobile) => {
                  if (mobile) setRegistrationMobile(mobile);
                  setPortalTab("register");
                }}
              />
            )}
            {portalTab === "register" && (
              <FarmerRegistrationForm
                initialMobile={registrationMobile}
                onSwitchToLogin={() => setPortalTab("farmer")}
              />
            )}
            {portalTab === "officer" && <OfficerLoginForm onSwitchToFarmer={() => setPortalTab("farmer")} />}
          </div>
        </section>
      </div>
    </main>
  );
}
