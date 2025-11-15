"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import FavouriteSurfVideosSidebar from "@/app/components/FavouriteSurfVideosSidebar";
import UserNotFound from "@/app/components/UserNotFound";
import BioSection from "@/app/components/profile/BioSection";
import { ClientProfileLogs } from "@/app/components/ClientProfileLogs";
import StoriesContainer from "@/app/components/StoriesContainer";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import RippleLoader from "@/app/components/ui/RippleLoader";
import Image from "next/image";
import { urlForImage } from "@/app/lib/urlForImage";
import { groq } from "next-sanity";
import { client } from "@/app/lib/sanity";
import NationalitySelector from "@/app/components/profile/NationalitySelector";

// Server component
export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<
    "account" | "logs" | "chronicles" | "favourites"
  >("account");
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

  const { data } = useQuery({
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

  // Fetch beaches from the database
  const { data: beaches = [] } = useQuery({
    queryKey: ["beaches"],
    queryFn: async () => {
      const res = await fetch("/api/beaches");
      if (!res.ok) throw new Error("Failed to fetch beaches");
      return res.json();
    },
  });

  const updateNationality = async (countryCode: string) => {
    try {
      const res = await fetch(`/api/user/${userId}/nationality`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nationality: countryCode }),
      });
      if (!res.ok) throw new Error("Failed to update nationality");

      // Force a refetch of user data
      await refetch();

      // Force a page refresh
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
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 font-primary">
      <div className="flex flex-col xs:flex-row gap-4 xs:gap-6">
        <div className="flex-1">
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

          <div className="flex gap-2 mb-4 overflow-x-auto px-2">
            <Button
              variant={activeTab === "account" ? "default" : "outline"}
              onClick={() => setActiveTab("account")}
              className="text-sm xs:text-base px-3 py-1.5"
            >
              Profile
            </Button>
            <Button
              variant={activeTab === "favourites" ? "default" : "outline"}
              onClick={() => setActiveTab("favourites")}
              className="text-sm xs:text-base px-3 py-1.5"
            >
              Favourites
            </Button>
            <Button
              variant={activeTab === "logs" ? "default" : "outline"}
              onClick={() => setActiveTab("logs")}
              className="text-sm xs:text-base px-3 py-1.5"
            >
              Logs
            </Button>
            <Button
              variant={activeTab === "chronicles" ? "default" : "outline"}
              onClick={() => setActiveTab("chronicles")}
              className="text-sm xs:text-base px-3 py-1.5"
            >
              Chronicles
            </Button>
          </div>

          <div className="min-h-[300px] w-full overflow-auto">
            {activeTab === "account" && (
              <BioSection
                className="px-2 sm:px-4"
                initialBio={userData?.bio}
                initialLink={userData?.link}
                isOwnProfile={isOwnProfile}
                userId={userId}
              />
            )}

            {activeTab === "favourites" && (
              <FavouriteSurfVideosSidebar
                userId={userId}
                className="px-2 sm:px-4"
              />
            )}

            {activeTab === "logs" && (
              <div className="w-full overflow-x-auto px-2 sm:px-4">
                <ClientProfileLogs beaches={beaches} userId={userId} />
              </div>
            )}

            {activeTab === "chronicles" && (
              <div className="w-full overflow-x-auto px-2 sm:px-4">
                <StoriesContainer beaches={beaches} userId={userId} />
              </div>
            )}
          </div>
        </div>

        {/* Image Column - Only show for Profile and Favourites tabs */}
        {["account", "favourites"].includes(activeTab) && (
          <div className="flex-none w-full xs:w-full sm:w-[400px] lg:w-[500px] relative h-[400px] xs:h-[500px] sm:h-[600px] mt-4 xs:mt-0">
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              {data?.heroImage?.image ? (
                <Image
                  src={
                    urlForImage(data.heroImage.image)?.url() ||
                    "/fallback-image.jpg"
                  }
                  alt={data?.heroImage?.alt || "Profile background"}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 font-primary">
                    No image available
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
