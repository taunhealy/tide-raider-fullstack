"use client";

import { useParams } from "next/navigation";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import UserNotFound from "@/app/components/UserNotFound";
import BioSection from "@/app/components/profile/BioSection";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import RippleLoader from "@/app/components/ui/RippleLoader";
import Image from "next/image";
import { urlForImage } from "@/app/lib/urlForImage";
import { groq } from "next-sanity";
import { client } from "@/app/lib/sanity";
import NationalitySelector from "@/app/components/profile/NationalitySelector";
import { Shield, MapPin, Zap, Calendar } from "lucide-react";
import { formatDate } from "@/app/lib/utils";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: session } = useBackendAuth();
  const [avatarUrl, setAvatarUrl] = useState("");

  const {
    data: userData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const { data: sanityData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return client.fetch(groq`*[_type == "profile"][0] {
        heroImage {
          image {
            asset->
          },
          alt
        }
      }`);
    },
  });

  const updateNationality = async (countryCode: string) => {
    try {
      const res = await fetch(`/api/user/${userId}/nationality`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nationality: countryCode }),
      });
      if (!res.ok) throw new Error("Failed to update nationality");

      await refetch();
      window.location.reload();
    } catch (error) {
      console.error("Failed to update nationality:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
        <RippleLoader isLoading={true} />
      </div>
    );
  }

  if (error || !userData) return <UserNotFound />;

  const isOwnProfile = session?.user?.id?.toString() === userId;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-primary">
      {/* Tactical Header Banner */}
      <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-slate-900">
        {sanityData?.heroImage?.image ? (
          <Image
            src={urlForImage(sanityData.heroImage.image)?.url() || ""}
            alt={sanityData?.heroImage?.alt || "Tactical Background"}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Operator Summary */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm text-center">
              <ProfileHeader
                userId={userId}
                isOwnProfile={isOwnProfile}
                nationalitySelector={
                  <NationalitySelector
                    currentFlag={userData.nationality}
                    isOwnProfile={isOwnProfile}
                    onSelect={updateNationality}
                  />
                }
              />
              
              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-900">Operational</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Armory</p>
                  <div className="flex items-center justify-center gap-1.5 text-slate-900">
                    <Zap className="w-3.5 h-3.5 text-brand-3 fill-brand-3/20" />
                    <span className="text-sm font-bold">{userData.credits || 0} Credits</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                 <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Joined {formatDate(userData.createdAt)}</span>
                 </div>
                 <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Verified Operator</span>
                 </div>
              </div>
            </div>

            {/* Quick Stats / Achievements */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-200">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Mission Stats</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">Total Logs</span>
                    <span className="text-lg font-black">{userData?._count?.logEntries || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">Total AI Reports</span>
                    <span className="text-lg font-black">{userData?._count?.intelligenceReports || 0}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                     <div className="h-full bg-brand-3 w-3/4 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Elite Tier Progression</p>
               </div>
            </div>
          </div>

          {/* Right Column: Profile Identity Settings */}
          <div className="lg:flex-1">
             <div className="bg-white border border-slate-200 rounded-[40px] p-2 shadow-sm min-h-[600px] flex flex-col">
                <div className="p-8 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Operator Profile</h2>
                  <p className="text-slate-500 font-medium">Configure your tactical metadata and deployment settings.</p>
                </div>
                
                <div className="flex-1 p-2">
                  <BioSection
                    className="p-6"
                    initialBio={userData?.bio}
                    initialLink={userData?.link}
                    initialEmail={userData?.email}
                    initialWhatsappNumber={userData?.whatsappNumber}
                    isOwnProfile={isOwnProfile}
                    userId={userId}
                  />
                </div>
             </div>
          </div>
        </div>
      </div>
      
      <div className="h-20" />
    </div>
  );
}
