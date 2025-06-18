"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { LogEntry } from "@/app/types/raidlogs";
import {
  AlertConfigTypes,
  ForecastData,
  ForecastProperty,
  NotificationMethod,
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
import { useMutation, useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  CalendarIcon,
  Bell,
  InfoIcon,
  Search,
  StarIcon,
  X,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
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

interface ForecastAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
  existingAlert?: AlertConfig;
  onSaved?: () => void;
  isNew?: boolean;
  logEntries?: LogEntry[];
  initialMode?: AlertCreationMode;
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

function usePropertyManager(initialProperties: AlertConfigTypes["properties"]) {
  const [properties, setProperties] =
    useState<AlertConfigTypes["properties"]>(initialProperties);

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

type AlertType = "variables" | "rating";
type AlertCreationMode = "logEntry" | "beachVariables";

export default function ForecastAlertModal({
  isOpen = false,
  onClose,
  logEntry,
  existingAlert,
  onSaved,
  isNew,
  logEntries = [],
  initialMode,
}: ForecastAlertModalProps) {
  return (
    <AlertProvider
      existingAlert={existingAlert}
      logEntry={logEntry}
      onSaved={onSaved}
      onClose={onClose}
    >
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
          <AlertModalHeader />
          <AlertModalBody
            logEntries={logEntries}
            logEntry={logEntry}
            isOpen={isOpen}
          />
          <AlertModalFooter />
        </DialogContent>
      </Dialog>
    </AlertProvider>
  );
}

function AlertModalHeader() {
  const { alertConfig, selectedLogEntry, existingAlert } = useAlert();

  return (
    <div className="sticky top-0 z-10 bg-white border-b pb-6">
      <DialogHeader className="px-6 pt-6">
        <DialogTitle className="text-2xl font-bold font-primary text-[var(--color-primary)]">
          {existingAlert ? "Edit Alert" : "Create New Alert"}
        </DialogTitle>
        <DialogDescription className="font-primary text-gray-600 mt-2">
          {existingAlert
            ? "Modify your alert settings below"
            : selectedLogEntry
              ? `Creating alert for ${selectedLogEntry.beachName}`
              : "Select a logged session to create an alert for similar conditions"}
        </DialogDescription>
      </DialogHeader>
    </div>
  );
}

function AlertModalBody({
  logEntries,
  logEntry,
  isOpen,
}: {
  logEntries: LogEntry[];
  logEntry?: LogEntry | null;
  isOpen?: boolean;
}) {
  const {
    creationMode,
    setCreationMode,
    searchTerm,
    setSearchTerm,
    selectedLogEntry,
    setSelectedLogEntry,
    alertConfig,
    setAlertConfig,
    alertType,
    setAlertType,
    starRating,
    setStarRating,
    isFetchingForecast,
    forecastData,
    fetchForecast,
    properties,
    updateProperty,
    removeProperty,
    addProperty,
    getPropertyUnit,
    handleStarRatingChange,
    handleSave,
    beachDetails,
  } = useAlert();

  const { data: userLogEntries, isLoading: isLoadingLogEntries } = useQuery({
    queryKey: ["userLogEntries"],
    queryFn: async () => {
      const response = await fetch("/api/logs");
      if (!response.ok) throw new Error("Failed to fetch log entries");
      return response.json();
    },
    enabled: isOpen && !logEntry,
  });

  const { data: beaches, isLoading: isLoadingBeaches } = useQuery({
    queryKey: ["beaches"],
    queryFn: async () => {
      const response = await fetch("/api/beaches");
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
  });

  const filteredLogEntries = useMemo(() => {
    if (!userLogEntries) return [];
    return userLogEntries.filter(
      (entry: LogEntry) =>
        entry.beachName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userLogEntries, searchTerm]);

  const getDateString = (date: Date | string | undefined): string => {
    if (!date) return "";

    try {
      if (typeof date === "string") {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime())
          ? parsedDate.toISOString().split("T")[0]
          : "";
      } else if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (e) {
      console.error("Invalid date:", date, e);
    }
    return "";
  };

  return (
    <div className="px-6 py-4 space-y-8">
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-primary text-gray-600 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white text-sm mr-2">
              1
            </span>
            Alert Name
          </h3>
          <Input
            value={alertConfig.name || ""}
            onChange={(e) =>
              setAlertConfig({ ...alertConfig, name: e.target.value })
            }
            className="font-primary bg-white border-gray-200 focus:border-[var(--color-tertiary)]"
            placeholder="Enter alert name..."
          />
        </div>

        <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-md">
          <button
            onClick={() => setCreationMode("logEntry")}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded font-primary transition-colors",
              creationMode === "logEntry"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            From Log Entry
          </button>
          <button
            onClick={() => setCreationMode("beachVariables")}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded font-primary transition-colors",
              creationMode === "beachVariables"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Beach Variables
          </button>
        </div>

        {creationMode === "logEntry" ? (
          <div className="space-y-4">
            <div className="space-y-4 mb-5">
              <h3 className="text-lg font-semibold font-primary text-gray-600 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white text-sm mr-2">
                  1
                </span>
                Select Log Entry
              </h3>

              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search your log entries..."
                    className="pl-10 py-2 font-primary bg-white border-gray-200 focus:border-[var(--color-tertiary)] transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {isLoadingLogEntries ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] rounded-lg border border-gray-200">
                  <div className="p-2 space-y-2">
                    {filteredLogEntries.length > 0 ? (
                      filteredLogEntries.map((entry: LogEntry) => (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedLogEntry(entry)}
                          className={cn(
                            "p-4 rounded-lg cursor-pointer transition-all",
                            "hover:bg-gray-50 hover:border-[var(--color-tertiary)]/20",
                            "border",
                            selectedLogEntry?.id === entry.id
                              ? "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5"
                              : "border-gray-200"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium font-primary text-gray-900">
                              {entry.beachName || "Unnamed Beach"}
                            </h4>
                            <span className="text-sm text-gray-500 font-primary">
                              {format(new Date(entry.date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              {entry.region}
                            </span>
                            {entry.surferRating && (
                              <div className="flex items-center gap-0.5">
                                <StarRatingSelector
                                  value={entry.surferRating}
                                  readOnly={true}
                                  onChange={() => {}}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                        <Search className="h-8 w-8 mb-2 text-gray-400" />
                        <p className="font-primary">
                          {searchTerm
                            ? "No matching log entries found"
                            : "No log entries available"}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 font-primary">
                Select Beach
              </label>
              <SearchableSelect
                items={
                  beaches?.map((beach: { name: string; region: string }) => ({
                    value: beach.name,
                    label: beach.name,
                  })) || []
                }
                onSelect={async (value) => {
                  try {
                    // Fetch beach details first
                    const response = await fetch(
                      `/api/beaches/${encodeURIComponent(value)}`
                    );
                    if (!response.ok)
                      throw new Error("Failed to fetch beach details");
                    const beachDetails = await response.json();

                    // Update alert config with beach details and initialize properties
                    setAlertConfig({
                      ...alertConfig,
                      region: value,
                      name: `${value} Alert`,
                      properties: [
                        {
                          property: "windSpeed" as ForecastProperty,
                          range: 2,
                          optimalValue:
                            beachDetails.optimalWindDirections?.[0] || 0,
                        },
                        {
                          property: "windDirection" as ForecastProperty,
                          range: 10,
                          optimalValue:
                            beachDetails.optimalWindDirections?.[0] || 0,
                        },
                        {
                          property: "swellHeight" as ForecastProperty,
                          range: 0.2,
                          optimalValue: beachDetails.swellSize?.optimal || 0,
                        },
                        {
                          property: "swellPeriod" as ForecastProperty,
                          range: 1,
                          optimalValue:
                            ((beachDetails?.idealSwellPeriod?.min ?? 0) +
                              (beachDetails?.idealSwellPeriod?.max ?? 0)) /
                            2,
                        },
                        {
                          property: "swellDirection" as ForecastProperty,
                          range: 10,
                          optimalValue:
                            beachDetails.optimalSwellDirections?.optimal || 0,
                        },
                      ],
                    });
                  } catch (error) {
                    console.error("Error fetching beach details:", error);
                  }
                }}
                placeholder="Search beaches..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8 pt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-primary text-gray-600 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white text-sm mr-2">
              2
            </span>
            Alert Type
          </h3>
          <RadioGroup
            value={alertType}
            onValueChange={(value: string) => {
              setAlertType(value as AlertType);
              setAlertConfig({
                ...alertConfig,
                alertType: value as AlertType,
              });
            }}
            className="grid gap-3"
          >
            <div
              className={cn(
                "flex items-center space-x-3 p-4 rounded-lg border border-gray-200",
                "transition-colors hover:border-[var(--color-tertiary)]/50 hover:bg-gray-50",
                alertType === "variables" &&
                  "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5"
              )}
            >
              <RadioGroupItem value="variables" id="variables" />
              <Label
                htmlFor="variables"
                className="font-primary cursor-pointer"
              >
                Set Forecast Variables
              </Label>
            </div>
            <div
              className={cn(
                "flex items-center space-x-3 p-4 rounded-lg border border-gray-200",
                "transition-colors hover:border-[var(--color-tertiary)]/50 hover:bg-gray-50",
                alertType === "rating" &&
                  "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5"
              )}
            >
              <RadioGroupItem value="rating" id="rating" />
              <Label htmlFor="rating" className="font-primary cursor-pointer">
                Set Star Rating
              </Label>
            </div>
          </RadioGroup>
        </div>

        {alertType === "variables" && (
          <div className="mt-4">
            <AlertConfiguration isEmbedded={true} />
          </div>
        )}

        {alertType === "rating" && (
          <div className="space-y-4">
            <h4 className="font-medium font-primary text-gray-700">
              Minimum Star Rating
            </h4>
            <StarRatingSelector
              value={starRating}
              onChange={handleStarRatingChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AlertModalFooter() {
  const {
    alertConfig,
    beachDetails,
    createAlertMutation,
    updateAlertMutation,
    selectedLogEntry,
    existingAlert,
    alertType,
    starRating,
    creationMode,
    properties,
    onClose,
  } = useAlert();
  const router = useRouter();

  const saveAlert = async () => {
    if (
      !alertConfig.name ||
      !alertConfig.region ||
      !alertConfig.notificationMethod ||
      (alertConfig.notificationMethod !== "app" && !alertConfig.contactInfo)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create forecast data with correct types
      const forecast: ForecastData =
        creationMode === "beachVariables"
          ? {
              // Use average of min and max for swell size
              windSpeed: beachDetails?.swellSize?.min || 0,
              // Convert cardinal direction to degrees if it's a string
              windDirection:
                typeof beachDetails?.optimalWindDirections?.[0] === "string"
                  ? cardinalToDegreesMap[
                      beachDetails.optimalWindDirections[0]
                    ] || 0
                  : beachDetails?.optimalWindDirections?.[0] || 0,
              swellHeight:
                ((beachDetails?.swellSize?.min ?? 0) +
                  (beachDetails?.swellSize?.max ?? 0)) /
                  2 || 0,
              swellPeriod:
                ((beachDetails?.idealSwellPeriod?.min ?? 0) +
                  (beachDetails?.idealSwellPeriod?.max ?? 0)) /
                2,
              swellDirection: beachDetails?.optimalSwellDirections?.min || 0,
              id: uuidv4(),
              date: new Date(),
              region: alertConfig.region || "",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : null;

      // Create alert properties with correct values
      const alertProperties = [
        {
          property: "windSpeed" as ForecastProperty,
          range: 2,
          optimalValue: beachDetails?.swellSize?.min || 0,
        },
        {
          property: "windDirection" as ForecastProperty,
          range: 10,
          optimalValue:
            typeof beachDetails?.optimalWindDirections?.[0] === "string"
              ? cardinalToDegreesMap[beachDetails.optimalWindDirections[0]] || 0
              : beachDetails?.optimalWindDirections?.[0] || 0,
        },
        {
          property: "swellHeight" as ForecastProperty,
          range: 0.2,
          optimalValue:
            ((beachDetails?.swellSize?.min ?? 0) +
              (beachDetails?.swellSize?.max ?? 0)) /
              2 || 0,
        },
        {
          property: "swellPeriod" as ForecastProperty,
          range: 1,
          optimalValue:
            ((beachDetails?.idealSwellPeriod?.min ?? 0) +
              (beachDetails?.idealSwellPeriod?.max ?? 0)) /
            2,
        },
        {
          property: "swellDirection" as ForecastProperty,
          range: 10,
          optimalValue: beachDetails?.optimalSwellDirections?.min || 0,
        },
      ];

      const alertData: AlertConfigTypes = {
        ...alertConfig,
        alertType,
        properties: alertProperties,
        starRating: alertType === "rating" ? starRating : null,
        contactInfo:
          alertConfig.notificationMethod === "app"
            ? "app-notification"
            : alertConfig.contactInfo,
        forecast: creationMode === "beachVariables" ? forecast : null,
      };

      if (existingAlert) {
        await updateAlertMutation.mutateAsync(alertData as AlertConfig);
        toast.success("Alert updated successfully");
      } else {
        await createAlertMutation.mutateAsync(alertData);
        toast.success("Alert created successfully");
      }

      onClose();
      router.push("/dashboard/alerts");
    } catch (error) {
      console.error("Error saving alert:", error);
      toast.error("Failed to save alert. Please try again.");
    }
  };

  return (
    <div className="sticky bottom-0 border-t bg-gray-50 p-6 rounded-b-lg">
      <Button
        onClick={saveAlert}
        className={cn(
          "w-full font-primary",
          "bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90",
          "transition-colors text-white font-medium"
        )}
        disabled={
          !alertConfig.name ||
          (creationMode === "logEntry" && !selectedLogEntry)
        }
      >
        {existingAlert ? "Save Changes" : "Create Alert"}
      </Button>
    </div>
  );
}

interface SearchableSelectProps {
  items: { value: string; label: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  items,
  onSelect,
  placeholder = "Search...",
  className,
}: SearchableSelectProps) {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");

  const filteredItems = React.useMemo(() => {
    return items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const handleSelect = (value: string, label: string) => {
    setSelectedValue(label);
    setSearch(label);
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center border rounded-md bg-white">
        <Search className="ml-3 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full p-2 outline-none font-primary"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedValue("");
            }}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-auto">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 font-primary"
                onClick={() => handleSelect(item.value, item.label)}
              >
                {item.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 font-primary">
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
