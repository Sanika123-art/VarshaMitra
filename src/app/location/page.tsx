"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  ArrowRight,
  RefreshCw,
  Search,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Compass,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { stateInfo } from "@/data/locations";
import {
  api,
  type DistrictDetail,
  type LocationSearchItem,
} from "@/lib/api";

export default function LocationPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { location, setLocation, role, hydrated } = useAppState();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // GPS geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Administrative hierarchy state (All 36 Districts)
  const [liveDistricts, setLiveDistricts] = useState<DistrictDetail[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [districtId, setDistrictId] = useState(location.districtId);

  // Currently resolved candidate preview
  const [candidate, setCandidate] = useState<{
    blockId: string;
    blockName: string;
    blockNameMr: string;
    districtId: string;
    districtName: string;
    districtNameMr: string;
    latitude: number;
    longitude: number;
    taluka?: string | null;
    postalCode?: string | null;
    displayName?: string | null;
    isDynamic?: boolean;
    precision?: string;
  }>({
    blockId: location.blockId,
    blockName: location.blockName,
    blockNameMr: location.blockNameMr || location.blockName,
    districtId: location.districtId,
    districtName: location.districtName,
    districtNameMr: location.districtNameMr || location.districtName,
    latitude: location.latitude ?? 18.5204,
    longitude: location.longitude ?? 73.8567,
    taluka: location.taluka,
    postalCode: location.postalCode,
    displayName: location.displayName,
    isDynamic: location.isDynamic,
  });

  // Fetch 36 Districts on mount
  useEffect(() => {
    let cancelled = false;
    async function loadDistricts() {
      setIsLoadingDistricts(true);
      try {
        const data = await api.getDistricts();
        if (!cancelled && data.length > 0) {
          setLiveDistricts(data);
        }
      } catch {
        // Fallback or retry
      } finally {
        if (!cancelled) setIsLoadingDistricts(false);
      }
    }
    loadDistricts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auth check
  useEffect(() => {
    if (hydrated && !role) {
      router.replace("/login");
    }
  }, [hydrated, role, router]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSearchError(null);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.searchLocations(val.trim(), 8);
        setSearchResults(res.results);
        if (res.results.length === 0) {
          setSearchError(
            language === "mr"
              ? "महाराष्ट्रात कोणतेही स्थान आढळले नाही. कृपया तालुका किंवा पिन कोड तपासा."
              : "No locations found in Maharashtra. Try searching for a nearby taluka or PIN code."
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Search failed";
        setSearchError(msg);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSearchResult = async (item: LocationSearchItem) => {
    try {
      const resolved = await api.resolveLocation({
        latitude: item.latitude,
        longitude: item.longitude,
        postal_code: item.postal_code || undefined,
        query: item.name,
      });

      setCandidate({
        blockId: resolved.id,
        blockName: resolved.name,
        blockNameMr: resolved.name_mr || resolved.name,
        districtId: resolved.district_id,
        districtName: resolved.district_name,
        districtNameMr: item.district_name_mr || resolved.district_name,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        taluka: item.taluka,
        postalCode: item.postal_code,
        displayName: item.display_name,
        isDynamic: true,
        precision: item.precision,
      });

      setSearchQuery("");
      setSearchResults([]);
    } catch {
      setCandidate({
        blockId: item.id,
        blockName: item.name,
        blockNameMr: item.name_mr,
        districtId: item.district_id,
        districtName: item.district_name,
        districtNameMr: item.district_name_mr,
        latitude: item.latitude,
        longitude: item.longitude,
        taluka: item.taluka,
        postalCode: item.postal_code,
        displayName: item.display_name,
        isDynamic: true,
        precision: item.precision,
      });
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(
        language === "mr"
          ? "आपल्या ब्राउझरमध्ये GPS स्थान समर्थित नाही."
          : "Geolocation is not supported by your browser."
      );
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resolved = await api.reverseGeocodeLocation(latitude, longitude);
          setCandidate({
            blockId: resolved.id,
            blockName: resolved.name,
            blockNameMr: resolved.name_mr,
            districtId: resolved.district_id,
            districtName: resolved.district_name,
            districtNameMr: resolved.district_name_mr,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            taluka: resolved.taluka,
            postalCode: resolved.postal_code,
            displayName: resolved.display_name,
            isDynamic: true,
            precision: resolved.precision,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to resolve GPS coordinates";
          setGpsError(msg);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError(
          err.code === 1
            ? (language === "mr" ? "स्थान परवानगी नाकारली गेली." : "Location access permission was denied.")
            : (language === "mr" ? "GPS स्थान प्राप्त करण्यास अयशस्वी." : "Could not determine GPS position.")
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const currentDistrict = useMemo(
    () => liveDistricts.find((d) => d.id === districtId) ?? liveDistricts[0],
    [liveDistricts, districtId]
  );

  const handleDistrictChange = (dId: string) => {
    setDistrictId(dId);
    const d = liveDistricts.find((item) => item.id === dId);
    if (d && d.member_blocks && d.member_blocks.length > 0) {
      const firstBlock = d.member_blocks[0];
      setCandidate({
        blockId: firstBlock.id,
        blockName: firstBlock.name,
        blockNameMr: firstBlock.name_mr || firstBlock.name,
        districtId: d.id,
        districtName: d.name,
        districtNameMr: d.name_mr || d.name,
        latitude: firstBlock.latitude,
        longitude: firstBlock.longitude,
        displayName: `${firstBlock.name}, ${d.name}, Maharashtra`,
        isDynamic: false,
      });
    }
  };

  const handleBlockChange = (bId: string) => {
    const b = currentDistrict?.member_blocks?.find((item) => item.id === bId);
    if (b && currentDistrict) {
      setCandidate({
        blockId: b.id,
        blockName: b.name,
        blockNameMr: b.name_mr || b.name,
        districtId: currentDistrict.id,
        districtName: currentDistrict.name,
        districtNameMr: currentDistrict.name_mr || currentDistrict.name,
        latitude: b.latitude,
        longitude: b.longitude,
        displayName: `${b.name}, ${currentDistrict.name}, Maharashtra`,
        isDynamic: false,
      });
    }
  };

  const confirmLocation = () => {
    setLocation({
      stateId: stateInfo.id,
      stateName: stateInfo.name,
      districtId: candidate.districtId,
      districtName: candidate.districtName,
      districtNameMr: candidate.districtNameMr,
      blockId: candidate.blockId,
      blockName: candidate.blockName,
      blockNameMr: candidate.blockNameMr,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      taluka: candidate.taluka,
      postalCode: candidate.postalCode,
      displayName: candidate.displayName,
      isDynamic: candidate.isDynamic,
    });
    router.push(role === "officer" ? "/officer/dashboard" : "/farmer/dashboard");
  };

  if (!hydrated || !role) return null;

  const isMr = language === "mr";

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-[#F4F0E5] text-[#252923]">
      
      {/* ── Page Header ── */}
      <div className="border-b-2 border-[#123C32]/20 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#123C32] bg-[#123C32] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F0E5]">
            Location Selector
          </span>
          <span className="font-mono text-xs font-semibold text-[#123C32]">
            Maharashtra · 36 Districts
          </span>
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#123C32] sm:text-3xl">
          {isMr ? "स्थान निवडा किंवा शोधा" : "Select or Search Location"}
        </h1>
        <p className="mt-1 font-sans text-xs text-[#252923]/70 sm:text-sm">
          {isMr
            ? "महाराष्ट्रातील कोणत्याही गाव, तालुका, जिल्हा, किंवा पिन कोड शोधा किंवा थेट नकाशावरून निवडा."
            : "Locate any village, town, taluka, or PIN code across all 36 districts of Maharashtra."}
        </p>
      </div>

      {/* ── 1. Search Box & Autocomplete ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32] space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
            <Search size={15} />
            <span>1. Search Place, Taluka, or PIN Code</span>
          </label>
          <span className="rounded border border-[#123C32]/20 bg-[#F4F0E5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
            Statewide Geocoding
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="e.g. Alibaug, Baramati, Shirur, Nagpur, 410206..."
            className="w-full rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/50 px-4 py-3 font-sans text-sm font-semibold text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
          />
          {isSearching && (
            <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 font-mono text-xs text-[#123C32]">
              <RefreshCw size={13} className="animate-spin text-[#123C32]" />
              <span>Searching...</span>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="divide-y divide-[#123C32]/10 overflow-hidden rounded-lg border-2 border-[#123C32] bg-white shadow-lg">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="flex w-full items-start justify-between p-3.5 text-left transition hover:bg-[#F4F0E5]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#123C32] shrink-0" />
                    <span className="font-display font-bold text-sm text-[#252923]">
                      {isMr ? item.name_mr : item.name}
                    </span>
                    {item.postal_code && (
                      <span className="rounded border border-[#123C32]/30 bg-[#F4F0E5] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
                        PIN {item.postal_code}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-sans text-xs text-[#252923]/70 pl-5">
                    {item.display_name}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#252923]/60 shrink-0">
                  {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
                </span>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <p className="font-mono text-xs text-[#C7473B]">{searchError}</p>
        )}

        {/* GPS Quick Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#123C32]/10 pt-4">
          <p className="font-sans text-xs text-[#252923]/70">
            Or detect current field coordinates via device GPS:
          </p>
          <button
            type="button"
            onClick={handleUseGPS}
            disabled={isLocating}
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32] shadow-[2px_2px_0px_#123C32] hover:bg-[#F4F0E5]"
          >
            {isLocating ? (
              <RefreshCw size={13} className="animate-spin text-[#123C32]" />
            ) : (
              <Navigation size={13} className="text-[#E6A52E]" />
            )}
            <span>Use GPS Location</span>
          </button>
        </div>

        {gpsError && (
          <p className="font-mono text-xs text-[#C7473B]">{gpsError}</p>
        )}
      </div>

      {/* ── 2. Administrative District & Taluka Cascading Selector ── */}
      <div className="rounded-xl border-2 border-[#123C32] bg-white p-6 shadow-[4px_4px_0px_#123C32] space-y-4">
        <label className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
          <Compass size={15} />
          <span>2. Browse by District & Taluka</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-mono text-xs font-bold uppercase text-[#252923]/70">District:</label>
            <select
              value={districtId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/50 px-3 py-2.5 font-sans text-sm font-semibold text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
            >
              {liveDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {isMr ? d.name_mr : d.name} ({d.member_blocks?.length ?? 0} talukas)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-xs font-bold uppercase text-[#252923]/70">Taluka / Block:</label>
            <select
              value={candidate.blockId}
              onChange={(e) => handleBlockChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/50 px-3 py-2.5 font-sans text-sm font-semibold text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
            >
              {currentDistrict?.member_blocks?.map((b) => (
                <option key={b.id} value={b.id}>
                  {isMr ? b.name_mr : b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Candidate Location Confirmation Card ── */}
      <div className="rounded-xl border-3 border-[#123C32] bg-white p-6 shadow-[6px_6px_0px_#123C32] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#123C32]/15 pb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
            Selected Location Preview
          </span>
          <span className="flex items-center gap-1 rounded border border-[#123C32] bg-[#F4F0E5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#123C32]">
            <ShieldCheck size={12} className="text-[#3B8B61]" />
            Ready to Set
          </span>
        </div>

        <div>
          <h3 className="font-display text-2xl font-black text-[#123C32]">
            {isMr ? candidate.blockNameMr : candidate.blockName}
          </h3>
          <p className="font-sans text-xs sm:text-sm text-[#252923]/75 mt-0.5">
            {candidate.displayName || `${candidate.blockName}, ${candidate.districtName}, Maharashtra`}
          </p>
          <p className="font-mono text-xs text-[#252923]/60 mt-1">
            Centroid: {candidate.latitude.toFixed(3)}°N, {candidate.longitude.toFixed(3)}°E
          </p>
        </div>

        <button
          type="button"
          onClick={confirmLocation}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#123C32] bg-[#123C32] py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[4px_4px_0px_#252923] hover:bg-[#172B4D] transition"
        >
          <CheckCircle2 size={16} className="text-[#E6A52E]" />
          <span>Confirm & Launch Cockpit</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}