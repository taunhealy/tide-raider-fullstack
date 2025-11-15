"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertConfig, AlertConfigTypes } from "@/app/types/alerts";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { StarRatingSelector } from "@/app/components/alerts/starRatingSelector";
import { AlertConfiguration } from "@/app/components/alerts/AlertConfiguration";
import { AlertProvider, useAlert } from "@/app/context/AlertContext";
import { Prisma, AlertType } from "@prisma/client";

interface AlertEditFormProps {
  initialAlert: AlertConfig;
}

export function AlertEditForm({ initialAlert }: AlertEditFormProps) {
  const router = useRouter();
  const [alertConfig, setAlertConfig] =
    useState<AlertConfigTypes>(initialAlert);
  const [alertType, setAlertType] = useState<"variables" | "rating">(
    (initialAlert.alertType?.toLowerCase() as "variables" | "rating") ||
      "variables"
  );
  const [starRating, setStarRating] = useState(initialAlert.starRating || 3);

  // Transform AlertConfig to Prisma AlertCreateInput format
  const prismaAlert = useMemo<Prisma.AlertCreateInput>(() => {
    return {
      name: initialAlert.name,
      notificationMethod: initialAlert.notificationMethod,
      contactInfo: initialAlert.contactInfo,
      active: initialAlert.active,
      alertType: initialAlert.alertType as AlertType,
      starRating: initialAlert.starRating,
      forecastDate: initialAlert.forecastDate,
      region: {
        connect: { id: initialAlert.regionId },
      },
      user: {
        connect: { id: initialAlert.userId },
      },
      properties: {
        create: initialAlert.properties.map((prop) => ({
          property: prop.property,
          optimalValue: prop.optimalValue,
          range: prop.range,
        })),
      },
      ...(initialAlert.logEntryId && {
        logEntry: {
          connect: { id: initialAlert.logEntryId },
        },
      }),
      ...(initialAlert.forecastId && {
        forecast: {
          connect: { id: initialAlert.forecastId },
        },
      }),
    };
  }, [initialAlert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Transform data for API - extract only the fields needed
      const apiData = {
        name: alertConfig.name,
        regionId: alertConfig.regionId,
        forecastDate: alertConfig.forecastDate,
        properties: alertConfig.properties.map((prop) => ({
          property: prop.property,
          optimalValue: prop.optimalValue,
          range: prop.range,
        })),
        notificationMethod: alertConfig.notificationMethod,
        contactInfo: alertConfig.contactInfo,
        active: alertConfig.active,
        alertType: alertType === "variables" ? "VARIABLES" : "RATING",
        starRating: alertType === "rating" ? starRating : null,
        logEntryId: alertConfig.logEntryId,
      };

      const response = await fetch(`/api/alerts/${initialAlert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update alert");
      }

      toast.success("Alert updated successfully");
      router.push("/alerts");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update alert"
      );
      console.error(error);
    }
  };

  // Transform logEntry to match LogEntry type if it exists
  const logEntry = useMemo(() => {
    if (!initialAlert.logEntry) return null;
    // The logEntry from Prisma should already match the LogEntry type
    return initialAlert.logEntry as any;
  }, [initialAlert.logEntry]);

  return (
    <AlertProvider
      existingAlert={prismaAlert}
      logEntry={logEntry}
      onClose={() => {}}
    >
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

          {/* Show log entry info if it exists */}
          {initialAlert.logEntry && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <Label>Associated Log Entry</Label>
              <div className="text-sm space-y-2">
                {(initialAlert.logEntry as any).beach?.name && (
                  <p>
                    <strong>Beach:</strong>{" "}
                    {(initialAlert.logEntry as any).beach.name}
                  </p>
                )}
                {(initialAlert.logEntry as any).region?.name && (
                  <p>
                    <strong>Region:</strong>{" "}
                    {(initialAlert.logEntry as any).region.name}
                  </p>
                )}
                {(initialAlert.logEntry as any).forecast && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1">Forecast Conditions:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      {(initialAlert.logEntry as any).forecast.windSpeed !==
                        undefined && (
                        <li>
                          Wind:{" "}
                          {(initialAlert.logEntry as any).forecast.windSpeed}{" "}
                          kts
                        </li>
                      )}
                      {(initialAlert.logEntry as any).forecast.windDirection !==
                        undefined && (
                        <li>
                          Wind Direction:{" "}
                          {
                            (initialAlert.logEntry as any).forecast
                              .windDirection
                          }
                          °
                        </li>
                      )}
                      {(initialAlert.logEntry as any).forecast.swellHeight !==
                        undefined && (
                        <li>
                          Swell Height:{" "}
                          {(initialAlert.logEntry as any).forecast.swellHeight}m
                        </li>
                      )}
                      {(initialAlert.logEntry as any).forecast.swellPeriod !==
                        undefined && (
                        <li>
                          Swell Period:{" "}
                          {(initialAlert.logEntry as any).forecast.swellPeriod}s
                        </li>
                      )}
                      {(initialAlert.logEntry as any).forecast
                        .swellDirection !== undefined && (
                        <li>
                          Swell Direction:{" "}
                          {
                            (initialAlert.logEntry as any).forecast
                              .swellDirection
                          }
                          °
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
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
