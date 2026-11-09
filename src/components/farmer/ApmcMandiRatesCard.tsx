"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { api, type MandiRateResponse } from "@/lib/api";

interface ApmcMandiRatesCardProps {
  cropId?: string;
  cropName: string;
  blockId?: string;
  blockName?: string;
  districtName?: string;
  isMr: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(price);
}

export default function ApmcMandiRatesCard({
  cropId = "onion",
  cropName,
  blockId,
  blockName,
  districtName,
  isMr,
}: ApmcMandiRatesCardProps) {
  const [data, setData] = useState<MandiRateResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(blockId));
  const [error, setError] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    if (!blockId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setData(await api.getMandiRates(cropId, blockId));
    } catch (requestError) {
      console.error("Could not load official market prices:", requestError);
      setError(isMr
        ? "बाजारभाव मिळवता आले नाहीत. कृपया पुन्हा प्रयत्न करा."
        : "Market prices could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [blockId, cropId, isMr]);

  useEffect(() => {
    // Start the request when the selected crop/location changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRates();
  }, [loadRates]);

  const title = isMr ? `${cropName} — बाजारभाव` : `${cropName} market prices`;
  const unavailableMessage = (() => {
    if (!isMr) return data?.availability_notice || "No official record was found for this crop and district.";
    switch (data?.availability_code) {
      case "api_key_missing":
        return "सरकारी बाजारभावाची सेवा अजून जोडलेली नाही. त्यामुळे अंदाजे किंवा दुसऱ्या जिल्ह्याचे दर दाखवत नाही.";
      case "records_missing":
        return "या पिकाचा तुमच्या जिल्ह्यातील अधिकृत बाजारभाव सध्या सापडला नाही.";
      case "incomplete_prices":
        return "अधिकृत नोंद मिळाली, पण त्यात पूर्ण दर नव्हते. चुकीचा दर दाखवण्याऐवजी आम्ही तो लपवला आहे.";
      case "unsupported_crop":
        return "या पिकासाठी अधिकृत बाजारभावाची माहिती सध्या उपलब्ध नाही.";
      case "invalid_location":
        return "बाजारभाव पाहण्यासाठी आधी तुमचा जिल्हा आणि तालुका निवडा.";
      default:
        return "तुमच्या ठिकाणासाठी अधिकृत नोंद मिळाली नाही. आम्ही दुसऱ्या जिल्ह्याचा दर दाखवत नाही.";
    }
  })();
  const officialMarketUrl = data?.source_url || "https://agmarknet.gov.in/";

  return (
    <section className="rounded-xl border-2 border-[#123C32] bg-white p-4 shadow-[4px_4px_0px_#123C32] sm:p-5" aria-labelledby="market-prices-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#123C32]/15 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F0E5] text-[#123C32]">
            <Building2 size={20} aria-hidden />
          </span>
          <div>
            <h2 id="market-prices-title" className="text-lg font-bold text-[#123C32]">{title}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-[#252923]/70">
              <MapPin size={14} aria-hidden />
              {[blockName || data?.taluka || blockId, districtName || (isMr ? data?.district_mr : data?.district)]
                .filter(Boolean)
                .join(", ") || (isMr ? "शेताचे ठिकाण निवडा" : "Choose your farm location")}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#F4F0E5] px-3 py-1 text-xs font-semibold text-[#123C32]">
          {data?.data_mode === "demo"
            ? (isMr ? "डेमो नमुना दर" : "Demo sample prices")
            : (isMr ? "स्रोत: Agmarknet" : "Source: Agmarknet")}
        </span>
      </div>

      {loading ? (
        <p className="py-5 text-sm text-[#252923]/70" role="status">
          {isMr ? "अधिकृत बाजारभाव शोधत आहोत..." : "Checking official market records..."}
        </p>
      ) : error ? (
        <div className="py-4">
          <p className="text-sm text-[#9A3412]" role="alert">{error}</p>
          <button type="button" onClick={() => void loadRates()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#123C32] px-3 py-2 text-sm font-bold text-white">
            <RefreshCw size={15} aria-hidden />
            {isMr ? "पुन्हा प्रयत्न करा" : "Try again"}
          </button>
        </div>
      ) : data?.data_available && data.nearby_mandis?.length ? (
        <div className="pt-4">
          {data.data_mode === "demo" ? (
            <p className="rounded-lg border border-[#E6A52E] bg-[#FFF9E8] p-3 text-sm font-semibold leading-relaxed text-[#5B3A00]" role="note">
              {isMr
                ? `हे फक्त वेबसाइट दाखवण्यासाठीचे नमुना दर आहेत. हे ${districtName || data.district_mr} जिल्ह्याचे आजचे खरे बाजारभाव नाहीत. विक्रीचा निर्णय घेण्यापूर्वी खालील Agmarknet दुवा किंवा बाजार समितीत आजचा दर तपासा.`
                : `These are sample prices for the website demo only—not today's real ${districtName || data.district} market rates. Check Agmarknet or your market committee before deciding to sell.`}
            </p>
          ) : (
            <p className="text-sm text-[#252923]/75">
              {isMr
                ? `या बाजारात हा दर नोंदवला: ${data.arrival_date || "तारीख दिलेली नाही"}`
                : `Date this price was recorded: ${data.arrival_date || "not provided"}`}
            </p>
          )}
          <ul className="mt-3 space-y-3">
            {data.nearby_mandis.map((market) => (
              <li key={`${market.market_id}-${market.modal_price}`} className="rounded-lg border border-[#123C32]/15 bg-[#F9F8F3] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#123C32]">{isMr ? market.market_name_mr : market.market_name}</h3>
                    {market.variety && <p className="text-xs text-[#252923]/65">{market.variety}</p>}
                  </div>
                  <p className="text-xl font-extrabold text-[#123C32]">
                    ₹{formatPrice(market.modal_price)}
                    <span className="ml-1 text-xs font-medium">/ {isMr ? data.unit_mr : data.unit}</span>
                  </p>
                </div>
                <p className="mt-2 text-sm text-[#252923]/75">
                  {isMr ? "किमान भाव ते कमाल भाव: " : "Lowest to highest price: "}
                  ₹{formatPrice(market.min_price)} – ₹{formatPrice(market.max_price)}
                </p>
                {market.arrivals && (
                  <p className="mt-1 text-xs text-[#252923]/65">
                    {isMr ? "बाजारात विक्रीसाठी आलेला माल: " : "Produce brought to market: "}{market.arrivals}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {data.selling_advice_en && (
            <p className="mt-3 rounded-lg bg-[#EAF3E8] p-3 text-sm text-[#123C32]">
              {isMr ? data.selling_advice_mr : data.selling_advice_en}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-[#E6A52E]/50 bg-[#FFF9E8] p-3">
          <p className="font-semibold text-[#123C32]">
            {isMr ? "सध्या खात्रीशीर बाजारभाव उपलब्ध नाहीत." : "Verified market prices are not available right now."}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#252923]/80">{unavailableMessage}</p>
          {isMr && data?.availability_code === "api_key_missing" && (
            <p className="mt-2 text-sm leading-relaxed text-[#252923]/80">
              Agmarknet वर पीक <strong>{cropName}</strong> आणि जिल्हा <strong>{districtName || data.district_mr}</strong> निवडून आजचा दर पाहा.
            </p>
          )}
          <a
            href={officialMarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#123C32] px-4 py-2 text-sm font-bold text-white"
          >
            {isMr ? "सरकारी बाजारभाव पहा" : "View official market prices"}
            <ExternalLink size={15} aria-hidden />
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#123C32]/10 pt-3">
        <span className="text-xs text-[#252923]/65">
          {isMr ? "भाव पिकाचा प्रकार आणि मालाच्या दर्जानुसार बदलू शकतो." : "Prices vary by crop variety and produce quality."}
        </span>
        <a
          href={data?.source_url || "https://agmarknet.gov.in/"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#123C32] underline underline-offset-2"
        >
          {isMr ? "Agmarknet वर बाजारभाव पहा" : "View prices on Agmarknet"}
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    </section>
  );
}
