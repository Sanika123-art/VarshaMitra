"use client";

import Link from "next/link";
import { ArrowRight, Headphones, MapPin, MessageCircle, Sprout, Video } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

const stories = [
  {
    number: "01",
    kind: "fieldConversation",
    title: "farmerTitle",
    subtitle: "farmerSubtitle",
    description: "farmerDescription",
    duration: "1:33",
    video: "/videos/farmer-field-conversation.mp4",
    poster: "/images/farmer-field-conversation.jpg",
    icon: MessageCircle,
  },
  {
    number: "02",
    kind: "marketConversation",
    title: "marketTitle",
    subtitle: "marketSubtitle",
    description: "marketDescription",
    duration: "2:39",
    video: "/videos/market-farmer-conversation.mp4",
    poster: "/images/market-farmer-conversation.jpg",
    icon: MessageCircle,
  },
] as const;

export default function FieldStoriesPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#F4F0E5] pb-12 text-[#252923]">
      <header className="relative overflow-hidden bg-[#123C32] text-[#FFFDF6]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="container-page relative py-10 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E6A52E]/50 bg-[#E6A52E]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F4C968]">
            <Headphones size={15} aria-hidden />
            {t("fieldStories.eyebrow")}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">
            {t("fieldStories.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            {t("fieldStories.intro")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/80">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <MapPin size={16} aria-hidden />
              {t("fieldStories.fieldVisit")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <Video size={16} aria-hidden />
              {t("fieldStories.twoVideos")}
            </span>
          </div>
        </div>
      </header>

      <main className="container-page mt-8 space-y-8">
        <div className="flex items-start gap-3 rounded-xl border border-[#E6A52E]/70 bg-[#FFF9E8] p-4 sm:p-5">
          <Sprout className="mt-0.5 shrink-0 text-[#825B0B]" size={21} aria-hidden />
          <p className="text-sm leading-6 text-[#5B4618]">
            <strong>{t("fieldStories.transparencyTitle")}</strong>{" "}
            {t("fieldStories.transparencyBody")}
          </p>
        </div>

        <section aria-label={t("fieldStories.videosLabel")} className="grid gap-6 lg:grid-cols-2">
          {stories.map((story) => {
            const Icon = story.icon;
            return (
              <article
                key={story.number}
                className="overflow-hidden rounded-2xl border-2 border-[#123C32]/15 bg-white shadow-[4px_4px_0px_#123C32]"
              >
                <div className="relative bg-[#123C32]">
                  <video
                    className="aspect-video w-full bg-black object-contain"
                    controls
                    playsInline
                    preload="none"
                    poster={story.poster}
                    aria-label={t(`fieldStories.${story.title}`)}
                  >
                    <source src={story.video} type="video/mp4" />
                    {t("fieldStories.videoUnsupported")}
                  </video>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#123C32]/90 px-3 py-1.5 text-xs font-bold text-white">
                    <Icon size={14} aria-hidden />
                    {t(`fieldStories.${story.kind}`)}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-[#123C32]/90 px-3 py-1.5 font-mono text-xs font-bold text-white">
                    {story.duration}
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="font-mono text-xs font-bold tracking-widest text-[#3B8B61]">
                    {t("fieldStories.storyNumber", { number: story.number })}
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold text-[#123C32] sm:text-2xl">
                    {t(`fieldStories.${story.title}`)}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-[#8F4C13]">
                    {t(`fieldStories.${story.subtitle}`)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#252923]/80">
                    {t(`fieldStories.${story.description}`)}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 rounded-2xl bg-[#E7E2D3] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3B8B61]">
              {t("fieldStories.whyEyebrow")}
            </p>
            <h2 className="mt-2 max-w-2xl text-xl font-extrabold text-[#123C32] sm:text-2xl">
              {t("fieldStories.whyTitle")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#252923]/80">
              {t("fieldStories.whyBody")}
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#123C32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0D2E26]"
          >
            {t("fieldStories.learnMore")}
            <ArrowRight size={17} aria-hidden />
          </Link>
        </section>
      </main>
    </div>
  );
}
