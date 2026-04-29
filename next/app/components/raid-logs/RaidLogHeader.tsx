"use client";

import { Waves } from "lucide-react";
import { Button } from "../ui/Button";
import { LogVisibilityToggle } from "../LogVisibilityToggle";
import { useRouter } from "next/navigation";

interface User {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  hasActiveTrial?: boolean;
}

interface HeaderProps {
  isPrivate: boolean;
  onPrivateToggle: () => void;
  onFilterOpen: () => void;
  session: { user: User | null } | null;
}

export function Header({
  isPrivate,
  onPrivateToggle,
  onFilterOpen,
  session,
}: HeaderProps) {
  const router = useRouter();

  const handlePostClick = () => {
    // Redirect to /raidlogs/new page
    router.push("/raidlogs/new");
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Condition Monitor</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Raid Sessions
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Recent surf logs and community intelligence.
        </p>
      </div>
      <div className="flex flex-row gap-3 md:gap-4 items-center w-full md:w-auto">
        <LogVisibilityToggle isPrivate={isPrivate} onChange={onPrivateToggle} />
        <Button
          size="sm"
          className="whitespace-nowrap hover:bg-gray-50 transition-colors"
          onClick={handlePostClick}
        >
          Post
        </Button>
        <Button
          onClick={onFilterOpen}
          variant="outline"
          size="sm"
          className="inline-flex hover:bg-gray-50 transition-colors"
        >
          Filter
        </Button>
      </div>
    </div>
  );
}
