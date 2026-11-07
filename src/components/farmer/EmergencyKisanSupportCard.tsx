"use client";

import {
  PhoneCall,
  ShieldAlert,
  Building,
  Headphones,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface EmergencyKisanSupportCardProps {
  blockName: string;
  districtName: string;
  isMr: boolean;
}

export default function EmergencyKisanSupportCard({
  blockName,
  districtName,
  isMr,
}: EmergencyKisanSupportCardProps) {
  return (
    <div className="rounded-xl border-2 border-[#123C32] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#123C32]">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C7473B] bg-[#C7473B]/10 text-[#C7473B]">
            <PhoneCall size={18} />
          </span>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#C7473B]">
              Toll-Free Agricultural Assistance
            </span>
            <h3 className="font-display text-base font-bold text-[#123C32]">
              {isMr ? "आपत्कालीन शेतकरी सहाय्य व शासकीय हेल्पलाईन" : "Farmer Emergency Helplines & Govt Assistance"}
            </h3>
          </div>
        </div>

        <span className="rounded bg-[#3B8B61]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#3B8B61]">
          {isMr ? "२४/७ मोफत सेवा" : "24/7 Toll-Free"}
        </span>
      </div>

      {/* 3 Support Columns */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        
        {/* Helpline 1: PMFBY Crop Insurance */}
        <div className="flex flex-col justify-between rounded-xl border border-[#C7473B]/30 bg-[#C7473B]/5 p-3.5">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase text-[#C7473B]">
                PMFBY पीक विमा
              </span>
              <span className="rounded bg-[#C7473B] px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                ७२ तास मर्यादा
              </span>
            </div>
            <a
              href="tel:14447"
              className="mt-2 block font-display text-2xl font-black text-[#C7473B] hover:underline"
            >
              📞 14447
            </a>
            <p className="mt-1 font-sans text-xs text-[#252923]/80 leading-relaxed">
              {isMr
                ? "पावसाचा खंड, पूर किंवा अतिवृष्टीने पिकाचे नुकसान झाल्यास ७२ तासांच्या आत क्लेम नोंदवा."
                : "Intimate crop loss due to dry spell, flood or hailstorm within 72 hours."}
            </p>
          </div>
          <a
            href="tel:14447"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded border border-[#C7473B] bg-white py-1.5 font-mono text-xs font-bold text-[#C7473B] shadow-xs hover:bg-[#C7473B] hover:text-white transition"
          >
            <span>{isMr ? "थेट कॉल करा (14447)" : "Call Toll-Free"}</span>
          </a>
        </div>

        {/* Helpline 2: Kisan Call Center */}
        <div className="flex flex-col justify-between rounded-xl border border-[#123C32]/30 bg-[#123C32]/5 p-3.5">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]">
                किसान कॉल सेंटर (KCC)
              </span>
              <span className="rounded bg-[#123C32] px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                मराठी भाषा
              </span>
            </div>
            <a
              href="tel:18001801551"
              className="mt-2 block font-display text-xl font-black text-[#123C32] hover:underline"
            >
              📞 1800-180-1551
            </a>
            <p className="mt-1 font-sans text-xs text-[#252923]/80 leading-relaxed">
              {isMr
                ? "कृषी तज्ज्ञांशी थेट मराठी भाषेत मोफत संवाद साधा (सकाळी ६:०० ते रात्री १०:००)."
                : "Free consultation with agriculture scientists in Marathi (6:00 AM – 10:00 PM)."}
            </p>
          </div>
          <a
            href="tel:18001801551"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded border border-[#123C32] bg-white py-1.5 font-mono text-xs font-bold text-[#123C32] shadow-xs hover:bg-[#123C32] hover:text-white transition"
          >
            <span>{isMr ? "तज्ज्ञांशी बोला (KCC)" : "Call Kisan Call Center"}</span>
          </a>
        </div>

        {/* Helpline 3: Local Taluka Krishi Office */}
        <div className="flex flex-col justify-between rounded-xl border border-[#2878A5]/30 bg-[#2878A5]/5 p-3.5">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase text-[#2878A5]">
                तालुका कृषी अधिकारी
              </span>
              <span className="font-mono text-[9px] text-[#252923]/60">
                शासकीय डेस्क
              </span>
            </div>
            <h4 className="mt-2 font-display text-base font-bold text-[#172B4D]">
              🏛️ {blockName} ({districtName})
            </h4>
            <p className="mt-1 font-sans text-xs text-[#252923]/80 leading-relaxed">
              {isMr
                ? "बियाणे, खते, अनुदान योजना व स्थानिक पंचनाम्यासाठी आपल्या तालुका कृषी कार्यालयाशी संपर्क करा."
                : "Contact local Taluka Agriculture Officer for certified inputs, subsidies & panchanama."}
            </p>
          </div>
          <Link
            href="/farmer/saarthi"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded border border-[#2878A5] bg-white py-1.5 font-mono text-xs font-bold text-[#2878A5] shadow-xs hover:bg-[#2878A5] hover:text-white transition"
          >
            <span>{isMr ? "सारथी AI मदत घ्या" : "Consult Saarthi AI"}</span>
          </Link>
        </div>

      </div>

    </div>
  );
}

