"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, X, Send, Bot, User, Zap, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Button } from "./ui/Button";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AIChatWidget() {
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
                      {msg.content}
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
