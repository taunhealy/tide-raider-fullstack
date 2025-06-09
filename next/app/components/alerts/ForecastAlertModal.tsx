"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { LogEntry } from "@/app/types/raidlogs";
import {
  AlertConfigTypes,
  ForecastProperty,
  NotificationMethod,
} from "@/app/types/alerts";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface ForecastAlertModalProps {
  isOpen?: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
  existingAlert?: AlertConfig;
  onSaved?: () => void;
  isNew?: boolean;
  logEntries?: LogEntry[];
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
  key: "property" | "range";
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
    ({ index, key, value }: PropertyUpdateAction) => {
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

export default function ForecastAlertModal({
  isOpen = false,
  onClose,
  logEntry,
  existingAlert,
  onSaved,
  isNew,
  logEntries = [],
}: ForecastAlertModalProps) {
  const isEditing = !!existingAlert;
  const isLinkedToLogEntry =
    isEditing && logEntry && existingAlert?.logEntryId === logEntry.id;

  const { data: session } = useSession();
  const router = useRouter();

  const [alertType, setAlertType] = useState<"variables" | "rating">(
    existingAlert?.alertType || "variables"
  );
  const [starRating, setStarRating] = useState<"4+" | "5">(
    existingAlert?.starRating === "5" ? "5" : "4+"
  );

  const [alertConfig, setAlertConfig] = useState<AlertConfigTypes>({
    id: existingAlert?.id || uuidv4(),
    name: existingAlert?.name || "",
    region: existingAlert?.region || "",
    properties: existingAlert?.properties || [
      { property: "windSpeed", range: 2 },
      { property: "windDirection", range: 10 },
      { property: "swellHeight", range: 0.2 },
      { property: "swellPeriod", range: 1 },
      { property: "swellDirection", range: 10 },
    ],
    notificationMethod: existingAlert?.notificationMethod || "app",
    contactInfo: existingAlert?.contactInfo || "",
    active: existingAlert?.active ?? true,
    forecastDate: existingAlert?.forecastDate
      ? new Date(existingAlert.forecastDate)
      : new Date(),
    alertType:
      existingAlert?.alertType ||
      (logEntry?.surferRating ? "rating" : "variables"),
    starRating:
      existingAlert?.starRating ||
      (logEntry?.surferRating && logEntry.surferRating >= 5 ? "5" : "4+"),
    userId: session?.user?.id || "",
    logEntryId: existingAlert?.logEntryId || logEntry?.id || null,
    forecast: null,
    forecastId: null,
  });

  const queryClient = useQueryClient();
  const [isFetchingForecast, setIsFetchingForecast] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [fetchedCombinations, setFetchedCombinations] = useState<Set<string>>(
    new Set()
  );
  const [forecastData, setForecastData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(
    logEntry
  );

  const { data: userLogEntries, isLoading: isLoadingLogEntries } = useQuery({
    queryKey: ["userLogEntries"],
    queryFn: async () => {
      const response = await fetch("/api/logs");
      if (!response.ok) throw new Error("Failed to fetch log entries");
      return response.json();
    },
    enabled: isOpen && !logEntry,
  });

  const filteredLogEntries = useMemo(() => {
    if (!userLogEntries) return [];
    return userLogEntries.filter(
      (entry: LogEntry) =>
        entry.beachName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userLogEntries, searchTerm]);

  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const response = await fetch("/api/alerts?region");
        if (response.ok) {
          const data = await response.json();
          setRegions(data);
        } else {
          toast.error("Failed to load regions");
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
        toast.error("Failed to load regions");
      } finally {
        setIsLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    if (!alertConfig.region) return;

    const fetchDates = async () => {
      setIsLoadingDates(true);
      try {
        const response = await fetch(
          `/api/alerts?region=${encodeURIComponent(alertConfig.region || "")}`
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableDates(data);
          if (data.length === 0) {
            toast.warning("No forecast dates available for this region");
          }
        } else {
          toast.error("Failed to load dates");
        }
      } catch (error) {
        console.error("Error fetching dates:", error);
        toast.error("Failed to load dates");
      } finally {
        setIsLoadingDates(false);
      }
    };

    fetchDates();
  }, [alertConfig.region]);

  const {
    properties,
    updateProperty,
    removeProperty,
    addProperty,
    setProperties,
  } = usePropertyManager(
    existingAlert?.properties || [
      { property: "windSpeed", range: 2 },
      { property: "windDirection", range: 10 },
      { property: "swellHeight", range: 0.2 },
      { property: "swellPeriod", range: 1 },
      { property: "swellDirection", range: 10 },
    ]
  );

  const fetchAlert = useCallback(async () => {
    if (!existingAlert?.id) return;

    try {
      console.log("Fetching alert with ID:", existingAlert.id);
      const response = await fetch(`/api/alerts/${existingAlert.id}`);

      if (!response.ok) {
        console.error("Error response:", response.status, response.statusText);
        throw new Error(`Failed to fetch alert: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received alert data:", data);

      if (!data) {
        console.error("No alert data received");
        return;
      }

      setAlertConfig({
        ...data,
        forecastDate: data.forecastDate
          ? new Date(data.forecastDate)
          : new Date(),
      });

      setAlertType(data.alertType || "variables");
      setStarRating((data.starRating as "4+" | "5") || "4+");

      if (data.properties && Array.isArray(data.properties)) {
        setProperties(data.properties);
      } else {
        console.error("Invalid properties data:", data.properties);
      }

      if (data.logEntry) {
        setSelectedLogEntry(data.logEntry);
      }

      if (data.notificationMethod) {
        setSelectedNotificationMethods(
          data.notificationMethod === "email" ? ["email"] : ["app"]
        );
      }
    } catch (error) {
      console.error("Error fetching alert:", error);
      toast.error("Failed to load alert details");
    }
  }, [existingAlert?.id, setProperties]);

  useEffect(() => {
    if (existingAlert?.id && isEditing) {
      fetchAlert();
    } else if (logEntry && !existingAlert) {
      setAlertConfig({
        id: uuidv4(),
        name: `Alert for ${logEntry.beachName}`,
        properties: [
          { property: "windSpeed", range: 2 },
          { property: "windDirection", range: 10 },
          { property: "swellHeight", range: 0.2 },
          { property: "swellPeriod", range: 1 },
          { property: "swellDirection", range: 10 },
        ],
        notificationMethod: "app",
        contactInfo: session?.user?.email || "",
        active: true,
        region: logEntry.region || "",
        forecastDate: new Date(logEntry.date),
        logEntryId: logEntry.id,
        alertType: "variables",
        starRating: "4+",
        forecast: null,
        forecastId: null,
        userId: session?.user?.id || "",
      });
    }
  }, [
    existingAlert,
    isEditing,
    logEntry,
    session?.user?.email,
    session?.user?.id,
    fetchAlert,
  ]);

  useEffect(() => {
    if (session?.user?.email) {
      setAlertConfig(
        (prev: AlertConfig) =>
          ({
            ...prev,
            contactInfo: existingAlert?.contactInfo || session.user.email || "",
            notificationMethod: (existingAlert?.notificationMethod ||
              "app") as NotificationMethod,
          }) as AlertConfig
      );
    }
  }, [session, existingAlert]);

  useEffect(() => {
    if (selectedLogEntry && !isEditing) {
      setAlertConfig((prev) => ({
        ...prev,
        name: `Alert for ${
          selectedLogEntry.beachName || selectedLogEntry.region
        }`,
        region: selectedLogEntry.region || "",
        logEntryId: selectedLogEntry.id,
        forecastDate: new Date(selectedLogEntry.date),
      }));

      if (selectedLogEntry.forecast) {
        setForecastData(selectedLogEntry.forecast);
        const dateStr = getDateString(new Date(selectedLogEntry.date));
        const combinationKey = `${selectedLogEntry.region}-${dateStr}`;
        setFetchedCombinations((prev) => new Set(prev).add(combinationKey));
      } else if (selectedLogEntry.region) {
        queryClient.invalidateQueries({
          queryKey: ["forecastDates", selectedLogEntry.region],
        });
      }
    }
  }, [selectedLogEntry, isEditing, queryClient]);

  useEffect(() => {
    if (logEntry && !existingAlert) {
      setAlertConfig({
        id: uuidv4(),
        name: `Alert for ${logEntry.beachName}`,
        properties: [
          { property: "windSpeed", range: 2 },
          { property: "windDirection", range: 10 },
          { property: "swellHeight", range: 0.2 },
          { property: "swellPeriod", range: 1 },
          { property: "swellDirection", range: 10 },
        ],
        notificationMethod: "app",
        contactInfo: session?.user?.email || "",
        active: true,
        region: logEntry.region || "",
        forecastDate: new Date(logEntry.date),
        logEntryId: logEntry.id,
        alertType: "variables",
        starRating: "4+",
        forecast: null,
        forecastId: null,
        userId: session?.user?.id || "",
      });

      if (logEntry.forecast) {
        const mappedForecast = {
          windSpeed: logEntry.forecast.windSpeed || 0,
          windDirection: logEntry.forecast.windDirection || 0,
          swellHeight: logEntry.forecast.swellHeight || 0,
          swellPeriod: logEntry.forecast.swellPeriod || 0,
          swellDirection: logEntry.forecast.swellDirection || 0,
        };
        setForecastData(mappedForecast);
      }
    }
  }, [logEntry, existingAlert, session?.user?.email]);

  useEffect(() => {
    if (existingAlert?.logEntry) {
      setSelectedLogEntry(existingAlert.logEntry);
      setSearchTerm(existingAlert.logEntry.beachName || "");
    }
  }, [existingAlert?.logEntry]);

  const createAlertMutation = useMutation({
    mutationFn: async (data: AlertConfigTypes) => {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          forecastDate: data.forecastDate,
        }),
      });
      if (!response.ok) throw new Error("Failed to create alert");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Alert created successfully");
      onSaved?.();
      onClose();
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async (alert: AlertConfig) => {
      const toastId = toast.loading("Updating alert...");

      try {
        console.log("Updating alert with ID:", alert.id);
        const response = await fetch(`/api/alerts/${alert.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(alert),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `HTTP error ${response.status}` }));
          toast.dismiss(toastId);
          throw new Error(
            errorData.error || `Failed to update alert (${response.status})`
          );
        }

        const result = await response.json();
        toast.dismiss(toastId);
        return result;
      } catch (error) {
        toast.dismiss(toastId);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Alert Updated", {
        description: "Your alert has been updated successfully.",
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onSaved?.();
      onClose();
    },
    onError: (error: Error) => {
      console.error("Update error:", error);
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const hasForecaseData = (date: Date) => {
    if (!availableDates) return false;
    return availableDates.some((d: string) => {
      const forecastDate = new Date(d);
      return forecastDate.toDateString() === date.toDateString();
    });
  };

  const fetchLogEntry = async (logEntryId: string) => {
    try {
      const response = await fetch(`/api/logs/${logEntryId}`);
      if (!response.ok) throw new Error("Failed to fetch log entry");

      const logEntry = await response.json();
      setSelectedLogEntry(logEntry);
    } catch (error) {
      console.error("Error fetching log entry:", error);
      toast.error("Failed to load log entry details");
    }
  };

  const fetchForecast = async (region: string, date: Date | string) => {
    if (!region || !date) return null;

    setIsFetchingForecast(true);
    setForecastData(null);

    let dateStr;
    try {
      dateStr =
        typeof date === "string"
          ? date
          : date instanceof Date && !isNaN(date.getTime())
            ? date.toISOString().split("T")[0]
            : "";
    } catch (error) {
      console.error("Invalid date format:", date, error);
      dateStr = "";
    }

    if (!dateStr) {
      toast.error("Invalid date format");
      setIsFetchingForecast(false);
      return null;
    }

    const combinationKey = `${region}-${dateStr}`;

    if (fetchedCombinations.has(combinationKey)) {
      setIsFetchingForecast(false);
      return null;
    }

    try {
      console.log(`Fetching forecast for ${region} on ${dateStr}`);
      const response = await fetch(
        `/api/raid-logs/forecast?region=${encodeURIComponent(
          region
        )}&date=${encodeURIComponent(dateStr)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch forecast: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Forecast data:", data);

      setFetchedCombinations(new Set(fetchedCombinations).add(combinationKey));
      setForecastData(data);
      return data;
    } catch (error) {
      console.error("Error fetching forecast:", error);
      toast.error("Failed to load forecast data");
      return null;
    } finally {
      setIsFetchingForecast(false);
    }
  };

  useEffect(() => {
    if (alertConfig.region && alertConfig.forecastDate) {
      const dateStr = getDateString(alertConfig.forecastDate);
      const combinationKey = `${alertConfig.region}-${dateStr}`;

      setFetchedCombinations((prev) => {
        if (!prev.has(combinationKey)) {
          if (alertConfig.region && alertConfig.forecastDate) {
            fetchForecast(alertConfig.region, alertConfig.forecastDate);
          }
          return new Set(prev).add(combinationKey);
        }
        return prev;
      });
    }
  }, [alertConfig.region, alertConfig.forecastDate]);

  useEffect(() => {
    if (existingAlert?.logEntry) {
      setSelectedLogEntry(existingAlert.logEntry);
      setSearchTerm(existingAlert.logEntry.beachName || "");
    }
  }, [existingAlert?.logEntry]);

  const saveAlert = async () => {
    console.log("Saving alert with config:", alertConfig);
    console.log("Notification method:", alertConfig.notificationMethod);
    console.log("Contact info:", alertConfig.contactInfo);
    console.log("Alert type:", alertType);

    if (
      !alertConfig.name ||
      !alertConfig.region ||
      !alertConfig.notificationMethod ||
      !alertConfig.contactInfo
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const alertData: AlertConfigTypes = {
        id: existingAlert?.id || uuidv4(),
        name: alertConfig.name!,
        region: alertConfig.region!,
        properties: alertConfig.properties || [],
        notificationMethod: alertConfig.notificationMethod!,
        contactInfo: alertConfig.contactInfo!,
        active: alertConfig.active ?? true,
        logEntryId: selectedLogEntry?.id || logEntry?.id || null,
        alertType: alertType,
        starRating: alertType === "rating" ? starRating : null,
        forecastDate: alertConfig.forecastDate || new Date(),
        forecast: null,
        forecastId: null,
        userId: session?.user?.id || "",
      };

      if (isEditing) {
        updateAlertMutation.mutate({
          ...alertData,
          forecast: existingAlert?.forecast || null,
          forecastId: existingAlert?.forecastId || null,
          logEntry: existingAlert?.logEntryId || null,
        } as AlertConfig);
      } else {
        createAlertMutation.mutate(alertData);
      }
    } catch (error) {
      console.error("Error saving alert:", error);
      toast.error("Failed to save alert");
    }
  };

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

  const getPropertyUnit = (property: string): string => {
    switch (property.toLowerCase()) {
      case "windspeed":
        return "kts";
      case "winddirection":
      case "swelldirection":
        return "°";
      case "swellheight":
        return "m";
      case "swellperiod":
        return "s";
      default:
        return "";
    }
  };

  function getForecastProperty(property: string): string {
    switch (property.toLowerCase()) {
      case "windspeed":
        return "windSpeed";
      case "winddirection":
        return "windDirection";
      case "swellheight":
        return "swellHeight";
      case "swellperiod":
        return "swellPeriod";
      case "swelldirection":
        return "swellDirection";
      default:
        return property;
    }
  }

  function getForecastPropertyValue(
    forecast: any,
    property: ForecastProperty
  ): number {
    switch (property) {
      case "waveHeight":
        return forecast.swellHeight || 0;
      case "wavePeriod":
        return forecast.swellPeriod || 0;
      default:
        return forecast[property] || 0;
    }
  }

  useEffect(() => {
    setAlertConfig((prev) => ({
      ...prev,
      properties,
    }));
  }, [properties]);

  useEffect(() => {
    if (selectedLogEntry) {
      setAlertConfig((prev) => ({
        ...prev,
        region: selectedLogEntry.region || prev.region,
        logEntryId: selectedLogEntry.id,
        alertType: selectedLogEntry.surferRating ? "rating" : prev.alertType,
        starRating:
          selectedLogEntry.surferRating && selectedLogEntry.surferRating >= 5
            ? "5"
            : selectedLogEntry.surferRating &&
                selectedLogEntry.surferRating >= 4
              ? "4+"
              : prev.starRating,
      }));
    }
  }, [selectedLogEntry]);

  const [selectedNotificationMethods, setSelectedNotificationMethods] =
    useState<string[]>(
      existingAlert?.notificationMethod
        ? existingAlert.notificationMethod === "email"
          ? ["email"]
          : ["app"]
        : ["app"]
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b pb-6">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold font-primary text-[var(--color-primary)]">
              {isEditing ? "Edit Alert" : "Create New Alert"}
            </DialogTitle>
            <DialogDescription className="font-primary text-gray-600 mt-2">
              {isEditing
                ? "Modify your alert settings below"
                : logEntry
                  ? `Creating alert for ${logEntry.beachName}`
                  : "Select a logged session to create an alert for similar conditions"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-8">
          <div className="space-y-6">
            {!logEntry && (
              <div className="space-y-4">
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
                                  {Array.from({
                                    length: entry.surferRating,
                                  }).map((_, i) => (
                                    <StarIcon
                                      key={i}
                                      className="h-4 w-4 text-yellow-400 fill-current"
                                    />
                                  ))}
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
            )}

            {(selectedLogEntry || logEntry) && (
              <div className="space-y-8 pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-primary text-gray-600 flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white text-sm mr-2">
                      2
                    </span>
                    Alert Name
                  </h3>
                  <Input
                    value={alertConfig.name || ""}
                    onChange={(e) =>
                      setAlertConfig({ ...alertConfig, name: e.target.value })
                    }
                    className="font-primary bg-white border-gray-200 focus:border-[var(--color-tertiary)]"
                    placeholder={`Alert for ${selectedLogEntry?.beachName}`}
                  />
                </div>

                {/* Add Reference Forecast section */}
                {(selectedLogEntry?.forecast || logEntry?.forecast) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-primary text-gray-600 flex items-center">
                      Alert Reference Forecast
                    </h3>
                    <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Wind Speed</p>
                          <p className="font-medium">
                            {(
                              selectedLogEntry?.forecast?.windSpeed ||
                              logEntry?.forecast?.windSpeed ||
                              0
                            ).toFixed(1)}{" "}
                            kts
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Wind Direction
                          </p>
                          <p className="font-medium">
                            {degreesToCardinal(
                              selectedLogEntry?.forecast?.windDirection ||
                                logEntry?.forecast?.windDirection ||
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Swell Height</p>
                          <p className="font-medium">
                            {(
                              selectedLogEntry?.forecast?.swellHeight ||
                              logEntry?.forecast?.swellHeight ||
                              0
                            ).toFixed(1)}{" "}
                            m
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Swell Period</p>
                          <p className="font-medium">
                            {(
                              selectedLogEntry?.forecast?.swellPeriod ||
                              logEntry?.forecast?.swellPeriod ||
                              0
                            ).toFixed(1)}{" "}
                            s
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Swell Direction
                          </p>
                          <p className="font-medium">
                            {degreesToCardinal(
                              selectedLogEntry?.forecast?.swellDirection ||
                                logEntry?.forecast?.swellDirection ||
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rating</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({
                              length:
                                selectedLogEntry?.surferRating ||
                                logEntry?.surferRating ||
                                0,
                            }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className="h-4 w-4 text-yellow-400 fill-current"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-primary text-gray-600 flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white text-sm mr-2">
                      3
                    </span>
                    Alert Type
                  </h3>
                  <RadioGroup
                    value={alertType}
                    onValueChange={(value: string) => {
                      setAlertType(value as AlertType);
                      setAlertConfig((prev) => ({
                        ...prev,
                        alertType: value as AlertType,
                      }));
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
                      <Label
                        htmlFor="rating"
                        className="font-primary cursor-pointer"
                      >
                        Set Star Rating
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {alertType === "variables" && (
                  <div className="mt-4">
                    <AlertConfiguration
                      existingConfig={alertConfig}
                      selectedLogEntry={selectedLogEntry}
                      onSave={(config) => {
                        setAlertConfig((prev) => ({
                          ...prev,
                          ...config,
                          properties: config.properties,
                          notificationMethod: config.notificationMethod,
                          active: config.active,
                        }));
                      }}
                      isEmbedded={true}
                    />
                  </div>
                )}

                {alertType === "rating" && (
                  <div className="space-y-4">
                    <h4 className="font-medium font-primary text-gray-700">
                      Select Rating Threshold
                    </h4>
                    <RadioGroup
                      value={starRating}
                      onValueChange={(value: "4+" | "5") => {
                        setStarRating(value);
                        setAlertConfig((prev) => ({
                          ...prev,
                          starRating: value,
                        }));
                      }}
                      className="grid gap-3"
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border border-gray-200",
                          "transition-colors hover:border-[var(--color-tertiary)]/50 hover:bg-gray-50",
                          starRating === "5" &&
                            "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5"
                        )}
                      >
                        <RadioGroupItem value="5" id="five-stars" />
                        <Label
                          htmlFor="five-stars"
                          className="font-primary cursor-pointer flex items-center gap-2"
                        >
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <StarIcon
                                key={i}
                                className="h-4 w-4 text-yellow-400 fill-current"
                              />
                            ))}
                          </div>
                          <span>Perfect conditions (5 stars)</span>
                        </Label>
                      </div>
                      <div
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border border-gray-200",
                          "transition-colors hover:border-[var(--color-tertiary)]/50 hover:bg-gray-50",
                          starRating === "4+" &&
                            "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5"
                        )}
                      >
                        <RadioGroupItem value="4+" id="four-plus-stars" />
                        <Label
                          htmlFor="four-plus-stars"
                          className="font-primary cursor-pointer flex items-center gap-2"
                        >
                          <div className="flex">
                            {[1, 2, 3, 4].map((i) => (
                              <StarIcon
                                key={i}
                                className="h-4 w-4 text-yellow-400 fill-current"
                              />
                            ))}
                            <StarIcon className="h-4 w-4 text-gray-300" />
                          </div>
                          <span>Good conditions (4+ stars)</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-gray-50 p-6 rounded-b-lg">
          <Button
            onClick={saveAlert}
            className={cn(
              "w-full font-primary",
              "bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90",
              "transition-colors text-white font-medium"
            )}
            disabled={!selectedLogEntry || !alertConfig.name}
          >
            {isEditing ? "Save Changes" : "Create Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
