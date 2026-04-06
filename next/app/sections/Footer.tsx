"use client";

import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

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
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                <div className="w-5 h-5 bg-gray-900 rounded-md" />
              </div>
              <span className="text-xl font-black text-white uppercase tracking-tighter">Tide Raider</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Level up your sessions with data-driven break intel. We track world-class spots to ensure you're always in the right place at the right time.
            </p>
            <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Global Sync Active</span>
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

          {/* Newsletter Column */}
          <div className="md:col-span-4 space-y-6">
            <h6 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-30">Newsletter</h6>
            <p className="text-sm font-bold text-gray-400">
              Get weekly intel on upcoming swells and new spots.
            </p>
            <form className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Secure email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-16 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-white text-gray-900 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
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
