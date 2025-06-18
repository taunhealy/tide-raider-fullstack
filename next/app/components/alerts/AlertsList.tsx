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

import { Alert } from "@/app/types/alerts";
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

export function AlertsList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "variable" | "rating">(
    "all"
  );
  const queryClient = useQueryClient();

  // Fetch alerts from the API
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch(
        "/api/alerts?include=logEntry.forecast,logEntry.beach"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      return response.json();
    },
  });

  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Alert deleted");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error("Failed to delete alert", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Toggle alert active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      alertId,
      active,
    }: {
      alertId: string;
      active: boolean;
    }) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      });
      if (!response.ok) {
        throw new Error("Failed to update alert");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error("Failed to update alert", {
        description: error instanceof Error ? error.message : "Unknown error",
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

  function getUnit(property: string): string {
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

  // Filter alerts based on active tab
  const filteredAlerts = alerts.filter((alert: Alert) => {
    if (activeTab === "all") return true;
    if (activeTab === "variable") return alert.alertType !== "rating";
    if (activeTab === "rating") return alert.alertType === "rating";
    return true;
  });

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
              {alerts.filter((a: Alert) => a.alertType !== "rating").length}
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
              {alerts.filter((a: Alert) => a.alertType === "rating").length}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-[var(--color-bg-primary)] border-[var(--color-border-light)] col-span-full">
            <h3 className="mt-4 text-lg font-medium font-primary text-[var(--color-text-primary)]">
              No {activeTab !== "all" ? activeTab : ""} alerts found
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-primary">
              Create a new alert to get notified when conditions match.
            </p>
            <Button onClick={handleNewAlert} className="mt-4 font-primary">
              Create Alert
            </Button>
          </div>
        ) : (
          filteredAlerts.map((alert: Alert) => (
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
                              alert.active
                                ? "Deactivate alert"
                                : "Activate alert"
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="font-primary text-sm"
                      >
                        {alert.active ? "Alert is active" : "Alert is inactive"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (alert?.id) {
                        router.push(`/alerts/${alert.id}`);
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
                  <p className="text-gray-500">{alert.region}</p>
                  <p className="text-gray-500">
                    <span className="font-medium text-gray-900">🔔</span>{" "}
                    {formatItemType(alert.notificationMethod)}
                  </p>

                  {alert.alertType !== "rating" && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex-grow">
                      <div className="forecast-container">
                        <p className="text-main font-medium mb-2">
                          Alert Triggers When:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {alert.properties?.map(
                            (
                              prop: {
                                property: string;
                                optimalValue: number;
                                range: number;
                              },
                              index: number
                            ) => {
                              const propName = prop.property.toLowerCase();
                              const isWind = propName.includes("wind");
                              const isSwell = propName.includes("swell");
                              const bgColor = isWind
                                ? "bg-blue-50"
                                : "bg-cyan-50";
                              const textColor = isWind
                                ? "text-blue-800"
                                : "text-cyan-800";

                              return (
                                <div
                                  key={index}
                                  className={`flex items-center space-x-2 ${bgColor} p-2 rounded-md`}
                                >
                                  {propName === "windspeed" && (
                                    <span className={textColor}>
                                      {getWindEmoji(prop.optimalValue)}
                                    </span>
                                  )}
                                  {propName === "swellheight" && (
                                    <span className={textColor}>
                                      {getSwellEmoji(prop.optimalValue)}
                                    </span>
                                  )}
                                  {propName === "winddirection" && (
                                    <span className={textColor}>🧭</span>
                                  )}
                                  {propName === "swellperiod" && (
                                    <span className={textColor}>⏱️</span>
                                  )}
                                  {propName === "swelldirection" && (
                                    <span className={textColor}>🧭</span>
                                  )}
                                  <div>
                                    <span className="text-gray-600 font-primary text-xs">
                                      {formatPropertyName(prop.property)}
                                    </span>
                                    <p
                                      className={`font-medium ${textColor} font-primary text-sm`}
                                    >
                                      {propName.includes("direction")
                                        ? `${degreesToCardinal(prop.optimalValue)} (${prop.optimalValue}°)`
                                        : `${prop.optimalValue} ${getUnit(prop.property)}`}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                      ±{prop.range} {getUnit(prop.property)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {alert.alertType === "rating" && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex-grow">
                      <p className="text-main font-medium mb-2">Alert for:</p>
                      <div className="flex items-center mt-1 bg-gray-50 p-3 rounded-md">
                        {alert.starRating === "5" ? (
                          <>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <StarIcon
                                  key={i}
                                  className="h-5 w-5 fill-[var(--color-alert-icon-rating)] text-[var(--color-alert-icon-rating)]"
                                />
                              ))}
                            </div>
                            <span className="ml-3 font-primary font-medium">
                              5 Stars
                            </span>
                            <span className="ml-1 font-primary">
                              (Firey conditions)
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex">
                              {[1, 2, 3, 4].map((i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i <= Number(alert.starRating || 0)
                                      ? "fill-[var(--color-alert-icon-rating)] text-[var(--color-alert-icon-rating)]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <StarIcon className="h-5 w-5 text-gray-300" />
                            </div>
                            <span className="ml-3 font-primary">
                              {alert.starRating}+ Stars
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
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
