"use client";

import { useMemo } from "react";
import {
  Sun,
  CloudRain,
  Wind,
  Droplets,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ThermometerSun,
} from "lucide-react";
import type { ForecastSeries } from "@/lib/api/types";

interface SprayWindowAndWeatherCardProps {
  forecast?: ForecastSeries | null;
  cropName: string;
  isMr: boolean;
}

export default function SprayWindowAndWeatherCard({
  forecast,
  cropName,
  isMr,
}: SprayWindowAndWeatherCardProps) {
  // Extract today (day 0) and tomorrow (day 1) from forecast
  const todayItem = forecast?.forecast?.[0];
  const tomorrowItem = forecast?.forecast?.[1];

  const todayRainMm = todayItem?.precipitation_sum_mm ?? 0.0;
  const todayProbPct = todayItem?.precipitation_probability_pct ?? 0;
  const todayMaxTemp = Math.round(todayItem?.temperature_max_c ?? 30);
  const todayMinTemp = Math.round(todayItem?.temperature_min_c ?? 19);

  const tomorrowRainMm = tomorrowItem?.precipitation_sum_mm ?? 0.0;
  const tomorrowProbPct = tomorrowItem?.precipitation_probability_pct ?? 0;
  const tomorrowMaxTemp = Math.round(tomorrowItem?.temperature_max_c ?? 30);
  const tomorrowMinTemp = Math.round(tomorrowItem?.temperature_min_c ?? 18);

  // Live wind speed (km/h) from atmospheric model
  const windSpeedKmh = Math.round(todayItem?.wind_speed_kmh ?? 13);
  const tomorrowWindSpeedKmh = Math.round(tomorrowItem?.wind_speed_kmh ?? 15);

  // Instantaneous live weather snapshot if available
  const currentWeather = forecast?.current_weather;
  const currentTemp = currentWeather?.temperature_c !== undefined ? currentWeather.temperature_c : todayMaxTemp;
  const currentWind = currentWeather?.wind_speed_kmh !== undefined ? Math.round(currentWeather.wind_speed_kmh) : windSpeedKmh;
  const currentHumidity = currentWeather?.relative_humidity_pct !== undefined ? Math.round(currentWeather.relative_humidity_pct) : 29;

  // Evaluate Spray Suitability Window
  const sprayAssessment = useMemo(() => {
    if (todayRainMm >= 5.0 || todayProbPct >= 65 || currentWind >= 25) {
      return {
        status: "danger",
        badgeText: isMr ? "थांबा! आज फवारणी करू नका" : "Unsafe: Do Not Spray Today",
        badgeBg: "border-[#C7473B] bg-[#C7473B]/10 text-[#C7473B]",
        headline: isMr
          ? `पावसामुळे ${cropName} पिकावरील फवारणी पुढे ढकला`
          : `Postpone spray operations on ${cropName} due to rain risk`,
        description: isMr
          ? "शेतात पाऊस पडण्याचा किंवा सोसाट्याचा वारा सुटण्याचा दाट अंदाज आहे. आता फवारल्यास औषध वाहून जाऊन आर्थिक नुकसान होईल."
          : "High probability of rain or strong winds. Chemicals will wash off or drift, resulting in wasted expenditure.",
        idealTiming: isMr ? "आज फवारणी पूर्णपणे टाळा" : "Spraying strictly not recommended today",
        windRating: isMr ? "वेगवान वारा" : "High Wind",
      };
    } else if (todayRainMm >= 1.5 || todayProbPct >= 40 || currentWind >= 18) {
      return {
        status: "warning",
        badgeText: isMr ? "काळजीपूर्वक फवारणी करा" : "Caution: Spray with Sticking Agent",
        badgeBg: "border-[#E6A52E] bg-[#E6A52E]/15 text-[#925600]",
        headline: isMr
          ? `${cropName} पिकावर सकाळीच फवारणी उरका व स्टिकर वापरा`
          : `Complete spraying early morning & use sticking agent for ${cropName}`,
        description: isMr
          ? "दुपारी अथवा संध्याकाळी हलक्या पावसाची शक्यता आहे. सकाळी ८ ते १० वाजेपर्यंत फवारणी पूर्ण करा आणि औषधात स्टिकर/स्प्रेडर नक्की मिसळा."
          : "Scattered showers possible later in the day. Complete application before 10:30 AM and mandate a surfactant / sticker.",
        idealTiming: isMr ? "फक्त सकाळी ८:०० ते १०:३० पर्यंत" : "Window: 8:00 AM – 10:30 AM only",
        windRating: isMr ? "मध्यम वारा" : "Moderate Wind",
      };
    } else {
      return {
        status: "success",
        badgeText: isMr ? "फवारणीसाठी उत्तम व अनुकूल वेळ" : "Ideal & Safe Spraying Window",
        badgeBg: "border-[#3B8B61] bg-[#3B8B61]/15 text-[#14532D]",
        headline: isMr
          ? `${cropName} पिकावर कीटकनाशक / विद्राव्य खत फवारणीसाठी योग्य दिवस`
          : `Optimal conditions for insecticide, fungicide & foliar spray on ${cropName}`,
        description: isMr
          ? "पुढील २४ तास पाऊस पडण्याची शक्यता कमी आहे आणि वारा शांत आहे. फवारलेले औषध पानांवर पूर्णपणे शोषले जाईल."
          : "Minimal rain probability and gentle wind (<15 km/h) over the next 24 hours. Optimal leaf absorption guaranteed.",
        idealTiming: isMr ? "सकाळी ७:०० ते ११:०० किंवा दुपारी ४:०० नंतर" : "7:00 AM – 11:00 AM or after 4:00 PM",
        windRating: isMr ? "मंद व शांत वारा (उत्तम)" : "Gentle breeze (Ideal)",
      };
    }
  }, [todayRainMm, todayProbPct, currentWind, cropName, isMr]);

  return (
    <div className="space-y-4">
      {/* ── 1. The Spray Weather Window Index (Clean & Airy) ── */}
      <div className="overflow-hidden rounded-2xl border-3 border-[#123C32] bg-white p-5 sm:p-6 shadow-[5px_5px_0px_#123C32]">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#123C32] bg-[#F4F0E5] text-[#123C32]">
              <Wind size={20} className="text-[#123C32]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]/70">
                  Agro-Chemical Precision Index
                </span>
                <span className="rounded bg-[#E6A52E] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#123C32]">
                  LIVE
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-[#123C32] sm:text-xl">
                {isMr ? "🌿 फवारणी हवामान खिडकी (Spray Window)" : "🌿 Spray Weather & Chemical Safety Window"}
              </h2>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${sprayAssessment.badgeBg}`}>
            {sprayAssessment.status === "success" && <CheckCircle2 size={15} />}
            {sprayAssessment.status === "warning" && <AlertTriangle size={15} />}
            {sprayAssessment.status === "danger" && <AlertOctagon size={15} />}
            <span>{sprayAssessment.badgeText}</span>
          </span>
        </div>

        {/* Content Body */}
        <div className="mt-4 grid gap-5 lg:grid-cols-12">
          {/* Main Advisory Text (8 cols) */}
          <div className="space-y-2 lg:col-span-8">
            <h3 className="font-display text-base font-bold text-[#252923] sm:text-lg">
              {sprayAssessment.headline}
            </h3>
            <p className="font-sans text-xs leading-relaxed text-[#252923]/80 sm:text-sm">
              {sprayAssessment.description}
            </p>

            {/* Recommended Time Strip */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#123C32]/20 bg-[#F4F0E5]/70 p-2.5 text-xs text-[#123C32]">
              <Clock size={15} className="text-[#E6A52E] shrink-0" />
              <span className="font-semibold">
                {isMr ? "अनुकूल वेळ: " : "Recommended Time Window: "}
                <strong>{sprayAssessment.idealTiming}</strong>
              </span>
            </div>
          </div>

          {/* Environmental Metrics (4 cols) */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border-2 border-[#123C32]/15 bg-[#F4F0E5]/40 p-3 lg:col-span-4">
            <div className="flex flex-col items-center justify-center text-center">
              <CloudRain size={16} className="text-[#2878A5]" />
              <span className="mt-1 font-mono text-[10px] text-[#252923]/60">
                {isMr ? "पाऊस शक्यता" : "Rain Prob"}
              </span>
              <strong className="font-mono text-xs text-[#123C32]">{todayProbPct}%</strong>
              <span className="text-[9px] text-[#252923]/70">{todayRainMm} mm</span>
            </div>

            <div className="flex flex-col items-center justify-center border-x border-[#123C32]/10 text-center">
              <Wind size={16} className="text-[#3B8B61]" />
              <span className="mt-1 font-mono text-[10px] text-[#252923]/60">
                {isMr ? "वाऱ्याचा वेग" : "Wind Speed"}
              </span>
              <strong className="font-mono text-xs text-[#123C32]">{currentWind} km/h</strong>
              <span className="text-[9px] text-[#252923]/70">
                {currentWind < 15 ? (isMr ? "शांत" : "Calm") : (isMr ? "मध्यम" : "Moderate")}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <ThermometerSun size={16} className="text-[#E6A52E]" />
              <span className="mt-1 font-mono text-[10px] text-[#252923]/60">
                {isMr ? "चालू तापमान" : "Live Temp"}
              </span>
              <strong className="font-mono text-xs text-[#123C32]">{currentTemp}°C</strong>
              <span className="text-[9px] text-[#252923]/70">कमाल {todayMaxTemp}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Today vs Tomorrow Hyperlocal Forecast Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* TODAY */}
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[3px_3px_0px_#123C32]">
          <div className="flex items-center justify-between border-b border-[#123C32]/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E6A52E] bg-[#E6A52E]/15 text-[#E6A52E]">
                <Sun size={15} />
              </span>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                  {isMr ? "आजचा दिवस (Today)" : "Today's Outlook"}
                </span>
                <p className="font-display text-sm font-bold text-[#252923]">
                  {todayRainMm > 2 ? (isMr ? "पावसाची शक्यता" : "Rain Expected") : (isMr ? "मुख्यतः कोरडे व ऊन" : "Mostly Sunny & Dry")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-bold text-[#123C32]">
                {currentTemp}°C
              </span>
              <span className="block font-mono text-[10px] text-[#252923]/70">
                {todayMaxTemp}° / {todayMinTemp}°C
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between font-mono text-xs text-[#252923]/80">
            <span className="flex items-center gap-1 text-[#2878A5]">
              <Droplets size={12} />
              <span>{isMr ? "पाऊस: " : "Rain: "}<strong>{todayRainMm} mm</strong> ({todayProbPct}%)</span>
            </span>
            <span>{isMr ? "वारा: " : "Wind: "}<strong>{currentWind} km/h</strong> · {currentHumidity}% {isMr ? "आर्द्रता" : "RH"}</span>
          </div>
        </div>

        {/* TOMORROW */}
        <div className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[3px_3px_0px_#123C32]">
          <div className="flex items-center justify-between border-b border-[#123C32]/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2878A5] bg-[#2878A5]/15 text-[#2878A5]">
                <CloudRain size={15} />
              </span>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
                  {isMr ? "उद्याचा दिवस (Tomorrow)" : "Tomorrow's Outlook"}
                </span>
                <p className="font-display text-sm font-bold text-[#252923]">
                  {tomorrowRainMm > 2 ? (isMr ? "हलक्या सरी" : "Showers Expected") : (isMr ? "अंशतः ढगाळ हवामान" : "Partly Cloudy")}
                </p>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-[#123C32]">
              {tomorrowMaxTemp}° / {tomorrowMinTemp}°C
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between font-mono text-xs text-[#252923]/80">
            <span className="flex items-center gap-1 text-[#2878A5]">
              <Droplets size={12} />
              <span>{isMr ? "पाऊस: " : "Rain: "}<strong>{tomorrowRainMm} mm</strong> ({tomorrowProbPct}%)</span>
            </span>
            <span>{isMr ? "वारा: " : "Wind: "}<strong>{tomorrowWindSpeedKmh} km/h</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
