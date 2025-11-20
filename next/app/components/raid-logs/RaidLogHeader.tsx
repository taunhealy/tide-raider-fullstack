"use client";

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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
      <div className="w-full border-b border-gray-200 pb-3 sm:border-0 sm:pb-0">
        <h2 className="text-xl sm:text-2xl font-semibold font-primary">
          Raid Sessions
        </h2>
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
