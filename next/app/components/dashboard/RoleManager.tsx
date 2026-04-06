import { useState, useEffect } from "react";
import { UserRole } from "@prisma/client";
import { ROLE_OPTIONS } from "@/app/lib/users/constants";
import { Button } from "@/app/components/ui/Button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface RoleManagerProps {
  userId?: string;
  initialRoles: UserRole[];
  onUpdate?: (roles: UserRole[]) => void;
}

export function RoleManager({
  userId,
  initialRoles = [],
  onUpdate,
}: RoleManagerProps) {
  const [roles, setRoles] = useState<UserRole[]>(initialRoles || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    userId
  );

  console.log("RoleManager Props:", {
    userId,
    initialRoles,
    sessionUserId: session?.user?.id,
  });

  // If userId is not provided, fetch the current user's ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (!userId && session?.user?.email) {
        setIsLoading(true);
        try {
          const response = await fetch("/api/user/current");
          if (response.ok) {
            const data = await response.json();
            if (data.id) {
              setCurrentUserId(data.id);
              console.log("Fetched current user ID:", data.id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch current user ID:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCurrentUserId();
  }, [userId, session]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const response = await fetch(`/api/user/${userId}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update roles");
      }

      toast.success("User roles updated successfully");

      if (onUpdate) {
        onUpdate(roles);
      }
    } catch (error) {
      console.error("Failed to update roles:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update roles"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-6 text-gray-500 font-black uppercase tracking-widest text-xs animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        Decrypting Role Registry...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 bg-[var(--color-tertiary)] shadow-[0_0_8px_var(--color-tertiary)]" />
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Access Grid</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_OPTIONS.map((role) => {
          const isActive = roles.includes(role.value as UserRole);
          return (
            <label
              key={role.value}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer group select-none
                ${isActive 
                  ? "bg-[var(--color-tertiary)]/10 border-[var(--color-tertiary)]/30 shadow-[0_0_20px_rgba(96,165,250,0.05)]" 
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors
                  ${isActive ? "text-[var(--color-tertiary)]" : "text-gray-500"}`}>
                  System Role
                </span>
                <span className={`text-sm font-bold transition-colors
                  ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                  {role.label}
                </span>
              </div>
              
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  value={role.value}
                  checked={isActive}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRoles([...roles, role.value as UserRole]);
                    } else {
                      setRoles(roles.filter((r) => r !== role.value));
                    }
                  }}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-lg border transition-all duration-300 flex items-center justify-center
                  ${isActive 
                    ? "bg-[var(--color-tertiary)] border-[var(--color-tertiary)] shadow-[0_0_10px_var(--color-tertiary)]" 
                    : "bg-black/40 border-white/10 group-hover:border-white/30"
                  }`}>
                  {isActive && (
                    <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <button
        onClick={handleUpdate}
        disabled={isUpdating || !currentUserId}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]
          ${isUpdating 
            ? "bg-white/10 text-gray-500 cursor-not-allowed" 
            : "bg-white text-black hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          }`}
      >
        {isUpdating ? "SYNCING REGISTRY..." : "UPDATE ROLES"}
      </button>
    </div>
  );
}
