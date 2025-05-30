"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Favorite } from "@/app/types/favorites";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Image from "next/image";

export default function FavouriteSurfVideosSidebar({
  userId,
  className
}: {
  userId?: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(
    null
  );
  const [editingFavorite, setEditingFavorite] = useState<Favorite | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const url = `/api/favorites${userId ? `?userId=${userId}` : ""}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setFavorites(data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  const handleDeleteFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setFavorites(favorites.filter((f) => f.id !== favoriteId));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEditFavorite = async (
    favoriteId: string,
    updatedData: { title: string; videoLink: string }
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Failed to update");

      setFavorites(
        favorites.map((f) =>
          f.id === favoriteId ? { ...f, ...updatedData } : f
        )
      );

      toast.success("Favourite Updated", {
        description: "Your changes have been saved successfully",
      });
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Update Failed", {
        description: "Could not save changes. Please try again.",
      });
    } finally {
      setIsUpdating(false);
      setEditingFavorite(null);
    }
  };

  const truncateString = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-[540px] ${className}`}>
      <div className="p-6 border-b border-gray-200 ">
        <div className="flex justify-between items-left ">
          <h6 className="text-base font-medium text-gray-900 font-primary max-w-[32ch]">
            Favourite Surf Travel Vids
          </h6>
          <Link
            href={`/favorites/create?from=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
            className="flex items-center justify-center h-[40px] text-small bg-[var(--color-bg-tertiary)] text-white px-4 py-2 rounded-md hover:opacity-90"
          >
            Post
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
        ) : favorites.length > 0 ? (
          <table className="w-full">
            <tbody>
              {favorites.map((favorite) => (
                <tr
                  key={favorite.id}
                  className="group relative hover:bg-gray-50 cursor-pointer font-primary"
                  onClick={() => setSelectedFavorite(favorite)}
                >
                  <td className="p-4 text-sm text-gray-600 w-full">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        {favorite.user?.image ? (
                          <Image
                            src={favorite.user.image}
                            alt={favorite.user?.name || "User avatar"}
                            width={24}
                            height={24}
                            className="rounded-full w-6 h-6 object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">?</span>
                          </div>
                        )}
                        {favorite.user?.name ? (
                          <Link
                            href={`/profile/${favorite.userId}`}
                            className="hover:text-[var(--color-bg-tertiary)] transition-colors text-xs font-medium"
                          >
                            {favorite.user.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <span className="text-[var(--color-primary)] font-medium font-primary text-[12px] font-regular leading-tight max-w-[80ch] bg-gray-50 rounded-md py-2 px-3">
                        {truncateString(favorite.title, 120)}
                      </span>
                    </div>
                  </td>
                  {session?.user?.id === favorite.userId && (
                    <td className="p-4 w-[100px] flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFavorite(favorite);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFavorite(favorite.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-start p-6">
            <p className="text-small font-primary text-gray-800 mb-4">
              No Favourites Yet 🌊
            </p>
            <p className="text-small font-primary text-gray-600">
              Share your favourite surf videos with the community
            </p>
          </div>
        )}
      </div>

      {/* Custom Modal */}
      {selectedFavorite && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="heading-6 font-primary text-gray-900">
                {selectedFavorite.title}
              </h3>
              <button
                onClick={() => setSelectedFavorite(null)}
                className="text-gray-400 font-primary hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {selectedFavorite.videoLink && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      selectedFavorite.videoLink.includes("youtu.be/")
                        ? selectedFavorite.videoLink.split("youtu.be/")[1]
                        : selectedFavorite.videoLink
                            .split("v=")[1]
                            ?.split("&")[0]
                    }`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-primary text-gray-600">
                  Posted by:{" "}
                  {selectedFavorite.user?.name ? (
                    <Link
                      href={`/profile/${selectedFavorite.userId}`}
                      className="hover:text-[var(--color-bg-tertiary)] transition-colors"
                    >
                      {selectedFavorite.user.name}
                    </Link>
                  ) : (
                    "Anonymous"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingFavorite && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6 font-primary">
            <h3 className="heading-6 mb-4">Edit Favourite</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleEditFavorite(editingFavorite.id, {
                  title: formData.get("title") as string,
                  videoLink: formData.get("videoLink") as string,
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Title
                  </label>
                  <input
                    name="title"
                    defaultValue={editingFavorite.title}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Video URL
                  </label>
                  <input
                    name="videoLink"
                    type="url"
                    defaultValue={editingFavorite.videoLink}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingFavorite(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-tertiary)] text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                    disabled={isUpdating}
                  >
                    {isUpdating && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
