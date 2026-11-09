"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Phone, Sprout, User } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState, type FarmerProfile } from "@/hooks/useAppState";
import type { SelectedLocation } from "@/types";
import { MAHARASHTRA_LOCATIONS } from "@/data/maharashtraAdministrativeHierarchy";

const CROPS = [
  { id: "soybean", en: "Soybean", mr: "सोयाबीन" },
  { id: "cotton", en: "Cotton", mr: "कापूस" },
  { id: "pigeonpea", en: "Pigeonpea (Tur)", mr: "तूर" },
  { id: "rice", en: "Paddy (Rice)", mr: "भात" },
  { id: "wheat", en: "Wheat", mr: "गहू" },
  { id: "maize", en: "Maize", mr: "मका" },
  { id: "sugarcane", en: "Sugarcane", mr: "ऊस" },
  { id: "onion", en: "Onion", mr: "कांदा" },
];

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

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
  const { registerFarmer, location } = useAppState();

  const initialDistrict = MAHARASHTRA_LOCATIONS.find(
    (district) => normalize(district.id) === normalize(location.districtId)
      || normalize(district.nameEn) === normalize(location.districtName)
  ) || MAHARASHTRA_LOCATIONS[0];
  const initialTaluka = initialDistrict.talukas.find(
    (taluka) => normalize(taluka.id) === normalize(location.blockId)
      || normalize(taluka.nameEn) === normalize(location.blockName)
  ) || initialDistrict.talukas[0];
  const initialVillageName = normalize(location.displayName || "");
  const initialCity = initialTaluka.cities.find(
    (city) => initialVillageName.includes(normalize(city.nameEn))
  ) || initialTaluka.cities[0];

  const [farmerName, setFarmerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [selectedDistrictId, setSelectedDistrictId] = useState(initialDistrict.id);
  const [selectedTalukaId, setSelectedTalukaId] = useState(initialTaluka.id);
  const [selectedCityId, setSelectedCityId] = useState(initialCity.id);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [error, setError] = useState<string | null>(null);

  const district = useMemo(
    () => MAHARASHTRA_LOCATIONS.find((item) => item.id === selectedDistrictId) || MAHARASHTRA_LOCATIONS[0],
    [selectedDistrictId]
  );
  const taluka = district.talukas.find((item) => item.id === selectedTalukaId) || district.talukas[0];
  const city = taluka.cities.find((item) => item.id === selectedCityId) || taluka.cities[0];

  function changeDistrict(id: string) {
    const nextDistrict = MAHARASHTRA_LOCATIONS.find((item) => item.id === id);
    if (!nextDistrict) return;
    setSelectedDistrictId(id);
    setSelectedTalukaId(nextDistrict.talukas[0].id);
    setSelectedCityId(nextDistrict.talukas[0].cities[0].id);
  }

  function changeTaluka(id: string) {
    const nextTaluka = district.talukas.find((item) => item.id === id);
    if (!nextTaluka) return;
    setSelectedTalukaId(id);
    setSelectedCityId(nextTaluka.cities[0].id);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (!farmerName.trim()) {
      setError(isMr ? "कृपया तुमचे नाव लिहा." : "Please enter your name.");
      return;
    }
    if (cleanMobile.length !== 10) {
      setError(isMr ? "मोबाईल नंबरचे १० अंक लिहा." : "Enter all 10 digits of your mobile number.");
      return;
    }
    if (!selectedCrop) {
      setError(isMr ? "कृपया तुमचे मुख्य पीक निवडा." : "Please select your main crop.");
      return;
    }

    setError(null);
    const profile: FarmerProfile = {
      farmerName: farmerName.trim(),
      mobileNumber: cleanMobile,
      villageName: city.nameEn,
      villageNameMr: city.nameMr,
      talukaName: taluka.nameEn,
      talukaNameMr: taluka.nameMr,
      districtName: district.nameEn,
      districtNameMr: district.nameMr,
    };
    const farmerLocation: SelectedLocation = {
      stateId: "mh",
      stateName: "Maharashtra",
      districtId: district.id,
      districtName: district.nameEn,
      districtNameMr: district.nameMr,
      blockId: taluka.id,
      blockName: taluka.nameEn,
      blockNameMr: taluka.nameMr,
      taluka: taluka.nameEn,
      displayName: `${city.nameEn}, ${taluka.nameEn}`,
      latitude: city.lat || taluka.lat,
      longitude: city.lng || taluka.lng,
    };
    registerFarmer(profile, farmerLocation, selectedCrop, "sowing");
    router.push("/farmer/dashboard");
  }

  const labelClass = "mb-1 block text-sm font-bold text-[#123C32]";
  const controlClass = "w-full rounded-lg border-2 border-[#123C32]/25 bg-white px-3 py-3 text-base text-[#252923] outline-none focus:border-[#123C32]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-[#123C32]/5 p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#123C32]">
          <Sprout size={19} aria-hidden />
          {isMr ? "नवीन शेतकरी नोंदणी" : "Farmer registration"}
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#252923]/75">
          {isMr ? "फक्त नाव, मोबाईल, ठिकाण आणि पीक लिहा. जमीन कागदपत्रांची गरज नाही." : "Enter your name, mobile, location, and crop. No land documents needed."}
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

      <div>
        <label className={labelClass} htmlFor="farmer-name">{isMr ? "तुमचे नाव" : "Your name"}</label>
        <div className="relative">
          <User size={17} className="absolute left-3 top-3.5 text-[#123C32]/60" aria-hidden />
          <input id="farmer-name" className={`${controlClass} pl-10`} value={farmerName} onChange={(event) => setFarmerName(event.target.value)} autoComplete="name" aria-required="true" />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="farmer-mobile">{isMr ? "मोबाईल नंबर" : "Mobile number"}</label>
        <div className="relative">
          <Phone size={17} className="absolute left-3 top-3.5 text-[#123C32]/60" aria-hidden />
          <input id="farmer-mobile" className={`${controlClass} pl-10`} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, ""))} placeholder={isMr ? "१० अंकी नंबर" : "10-digit mobile number"} aria-required="true" />
        </div>
        <p className="mt-1 text-xs text-[#252923]/65">{isMr ? "लॉगिनसाठी हा नंबर लक्षात ठेवा." : "Remember this number to sign in later."}</p>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-[#123C32]/15 p-3">
        <legend className="px-1 text-sm font-bold text-[#123C32]">{isMr ? "तुमच्या शेतीचे ठिकाण" : "Your farm location"}</legend>
        <div>
          <label className={labelClass} htmlFor="farmer-district">{isMr ? "जिल्हा" : "District"}</label>
          <select id="farmer-district" className={controlClass} value={district.id} onChange={(event) => changeDistrict(event.target.value)}>
            {MAHARASHTRA_LOCATIONS.map((item) => <option key={item.id} value={item.id}>{isMr ? item.nameMr : item.nameEn}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="farmer-taluka">{isMr ? "तालुका" : "Taluka"}</label>
            <select id="farmer-taluka" className={controlClass} value={taluka.id} onChange={(event) => changeTaluka(event.target.value)}>
              {district.talukas.map((item) => <option key={item.id} value={item.id}>{isMr ? item.nameMr : item.nameEn}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="farmer-village">{isMr ? "गाव" : "Village"}</label>
            <select id="farmer-village" className={controlClass} value={city.id} onChange={(event) => setSelectedCityId(event.target.value)}>
              {taluka.cities.map((item) => <option key={item.id} value={item.id}>{isMr ? item.nameMr : item.nameEn}</option>)}
            </select>
          </div>
        </div>
        <p className="flex items-start gap-1.5 text-xs leading-5 text-[#252923]/65">
          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
          {isMr ? `सध्या निवडलेले: ${city.nameMr}, ${taluka.nameMr}, ${district.nameMr}` : `Selected: ${city.nameEn}, ${taluka.nameEn}, ${district.nameEn}`}
        </p>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="farmer-crop">{isMr ? "तुमचे मुख्य पीक" : "Your main crop"}</label>
        <select id="farmer-crop" className={controlClass} value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value)} aria-required="true">
          <option value="" disabled>{isMr ? "पीक निवडा" : "Choose crop"}</option>
          {CROPS.map((crop) => <option key={crop.id} value={crop.id}>{isMr ? crop.mr : crop.en}</option>)}
        </select>
      </div>

      <p className="rounded-lg bg-[#FFF9E8] p-3 text-xs leading-5 text-[#252923]/75">
        {isMr
          ? "टीप: ही चाचणी आवृत्ती आहे. नोंदणीची माहिती या उपकरणात जतन होते; SMS किंवा बायोमेट्रिक पडताळणी सुरू नाही."
          : "Note: This is a demo. Registration is saved on this device; SMS and biometric verification are not enabled."}
      </p>

      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#123C32] px-4 py-3 text-base font-bold text-white hover:bg-[#0D2E26]">
        <CheckCircle2 size={18} aria-hidden />
        {isMr ? "नोंदणी करून पुढे जा" : "Register and continue"}
      </button>
      {onSwitchToLogin && (
        <button type="button" onClick={onSwitchToLogin} className="w-full py-2 text-sm font-semibold text-[#123C32] underline underline-offset-2">
          {isMr ? "आधी नोंदणी केली आहे? लॉगिन करा" : "Already registered? Sign in"}
        </button>
      )}
    </form>
  );
}
