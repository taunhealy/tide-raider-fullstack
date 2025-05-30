"use client";

import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { Favorite } from "@/app/types/favorites";

export default function UserFavouriteSurfVideosList() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/favorites/me");
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
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/favorites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      setFavorites(favorites.filter((fav) => fav.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Favourite Surf Videos</h3>
      <div className="overflow-hidden border rounded-lg">
        {loading ? (
          <div className="p-4">
            <Skeleton count={3} height={40} className="mb-2" />
          </div>
        ) : favorites.length > 0 ? (
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              {favorites.map((favorite) => (
                <tr key={favorite.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {favorite.title}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={favorite.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-bg-tertiary)] hover:underline text-sm"
                    >
                      View Video
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(favorite.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-600">No favorites added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
