"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Building2,
  Sparkles,
  Radio,
  FileCheck2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";

export default function OfficerLoginForm({
  onSwitchToFarmer,
}: {
  onSwitchToFarmer?: () => void;
}) {
  const { language } = useTranslation();
  const isMr = language === "mr";
  const router = useRouter();
  const { setRole } = useAppState();

  const [email, setEmail] = useState("officer@mahaagri.gov.in");
  const [password, setPassword] = useState("mahaagri2026");
  const [selectedDesk, setSelectedDesk] = useState("nashik_regional");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setRole("officer");
      router.push("/officer/dashboard");
    }, 400);
  };

  const handlePreload = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("mahaagri2026");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
      
      {/* Official Government Desk Banner */}
      <div className="rounded-lg border-2 border-[#172B4D]/30 bg-[#172B4D]/5 p-3">
        <div className="flex items-center gap-2 text-[#172B4D]">
          <Building2 size={16} />
          <h3 className="font-display text-sm font-bold">
            {isMr ? "महाराष्ट्र शासन कृषी विभाग" : "Dept of Agriculture, Govt of Maharashtra"}
          </h3>
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#252923]/70">
          {isMr
            ? "विभागीय कृषी अधिकारी, उपविभागीय अधिकारी व आपत्कालीन ब्रॉडकास्ट नियंत्रण कक्ष."
            : "Authorized Agricultural Officer & Emergency Geofenced Broadcast Console."}
        </p>
      </div>

      {/* Quick Desk Role Chips */}
      <div>
        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#172B4D]/80">
          {isMr ? "⚡ प्रात्यक्षिक अधिकारी खाते निवडा:" : "⚡ Fast evaluation official credentials:"}
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handlePreload("dao.nashik@gov.in")}
            className="rounded-full border border-[#172B4D]/30 bg-white px-2.5 py-1 font-mono text-[10px] text-[#172B4D] hover:bg-[#172B4D]/10 transition"
          >
            🏛️ DAO Nashik
          </button>
          <button
            type="button"
            onClick={() => handlePreload("tdao.igatpuri@gov.in")}
            className="rounded-full border border-[#172B4D]/30 bg-white px-2.5 py-1 font-mono text-[10px] text-[#172B4D] hover:bg-[#172B4D]/10 transition"
          >
            📍 TAO Igatpuri
          </button>
          <button
            type="button"
            onClick={() => handlePreload("comm.agri@gov.in")}
            className="rounded-full border border-[#172B4D]/30 bg-white px-2.5 py-1 font-mono text-[10px] text-[#172B4D] hover:bg-[#172B4D]/10 transition"
          >
            🏢 State HQ Pune
          </button>
        </div>
      </div>

      {/* Email / Officer ID */}
      <div>
        <label
          htmlFor="officerEmail"
          className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[#172B4D]"
        >
          <span>{isMr ? "शासकीय ईमेल / अधिकारी आयडी *" : "Official Email / Govt ID *"}</span>
          <span className="text-[#252923]/60">Govt Domain</span>
        </label>
        <div className="relative mt-1">
          <Mail size={13} className="absolute left-2.5 top-2.5 text-[#172B4D]/60" />
          <input
            id="officerEmail"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="officer@mahaagri.gov.in"
            className="w-full rounded border-2 border-[#172B4D]/30 bg-white py-2 pl-8 pr-2.5 font-mono text-xs text-[#252923] outline-none focus:border-[#172B4D] focus:shadow-[2px_2px_0px_#172B4D]"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[#172B4D]">
          <span>{isMr ? "गोपनीय पासवर्ड *" : "Security Password *"}</span>
          <span className="text-[#252923]/60">Demo: Any Password</span>
        </div>
        <div className="relative mt-1">
          <Lock size={13} className="absolute left-2.5 top-2.5 text-[#172B4D]/60" />
          <input
            id="officerPassword"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded border-2 border-[#172B4D]/30 bg-white py-2 pl-8 pr-2.5 font-mono text-xs text-[#252923] outline-none focus:border-[#172B4D] focus:shadow-[2px_2px_0px_#172B4D]"
          />
        </div>
      </div>

      {/* Department Desk Selection */}
      <div>
        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#172B4D]">
          {isMr ? "कार्यक्षेत्र नियंत्रण डेस्क:" : "Jurisdiction Operational Desk:"}
        </label>
        <select
          value={selectedDesk}
          onChange={(e) => setSelectedDesk(e.target.value)}
          className="mt-1 w-full rounded border-2 border-[#172B4D]/30 bg-white py-1.5 px-2.5 font-sans text-xs text-[#252923] outline-none focus:border-[#172B4D]"
        >
          <option value="nashik_regional">नाशिक विभागीय कृषी आयुक्तालय (Nashik Division)</option>
          <option value="thane_konkan">ठाणे व कोकण विभाग (Konkan Division)</option>
          <option value="pune_western">पुणे व पश्चिम महाराष्ट्र विभाग (Western Division)</option>
          <option value="statewide_hq">महाराष्ट्र राज्य मुख्य नियंत्रण कक्ष (Statewide HQ)</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoggingIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#172B4D] bg-[#172B4D] py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] hover:bg-[#123C32] disabled:opacity-50 transition"
        >
          {isLoggingIn ? (
            <span>{isMr ? "प्रवेश करत आहे..." : "Authenticating..."}</span>
          ) : (
            <>
              <ShieldCheck size={15} className="text-[#E6A52E]" />
              <span>{isMr ? "विभागीय नियंत्रण कक्षात प्रवेश करा" : "Sign in to Regional Console"}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {onSwitchToFarmer && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onSwitchToFarmer}
              className="font-sans text-xs font-semibold text-[#123C32] hover:underline"
            >
              {isMr ? "शेतकरी आहात का? येथे मोबाईलने लॉगिन करा →" : "Are you a farmer? Login with Mobile →"}
            </button>
          </div>
        )}
      </div>

    </form>
  );
}

