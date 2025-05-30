"use client";

import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardTabs } from "@/app/components/ui/dashboardtabs";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@/app/types/ads";
import { AdCard } from "@/app/components/advertising/AdCard";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/Button";

export default function ManageAdsPage() {
  const [activeTab, setActiveTab] = useState("ads");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/ads");
    }
  }, [status, router]);

  const tabs = [
    { id: "ads", label: "Active Ads" },
    { id: "analytics", label: "Analytics" },
  ];

  // Fetch user's ads with React Query
  const { data: adsData, isLoading } = useQuery({
    queryKey: ["userAds"],
    queryFn: async () => {
      const response = await fetch("/api/user/ads");
      if (!response.ok) throw new Error("Failed to fetch ads");
      return response.json();
    },
    enabled: !!session?.user,
  });

  const ads = adsData?.ads || [];
  const pendingRequests = adsData?.pendingRequests || 0;

  if (status === "loading" || isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Your Ads</h1>
        <Link href="/advertising">
          <Button variant="outline">Create New Ad</Button>
        </Link>
      </div>

      <DashboardTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "ads" && (
        <>
          {pendingRequests > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have {pendingRequests} pending ad{" "}
                    {pendingRequests === 1 ? "request" : "requests"}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad: Ad) => (
                <div key={ad.id} className="relative">
                  <Link href={`/dashboard/ads/${ad.id}`}>
                    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                      <AdCard ad={ad} />
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="flex justify-between items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ad.status === "active"
                                ? "bg-green-100 text-green-800"
                                : ad.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {ad.status.charAt(0).toUpperCase() +
                              ad.status.slice(1)}
                          </span>
                          <Link
                            href={`/dashboard/ads/${ad.id}/edit`}
                            className="text-sm text-gray-400 hover:text-gray-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit Ad
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">No ads yet</h2>
              <p className="text-gray-600 mb-6">
                Start promoting your business with targeted ads!
              </p>
              <Link href="/advertising">
                <Button variant="outline">Create Your First Ad</Button>
              </Link>
            </div>
          )}
        </>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500 mb-2">Total Active Ads</h3>
              <p className="text-3xl font-bold">
                {ads.filter((ad: Ad) => ad.status === "active").length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-500 mb-2">Total Clicks</h3>
              <p className="text-3xl font-bold">
                {ads.reduce(
                  (sum: number, ad: Ad) => sum + (ad._count?.clicks || 0),
                  0
                )}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Performance by Ad</h3>
            {ads.length > 0 ? (
              <div className="space-y-4">
                {ads.map((ad: Ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center justify-between border-b pb-4 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">
                        {ad.title || ad.companyName}
                      </p>
                      <p className="text-sm text-gray-500">{ad.category}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>Clicks: {ad._count?.clicks || 0}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ad.status === "active"
                            ? "bg-green-100 text-green-800"
                            : ad.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No ads to display analytics for
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
