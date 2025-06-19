"use client";

import { Button } from "@/app/components/ui/Button";
import { Switch } from "@/app/components/ui/switch";
import { Bell, Pencil, Trash2, Star as StarIcon } from "lucide-react";
import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
} from "@/app/components/ui/Card";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

import { Alert, AlertProperty, NotificationMethod } from "@/app/types/alerts";
import { AlertType } from "@prisma/client";
import {
  degreesToCardinal,
  getSwellEmoji,
  getWindEmoji,
} from "@/app/lib/forecastUtils";
import { formatItemType } from "@/app/lib/formatters";

// Add this skeleton loader component at the top level
function AlertCardSkeleton() {
  return (
    <Card className="bg-[var(--color-bg-primary)] border-[var(--color-border-light)] h-full flex flex-col animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-[var(--color-bg-secondary)] rounded"></div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-10 bg-[var(--color-bg-secondary)] rounded"></div>
            <div className="h-8 w-8 bg-[var(--color-bg-secondary)] rounded"></div>
            <div className="h-8 w-8 bg-[var(--color-bg-secondary)] rounded"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex-1">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-[var(--color-bg-secondary)] rounded"></div>
          <div className="h-4 w-48 bg-[var(--color-bg-secondary)] rounded"></div>
          <div className="h-32 bg-[var(--color-bg-secondary)] rounded mt-4"></div>
        </div>
      </CardContent>
    </Card>
  );
}

type AlertTab = "all" | "variable" | "rating";

// Move getUnit outside the AlertsList component to make it accessible to all components
function getUnit(property: AlertProperty["property"]): string {
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
}

export function AlertsList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AlertTab>("all");
  const queryClient = useQueryClient();

  // Properly typed query
  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery<Alert[], Error>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch(
        "/api/alerts?include=logEntry.forecast,logEntry.beach"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      return data;
    },
  });

  // Properly typed mutations
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }
    },
    onSuccess: () => {
      toast.success("Alert deleted");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error("Failed to delete alert", {
        description: error.message,
      });
    },
  });

  // Properly typed toggle mutation
  const toggleActiveMutation = useMutation<
    void,
    Error,
    { alertId: string; active: boolean }
  >({
    mutationFn: async ({ alertId, active }) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!response.ok) {
        throw new Error("Failed to update alert");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error("Failed to update alert", {
        description: error.message,
      });
    },
  });

  const handleNewAlert = () => {
    router.push("/alerts/new");
  };

  const handleDelete = (alertId: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteMutation.mutate(alertId);
    }
  };

  const handleToggleActive = (alertId: string, active: boolean) => {
    toggleActiveMutation.mutate({ alertId, active });
  };

  // Type-safe filtering
  const filteredAlerts = alerts?.filter((alert) => {
    if (activeTab === "all") return true;
    if (activeTab === "variable")
      return alert.alertType === AlertType.VARIABLES;
    if (activeTab === "rating") return alert.alertType === AlertType.RATING;
    return true;
  });

  // Add error handling
  if (error) {
    return (
      <div className="text-center py-8 border rounded-lg bg-[var(--color-bg-primary)]">
        <h3 className="mt-4 text-lg font-medium font-primary text-[var(--color-text-primary)]">
          Error loading alerts
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-primary">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }

  // Replace the empty alerts check with this new condition
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <AlertCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-[var(--color-bg-primary)]">
        <h3 className="mt-4 text-lg font-medium font-primary text-[var(--color-text-primary)]">
          No alerts yet
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-primary">
          Create your first alert to get notified when conditions match.
        </p>
        <Button onClick={handleNewAlert} className="mt-4 font-primary">
          Create Alert
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 border-b border-[var(--color-border-light)]">
        <div className="flex space-x-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3 px-2 sm:px-4 font-primary text-xs sm:text-sm ${
              activeTab === "all"
                ? "border-b-2 border-[var(--color-alert-tab-active)] text-[var(--color-alert-tab-active)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            All Alerts
            <span className="ml-1 sm:ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {alerts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("variable")}
            className={`py-3 px-2 sm:px-4 font-primary text-xs sm:text-sm ${
              activeTab === "variable"
                ? "border-b-2 border-[var(--color-alert-tab-active)] text-[var(--color-alert-tab-active)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Variable Alerts
            <span className="ml-1 sm:ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {
                alerts.filter((a: Alert) => a.alertType === AlertType.VARIABLES)
                  .length
              }
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rating")}
            className={`py-3 px-2 sm:px-4 font-primary text-xs sm:text-sm ${
              activeTab === "rating"
                ? "border-b-2 border-[var(--color-alert-tab-active)] text-[var(--color-alert-tab-active)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Star Rating Alerts
            <span className="ml-1 sm:ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {
                alerts.filter((a: Alert) => a.alertType === AlertType.RATING)
                  .length
              }
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
        {filteredAlerts?.map((alert) => (
          <Card
            key={alert.id}
            className={cn(
              "bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col",
              !alert.logEntry && "border-black-400 hover:border-black-500"
            )}
          >
            <CardHeader className="pb-2 relative">
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={alert.active}
                          onCheckedChange={(checked) => {
                            if (alert.id) {
                              handleToggleActive(alert.id, checked);
                            }
                          }}
                          aria-label={
                            alert.active ? "Deactivate alert" : "Activate alert"
                          }
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="font-primary text-sm">
                      {alert.active ? "Alert is active" : "Alert is inactive"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (alert?.id) {
                      router.push(`/alerts/${alert.id}/edit`);
                    }
                  }}
                  className="h-8 w-8 hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => alert.id && handleDelete(alert.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-base font-primary text-gray-900 flex items-center pr-24">
                {alert.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex-1">
              <div className="text-sm space-y-2 sm:space-y-3 font-primary h-full flex flex-col">
                <p className="text-gray-500">{alert.region?.name}</p>
                <p className="text-gray-500">
                  <span className="font-medium text-gray-900">🔔</span>{" "}
                  {formatNotificationMethod(alert.notificationMethod)}
                </p>

                {alert.alertType === AlertType.VARIABLES && (
                  <AlertProperties properties={alert.properties} />
                )}

                {alert.alertType === AlertType.RATING && (
                  <StarRating rating={alert.starRating} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Break out into components for better organization
function AlertProperties({ properties }: { properties: AlertProperty[] }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <p className="font-medium mb-2">Alert Triggers When:</p>
      <div className="flex flex-wrap gap-2">
        {properties.map((prop, index) => (
          <PropertyDisplay key={index} property={prop} />
        ))}
      </div>
    </div>
  );
}

function PropertyDisplay({ property }: { property: AlertProperty }) {
  const propName = property.property.toLowerCase();
  const isWind = propName.includes("wind");
  const isSwell = propName.includes("swell");
  const bgColor = isWind ? "bg-blue-50" : "bg-cyan-50";
  const textColor = isWind ? "text-blue-800" : "text-cyan-800";

  return (
    <div className={`flex items-center space-x-2 ${bgColor} p-2 rounded-md`}>
      {propName === "windspeed" && (
        <span className={textColor}>{getWindEmoji(property.optimalValue)}</span>
      )}
      {propName === "swellheight" && (
        <span className={textColor}>
          {getSwellEmoji(property.optimalValue)}
        </span>
      )}
      {propName === "winddirection" && <span className={textColor}>🧭</span>}
      {propName === "swellperiod" && <span className={textColor}>⏱️</span>}
      {propName === "swelldirection" && <span className={textColor}>🧭</span>}
      <div>
        <span className="text-gray-600 font-primary text-xs">
          {formatPropertyName(property.property)}
        </span>
        <p className={`font-medium ${textColor} font-primary text-sm`}>
          {propName.includes("direction")
            ? `${degreesToCardinal(property.optimalValue)} (${property.optimalValue}°)`
            : `${property.optimalValue} ${getUnit(property.property)}`}
        </p>
        <span className="text-xs text-gray-500">
          ±{property.range} {getUnit(property.property)}
        </span>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return null;

  if (rating === 5) {
    return (
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex-grow">
        <p className="text-main font-medium mb-2">Alert for:</p>
        <div className="flex items-center mt-1 bg-gray-50 p-3 rounded-md">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon
                key={i}
                className="h-5 w-5 fill-[var(--color-alert-icon-rating)] text-[var(--color-alert-icon-rating)]"
              />
            ))}
          </div>
          <span className="ml-3 font-primary font-medium">5 Stars</span>
          <span className="ml-1 font-primary">(Firey conditions)</span>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex-grow">
        <p className="text-main font-medium mb-2">Alert for:</p>
        <div className="flex items-center mt-1 bg-gray-50 p-3 rounded-md">
          <div className="flex">
            {[1, 2, 3, 4].map((i) => (
              <StarIcon
                key={i}
                className={`h-5 w-5 ${
                  i <= Number(rating || 0)
                    ? "fill-[var(--color-alert-icon-rating)] text-[var(--color-alert-icon-rating)]"
                    : "text-gray-300"
                }`}
              />
            ))}
            <StarIcon className="h-5 w-5 text-gray-300" />
          </div>
          <span className="ml-3 font-primary">{rating}+ Stars</span>
        </div>
      </div>
    );
  }
}

function formatPropertyName(property: string): string {
  switch (property) {
    case "windSpeed":
      return "Wind Speed";
    case "windDirection":
      return "Wind Direction";
    case "swellHeight":
      return "Swell Height";
    case "swellPeriod":
      return "Swell Period";
    case "swellDirection":
      return "Swell Direction";
    default:
      return property;
  }
}

function formatNotificationMethod(method: string): string {
  const methods: Record<string, string> = {
    email: "Email",
    whatsapp: "WhatsApp",
    app: "App Notification",
    both: "Email & WhatsApp",
  };
  return methods[method] || method;
}
