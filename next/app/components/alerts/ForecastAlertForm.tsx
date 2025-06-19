"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { LogEntry } from "@/app/types/raidlogs";
import {
  ForecastProperty,
  NotificationMethod,
  AlertProperty,
  CreateAlertInput,
} from "@/app/types/alerts";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/Button";

import { toast } from "sonner";
import { Search, StarIcon, X, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/app/components/ui/skeleton";
import { ScrollArea } from "@/app/components/ui/scrollarea";
import { AlertConfig } from "@/app/types/alerts";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Checkbox } from "@/app/components/ui/checkbox";
import { BasicSelect, BasicOption } from "@/app/components/ui/basicselect";
import { useRouter } from "next/navigation";
import { AlertConfiguration } from "@/app/components/alerts/AlertConfiguration";
import { degreesToCardinal } from "@/app/lib/forecastUtils";
import { Slider } from "@/app/components/ui/slider";
import { StarRatingSelector } from "@/app/components/alerts/starRatingSelector";

import { useDebounce } from "@/app/hooks/useDebounce";

import * as React from "react";
import { AlertProvider, useAlert } from "@/app/context/AlertContext";
import { cardinalToDegreesMap } from "@/app/lib/directionUtils";
import { AlertType } from "@prisma/client";
import { Prisma, Alert } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface ForecastAlertFormProps {
  logEntry?: LogEntry | null;
  existingAlert?: Prisma.AlertCreateInput;
}

const forecastProperties = [
  { id: "windSpeed" as ForecastProperty, name: "Wind Speed", unit: "knots" },
  {
    id: "windDirection" as ForecastProperty,
    name: "Wind Direction",
    unit: "°",
  },
  { id: "swellHeight" as ForecastProperty, name: "Swell Height", unit: "m" },
  { id: "swellPeriod" as ForecastProperty, name: "Swell Period", unit: "s" },
  {
    id: "swellDirection" as ForecastProperty,
    name: "Swell Direction",
    unit: "°",
  },
] as const;

type PropertyUpdateAction = {
  index: number;
  key: "property" | "range" | "optimalValue";
  value: ForecastProperty | number;
};

const getPropertyConfig = (propertyId: string) => {
  const configs = {
    windSpeed: { maxRange: 15, step: 1, unit: "knots" },
    windDirection: { maxRange: 45, step: 1, unit: "°" },
    swellHeight: { maxRange: 2, step: 0.1, unit: "m" },
    swellPeriod: { maxRange: 5, step: 0.1, unit: "s" },
    swellDirection: { maxRange: 45, step: 1, unit: "°" },
    waveHeight: { maxRange: 1, step: 0.1, unit: "m" },
    wavePeriod: { maxRange: 4, step: 0.1, unit: "s" },
    temperature: { maxRange: 5, step: 0.1, unit: "°C" },
  };

  return (
    configs[propertyId as keyof typeof configs] || {
      maxRange: 10,
      step: 0.1,
      unit: "",
    }
  );
};

function usePropertyManager(
  initialProperties: Prisma.AlertPropertyCreateInput[]
) {
  const [properties, setProperties] =
    useState<Prisma.AlertPropertyCreateInput[]>(initialProperties);

  const updateProperty = useCallback(
    ({
      index,
      key,
      value,
    }: {
      index: number;
      key: "property" | "range" | "optimalValue";
      value: ForecastProperty | number;
    }) => {
      setProperties((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [key]: value,
        };
        return updated;
      });
    },
    []
  );

  const removeProperty = useCallback((index: number) => {
    setProperties((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const addProperty = useCallback(() => {
    const usedProperties = new Set(properties.map((p) => p.property));
    const availableProperty =
      forecastProperties.find((p) => !usedProperties.has(p.id))?.id ||
      "windSpeed";

    setProperties((prev) => [
      ...prev,
      {
        property: availableProperty,
        range: getPropertyConfig(availableProperty).step * 10,
        optimalValue: 0,
        alert: { connect: { id: "" } },
      },
    ]);
  }, [properties]);

  return {
    properties,
    updateProperty,
    removeProperty,
    addProperty,
    setProperties,
  };
}

type AlertCreationMode = "logEntry" | "beachVariables";

export default function ForecastAlertForm({
  logEntry,
  existingAlert,
}: ForecastAlertFormProps) {
  const router = useRouter();

  const onClose = () => {
    router.push("/alerts"); // Adjust this path as needed
  };

  return (
    <AlertProvider existingAlert={existingAlert} onClose={onClose}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <AlertFormHeader />
        <AlertFormBody logEntry={logEntry} />
        <AlertFormFooter />
      </div>
    </AlertProvider>
  );
}

function AlertFormHeader() {
  const { alert } = useAlert();

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold font-primary text-[var(--color-primary)]">
        {alert.id ? "Edit Alert" : "Create New Alert"}
      </h1>
      <p className="font-primary text-gray-600 mt-2">
        {alert.id
          ? "Modify your alert settings below"
          : "Configure your new alert settings"}
      </p>
    </div>
  );
}

function AlertFormBody({ logEntry }: { logEntry?: LogEntry | null }) {
  const { alert, updateAlert, mode, setMode, beachDetails } = useAlert();
  const { data: beaches } = useQuery({
    queryKey: ["beaches", alert.region?.connect?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/beaches?regionId=${alert.region?.connect?.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
    enabled: !!alert.region?.connect?.id,
  });

  return (
    <div className="space-y-8">
      {/* Alert Name */}
      <div className="space-y-4">
        <Label>Alert Name</Label>
        <Input
          value={alert.name}
          onChange={(e) => updateAlert({ name: e.target.value })}
          className="font-primary"
          placeholder="Enter alert name..."
        />
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
        <button
          onClick={() => setMode("logEntry")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded",
            mode === "logEntry" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          )}
        >
          From Log Entry
        </button>
        <button
          onClick={() => setMode("beachVariables")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded",
            mode === "beachVariables"
              ? "bg-white shadow-sm"
              : "hover:bg-gray-50"
          )}
        >
          Beach Variables
        </button>
      </div>

      {/* Alert Type Selection */}
      <div className="space-y-4">
        <Label>Alert Type</Label>
        <RadioGroup
          value={alert.alertType}
          onValueChange={(value: AlertType) =>
            updateAlert({ alertType: value })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AlertType.VARIABLES} />
            <Label>Set Forecast Variables</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={AlertType.RATING} />
            <Label>Set Star Rating</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Beach Selection for Beach Variables mode */}
      {mode === "beachVariables" && (
        <div className="space-y-4">
          <Label>Select Beach</Label>
          <Select
            onValueChange={(beachId: string) =>
              updateAlert({ region: { connect: { id: beachId } } })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Search beaches..." />
            </SelectTrigger>
            <SelectContent>
              {beaches?.map((beach: { id: string; name: string }) => (
                <SelectItem key={beach.id} value={beach.id}>
                  {beach.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Properties Configuration */}
      {alert.alertType === AlertType.VARIABLES && beachDetails && (
        <AlertConfiguration />
      )}

      {/* Star Rating Selection */}
      {alert.alertType === AlertType.RATING && (
        <div className="space-y-4">
          <Label>Minimum Star Rating</Label>
          <StarRatingSelector
            value={alert.starRating ?? 3}
            onChange={(rating) => updateAlert({ starRating: rating })}
          />
        </div>
      )}
    </div>
  );
}

function AlertFormFooter() {
  const { alert, createAlert, updateAlertMutation, onClose } = useAlert();
  const router = useRouter();

  const handleSave = async () => {
    if (!alert.name || !alert.region?.connect?.id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (alert.id) {
        await updateAlertMutation.mutateAsync({
          ...alert,
          beach: alert.beach?.connect?.id
            ? { connect: { id: alert.beach.connect.id } }
            : { disconnect: true },
          forecast: alert.forecast?.connect?.id
            ? { connect: { id: alert.forecast.connect.id } }
            : { disconnect: true },
        });
      } else {
        await createAlert.mutateAsync({
          ...alert,
          beach: alert.beach?.connect?.id
            ? { connect: { id: alert.beach.connect.id } }
            : undefined,
          forecast: alert.forecast?.connect?.id
            ? { connect: { id: alert.forecast.connect.id } }
            : undefined,
        });
      }

      toast.success("Alert saved successfully");
      router.push("/alerts"); // Adjust this path as needed
    } catch (error) {
      toast.error("Failed to save alert");
    }
  };

  return (
    <div className="flex justify-end space-x-2 mt-8 border-t pt-6">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save Alert</Button>
    </div>
  );
}
