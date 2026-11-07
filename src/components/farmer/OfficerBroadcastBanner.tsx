"use client";

import { useEffect, useState, useRef } from "react";
import { Radio, Volume2, VolumeX, CheckCircle2, AlertTriangle, X, ShieldAlert, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export interface BroadcastAlert {
  id: string;
  blockName: string;
  districtName: string;
  message: string;
  timestamp: string;
  sender: string;
  farmerCount: number;
}

const STORAGE_KEY = "varshamitra:broadcast-alerts";

export default function OfficerBroadcastBanner({
  currentBlockName = "Shahapur",
  currentDistrictName = "Thane",
  currentVillageName,
}: {
  currentBlockName?: string;
  currentDistrictName?: string;
  currentVillageName?: string;
}) {
  const { language } = useTranslation();
  const isMr = language === "mr";

  const [alerts, setAlerts] = useState<BroadcastAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAlerts = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BroadcastAlert[];
        setAlerts(parsed);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAlerts();

    const handleNewBroadcast = () => {
      loadAlerts();
    };

    window.addEventListener("varshamitra:new-broadcast", handleNewBroadcast);
    window.addEventListener("storage", handleNewBroadcast);

    return () => {
      window.removeEventListener("varshamitra:new-broadcast", handleNewBroadcast);
      window.removeEventListener("storage", handleNewBroadcast);
    };
  }, []);

  // Strict Hyperlocal Filter: Only show broadcast alerts belonging to this farmer's Village, Block/Taluka, or District
  const normFarmerBlock = (currentBlockName || "").toLowerCase().trim();
  const normFarmerDistrict = (currentDistrictName || "").toLowerCase().trim();
  const normFarmerVillage = (currentVillageName || "").toLowerCase().trim();

  const matchingAlert = alerts.find((a) => {
    if (dismissedIds.includes(a.id)) return false;
    const aBlock = (a.blockName || "").toLowerCase().trim();
    const aDistrict = (a.districtName || "").toLowerCase().trim();

    // 1. Direct Taluka/Block match (e.g. alert for "Shahapur" and farmer is in "Shahapur")
    const isBlockMatch =
      aBlock &&
      normFarmerBlock &&
      (aBlock === normFarmerBlock || aBlock.includes(normFarmerBlock) || normFarmerBlock.includes(aBlock));

    // 2. Direct Village match (e.g. alert explicitly for "Vasind" and farmer is in "Vasind")
    const isVillageMatch =
      aBlock &&
      normFarmerVillage &&
      (aBlock === normFarmerVillage || aBlock.includes(normFarmerVillage) || normFarmerVillage.includes(aBlock));

    // 3. District match (only if alert was sent district-wide or without a specific block)
    const isDistrictWide =
      aDistrict &&
      normFarmerDistrict &&
      (aDistrict === normFarmerDistrict || aDistrict.includes(normFarmerDistrict)) &&
      (!aBlock || aBlock === "all" || aBlock === aDistrict || aBlock === "सर्व तालुके");

    // 4. Statewide emergency alert
    const isStatewide = aBlock === "statewide" || aDistrict === "maharashtra" || aDistrict.includes("महाराष्ट्र");

    return isBlockMatch || isVillageMatch || isDistrictWide || isStatewide;
  });

  const displayLocLabel = currentVillageName
    ? `${currentVillageName}, ${currentBlockName}`
    : currentBlockName;

  const activeAlert = matchingAlert || null;

  const handleSpeak = (text: string) => {
    if (typeof window === "undefined") return;

    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const ttsUrl = `${backendUrl}/api/v1/tts?text=${encodeURIComponent(text)}&lang=mr`;
      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "mr-IN";
          u.onend = () => setIsSpeaking(false);
          u.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(u);
        } else {
          setIsSpeaking(false);
        }
      };

      audio.play().catch(() => setIsSpeaking(false));
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
  };

  if (!activeAlert) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border-3 border-[#C7473B] bg-white p-5 sm:p-6 shadow-[6px_6px_0px_#C7473B] animate-in fade-in slide-in-from-top-2">
      
      {/* Top Banner Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#C7473B]/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C7473B] bg-[#C7473B] text-white shadow-xs">
            <Radio size={16} className="animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-[#C7473B] bg-[#C7473B]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#C7473B]">
                MahaDBT Kisaan Gateway Broadcast
              </span>
              <span className="rounded border border-[#123C32]/30 bg-[#F4F0E5] px-2 py-0.5 font-mono text-[9px] font-bold text-[#123C32]">
                📍 {activeAlert.blockName} ({activeAlert.districtName})
              </span>
              <span className="font-mono text-xs font-bold text-[#123C32]">
                {activeAlert.sender}
              </span>
            </div>
            <h3 className="font-display text-base font-black text-[#C7473B] sm:text-lg">
              {isMr ? "शासकीय आपत्कालीन कृषी संदेश" : "Official Agricultural Officer Emergency Bulletin"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded border border-[#123C32]/20 bg-[#F4F0E5] px-2.5 py-1 font-mono text-xs text-[#252923]">
            {activeAlert.timestamp}
          </span>
          <button
            type="button"
            onClick={() => handleDismiss(activeAlert.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#C7473B]/30 text-[#252923]/60 hover:bg-[#C7473B]/10 hover:text-[#C7473B] transition"
            title={isMr ? "संदेश लपवा" : "Dismiss Alert"}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Message Content */}
      <div className="mt-3.5">
        <p className="font-sans text-sm sm:text-base font-semibold text-[#252923] leading-relaxed whitespace-pre-line">
          {activeAlert.message}
        </p>
      </div>

      {/* Action Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#C7473B]/20 pt-3">
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#252923]/70">
          <CheckCircle2 size={13} className="text-[#3B8B61]" />
          <span>
            {isMr
              ? `तालुक्यातील ${activeAlert.farmerCount} नोंदणीकृत शेतकऱ्यांना हा SMS पाठवला गेला आहे.`
              : `Dispatched to ${activeAlert.farmerCount} registered farmers via MahaDBT SMS gateway.`}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSpeak(activeAlert.message)}
            className={`flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition ${
              isSpeaking
                ? "bg-[#C7473B] text-white border-[#C7473B]"
                : "bg-[#123C32] text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D]"
            }`}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? (isMr ? "थांबवा" : "Stop Voice") : isMr ? "संदेश ऐका (Google Voice)" : "Listen to Alert"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDismiss(activeAlert.id)}
            className="rounded-lg border-2 border-[#123C32]/30 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-[#252923] hover:bg-[#F4F0E5]"
          >
            {isMr ? "समजले (Acknowledge)" : "Acknowledge"}
          </button>
        </div>
      </div>

    </div>
  );
}

