"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Smartphone,
  Send,
  Share2,
  Volume2,
  VolumeX,
  CheckCircle2,
  RefreshCw,
  Radio,
  Signal,
  BatteryCharging,
  MessageSquare,
  Users,
  Copy,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface RuralSmsSimulatorProps {
  blockName: string;
  districtName: string;
  riskLevel: string;
  primaryDriver?: string;
  forecastRainMm?: number;
}

export default function RuralSmsSimulator({
  blockName,
  districtName,
  riskLevel,
  primaryDriver,
  forecastRainMm = 12.4,
}: RuralSmsSimulatorProps) {
  const { language } = useTranslation();
  const isMr = language === "mr";

  // Generated SMS message based on block data
  const defaultSmsText = useMemo(() => {
    if (riskLevel === "critical" || riskLevel === "high") {
      return `[VarshaMitra/महाकृषी]\n${blockName} (${districtName}): पुढील ७ दिवस पावसाचा खंड कायम राहण्याचा अंदाज. सोयाबीन/कापूस पिकाला तुषार सिंचनाने हलके पाणी द्यावे. PMFBY मदत: 14447`;
    } else {
      return `[VarshaMitra/महाकृषी]\n${blockName} (${districtName}): पुढील १४ दिवसांत ${forecastRainMm} मिमी पाऊस अपेक्षित. शेतात वाफसा तपासूनच आंतरमशागत व खत व्यवस्थापन करावे.`;
    }
  }, [blockName, districtName, riskLevel, forecastRainMm]);

  const [message, setMessage] = useState(defaultSmsText);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [farmerCount] = useState(() => Math.floor(800 + Math.random() * 1200));

  useEffect(() => {
    setMessage(defaultSmsText);
  }, [defaultSmsText]);

  // Voice playback simulating Kisan Call Center IVRS
  const handleVoiceBroadcast = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "mr-IN";
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastSent(true);

      // Persist to shared store so Farmer Panel displays this emergency alert!
      if (typeof window !== "undefined") {
        const alertObj = {
          id: `broadcast-${Date.now()}`,
          blockName,
          districtName,
          message,
          timestamp: new Date().toLocaleTimeString("mr-IN", { hour: "2-digit", minute: "2-digit" }),
          sender: `तालुका कृषी अधिकारी (${blockName})`,
          farmerCount,
        };
        try {
          const existing = JSON.parse(localStorage.getItem("varshamitra:broadcast-alerts") || "[]");
          const updated = [alertObj, ...existing.slice(0, 9)];
          localStorage.setItem("varshamitra:broadcast-alerts", JSON.stringify(updated));
          window.dispatchEvent(new Event("varshamitra:new-broadcast"));
        } catch {
          // ignore
        }
      }

      setTimeout(() => setBroadcastSent(false), 4000);
    }, 1200);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const charCount = message.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  // WhatsApp link
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  return (
    <div className="rounded-xl border-3 border-[#123C32] bg-white p-6 shadow-[5px_5px_0px_#123C32]">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#123C32] bg-[#F4F0E5] text-[#123C32]">
            <Radio size={22} className="text-[#123C32]" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#F4F0E5]">
                2G SMS & WhatsApp Dispatch
              </span>
              <span className="font-mono text-xs text-[#252923]/70">
                MahaDBT / Kisaan Portal Gateway
              </span>
            </div>
            <h3 className="font-display text-lg font-black text-[#123C32]">
              {isMr ? "ग्रामीण शेतकरी SMS व व्हॉट्सॲप प्रसारण" : "Rural 2G Feature Phone & WhatsApp Broadcast"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1 rounded border border-[#123C32]/30 bg-[#F4F0E5] px-2.5 py-1 text-[#252923]">
            <Users size={12} className="text-[#123C32]" />
            <span><strong>{farmerCount}</strong> {isMr ? "नोंदणीकृत शेतकरी" : "Registered in Block"}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
        
        {/* ── Realistic 2G Feature Phone LCD Screen (5 cols) ── */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[280px] rounded-3xl border-4 border-[#252923] bg-[#2C302E] p-4 shadow-[6px_6px_0px_#123C32]">
            
            {/* Phone Top Speaker & Brand */}
            <div className="flex flex-col items-center pb-2">
              <div className="h-1.5 w-12 rounded-full bg-black/40" />
              <span className="mt-1 font-mono text-[9px] font-black uppercase tracking-widest text-[#F4F0E5]/60">
                NOKIA · 2G CELL
              </span>
            </div>

            {/* LCD Display Frame */}
            <div className="rounded-xl border-3 border-[#123C32] bg-[#9EA792] p-3 font-mono text-xs text-[#1A231C] shadow-inner">
              
              {/* LCD Status Bar */}
              <div className="flex items-center justify-between border-b border-[#1A231C]/30 pb-1 text-[10px]">
                <div className="flex items-center gap-1 font-bold">
                  <Signal size={11} />
                  <span>BSNL 2G</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>10:42 AM</span>
                  <BatteryCharging size={11} />
                </div>
              </div>

              {/* SMS Header */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold border-b border-dashed border-[#1A231C]/25 pb-1">
                <span className="flex items-center gap-1">
                  <MessageSquare size={10} />
                  <span>VM-MAHAGRI</span>
                </span>
                <span>1/1</span>
              </div>

              {/* LCD Marathi Message Display */}
              <div className="my-2 min-h-[110px] font-sans text-[11px] font-semibold leading-relaxed whitespace-pre-line tracking-tight">
                {message}
              </div>

              {/* LCD Bottom Bar */}
              <div className="flex items-center justify-between border-t border-[#1A231C]/30 pt-1 text-[9px] font-bold">
                <span>Options</span>
                <span>Back</span>
              </div>
            </div>

            {/* Phone Keypad Simulator (Aesthetic) */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 px-2">
              {["1", "2 ABC", "3 DEF", "4 GHI", "5 JKL", "6 MNO", "7 PQRS", "8 TUV", "9 WXYZ", "*", "0 +", "#"].map((key) => (
                <div
                  key={key}
                  className="flex h-7 items-center justify-center rounded-md border border-[#F4F0E5]/10 bg-[#3A3F3C] text-[9px] font-mono font-bold text-[#F4F0E5]/80 shadow-xs"
                >
                  {key}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Officer Dispatch Controls & Live Editor (7 cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
              {isMr ? "प्रसारण संदेश मजकूर (संपादित करा)" : "Drafted Marathi Advisory Text (Editable)"}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-[#123C32]/30 bg-[#F4F0E5]/40 p-3 font-sans text-xs sm:text-sm font-medium leading-relaxed text-[#252923] focus:border-[#123C32] focus:bg-white focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-[#252923]/70">
              <span>Length: <strong>{charCount}</strong> chars ({smsSegments} SMS credit)</span>
              <span>Encoding: GSM-7 / Unicode UTF-16</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-2 pt-2">
            
            {/* Send Bulk SMS */}
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-4 py-2 font-mono text-xs font-bold uppercase text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D] disabled:opacity-60 transition"
            >
              {isBroadcasting ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-[#E6A52E]" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send size={14} className="text-[#E6A52E]" />
                  <span>{isMr ? `${farmerCount} शेतकऱ्यांना SMS पाठवा` : `Broadcast to ${farmerCount} Farmers`}</span>
                </>
              )}
            </button>

            {/* Share to WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#3B8B61] bg-[#3B8B61] px-4 py-2 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_#123C32] hover:bg-[#2e6e4c] transition"
            >
              <Share2 size={14} />
              <span>{isMr ? "व्हॉट्सॲपवर पाठवा" : "Share on WhatsApp"}</span>
            </a>

            {/* IVRS Voice Test */}
            <button
              type="button"
              onClick={handleVoiceBroadcast}
              className={`flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] px-3.5 py-2 font-mono text-xs font-bold uppercase transition ${
                isSpeaking
                  ? "bg-[#C7473B] text-white border-[#C7473B]"
                  : "bg-white text-[#123C32] hover:bg-[#F4F0E5]"
              }`}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? (isMr ? "थांबवा" : "Stop IVRS") : isMr ? "IVRS कॉल ऐका" : "Test Voice IVRS"}</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg border border-[#123C32]/30 bg-white px-3 py-2 font-mono text-xs font-semibold text-[#123C32] hover:bg-[#F4F0E5]"
            >
              <Copy size={13} />
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Delivery confirmation badge */}
          {broadcastSent && (
            <div className="flex items-center gap-2 rounded-lg border-2 border-[#3B8B61] bg-[#3B8B61]/10 p-3 font-mono text-xs font-bold text-[#3B8B61] animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>
                {isMr
                  ? `यशस्वी! CDAC Kisaan SMS Gateway द्वारे ${blockName} मधील ${farmerCount} शेतकऱ्यांना SMS प्रसारित झाला.`
                  : `Success! Advisory transmitted to ${farmerCount} registered mobile numbers in ${blockName} via CDAC Gateway.`}
              </span>
            </div>
          )}

          <div className="rounded-lg border border-[#123C32]/15 bg-[#F4F0E5]/60 p-3 font-sans text-xs text-[#252923]/75 leading-relaxed">
            <span className="font-bold text-[#123C32]">Accessibility Note:</span>{" "}
            {isMr
              ? "स्मार्टफोन किंवा इंटरनेट नसलेल्या शेतकऱ्यांसाठी हा संदेश थेट बेसिक २जी फोनवर देवनागरी युनिकोड किंवा आयव्हीआरएस व्हॉइस कॉलद्वारे पोहोचविला जातो."
              : "Bridging the digital divide: smallholders without smartphones or 4G data receive this prompt SMS or automated IVRS voice call on their basic feature phones."}
          </div>
        </div>

      </div>
    </div>
  );
}

