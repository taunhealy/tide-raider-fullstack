"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { X, Plus } from "lucide-react";

interface SquadMember {
  phoneNumber: string;
  name?: string;
}

interface Squad {
  id: string;
  name: string;
  members: Array<{
    id: string;
    phoneNumber: string;
    name?: string | null;
  }>;
}

interface SquadFormProps {
  squad?: Squad | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SquadForm({
  squad,
  onClose,
  onSuccess,
}: SquadFormProps) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState<SquadMember[]>([
    { phoneNumber: "", name: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (squad) {
      setName(squad.name);
      setMembers(
        squad.members.length > 0
          ? squad.members.map((m) => ({
              phoneNumber: m.phoneNumber,
              name: m.name || "",
            }))
          : [{ phoneNumber: "", name: "" }]
      );
    }
  }, [squad]);

  const addMember = () => {
    setMembers([...members, { phoneNumber: "", name: "" }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof SquadMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // E.164 format: + followed by country code and number
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate
    if (!name.trim()) {
      alert("Please enter a squad name");
      setIsSubmitting(false);
      return;
    }

    const validMembers = members.filter(
      (m) => m.phoneNumber.trim() && validatePhoneNumber(m.phoneNumber.trim())
    );

    if (validMembers.length === 0) {
      alert("Please add at least one valid member with a phone number in E.164 format (e.g., +1234567890)");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        members: validMembers.map((m) => ({
          phoneNumber: m.phoneNumber.trim(),
          name: m.name?.trim() || undefined,
        })),
      };

      const url = squad ? `/api/squads/${squad.id}` : "/api/squads";
      const method = squad ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save squad");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving squad:", error);
      alert(error instanceof Error ? error.message : "Failed to save squad");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-primary font-semibold mb-6 text-[var(--color-text-primary)]">
        {squad ? "Edit Squad" : "Create Squad"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Squad Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekend Warriors"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label>Members</Label>
          <p className="text-sm text-gray-600 mb-3 font-primary">
            Add phone numbers in E.164 format (e.g., +1234567890)
          </p>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Phone (+1234567890)"
                    value={member.phoneNumber}
                    onChange={(e) =>
                      updateMember(index, "phoneNumber", e.target.value)
                    }
                    required
                    pattern="^\+[1-9]\d{1,14}$"
                    title="Phone number must be in E.164 format (e.g., +1234567890)"
                  />
                  <Input
                    placeholder="Name (optional)"
                    value={member.name || ""}
                    onChange={(e) => updateMember(index, "name", e.target.value)}
                  />
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="mt-2 text-red-600 hover:text-red-800 transition-colors"
                    aria-label="Remove member"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addMember}
            className="mt-3 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : squad ? "Update Squad" : "Create Squad"}
          </Button>
        </div>
      </form>
    </div>
  );
}



