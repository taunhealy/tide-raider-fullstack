"use client";

import React, { useState, useEffect } from "react";
import { Radio, Play, Square, Activity, Globe, Music, Tv, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function StreamAdminPanel() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "INITIALIZING" | "LIVE" | "ERROR">("IDLE");
  const [uptime, setUptime] = useState("00:00:00");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Stream Controller Ready."]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const toggleStream = async () => {
    if (status === "LIVE") {
       setStatus("IDLE");
       setIsStreaming(false);
       addLog("Stopping Stream Engine...");
       // Logic to call API to kill process
    } else {
       setStatus("INITIALIZING");
       addLog("Launching Ghost Browser (Headless)...");
       
       // Simulate startup sequence
       setTimeout(() => {
          setStatus("LIVE");
          setIsStreaming(true);
          addLog("RTMP Handshake Successful.");
          addLog("Broadcasting to YouTube: TIDE RAIDER LIVE");
       }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-primary selection:bg-brand-3">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-3 rounded-2xl flex items-center justify-center text-gray-950 shadow-[0_0_30px_rgba(28,217,255,0.4)]">
              <Radio size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Stream <span className="text-brand-3">Controller</span></h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest opacity-60">Independent Capture Engine v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
             <div className={cn("w-2 h-2 rounded-full", status === "LIVE" ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-gray-600")} />
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{status}</span>
          </div>
        </header>

        {/* Main Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Action Center */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Tv size={120} />
               </div>
               
               <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Virtual Display Engine</h2>
               <p className="text-sm text-gray-400 mb-8 max-w-sm">Launch a hidden 1080p browser session that broadcasts directly to YouTube without interfering with your work.</p>

               <div className="flex gap-4">
                  <button 
                    onClick={toggleStream}
                    className={cn(
                      "flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-sm uppercase tracking-widest",
                      status === "LIVE" 
                        ? "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20" 
                        : "bg-brand-3 text-gray-950 shadow-[0_10px_40px_rgba(28,217,255,0.3)] hover:scale-105 active:scale-95"
                    )}
                  >
                    {status === "LIVE" ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    {status === "LIVE" ? "Shutdown Stream" : "Go Live Now"}
                  </button>
               </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Uptime</span>
                  <span className="text-2xl font-black tracking-tighter tabular-nums">{uptime}</span>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Health</span>
                  <div className="flex items-center gap-2">
                     <Activity size={16} className="text-green-500" />
                     <span className="text-2xl font-black tracking-tighter text-green-500">EXCELLENT</span>
                  </div>
               </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 flex flex-col min-h-[400px]">
             <div className="flex items-center gap-2 mb-6">
                <Globe size={16} className="text-brand-3" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Console Output</h3>
             </div>
             <div className="flex-1 font-mono text-[10px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className={cn(
                    "border-l-2 pl-3 py-1",
                    log.includes('ERROR') ? "border-red-500 text-red-400" : "border-brand-3/20 text-gray-400"
                  )}>
                    {log}
                  </div>
                ))}
             </div>
          </div>

        </div>

        {/* Security / Info */}
        <footer className="mt-12 flex items-center justify-between border-t border-white/5 pt-8 opacity-40">
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Isolated Environment Active</span>
           </div>
           <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest">YT Latency: LOW</span>
           </div>
        </footer>

      </div>
    </div>
  );
}
