"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RippleLoader from "@/app/components/ui/RippleLoader";

export default function AlertsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/alerts");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <RippleLoader isLoading={true} />
    </div>
  );
}
