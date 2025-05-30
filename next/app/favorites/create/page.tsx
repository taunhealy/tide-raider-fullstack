"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function CreateFavoritePage() {
  const { status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", videoLink: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success("Favourite added successfully!", {
          description: "Your surf video has been saved to your favourites",
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        const redirectTo =
          new URLSearchParams(window.location.search).get("from") || "/";
        setTimeout(() => router.push(redirectTo), 2000);
      } else {
        const errorData = await response.json();
        toast.error("Failed to save favourite", {
          description: errorData.error || "Please try again later",
        });
      }
    } catch (error) {
      toast.error("Submission failed", {
        description: "Network error occurred. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] p-9 font-primary">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-9">
          <h1 className="heading-5 mb-9">Add Favorite Surf Video</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-small font-medium block mb-2">
                Video Title
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-tertiary)] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-small font-medium block mb-2">
                Video URL
              </label>
              <input
                type="url"
                required
                value={form.videoLink}
                onChange={(e) =>
                  setForm({ ...form, videoLink: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-tertiary)] focus:border-transparent transition-all"
                placeholder="https://youtube.com/..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--color-tertiary)] text-white py-3 px-6 rounded-lg hover:bg-[var(--color-tertiary)]/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                "Add Favorite"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
