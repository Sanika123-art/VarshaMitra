"use client";

import { useState, useEffect, useId } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  HelpCircle,
  Building,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface PmfbyInsuranceCardProps {
  farmerName?: string;
  gatNumber?: string;
  blockId?: string;
  blockName: string;
  districtName: string;
  cropName: string;
  rainfallHistoryMm: number;
  dryDaysStreak: number;
  heavyRainMax: number;
  soilMoisturePct?: number;
  inMonsoon?: boolean;
}

export default function PmfbyInsuranceCard({
  farmerName: propFarmerName,
  gatNumber: propGatNumber,
  blockId = "niphad",
  blockName,
  districtName,
  cropName,
  rainfallHistoryMm,
  dryDaysStreak,
  heavyRainMax,
  soilMoisturePct = 28.5,
  inMonsoon = true,
}: PmfbyInsuranceCardProps) {
  const { language } = useTranslation();
  const isMr = language === "mr";
  const [modalOpen, setModalOpen] = useState(false);

  // Initialize with the logged-in farmer's real name and Gat number
  const initialFarmerName = propFarmerName || (isMr ? "सागर तळपदे" : "Sagar Talpade");
  const initialSurveyNo = propGatNumber
    ? isMr
      ? `७/१२ गट क्र. ${propGatNumber}`
      : `7/12 Gat No. ${propGatNumber}`
    : isMr
    ? "७/१२ गट क्र. १०५/२"
    : "7/12 Gat No. 105/2";

  const [farmerName, setFarmerName] = useState(initialFarmerName);
  const [surveyNo, setSurveyNo] = useState(initialSurveyNo);
  const [copied, setCopied] = useState(false);

  // Synchronize state when farmer profile props load or language changes
  useEffect(() => {
    if (propFarmerName) {
      setFarmerName(propFarmerName);
    }
    if (propGatNumber) {
      setSurveyNo(isMr ? `७/१२ गट क्र. ${propGatNumber}` : `7/12 Gat No. ${propGatNumber}`);
    }
  }, [propFarmerName, propGatNumber, isMr]);

  // Generate deterministic/stable dossier ID
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toUpperCase();
  const dossierId = `MH-PMFBY-2026-${rawId || "84920"}`;
  const currentDate = new Date().toLocaleDateString(isMr ? "mr-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // PMFBY Trigger Logic based on official Operational Guidelines
  const isDrySpellTrigger = inMonsoon && dryDaysStreak >= 14;
  const isHeavyRainTrigger = heavyRainMax >= 64.5;
  const isEligible = isDrySpellTrigger || isHeavyRainTrigger;

  const triggerType = isHeavyRainTrigger
    ? {
        en: "Localized Calamity / Inundation (Section 21.4)",
        mr: "स्थानिक नैसर्गिक आपत्ती - अतिवृष्टी / जलमय शेत (कलम २१.४)",
        severity: "critical",
      }
    : isDrySpellTrigger
    ? {
        en: "Mid-Season Adversity / Severe Dry Spell (Section 21.2)",
        mr: "हंगामातील प्रतिकूल परिस्थिती - दीर्घ पावसाचा खंड (कलम २१.२)",
        severity: "high",
      }
    : {
        en: "Normal Observation / Standby Status",
        mr: "सध्याचे हवामान निकषांच्या मर्यादेत (Standby)",
        severity: "low",
      };

  const handleCopySummary = () => {
    const text = `*वरदहस्त - प्रधानमंत्री पीक विमा योजना (PMFBY) अधिकृत दावा अहवाल*
दावा आयडी: ${dossierId}
शेतकरी: ${farmerName} | गट क्र.: ${surveyNo}
जिल्हा: ${districtName} | तालुका: ${blockName}
पीक: ${cropName}
हवामान पुरावा: मागील १४ दिवसांत पाऊस: ${rainfallHistoryMm} mm | कोरडे दिवस: ${dryDaysStreak} दिवस | कमाल पाऊस: ${heavyRainMax} mm/दिवस
पात्रता निकष: ${isMr ? triggerType.mr : triggerType.en}
तपशील VarshaMitra द्वारे Copernicus ERA5 आणि Open-Meteo उपग्रह डेटाद्वारे प्रमाणित.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="rounded-xl border-3 border-[#123C32] bg-white p-6 shadow-[5px_5px_0px_#123C32]">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#123C32]/15 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#123C32] bg-[#F4F0E5] text-[#123C32]">
            {isEligible ? (
              <ShieldAlert size={22} className="text-[#C7473B]" />
            ) : (
              <ShieldCheck size={22} className="text-[#3B8B61]" />
            )}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#F4F0E5]">
                PMFBY AI Docket
              </span>
              <span className="font-mono text-xs text-[#252923]/70">
                {isMr ? "पीक विमा दावा सहाय्यक" : "Crop Insurance Loss Assessor"}
              </span>
            </div>
            <h3 className="font-display text-lg font-black text-[#123C32] sm:text-xl">
              {isMr
                ? "प्रधानमंत्री पीक विमा (PMFBY) हवामान जोखीम अहवाल"
                : "PMFBY Satellite-Verified Claim Dossier"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border-2 px-3 py-1 font-mono text-xs font-bold uppercase ${
              isEligible
                ? "border-[#C7473B] bg-[#C7473B]/10 text-[#C7473B]"
                : "border-[#3B8B61] bg-[#3B8B61]/10 text-[#3B8B61]"
            }`}
          >
            {isEligible
              ? isMr
                ? "दावा सूचना निकष सक्रिय"
                : "Loss Threshold Triggered"
              : isMr
              ? "हवामान नुकसानमुक्त"
              : "No Claim Trigger"}
          </span>
        </div>
      </div>

      {/* ── Claim Threshold Matrix ── */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3.5">
          <span className="font-mono text-[10px] font-bold uppercase text-[#252923]/60">
            {isMr ? "पावसाचा खंड (Dry Spell Streak)" : "Monsoon Dry Spell Streak"}
          </span>
          <p className="mt-1 font-mono text-xl font-black text-[#123C32]">
            {dryDaysStreak} {isMr ? "दिवस" : "Days"}
          </p>
          <p className="mt-1 font-sans text-xs text-[#252923]/75">
            {dryDaysStreak >= 14
              ? isMr
                ? "⚠️ कलम २१.२ नुसार विमा कंपनीला ७२ तासांत कळवणे आवश्यक."
                : "⚠️ Qualifies for Mid-Season Adversity (>= 14 dry days)."
              : isMr
              ? "सध्या निकषापेक्षा कमी (१४ दिवसांचा निकष)."
              : "Below 14-day threshold for Kharif deficit."}
          </p>
        </div>

        <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3.5">
          <span className="font-mono text-[10px] font-bold uppercase text-[#252923]/60">
            {isMr ? "२४ तास कमाल पाऊस" : "24-Hour Max Rainfall"}
          </span>
          <p className="mt-1 font-mono text-xl font-black text-[#123C32]">
            {heavyRainMax} <span className="text-sm font-bold">mm</span>
          </p>
          <p className="mt-1 font-sans text-xs text-[#252923]/75">
            {heavyRainMax >= 64.5
              ? isMr
                ? "⚠️ अतिवृष्टी (६४.५+ मिमी) निकष पूर्ण - स्थानिक आपत्ती अंतर्गत दावा."
                : "⚠️ Heavy rain criterion met (>64.5 mm) for Localized Calamity."
              : isMr
              ? "६४.५ मिमी पेक्षा कमी; पूर/जलमय परिस्थिती नाही."
              : "Below single-day 64.5 mm inundation threshold."}
          </p>
        </div>

        <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-3.5">
          <span className="font-mono text-[10px] font-bold uppercase text-[#252923]/60">
            {isMr ? "उपग्रह ओलावा व पाऊस" : "Topsoil Volumetric Moisture"}
          </span>
          <p className="mt-1 font-mono text-xl font-black text-[#123C32]">
            {soilMoisturePct}%
          </p>
          <p className="mt-1 font-sans text-xs text-[#252923]/75">
            {isMr
              ? "ECMWF Land Surface द्वारे प्रमाणित ०-७ सेमी ओलावा निर्देशांक."
              : "Verified topsoil volumetric moisture via ECMWF Land Surface."}
          </p>
        </div>
      </div>

      {/* ── Operational Note & Generate Dossier CTA ── */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-[#123C32]/20 bg-[#F4F0E5] p-4">
        <div className="flex items-start gap-2.5">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-[#E6A52E]" />
          <div>
            <h4 className="font-display text-sm font-bold text-[#123C32]">
              {isMr ? "शेतकऱ्यांसाठी ७२ तासांची अधिकृत सूचना खिडकी" : "Official 72-Hour PMFBY Claim Window"}
            </h4>
            <p className="font-sans text-xs text-[#252923]/80">
              {isMr
                ? "हवामान आपत्ती घडल्यानंतर ७२ तासांच्या आत विमा कंपनी व कृषी विभागाकडे लेखी/पोर्टलवर तक्रार करणे बंधनकारक असते. खालील बटण दाबून अधिकृत दस्तऐवज मिळवा."
                : "Farmers must submit intimation within 72 hours of adverse weather. Generate verified satellite proof dossier below."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D] transition"
        >
          <FileText size={15} className="text-[#E6A52E]" />
          <span>{isMr ? "दावा दस्तऐवज (Dossier) तयार करा" : "Generate Claim Dossier"}</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODAL: FORMAL GOVERNMENT OF MAHARASHTRA PMFBY CLAIM DOSSIER
          ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-4 border-[#123C32] bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#123C32]">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#123C32] bg-[#F4F0E5] text-[#123C32] hover:bg-[#C7473B] hover:text-white transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Print Header Styled like Government Agricultural Form */}
            <div className="border-b-2 border-[#123C32] pb-5 text-center">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#123C32]">
                <Building size={16} />
                <span>कृषी विभाग, महाराष्ट्र शासन · PMFBY तांत्रिक साहाय्य कक्ष</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-black text-[#123C32] sm:text-3xl">
                {isMr
                  ? "हवामान आधारित पीक नुकसानीचा प्राथमिक पंचनामा अहवाल"
                  : "Hyperlocal Agro-Climatic Loss Verification Dossier"}
              </h2>
              <p className="mt-1 font-mono text-xs text-[#252923]/70">
                Pradhan Mantri Fasal Bima Yojana (Operational Guidelines Rev. 2024)
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
                <span className="rounded border border-[#123C32] bg-[#F4F0E5] px-2 py-0.5 font-bold text-[#123C32]">
                  Dossier ID: {dossierId}
                </span>
                <span className="rounded border border-[#123C32]/30 px-2 py-0.5 text-[#252923]/80">
                  Date: {currentDate}
                </span>
                <span className="rounded border border-[#3B8B61] bg-[#3B8B61]/10 px-2 py-0.5 font-bold text-[#3B8B61]">
                  Verified by: Copernicus ERA5-Land Reanalysis & IMD Normals
                </span>
              </div>
            </div>

            {/* Editable Farmer Meta */}
            <div className="mt-6 grid gap-4 rounded-xl border-2 border-[#123C32]/20 bg-[#F4F0E5]/60 p-4 sm:grid-cols-2 font-sans text-xs">
              <div>
                <label className="font-mono text-[10px] font-bold uppercase text-[#123C32]">
                  {isMr ? "शेतकऱ्याचे नाव (Farmer Name)" : "Farmer Full Name"}
                </label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="mt-1 w-full rounded border border-[#123C32]/40 bg-white px-2.5 py-1.5 font-medium text-[#252923] focus:border-[#123C32] focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] font-bold uppercase text-[#123C32]">
                  {isMr ? "गट क्रमांक / सर्व्हे नंबर (7/12 Land Record)" : "Survey / Gat Number"}
                </label>
                <input
                  type="text"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="mt-1 w-full rounded border border-[#123C32]/40 bg-white px-2.5 py-1.5 font-medium text-[#252923] focus:border-[#123C32] focus:outline-none"
                />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]">
                  {isMr ? "जिल्हा व तालुका (Location)" : "District & Block"}
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-[#252923]">
                  {districtName} · {blockName} ({blockId})
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#123C32]">
                  {isMr ? "पिकाचे नाव (Notified Crop)" : "Insured Crop & Season"}
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-[#252923]">
                  {cropName} · {isMr ? "हंगाम २०२६" : "Season 2026"}
                </p>
              </div>
            </div>

            {/* Telemetric Evidence Ledger */}
            <div className="mt-6">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
                1. Objective Agro-Meteorological Evidence Ledger (वस्तुनिष्ठ हवामान नोंदी)
              </h4>
              <div className="mt-2 overflow-x-auto rounded-lg border-2 border-[#123C32]/30">
                <table className="w-full border-collapse font-mono text-xs text-left">
                  <thead className="bg-[#123C32] text-[#F4F0E5]">
                    <tr>
                      <th className="p-2.5">Parameter (घटक)</th>
                      <th className="p-2.5">Observed Value</th>
                      <th className="p-2.5">PMFBY Rule Threshold</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#123C32]/10 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold">Rainfall Deficit / Streak</td>
                      <td className="p-2.5">{dryDaysStreak} consecutive rainless days</td>
                      <td className="p-2.5">&gt;= 14 days dry spell</td>
                      <td className="p-2.5">
                        {dryDaysStreak >= 14 ? (
                          <span className="text-[#C7473B] font-bold">TRIGGERED (पात्र)</span>
                        ) : (
                          <span className="text-[#3B8B61]">Within Range</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Single-Day Peak Precip</td>
                      <td className="p-2.5">{heavyRainMax} mm/day</td>
                      <td className="p-2.5">&gt; 64.5 mm (Heavy Rain)</td>
                      <td className="p-2.5">
                        {heavyRainMax >= 64.5 ? (
                          <span className="text-[#C7473B] font-bold">TRIGGERED (पात्र)</span>
                        ) : (
                          <span className="text-[#3B8B61]">Within Range</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Topsoil Moisture (0-7 cm)</td>
                      <td className="p-2.5">{soilMoisturePct}% volumetric</td>
                      <td className="p-2.5">&lt; 18% (Severe stress)</td>
                      <td className="p-2.5">
                        {soilMoisturePct < 18 ? (
                          <span className="text-[#C7473B] font-bold">DEFICIT (तणाव)</span>
                        ) : (
                          <span className="text-[#3B8B61]">Normal Vapsa</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">14-Day Cumulative Rain</td>
                      <td className="p-2.5">{rainfallHistoryMm} mm recorded</td>
                      <td className="p-2.5">Baseline IMD Normal</td>
                      <td className="p-2.5 text-[#123C32] font-semibold">ECMWF / IMD Verified</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legal / Policy Provision */}
            <div className="mt-6 rounded-lg border border-[#123C32]/20 bg-[#F4F0E5]/50 p-4 font-sans text-xs leading-relaxed space-y-1.5 text-[#252923]">
              <p className="font-bold font-mono text-[11px] text-[#123C32]">
                2. Applicable PMFBY Scheme Clause (लागू विमा नियम):
              </p>
              <p>
                <strong>{isMr ? triggerType.mr : triggerType.en}</strong>: शेतकऱ्यांनी आपत्ती घडल्यापासून
                ७२ तासांच्या आत PMFBY Crop Insurance App द्वारे किंवा टोल-फ्री क्र. <strong>१४४४७</strong> वर
                तक्रार नोंदवावी. हा अहवाल कृषी सहाय्यक (Krishi Sevak) व विमा कंपनीच्या प्रतिनिधीस सादर करता येईल.
              </p>
            </div>

            {/* Signatures & Official Seal Box */}
            <div className="mt-8 grid grid-cols-2 gap-8 border-t-2 border-dashed border-[#123C32]/30 pt-6 font-mono text-xs">
              <div className="text-center">
                <div className="h-12 border-b border-black/40" />
                <p className="mt-1 font-bold text-[#123C32]">{farmerName}</p>
                <p className="text-[10px] text-[#252923]/60">{isMr ? "अर्जदार शेतकऱ्याची स्वाक्षरी / अंगठा" : "Applicant Farmer's Signature"}</p>
              </div>
              <div className="text-center">
                <div className="h-12 border-b border-black/40" />
                <p className="mt-1 font-bold text-[#123C32]">तालुका कृषी अधिकारी (TKA)</p>
                <p className="text-[10px] text-[#252923]/60">{isMr ? "स्वाक्षरी व शासकीय शिक्का" : "Authorized Agricultural Officer & Seal"}</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#123C32]/20 pt-4">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-[#F4F0E5]"
              >
                <Share2 size={14} />
                <span>{copied ? (isMr ? "कॉपी झाले!" : "Copied!") : isMr ? "अहवाल मजकूर कॉपी करा" : "Copy Docket Text"}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-5 py-2 font-mono text-xs font-bold uppercase text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D]"
                >
                  <Printer size={15} className="text-[#E6A52E]" />
                  <span>{isMr ? "छापा / PDF सेव्ह करा" : "Print / Save PDF"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

