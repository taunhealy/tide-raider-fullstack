"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { countries } from "countries-list";
import { MoreVertical, User, Image as ImageIcon, Check, Loader2, X, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";

type CountryWithEmoji = {
  name: string;
  emoji: string;
};

interface ProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
  nationalitySelector: React.ReactNode;
  fallbackStyles?: string;
  refetchProfile?: () => void;
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🏴‍☠️";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function ProfileHeaderContent({
  userId,
  isOwnProfile,
  nationalitySelector,
  refetchProfile,
}: ProfileHeaderProps) {
  const queryClient = useQueryClient();
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ["profileHeader", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}/profile`);
      if (!res.ok) {
        if (res.status === 501) {
          return null;
        }
        throw new Error("Failed to fetch profile data");
      }
      return res.json();
    },
    retry: false,
  });

  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Modals editing states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingFlag, setIsEditingFlag] = useState(false);
  
  // Inputs states
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editFlagSearch, setEditFlagSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync edit state values on load
  useEffect(() => {
    if (userData) {
      setEditUsername(userData.name || "");
      setEditAvatarUrl(userData.image || "");
    }
  }, [userData]);

  if (isLoading) {
    return (
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!userData && !isLoading) {
    return (
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-tertiary)] text-white flex items-center justify-center font-medium text-xl">
          ?
        </div>
        <div>
          <h1 className="text-2xl font-bold font-primary">User</h1>
          <p className="text-sm text-gray-500 mt-1">Profile data unavailable</p>
        </div>
      </div>
    );
  }

  const displayName = userData?.name || "Anonymous";

  const avatarFallback = (
    <div className="w-20 h-20 rounded-full bg-[var(--color-tertiary)] text-white flex items-center justify-center font-medium text-xl border border-gray-300">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );

  const countryList = Object.entries(countries).map(([code, data]) => ({
    code,
    name: data.name,
    emoji: getFlagEmoji(code),
  }));

  const handleUpdateProfile = async (fields: { name?: string; image?: string }) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!response.ok) throw new Error("Failed to save changes");

      toast.success("Identity updated successfully!");
      setIsEditingUsername(false);
      setIsEditingAvatar(false);
      
      // Invalidate queries to refresh view
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      if (refetchProfile) refetchProfile();
      window.dispatchEvent(new CustomEvent("auth-refresh"));
    } catch (err: any) {
      toast.error("Failed to update profile", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNationality = async (countryCode: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/user/${userId}/nationality`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationality: countryCode }),
      });

      if (!response.ok) throw new Error("Failed to save flag emoji");

      toast.success("Flag emoji updated successfully!");
      setIsEditingFlag(false);
      
      // Invalidate queries to refresh view
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      if (refetchProfile) refetchProfile();
      window.dispatchEvent(new CustomEvent("auth-refresh"));
    } catch (err: any) {
      toast.error("Failed to update flag", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-4 mb-6 relative">
      <div className="w-20 h-20 relative rounded-full overflow-hidden border border-gray-300 shrink-0">
        {userData?.image && !imageError ? (
          <Image
            src={userData.image}
            alt={`${displayName}'s avatar`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          avatarFallback
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold font-primary truncate max-w-[180px]">
            {isOwnProfile ? (
              displayName
            ) : (
              <Link
                href={`/profile/${userId}`}
                className="hover:text-[var(--color-tertiary)] transition-colors"
              >
                {displayName}
              </Link>
            )}
          </h1>
          
          <div className="flex items-center gap-1 shrink-0">
            {nationalitySelector}
            
            {/* 3-Dots Action Menu for the owner */}
            {isOwnProfile && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 rounded-full hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Profile options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditingUsername(true);
                        }}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 uppercase tracking-widest"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Edit Username
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditingAvatar(true);
                        }}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 uppercase tracking-widest"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        Edit Avatar
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditingFlag(true);
                        }}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 uppercase tracking-widest"
                      >
                        <span className="text-[14px]">🏴‍☠️</span>
                        Edit Flag Emoji
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-1">
          {userData?.nationality ? (
            <>
              From{" "}
              {
                (countries as Record<string, { name: string }>)[
                  userData.nationality
                ]?.name
              }{" "}
              {getFlagEmoji(userData.nationality)}
            </>
          ) : (
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">
              🏴‍☠️ Ghost Operator
            </span>
          )}
        </div>

        {userData?.link && (
          <div className="mt-1">
            <a
              href={userData.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-tertiary)] hover:underline text-sm font-semibold truncate block max-w-[200px]"
            >
              {userData.link.replace(/(^\w+:|^)\/\//, "")}
            </a>
          </div>
        )}
      </div>

      {/* Edit Username Modal */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Update Username</h3>
              <button 
                onClick={() => setIsEditingUsername(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">New Username</label>
                <Input 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                  className="h-12 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-bold placeholder:text-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditingUsername(false)}
                  className="flex-1 h-12 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateProfile({ name: editUsername })}
                  disabled={isSaving || !editUsername.trim()}
                  className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Avatar Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Update Avatar Image</h3>
              <button 
                onClick={() => setIsEditingAvatar(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Avatar Image URL</label>
                <Input 
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://image-link.com/avatar.jpg"
                  className="h-12 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-bold placeholder:text-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditingAvatar(false)}
                  className="flex-1 h-12 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateProfile({ image: editAvatarUrl })}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flag Emoji Modal */}
      {isEditingFlag && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Select Flag Emoji</h3>
              <button 
                onClick={() => setIsEditingFlag(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input 
                value={editFlagSearch}
                onChange={(e) => setEditFlagSearch(e.target.value)}
                placeholder="Search countries..."
                className="h-10 pl-9 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-bold placeholder:text-slate-300"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1 py-1 custom-scrollbar">
              <button
                onClick={() => handleUpdateNationality("")}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors text-xs font-bold text-slate-700"
              >
                <span className="text-lg">🏴‍☠️</span>
                <span>Ghost Operator (Pirate Flag)</span>
                {!userData?.nationality && <Check className="ml-auto w-4 h-4 text-indigo-500" />}
              </button>

              {countryList
                .filter((c) => c.name.toLowerCase().includes(editFlagSearch.toLowerCase()))
                .map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleUpdateNationality(c.code)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors text-xs font-bold text-slate-700"
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <span>{c.name}</span>
                    {userData?.nationality === c.code && <Check className="ml-auto w-4 h-4 text-indigo-500" />}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileHeader(props: ProfileHeaderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      }
    >
      <ProfileHeaderContent {...props} />
    </Suspense>
  );
}
