"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getBackendUrl } from "@/app/lib/api-config";

interface Partner {
  id: string;
  businessName: string;
  businessLink: string;
  createdAt: string;
}

export default function PartnersShowcase() {
  const { data, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const res = await fetch(`${getBackendUrl()}/api/partners`);
      if (!res.ok) throw new Error("Failed to fetch partners");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary mb-4">OUR PARTNERS</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const partners: Partner[] = data?.partners || [];

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary">OUR PARTNERS</h3>
      </div>

      <div className="space-y-3">
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={partner.businessLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            <span className="text-sm font-medium text-gray-800 group-hover:text-[var(--color-primary)] transition-colors font-primary">
              {partner.businessName}
            </span>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href="/partners"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors font-primary block text-center"
        >
          Become a Partner →
        </Link>
      </div>
    </div>
  );
}
