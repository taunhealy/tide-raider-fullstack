"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Textarea from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/Button";
import { Mail, MessageSquare, Globe, User, Instagram } from "lucide-react";

interface BioSectionProps {
  initialBio?: string;
  initialLink?: string;
  initialInstagram?: string;
  initialEmail?: string;
  initialWhatsappNumber?: string;
  initialName?: string;
  isOwnProfile: boolean;
  userId: string;
  className?: string;
}

export default function BioSection({
  initialBio = "",
  initialLink = "",
  initialInstagram = "",
  initialEmail = "",
  initialWhatsappNumber = "",
  initialName = "",
  isOwnProfile,
  userId,
  className,
}: BioSectionProps) {
  const queryClient = useQueryClient();
  
  // Use local state to manage input values and avoid cursor jumping issues
  const [bio, setBio] = useState(initialBio || "");
  const [link, setLink] = useState(initialLink || "");
  const [instagram, setInstagram] = useState(initialInstagram || "");
  const [email, setEmail] = useState(initialEmail || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber || "");
  const [name, setName] = useState(initialName || "");

  // Sync local state when initial values change (e.g. after a successful mutation or refetch)
  useEffect(() => {
    setBio(initialBio || "");
  }, [initialBio]);

  useEffect(() => {
    setLink(initialLink || "");
  }, [initialLink]);
  
  useEffect(() => {
    setInstagram(initialInstagram || "");
  }, [initialInstagram]);

  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  useEffect(() => {
    setWhatsappNumber(initialWhatsappNumber || "");
  }, [initialWhatsappNumber]);

  useEffect(() => {
    setName(initialName || "");
  }, [initialName]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ 
      bio: newBio, 
      link: newLink, 
      instagram: newInstagram,
      email: newEmail, 
      whatsappNumber: newWhatsappNumber,
      name: newName
    }: { 
      bio: string; 
      link: string; 
      instagram: string;
      email: string; 
      whatsappNumber: string;
      name: string;
    }) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          bio: newBio, 
          link: newLink, 
          instagram: newInstagram,
          email: newEmail, 
          whatsappNumber: newWhatsappNumber,
          name: newName
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });
      const previousData = queryClient.getQueryData(["user", userId]);
      queryClient.setQueryData(["user", userId], (old: any) => ({
        ...old,
        bio: newData.bio,
        link: newData.link,
        instagram: newData.instagram,
        email: newData.email,
        whatsappNumber: newData.whatsappNumber,
        name: newData.name,
      }));
      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["user", userId], context?.previousData);
      toast.error("Failed to save profile");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileHeader", userId] });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      // Dispatch auth-refresh event to sync session/auth state
      window.dispatchEvent(new CustomEvent("auth-refresh"));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    },
  });

  return (
    <div className={`space-y-8 max-w-2xl ${className || ""}`}>
      {/* Identity Block */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
           <User className="w-5 h-5 text-slate-400" />
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Identity</h3>
        </div>

        <div className="space-y-4">
           {/* Username / Handle Field */}
           <div>
             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Operator Handle (Username)</label>
             {isOwnProfile ? (
               <Input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="Enter username..."
                 className="bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all font-bold"
               />
             ) : (
               <p className="text-slate-900 font-bold bg-slate-50 px-6 py-3 rounded-xl border border-slate-50">
                 {name || "Anonymous"}
               </p>
             )}
           </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Operator Title / Role</label>
              {isOwnProfile ? (
                <Input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Surf Instructor, Foam Hunter, Wave Photographer..."
                  className="bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all font-bold"
                />
              ) : (
                <p className="text-slate-900 font-bold bg-slate-50 px-6 py-3 rounded-xl border border-slate-50 italic">
                  {bio || "Operator"}
                </p>
              )}
            </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Deployment Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  {isOwnProfile ? (
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                      placeholder="email@tideraider.com"
                    />
                  ) : (
                    <div className="pl-12 py-3 text-slate-400 font-medium italic">Secured Signal</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">WhatsApp Relay</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  {isOwnProfile ? (
                    <Input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                      placeholder="+27..."
                    />
                  ) : (
                    <div className="pl-12 py-3 text-slate-400 font-medium italic">Relay Restricted</div>
                  )}
                </div>
              </div>
           </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">External Signal (Website)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {isOwnProfile ? (
                  <Input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                    placeholder="https://yourwebsite.com"
                  />
                ) : link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pl-12 py-3 block text-indigo-600 font-bold hover:underline"
                  >
                    {link.replace(/(^\w+:|^)\/\//, "")}
                  </a>
                ) : (
                  <div className="pl-12 py-3 text-slate-400 italic">No external link provided.</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Instagram Signal</label>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {isOwnProfile ? (
                  <Input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                    placeholder="@username"
                  />
                ) : instagram ? (
                  <a
                    href={`https://instagram.com/${instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pl-12 py-3 block text-indigo-600 font-bold hover:underline"
                  >
                    {instagram.startsWith("@") ? instagram : `@${instagram}`}
                  </a>
                ) : (
                  <div className="pl-12 py-3 text-slate-400 italic">No Instagram link provided.</div>
                )}
              </div>
            </div>
        </div>

        {isOwnProfile && (
          <div className="flex justify-end pt-4">
            <Button
              onClick={() =>
                updateProfileMutation.mutate({
                  bio,
                  link,
                  instagram,
                  email,
                  whatsappNumber,
                  name,
                })
              }
              disabled={updateProfileMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {updateProfileMutation.isPending ? "Synchronizing..." : "Update Identity"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
