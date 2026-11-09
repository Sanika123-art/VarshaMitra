"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Phone, Sprout, Volume2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { getFarmerByMobile, normalizeMobile, type RegisteredFarmerRecord } from "@/lib/farmerRegistry";

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
  const [mobile, setMobile] = useState(initialMobile);
  const [demoOtp, setDemoOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const cleanMobile = useMemo(() => normalizeMobile(mobile), [mobile]);
  const farmer: RegisteredFarmerRecord | null = useMemo(
    () => cleanMobile.length === 10 ? getFarmerByMobile(cleanMobile) : null,
    [cleanMobile]
  );

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function requestDemoOtp() {
    if (!farmer) return;
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    setDemoOtp(String(randomValue[0] % 1_000_000).padStart(6, "0"));
    setEnteredOtp("");
    setOtpError("");
    setVoiceError("");
  }

  function speakOtpInstructions() {
    if (!demoOtp) return;
    if (!("speechSynthesis" in window)) {
      setVoiceError(isMr
        ? "या ब्राउझरमध्ये आवाजाची सुविधा नाही. खालील सूचना वाचा."
        : "Voice guidance is not available in this browser. Please read the instruction below.");
      return;
    }

    const digitNames = isMr
      ? ["शून्य", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ"]
      : ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const spokenCode = [...demoOtp].map((digit) => digitNames[Number(digit)]).join(", ");
    const instruction = isMr
      ? `तुमचा चाचणी ओटीपी आहे: ${spokenCode}. हे सहा अंक खालील चौकटीत टाका. हा फक्त डेमो कोड आहे. एस एम एस पाठवलेला नाही.`
      : `Your demo O T P is: ${spokenCode}. Type these six digits in the box below. This is only a demo code. No text message was sent.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(instruction);
    utterance.lang = isMr ? "mr-IN" : "en-IN";
    utterance.onerror = () => setVoiceError(isMr
      ? "आवाज सुरू झाला नाही. कृपया खालील सूचना वाचा."
      : "Voice playback failed. Please read the instruction below.");
    setVoiceError("");
    window.speechSynthesis.speak(utterance);
  }

  function signIn() {
    if (!farmer) return;
    if (!demoOtp || enteredOtp !== demoOtp) {
      setOtpError(isMr ? "चाचणी ओटीपी जुळत नाही. स्क्रीनवरील सहा अंक पुन्हा तपासा." : "That demo OTP does not match. Check the six digits on the screen and try again.");
      return;
    }
    loginAsFarmer(farmer);
    router.push("/farmer/dashboard");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#123C32]/5 p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#123C32]">
          <Sprout size={19} aria-hidden />
          {isMr ? "नमस्कार शेतकरी मित्रा!" : "Hello, farmer friend!"}
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#252923]/75">
          {isMr ? "तुमचा नोंदणीचा मोबाईल नंबर टाका." : "Enter the mobile number you registered with."}
        </p>
      </div>

      <div>
        <label htmlFor="login-mobile" className="mb-1 block text-sm font-bold text-[#123C32]">
          {isMr ? "मोबाईल नंबर (१० अंक)" : "Mobile number (10 digits)"}
        </label>
        <div className="relative">
          <Phone size={17} className="absolute left-3 top-3.5 text-[#123C32]/60" aria-hidden />
          <input
            id="login-mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            autoFocus
            value={mobile}
            onChange={(event) => {
              setMobile(event.target.value.replace(/\D/g, ""));
              setDemoOtp("");
              setEnteredOtp("");
              setOtpError("");
              setVoiceError("");
            }}
            className="w-full rounded-lg border-2 border-[#123C32]/25 bg-white py-3 pl-10 pr-3 text-lg tracking-wide text-[#252923] outline-none focus:border-[#123C32]"
            placeholder="१० अंकी नंबर"
          />
        </div>
      </div>

      {cleanMobile.length === 10 && farmer && (
        <>
          <div className="rounded-xl border border-[#3B8B61]/40 bg-[#3B8B61]/10 p-3">
            <p className="font-bold text-[#123C32]">{farmer.profile.farmerName}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-[#252923]/75">
              <MapPin size={14} aria-hidden />
              {[farmer.location.blockName, farmer.location.districtName].filter(Boolean).join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={requestDemoOtp}
            className="w-full rounded-lg border-2 border-[#123C32] px-4 py-3 text-base font-bold text-[#123C32]"
          >
            {demoOtp
              ? (isMr ? "नवीन चाचणी ओटीपी दाखवा" : "Show a new demo OTP")
              : (isMr ? "चाचणी ओटीपी दाखवा" : "Show demo OTP")}
          </button>
        </>
      )}

      {cleanMobile.length === 10 && !farmer && (
        <div className="rounded-xl border border-[#E6A52E]/50 bg-[#FFF9E8] p-3">
          <p className="text-sm leading-5 text-[#252923]/80">
            {isMr ? "हा नंबर या उपकरणातील नोंदणीत सापडला नाही." : "This number was not found in the registration saved on this device."}
          </p>
          <button type="button" onClick={() => onSwitchToRegister(cleanMobile)} className="mt-2 text-sm font-bold text-[#123C32] underline underline-offset-2">
            {isMr ? "नवीन नोंदणी करा" : "Register as a new farmer"}
          </button>
        </div>
      )}

      {demoOtp && farmer && (
        <div className="space-y-3 rounded-xl border-2 border-[#E6A52E] bg-[#FFF9E8] p-4">
          <p className="text-sm font-bold leading-5 text-[#5B3A00]" role="note">
            {isMr
              ? "हा फक्त चाचणी कोड आहे. एस एम एस आलेला नाही; हा कोड तुमची ओळख तपासत नाही."
              : "This is a demo code only. No SMS was sent, and this code does not verify your identity."}
          </p>
          <p className="text-center text-3xl font-extrabold tracking-[0.3em] text-[#123C32]" aria-label={isMr ? `चाचणी ओटीपी ${[...demoOtp].join(" ")}` : `Demo OTP ${[...demoOtp].join(" ")}`}>
            {demoOtp}
          </p>
          <button
            type="button"
            onClick={speakOtpInstructions}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123C32] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Volume2 size={18} aria-hidden />
            {isMr ? "कोड आणि सूचना ऐका" : "Listen to the code and instructions"}
          </button>
          {voiceError && <p className="text-sm text-[#9A3412]" role="status">{voiceError}</p>}
          <div>
            <label htmlFor="login-otp" className="mb-1 block text-sm font-bold text-[#123C32]">
              {isMr ? "वर दिसणारे सहा अंक येथे टाका" : "Type the six digits shown above"}
            </label>
            <input
              id="login-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={enteredOtp}
              onChange={(event) => {
                setEnteredOtp(event.target.value.replace(/\D/g, ""));
                setOtpError("");
              }}
              className="w-full rounded-lg border-2 border-[#123C32]/25 bg-white px-3 py-3 text-center text-xl tracking-[0.4em] text-[#252923] outline-none focus:border-[#123C32]"
              placeholder="६ अंक / 6 digits"
              aria-describedby={otpError ? "login-otp-error" : undefined}
            />
            <p className="mt-1 text-xs leading-5 text-[#252923]/75">
              {isMr
                ? "मोठ्याने वाचण्यासाठी “कोड आणि सूचना ऐका” दाबा. मग तेच अंक चौकटीत लिहा."
                : "Press “Listen to the code and instructions” to hear the digits, then type the same digits in the box."}
            </p>
            {otpError && <p id="login-otp-error" className="mt-2 text-sm font-semibold text-[#9A3412]" role="alert">{otpError}</p>}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!farmer || !demoOtp || enteredOtp.length !== 6}
        onClick={signIn}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#123C32] px-4 py-3 text-base font-bold text-white hover:bg-[#0D2E26] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isMr ? "ओटीपी तपासा आणि खाते उघडा" : "Check OTP and open my account"}
        <ArrowRight size={17} aria-hidden />
      </button>

      <p className="rounded-lg bg-[#F4F0E5] p-3 text-xs leading-5 text-[#252923]/70">
        {isMr
          ? "हा डेमो कोड फक्त लॉगिनची पद्धत दाखवतो. प्रत्यक्ष SMS पडताळणी नाही; सार्वजनिक उपकरणावर वापरू नका."
          : "This demo code only shows the login steps. It does not send an SMS or verify identity; do not use it on a shared device."}
      </p>

      <button type="button" onClick={() => onSwitchToRegister(cleanMobile)} className="w-full py-2 text-sm font-semibold text-[#123C32] underline underline-offset-2">
        {isMr ? "नवीन शेतकरी आहात? नोंदणी करा" : "New farmer? Create an account"}
      </button>
    </div>
  );
}
