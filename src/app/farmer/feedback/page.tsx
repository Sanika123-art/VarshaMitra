"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Send, Users } from "lucide-react";
import { api, type FarmerFeedbackPost } from "@/lib/api";
import { useAppState } from "@/hooks/useAppState";
import { useTranslation } from "@/i18n/LanguageContext";

type FeedbackRating = FarmerFeedbackPost["rating"];

const sampleFeedback: FarmerFeedbackPost[] = [
  { id: "sample-1", display_name: "नमुना पोस्ट १", district: "उदाहरण", rating: "helpful", message: "पावसाच्या सूचनेमुळे शेतात पाणी साचू नये याची आधी तयारी केली. सूचना समजायला सोपी होती.", created_at: "", taluka: null },
  { id: "sample-2", display_name: "नमुना पोस्ट २", district: "उदाहरण", rating: "helpful", message: "पेरणीची माहिती उपयोगी वाटली. तरीही काम सुरू करण्याआधी मी माझ्या गावातल्या शेतकऱ्यांशी बोलून खात्री केली.", created_at: "", taluka: null },
  { id: "sample-3", display_name: "नमुना पोस्ट ३", district: "उदाहरण", rating: "slightly_high", message: "पावसाचा कल साधारण जुळला, पण सांगितलेले पावसाचे प्रमाण थोडे जास्त वाटले. पूर्ण चुकीचे नाही; अंदाज आणखी सुधारता येईल.", created_at: "", taluka: null },
  { id: "sample-4", display_name: "नमुना पोस्ट ४", district: "उदाहरण", rating: "slightly_low", message: "अंदाजापेक्षा प्रत्यक्ष पाऊस थोडा जास्त झाला. दिशा काहीशी बरोबर होती, पण प्रमाण अगदी अचूक नव्हते.", created_at: "", taluka: null },
  { id: "sample-5", display_name: "नमुना पोस्ट ५", district: "उदाहरण", rating: "suggestion", message: "मराठीतली माहिती वाचायला सोपी आहे. काही हवामान शब्दांचा अर्थ छोट्या उदाहरणाने दिला तर अजून मदत होईल.", created_at: "", taluka: null },
  { id: "sample-6", display_name: "नमुना पोस्ट ६", district: "उदाहरण", rating: "suggestion", message: "तालुका निवडल्यावर माहिती जवळची वाटते. पावसात गावागावात फरक असतो, तोही कळवण्याचा पर्याय हवा.", created_at: "", taluka: null },
  { id: "sample-7", display_name: "नमुना पोस्ट ७", district: "उदाहरण", rating: "not_sure", message: "सल्ला उपयोगी वाटला. पण मोठा खर्च किंवा औषध फवारणी करण्याआधी कृषी सहाय्यकांचा सल्ला घेणे चांगले.", created_at: "", taluka: null },
  { id: "sample-8", display_name: "नमुना पोस्ट ८", district: "उदाहरण", rating: "suggestion", message: "मोबाईल नेटवर्क कमी असताना माहिती वाचता यावी म्हणून कमी इंटरनेटमध्ये चालणारा पर्याय दिलात तर बरे होईल.", created_at: "", taluka: null },
];

const sampleMessagesEn = [
  "The rain notice helped me prepare the field so water would not collect. It was easy to understand.",
  "The sowing information was useful. I still checked with farmers in my village before starting work.",
  "The rain pattern was close, but the amount seemed a little high. It was not completely wrong and could be improved.",
  "It rained a little more than the estimate. The direction was close, but the amount was not exact.",
  "The Marathi information is easy to read. A small example for weather words would help even more.",
  "Choosing a taluka makes the information feel local. Rain can differ between nearby villages too.",
  "The advice was useful. Before spending a lot or spraying medicine, it is better to ask an agriculture worker.",
  "A version that works with a weak mobile signal would help farmers in places with poor network.",
];

const ratingLabels: Record<FeedbackRating, { en: string; mr: string; style: string }> = {
  helpful: { en: "Helpful", mr: "उपयोगी वाटले", style: "bg-[#EAF3E8] text-[#23603B]" },
  slightly_high: { en: "Rain estimate felt a little high", mr: "पावसाचा अंदाज थोडा जास्त वाटला", style: "bg-[#FFF3D6] text-[#825B0B]" },
  slightly_low: { en: "Rain estimate felt a little low", mr: "पावसाचा अंदाज थोडा कमी वाटला", style: "bg-[#FFF3D6] text-[#825B0B]" },
  not_sure: { en: "Not sure yet", mr: "अजून खात्री नाही", style: "bg-slate-100 text-slate-700" },
  suggestion: { en: "Suggestion", mr: "एक सूचना", style: "bg-[#EAF1F8] text-[#244C72]" },
};

function FeedbackCard({ post, isMr, example = false }: { post: FarmerFeedbackPost; isMr: boolean; example?: boolean }) {
  const rating = ratingLabels[post.rating];
  const sampleIndex = example ? Number(post.id.slice("sample-".length)) - 1 : -1;
  return (
    <article className="rounded-xl border border-[#123C32]/15 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-[#123C32]">{example && !isMr ? `Sample post ${sampleIndex + 1}` : post.display_name}</p>
          {!example && <p className="mt-0.5 text-xs text-[#252923]/65">{[post.taluka, post.district].filter(Boolean).join(", ")}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rating.style}`}>{isMr ? rating.mr : rating.en}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#252923]/85">
        {example && !isMr ? sampleMessagesEn[sampleIndex] : post.message}
      </p>
      {!example && (
        <p className="mt-3 border-t border-[#123C32]/10 pt-2 text-[11px] leading-4 text-[#252923]/55">
          {isMr ? "सार्वजनिक पोस्ट · नाव स्वतः दिलेले · स्वतंत्र पडताळणी केलेली नाही" : "Public post · name is self-reported · not independently verified"}
        </p>
      )}
    </article>
  );
}

export default function FarmerFeedbackPage() {
  const { language } = useTranslation();
  const isMr = language === "mr";
  const { farmerProfile, location } = useAppState();
  const [posts, setPosts] = useState<FarmerFeedbackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rating, setRating] = useState<FeedbackRating>("helpful");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    api.getFarmerFeedback()
      .then((response) => {
        if (active) setPosts(response.items);
      })
      .catch((requestError: unknown) => {
        console.error("Could not load farmer feedback:", requestError);
        if (active) setError(isMr ? "पोस्ट मिळू शकल्या नाहीत. पुन्हा प्रयत्न करा." : "Could not load posts. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isMr]);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const post = await api.postFarmerFeedback({
        display_name: displayName.trim() || undefined,
        district: farmerProfile?.districtName || location.districtName,
        taluka: farmerProfile?.talukaName || location.blockName,
        rating,
        message: message.trim(),
      });
      setPosts((current) => [post, ...current]);
      setMessage("");
      setNotice(isMr ? "तुमचे मत पोस्ट झाले. धन्यवाद!" : "Your feedback was posted. Thank you!");
    } catch (requestError) {
      console.error("Could not post farmer feedback:", requestError);
      setError(isMr
        ? "पोस्ट करता आली नाही. मोबाईल नंबर न लिहिता पुन्हा प्रयत्न करा."
        : "Could not post your feedback. Please remove any phone number and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-[#123C32] p-5 text-white sm:p-7">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white/10 p-3 text-[#E6A52E]"><MessageCircle size={25} aria-hidden /></span>
          <div>
            <p className="text-sm font-bold text-[#E6A52E]">{isMr ? "आपले मत महत्त्वाचे आहे" : "Your experience matters"}</p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{isMr ? "शेतकऱ्यांचे मत" : "Farmer voices"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              {isMr
                ? "वर्षामित्रचा सल्ला उपयोगी पडला का? पावसाचा अंदाज जास्त किंवा कमी वाटला का? आपला खरा अनुभव लिहा. चांगले आणि सुधारणा सुचवणारे—दोन्ही मतांचे स्वागत आहे."
                : "Was the advice useful? Did the rainfall estimate feel high or low? Share your honest experience. Praise and constructive feedback are both welcome."}
            </p>
          </div>
        </div>
        <Link href="/farmer/community" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#E6A52E] px-4 py-2.5 text-sm font-bold text-[#123C32]">
          <Users size={17} aria-hidden />
          {isMr ? "महाराष्ट्रातील शेतकरी गटात सामील व्हा" : "Join the Maharashtra farmer group"}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </header>

      <section className="rounded-2xl border-2 border-[#123C32]/15 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-extrabold text-[#123C32]">{isMr ? "तुमचा अनुभव सांगा" : "Share your experience"}</h2>
        <p className="mt-1 text-sm leading-5 text-[#252923]/70">
          {isMr
            ? "फोन नंबर लिहू नका. नाव ऐच्छिक आहे; पोस्ट सर्वांना दिसेल. पोस्टवर स्वतंत्र पडताळणी होत नाही."
            : "Do not include a phone number. Name is optional; posts are public and are not independently verified."}
        </p>
        <form onSubmit={submitFeedback} className="mt-4 space-y-4">
          <div>
            <label htmlFor="feedback-rating" className="mb-1 block text-sm font-bold text-[#123C32]">
              {isMr ? "तुमचा अनुभव कसा होता?" : "How was your experience?"}
            </label>
            <select id="feedback-rating" value={rating} onChange={(event) => setRating(event.target.value as FeedbackRating)} className="w-full rounded-lg border border-[#123C32]/25 bg-white px-3 py-3 text-base text-[#252923]">
              {(Object.keys(ratingLabels) as FeedbackRating[]).map((value) => (
                <option key={value} value={value}>{isMr ? ratingLabels[value].mr : ratingLabels[value].en}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="feedback-message" className="mb-1 block text-sm font-bold text-[#123C32]">
              {isMr ? "तुमचे मत (१० ते ५०० अक्षरे)" : "Your feedback (10–500 characters)"}
            </label>
            <textarea id="feedback-message" required minLength={10} maxLength={500} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-lg border border-[#123C32]/25 bg-white px-3 py-3 text-base leading-6 text-[#252923] outline-none focus:border-[#123C32]" placeholder={isMr ? "उदा. अंदाज साधारण जुळला, पण पावसाचे प्रमाण थोडे जास्त वाटले..." : "For example: The forecast was close, but rainfall seemed a little higher..."} />
          </div>
          <div>
            <label htmlFor="feedback-name" className="mb-1 block text-sm font-bold text-[#123C32]">{isMr ? "नाव किंवा टोपणनाव (ऐच्छिक)" : "Name or nickname (optional)"}</label>
            <input id="feedback-name" maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-lg border border-[#123C32]/25 bg-white px-3 py-3 text-base text-[#252923] outline-none focus:border-[#123C32]" placeholder={isMr ? "रिकामे ठेवल्यास 'शेतकरी मित्र' दिसेल" : "Leave blank to appear as “Farmer friend”"} />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800">{notice}</p>}
          <button type="submit" disabled={submitting || message.trim().length < 10} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#123C32] px-4 py-3 text-base font-bold text-white disabled:opacity-50 sm:w-auto">
            <Send size={17} aria-hidden />
            {submitting ? (isMr ? "पोस्ट होत आहे..." : "Posting...") : (isMr ? "मत पोस्ट करा" : "Post feedback")}
          </button>
        </form>
      </section>

      <section aria-labelledby="sample-feedback-heading">
        <div className="mb-3 rounded-xl border border-[#E6A52E]/50 bg-[#FFF9E8] p-3">
          <h2 id="sample-feedback-heading" className="font-bold text-[#654B15]">
            {isMr ? "नमुना पोस्ट — प्रत्यक्ष शेतकरी अनुभव नाहीत" : "Sample posts — not real farmer testimonials"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#654B15]/85">
            {isMr ? "ही फक्त नमुना मजकूराची उदाहरणे आहेत. खरी सार्वजनिक मते खाली वेगळ्या विभागात दिसतील." : "These are illustrative examples only. Real public submissions appear separately below."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {sampleFeedback.map((post) => <FeedbackCard key={post.id} post={post} isMr={isMr} example />)}
        </div>
      </section>

      <section aria-labelledby="real-feedback-heading">
        <h2 id="real-feedback-heading" className="mb-3 text-xl font-extrabold text-[#123C32]">
          {isMr ? `शेतकऱ्यांनी पोस्ट केलेली मते (${posts.length})` : `Farmer submissions (${posts.length})`}
        </h2>
        {loading ? (
          <p role="status" className="rounded-xl bg-white p-4 text-sm text-[#252923]/70">{isMr ? "मते लोड होत आहेत..." : "Loading feedback..."}</p>
        ) : posts.length ? (
          <div className="grid gap-3 md:grid-cols-2">{posts.map((post) => <FeedbackCard key={post.id} post={post} isMr={isMr} />)}</div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#123C32]/30 bg-white p-6 text-center">
            <MessageCircle size={24} className="mx-auto text-[#123C32]/50" aria-hidden />
            <p className="mt-2 font-semibold text-[#123C32]">{isMr ? "अजून प्रत्यक्ष पोस्ट नाहीत." : "No real posts yet."}</p>
            <p className="mt-1 text-sm text-[#252923]/65">{isMr ? "तुमचे खरे मत सर्वात पहिले शेअर करा." : "Be the first to share your real experience."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
