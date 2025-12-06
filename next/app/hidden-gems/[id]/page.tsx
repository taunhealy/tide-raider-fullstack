"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Beach } from "@/app/types/beaches";

// Extended type for Hidden Gem to include specific fields
interface HiddenGem extends Beach {
  submittedBy?: {
    name: string;
    image: string;
  };
  images: string[]; // Override optional string in Beach
  createdAt: string;
  viewCount: number;
  crowdLevel?: string;
  sharkRisk?: string;
}

export default function HiddenGemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [gem, setGem] = useState<HiddenGem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);

  useEffect(() => {
    const fetchGem = async () => {
      try {
        const res = await fetch(`/api/hidden-gems/${id}`);
        if (!res.ok) throw new Error("Hidden Gem not found");
        const data = await res.json();
        setGem(data);
        
        // Set initial active media
        if (data.images && data.images.length > 0) {
            setActiveMedia({ type: 'image', url: data.images[0] });
        } else if (data.videos && data.videos.length > 0) {
            setActiveMedia({ type: 'video', url: data.videos[0].url });
        }
      } catch (err) {
        setError("Failed to load Hidden Gem");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error || !gem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] text-white">
        <h1 className="text-2xl font-bold mb-4">{error || "Not Found"}</h1>
        <Link href="/hidden-gems" className="text-brand-primary hover:underline">
          Back to Hidden Gems
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-12">
      {/* Header */}
      <header className="bg-brand-dark sticky top-0 z-40 mb-0 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
               <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                   </svg>
               </button>
               <h1 className="text-xl font-bold text-white">{gem.name}</h1>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-gray-400">
               <span>{gem.location}</span>
               {gem.region && <span>• {gem.region.name}</span>}
           </div>
        </div>
      </header>
      
      {/* Media Player / Gallery */}
      <div className="bg-black/50 aspect-video w-full max-h-[70vh] relative flex items-center justify-center overflow-hidden">
        {activeMedia?.type === 'video' ? (
            <video 
                src={activeMedia.url} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
            />
        ) : activeMedia?.type === 'image' ? (
            <Image 
                src={activeMedia.url} 
                alt={gem.name} 
                fill 
                className="object-contain"
                priority
            />
        ) : (
             <div className="text-gray-500">No Media Available</div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="max-w-7xl mx-auto px-4 mt-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {/* Videos */}
            {gem.videos?.map((video: any, idx: number) => (
                <button 
                    key={`vid-${idx}`}
                    onClick={() => setActiveMedia({ type: 'video', url: video.url })}
                    className={`relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeMedia?.url === video.url ? 'border-brand-primary' : 'border-transparent'}`}
                >
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                         {/* Thumbnail placeholder or video preview */}
                         <span className="text-white text-xs">Video {idx + 1}</span>
                    </div>
                     <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg className="w-8 h-8 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M8 5v14l11-7z"/>
                        </svg>
                     </div>
                </button>
            ))}
            
            {/* Images */}
            {gem.images?.map((img: string, idx: number) => (
                 <button 
                    key={`img-${idx}`}
                    onClick={() => setActiveMedia({ type: 'image', url: img })}
                    className={`relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeMedia?.url === img ? 'border-brand-primary' : 'border-transparent'}`}
                 >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                 </button>
            ))}
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-gray-200">
         {/* Main Details */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-brand-dark/50 p-6 rounded-xl border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-4">About the Spot</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{gem.description}</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-brand-dark/50 p-4 rounded-xl border border-gray-800 text-center">
                    <div className="text-xs text-gray-400 uppercase mb-1">Wave Type</div>
                    <div className="font-semibold text-white">{gem.waveType?.replace(/_/g, " ")}</div>
                </div>
                <div className="bg-brand-dark/50 p-4 rounded-xl border border-gray-800 text-center">
                    <div className="text-xs text-gray-400 uppercase mb-1">Difficulty</div>
                    <div className={`font-semibold ${
                        gem.difficulty === 'EXPERT' ? 'text-red-400' : 
                        gem.difficulty === 'ADVANCED' ? 'text-orange-400' :
                        'text-green-400'
                    }`}>{gem.difficulty}</div>
                </div>
                 <div className="bg-brand-dark/50 p-4 rounded-xl border border-gray-800 text-center">
                    <div className="text-xs text-gray-400 uppercase mb-1">Crowd</div>
                    <div className="font-semibold text-white">{gem.crowdLevel || "Unknown"}</div>
                </div>
                 <div className="bg-brand-dark/50 p-4 rounded-xl border border-gray-800 text-center">
                    <div className="text-xs text-gray-400 uppercase mb-1">Shark Risk</div>
                    <div className="font-semibold text-white">{gem.sharkRisk || "Unknown"}</div>
                </div>
            </div>
         </div>
         
         {/* Sidebar / Sidebar Info */}
         <div className="space-y-6">
            {gem.submittedBy && (
                <div className="bg-brand-dark/50 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                        {gem.submittedBy.image ? (
                            <Image src={gem.submittedBy.image} alt={gem.submittedBy.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">?</div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Discovered by</div>
                        <div className="font-bold text-white">{gem.submittedBy.name}</div>
                    </div>
                </div>
            )}
            
            {/* Map (Placeholder) */}
            <div className="bg-gray-800 h-64 rounded-xl flex items-center justify-center text-gray-500">
                Map View Component Here
            </div>
         </div>
      </div>
    </div>
  );
}
