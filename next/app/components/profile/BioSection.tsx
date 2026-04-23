"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Textarea from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/Button";
import { Mail, MessageSquare, Globe, User } from "lucide-react";

interface BioSectionProps {
  initialBio?: string;
  initialLink?: string;
  initialEmail?: string;
  initialWhatsappNumber?: string;
  isOwnProfile: boolean;
  userId: string;
  className?: string;
}

export default function BioSection({
  initialBio = "",
  initialLink = "",
  initialEmail = "",
  initialWhatsappNumber = "",
  isOwnProfile,
  userId,
  className,
}: BioSectionProps) {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async ({ bio, link, email, whatsappNumber }: { bio: string; link: string; email: string; whatsappNumber: string }) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, link, email, whatsappNumber }),
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
        email: newData.email,
        whatsappNumber: newData.whatsappNumber,
      }));
      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["user", userId], context?.previousData);
      toast.error("Failed to save profile");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
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
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Tactical Identity</h3>
        </div>

        <div className="space-y-4">
           <div>
             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">About Operator</label>
             {isOwnProfile ? (
               <Textarea
                 value={initialBio}
                 onChange={(e) =>
                   queryClient.setQueryData(["user", userId], (old: any) => ({
                     ...old,
                     bio: e.target.value,
                   }))
                 }
                 placeholder="Operator specializations, experience, equipment..."
                 className="min-h-[120px] bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all"
               />
             ) : (
               <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-50 italic">
                 {initialBio || "No tactical background provided."}
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
                      value={initialEmail}
                      onChange={(e) =>
                        queryClient.setQueryData(["user", userId], (old: any) => ({
                          ...old,
                          email: e.target.value,
                        }))
                      }
                      className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                      placeholder="email@tideraider.com"
                    />
                  ) : (
                    <div className="pl-12 py-3 text-slate-600 font-medium">{initialEmail || "Encrypted"}</div>
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
                      value={initialWhatsappNumber}
                      onChange={(e) =>
                        queryClient.setQueryData(["user", userId], (old: any) => ({
                          ...old,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                      placeholder="+27..."
                    />
                  ) : (
                    <div className="pl-12 py-3 text-slate-600 font-medium">{initialWhatsappNumber ? "Active Relay" : "Offline"}</div>
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
                    value={initialLink}
                    onChange={(e) =>
                      queryClient.setQueryData(["user", userId], (old: any) => ({
                        ...old,
                        link: e.target.value,
                      }))
                    }
                    className="pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                    placeholder="https://yourwebsite.com"
                  />
                ) : initialLink ? (
                  <a
                    href={initialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pl-12 py-3 block text-indigo-600 font-bold hover:underline"
                  >
                    {initialLink.replace(/(^\w+:|^)\/\//, "")}
                  </a>
                ) : (
                  <div className="pl-12 py-3 text-slate-400 italic">No external link provided.</div>
                )}
              </div>
           </div>
        </div>

        {isOwnProfile && (
          <div className="flex justify-end pt-4">
            <Button
              onClick={() =>
                updateProfileMutation.mutate({
                  bio: initialBio,
                  link: initialLink,
                  email: initialEmail,
                  whatsappNumber: initialWhatsappNumber,
                })
              }
              disabled={updateProfileMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 transition-all active:scale-95"
            >
              {updateProfileMutation.isPending ? "Synchronizing..." : "Update Identity"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
