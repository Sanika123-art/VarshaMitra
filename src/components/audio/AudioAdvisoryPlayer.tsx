"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface AudioAdvisoryPlayerProps {
  title: string;
  textToRead: string;
  cropName?: string;
  stageName?: string;
  compact?: boolean;
}

export default function AudioAdvisoryPlayer({
  title,
  textToRead,
  cropName,
  stageName,
  compact = false,
}: AudioAdvisoryPlayerProps) {
  const { language } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [rate, setRate] = useState<number>(0.95);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanText = useCallback((raw: string) => {
    return raw
      .replace(/\*\*/g, "")
      .replace(/[#*_`]/g, "")
      .replace(/•/g, " ")
      .replace(/\n+/g, ". ")
      .trim();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (typeof window === "undefined") return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    const spokenText = cleanText(textToRead);
    const targetLang = language === "mr" ? "mr" : "en";

    // Primary: Stream authentic Google Assistant Marathi / Indian English female neural voice
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const ttsUrl = `${backendUrl}/api/v1/tts?text=${encodeURIComponent(spokenText)}&lang=${targetLang}`;
      const audio = new Audio(ttsUrl);
      audio.playbackRate = rate;
      audioRef.current = audio;

      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        // Fallback to Web Speech API
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(spokenText);
          u.lang = targetLang === "mr" ? "mr-IN" : "en-IN";
          u.rate = rate;
          const voices = window.speechSynthesis.getVoices();
          const mrVoice = voices.find(
            (v) => v.lang.startsWith("mr") || v.lang.startsWith("hi") || v.lang.includes("IN")
          );
          if (mrVoice) u.voice = mrVoice;
          u.onend = () => setIsPlaying(false);
          u.onerror = () => setIsPlaying(false);
          utteranceRef.current = u;
          window.speechSynthesis.speak(u);
        } else {
          setIsPlaying(false);
        }
      };

      audio.play().catch(() => {
        audio.onerror?.(new Event("error"));
      });
    } catch {
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  if (!isSupported) return null;

  const isMr = language === "mr";
  const buttonLabel = isPlaying
    ? (isMr ? "थांबवा (Pause)" : "Pause Audio")
    : (isMr ? "सल्ला ऐका (Listen to Advisory)" : "Listen to Advisory");

  if (compact) {
    return (
      <button
        type="button"
        onClick={handlePlay}
        className={`inline-flex items-center gap-2 rounded-lg border-2 border-[#123C32] px-3 py-1.5 font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#123C32] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
          isPlaying
            ? "bg-[#E6A52E] text-[#123C32]"
            : "bg-[#123C32] text-[#F4F0E5] hover:bg-[#123C32]/90"
        }`}
        title={buttonLabel}
      >
        {isPlaying ? (
          <>
            <Pause size={14} className="animate-pulse" />
            <span>{isMr ? "थांबवा" : "Pause"}</span>
            <span className="flex items-center gap-0.5 ml-1">
              <span className="h-2 w-0.5 bg-[#123C32] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-3 w-0.5 bg-[#123C32] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-0.5 bg-[#123C32] animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </>
        ) : (
          <>
            <Volume2 size={14} />
            <span>{isMr ? "ऐका" : "Listen"}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[#123C32] bg-[#FAF8F2] p-4 shadow-[4px_4px_0px_#123C32]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#123C32] shadow-[2px_2px_0px_#123C32] transition-colors ${
              isPlaying ? "bg-[#E6A52E] text-[#123C32]" : "bg-[#123C32] text-[#F4F0E5]"
            }`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-0.5">
                <span className="h-3 w-1 bg-[#123C32] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-5 w-1 bg-[#123C32] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-3 w-1 bg-[#123C32] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : (
              <Volume2 size={20} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
                {isMr ? "शेतकरी व्हॉईस असिस्टंट" : "Vernacular Audio"}
              </span>
              {cropName && (
                <span className="font-mono text-xs font-semibold text-[#123C32]">
                  {cropName} {stageName ? `· ${stageName}` : ""}
                </span>
              )}
            </div>
            <h4 className="font-display text-sm font-bold text-[#123C32] mt-0.5 sm:text-base">
              {title}
            </h4>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#123C32] bg-white text-[#123C32] shadow-[2px_2px_0px_#123C32] transition-all hover:bg-neutral-100"
              title="Stop audio"
            >
              <RotateCcw size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={handlePlay}
            className={`flex items-center gap-2 rounded-lg border-2 border-[#123C32] px-4 py-2 font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#123C32] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              isPlaying
                ? "bg-[#E6A52E] text-[#123C32]"
                : "bg-[#123C32] text-[#F4F0E5] hover:bg-[#123C32]/90"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={16} />
                <span>{isMr ? "सल्ला थांबवा" : "Pause"}</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>{isMr ? "सल्ला ऐका (Audio)" : "Play Voice Advisory"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isPlaying && (
        <div className="mt-3 rounded-lg border border-[#123C32]/20 bg-white p-2.5 font-sans text-xs text-[#252923] leading-relaxed">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#E6A52E] mb-1">
            <Sparkles size={12} className="text-[#E6A52E]" />
            <span>{isMr ? "सध्या वाचन सुरू आहे..." : "Currently Reading Aloud..."}</span>
          </div>
          <p className="line-clamp-2 italic text-[#252923]/90">
            "{cleanText(textToRead)}"
          </p>
        </div>
      )}
    </div>
  );
}

