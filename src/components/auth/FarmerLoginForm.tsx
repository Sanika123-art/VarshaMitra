"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  Send,
  Sparkles,
  MapPin,
  Sprout,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import {
  getFarmerByMobile,
  getSampleFarmersList,
  normalizeMobile,
  type RegisteredFarmerRecord,
} from "@/lib/farmerRegistry";

export default function FarmerLoginForm({
  onSwitchToRegister,
  initialMobile = "",
}: {
  onSwitchToRegister: (mobile?: string) => void;
  initialMobile?: string;
}) {
  const { language } = useTranslation();
  const isMr = language === "mr";
  const router = useRouter();
  const { loginAsFarmer } = useAppState();

  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [authMethod, setAuthMethod] = useState<"otp" | "pin">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Clean 10-digit mobile
  const cleanMobile = useMemo(() => normalizeMobile(mobileNumber), [mobileNumber]);

  // Real-time lookup from persistent registry
  const matchedFarmer: RegisteredFarmerRecord | null = useMemo(() => {
    if (cleanMobile.length !== 10) return null;
    return getFarmerByMobile(cleanMobile);
  }, [cleanMobile]);

  // List of pre-seeded/registered farmers for quick 1-click test
  const [sampleFarmers, setSampleFarmers] = useState<RegisteredFarmerRecord[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSampleFarmers(getSampleFarmersList().slice(0, 3));
    }
  }, []);

  const handleSendOtp = () => {
    setErrorMsg(null);
    if (cleanMobile.length !== 10) {
      setErrorMsg(isMr ? "कृपया वैध १० अंकी मोबाईल नंबर टाका." : "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!matchedFarmer) {
      setErrorMsg(
        isMr
          ? "हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम नोंदणी करा."
          : "This mobile number is not registered. Please register first."
      );
      return;
    }

    // Generate random 4-digit OTP
    const mockOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(mockOtp);
    setOtpSent(true);
    setEnteredOtp("");
  };

  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      setEnteredOtp(generatedOtp);
    }
  };

  const handleLoginWithOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!matchedFarmer) {
      setErrorMsg(isMr ? "शेतकरी माहिती आढळली नाही." : "Farmer profile not found.");
      return;
    }

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg(isMr ? "अवैध ओटीपी! कृपया SMS मधील योग्य कोड टाका." : "Invalid OTP! Please enter code from SMS.");
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      loginAsFarmer(matchedFarmer);
      router.push("/farmer/dashboard");
    }, 400);
  };

  const handleLoginWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!matchedFarmer) {
      setErrorMsg(isMr ? "शेतकरी माहिती आढळली नाही." : "Farmer profile not found.");
      return;
    }

    const expectedPin = matchedFarmer.mpin || matchedFarmer.profile.mpin || "1234";
    if (enteredPin.trim() !== expectedPin.trim()) {
      setErrorMsg(
        isMr
          ? `चुकीचा सुरक्षा पिन! (डिफॉल्ट पिन: ${expectedPin})`
          : `Incorrect PIN! (Default demo PIN: ${expectedPin})`
      );
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      loginAsFarmer(matchedFarmer);
      router.push("/farmer/dashboard");
    }, 400);
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Informative Header */}
      <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#123C32]/5 p-3">
        <div className="flex items-center gap-2">
          <Sprout size={16} className="text-[#3B8B61]" />
          <h3 className="font-display text-sm font-bold text-[#123C32]">
            {isMr ? "शेतकरी थेट मोबाईल लॉगिन" : "Farmer Mobile Authentication"}
          </h3>
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#252923]/70">
          {isMr
            ? "ईमेल किंवा गुंतागुंतीच्या पासवर्डची गरज नाही. फक्त नोंदणीकृत मोबाईल नंबर टाका."
            : "No email or password required. Sign in with your registered mobile number."}
        </p>
      </div>

      {/* Quick Test Demo Farmer Chips */}
      <div>
        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/70">
          {isMr ? "⚡ जलद चाचणीसाठी नोंदणीकृत शेतकरी निवडा:" : "⚡ Quick test with registered farmer:"}
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {sampleFarmers.map((f) => {
            const isSelected = cleanMobile === normalizeMobile(f.profile.mobileNumber);
            return (
              <button
                key={f.profile.mobileNumber}
                type="button"
                onClick={() => {
                  setMobileNumber(f.profile.mobileNumber);
                  setOtpSent(false);
                  setGeneratedOtp("");
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] transition ${
                  isSelected
                    ? "border-[#123C32] bg-[#123C32] text-white font-bold shadow-xs"
                    : "border-[#123C32]/30 bg-white text-[#123C32] hover:bg-[#123C32]/10"
                }`}
              >
                <span>{f.profile.farmerName}</span>
                <span className="opacity-70">({f.profile.talukaName})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Input Field */}
      <div>
        <label className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
          <span>{isMr ? "नोंदणीकृत मोबाईल नंबर *" : "Registered Mobile Number *"}</span>
          <span className="text-[#252923]/60">10 Digits</span>
        </label>
        <div className="relative mt-1">
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 text-[#123C32]/60 font-mono text-xs font-bold">
            <Phone size={13} />
            <span>+91</span>
          </div>
          <input
            type="tel"
            maxLength={10}
            value={mobileNumber}
            onChange={(e) => {
              setMobileNumber(e.target.value.replace(/\D/g, ""));
              setOtpSent(false);
              setGeneratedOtp("");
              setErrorMsg(null);
            }}
            placeholder="7249702373"
            className="w-full rounded border-2 border-[#123C32]/40 bg-white py-2 pl-14 pr-2.5 font-mono text-sm font-bold tracking-wider text-[#123C32] outline-none focus:border-[#123C32] focus:shadow-[2px_2px_0px_#123C32]"
            autoFocus
          />
        </div>
      </div>

      {/* Status Card: Farmer Found vs Not Found */}
      {cleanMobile.length === 10 && (
        <div>
          {matchedFarmer ? (
            <div className="rounded-lg border-2 border-[#3B8B61] bg-[#3B8B61]/10 p-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-[#3B8B61] font-bold">
                <CheckCircle2 size={16} />
                <span className="font-mono text-xs uppercase tracking-wider">
                  {isMr ? "नोंदणीकृत शेतकरी ओळख पटली" : "Farmer Profile Verified"}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-xs text-[#123C32]">
                <p className="font-bold text-sm">{matchedFarmer.profile.farmerName}</p>
                <p className="flex items-center gap-1 font-mono text-[11px] text-[#252923]/80">
                  <MapPin size={11} className="text-[#3B8B61]" />
                  <span>
                    {isMr
                      ? `${matchedFarmer.profile.villageNameMr || matchedFarmer.profile.villageName}, ता. ${matchedFarmer.profile.talukaNameMr || matchedFarmer.profile.talukaName} (${matchedFarmer.profile.districtNameMr || matchedFarmer.profile.districtName})`
                      : `${matchedFarmer.profile.villageName}, ${matchedFarmer.profile.talukaName} (${matchedFarmer.profile.districtName})`}
                  </span>
                </p>
                <p className="font-mono text-[10px] text-[#252923]/70">
                  {isMr ? "पिक:" : "Crop:"} <span className="font-bold capitalize">{matchedFarmer.cropId}</span> ·{" "}
                  {matchedFarmer.profile.landAcres} {isMr ? "एकर" : "Acres"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-[#E6A52E] bg-[#E6A52E]/10 p-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-[#C7473B] font-bold">
                <AlertTriangle size={16} />
                <span className="font-mono text-xs uppercase tracking-wider">
                  {isMr ? "हा मोबाईल नंबर नोंदणीकृत नाही" : "Mobile Number Not Registered"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#252923]/80">
                {isMr
                  ? "हा नंबर वर्षा मित्र प्रणालीत सापडला नाही. आपण नवीन शेतकरी आहात का?"
                  : "This phone number was not found in VarshaMitra. Please register first."}
              </p>
              <button
                type="button"
                onClick={() => onSwitchToRegister(cleanMobile)}
                className="mt-2.5 flex items-center gap-1.5 rounded border border-[#123C32] bg-[#123C32] px-3 py-1.5 font-mono text-xs font-bold text-[#F4F0E5] shadow-xs hover:bg-[#172B4D] transition"
              >
                <Sprout size={13} className="text-[#E6A52E]" />
                <span>{isMr ? "येथे १ मिनिटात मोफत नोंदणी करा" : "Register as New Farmer (1 Min)"}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded border-2 border-[#C7473B] bg-white p-2.5 font-mono text-xs text-[#C7473B]">
          {errorMsg}
        </div>
      )}

      {/* Authentication Options (Only if farmer is recognized) */}
      {matchedFarmer && (
        <div className="space-y-3 pt-1">
          {/* Method Selector Tabs: OTP vs PIN */}
          <div className="grid grid-cols-2 gap-1 rounded border border-[#123C32]/30 bg-[#123C32]/5 p-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("otp");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1 rounded py-1.5 font-bold transition ${
                authMethod === "otp"
                  ? "bg-[#123C32] text-white shadow-xs"
                  : "text-[#123C32] hover:bg-white"
              }`}
            >
              <Send size={11} />
              <span>{isMr ? "मोबाईल OTP" : "SMS OTP"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("pin");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1 rounded py-1.5 font-bold transition ${
                authMethod === "pin"
                  ? "bg-[#123C32] text-white shadow-xs"
                  : "text-[#123C32] hover:bg-white"
              }`}
            >
              <KeyRound size={11} />
              <span>{isMr ? "४-अंकी PIN (MPIN)" : "4-Digit PIN"}</span>
            </button>
          </div>

          {/* METHOD 1: OTP FLOW */}
          {authMethod === "otp" && (
            <div className="space-y-3">
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[3px_3px_0px_#252923] hover:bg-[#172B4D] transition"
                >
                  <Send size={14} className="text-[#E6A52E]" />
                  <span>{isMr ? "मोबाईलवर OTP पाठवा" : "Send Login OTP to Mobile"}</span>
                </button>
              ) : (
                <form onSubmit={handleLoginWithOtp} className="space-y-3 animate-in fade-in">
                  {/* Simulated SMS Notification Banner */}
                  <div className="rounded-lg border-2 border-[#2878A5] bg-[#2878A5]/10 p-3">
                    <div className="flex items-center justify-between text-[#172B4D]">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                        📲 MahaDBT / MahaAgri SMS Gateway
                      </span>
                      <span className="font-mono text-[9px] text-[#252923]/60">Just now</span>
                    </div>
                    <p className="mt-1 font-mono text-xs font-semibold text-[#172B4D]">
                      {isMr
                        ? `वर्षा मित्र लॉगिन पडताळणी कोड: ${generatedOtp} आहे. कोणाशीही शेअर करू नका.`
                        : `Your VarshaMitra verification code is ${generatedOtp}. Do not share.`}
                    </p>
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      className="mt-2 inline-flex items-center gap-1 rounded border border-[#2878A5] bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#2878A5] hover:bg-[#2878A5] hover:text-white transition"
                    >
                      <span>⚡ {isMr ? `कोड ${generatedOtp} ऑटो-फिल करा` : `Auto-fill ${generatedOtp}`}</span>
                    </button>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                      {isMr ? "४-अंकी SMS कोड टाका:" : "Enter 4-Digit Code:"}
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="mt-1 w-full rounded border-2 border-[#123C32]/40 bg-white py-2 text-center font-mono text-lg font-bold tracking-widest text-[#123C32] outline-none focus:border-[#123C32]"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="flex items-center gap-1 font-mono text-[10px] text-[#123C32]/70 hover:underline"
                    >
                      <RefreshCw size={11} />
                      <span>{isMr ? "पुन्हा OTP पाठवा" : "Resend OTP"}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoggingIn || enteredOtp.length !== 4}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[3px_3px_0px_#252923] hover:bg-[#172B4D] disabled:opacity-50 transition"
                    >
                      {isLoggingIn ? (
                        <span>{isMr ? "प्रवेश करत आहे..." : "Logging in..."}</span>
                      ) : (
                        <>
                          <CheckCircle2 size={14} className="text-[#E6A52E]" />
                          <span>{isMr ? "सत्यापित करा व प्रवेश करा" : "Verify & Enter Cockpit"}</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* METHOD 2: PIN FLOW */}
          {authMethod === "pin" && (
            <form onSubmit={handleLoginWithPin} className="space-y-3 animate-in fade-in">
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                    {isMr ? "४-अंकी MPIN प्रविष्ट करा:" : "Enter 4-Digit MPIN:"}
                  </label>
                  <span className="font-mono text-[9px] text-[#252923]/60">
                    {isMr ? "डिफॉल्ट: 1234" : "Default: 1234"}
                  </span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="mt-1 w-full rounded border-2 border-[#123C32]/40 bg-white py-2 text-center font-mono text-lg font-bold tracking-widest text-[#123C32] outline-none focus:border-[#123C32]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || enteredPin.length !== 4}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[3px_3px_0px_#252923] hover:bg-[#172B4D] disabled:opacity-50 transition"
              >
                {isLoggingIn ? (
                  <span>{isMr ? "प्रवेश करत आहे..." : "Logging in..."}</span>
                ) : (
                  <>
                    <KeyRound size={14} className="text-[#E6A52E]" />
                    <span>{isMr ? "पिन द्वारे डॅशबोर्ड उघडा" : "Login with PIN"}</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Switch to Registration */}
      <div className="border-t border-[#123C32]/15 pt-3 text-center">
        <button
          type="button"
          onClick={() => onSwitchToRegister(cleanMobile)}
          className="font-sans text-xs font-semibold text-[#123C32] hover:underline"
        >
          {isMr ? "नवीन शेतकरी आहात का? येथे मोफत नोंदणी करा →" : "New farmer? Register for free here →"}
        </button>
      </div>

    </div>
  );
}

