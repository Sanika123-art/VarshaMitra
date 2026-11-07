"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  MapPin,
  Phone,
  User,
  FileText,
  Sparkles,
  Check,
  Edit3,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState, type FarmerProfile } from "@/hooks/useAppState";
import type { SelectedLocation } from "@/types";
import {
  MAHARASHTRA_LOCATIONS,
  type DistrictOption,
  type TalukaOption,
  type CityOption,
} from "@/data/maharashtraAdministrativeHierarchy";
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/SearchableCombobox";

const CROPS_LIST = [
  { id: "soybean", nameEn: "Soybean", nameMr: "सोयाबीन" },
  { id: "cotton", nameEn: "Cotton", nameMr: "कापूस" },
  { id: "pigeonpea", nameEn: "Pigeonpea (Tur)", nameMr: "तूर" },
  { id: "pearl_millet", nameEn: "Pearl Millet (Bajra)", nameMr: "बाजरी" },
  { id: "sorghum", nameEn: "Sorghum (Jowar)", nameMr: "ज्वारी" },
  { id: "rice", nameEn: "Paddy (Rice)", nameMr: "भात / धान" },
  { id: "wheat", nameEn: "Wheat", nameMr: "गहू" },
  { id: "maize", nameEn: "Maize", nameMr: "मका" },
  { id: "sugarcane", nameEn: "Sugarcane", nameMr: "ऊस" },
  { id: "onion", nameEn: "Onion", nameMr: "कांदा" },
];

export default function FarmerRegistrationForm({
  initialMobile = "",
  onSwitchToLogin,
}: {
  initialMobile?: string;
  onSwitchToLogin?: () => void;
}) {
  const { language } = useTranslation();
  const isMr = language === "mr";
  const router = useRouter();
  const { registerFarmer } = useAppState();

  const [farmerName, setFarmerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [mpin, setMpin] = useState("1234");
  const [gatNumber, setGatNumber] = useState("");
  const [landAcres, setLandAcres] = useState("2.5");

  // 3-Tier Cascading Administrative State
  // Level 1: District (e.g. Nashik, Thane, Pune...)
  const [selectedDistrictId, setSelectedDistrictId] = useState("nashik");
  // Level 2: Taluka (e.g. Igatpuri, Niphad, Shahapur...)
  const [selectedTalukaId, setSelectedTalukaId] = useState("igatpuri");
  // Level 3: City / Town / Village (e.g. Igatpuri Town, Ghoti...)
  const [selectedCityId, setSelectedCityId] = useState("igatpuri_town");
  // Custom village override if farmer chooses "other"
  const [customVillage, setCustomVillage] = useState("");

  const [selectedCrop, setSelectedCrop] = useState("soybean");
  const [irrigationType, setIrrigationType] = useState<"rainfed" | "irrigated">("rainfed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Current selected District object
  const currentDistrict = useMemo(() => {
    return (
      MAHARASHTRA_LOCATIONS.find((d) => d.id === selectedDistrictId) ||
      MAHARASHTRA_LOCATIONS[0]
    );
  }, [selectedDistrictId]);

  // 2. Talukas available under the selected District ONLY
  const availableTalukas = useMemo(() => {
    return currentDistrict.talukas;
  }, [currentDistrict]);

  // 3. Current selected Taluka object
  const currentTaluka = useMemo(() => {
    return (
      availableTalukas.find((t) => t.id === selectedTalukaId) ||
      availableTalukas[0]
    );
  }, [availableTalukas, selectedTalukaId]);

  // 4. Cities / Towns / Villages available under the selected Taluka ONLY
  const availableCities = useMemo(() => {
    return currentTaluka.cities;
  }, [currentTaluka]);

  // 5. Current selected City / Village object
  const currentCity = useMemo(() => {
    if (selectedCityId === "custom_village") {
      return {
        id: "custom_village",
        nameEn: customVillage.trim() || currentTaluka.nameEn,
        nameMr: customVillage.trim() || currentTaluka.nameMr,
        lat: currentTaluka.lat,
        lng: currentTaluka.lng,
      };
    }
    return (
      availableCities.find((c) => c.id === selectedCityId) ||
      availableCities[0]
    );
  }, [availableCities, selectedCityId, customVillage, currentTaluka]);

  // Searchable Combobox Options (Clean Main Names Only)
  const districtOptions: ComboboxOption[] = useMemo(() => {
    return MAHARASHTRA_LOCATIONS.map((d) => ({
      value: d.id,
      label: d.nameEn,
      labelMr: d.nameMr,
    }));
  }, []);

  const talukaOptions: ComboboxOption[] = useMemo(() => {
    return availableTalukas.map((t) => ({
      value: t.id,
      label: t.nameEn,
      labelMr: t.nameMr,
    }));
  }, [availableTalukas]);

  const cityOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = availableCities.map((c) => ({
      value: c.id,
      label: c.nameEn,
      labelMr: c.nameMr,
      icon: <span className="text-[#3B8B61]">📍</span>,
    }));
    list.push({
      value: "custom_village",
      label: "Other Village / Wadi (Custom)",
      labelMr: "इतर गाव / वाडी (स्वतः नाव लिहा)",
      icon: <span>✏️</span>,
    });
    return list;
  }, [availableCities]);

  const cropOptions: ComboboxOption[] = useMemo(() => {
    return CROPS_LIST.map((c) => ({
      value: c.id,
      label: c.nameEn,
      labelMr: c.nameMr,
      icon: <span>🌱</span>,
    }));
  }, []);

  // Handle District Change: cascades to first taluka and first city under that taluka
  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    const dist = MAHARASHTRA_LOCATIONS.find((d) => d.id === distId);
    if (dist && dist.talukas.length > 0) {
      const firstTaluka = dist.talukas[0];
      setSelectedTalukaId(firstTaluka.id);
      if (firstTaluka.cities.length > 0) {
        setSelectedCityId(firstTaluka.cities[0].id);
      }
    }
    setCustomVillage("");
  };

  // Handle Taluka Change: cascades to first city under that taluka
  const handleTalukaChange = (talukaId: string) => {
    setSelectedTalukaId(talukaId);
    const taluka = availableTalukas.find((t) => t.id === talukaId);
    if (taluka && taluka.cities.length > 0) {
      setSelectedCityId(taluka.cities[0].id);
    }
    setCustomVillage("");
  };

  // Handle City Change
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim()) {
      setErrorMsg(isMr ? "कृपया शेतकऱ्याचे नाव प्रविष्ट करा." : "Please enter farmer name.");
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, "").length < 10) {
      setErrorMsg(isMr ? "कृपया वैध १० अंकी मोबाईल नंबर टाका." : "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const resolvedVillageEn = selectedCityId === "custom_village" && customVillage.trim()
      ? customVillage.trim()
      : currentCity.nameEn;
    const resolvedVillageMr = selectedCityId === "custom_village" && customVillage.trim()
      ? customVillage.trim()
      : currentCity.nameMr;

    // Prepare farmer profile with complete 3-tier names
    const farmerProfile: FarmerProfile = {
      farmerName: farmerName.trim(),
      mobileNumber: mobileNumber.trim(),
      mpin: mpin.trim() || "1234",
      gatNumber: gatNumber.trim() ? gatNumber.trim() : undefined,
      landAcres: parseFloat(landAcres) || 2.5,
      irrigationType,
      villageName: resolvedVillageEn,
      villageNameMr: resolvedVillageMr,
      talukaName: currentTaluka.nameEn,
      talukaNameMr: currentTaluka.nameMr,
      districtName: currentDistrict.nameEn,
      districtNameMr: currentDistrict.nameMr,
    };

    // Prepare Location Object so climate APIs, soil APIs, and weather maps resolve cleanly
    const farmerLocation: SelectedLocation = {
      stateId: "mh",
      stateName: "Maharashtra",
      districtId: currentDistrict.id,
      districtName: currentDistrict.nameEn,
      districtNameMr: currentDistrict.nameMr,
      blockId: currentTaluka.id, // Primary block/taluka ID for weather & climate backend
      blockName: currentTaluka.nameEn,
      blockNameMr: currentTaluka.nameMr,
      taluka: currentTaluka.nameEn,
      displayName: `${resolvedVillageEn}, ${currentTaluka.nameEn}`,
      latitude: currentCity.lat || currentTaluka.lat,
      longitude: currentCity.lng || currentTaluka.lng,
    };

    setTimeout(() => {
      registerFarmer(farmerProfile, farmerLocation, selectedCrop, "sowing");
      router.push("/farmer/dashboard");
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="rounded-lg border-2 border-[#123C32]/20 bg-[#123C32]/5 p-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#E6A52E]" />
          <h3 className="font-display text-sm font-bold text-[#123C32]">
            {isMr ? "नवीन शेतकरी नोंदणी अर्ज (३-स्तरीय प्रशासकीय रचना)" : "New Farmer Hyperlocal Registration"}
          </h3>
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#252923]/70">
          {isMr
            ? "महाराष्ट्रातील सर्व जिल्हे, त्यांचे सर्व अधिकृत तालुके आणि गावे/शहरे उपलब्ध आहेत."
            : "All Maharashtra districts with their complete official Talukas and towns/villages."}
        </p>
      </div>

      {errorMsg && (
        <div className="rounded border-2 border-[#C7473B] bg-white p-2.5 font-mono text-xs text-[#C7473B]">
          {errorMsg}
        </div>
      )}

      {/* Row 1: Name & Mobile */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
            {isMr ? "शेतकऱ्याचे नाव *" : "Farmer Full Name *"}
          </label>
          <div className="relative mt-1">
            <User size={13} className="absolute left-2.5 top-2.5 text-[#123C32]/60" />
            <input
              type="text"
              required
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              placeholder={isMr ? "उदा. सागर तळपदे" : "e.g. Sagar Talpade"}
              className="w-full rounded border-2 border-[#123C32]/30 bg-white py-2 pl-8 pr-2.5 font-medium text-[#252923] outline-none focus:border-[#123C32]"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
            {isMr ? "मोबाईल नंबर (SMS अलर्टसाठी) *" : "Mobile (For SMS Alerts) *"}
          </label>
          <div className="relative mt-1">
            <Phone size={13} className="absolute left-2.5 top-2.5 text-[#123C32]/60" />
            <input
              type="tel"
              required
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="98XXXXXXXX"
              className="w-full rounded border-2 border-[#123C32]/30 bg-white py-2 pl-8 pr-2.5 font-mono text-xs font-medium text-[#252923] outline-none focus:border-[#123C32]"
            />
          </div>
        </div>
      </div>

      {/* ── 3-Tier Cascading Location Selection Box ── */}
      <div className="rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/60 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32] flex items-center gap-1.5">
            <MapPin size={12} className="text-[#3B8B61]" />
            {isMr ? "प्रशासकीय स्थान निश्चिती (३-स्तरीय निवड)" : "Administrative Location (3-Tier Selector)"}
          </span>
          <span className="rounded bg-[#123C32]/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#123C32]">
            {isMr ? "अचूक जिओफेन्सिंग" : "Hyperlocal Geofence"}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          
          {/* Dropdown 1: District (जिल्हा) - Searchable / Typeahead */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
              {isMr ? "१. जिल्हा निवडा *" : "1. Select District *"}
            </label>
            <div className="mt-1">
              <SearchableCombobox
                options={districtOptions}
                value={selectedDistrictId}
                onChange={handleDistrictChange}
                placeholder={isMr ? "जिल्हा निवडा किंवा शोधा..." : "Select or search district..."}
                searchPlaceholder={isMr ? "जिल्ह्याचे नाव टाईप करा..." : "Type district name..."}
                isMarathi={isMr}
              />
            </div>
          </div>

          {/* Dropdown 2: Taluka (तालुका) - Searchable / Typeahead */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
              {isMr ? "२. तालुका निवडा *" : "2. Select Taluka *"}
            </label>
            <div className="mt-1">
              <SearchableCombobox
                options={talukaOptions}
                value={selectedTalukaId}
                onChange={handleTalukaChange}
                placeholder={isMr ? "तालुका निवडा किंवा शोधा..." : "Select or search taluka..."}
                searchPlaceholder={isMr ? "तालुक्याचे नाव टाईप करा..." : "Type taluka name..."}
                isMarathi={isMr}
              />
            </div>
          </div>

          {/* Dropdown 3: City / Village (शहर / गाव) - Searchable / Typeahead */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
              {isMr ? "३. शहर / गाव निवडा *" : "3. Select City / Village *"}
            </label>
            <div className="mt-1">
              <SearchableCombobox
                options={cityOptions}
                value={selectedCityId}
                onChange={handleCityChange}
                placeholder={isMr ? "गाव/शहर निवडा किंवा शोधा..." : "Select or search village..."}
                searchPlaceholder={isMr ? "गावाचे नाव टाईप करा..." : "Type village name..."}
                isMarathi={isMr}
              />
            </div>
          </div>

        </div>

        {/* Custom village name input field if "custom_village" is selected */}
        {selectedCityId === "custom_village" && (
          <div className="rounded border border-[#3B8B61] bg-white p-2 animate-in fade-in">
            <label className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#123C32] flex items-center gap-1">
              <Edit3 size={11} className="text-[#3B8B61]" />
              {isMr ? "आपल्या गावाचे / वाडीचे नाव येथे लिहा *" : "Enter your Village / Hamlet name *"}
            </label>
            <input
              type="text"
              required
              value={customVillage}
              onChange={(e) => setCustomVillage(e.target.value)}
              placeholder={isMr ? "उदा. बोरगाव, पाडे,वाडी..." : "e.g. Borgaon, Wadi..."}
              className="mt-1 w-full rounded border border-[#123C32]/30 px-2 py-1.5 font-sans text-xs font-semibold text-[#123C32] outline-none focus:border-[#3B8B61]"
            />
          </div>
        )}

        {/* Live Confirmation Breadcrumb */}
        <div className="flex items-center gap-1.5 rounded border border-[#123C32]/20 bg-white px-2.5 py-1.5 font-mono text-[10px] text-[#123C32]">
          <Check size={12} className="text-[#3B8B61] shrink-0" />
          <span className="font-bold">{isMr ? "स्थान निश्चिती:" : "Confirmed:"}</span>
          <span className="font-semibold text-[#252923]">
            {isMr
              ? `${currentDistrict.nameMr} जिल्हा ➔ ${currentTaluka.nameMr} तालुका ➔ ${
                  selectedCityId === "custom_village" && customVillage.trim()
                    ? customVillage.trim()
                    : currentCity.nameMr
                } गाव/शहर`
              : `${currentDistrict.nameEn} District ➔ ${currentTaluka.nameEn} Taluka ➔ ${
                  selectedCityId === "custom_village" && customVillage.trim()
                    ? customVillage.trim()
                    : currentCity.nameEn
                }`}
          </span>
        </div>

      </div>

      {/* Row 3: Land 7/12 & Holding */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
              {isMr ? "७/१२ गट क्र. / सर्व्हे नंबर" : "7/12 Gat No. / Survey No."}
            </label>
            <span className="font-mono text-[9px] text-[#252923]/60">
              {isMr ? "(पर्यायी - Optional)" : "(Optional)"}
            </span>
          </div>
          <div className="relative mt-1">
            <FileText size={13} className="absolute left-2.5 top-2.5 text-[#123C32]/60" />
            <input
              type="text"
              value={gatNumber}
              onChange={(e) => setGatNumber(e.target.value)}
              placeholder={isMr ? "आठवत नसेल तर रिकामे ठेवा (उदा. ४२/ब)" : "Leave blank if unknown (e.g. 42/B)"}
              className="w-full rounded border-2 border-[#123C32]/30 bg-white py-2 pl-8 pr-2.5 font-medium text-[#252923] outline-none focus:border-[#123C32]"
            />
          </div>
          <p className="mt-0.5 font-mono text-[9px] text-[#252923]/60">
            {isMr ? "आठवत नसल्यास बंधनकारक नाही." : "Not mandatory if you don't remember."}
          </p>
        </div>

        <div>
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
            {isMr ? "एकूण जमीन (एकर)" : "Land Holding (Acres)"}
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="100"
            value={landAcres}
            onChange={(e) => setLandAcres(e.target.value)}
            className="mt-1 w-full rounded border-2 border-[#123C32]/30 bg-white px-2.5 py-2 font-mono text-xs font-medium text-[#252923] outline-none focus:border-[#123C32]"
          />
        </div>
      </div>

      {/* Row 4: Primary Crop & Irrigation Mode */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
            {isMr ? "मुख्य पीक निवडा (Primary Crop) *" : "Primary Crop *"}
          </label>
          <div className="mt-1">
            <SearchableCombobox
              options={cropOptions}
              value={selectedCrop}
              onChange={setSelectedCrop}
              placeholder={isMr ? "पीक निवडा किंवा शोधा..." : "Select or search crop..."}
              searchPlaceholder={isMr ? "पिकाचे नाव टाईप करा (उदा. सोयाबीन, कापूस, ऊस)..." : "Type crop name (e.g. Soybean, Cotton, Sugarcane)..."}
              isMarathi={isMr}
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
            {isMr ? "पाण्याचा प्रकार (Farming Mode)" : "Irrigation Type"}
          </label>
          <div className="mt-1 grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setIrrigationType("rainfed")}
              className={`rounded border-2 py-1.5 font-bold transition ${
                irrigationType === "rainfed"
                  ? "border-[#123C32] bg-[#123C32] text-white"
                  : "border-[#123C32]/20 bg-white text-[#252923]"
              }`}
            >
              {isMr ? "जिरायती (Rainfed)" : "Rainfed"}
            </button>
            <button
              type="button"
              onClick={() => setIrrigationType("irrigated")}
              className={`rounded border-2 py-1.5 font-bold transition ${
                irrigationType === "irrigated"
                  ? "border-[#123C32] bg-[#123C32] text-white"
                  : "border-[#123C32]/20 bg-white text-[#252923]"
              }`}
            >
              {isMr ? "बागायती (Irrigated)" : "Irrigated"}
            </button>
          </div>
        </div>
      </div>

      {/* Row: 4-digit Security PIN / MPIN (Optional for quick login) */}
      <div className="rounded-lg border border-[#123C32]/20 bg-[#123C32]/5 p-2.5">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#123C32]">
            {isMr ? "४-अंकी सुरक्षा पिन (MPIN) - पर्यायी" : "4-Digit Security PIN (MPIN) - Optional"}
          </label>
          <span className="font-mono text-[9px] text-[#252923]/60">
            {isMr ? "पुढील वेळी जलद लॉगिनसाठी" : "For fast repeat login"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="password"
            maxLength={4}
            value={mpin}
            onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
            placeholder="1234"
            className="w-24 rounded border-2 border-[#123C32]/30 bg-white py-1.5 text-center font-mono text-sm font-bold tracking-widest text-[#123C32] outline-none focus:border-[#123C32]"
          />
          <span className="text-[10px] text-[#252923]/70">
            {isMr
              ? "डिफॉल्ट पिन: 1234 (तुम्ही तुमच्या आवडीचा ४-अंकी पिन ठेवू शकता)"
              : "Default PIN: 1234 (You can set your own 4 digits)"}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] transition hover:bg-[#172B4D] disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>{isMr ? "नोंदणी होत आहे..." : "Registering..."}</span>
          ) : (
            <>
              <CheckCircle2 size={15} className="text-[#E6A52E]" />
              <span>{isMr ? "नोंदणी पूर्ण करा व डॅशबोर्ड उघडा" : "Complete Registration & Open Dashboard"}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {onSwitchToLogin && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-sans text-xs font-semibold text-[#123C32] hover:underline"
            >
              {isMr
                ? "आधीच नोंदणी केली आहे का? मोबाईल नंबरने लॉगिन करा →"
                : "Already registered? Login with Mobile Number →"}
            </button>
          </div>
        )}
      </div>

    </form>
  );
}
