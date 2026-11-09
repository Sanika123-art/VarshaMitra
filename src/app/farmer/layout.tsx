"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, CloudRain, MapPin, MessageCircle, Sprout, Users, Wheat } from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { useTranslation } from "@/i18n/LanguageContext";

const GUIDE_KEY = "varshamitra:farmer-guide-seen";

const guideItems = [
  { icon: Sprout, mr: "मुख्य पान", en: "Home", detailMr: "तुमच्या पिकाची आणि शेतीची महत्त्वाची माहिती येथे दिसते.", detailEn: "See important information about your farm and crop." },
  { icon: BookOpen, mr: "सारथी", en: "Saarthi", detailMr: "शेतीविषयी प्रश्न सोप्या भाषेत विचारा.", detailEn: "Ask farming questions in simple language." },
  { icon: CloudRain, mr: "हवामान", en: "Weather", detailMr: "पाऊस आणि पुढील दिवसांचा हवामान अंदाज पाहा.", detailEn: "Check rainfall and the coming weather." },
  { icon: MapPin, mr: "जोखीम नकाशा", en: "Risk map", detailMr: "तुमच्या भागातील पावसाची आणि पिकांची जोखीम समजून घ्या.", detailEn: "Understand rainfall and crop risks in your area." },
  { icon: BookOpen, mr: "शेती सल्ला", en: "Advice", detailMr: "हवामान आणि पिकानुसार मिळालेला शेती सल्ला वाचा.", detailEn: "Read farming advice based on weather and crop." },
  { icon: Wheat, mr: "पीक", en: "Crop", detailMr: "तुमचे सध्या घेतलेले पीक आणि त्याची अवस्था निवडा.", detailEn: "Choose your current crop and its growth stage." },
  { icon: MapPin, mr: "शेताचे ठिकाण", en: "Farm location", detailMr: "योग्य हवामान आणि बाजारभावासाठी तुमचा जिल्हा व तालुका तपासा.", detailEn: "Check your district and taluka for correct weather and market information." },
  { icon: MessageCircle, mr: "शेतकऱ्यांचे मत", en: "Farmer voices", detailMr: "वर्षामित्रबद्दल तुमचा खरा अनुभव लिहा; फोन नंबर देऊ नका.", detailEn: "Share your honest experience with VarshaMitra; do not include phone numbers." },
  { icon: Users, mr: "शेतकरी गट", en: "Farmer group", detailMr: "WhatsApp वर महाराष्ट्रातील शेतकऱ्यांशी चर्चा करा.", detailEn: "Discuss farming with farmers across Maharashtra on WhatsApp." },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const { role, hydrated, farmerGuidePending, completeFarmerGuide } = useAppState();
  const { language } = useTranslation();
  const isMr = language === "mr";
  const router = useRouter();
  const [guideOpen, setGuideOpen] = useState(false);
  const [reopenGuide, setReopenGuide] = useState(false);
  const [guideReady, setGuideReady] = useState(false);

  useEffect(() => {
    if (hydrated && role !== "farmer") {
      router.replace("/login");
    }
  }, [hydrated, role, router]);

  useEffect(() => {
    if (!hydrated || role !== "farmer") return;
    const guideSeen = window.localStorage.getItem(GUIDE_KEY) === "true";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the guide state after app hydration
    setGuideOpen(farmerGuidePending || !guideSeen);
    setGuideReady(true);
  }, [farmerGuidePending, hydrated, role]);

  if (!hydrated || role !== "farmer" || !guideReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-forest)] border-t-transparent" />
      </div>
    );
  }

  function closeGuide() {
    window.localStorage.setItem(GUIDE_KEY, "true");
    completeFarmerGuide();
    setGuideOpen(false);
    setReopenGuide(false);
  }

  const blockingGuide = guideOpen && !reopenGuide;

  return (
    <>
      {!blockingGuide && (
        <>
          <div className="mx-auto flex max-w-7xl justify-end px-4 pt-3">
            <button
              type="button"
              onClick={() => {
                setGuideOpen(true);
                setReopenGuide(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#123C32]/30 bg-white px-3 py-2 text-sm font-bold text-[#123C32] shadow-sm"
            >
              <BookOpen size={16} aria-hidden />
              {isMr ? "मार्गदर्शन" : "Help"}
            </button>
          </div>
          {children}
        </>
      )}
      {guideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#123C32]/70 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="farmer-guide-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#FFFDF6] p-5 shadow-2xl sm:p-7"
          >
            <p className="text-sm font-bold text-[#3B8B61]">{isMr ? "वर्षामित्र वापरण्याची सोपी माहिती" : "A simple guide to VarshaMitra"}</p>
            <h1 id="farmer-guide-title" className="mt-1 text-2xl font-extrabold text-[#123C32]">
              {isMr ? "नमस्कार शेतकरी मित्रा!" : "Hello, farmer friend!"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#252923]/80">
              {isMr
                ? "खालील प्रत्येक भाग कशासाठी आहे ते वाचा. काही समजले नाही तर वरचे “मार्गदर्शन” बटण पुन्हा दाबा."
                : "Here is what each part of the farmer portal does. Select Help at any time to see this guide again."}
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {guideItems.map(({ icon: Icon, mr, en, detailMr, detailEn }) => (
                <li key={en} className="flex gap-3 rounded-xl border border-[#123C32]/15 bg-white p-3">
                  <Icon size={20} className="mt-0.5 shrink-0 text-[#3B8B61]" aria-hidden />
                  <div>
                    <h2 className="font-bold text-[#123C32]">{isMr ? mr : en}</h2>
                    <p className="mt-0.5 text-sm leading-5 text-[#252923]/75">{isMr ? detailMr : detailEn}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#123C32]/10 pt-4">
              <p className="text-xs leading-5 text-[#252923]/65">
                {isMr ? "ही माहिती फक्त तुमच्या या मोबाईलवर जतन केली जाईल." : "This guide is remembered only on this device."}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={closeGuide} className="inline-flex items-center gap-2 rounded-lg bg-[#123C32] px-4 py-2.5 text-sm font-bold text-white">
                  <Check size={16} aria-hidden />
                  {isMr ? "समजले, पुढे चला" : "Got it, continue"}
                </button>
                <Link href="/farmer/dashboard" onClick={closeGuide} className="rounded-lg border border-[#123C32]/25 px-4 py-2.5 text-sm font-bold text-[#123C32]">
                  {isMr ? "आत्ता नको" : "Skip"}
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
