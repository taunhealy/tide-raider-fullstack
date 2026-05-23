"use client";

import React, { useState } from "react";
import { 
  Waves, 
  Sparkles, 
  Zap, 
  Eye, 
  Lock as LockIcon, 
  ChevronRight, 
  ChevronDown,
  Copy, 
  Check, 
  Info,
  Sliders,
  Type,
  Palette,
  Layers,
  Flame,
  MousePointerClick,
  Star,
  MapPin,
  ArrowUpRight,
  Play,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkle
} from "lucide-react";
import Link from "next/link";

export default function StyleGuidePage() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null); // "HEX" or "VAR"
  const [sandboxText, setSandboxText] = useState<string>("Tide Raider Breaker Intelligence");
  
  // Interactive SaaS Component States
  const [activeFilterTab, setActiveFilterTab] = useState<string>("all");
  const [isCardGated, setIsCardGated] = useState<boolean>(true);
  const [showMockIdealConditions, setShowMockIdealConditions] = useState<boolean>(false);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedText(null);
      setCopiedType(null);
    }, 2000);
  };

  // Star rating mockup component matching the Tide Raider blue-stars signature styling
  const BlueStarRatingMock = ({ rating = 4 }: { rating?: number }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${
              s <= rating 
                ? "text-blue-500 fill-blue-500 filter drop-shadow-[0_0_2px_rgba(59,130,246,0.5)]" 
                : "text-gray-200 fill-gray-100"
            }`}
          />
        ))}
      </div>
    );
  };

  // Sub-component for individual color card
  const ColorTokenCard = ({ 
    name, 
    value, 
    variable, 
    description 
  }: { 
    name: string; 
    value: string; 
    variable: string;
    description: string;
  }) => {
    const isHexCopied = copiedText === value && copiedType === "HEX";
    const isVarCopied = copiedText === variable && copiedType === "VAR";

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-[210px] relative overflow-hidden">
        {/* Swatch Header */}
        <div className="flex justify-between items-start z-10">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-0.5">Color Token</h4>
            <span className="text-[14px] font-black text-black tracking-tight leading-tight">{name}</span>
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy HEX */}
            <button
              onClick={() => handleCopy(value, "HEX")}
              className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-300 text-gray-400 hover:text-black transition-all text-[9px] font-bold flex items-center gap-1"
              title="Copy HEX"
            >
              {isHexCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              <span>HEX</span>
            </button>
            {/* Copy Variable */}
            <button
              onClick={() => handleCopy(variable, "VAR")}
              className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-300 text-gray-400 hover:text-black transition-all text-[9px] font-bold flex items-center gap-1"
              title="Copy CSS Variable"
            >
              {isVarCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              <span>VAR</span>
            </button>
          </div>
        </div>

        {/* Color Display & Details */}
        <div className="flex items-center gap-4 z-10 mt-3">
          <div 
            className="w-12 h-12 rounded-xl border border-gray-200/80 shadow-inner shrink-0" 
            style={{ backgroundColor: value }}
          />
          <div className="space-y-0.5">
            <p className="text-[12px] font-bold text-gray-900">{value.toUpperCase()}</p>
            <code className="text-[10px] font-mono bg-gray-50 px-1.5 py-0.5 rounded text-indigo-600 font-semibold block w-fit">{variable}</code>
          </div>
        </div>

        {/* Description & Toast Status */}
        <div className="z-10 pt-2 border-t border-gray-50 mt-2">
          <p className="text-[10px] text-gray-500 font-medium leading-normal">{description}</p>
        </div>

        {/* Copy Feedback Toast Layer */}
        {(isHexCopied || isVarCopied) && (
          <div className="absolute inset-0 bg-black/95 text-white flex flex-col items-center justify-center gap-1 z-20 animate-fade-in animate-duration-200">
            <CheckCircle2 className="w-6 h-6 text-green-400 animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest">Token Copied!</span>
            <code className="text-[9px] font-mono text-gray-300">{isHexCopied ? value : variable}</code>
          </div>
        )}

        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform" style={{ backgroundColor: value }} />
      </div>
    );
  };

  const TableSpecRow = ({ label, code, description }: { label: string; code: string; description: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 py-3.5 text-sm gap-2">
      <div className="space-y-0.5">
        <span className="text-gray-900 font-bold text-[13px]">{label}</span>
        <p className="text-[11px] text-gray-400 font-medium">{description}</p>
      </div>
      <code className="text-xs font-mono bg-gray-50 text-indigo-600 px-2.5 py-1 rounded-lg font-bold border border-gray-100 w-fit">{code}</code>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f2f2] py-12 px-4 sm:px-6 md:px-12 font-primary">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-8 border-b border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                <Waves className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 leading-none">TIDE RAIDER DESIGN SYSTEM</span>
                <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest font-primary">Version 2.0 (SaaS Premium)</span>
              </div>
            </div>
            <h1 className="font-['Montserrat'] uppercase text-[36px] font-black text-black tracking-tighter leading-none mt-2">
              Professional Style Guide
            </h1>
            <p className="text-gray-500 font-medium text-[14px] max-w-xl leading-relaxed">
              Curated UI specifications, interactive component standards, responsive typography scales, and responsive micro-animations aligned with Tide Raider's branding system.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/raid"
              className="h-11 px-5 rounded-xl bg-black hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-lg shadow-black/10 transition-all active:scale-[0.97]"
            >
              <Eye className="w-3.5 h-3.5" />
              Raid Dashboard
            </Link>
            <Link 
              href="/logs"
              className="h-11 px-5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-sm transition-all active:scale-[0.97]"
            >
              <Sliders className="w-3.5 h-3.5" />
              Surf Session Logs
            </Link>
          </div>
        </div>

        {/* 1. BRAND COLORS HARMONY */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Palette className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-['Montserrat'] text-[16px] font-black text-black uppercase tracking-widest">1. Color Token System</h2>
            </div>
            <span className="text-[9px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-200">Production Swatches</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ColorTokenCard 
              name="Primary Black" 
              value="#000000" 
              variable="var(--color-primary)" 
              description="Primary color for heavy headers, core layouts, and brand navigation."
            />
            <ColorTokenCard 
              name="Swell Blue" 
              value="#60a5fa" 
              variable="var(--color-tertiary)" 
              description="Primary accent mapping out wave suitability, star glows, and active nodes."
            />
            <ColorTokenCard 
              name="Badge Gold" 
              value="#d6b588" 
              variable="var(--color-badge)" 
              description="Branding background for locked sessions, Hidden Gems, and active filters."
            />
            <ColorTokenCard 
              name="UI Success" 
              value="#10b981" 
              variable="var(--color-ui-success)" 
              description="Indicates optimal conditions matches and verified scraping sources."
            />
            <ColorTokenCard 
              name="UI Warning" 
              value="#f59e0b" 
              variable="var(--color-ui-warning)" 
              description="Used for medium suitability scores and moderate ocean hazards."
            />
            <ColorTokenCard 
              name="UI Error" 
              value="#ef4444" 
              variable="var(--color-ui-error)" 
              description="Used for extreme warnings, shark incidents, and severe wind limitations."
            />
            <ColorTokenCard 
              name="SaaS Canvas Tan" 
              value="#f8f8f8" 
              variable="var(--color-bg-tan)" 
              description="The main page backdrop content surface used for card clusters and lists."
            />
            <ColorTokenCard 
              name="Medium Border Tan" 
              value="#e8e8e8" 
              variable="var(--color-border-tan)" 
              description="Clean boundary line separating dashboard widgets and lists."
            />
          </div>
        </div>

        {/* 2. TYPOGRAPHY SYSTEM WITH LIVE SANDBOX */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Type className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-['Montserrat'] text-[16px] font-black text-black uppercase tracking-widest">2. Typography Sandbox</h2>
            </div>
            
            {/* Typography Live Sandbox Input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-[350px]">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider shrink-0">Test Text:</span>
              <input 
                type="text" 
                value={sandboxText} 
                onChange={(e) => setSandboxText(e.target.value)} 
                className="text-xs font-bold text-gray-800 focus:outline-none w-full bg-transparent font-primary"
                placeholder="Type to test scales..."
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>Font Spec & Live Scale Preview</span>
                <span className="hidden sm:inline">CSS Utility Class</span>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-5 border-b border-gray-50 gap-4">
                <div className="space-y-1 w-full lg:max-w-[70%]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Heading 1 (80px, Montserrat, Uppercase)</span>
                  <h1 className="font-['Montserrat'] uppercase font-black text-4xl sm:text-5xl tracking-tighter text-black leading-none break-words">
                    {sandboxText}
                  </h1>
                </div>
                <code className="text-[10px] font-mono bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg font-bold border border-gray-100 w-fit shrink-0">.heading-1 / --font-size-5xl</code>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-5 border-b border-gray-50 gap-4">
                <div className="space-y-1 w-full lg:max-w-[70%]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Heading 2 (64px, Inter, Heavy)</span>
                  <h2 className="font-sans font-extrabold text-3xl sm:text-4xl tracking-tight text-black leading-none break-words">
                    {sandboxText}
                  </h2>
                </div>
                <code className="text-[10px] font-mono bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg font-bold border border-gray-100 w-fit shrink-0">.heading-2 / --font-size-4xl</code>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-5 border-b border-gray-50 gap-4">
                <div className="space-y-1 w-full lg:max-w-[70%]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Heading 3 (48px, Inter, Bold)</span>
                  <h3 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-black leading-tight break-words">
                    {sandboxText}
                  </h3>
                </div>
                <code className="text-[10px] font-mono bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg font-bold border border-gray-100 w-fit shrink-0">.heading-3 / --font-size-3xl</code>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-5 border-b border-gray-50 gap-4">
                <div className="space-y-1 w-full lg:max-w-[70%]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Heading 4 (32px, Inter)</span>
                  <h4 className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-black break-words">
                    {sandboxText}
                  </h4>
                </div>
                <code className="text-[10px] font-mono bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg font-bold border border-gray-100 w-fit shrink-0">.heading-4 / --font-size-2xl</code>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-5 border-b border-gray-50 gap-4">
                <div className="space-y-1 w-full lg:max-w-[70%]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Heading 5 (24px)</span>
                  <h5 className="font-sans font-semibold text-lg sm:text-xl text-black break-words">
                    {sandboxText}
                  </h5>
                </div>
                <code className="text-[10px] font-mono bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg font-bold border border-gray-100 w-fit shrink-0">.heading-5 / --font-size-xl</code>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-5 border-b border-gray-50 gap-4">
                <div className="space-y-1 w-full lg:max-w-[70%]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Heading 6 (16px, Body Technical)</span>
                  <h6 className="font-sans font-medium text-sm sm:text-base text-gray-700 break-words">
                    {sandboxText}
                  </h6>
                </div>
                <code className="text-[10px] font-mono bg-gray-50 text-indigo-600 px-3 py-1 rounded-lg font-bold border border-gray-100 w-fit shrink-0">.heading-6 / --font-size-base</code>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[9px] font-black uppercase font-primary">Primary Font</span>
                  <span className="text-xs font-bold text-gray-400">sans-serif</span>
                </div>
                <p className="font-sans text-xl font-black text-black tracking-tight">Inter</p>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Default body typography used for ocean parameters readouts, recent logs comments list, table coordinates, filter selections, and technical charts.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black uppercase font-primary">Secondary Font</span>
                  <span className="text-xs font-bold text-gray-400 font-primary">Montserrat</span>
                </div>
                <p className="font-['Montserrat'] text-xl font-black text-black tracking-tight">Montserrat</p>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Branded font used exclusively for massive hero titles, primary spot indicators, uppercase promotional cards, and section divisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CORE UI COMPONENTS (SAAS & RAID PAGE SPECIFIC) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Sliders className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-['Montserrat'] text-[16px] font-black text-black uppercase tracking-widest">3. SaaS Component Replica Grid</h2>
            </div>
            <span className="text-[9px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-200">Interactive Demos</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            
            {/* Column A: Interactive Mockup of a Live BeachCard */}
            <div className="bg-[#f8f8f8] p-6 rounded-[2rem] border border-[#e8e8e8] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-black/10 pb-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">SaaS Live Asset Replica</span>
                  <h3 className="text-sm font-black uppercase tracking-wide text-black">Interactive BeachCard</h3>
                </div>
                
                {/* Content Gating Toggle Control */}
                <button 
                  onClick={() => setIsCardGated(!isCardGated)}
                  className={`h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    isCardGated 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <LockIcon className="w-2.5 h-2.5" />
                  <span>Content Gating: {isCardGated ? "Gated" : "Public"}</span>
                </button>
              </div>

              {/* The Mocked Beach Card Container */}
              <div className="relative group bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_4px_-1px_rgba(0,0,0,0.02)] border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md w-full p-5">
                
                {/* Gated Overlay Cover */}
                {isCardGated && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] transition-all p-4 select-none">
                    <div className="bg-white rounded-2xl px-4 py-3 border border-blue-100 shadow-xl flex flex-col items-center gap-2 max-w-[240px] text-center">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <LockIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest font-primary">Premium Content Gated</span>
                      <p className="text-[9px] text-gray-400 font-medium">This is a Premium Hidden Gem break. Unlock to access coordinates, live ratings and recent logs.</p>
                      <button className="w-full py-1.5 bg-black text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
                        Upgrade to Premium
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Beach Title & Tags Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-base font-bold text-slate-900 font-sans transition-all ${isCardGated ? "blur-[6px] select-none" : ""}`}>
                          Swartkop Point Reef
                        </h4>
                        
                        {/* Custom Gold Hidden Gem Badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          isCardGated 
                            ? "bg-blue-50 text-blue-600 border-blue-100" 
                            : "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_0_10px_-2px_rgba(79,70,229,0.2)]"
                        }`}>
                          <Sparkle className="w-2.5 h-2.5 mr-1 fill-current" />
                          Hidden Gem
                        </span>
                      </div>

                      {/* Geographic coordinates */}
                      <div className={`flex items-center gap-1 text-[11px] font-medium text-gray-500 ${isCardGated ? "blur-[5px] select-none" : ""}`}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>Port Elizabeth, Eastern Cape • 14.2km away</span>
                      </div>
                    </div>

                    {/* Quick Maps and Intel Buttons */}
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100">
                        <Compass className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center hover:bg-indigo-100 text-indigo-600">
                        <Sparkles className="w-4 h-4 fill-indigo-600/10" />
                      </button>
                    </div>
                  </div>

                  {/* Suitability Rating Section */}
                  <div className="flex items-center gap-3">
                    <div className={isCardGated ? "blur-[6px] opacity-35" : ""}>
                      <BlueStarRatingMock rating={4} />
                    </div>
                    <div className={`px-2 py-1 rounded-lg border border-gray-100 bg-slate-50 text-[10px] font-bold text-slate-800 ${isCardGated ? "blur-[6px] opacity-35" : ""}`}>
                      🤙 Good Outlook
                    </div>
                  </div>

                  {/* Swell Deductions List */}
                  <div className={`space-y-1.5 ${isCardGated ? "blur-[6px] opacity-35" : ""}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-3 rounded-full bg-red-400 shrink-0" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Wind: Gusty Onshores (-0.8 Rating)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-3 rounded-full bg-red-400 shrink-0" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Period: Short Swell (-0.4 Rating)</span>
                    </div>
                  </div>

                  {/* Featured Latest Log Widget */}
                  <div className={`border border-amber-200 bg-amber-500/[0.04] rounded-xl p-3 space-y-2 mt-4 relative ${isCardGated ? "blur-[6px] opacity-35" : ""}`}>
                    <div className="flex justify-between items-center text-[9px] font-black text-amber-800/60 uppercase tracking-wider">
                      <span>Latest Surf Log</span>
                      <span>Today 08:30</span>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <div className="relative w-12 h-12 rounded-lg bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                        <Play className="w-4 h-4 text-amber-700 fill-current opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <BlueStarRatingMock rating={3} />
                          <span className="text-[9px] text-gray-400 font-bold">/ 5.0</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-900 uppercase">James Peterson</p>
                        <p className="text-[9px] text-gray-500 font-medium italic truncate">"Solid offshore barrels breaking nicely on the mid-tide!"</p>
                      </div>
                    </div>
                  </div>

                  {/* Optimal Conditions Collapsible checklist */}
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <button 
                      onClick={() => setShowMockIdealConditions(!showMockIdealConditions)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all active:scale-95"
                    >
                      <span>Conditions Spec</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMockIdealConditions ? "rotate-180" : ""}`} />
                    </button>

                    {showMockIdealConditions && (
                      <div className="grid grid-cols-1 gap-2.5 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {[
                          { label: "Optimal Wind", value: "South East / East", isMet: true },
                          { label: "Optimal Swell", value: "South West (180° - 220°)", isMet: true },
                          { label: "Wave Size Limit", value: "2.0m - 4.5m (Height Met: 2.3m)", isMet: true },
                          { label: "Swell Period Limit", value: "12s - 18s (Period Met: 14s)", isMet: true },
                          { label: "Wind Velocity Limit", value: "<15kts (Speed Met: 12kts)", isMet: true }
                        ].map((c, i) => (
                          <div key={i} className="flex items-center gap-2.5 animate-in slide-in-from-left-1 duration-300">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                              c.isMet ? "border-green-200 bg-green-50 text-green-600" : "border-red-200 bg-red-50 text-red-600"
                            }`}>
                              {c.isMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-0.5">{c.label}</span>
                              <span className="text-[11px] font-bold text-slate-800 leading-none">{c.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Tag Category Indicator */}
                <div className="absolute bottom-3 right-4">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                    Reef Break
                  </span>
                </div>

              </div>
            </div>

            {/* Column B: SaaS Active Filters & Badges Lists */}
            <div className="space-y-6">
              
              {/* Filter Tabs */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Dynamic Control States</span>
                  <h3 className="text-xs font-black uppercase tracking-wide text-black font-primary">Filter Selection Tabs</h3>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block font-primary">SaaS Navigation link (.link-nav)</label>
                    <div className="flex gap-4 border-b border-gray-100 pb-2">
                      <button 
                        onClick={() => setActiveFilterTab("all")}
                        className={activeFilterTab === "all" ? "link-nav-active" : "link-nav"}
                      >
                        All Breaks
                      </button>
                      <button 
                        onClick={() => setActiveFilterTab("gems")}
                        className={activeFilterTab === "gems" ? "link-nav-active" : "link-nav"}
                      >
                        Gems
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block font-primary">Active Filter Buttons (.btn-filter-active / .btn-filter-inactive)</label>
                    <div className="flex flex-wrap gap-2.5">
                      <button className="btn-filter-active shadow-sm font-semibold">Active Tag</button>
                      <button className="btn-filter-inactive font-medium">Inactive Tag</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Badges */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Visual Parameters</span>
                  <h3 className="text-xs font-black uppercase tracking-wide text-black font-primary">Forecast Badges</h3>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block font-primary">Wind Velocity Badge (.badge-wind)</label>
                    <div className="badge-wind">
                      <span>💨 14kts</span>
                      <span className="ml-1 opacity-70 font-semibold uppercase font-primary">SSW</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block font-primary">Swell Magnitude Badge (.badge-swell)</label>
                    <div className="badge-swell">
                      <span>🌊 2.4m</span>
                      <span className="ml-1 opacity-70 font-semibold font-primary">@15s SW</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block font-primary">Status General Badge (.badge-generic)</label>
                    <div className="badge-generic">
                      <span className="font-semibold">Incoming Mid-Tide</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block font-primary">Tide Raider Custom Badge (.badge-active / .badge-inactive)</label>
                    <div className="flex gap-2">
                      <div className="badge badge-active shadow-sm font-bold">Gold Active</div>
                      <div className="badge badge-inactive font-bold">Gold Inactive</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 4. PREMIUM INTERACTIONS & DYNAMIC CSS ANIMATION LAB */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-['Montserrat'] text-[16px] font-black text-black uppercase tracking-widest">4. Interaction & CSS Animation Lab</h2>
            </div>
            <span className="text-[9px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-200">Live Anim Tester</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dark Theme Glassmorphism Widget */}
            <div className="bg-brand-dark p-6 rounded-3xl space-y-4 flex flex-col justify-between h-[280px]">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#60a5fa] animate-pulse">Ensemble Signal</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_2px_rgba(34,197,94,0.6)]" />
                </div>
                <h3 className="font-['Montserrat'] text-lg font-black text-white tracking-tight mt-3 text-brand-gradient">
                  Glassmorphism Surface
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-2 font-primary">
                  Translucent backdrop container with fine light borders (`.bg-brand-dark`), glowing signals, and gradient textual outlines (`.text-brand-gradient`).
                </p>
                <div className="mt-3 py-1.5 px-2.5 bg-white/5 border border-white/10 rounded-lg w-fit text-[10px] font-mono text-gray-300">
                  box-shadow: 0 8px 32px rgba(0,0,0,0.4)
                </div>
              </div>
              <div className="text-[9px] font-bold tracking-[0.15em] text-gray-500 uppercase font-primary">
                Tide Raider Black Ops v2.0
              </div>
            </div>

            {/* Neon Text Glow Alert Box */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="inline-flex px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600">
                  Interactive Neon Glow
                </div>
                <h3 className="font-['Montserrat'] text-lg font-black text-black tracking-tight mt-3">
                  Text Shadow Glow
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                  Uses text shadow layers mapped to primary branding colors (`.neon-text`) to emulate severe alerts, weather warnings, or priority conditions status indicators.
                </p>
              </div>
              <div className="text-sm font-black text-indigo-600 neon-text uppercase tracking-widest flex items-center gap-1.5 animate-neon-pulse font-primary">
                <Flame className="w-4 h-4 fill-current" />
                CRITICAL SWELL INCOMING
              </div>
            </div>

            {/* Interactive Testing Sandbox Component */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="inline-flex px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600">
                  Animation Sandbox Lab
                </div>
                <h3 className="font-['Montserrat'] text-lg font-black text-black tracking-tight mt-3">
                  Dynamic Class Tester
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                  Click on the buttons below to dynamically attach classes and test each Tide Raider custom CSS animation state on the wave element below.
                </p>
              </div>

              {/* Sandbox Target Element */}
              <div className="flex items-center gap-4 py-2 border-t border-gray-50">
                <div className={`w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-md ${activeAnimation || ""}`}>
                  <Waves className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Active Anim Class</span>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold truncate">
                    {activeAnimation || "static-idle-state"}
                  </span>
                </div>
              </div>

              {/* Interactive buttons */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {[
                  { label: "Cartoon Bounce", css: "animate-bounce-cartoon" },
                  { label: "Water Float", css: "animate-water-surface" },
                  { label: "Wave Pulse", css: "wave-pulse" },
                  { label: "Neon Pulse", css: "animate-neon-pulse" }
                ].map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveAnimation(activeAnimation === a.css ? null : a.css)}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
                      activeAnimation === a.css 
                        ? "bg-indigo-600 text-white shadow-sm font-primary" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600 font-primary"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 5. DESIGN SYSTEM METRICS AND GRID ALIGNMENT */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Info className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-['Montserrat'] text-[16px] font-black text-black uppercase tracking-widest">5. Spacing Scale & Metrics</h2>
            </div>
            <span className="text-[9px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-200">Layout Specifications</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="font-['Montserrat'] text-sm font-black uppercase tracking-wider text-black">Base-20 Layout Spacing Scale</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Tide Raider follows a strict base-20 modular layout scaling system for grid margins, column gaps, and widget gutters.
              </p>
              <div className="space-y-1.5 pt-2 font-primary">
                <TableSpecRow label="Spacing Extra Small (xs)" code="4px (--spacing-xs)" description="Micro alignment, border paddings, indicator margin gaps." />
                <TableSpecRow label="Spacing Small (sm)" code="8px (--spacing-sm)" description="Grid row padding gaps, label tag heights, flex separations." />
                <TableSpecRow label="Spacing Medium (md)" code="20px (--spacing-md)" description="Core card internal padding, sidebars column padding grids." />
                <TableSpecRow label="Spacing Large (lg)" code="40px (--spacing-lg)" description="Dashboard sections margins, main headers separations." />
                <TableSpecRow label="Spacing Extra Large (xl)" code="60px (--spacing-xl)" description="Main Hero header banner tops, huge landing sections gaps." />
                <TableSpecRow label="Spacing 2X Large (2xl)" code="80px (--spacing-2xl)" description="Extreme page top margins, massive container buffers." />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="font-['Montserrat'] text-sm font-black uppercase tracking-wider text-black">Typography Metrics Specifications</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed font-primary">
                Visual guidelines governing line-heights, letter spacing trackings, and relative font sizes across templates.
              </p>
              <div className="space-y-1.5 pt-2 font-primary">
                <TableSpecRow label="Font Weight Normal" code="400 (--font-weight-normal)" description="Default weight mapping out comments list, readouts descriptions." />
                <TableSpecRow label="Font Weight Semibold" code="500 (--font-weight-bold)" description="Default headings titles weight and tags labels emphasis." />
                <TableSpecRow label="Font Weight Bold" code="600 (--font-weight-heading)" description="Heavy weight mapped to primary titles and strong parameters values." />
                <TableSpecRow label="Line Height Headings" code="1.2 (--line-height-tight)" description="Extremely tight relative leading reserved strictly for headings." />
                <TableSpecRow label="Line Height Body Text" code="1.5 (--line-height-normal)" description="Extended readable leading mapping out multi-line descriptive text." />
                <TableSpecRow label="Elevated Shadow Medium" code="0 4px 6px -1px rgba(0, 0, 0, 0.1)" description="Used on popup filter dialogs, menus indicators, active states." />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER METRICS COMPLIANCE */}
        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 gap-4 font-primary">
           <span>Tide Raider Spec System • Design Guidelines Compliant</span>
           <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm text-green-600 font-black">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Compliant & Production Ready</span>
           </div>
        </div>

      </div>
    </div>
  );
}
