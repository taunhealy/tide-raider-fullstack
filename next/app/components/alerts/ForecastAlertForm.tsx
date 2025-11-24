"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LogEntry } from "@/app/types/raidlogs";
import {
  ForecastProperty,
  NotificationMethod,
  AlertProperty,
  CreateAlertInput,
  AlertType,
} from "@/app/types/alerts";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
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
import { AlertConfig } from "@/app/types/alerts";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Checkbox } from "@/app/components/ui/checkbox";
import { BasicSelect, BasicOption } from "@/app/components/ui/basicselect";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api-client";
import { AlertConfiguration } from "@/app/components/alerts/AlertConfiguration";
import { degreesToCardinal } from "@/app/lib/forecastUtils";
import { Slider } from "@/app/components/ui/slider";
import { StarRatingSelector } from "@/app/components/alerts/starRatingSelector";

import { useDebounce } from "@/app/hooks/useDebounce";

import * as React from "react";
import { AlertProvider, useAlert } from "@/app/context/AlertContext";
import { cardinalToDegreesMap } from "@/app/lib/directionUtils";
import { Prisma, Alert } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";
import type { Beach } from "@/app/types/beaches";

interface ForecastAlertFormProps {
  logEntry?: LogEntry | null;
  existingAlert?: Prisma.AlertCreateInput | any;
  isOpen?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
  isNew?: boolean;
  logEntries?: LogEntry[];
  onLogEntrySelect?: (logEntry: LogEntry | null) => void;
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

type AlertCreationMode = "logEntry" | "beachVariables" | "starRating";

export default function ForecastAlertForm({
  logEntry,
  existingAlert,
  logEntries = [],
  onLogEntrySelect,
}: ForecastAlertFormProps) {
  const router = useRouter();

  const onClose = () => {
    router.push("/alerts"); // Adjust this path as needed
  };

  return (
    <AlertProvider
      existingAlert={existingAlert}
      logEntry={logEntry} // Add this
      onClose={onClose}
    >
      <div className="max-w-2xl mx-auto py-8 px-4">
        <AlertFormHeader />
        <AlertFormBody
          logEntry={logEntry}
          logEntries={logEntries}
          onLogEntrySelect={onLogEntrySelect}
        />
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

function AlertFormBody({
  logEntry,
  logEntries = [],
  onLogEntrySelect,
}: {
  logEntry?: LogEntry | null;
  logEntries?: LogEntry[];
  onLogEntrySelect?: (logEntry: LogEntry | null) => void;
}) {
  const { alert, updateAlert, mode, setMode, beachDetails } = useAlert();
  // Add state for search
  const [logEntrySearchTerm, setLogEntrySearchTerm] = useState("");
  const debouncedLogEntrySearch = useDebounce(logEntrySearchTerm, 300);
  const [selectedLogEntryId, setSelectedLogEntryId] = useState<string | null>(
    logEntry?.id || null
  );
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);

  // Track which logEntry we've already processed to prevent infinite loops
  const processedLogEntryId = useRef<string | null>(null);

  // Debug logging for log entries
  useEffect(() => {
    console.log("[ForecastAlertForm] Log entries state:", {
      logEntriesCount: logEntries.length,
      mode,
      hasLogEntry: !!logEntry,
      logEntryId: logEntry?.id,
      firstLogEntry: logEntries[0],
    });
  }, [logEntries, mode, logEntry]);

  // Auto-set mode to "logEntry" when a logEntry is provided
  useEffect(() => {
    if (logEntry && mode !== "logEntry") {
      console.log("Setting mode to logEntry because logEntry is provided");
      setMode("logEntry");
    }
  }, [logEntry, mode, setMode]);

  // Initialize starRating to 3 when in starRating mode if not already set
  useEffect(() => {
    if (
      mode === "starRating" &&
      (!alert.starRating || alert.starRating < 1 || alert.starRating > 5)
    ) {
      updateAlert({ starRating: 3 });
    }
  }, [mode, alert.starRating, updateAlert]);

  // Populate alert from log entry when logEntry is provided
  useEffect(() => {
    // Only process if we have a logEntry and haven't processed this one yet
    if (
      !logEntry ||
      !logEntry.id ||
      processedLogEntryId.current === logEntry.id
    ) {
      return;
    }

    console.log("Populating alert from log entry:", logEntry);

    // Mark this logEntry as processed
    processedLogEntryId.current = logEntry.id;

    // Batch all updates into a single updateAlert call to prevent multiple re-renders
    const updates: any = {};

    // Set the log entry ID
    if (logEntry.id) {
      updates.logEntry = { connect: { id: logEntry.id } };
    }

    // Set region from log entry - try nested object first, then direct ID
    const regionId = logEntry.region?.id || (logEntry as any).regionId;
    if (regionId) {
      updates.region = { connect: { id: regionId } };
    }

    // Set beach from log entry - try nested object first, then direct ID
    const beachId = logEntry.beach?.id || (logEntry as any).beachId;
    if (beachId) {
      updates.beach = { connect: { id: beachId } };
    }

    // Set forecast from log entry - try nested object id, then direct forecastId
    const forecastId = logEntry.forecast?.id || (logEntry as any).forecastId;
    if (forecastId) {
      updates.forecast = { connect: { id: forecastId } };
    }

    // Populate forecast properties if forecast data exists
    if (logEntry.forecast) {
      const forecast = logEntry.forecast;
      const properties: Omit<Prisma.AlertPropertyCreateInput, "alert">[] = [];

      if (forecast.windSpeed !== undefined) {
        properties.push({
          property: "windSpeed",
          range: 2, // Default range
          optimalValue: forecast.windSpeed,
        });
      }
      if (forecast.windDirection !== undefined) {
        properties.push({
          property: "windDirection",
          range: 22.5, // Default range
          optimalValue: forecast.windDirection,
        });
      }
      if (forecast.swellHeight !== undefined) {
        properties.push({
          property: "swellHeight",
          range: 0.5, // Allow precise matching for exact forecast values
          optimalValue: forecast.swellHeight,
        });
      }
      if (forecast.swellPeriod !== undefined) {
        properties.push({
          property: "swellPeriod",
          range: 2, // Default range
          optimalValue: forecast.swellPeriod,
        });
      }
      if (forecast.swellDirection !== undefined) {
        properties.push({
          property: "swellDirection",
          range: 22.5, // Default range
          optimalValue: forecast.swellDirection,
        });
      }

      if (properties.length > 0) {
        updates.properties = { create: properties };
      }
    }

    // Set alert name from log entry beach name (always populate to assist user)
    if (logEntry.beach?.name || logEntry.beachName) {
      const beachName = logEntry.beach?.name || logEntry.beachName;
      updates.name = `Alert for ${beachName}`;
    }

    // Apply all updates in a single call
    if (Object.keys(updates).length > 0) {
      console.log("Updating alert with:", updates);
      updateAlert(updates);
    }
  }, [logEntry, updateAlert]); // Removed alert.name from dependencies to prevent infinite loop

  // Update selectedBeach when beach is set
  // Note: beachDetails is a partial BeachDetails type, not a full Beach, so we don't set selectedBeach from it
  // selectedBeach should only be set when user selects a beach from BeachSearchInput
  useEffect(() => {
    if (!alert.beach?.connect?.id) {
      setSelectedBeach(null);
    }
    // Don't set selectedBeach from beachDetails - it's missing required Beach properties
  }, [alert.beach?.connect?.id]);

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

      {/* Contact Information */}
      <div className="space-y-4">
        <Label>Email Address *</Label>
        <Input
          value={alert.contactInfo || ""}
          onChange={(e) => updateAlert({ contactInfo: e.target.value })}
          className="font-primary"
          placeholder="Email address (e.g., user@example.com)"
          type="email"
          required
        />
        <p className="text-sm text-gray-500">
          Enter your email address for alert notifications
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
        <button
          onClick={() => {
            console.log(
              "[ForecastAlertForm] From Log Entry clicked, logEntries:",
              logEntries.length
            );
            setMode("logEntry");
            updateAlert({ alertType: AlertType.VARIABLES });
          }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded",
            mode === "logEntry" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          )}
        >
          From Log Entry
        </button>
        <button
          onClick={() => {
            setMode("beachVariables");
            updateAlert({ alertType: AlertType.VARIABLES });
          }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded",
            mode === "beachVariables"
              ? "bg-white shadow-sm"
              : "hover:bg-gray-50"
          )}
        >
          Beach Variables
        </button>
        <button
          onClick={() => {
            setMode("starRating");
            updateAlert({
              alertType: AlertType.RATING,
              starRating: alert.starRating ?? 3, // Initialize with 3 if not set
            });
          }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded",
            mode === "starRating" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          )}
        >
          Star Rating
        </button>
      </div>

      {/* Show log entry selector when in logEntry mode but no logEntry selected */}
      {mode === "logEntry" && !logEntry && (
        <>
          {logEntries.length === 0 ? (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <Label>Select Log Entry</Label>
              <p className="text-sm text-gray-600">
                No log entries found. Create a log entry first to create an
                alert from it.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <Label>Select Log Entry</Label>
              <p className="text-sm text-gray-600 mb-4">
                Search and filter log entries by beach to create an alert from
                their forecast conditions.
              </p>

              {/* Search Bar */}
              <div className="space-y-2">
                <Label className="text-sm">Search By Beach</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by beach name..."
                    value={logEntrySearchTerm}
                    onChange={(e) => setLogEntrySearchTerm(e.target.value)}
                    className="font-primary pl-10"
                  />
                </div>
              </div>

              {/* Filtered and Sorted Log Entries List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logEntries
                  .filter((entry) => {
                    // Filter by beach name search term only
                    if (debouncedLogEntrySearch) {
                      const searchLower = debouncedLogEntrySearch.toLowerCase();
                      const beachName = (
                        entry.beach?.name ||
                        entry.beachName ||
                        ""
                      ).toLowerCase();

                      if (!beachName.includes(searchLower)) {
                        return false;
                      }
                    }

                    return true;
                  })
                  .sort((a, b) => {
                    // Sort by date, most recent first
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                  })
                  .map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => {
                        setSelectedLogEntryId(entry.id);
                        // Notify parent component to update logEntry prop
                        if (onLogEntrySelect) {
                          onLogEntrySelect(entry);
                        }
                      }}
                      className={cn(
                        "p-3 rounded-md border cursor-pointer transition-colors",
                        selectedLogEntryId === entry.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {entry.beach?.name ||
                              entry.beachName ||
                              "Unknown Beach"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.region?.name ||
                              (entry as any).region?.name ||
                              "Unknown Region"}
                            {entry.date &&
                              ` • ${format(new Date(entry.date), "MMM d, yyyy")}`}
                          </div>
                          {entry.forecast && (
                            <div className="text-xs text-gray-600 mt-2 space-y-1">
                              {entry.forecast.swellHeight !== undefined && (
                                <span>
                                  Swell: {entry.forecast.swellHeight}m
                                </span>
                              )}
                              {entry.forecast.windSpeed !== undefined && (
                                <span className="ml-2">
                                  Wind: {entry.forecast.windSpeed}kts
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {entry.surferRating > 0 && (
                          <div className="flex items-center gap-1 ml-2">
                            <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs">
                              {entry.surferRating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && mode === "logEntry" && (
        <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded">
          Debug: mode={mode}, logEntry={logEntry ? "set" : "null"},
          logEntries.length={logEntries.length}
        </div>
      )}

      {/* Show log entry info when in logEntry mode and logEntry is selected */}
      {mode === "logEntry" && logEntry && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center">
            <Label>Selected Log Entry</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedLogEntryId(null);
                if (onLogEntrySelect) {
                  onLogEntrySelect(null);
                }
                updateAlert({
                  logEntry: undefined,
                  properties: { create: [] },
                });
              }}
              className="text-xs"
            >
              Change
            </Button>
          </div>
          <div className="text-sm space-y-2">
            {(logEntry.beach?.name || logEntry.beachName) && (
              <p>
                <strong>Beach:</strong>{" "}
                {logEntry.beach?.name || logEntry.beachName}
              </p>
            )}
            {(logEntry.region?.name || (logEntry as any).regionName) && (
              <p>
                <strong>Region:</strong>{" "}
                {logEntry.region?.name || (logEntry as any).regionName}
              </p>
            )}
            {logEntry.forecast && (
              <div className="mt-2">
                <p className="font-semibold mb-1">Forecast Conditions:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {logEntry.forecast.windSpeed !== undefined && (
                    <li>Wind: {logEntry.forecast.windSpeed} kts</li>
                  )}
                  {logEntry.forecast.windDirection !== undefined && (
                    <li>Wind Direction: {logEntry.forecast.windDirection}°</li>
                  )}
                  {logEntry.forecast.swellHeight !== undefined && (
                    <li>Swell Height: {logEntry.forecast.swellHeight}m</li>
                  )}
                  {logEntry.forecast.swellPeriod !== undefined && (
                    <li>Swell Period: {logEntry.forecast.swellPeriod}s</li>
                  )}
                  {logEntry.forecast.swellDirection !== undefined && (
                    <li>
                      Swell Direction: {logEntry.forecast.swellDirection}°
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Beach Selection for Beach Variables and Star Rating modes */}
      {(mode === "beachVariables" || mode === "starRating") && (
        <div className="space-y-4">
          <Label>Select Beach</Label>
          <p className="text-sm text-gray-500">
            {mode === "starRating"
              ? "Select a beach to monitor for the minimum star rating"
              : "Search and select a beach to configure forecast variables"}
          </p>

          <BeachSearchInput
            selectedBeach={selectedBeach}
            onBeachSelect={(beach) => {
              setSelectedBeach(beach);
              if (beach) {
                // Update both region and beach
                updateAlert({
                  region: { connect: { id: beach.regionId } },
                  beach: { connect: { id: beach.id } },
                });
              } else {
                // Clear beach selection
                updateAlert({
                  beach: undefined,
                });
              }
            }}
            placeholder="Search beaches..."
            showSelectedBadge={true}
            minSearchLength={2}
          />
        </div>
      )}

      {/* Properties Configuration - Show for logEntry and beachVariables modes */}
      {(mode === "logEntry" || mode === "beachVariables") && (
        <AlertConfiguration />
      )}

      {/* Star Rating Selection - Show for starRating mode */}
      {mode === "starRating" && (
        <div className="space-y-4">
          <Label>Minimum Star Rating</Label>
          <p className="text-sm text-gray-600">
            Set the minimum star rating (1-5) that will trigger this alert. The
            alert will notify you when the selected beach reaches or exceeds
            this rating.
          </p>
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
  const { alert, createAlert, updateAlertMutation, onClose, mode } = useAlert();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!alert.name || !alert.region?.connect?.id) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if contactInfo is required and provided
    if (!alert.contactInfo || alert.contactInfo.trim() === "") {
      toast.error("Contact information is required");
      return;
    }

    try {
      if (alert.id) {
        // For updates, transform Prisma format to API format (same as creation)
        const properties = Array.isArray(alert.properties?.create)
          ? alert.properties.create.map((prop: any) => ({
              property: prop.property,
              optimalValue: Number(prop.optimalValue),
              range: Math.max(0.1, Number(prop.range)),
            }))
          : [];

        // Validate based on mode
        if (mode === "logEntry" || mode === "beachVariables") {
          if (properties.length === 0) {
            toast.error(
              "At least one forecast property is required for VARIABLES alerts"
            );
            return;
          }
        } else if (mode === "starRating") {
          const starRatingValue = alert.starRating ?? 3;
          if (
            !starRatingValue ||
            starRatingValue < 1 ||
            starRatingValue > 5 ||
            typeof starRatingValue !== "number"
          ) {
            toast.error(
              "Please set a minimum star rating (1-5) for RATING alerts"
            );
            return;
          }
        }

        const apiData = {
          id: alert.id,
          name: alert.name,
          regionId: alert.region?.connect?.id || "",
          forecastDate:
            alert.forecastDate instanceof Date
              ? alert.forecastDate.toISOString()
              : typeof alert.forecastDate === "string"
                ? alert.forecastDate
                : new Date().toISOString(),
          properties: properties,
          notificationMethod: alert.notificationMethod || "email",
          contactInfo: alert.contactInfo || "",
          active: alert.active ?? true,
          alertType:
            mode === "starRating" ? AlertType.RATING : AlertType.VARIABLES,
          starRating: mode === "starRating" ? (alert.starRating ?? 3) : null,
          logEntryId: alert.logEntry?.connect?.id || null,
          beachId: alert.beach?.connect?.id || null,
        };

        const response = await fetch(`/api/alerts/${alert.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          let errorMessage = "Failed to update alert";
          let errorDetails = "";
          try {
            const errorData = await response.json();
            console.error("Alert update error:", errorData);

            if (errorData.issues && Array.isArray(errorData.issues)) {
              const issues = errorData.issues;
              const firstIssue = issues[0];
              errorMessage = firstIssue.message || "Validation error";
              if (firstIssue.path && firstIssue.path.length > 0) {
                const fieldName = firstIssue.path.join(".");
                errorMessage = `${fieldName}: ${errorMessage}`;
              }
              if (issues.length > 1) {
                errorDetails = ` (${issues.length} errors)`;
              }
            } else if (errorData.error?.issues) {
              const issues = errorData.error.issues;
              const firstIssue = issues[0];
              errorMessage = firstIssue.message || "Validation error";
              if (firstIssue.path && firstIssue.path.length > 0) {
                const fieldName = firstIssue.path.join(".");
                errorMessage = `${fieldName}: ${errorMessage}`;
              }
            } else if (errorData.error) {
              errorMessage =
                typeof errorData.error === "string"
                  ? errorData.error
                  : errorData.error.message || "Validation error";
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          toast.error(`${errorMessage}${errorDetails}`);
          return;
        }

        toast.success("Alert updated successfully");
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        router.push("/alerts");
      } else {
        // For creation, transform Prisma format to API format
        const properties = Array.isArray(alert.properties?.create)
          ? alert.properties.create
              .filter((prop: any) => prop.optimalValue != null) // Filter out null/undefined values
              .map((prop: any) => ({
                property: prop.property,
                optimalValue: Number(prop.optimalValue),
                // Ensure range is at least 0.1 (API requirement: min 0.1, max 100)
                range: Math.max(0.1, Number(prop.range)),
                sourceType: prop.sourceType || ("log_entry" as const),
                sourceId: prop.sourceId || undefined,
              }))
          : [];

        // Validate based on mode (more reliable than alertType)
        if (mode === "logEntry" || mode === "beachVariables") {
          if (properties.length === 0) {
            toast.error(
              "At least one forecast property is required for VARIABLES alerts"
            );
            return;
          }
        } else if (mode === "starRating") {
          // Get the starRating value, defaulting to the displayed value if not set
          const starRatingValue = alert.starRating ?? 3;
          if (
            !starRatingValue ||
            starRatingValue < 1 ||
            starRatingValue > 5 ||
            typeof starRatingValue !== "number"
          ) {
            toast.error(
              "Please set a minimum star rating (1-5) for RATING alerts"
            );
            return;
          }
        }

        const apiData = {
          name: alert.name,
          regionId: alert.region?.connect?.id || "",
          beachId: alert.beach?.connect?.id || null,
          logEntryId: alert.logEntry?.connect?.id || null,
          forecastId: alert.forecast?.connect?.id || null,
          properties: properties, // Can be empty array for RATING alerts
          notificationMethod: alert.notificationMethod || "email",
          contactInfo: alert.contactInfo || "",
          active: alert.active ?? true,
          alertType:
            mode === "starRating" ? AlertType.RATING : AlertType.VARIABLES,
          starRating: mode === "starRating" ? (alert.starRating ?? 3) : null,
          forecastDate:
            alert.forecastDate instanceof Date
              ? alert.forecastDate.toISOString()
              : typeof alert.forecastDate === "string"
                ? alert.forecastDate
                : new Date().toISOString(),
        };

        try {
          await api.createAlert(apiData);
          toast.success("Alert saved successfully");
          // Invalidate alerts cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          router.push("/alerts");
        } catch (error: any) {
          let errorMessage = "Failed to create alert";
          let errorDetails = "";
          let requiresUpgrade = false;

          try {
            const errorData = error.response?.data || error;
            console.error("Alert creation error:", errorData);

            // Check for alert limit error
            if (
              errorData.code === "ALERT_LIMIT_REACHED" ||
              errorData.requiresUpgrade
            ) {
              requiresUpgrade = true;
              errorMessage = errorData.message || "Alert limit reached";

              // Show upgrade prompt
              toast.error(errorMessage, {
                action: {
                  label: "Upgrade",
                  onClick: () => router.push("/checkout"),
                },
                duration: 10000, // Show for 10 seconds
              });
              return; // Don't show additional error toast
            }

            // Handle Zod validation errors
            if (errorData.issues && Array.isArray(errorData.issues)) {
              const issues = errorData.issues;
              const firstIssue = issues[0];
              errorMessage = firstIssue.message || "Validation error";
              if (firstIssue.path && firstIssue.path.length > 0) {
                const fieldName = firstIssue.path.join(".");
                errorMessage = `${fieldName}: ${errorMessage}`;
              }
              // Show all issues if there are multiple
              if (issues.length > 1) {
                errorDetails = ` (${issues.length} errors)`;
              }
            } else if (errorData.error?.issues) {
              const issues = errorData.error.issues;
              const firstIssue = issues[0];
              errorMessage = firstIssue.message || "Validation error";
              if (firstIssue.path && firstIssue.path.length > 0) {
                const fieldName = firstIssue.path.join(".");
                errorMessage = `${fieldName}: ${errorMessage}`;
              }
            } else if (errorData.error) {
              errorMessage =
                typeof errorData.error === "string"
                  ? errorData.error
                  : errorData.error.message || "Validation error";
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }

          if (!requiresUpgrade) {
            toast.error(`${errorMessage}${errorDetails}`);
          }
        }
      }
    } catch (error) {
      console.error("Error saving alert:", error);
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
