"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertConfig, AlertConfigTypes } from "@/app/types/alerts";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { StarRatingSelector } from "@/app/components/alerts/starRatingSelector";
import { AlertConfiguration } from "@/app/components/alerts/AlertConfiguration";
import { AlertProvider } from "@/app/context/AlertContext";

interface AlertEditFormProps {
  initialAlert: AlertConfig;
}

export function AlertEditForm({ initialAlert }: AlertEditFormProps) {
  const router = useRouter();
  const [alertConfig, setAlertConfig] =
    useState<AlertConfigTypes>(initialAlert);
  const [alertType, setAlertType] = useState<"variables" | "rating">(
    initialAlert.alertType || "variables"
  );
  const [starRating, setStarRating] = useState(initialAlert.starRating || 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/alerts/${initialAlert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...alertConfig,
          alertType,
          starRating: alertType === "rating" ? starRating : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      toast.success("Alert updated successfully");
      router.push("/alerts");
    } catch (error) {
      toast.error("Failed to update alert");
      console.error(error);
    }
  };

  return (
    <AlertProvider existingAlert={initialAlert} onClose={() => {}}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Alert Name</Label>
            <Input
              id="name"
              value={alertConfig.name}
              onChange={(e) =>
                setAlertConfig({ ...alertConfig, name: e.target.value })
              }
              className="font-primary bg-white border-gray-200 focus:border-[var(--color-tertiary)]"
              placeholder="Enter alert name..."
            />
          </div>

          <div className="space-y-4">
            <Label>Alert Type</Label>
            <RadioGroup
              value={alertType}
              onValueChange={(value: "variables" | "rating") =>
                setAlertType(value)
              }
              className="grid gap-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200">
                <RadioGroupItem value="variables" id="variables" />
                <Label
                  htmlFor="variables"
                  className="font-primary cursor-pointer"
                >
                  Set Forecast Variables
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200">
                <RadioGroupItem value="rating" id="rating" />
                <Label htmlFor="rating" className="font-primary cursor-pointer">
                  Set Star Rating
                </Label>
              </div>
            </RadioGroup>
          </div>

          {alertType === "variables" && (
            <div className="mt-6">
              <AlertConfiguration isEmbedded={true} />
            </div>
          )}

          {alertType === "rating" && (
            <div className="space-y-4">
              <Label>Minimum Star Rating</Label>
              <StarRatingSelector value={starRating} onChange={setStarRating} />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white"
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/alerts")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </AlertProvider>
  );
}
