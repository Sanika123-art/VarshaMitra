"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { districts as fallbackDistricts, stateInfo } from "@/data/locations";
import { api, type DistrictDetail, type BlockDetail } from "@/lib/api";
import {
  PageHeader,
  Card,
  Button,
} from "@/components/ui";

export default function LocationPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { location, setLocation, role, hydrated } = useAppState();

  const [liveDistricts, setLiveDistricts] = useState<DistrictDetail[]>([]);
  const [liveBlocks, setLiveBlocks] = useState<BlockDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [districtId, setDistrictId] = useState(location.districtId);
  const [blockId, setBlockId] = useState(location.blockId);

  // Fetch verified districts and blocks from FastAPI backend
  const fetchLocations = () => {
    setIsLoading(true);
    setLoadError(null);
    Promise.allSettled([api.getDistricts(), api.getBlocks()])
      .then(([distRes, blockRes]) => {
        if (distRes.status === "fulfilled" && distRes.value?.length > 0) {
          setLiveDistricts(distRes.value);
        }
        if (blockRes.status === "fulfilled" && blockRes.value?.length > 0) {
          setLiveBlocks(blockRes.value);
        }
        if (distRes.status === "rejected" && blockRes.status === "rejected") {
          setLoadError("Live location API unreachable");
        }
      })
      .catch((err) => {
        setLoadError(err.message || "Failed to load locations from API");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const availableDistricts = useMemo(() => {
    if (liveDistricts.length === 0) return fallbackDistricts;

    return liveDistricts.map((d) => {
      const fallback = fallbackDistricts.find((fd) => fd.id === d.id);
      const districtBlocks = liveBlocks.filter((b) => b.district_id === d.id);
      const blocksSource =
        districtBlocks.length > 0
          ? districtBlocks.map((b) => ({
              id: b.id,
              name: b.name,
              nameMr: b.name_mr || b.name,
            }))
          : (d.member_blocks && d.member_blocks.length > 0
              ? d.member_blocks.map((b) => ({
                  id: b.id,
                  name: b.name,
                  nameMr: b.name_mr || b.name,
                }))
              : (fallback?.blocks ?? []));

      return {
        id: d.id,
        name: d.name,
        nameMr: d.name_mr || fallback?.nameMr || d.name,
        blocks: blocksSource,
      };
    });
  }, [liveDistricts, liveBlocks]);

  const currentDistrict = useMemo(
    () => availableDistricts.find((d) => d.id === districtId) ?? availableDistricts[0],
    [availableDistricts, districtId]
  );

  useEffect(() => {
    if (hydrated && !role) {
      router.replace("/login");
    }
  }, [hydrated, role, router]);

  if (!hydrated || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  function handleDistrictChange(id: string) {
    setDistrictId(id);
    const d = availableDistricts.find((dd) => dd.id === id);
    if (d && d.blocks.length > 0) {
      setBlockId(d.blocks[0].id);
    }
  }

  function confirm() {
    const d = availableDistricts.find((dd) => dd.id === districtId);
    const b = d?.blocks.find((bb) => bb.id === blockId);
    if (!d || !b) return;
    setLocation({
      stateId: stateInfo.id,
      stateName: stateInfo.name,
      districtId: d.id,
      districtName: d.name,
      blockId: b.id,
      blockName: b.name,
    });
    router.push(role === "officer" ? "/officer/dashboard" : "/farmer/dashboard");
  }

  const selectedBlock = currentDistrict?.blocks.find((b) => b.id === blockId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow={t("location.eyebrow")}
        title={t("location.title")}
        description={t("location.subtitle")}
      />

      <Card tone="default" className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
            {t("location.selectState")}
          </label>
          <input
            disabled
            value={language === "mr" ? stateInfo.nameMr : stateInfo.name}
            className="mt-1.5 w-full rounded-md border border-line bg-paper-deep px-3 py-2 text-sm font-semibold text-ink-muted"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              {t("location.selectDistrict")}
            </label>
            {isLoading ? (
              <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                <RefreshCw size={11} className="animate-spin text-forest" />
                Loading API...
              </span>
            ) : liveDistricts.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
                Live Backend Connected
              </span>
            ) : loadError ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-risk-high-bg px-2 py-0.5 text-[10px] font-semibold text-risk-high-ink">
                Offline Mode (Demo Data)
              </span>
            ) : null}
          </div>
          <select
            value={districtId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-forest"
          >
            {availableDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {language === "mr" ? d.nameMr : d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
            {t("location.selectBlock")}
          </label>
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-forest"
          >
            {currentDistrict?.blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {language === "mr" ? b.nameMr : b.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBlock && (
          <div className="rounded-lg border border-forest/30 bg-forest-soft/40 p-4">
            <div className="flex items-center gap-2 text-forest">
              <MapPin size={16} aria-hidden />
              <p className="font-serif text-sm font-semibold text-ink">
                {t("location.personalizedFor", {
                  block: language === "mr" ? selectedBlock.nameMr : selectedBlock.name,
                })}
              </p>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {t("location.personalizedHelp")}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push(role === "officer" ? "/officer/dashboard" : "/farmer/dashboard")}
          >
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={confirm}>
            {t("location.confirm")}
            <ArrowRight size={15} aria-hidden />
          </Button>
        </div>
      </Card>
    </div>
  );
}
