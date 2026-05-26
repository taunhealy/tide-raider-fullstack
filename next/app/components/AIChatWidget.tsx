"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, X, Send, Bot, User, Zap, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Button } from "./ui/Button";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AIChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Tactical AI initialized. How can I assist your mission today?" }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: authData } = useBackendAuth();
  const { isSubscribed } = useSubscriptionStatus();
  const user = authData?.user;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/backend/ai-chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history })
      });

      if (!res.ok) {
        if (res.status === 402) throw new Error("INSUFFICIENT_CREDITS");
        if (res.status === 403) throw new Error("PERMISSION_DENIED");
        throw new Error("Relay failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "model", content: data.reply }]);
      // Refresh user data to update credits in UI if needed
      // (Actually credits aren't shown in the widget yet, but good for future)
    },
    onError: (err: any) => {
      let errorMsg = "Tactical signal lost. Please try again.";
      if (err.message === "INSUFFICIENT_CREDITS") {
        errorMsg = "Negative. Insufficient credits for this operation. Please refuel your account.";
      } else if (err.message === "PERMISSION_DENIED") {
        errorMsg = "Critical: AI permission denied. Mission control must verify Google Cloud billing and API access.";
      }
      setMessages(prev => [...prev, { role: "model", content: errorMsg }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    chatMutation.mutate(userMessage);
  };

  const handleSelectRegion = (id: string, name: string) => {
    setMessages(prev => [...prev, { role: "user", content: `Scout best breaks in ${name}` }]);
    chatMutation.mutate(`[REGION_SELECT] ${id}`);
  };

  const REGION_OPTIONS = [
    { id: "western-cape", name: "Western Cape (SA)" },
    { id: "eastern-cape", name: "Eastern Cape (SA)" },
    { id: "kwazulu-natal", name: "KwaZulu-Natal (SA)" },
    { id: "northern-cape", name: "Northern Cape (SA)" },
    { id: "swakopmund", name: "Swakopmund (Namibia)" },
    { id: "inhambane-province", name: "Inhambane / Tofo (Mozambique)" },
    { id: "ponta-do-ouro", name: "Ponta do Ouro (Mozambique)" },
    { id: "madagascar-south", name: "Madagascar (South)" },
    { id: "bali", name: "Bali (Indonesia)" },
    { id: "queensland", name: "Queensland (Australia)" },
    { id: "waikato", name: "Waikato / Raglan (NZ)" },
    { id: "chicama", name: "Chicama (Peru)" },
    { id: "california", name: "California (USA)" },
    { id: "new-south-wales", name: "New South Wales / Bondi (Australia)" },
    { id: "scotland", name: "Scotland (UK)" },
    { id: "morocco", name: "Taghazout (Morocco)" },
    { id: "basque-country", name: "Basque Country / Mundaka (Spain)" }
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const renderMessageContent = (content: string) => {
    if (content.includes("[PROMPT_REGION_SELECT]")) {
      const cleanText = content.replace("[PROMPT_REGION_SELECT]", "").trim();
      const filtered = REGION_OPTIONS.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return (
        <div className="space-y-3 font-primary">
          <p>{cleanText}</p>
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-2 mt-2">
            <input 
              type="text" 
              placeholder="Search region..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-3/50"
            />
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {filtered.map(region => (
                <button
                  key={region.id}
                  onClick={() => handleSelectRegion(region.id, region.name)}
                  className="w-full text-left bg-slate-900 hover:bg-slate-950 text-slate-200 hover:text-white px-2.5 py-2 rounded-lg text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span className="text-[10px]">📍</span> {region.name}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-[10px] text-slate-500 text-center py-2">No matching sectors found</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (content.includes("[REDIRECT: AI_REPORT_PAGE]")) {
      const cleanText = content.replace("[REDIRECT: AI_REPORT_PAGE]", "").trim();
      return (
        <div className="space-y-3 font-primary">
          <p>{cleanText}</p>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/ai-reports");
            }}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest text-[9px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            📊 Access AI Reports Sector
          </button>
        </div>
      );
    }

    return content;
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 font-primary">
      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "bg-white border border-slate-200 rounded-[24px] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
          isMinimized ? "h-14 w-64" : "h-[500px] w-[350px] sm:w-[400px]"
        )}>
          {/* Header */}
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-200">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest">Tactical AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Online & Operational</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
              >
                {messages.map((msg, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1",
                      msg.role === "user" ? "bg-slate-200" : "bg-slate-900"
                    )}>
                      {msg.role === "user" ? <User className="w-4 h-4 text-slate-500" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-[13px] leading-relaxed",
                      msg.role === "user" 
                        ? "bg-white border border-slate-200 text-slate-900 rounded-tr-none" 
                        : "bg-slate-900 text-slate-100 rounded-tl-none shadow-md"
                    )}>
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-3 bg-slate-200 rounded-2xl rounded-tl-none text-[13px] text-slate-500">
                      Processing transmission...
                    </div>
                  </div>
                )}
              </div>

              {/* Welcome/FAQ Quick Suggestion Pills */}
              {messages.length === 1 && !chatMutation.isPending && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setMessages(prev => [...prev, { role: "user", content: "Where is there good surf today?" }]);
                      chatMutation.mutate("Where is there good surf today?");
                    }}
                    className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    🌊 Where is there good surf today?
                  </button>
                  <button
                    onClick={() => {
                      setMessages(prev => [...prev, { role: "user", content: "Show me forecasts beyond today" }]);
                      chatMutation.mutate("Show me forecasts beyond today");
                    }}
                    className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    🔮 Forecasts beyond today?
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask for surf intelligence..."
                    className="w-full bg-slate-100 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-brand-3/20 transition-all outline-none"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-900 hover:bg-slate-900/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    1 Credit per prompt
                  </div>
                  <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                    Tide Raider v2.0 Tactical
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 group",
          isOpen ? "bg-slate-900 rotate-90" : "bg-slate-900 hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
