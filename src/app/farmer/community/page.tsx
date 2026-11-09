"use client";

import Image from "next/image";
import { ExternalLink, MessageCircle, ShieldAlert, Users } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { WHATSAPP_FARMER_GROUP_URL } from "@/config/community";

export default function FarmerCommunityPage() {
  const { language } = useTranslation();
  const isMr = language === "mr";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="overflow-hidden rounded-2xl bg-[#075E54] text-white shadow-[5px_5px_0px_#123C32]">
        <div className="relative h-52 sm:h-64">
          <Image
            src="/images/farmer-community.jpg"
            alt={isMr ? "शेतात मोबाईलवर माहिती पाहणारा शेतकरी" : "A farmer checking information on a device in the field"}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#064D45] via-[#064D45]/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 pb-4">
            <span className="rounded-full bg-[#25D366] p-2.5 text-[#073B2A]"><Users size={23} aria-hidden /></span>
            <div>
              <p className="text-xs font-bold text-white/85">{isMr ? "महाराष्ट्रातील शेतकऱ्यांशी जोडा" : "Connect with farmers across Maharashtra"}</p>
              <h1 className="text-xl font-extrabold sm:text-2xl">{isMr ? "आपला शेतकरी WhatsApp गट" : "Your farmer WhatsApp group"}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-b border-white/15 bg-[#064D45] px-5 py-4">
          <span className="rounded-full bg-white/10 p-2.5"><MessageCircle size={23} aria-hidden /></span>
          <div>
            <p className="text-xs font-bold text-white/75">{isMr ? "वर्षामित्र शेतकरी समुदाय" : "VarshaMitra farmer community"}</p>
            <h2 className="text-lg font-extrabold">{isMr ? "चला, एकमेकांना मदत करूया" : "Let’s help each other grow"}</h2>
          </div>
        </div>
        <div className="space-y-5 px-5 py-6 sm:px-7">
          <div className="flex items-start gap-3">
            <MessageCircle size={20} className="mt-1 shrink-0 text-[#B8E8C4]" aria-hidden />
            <p className="text-sm leading-6 text-white/90">
              {isMr
                ? "तुमच्या भागातला पाऊस, पिकांची काळजी आणि बाजारभाव याबद्दल इतर शेतकऱ्यांशी चर्चा करा. खालील बटण दाबल्यावर WhatsApp उघडेल."
                : "Talk with other farmers about local rain, crop care, and market prices. Use the button below to open WhatsApp."}
            </p>
          </div>

          <a
            href={WHATSAPP_FARMER_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-center text-base font-extrabold text-[#073B2A] shadow-sm transition hover:bg-[#6BE294] sm:w-auto"
          >
            <MessageCircle size={20} aria-hidden />
            {isMr ? "WhatsApp गट उघडा आणि सामील व्हा" : "Open WhatsApp and join the group"}
            <ExternalLink size={16} aria-hidden />
          </a>
        </div>
      </header>

      <section className="rounded-2xl border-2 border-[#123C32]/15 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-[#123C32]">{isMr ? "गटात कशाबद्दल बोलू शकता?" : "What can you talk about?"}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#252923]/80">
          <li>{isMr ? "तुमच्या गावात किती पाऊस झाला आणि पिकांची काय स्थिती आहे." : "How much rain your village received and how crops are doing."}</li>
          <li>{isMr ? "पीक लागवड, काळजी आणि काढणीबद्दलचे अनुभव." : "Your experience with sowing, crop care, and harvest."}</li>
          <li>{isMr ? "वर्षामित्रच्या माहितीबद्दल तुमचे प्रश्न किंवा सूचना." : "Your questions or suggestions about VarshaMitra."}</li>
        </ul>
      </section>

      <aside className="flex gap-3 rounded-xl border border-[#E6A52E]/50 bg-[#FFF9E8] p-4">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-[#825B0B]" aria-hidden />
        <div>
          <h2 className="font-bold text-[#654B15]">{isMr ? "WhatsApp वर काळजी घ्या" : "Stay safe on WhatsApp"}</h2>
          <p className="mt-1 text-sm leading-5 text-[#654B15]/90">
            {isMr
              ? "गटातील लोकांना तुमचा फोन नंबर दिसू शकतो. OTP, बँक किंवा आधारची माहिती कोणालाही देऊ नका. शेतीचा मोठा निर्णय घेण्याआधी कृषी तज्ज्ञांचा सल्ला घ्या."
              : "Other members may see your phone number in a WhatsApp group. Never share OTPs, bank details, Aadhaar numbers, or follow suspicious payment links. Verify important farming decisions with official sources or an agricultural expert."}
          </p>
        </div>
      </aside>
    </div>
  );
}
