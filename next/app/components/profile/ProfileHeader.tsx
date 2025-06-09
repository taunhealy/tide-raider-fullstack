"use client";
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState } from "react";
import { countries } from "countries-list";

type CountryWithEmoji = {
  name: string;
  emoji: string;
};

interface ProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
  nationalitySelector: React.ReactNode;
  fallbackStyles?: string;
}

function getFlagEmoji(countryCode: string) {
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
}: ProfileHeaderProps) {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["profileHeader", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}/profile`);
      if (!res.ok) throw new Error("Failed to fetch profile data");
      return res.json();
    },
  });

  const [imageError, setImageError] = useState(false);

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

  const displayName = userData?.name || "Anonymous";

  const avatarFallback = (
    <div className="w-20 h-20 rounded-full bg-[var(--color-tertiary)] text-white flex items-center justify-center font-medium text-xl">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-20 h-20 relative rounded-full overflow-hidden">
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
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-primary">
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
          {nationalitySelector}
        </div>
        {userData?.nationality && (
          <div className="text-sm text-gray-600 mt-1">
            From{" "}
            {
              (countries as Record<string, { name: string }>)[
                userData.nationality
              ]?.name
            }{" "}
            {getFlagEmoji(userData.nationality)}
          </div>
        )}
        {userData?.link && (
          <div className="mt-1">
            <a
              href={userData.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-tertiary)] hover:underline text-sm"
            >
              {userData.link.replace(/(^\w+:|^)\/\//, "")}
            </a>
          </div>
        )}
      </div>
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
