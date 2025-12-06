"use client";

import HiddenGemForm from "@/app/components/hidden-gems/HiddenGemForm";
import Link from "next/link";

export default function CreateHiddenGemPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* Header */}
      <header className="bg-brand-dark sticky top-0 z-40 mb-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
                <Link href="/hidden-gems" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white font-primary">
                        Back to Hidden Gems
                    </h1>
                </div>
            </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12">
        <HiddenGemForm />
      </div>
    </div>
  );
}
