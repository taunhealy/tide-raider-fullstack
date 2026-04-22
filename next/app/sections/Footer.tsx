"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Daily Raid", href: "/raid" },
        { label: "Global Map", href: "/map" },
        { label: "Pricing", href: "/pricing" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="relative bg-gray-900 pt-24 pb-12 overflow-hidden font-primary">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full translate-y-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24 mb-20">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border-[3px] border-white flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--color-tertiary)] overflow-hidden relative bg-black/40">
                {/* Parallel Swell Lines Surge */}
                <svg className="w-full h-full p-2 animate-swell-set" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M-10 15C10 15 20 25 30 45C40 65 60 75 80 75" stroke="white" strokeWidth="7" strokeLinecap="round" className="opacity-40" />
                  <path d="M0 25C20 25 30 35 40 55C50 75 70 85 90 85" stroke="white" strokeWidth="7" strokeLinecap="round" className="opacity-40" />
                  <path d="M10 35C30 35 40 45 50 65C60 85 80 95 100 95" stroke="white" strokeWidth="7" strokeLinecap="round" className="opacity-40" />
                  <path d="M-20 5C0 5 10 15 20 35C30 55 50 65 70 65" stroke="white" strokeWidth="7" strokeLinecap="round" className="opacity-40" />
                  <path d="M-30 -5C-10 -5 0 5 10 25C20 45 40 55 60 55" stroke="white" strokeWidth="7" strokeLinecap="round" className="opacity-40" />
                </svg>
                
                {/* Subtle Center Dot */}
                <div className="absolute w-1 h-1 bg-white/20 rounded-full" />
              </div>
              <span className="text-xl font-black text-white uppercase tracking-tighter">Tide Raider</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Level up your sessions with data-driven break intel. We track world-class spots to ensure you're always in the right place at the right time.
            </p>
            <div className="flex gap-4">
              <span className="text-[10px] font-black text-brand-3 uppercase tracking-[0.2em]">Go Further</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-6">
                <h6 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-30">{section.title}</h6>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1 h-px bg-white/0 group-hover:bg-white/40 group-hover:w-3 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Intelligence Trial Column */}
          <div className="md:col-span-4 space-y-6">
            <h6 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-30">Strategic AI</h6>
            <p className="text-sm font-bold text-gray-400">
               Test our AI Surf Reporting for Muizenberg. Real-time data, synthesized instantly.
            </p>
            <Link 
              href="/raid?beachId=muizenberg-beach&report=latest"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-100 active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              Test AI Intelligence
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8 text-[10px] font-black text-white/30 uppercase tracking-[0.1em]">
            <span>© {currentYear} Tide Raider</span>
            <div className="hidden md:block w-px h-3 bg-white/10" />
            <a 
              href="https://www.kealogic.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              Built by Kea Logic
            </a>
          </div>
          
          <div className="flex gap-4">
             <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">v2.4.0 Global</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
