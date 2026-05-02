"use client";

import { useState, useEffect } from "react";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { getBackendUrl } from "@/app/lib/api-config";
import * as Avatar from "@radix-ui/react-avatar";
import { Button } from "@/app/components/ui/Button";
import Textarea from "@/app/components/ui/textarea";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
}

export default function CommentThread({ logEntryId }: { logEntryId: string }) {
  const { data: session, status: authStatus, refetch: refetchAuth } = useBackendAuth();
  const user = session?.user;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  // Handle auth loading timeout
  useEffect(() => {
    if (authStatus === "loading") {
      const timeout = setTimeout(() => {
        setAuthTimeout(true);
      }, 5000); // 5 second timeout
      return () => clearTimeout(timeout);
    } else {
      setAuthTimeout(false);
    }
  }, [authStatus]);

  useEffect(() => {
    fetchComments();
  }, [logEntryId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/comments?entityId=${logEntryId}&entityType=LogEntry`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newComment,
          entityId: logEntryId,
          entityType: "LogEntry",
        }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-tertiary)] opacity-30" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex space-x-6 p-8 bg-white/[0.03] border border-white/5 rounded-3xl transition-all hover:bg-white/5 hover:border-white/10 group"
            >
              <Avatar.Root className="h-14 w-14 rounded-full overflow-hidden border-2 border-white/5 flex-shrink-0 group-hover:border-[var(--color-tertiary)]/30 transition-all duration-500">
                <Avatar.Image
                  src={comment.user?.image || ""}
                  alt={comment.user?.name || "Anonymous"}
                  className="h-full w-full object-cover"
                />
                <Avatar.Fallback className="h-full w-full flex items-center justify-center bg-[var(--color-tertiary)]/10 text-[var(--color-tertiary)] font-black text-xl">
                  {(comment.user?.name || "Anonymous")
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "A"}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-primary text-xs font-black text-white/90 tracking-widest uppercase">
                    {comment.user?.name || "Anonymous"}
                  </h4>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    {(() => {
                      try {
                        if (!comment.createdAt) return "Recent";
                        const date = new Date(comment.createdAt);
                        return isNaN(date.getTime()) ? "Recent" : format(date, "MMM d, yyyy");
                      } catch (e) {
                        return "Recent";
                      }
                    })()}
                  </span>
                </div>
                <p className="text-white/60 font-primary text-sm leading-relaxed whitespace-pre-wrap selection:bg-[var(--color-tertiary)]/30">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 px-8 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white/[0.01]">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/5">
            <span className="text-3xl opacity-20">💬</span>
          </div>
          <p className="text-white/20 font-primary font-black text-[10px] uppercase tracking-[0.3em]">Quiet on the front lines.</p>
        </div>
      )}

      {authStatus === "loading" && !authTimeout ? (
        <div className="bg-white/5 p-12 rounded-3xl text-center border border-white/5">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-tertiary)] mx-auto opacity-20" />
        </div>
      ) : authStatus === "authenticated" ? (
        <form onSubmit={handleSubmit} className="mt-16 space-y-6 pt-10 border-t border-white/5">
          <div className="relative group">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Contribute to the intelligence pool..."
              className="min-h-[160px] font-primary bg-black/60 border-white/5 focus:border-[var(--color-tertiary)]/30 focus:ring-1 focus:ring-[var(--color-tertiary)]/20 rounded-3xl p-6 text-white/90 placeholder:text-white/10 transition-all duration-500"
              disabled={isSubmitting}
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-tertiary)]/[0.02] to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="tertiary"
              className="px-12 py-3 rounded-full font-primary font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-[var(--color-tertiary)]/5 border border-[var(--color-tertiary)]/20 hover:border-[var(--color-tertiary)]/50 transition-all duration-500"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-3 w-3 animate-spin" />
                  Transmitting...
                </>
              ) : (
                "Post Intel"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white/[0.02] p-12 rounded-3xl flex flex-col items-center justify-center text-center border border-white/5 gap-6 mt-16">
          <div className="space-y-2">
            <p className="text-white/40 font-primary font-black text-[10px] uppercase tracking-[0.2em]">
              Authorization Required for Intel Sharing
            </p>
            <p className="text-white/10 text-[9px] font-bold uppercase tracking-widest">
              Please sign in to contribute to the discussion
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              variant="tertiary"
              className="w-full rounded-full font-primary font-black uppercase tracking-[0.2em] text-[10px] py-4"
              onClick={() => {
                const backendUrl = getBackendUrl();
                window.location.href = `${backendUrl}/api/auth/google?state=${encodeURIComponent(window.location.href)}`;
              }}
            >
              Sign In with Google
            </Button>
            
            <button 
              onClick={() => refetchAuth()}
              className="text-white/20 hover:text-white/40 text-[9px] font-bold uppercase tracking-widest transition-colors py-2"
            >
              Already signed in? Verify Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
