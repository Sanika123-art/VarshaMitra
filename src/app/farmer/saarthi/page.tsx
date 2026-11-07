"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  RefreshCw,
  CloudRain,
  Sprout,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  Bot,
  User,
  PanelLeftClose,
  PanelLeft,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAppState } from "@/hooks/useAppState";
import { useLocationLabel } from "@/hooks/useLocationLabel";
import { getCrop } from "@/data/crops";
import {
  api,
  type ChatConversationItem,
  type ChatConversationDetail,
  type ChatMessageItem,
} from "@/lib/api";

export default function SaarthiPage() {
  const { t, language } = useTranslation();
  const { location, cropId, stageId, hydrated } = useAppState();
  const { blockName, districtName } = useLocationLabel();

  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [currentConv, setCurrentConv] = useState<ChatConversationDetail | null>(null);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg(language === "mr" ? "तुमच्या ब्राउझरमध्ये व्हॉईस सपोर्ट उपलब्ध नाही." : "Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "mr" ? "mr-IN" : "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const speakMessage = (msgId: string, text: string) => {
    if (typeof window === "undefined") return;

    if (speakingMsgId === msgId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const clean = text.replace(/[*#`•_]/g, "").trim();
    const targetLang = language === "mr" ? "mr" : "en";

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const ttsUrl = `${backendUrl}/api/v1/tts?text=${encodeURIComponent(clean)}&lang=${targetLang}`;
      const audio = new Audio(ttsUrl);
      audioPlayerRef.current = audio;

      setSpeakingMsgId(msgId);
      audio.onended = () => setSpeakingMsgId(null);
      audio.onerror = () => {
        // Fallback to browser SpeechSynthesis
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = targetLang === "mr" ? "mr-IN" : "en-IN";
          u.rate = 0.95;
          const voices = window.speechSynthesis.getVoices();
          const mrVoice = voices.find((v) => v.lang.startsWith("mr") || v.lang.startsWith("hi"));
          if (mrVoice) u.voice = mrVoice;
          u.onend = () => setSpeakingMsgId(null);
          u.onerror = () => setSpeakingMsgId(null);
          window.speechSynthesis.speak(u);
        } else {
          setSpeakingMsgId(null);
        }
      };

      audio.play().catch(() => {
        audio.onerror?.(new Event("error"));
      });
    } catch {
      setSpeakingMsgId(null);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgCounterRef = useRef(0);

  const crop = getCrop(cropId);
  const cropName = crop ? t(crop.nameKey) : cropId;
  const stage = crop?.stages.find((s) => s.id === stageId);
  const stageName = stage ? t(stage.nameKey) : stageId;

  // 1. Load conversations list
  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    async function fetchList() {
      try {
        setLoadingHistory(true);
        const list = await api.getChatConversations();
        if (!active) return;
        setConversations(list);
        if (list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      } catch {
        // Backend offline or starting up
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    fetchList();
    return () => {
      active = false;
    };
  }, [hydrated, activeConvId]);

  // 2. Load active conversation details
  useEffect(() => {
    let active = true;

    if (!activeConvId) {
      Promise.resolve().then(() => {
        if (active) setCurrentConv(null);
      });
      return () => {
        active = false;
      };
    }

    const convId = activeConvId;
    async function fetchDetail() {
      try {
        setErrorMsg(null);
        const detail = await api.getChatConversation(convId);
        if (!active) return;
        setCurrentConv(detail);
      } catch {
        if (active) setErrorMsg("Failed to load conversation history.");
      }
    }

    fetchDetail();
    return () => {
      active = false;
    };
  }, [activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConv?.messages, isSending]);

  // Create new conversation
  const handleNewChat = async () => {
    try {
      setErrorMsg(null);
      const newConv = await api.createChatConversation({
        locationId: location.blockId,
        cropId,
        stageId,
        language,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setCurrentConv({
        ...newConv,
        messages: [],
      });
    } catch {
      setErrorMsg("Unable to start a new consultation. Please check backend connection.");
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    let targetConvId = activeConvId;

    if (!targetConvId) {
      try {
        const created = await api.createChatConversation({
          locationId: location.blockId,
          cropId,
          stageId,
          language,
        });
        setConversations((prev) => [created, ...prev]);
        targetConvId = created.id;
        setActiveConvId(created.id);
      } catch {
        setErrorMsg("Failed to initialize conversation session.");
        return;
      }
    }

    setInputMessage("");
    setIsSending(true);
    setErrorMsg(null);

    msgCounterRef.current += 1;
    const tempId = `temp_msg_${msgCounterRef.current}`;
    const nowIso = new Date().toISOString();
    const tempUserMsg: ChatMessageItem = {
      id: tempId,
      conversation_id: targetConvId,
      role: "user",
      content: text,
      created_at: nowIso,
      provider_status: "user",
    };

    setCurrentConv((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, tempUserMsg],
          }
        : {
            id: targetConvId!,
            title: text.slice(0, 30),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            language,
            message_count: 1,
            messages: [tempUserMsg],
          }
    );

    try {
      const response = await api.sendChatMessage(targetConvId, text, {
        locationId: location.blockId,
        cropId,
        stageId,
        language,
      });

      setCurrentConv((prev) =>
        prev
          ? {
              ...prev,
              message_count: prev.messages.length + 1,
              messages: [
                ...prev.messages.filter((m) => m.id !== tempUserMsg.id),
                { ...tempUserMsg, id: `user_sent_${tempId}` },
                response,
              ],
            }
          : null
      );

      const updatedList = await api.getChatConversations();
      setConversations(updatedList);
    } catch {
      setErrorMsg("Failed to communicate with Saarthi. Please retry.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this consultation?")) return;
    try {
      await api.deleteChatConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      setErrorMsg("Failed to delete consultation.");
    }
  };

  const handleRenameConv = async (id: string) => {
    if (!editingTitleText.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await api.updateChatConversation(id, editingTitleText.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editingTitleText.trim() } : c))
      );
      if (currentConv?.id === id) {
        setCurrentConv((prev) => (prev ? { ...prev, title: editingTitleText.trim() } : null));
      }
    } catch {
      setErrorMsg("Failed to rename conversation.");
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete all consultation history?")) return;
    try {
      await api.clearChatConversations();
      setConversations([]);
      setActiveConvId(null);
      setCurrentConv(null);
    } catch {
      setErrorMsg("Failed to clear chat history.");
    }
  };

  if (!hydrated) return null;

  const suggestedPrompts =
    language === "mr"
      ? [
          `पुढील आठवड्यात ${cropName} पिकाची पेरणी करावी का?`,
          `माझ्या शेतात सध्या पावसाचा काही खंड पडणार आहे का?`,
          `${cropName} पिकाच्या ${stageName} अवस्थेत खत कधी द्यावे?`,
          `मुसळधार पावसाची शक्यता आहे का आणि पाण्याचा निचरा कसा करावा?`,
        ]
      : [
          `Should I sow ${cropName} this week or wait for more rain?`,
          `Is there any dry spell expected for my farm in the next 14 days?`,
          `What are the critical irrigation needs for ${cropName} at ${stageName} stage?`,
          `Is there heavy rainfall forecasted and how should I manage drainage?`,
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] overflow-hidden rounded-2xl border-3 border-[#123C32] bg-[#F4F0E5] shadow-[6px_6px_0px_#123C32]">
      
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between border-b-2 border-[#123C32] bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg border-2 border-[#123C32]/30 p-1.5 text-[#123C32] hover:bg-[#F4F0E5] md:hidden"
            aria-label="Toggle history"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#123C32] bg-[#123C32] text-[#E6A52E] shadow-xs">
            <Bot size={22} />
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-[#123C32] sm:text-xl">
                {t("saarthi.title")}
              </h1>
              <span className="rounded border border-[#123C32] bg-[#F4F0E5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#123C32]">
                {t("saarthi.subtitle")}
              </span>
            </div>
            <p className="font-mono text-xs text-[#252923]/70">
              Context: <strong className="text-[#123C32]">{blockName}, {districtName}</strong> · {cropName} ({stageName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#123C32] bg-[#123C32] px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E5] shadow-[2px_2px_0px_#252923] hover:bg-[#172B4D] transition"
          >
            <Plus size={14} className="text-[#E6A52E]" />
            <span>{t("saarthi.newChat")}</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace: Sidebar + Conversation Canvas ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar: History */}
        <aside
          className={`border-r-2 border-[#123C32]/20 bg-white flex flex-col transition-all duration-200 ${
            sidebarOpen ? "w-72 sm:w-80" : "hidden md:flex md:w-64"
          } shrink-0`}
        >
          <div className="flex items-center justify-between border-b-2 border-[#123C32]/10 px-4 py-2.5">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
              <MessageSquare size={13} />
              {t("saarthi.chatHistory")}
            </span>
            {conversations.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="font-mono text-[11px] text-[#252923]/60 hover:text-[#C7473B]"
              >
                {t("saarthi.clearAll")}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingHistory ? (
              <div className="p-4 text-center font-mono text-xs text-[#252923]/60">
                <RefreshCw size={13} className="animate-spin inline-block mr-1 text-[#123C32]" />
                Loading history...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center font-sans text-xs italic text-[#252923]/60">
                {t("saarthi.noHistory")}
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeConvId;
                const isEditing = editingTitleId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`group relative flex items-center justify-between rounded-lg border-2 px-3 py-2 text-xs cursor-pointer transition ${
                      isActive
                        ? "border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-[2px_2px_0px_#252923]"
                        : "border-transparent text-[#252923] hover:border-[#123C32]/20 hover:bg-[#F4F0E5]"
                    }`}
                  >
                    <div className="flex-1 truncate pr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitleText}
                          onChange={(e) => setEditingTitleText(e.target.value)}
                          onBlur={() => handleRenameConv(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameConv(c.id);
                            if (e.key === "Escape") setEditingTitleId(null);
                          }}
                          autoFocus
                          className="w-full rounded border border-[#123C32] bg-white px-1.5 py-0.5 text-xs text-[#252923]"
                        />
                      ) : (
                        <>
                          <div className="font-semibold truncate">{c.title}</div>
                          {c.latest_message && (
                            <div className="font-sans text-[10px] opacity-75 truncate mt-0.5">
                              {c.latest_message}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(c.id);
                          setEditingTitleText(c.title);
                        }}
                        className="p-1 hover:text-[#E6A52E]"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConv(e, c.id)}
                        className="p-1 hover:text-[#C7473B]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Message Canvas */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#F4F0E5]">
          
          {errorMsg && (
            <div className="flex items-center justify-between border-b-2 border-[#C7473B] bg-white px-4 py-2 font-mono text-xs text-[#C7473B]">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {(!currentConv || currentConv.messages.length === 0) && (
              <div className="mx-auto max-w-xl py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#123C32] bg-white text-[#123C32] shadow-[4px_4px_0px_#123C32]">
                  <Sparkles size={26} className="text-[#E6A52E]" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-[#123C32]">
                  {t("saarthi.welcomeTitle")}
                </h2>
                <p className="mt-1 font-sans text-xs sm:text-sm text-[#252923]/70">
                  {t("saarthi.welcomeDesc")}
                </p>

                {/* Suggested Prompt Chips */}
                <div className="mt-6 text-left">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#123C32]">
                    {t("saarthi.suggestedQuestions")}:
                  </p>
                  <div className="mt-3 grid gap-2">
                    {suggestedPrompts.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        className="flex items-center justify-between rounded-lg border-2 border-[#123C32]/25 bg-white p-3 text-left font-sans text-xs text-[#252923] shadow-xs transition hover:border-[#123C32] hover:bg-[#F4F0E5] hover:shadow-[2px_2px_0px_#123C32]"
                      >
                        <span className="font-medium">{q}</span>
                        <Send size={12} className="text-[#123C32] shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentConv &&
              currentConv.messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
                        isUser
                          ? "border-[#123C32] bg-[#123C32] text-[#F4F0E5]"
                          : "border-[#123C32] bg-[#E6A52E] text-[#123C32]"
                      }`}
                    >
                      {isUser ? <User size={16} /> : <Bot size={16} />}
                    </span>

                    <div
                      className={`group relative max-w-[85%] rounded-xl border-2 p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "border-[#123C32] bg-[#123C32] text-[#F4F0E5] shadow-[3px_3px_0px_#252923]"
                          : "border-[#123C32] bg-white text-[#252923] shadow-[3px_3px_0px_#123C32]"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                      <div className="mt-2 flex items-center justify-between gap-4 font-mono text-[10px] opacity-75">
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {!isUser && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => speakMessage(m.id, m.content)}
                              className={`flex items-center gap-1 ${speakingMsgId === m.id ? "text-[#E6A52E] font-bold" : "hover:text-[#123C32]"}`}
                              title="Listen aloud"
                            >
                              <Volume2 size={11} className={speakingMsgId === m.id ? "animate-pulse" : ""} />
                              <span>{speakingMsgId === m.id ? (language === "mr" ? "ऐकत आहे..." : "Playing...") : (language === "mr" ? "ऐका" : "Speak")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(m.content, m.id)}
                              className="flex items-center gap-1 hover:text-[#123C32]"
                            >
                              {copiedId === m.id ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {isSending && (
              <div className="flex items-center gap-2 rounded-lg border-2 border-[#123C32]/30 bg-white p-3 font-mono text-xs text-[#123C32] max-w-xs shadow-xs">
                <RefreshCw size={13} className="animate-spin text-[#E6A52E]" />
                <span>Saarthi is consulting agro-climatic models...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Box */}
          <div className="border-t-2 border-[#123C32] bg-white p-3 sm:p-4">
            {isListening && (
              <div className="mb-2 flex items-center justify-between rounded border border-[#C7473B] bg-[#F8E5E3] px-3 py-1 font-mono text-[11px] text-[#7F2017]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C7473B] animate-ping" />
                  <span>{language === "mr" ? "तुमचा आवाज ऐकत आहे... (मराठीत बोला)" : "Listening to your voice... (Speak now)"}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="font-bold underline hover:text-black"
                >
                  {language === "mr" ? "रद्द करा" : "Cancel"}
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={t("saarthi.inputPlaceholder")}
                className="flex-1 resize-none rounded-lg border-2 border-[#123C32]/30 bg-[#F4F0E5]/60 px-3.5 py-2.5 font-sans text-xs sm:text-sm text-[#252923] outline-none transition focus:border-[#123C32] focus:bg-white"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#123C32] transition shadow-[2px_2px_0px_#252923] ${
                  isListening
                    ? "bg-[#C7473B] text-white animate-pulse"
                    : "bg-white text-[#123C32] hover:bg-[#F4F0E5]"
                }`}
                title={isListening ? "Stop listening" : "Speak in Marathi / English"}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#123C32] bg-[#123C32] text-[#E6A52E] shadow-[2px_2px_0px_#252923] transition hover:bg-[#172B4D] disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}