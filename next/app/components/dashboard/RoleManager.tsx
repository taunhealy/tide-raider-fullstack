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
    return <div className="font-primary">Loading user information...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-primary text-lg font-medium">Manage Roles</h3>

      <div className="grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map((role) => (
          <label
            key={role.value}
            className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              value={role.value}
              checked={roles.includes(role.value as UserRole)}
              onChange={(e) => {
                if (e.target.checked) {
                  setRoles([...roles, role.value as UserRole]);
                } else {
                  setRoles(roles.filter((r) => r !== role.value));
                }
              }}
              className="rounded border-gray-300"
            />
            <span className="font-primary text-[14px]">{role.label}</span>
          </label>
        ))}
      </div>

      <Button
        onClick={handleUpdate}
        disabled={isUpdating || !currentUserId}
        isLoading={isUpdating}
        variant="outline"
        size="default"
      >
        {isUpdating ? "Updating..." : "Update Roles"}
      </Button>
    </div>
  );
}
